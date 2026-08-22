import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { access, mkdir, mkdtemp, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  acquireRunLock,
  classifyProcessIdentity,
  processStartIdentity,
  recoverRunLock,
  releaseRunLock,
  runLockPath,
} from "../src/run-lock.js";

async function staleLock(root: string, run: string, pid = 2_147_483_647): Promise<string> {
  const lockPath = runLockPath(root, run);
  await writeFile(lockPath, `${JSON.stringify({
    schemaVersion: "1",
    pid,
    processStartedAt: new Date(0).toISOString(),
    ownerNonce: randomUUID(),
    operation: "workflow-complete",
    createdAt: new Date(0).toISOString(),
  })}\n`, { mode: 0o600 });
  return lockPath;
}

test("Windows process identity uses PowerShell StartTime and detects PID reuse", () => {
  const observed = "2026-08-16T12:34:56.0000000Z";
  const identity = processStartIdentity(42, "win32", (file, args, environment) => {
    assert.equal(file, "powershell.exe");
    assert.deepEqual(args.slice(0, 5), ["-NoLogo", "-NoProfile", "-NonInteractive", "-Command", "(Get-Process -Id $args[0] -ErrorAction Stop).StartTime.ToUniversalTime().ToString('O')"]);
    assert.equal(args[5], "42");
    assert.deepEqual(environment, { KEEP: "yes", LC_ALL: "C", TZ: "UTC" });
    return observed;
  }, { KEEP: "yes", LANG: "fr_FR", LANGUAGE: "fr", lc_time: "de_DE", tz: "America/New_York" });
  assert.equal(classifyProcessIdentity(true, observed, identity), "exact-owner");
  assert.equal(classifyProcessIdentity(true, "2026-08-16T12:34:55.0000000Z", identity), "pid-reused");
  assert.equal(classifyProcessIdentity(true, observed, undefined), "unsupported-live-process");
  assert.equal(classifyProcessIdentity(true, "unavailable", identity), "unsupported-live-process");
  assert.equal(processStartIdentity(42, "win32", () => { throw new Error("PowerShell unavailable"); }), undefined);
});

test("POSIX process identity has a locale- and timezone-independent environment", () => {
  const environments: NodeJS.ProcessEnv[] = [];
  const execute = (_file: string, _args: readonly string[], environment: NodeJS.ProcessEnv) => {
    environments.push(environment);
    return "Sun Aug 16 12:34:56 2026";
  };
  const first = processStartIdentity(42, "darwin", execute, { PATH: "/bin", LANG: "en_US", LC_TIME: "en_US", TZ: "America/New_York" });
  const second = processStartIdentity(42, "linux", execute, { PATH: "/bin", LANGUAGE: "de", LC_ALL: "de_DE", TZ: "Europe/Berlin" });
  assert.equal(first, second);
  assert.deepEqual(environments, [
    { PATH: "/bin", LC_ALL: "C", TZ: "UTC" },
    { PATH: "/bin", LC_ALL: "C", TZ: "UTC" },
  ]);
});

test("lock release closes its handle and reports persistent cleanup failure", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-run-lock-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const run = path.join(root, ".friendly-adversary", "audit-codebase", "run-1");
  await mkdir(path.join(root, ".friendly-adversary", ".internal"), { recursive: true });
  await mkdir(run, { recursive: true });
  const lock = await acquireRunLock(root, run, "workflow-complete");
  await assert.rejects(() => releaseRunLock(lock, {
    unlink: async () => {
      await assert.rejects(() => lock.file.stat(), /closed/u);
      throw Object.assign(new Error("injected cleanup failure"), { code: "EIO" });
    },
  }), /FA_RUN_LOCK_RELEASE/u);
  await assert.rejects(() => lock.file.stat(), /closed/u);
});

test("explicit recovery serializes deletion and never removes a replacement lock", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-run-lock-recovery-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const run = path.join(root, ".friendly-adversary", "audits", "run-1");
  await mkdir(path.join(root, ".friendly-adversary", ".internal"), { recursive: true });
  await mkdir(run, { recursive: true });
  const lockPath = await staleLock(root, run);
  let release!: () => void;
  const held = new Promise<void>((resolve) => { release = resolve; });
  let validated!: () => void;
  const ready = new Promise<void>((resolve) => { validated = resolve; });
  const first = recoverRunLock(root, run, {
    afterValidation: async () => {
      validated();
      await held;
    },
  });
  await ready;
  await assert.rejects(() => recoverRunLock(root, run), /FA_LOCK_RECOVERY_BUSY/u);
  release();
  await first;
  const replacement = await acquireRunLock(root, run, "workflow-complete");
  await access(lockPath);
  await releaseRunLock(replacement);
});

