import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { link, open, readFile, stat, unlink, type FileHandle } from "node:fs/promises";
import path from "node:path";
import { FriendlyAdversaryError } from "./errors.js";

export type RunLockOperation =
  | "workflow-abort"
  | "workflow-complete"
  | "workflow-establish"
  | "workflow-publication"
  | "workflow-resume"
  | "workflow-seal";

export interface RunLock {
  file: FileHandle;
  path: string;
  device: string;
  inode: string;
  ownerNonce: string;
}

interface LockRecord {
  schemaVersion: "1";
  pid: number;
  processStartedAt: string;
  ownerNonce: string;
  operation: RunLockOperation;
  createdAt: string;
}

interface RecoveryClaim {
  file: FileHandle;
  path: string;
  device: string;
  inode: string;
}

interface RecoverRunLockHooks {
  afterValidation?: () => Promise<void>;
  unlinkLock?: (filePath: string) => Promise<void>;
  unlinkClaim?: (filePath: string) => Promise<void>;
}

const TRANSIENT_RELEASE_ERRORS = new Set(["EACCES", "EBUSY", "EPERM"]);

export type ProcessIdentity = "dead" | "exact-owner" | "pid-reused" | "unsupported-live-process";
type StartIdentityExecutor = (file: string, args: readonly string[], environment: NodeJS.ProcessEnv) => string;

const WINDOWS_START_TIME_COMMAND = "(Get-Process -Id $args[0] -ErrorAction Stop).StartTime.ToUniversalTime().ToString('O')";

async function fileIdentity(file: FileHandle): Promise<{ device: string; inode: string }> {
  const metadata = await file.stat({ bigint: true });
  return { device: metadata.dev.toString(), inode: metadata.ino.toString() };
}

async function pathIdentity(filePath: string): Promise<{ device: string; inode: string }> {
  const metadata = await stat(filePath, { bigint: true });
  return { device: metadata.dev.toString(), inode: metadata.ino.toString() };
}

function processIsAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

const executeStartIdentity: StartIdentityExecutor = (file, args, environment) => execFileSync(file, [...args], {
  encoding: "utf8",
  env: environment,
  shell: false,
  stdio: ["ignore", "pipe", "ignore"],
}).trim();

function stableStartIdentityEnvironment(environment: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  return {
    ...Object.fromEntries(Object.entries(environment).filter(([name]) => {
      const upperName = name.toUpperCase();
      return upperName !== "LANG" && upperName !== "LANGUAGE" && upperName !== "TZ" && !upperName.startsWith("LC_");
    })),
    LC_ALL: "C",
    TZ: "UTC",
  };
}

export function processStartIdentity(
  pid: number,
  platform = process.platform,
  execute: StartIdentityExecutor = executeStartIdentity,
  environment: NodeJS.ProcessEnv = process.env,
): string | undefined {
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

export function classifyProcessIdentity(
  alive: boolean,
  processStartedAt: string,
  currentIdentity: string | undefined,
): ProcessIdentity {
  if (!alive) return "dead";
  if (!currentIdentity || processStartedAt === "unavailable") return "unsupported-live-process";
  return processStartedAt === currentIdentity ? "exact-owner" : "pid-reused";
}

function processIdentity(pid: number, processStartedAt: string): ProcessIdentity {
  if (pid === process.pid) {
    return processStartedAt === PROCESS_START_IDENTITY ? "exact-owner" : "pid-reused";
  }
  return classifyProcessIdentity(processIsAlive(pid), processStartedAt, processStartIdentity(pid));
}

export function runLockPath(repositoryRoot: string, runReal: string): string {
  return path.join(
    repositoryRoot,
    ".friendly-adversary",
    ".internal",
    `lifecycle-${path.basename(runReal)}.lock`,
  );
}

function parseRecord(content: string): LockRecord | undefined {
  try {
    const record = JSON.parse(content) as Partial<LockRecord>;
    if (
      record.schemaVersion === "1" && Number.isSafeInteger(record.pid) && Number(record.pid) > 0
      && typeof record.processStartedAt === "string" && record.processStartedAt.length > 0
      && /^[0-9a-f-]{36}$/iu.test(record.ownerNonce ?? "")
      && [
        "workflow-abort", "workflow-complete", "workflow-establish", "workflow-publication", "workflow-resume", "workflow-seal",
      ].includes(String(record.operation))
      && typeof record.createdAt === "string"
    ) return record as LockRecord;
  } catch {
    return undefined;
  }
  return undefined;
}

async function acquireRecoveryClaim(claimPath: string): Promise<RecoveryClaim> {
  const file = await open(claimPath, "wx", 0o600).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "EEXIST") {
      throw new FriendlyAdversaryError(
        `FA_LOCK_RECOVERY_BUSY: recovery claim exists at ${claimPath}. Confirm no recovery process is active before removing only this claim.`,
        3,
      );
    }
    throw error;
  });
  const identity = await fileIdentity(file);
  try {
    await file.writeFile(`${JSON.stringify({ pid: process.pid, ownerNonce: randomUUID() })}\n`);
    await file.sync();
    return { file, path: claimPath, device: identity.device, inode: identity.inode };
  } catch (error) {
    await file.close().catch(() => undefined);
    const current = await pathIdentity(claimPath).catch(() => undefined);
    if (current?.device === identity.device && current.inode === identity.inode) await unlink(claimPath).catch(() => undefined);
    throw error;
  }
}

