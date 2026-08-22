import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import { access, mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { formatFailureDetail } from "../src/errors.js";
import { hasLiveReviewAuthority, revokeReviewAuthorityById } from "../src/authority.js";
import { runReview } from "../src/review.js";
import { processStartIdentity, runLockPath } from "../src/run-lock.js";
import { startDesign } from "../src/workflow.js";

function git(repo: string, ...args: string[]): void {
  execFileSync("git", ["-C", repo, ...args], { stdio: "ignore" });
}

test("explicit lens selection rejects identifiers absent from the installed bundle", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-cli-lens-"));
  try {
    git(repo, "init", "-b", "main");
    git(repo, "config", "user.email", "fixture@example.com");
    git(repo, "config", "user.name", "Fixture");
    await writeFile(path.join(repo, "app.py"), "value = 1\n");
    git(repo, "add", ".");
    git(repo, "commit", "-m", "base");
    await writeFile(path.join(repo, "app.py"), "value = 2\n");
    const result = spawnSync(process.execPath, [
      path.resolve("dist", "src", "cli.js"),
      "review",
      "--repo", repo,
      "--base", "HEAD",
      "--lenses", "corectness",
    ], { encoding: "utf8" });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /Unknown lens identifier: corectness/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("aggregate CLI failures preserve every exact recovery path", () => {
  const detail = formatFailureDetail(new AggregateError([
    new Error("restore the preserved output at C:\\recovery\\friendly-output-123"),
    new Error("retirement failed for /tmp/friendly-run-456"),
  ], "review cleanup failed"));
  assert.match(detail, /C:\\recovery\\friendly-output-123/u);
  assert.match(detail, /\/tmp\/friendly-run-456/u);
});

test("abort rejects a PR review packet without deleting it", async (t) => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-cli-pr-abort-"));
  t.after(() => rm(repo, { recursive: true, force: true }));
  git(repo, "init", "-b", "main");
  git(repo, "config", "user.email", "fixture@example.com");
  git(repo, "config", "user.name", "Fixture");
  await writeFile(path.join(repo, "app.py"), "value = 1\n");
  git(repo, "add", ".");
  git(repo, "commit", "-m", "base");
  git(repo, "switch", "-c", "feature");
  await writeFile(path.join(repo, "app.py"), "value = 2\n");
  const run = await runReview({
    repo: await realpath(repo),
    base: "main",
    timeoutMs: 20_000,
    expectedLenses: ["correctness"],
    host: "codex",
  });
  t.after(async () => {
    await revokeReviewAuthorityById(run.authority.authority_id);
    await Promise.all([
      rm(run.runDirectory, { recursive: true, force: true }),
      rm(`${run.runDirectory}.scratch`, { recursive: true, force: true }),
    ]);
  });

  const result = spawnSync(process.execPath, [
    path.resolve("dist", "src", "cli.js"),
    "abort",
    "--run", run.runDirectory,
  ], { encoding: "utf8" });

  assert.notEqual(result.status, 0);
  await access(run.runDirectory);
  assert.equal(await hasLiveReviewAuthority(run.runDirectory), true);
});

test("resume-design accepts an explicit decision revision request", () => {
  const result = spawnSync(process.execPath, [
    path.resolve("dist", "src", "cli.js"),
    "resume-design",
    "--run", path.join(os.tmpdir(), "friendly-adversary-missing-run"),
    "--revise", "architecture",
  ], { encoding: "utf8" });
  assert.equal(result.status, 2);
  assert.match(result.stderr, /FA_RUN_NOT_FOUND/u);
  assert.doesNotMatch(result.stderr, /Unknown option/u);
});

test("status summary omits large workflow evidence", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-cli-summary-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const started = await startDesign({ root, host: "codex" });
  const result = spawnSync(process.execPath, [
    path.resolve("dist", "src", "cli.js"),
    "status",
    "--run", started.receipt.outputDirectory,
    "--summary",
  ], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  const summary = JSON.parse(result.stdout) as Record<string, unknown>;
  assert.equal(summary.runId, started.receipt.runId);
  assert.equal(summary.status, "prepared");
  assert.equal(summary.kind, "design-new-codebase");
  assert.equal(summary.receiptGeneration, started.receipt.receiptGeneration);
  assert.equal("snapshot" in summary, false);
  assert.equal("toolRuns" in summary, false);
  assert.equal("publicationSlots" in summary, false);
});

test("recover-lock exposes explicit recovery for an abandoned workflow lock", async (t) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-cli-recover-lock-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const started = await startDesign({ root, host: "unavailable" });
  const lock = runLockPath(started.receipt.root, started.receipt.outputDirectory);
  await mkdir(path.dirname(lock), { recursive: true });
  await writeFile(lock, `${JSON.stringify({
    schemaVersion: "1",
    pid: 2_147_483_647,
    processStartedAt: new Date(0).toISOString(),
    ownerNonce: randomUUID(),
    operation: "workflow-resume",
    createdAt: new Date(0).toISOString(),
  })}\n`, { mode: 0o600 });

  const result = spawnSync(process.execPath, [
    path.resolve("dist", "src", "cli.js"),
    "recover-lock",
    "--run", started.receipt.outputDirectory,
  ], { encoding: "utf8" });

  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.trim(), started.receipt.outputDirectory);
  await assert.rejects(access(lock), /ENOENT/u);

  await writeFile(lock, `${JSON.stringify({
    schemaVersion: "1",
    pid: process.pid,
    processStartedAt: processStartIdentity(process.pid),
    ownerNonce: randomUUID(),
    operation: "workflow-resume",
    createdAt: new Date().toISOString(),
  })}\n`, { mode: 0o600 });
  const liveOwner = spawnSync(process.execPath, [
    path.resolve("dist", "src", "cli.js"),
    "recover-lock",
    "--run", started.receipt.outputDirectory,
  ], { encoding: "utf8" });
  assert.equal(liveOwner.status, 3);
  assert.match(liveOwner.stderr, /owner PID .* is alive/u);
  await access(lock);
});
