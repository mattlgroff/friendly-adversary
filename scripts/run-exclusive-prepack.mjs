#!/usr/bin/env node

import { execFileSync, spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { hostname } from "node:os";
import { lstat, mkdir, open, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { acquireOutputGuard, releaseOutputGuard } from "./corresponding-source-publication.mjs";

const INITIALIZATION_GRACE_MS = 30_000;
const WINDOWS_START_TIME_COMMAND = "(Get-Process -Id $args[0] -ErrorAction Stop).StartTime.ToUniversalTime().ToString('O')";

function processIsAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
  }
}

const executeStartIdentity = (file, args, environment) => execFileSync(file, args, {
  encoding: "utf8",
  env: environment,
  shell: false,
  stdio: ["ignore", "pipe", "ignore"],
}).trim();

function stableStartIdentityEnvironment(environment) {
  return {
    ...Object.fromEntries(Object.entries(environment).filter(([name]) => {
      const upperName = name.toUpperCase();
      return upperName !== "LANG" && upperName !== "LANGUAGE" && upperName !== "TZ" && !upperName.startsWith("LC_");
    })),
    LC_ALL: "C",
    TZ: "UTC",
  };
}

export function processStartIdentity(pid, platform = process.platform, execute = executeStartIdentity, environment = process.env) {
  // Exact start identity uses built-in PowerShell on Windows and /bin/ps on
  // other supported hosts. A host without its OS query is unsupported and
  // callers fail closed for every live PID.
  try {
    const stableEnvironment = stableStartIdentityEnvironment(environment);
    const value = platform === "win32"
      ? execute("powershell.exe", ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", WINDOWS_START_TIME_COMMAND, String(pid)], stableEnvironment)
      : execute("/bin/ps", ["-o", "lstart=", "-p", String(pid)], stableEnvironment);
    return value || undefined;
  } catch {
    return undefined;
  }
}

const PROCESS_START_IDENTITY = processStartIdentity(process.pid) ?? "unavailable";

export function classifyProcessIdentity(alive, processStartedAt, currentIdentity) {
  if (!alive) return "dead";
  if (!currentIdentity || processStartedAt === "unavailable") return "unsupported-live-process";
  return processStartedAt === currentIdentity ? "exact-owner" : "pid-reused";
}

function processIdentity(owner) {
  return classifyProcessIdentity(processIsAlive(owner.pid), owner.processStartedAt, processStartIdentity(owner.pid));
}

function lockPathFor(root) {
  return path.join(path.dirname(root), `.${path.basename(root)}.friendly-adversary-prepack.lock`);
}

async function existingOwner(lockPath) {
  const metadata = await lstat(lockPath);
  const identity = await lstat(lockPath, { bigint: true });
  if (!metadata.isDirectory() || metadata.isSymbolicLink()) {
    throw new Error(`Prepack lock is not a regular directory: ${lockPath}`);
  }
  let record;
  try {
    record = JSON.parse(await readFile(path.join(lockPath, "owner.json"), "utf8"));
  } catch (error) {
    if (Date.now() - metadata.mtimeMs < INITIALIZATION_GRACE_MS) {
      throw new Error(`Another prepack is initializing for this checkout: ${lockPath}`);
    }
    throw new Error(`Prepack lock metadata is unreadable and requires manual inspection: ${lockPath}`, { cause: error });
  }
  if (
    record.schemaVersion !== "1"
    || record.host !== hostname()
    || !Number.isSafeInteger(record.pid)
    || record.pid <= 0
    || typeof record.processStartedAt !== "string"
    || record.processStartedAt.length === 0
    || typeof record.ownerNonce !== "string"
    || !/^[0-9a-f-]{36}$/iu.test(record.ownerNonce)
    || typeof record.createdAt !== "string"
    || !Number.isFinite(Date.parse(record.createdAt))
  ) {
    throw new Error(`Prepack lock metadata is invalid and requires manual inspection: ${lockPath}`);
  }
  return {
    ...record,
    modifiedAt: metadata.mtimeMs,
    device: identity.dev.toString(),
    inode: identity.ino.toString(),
  };
}

async function withPrepackStateGuard(lockPath, action) {
  const guardPath = `${lockPath}.state.guard`;
  const token = randomUUID();
  await acquireOutputGuard(guardPath, process.pid, token);
  let result;
  let operationError;
  try {
    result = await action();
  } catch (error) {
    operationError = error;
  }
  let releaseError;
  try {
    await releaseOutputGuard(guardPath, process.pid, token);
  } catch (error) {
    releaseError = error;
  }
  if (operationError && releaseError) {
    throw new AggregateError([operationError, releaseError], "Prepack state operation and guard cleanup both failed");
  }
  if (operationError) throw operationError;
  if (releaseError) throw releaseError;
  return result;
}

function sameOwnerIdentity(left, right) {
  return left.ownerNonce === right.ownerNonce
    && left.device === right.device
    && left.inode === right.inode;
}

async function retireExactLock(lockPath, owner, phase) {
  const quarantine = `${lockPath}.${phase}-${owner.ownerNonce}-${randomUUID()}`;
  await rename(lockPath, quarantine);
  const moved = await existingOwner(quarantine);
  if (!sameOwnerIdentity(owner, moved)) {
    throw new Error(`Prepack lock changed during ${phase}: ${lockPath}`);
  }
  await rm(quarantine, { recursive: true, force: false });
}

async function createPrepackLock(lockPath, ownerNonce) {
  await mkdir(lockPath, { mode: 0o700 });
  try {
    const handle = await open(path.join(lockPath, "owner.json"), "wx", 0o600);
    try {
      await handle.writeFile(`${JSON.stringify({
        schemaVersion: "1",
        host: hostname(),
        pid: process.pid,
        processStartedAt: PROCESS_START_IDENTITY,
        ownerNonce,
        createdAt: new Date().toISOString(),
      })}\n`);
      await handle.sync();
    } finally {
      await handle.close();
    }
  } catch (error) {
    await rm(lockPath, { recursive: true, force: true });
    throw error;
  }
}

export async function acquirePrepackLock(rootInput) {
  const root = path.resolve(rootInput);
  const lockPath = lockPathFor(root);
  const ownerNonce = randomUUID();
  await withPrepackStateGuard(lockPath, async () => {
    try {
      const owner = await existingOwner(lockPath);
      const identity = processIdentity(owner);
      if (identity === "exact-owner") {
        throw new Error(`Another prepack owns this checkout (PID ${owner.pid}): ${lockPath}`);
      }
      if (identity === "unsupported-live-process") {
        throw new Error(`Prepack owner PID ${owner.pid} is alive, but exact start-time identity is unavailable for an external process; inspect manually: ${lockPath}`);
      }
      await retireExactLock(lockPath, owner, "dead");
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    await createPrepackLock(lockPath, ownerNonce);
  });
  return { root, path: lockPath, ownerNonce };
}

export async function releasePrepackLock(lock) {
  await withPrepackStateGuard(lock.path, async () => {
    const owner = await existingOwner(lock.path);
    if (owner.pid !== process.pid || owner.processStartedAt !== PROCESS_START_IDENTITY || owner.ownerNonce !== lock.ownerNonce) {
      throw new Error(`Prepack lock ownership changed before release: ${lock.path}`);
    }
    await retireExactLock(lock.path, owner, "retired");
  });
}

async function main() {
  const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
  const npmCli = process.env.npm_execpath;
  if (!npmCli || !path.isAbsolute(npmCli)) {
    throw new Error("prepack requires npm_execpath from an npm lifecycle invocation");
  }
  const lock = await acquirePrepackLock(root);
  let child;
  try {
    child = spawn(process.execPath, [npmCli, "run", "prepack:exclusive"], {
      cwd: root,
      env: process.env,
      stdio: "inherit",
    });
    const result = await new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("exit", (code, signal) => resolve({ code, signal }));
    });
    if (result.signal) throw new Error(`exclusive prepack child exited from signal ${result.signal}`);
    if (result.code !== 0) process.exitCode = result.code ?? 1;
  } finally {
    await releasePrepackLock(lock);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