async function releaseRecoveryClaim(
  claim: RecoveryClaim,
  remove: (filePath: string) => Promise<void> = unlink,
): Promise<void> {
  let owned = false;
  try {
    const identity = await pathIdentity(claim.path);
    owned = identity.device === claim.device && identity.inode === claim.inode;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  } finally {
    await claim.file.close().catch(() => undefined);
  }
  if (owned) await remove(claim.path);
}

export async function acquireRunLock(
  repositoryRoot: string,
  runReal: string,
  operation: RunLockOperation,
): Promise<RunLock> {
  const lockPath = runLockPath(repositoryRoot, runReal);
  const ownerNonce = randomUUID();
  const candidatePath = path.join(path.dirname(lockPath), `.lifecycle-candidate-${ownerNonce}`);
  const record: LockRecord = {
    schemaVersion: "1",
    pid: process.pid,
    processStartedAt: PROCESS_START_IDENTITY,
    ownerNonce,
    operation,
    createdAt: new Date().toISOString(),
  };
  const file = await open(candidatePath, "wx", 0o600);
  let identity: { device: string; inode: string } | undefined;
  try {
    await file.writeFile(`${JSON.stringify(record)}\n`);
    await file.sync();
    identity = await fileIdentity(file);
    await link(candidatePath, lockPath);
  } catch (error) {
    await file.close().catch(() => undefined);
    await unlink(candidatePath).catch(() => undefined);
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    const record = await readFile(lockPath, "utf8").then(parseRecord).catch(() => undefined);
    const identity = record ? processIdentity(record.pid, record.processStartedAt) : undefined;
    if (record && identity === "exact-owner") {
      throw new FriendlyAdversaryError(`FA_RUN_BUSY: another ${record.operation} operation is active`, 3);
    }
    if (record && identity === "unsupported-live-process") {
      throw new FriendlyAdversaryError(
        `FA_PROCESS_IDENTITY_UNAVAILABLE: PID ${record.pid} is alive, but exact start-time identity is unavailable for an external process; recovery requires operator inspection`,
        3,
      );
    }
    throw new FriendlyAdversaryError("FA_STALE_LOCK: an abandoned run lock requires explicit CLI recovery", 3);
  }
  try {
    await unlink(candidatePath);
  } catch (error) {
    await file.close().catch(() => undefined);
    if (identity) {
      const current = await pathIdentity(lockPath).catch(() => undefined);
      if (current?.device === identity.device && current.inode === identity.inode) await unlink(lockPath).catch(() => undefined);
    }
    throw error;
  }
  return { file, path: lockPath, device: identity!.device, inode: identity!.inode, ownerNonce };
}

