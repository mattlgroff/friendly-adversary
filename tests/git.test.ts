import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { inspectGit, resolveBaseRef, snapshotStillMatches, writeGitArtifacts } from "../src/git.js";

function git(repo: string, ...args: string[]): void {
  execFileSync("git", ["-C", repo, ...args], { stdio: "ignore" });
}

async function baselineFixture(branch = "main"): Promise<string> {
  const repo = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-base-"));
  git(repo, "init", "-b", branch);
  git(repo, "config", "user.email", "fixture@example.com");
  git(repo, "config", "user.name", "Fixture");
  git(repo, "commit", "--allow-empty", "-m", "base");
  return repo;
}

test("base selection honors an explicit valid ref and rejects an invalid ref", async () => {
  const repo = await baselineFixture();
  try {
    assert.equal(resolveBaseRef(repo, "HEAD"), "HEAD");
    assert.throws(() => resolveBaseRef(repo, "missing-ref"), /does not resolve to a commit/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("base selection prefers origin HEAD and follows the documented fallback order", async () => {
  const originHead = await baselineFixture();
  const originMain = await baselineFixture();
  const originMaster = await baselineFixture();
  const localMain = await baselineFixture();
  const localMaster = await baselineFixture("master");
  try {
    git(originHead, "update-ref", "refs/remotes/origin/develop", "HEAD");
    git(originHead, "symbolic-ref", "refs/remotes/origin/HEAD", "refs/remotes/origin/develop");
    assert.equal(resolveBaseRef(originHead), "origin/develop");

    git(originMain, "update-ref", "refs/remotes/origin/main", "HEAD");
    assert.equal(resolveBaseRef(originMain), "origin/main");

    git(originMaster, "update-ref", "refs/remotes/origin/master", "HEAD");
    assert.equal(resolveBaseRef(originMaster), "origin/master");

    assert.equal(resolveBaseRef(localMain), "main");
    assert.equal(resolveBaseRef(localMaster), "master");
  } finally {
    for (const repo of [originHead, originMain, originMaster, localMain, localMaster]) {
      await rm(repo, { recursive: true, force: true });
    }
  }
});

test("base selection fails when no application baseline exists", async () => {
  const repo = await baselineFixture("feature");
  try {
    assert.throws(() => resolveBaseRef(repo), /No review baseline was found/);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("Git inspection includes committed, staged, unstaged, and untracked changes", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-git-"));
  try {
    git(repo, "init", "-b", "main");
    git(repo, "config", "user.email", "fixture@example.com");
    git(repo, "config", "user.name", "Fixture");
    await writeFile(path.join(repo, "committed.ts"), "export const value = 1;\n");
    await writeFile(path.join(repo, "staged.ts"), "export const staged = 1;\n");
    await writeFile(path.join(repo, "unstaged.py"), "value = 1\n");
    git(repo, "add", "."); git(repo, "commit", "-m", "base"); git(repo, "switch", "-c", "feature");
    await writeFile(path.join(repo, "committed.ts"), "export const value = 2;\n");
    git(repo, "add", "committed.ts"); git(repo, "commit", "-m", "committed change");
    await writeFile(path.join(repo, "staged.ts"), "export const staged = 2;\n"); git(repo, "add", "staged.ts");
    await writeFile(path.join(repo, "unstaged.py"), "value = 2\n");
    await writeFile(path.join(repo, "untracked.py"), "new_value = 3\n");
    const context = await inspectGit(repo, "main");
    assert.deepEqual(context.changedFiles, ["committed.ts", "staged.ts", "unstaged.py", "untracked.py"]);
    assert.deepEqual(context.untrackedFiles, ["untracked.py"]);
    assert.ok(context.changedLines["committed.ts"]?.includes(1));
    assert.ok(context.diffHash.length === 64);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("Git snapshot excludes Friendly Adversary output and detects index-only state changes", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-snapshot-"));
  try {
    git(repo, "init", "-b", "main");
    git(repo, "config", "user.email", "fixture@example.com");
    git(repo, "config", "user.name", "Fixture");
    await writeFile(path.join(repo, "app.ts"), "export const value = 1;\n");
    git(repo, "add", ".");
    git(repo, "commit", "-m", "base");
    git(repo, "switch", "-c", "feature");
    await writeFile(path.join(repo, "app.ts"), "export const value = 2;\n");
    const unstaged = await inspectGit(repo, "main");
    await mkdir(path.join(repo, ".friendly-adversary", "runs", "fake"), { recursive: true });
    await writeFile(path.join(repo, ".friendly-adversary", "runs", "fake", "artifact.txt"), "artifact\n");
    const withOutput = await inspectGit(repo, "main");
    assert.equal(withOutput.diffHash, unstaged.diffHash);
    assert.deepEqual(withOutput.changedFiles, ["app.ts"]);
    git(repo, "add", "app.ts");
    const staged = await inspectGit(repo, "main");
    assert.notEqual(staged.diffHash, unstaged.diffHash);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("Git artifacts are written from the exact captured snapshot", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-pinned-artifacts-"));
  try {
    git(repo, "init", "-b", "main");
    git(repo, "config", "user.email", "fixture@example.com");
    git(repo, "config", "user.name", "Fixture");
    await writeFile(path.join(repo, "app.ts"), "export const value = 1;\n");
    git(repo, "add", ".");
    git(repo, "commit", "-m", "base");
    git(repo, "switch", "-c", "feature");
    await writeFile(path.join(repo, "app.ts"), "export const value = 2;\n");
    const context = await inspectGit(repo, "main");
    await writeFile(path.join(repo, "app.ts"), "export const value = 3;\n");
    const artifacts = path.join(repo, ".friendly-adversary", "captured");
    await writeGitArtifacts(context, artifacts);
    assert.match(await readFile(path.join(artifacts, "git", "diff.patch"), "utf8"), /value = 2/);
    assert.doesNotMatch(await readFile(path.join(artifacts, "git", "diff.patch"), "utf8"), /value = 3/);
    assert.equal(await snapshotStillMatches(context), false);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("Git inspection safely preserves adversarial filenames", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "friendly adversary names "));
  try {
    git(repo, "init", "-b", "main");
    git(repo, "config", "user.email", "fixture@example.com");
    git(repo, "config", "user.name", "Fixture");
    await writeFile(path.join(repo, "base.txt"), "base\n");
    git(repo, "add", ".");
    git(repo, "commit", "-m", "base");
    git(repo, "switch", "-c", "feature");
    const names = ["--fix.ts", "space name.py", "üñicode.py", "semi;colon.ts", "dollar$HOME.py"];
    for (const name of names) await writeFile(path.join(repo, name), "value = 1\n");
    const context = await inspectGit(repo, "main");
    assert.deepEqual(context.changedFiles, [...names].sort());
    for (const name of names) assert.deepEqual(context.changedLines[name], [1]);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});