test("an exact live owner cannot be reclaimed", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-run-lock-live-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const run = path.join(root, ".friendly-adversary", "audits", "run-1");
  await mkdir(path.join(root, ".friendly-adversary", ".internal"), { recursive: true });
  await mkdir(run, { recursive: true });
  const lock = await acquireRunLock(root, run, "workflow-complete");
  const lockPath = lock.path;
  const before = await Promise.all([readFile(lockPath), stat(lockPath, { bigint: true })]);
  await assert.rejects(() => acquireRunLock(root, run, "workflow-seal"), /FA_RUN_BUSY/u);
  await assert.rejects(() => recoverRunLock(root, run), /owner PID .* is alive/u);
  const after = await Promise.all([readFile(lockPath), stat(lockPath, { bigint: true })]);
  assert.deepEqual(after[0], before[0]);
  assert.equal(after[1].dev, before[1].dev);
  assert.equal(after[1].ino, before[1].ino);
  await releaseRunLock(lock);
});

test("explicit recovery detects reuse of the current PID from processStartedAt", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-run-lock-pid-reuse-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const run = path.join(root, ".friendly-adversary", "audits", "run-1");
  await mkdir(path.join(root, ".friendly-adversary", ".internal"), { recursive: true });
  await mkdir(run, { recursive: true });
  const lockPath = await staleLock(root, run, process.pid);
  await recoverRunLock(root, run);
  await assert.rejects(access(lockPath), /ENOENT/u);
});

test("recovery claim cleanup failure never touches a later lock", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-run-lock-claim-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const run = path.join(root, ".friendly-adversary", "audits", "run-1");
  await mkdir(path.join(root, ".friendly-adversary", ".internal"), { recursive: true });
  await mkdir(run, { recursive: true });
  const lockPath = await staleLock(root, run);
  await assert.rejects(() => recoverRunLock(root, run, {
    unlinkClaim: async () => { throw new Error("injected claim cleanup failure"); },
  }), /injected claim cleanup failure/u);
  await assert.rejects(access(lockPath), /ENOENT/u);
  const orphan = (await readdir(path.dirname(lockPath))).find((name) => name.startsWith(`${path.basename(lockPath)}.recovering-`));
  assert.ok(orphan);
  await staleLock(root, run);
  await recoverRunLock(root, run);
  await assert.rejects(access(lockPath), /ENOENT/u);
  await access(path.join(path.dirname(lockPath), orphan));
});

test("an orphan claim blocks only its exact stale generation and reports its cleanup path", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-run-lock-orphan-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const run = path.join(root, ".friendly-adversary", "audits", "run-1");
  await mkdir(path.join(root, ".friendly-adversary", ".internal"), { recursive: true });
  await mkdir(run, { recursive: true });
  const lockPath = await staleLock(root, run);
  const record = JSON.parse(await readFile(lockPath, "utf8")) as { ownerNonce: string };
  const claimPath = `${lockPath}.recovering-${record.ownerNonce}`;
  await writeFile(claimPath, "orphaned recovery\n", { flag: "wx", mode: 0o600 });
  await assert.rejects(
    () => recoverRunLock(root, run),
    (error: unknown) => {
      assert.match(String(error), /FA_LOCK_RECOVERY_BUSY/u);
      assert.ok(String(error).includes(claimPath));
      return true;
    },
  );
  await access(lockPath);
  await access(claimPath);
});

test("canonical unlink failure releases the recovery claim for a safe retry", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-run-lock-unlink-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const run = path.join(root, ".friendly-adversary", "audits", "run-1");
  await mkdir(path.join(root, ".friendly-adversary", ".internal"), { recursive: true });
  await mkdir(run, { recursive: true });
  const lockPath = await staleLock(root, run);
  await assert.rejects(() => recoverRunLock(root, run, {
    unlinkLock: async () => { throw new Error("injected canonical unlink failure"); },
  }), /injected canonical unlink failure/u);
  await access(lockPath);
  await recoverRunLock(root, run);
  await assert.rejects(access(lockPath), /ENOENT/u);
});