export async function releaseRunLock(
  lock: RunLock,
  options: { unlink?: (filePath: string) => Promise<void> } = {},
): Promise<void> {
  let closed = false;
  try {
    const [current, content] = await Promise.all([pathIdentity(lock.path), readFile(lock.path, "utf8")]);
    const record = parseRecord(content);
    if (
      current.device === lock.device && current.inode === lock.inode
      && record?.ownerNonce === lock.ownerNonce && record.pid === process.pid
    ) {
      await lock.file.close();
      closed = true;
      const remove = options.unlink ?? unlink;
      for (let attempt = 0; ; attempt += 1) {
        try {
          await remove(lock.path);
          break;
        } catch (error) {
          const code = (error as NodeJS.ErrnoException).code ?? "";
          if (code === "ENOENT") break;
          if (!TRANSIENT_RELEASE_ERRORS.has(code) || attempt >= 11) {
            throw new FriendlyAdversaryError(
              "FA_RUN_LOCK_RELEASE: lifecycle lock cleanup failed after the operation. Recover the run lock before retrying.",
              3,
            );
          }
          await new Promise((resolve) => setTimeout(resolve, Math.min(5 * (2 ** attempt), 100)));
        }
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  } finally {
    if (!closed) await lock.file.close().catch(() => undefined);
  }
}

export async function recoverRunLock(
  repositoryRoot: string,
  runReal: string,
  hooks: RecoverRunLockHooks = {},
): Promise<void> {
  const lockPath = runLockPath(repositoryRoot, runReal);
  const [initialIdentity, initialRecord] = await Promise.all([
    pathIdentity(lockPath).catch(() => undefined),
    readFile(lockPath, "utf8").then(parseRecord).catch(() => undefined),
  ]);
  if (!initialIdentity) throw new FriendlyAdversaryError("No run lock exists", 2);
  if (!initialRecord) throw new FriendlyAdversaryError("Run lock is malformed; recovery is ambiguous and fails closed", 3);
  const claim = await acquireRecoveryClaim(
    `${lockPath}.recovering-${initialRecord.ownerNonce}`,
  );
  let failure: unknown;
  try {
    const [currentIdentity, record] = await Promise.all([
      pathIdentity(lockPath).catch(() => undefined),
      readFile(lockPath, "utf8").then(parseRecord).catch(() => undefined),
    ]);
    if (!currentIdentity) throw new FriendlyAdversaryError("No run lock exists", 2);
    if (
      currentIdentity.device !== initialIdentity.device || currentIdentity.inode !== initialIdentity.inode
      || record?.ownerNonce !== initialRecord.ownerNonce
    ) {
      throw new FriendlyAdversaryError("Run lock changed during recovery; recovery fails closed", 3);
    }
    const identity = processIdentity(record.pid, record.processStartedAt);
    if (identity === "exact-owner") {
      throw new FriendlyAdversaryError(`Run lock owner PID ${record.pid} is alive; recovery is not permitted`, 3);
    }
    if (identity === "unsupported-live-process") {
      throw new FriendlyAdversaryError(
        `FA_PROCESS_IDENTITY_UNAVAILABLE: PID ${record.pid} is alive, but exact start-time identity is unavailable for an external process; recovery fails closed`,
        3,
      );
    }
    await hooks.afterValidation?.();
    const [finalIdentity, finalRecord] = await Promise.all([
      pathIdentity(lockPath),
      readFile(lockPath, "utf8").then(parseRecord),
    ]);
    if (
      finalIdentity.device !== initialIdentity.device || finalIdentity.inode !== initialIdentity.inode
      || finalRecord?.ownerNonce !== initialRecord.ownerNonce
    ) {
      throw new FriendlyAdversaryError("Run lock changed during recovery; recovery fails closed", 3);
    }
    await (hooks.unlinkLock ?? unlink)(lockPath);
  } catch (error) {
    failure = error;
  }
  try {
    await releaseRecoveryClaim(claim, hooks.unlinkClaim);
  } catch (cleanupError) {
    if (failure) throw new AggregateError([failure, cleanupError], "Lock recovery failed and its owned recovery claim could not be removed");
    throw cleanupError;
  }
  if (failure) throw failure;
}
