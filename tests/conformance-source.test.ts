import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

test("pinned source materialization ignores hidden working-tree changes", async () => {
  const sourceRoot = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-pinned-source-"));
  let cleanupMaterialized = async () => {};
  try {
    await execFileAsync("git", ["init"], { cwd: sourceRoot });
    await execFileAsync("git", ["config", "user.name", "Friendly Adversary Test"], { cwd: sourceRoot });
    await execFileAsync("git", ["config", "user.email", "test@friendly-adversary.invalid"], { cwd: sourceRoot });
    await writeFile(path.join(sourceRoot, ".gitignore"), "injected.txt\n", "utf8");
    await writeFile(path.join(sourceRoot, "tracked.txt"), "committed\n", "utf8");
    await execFileAsync("git", ["add", ".gitignore", "tracked.txt"], { cwd: sourceRoot });
    await execFileAsync("git", ["commit", "-m", "fixture"], { cwd: sourceRoot });
    const { stdout } = await execFileAsync("git", ["rev-parse", "HEAD"], { cwd: sourceRoot });
    const commit = stdout.trim();

    await execFileAsync("git", ["update-index", "--assume-unchanged", "tracked.txt"], { cwd: sourceRoot });
    await writeFile(path.join(sourceRoot, "tracked.txt"), "hidden mutation\n", "utf8");
    await writeFile(path.join(sourceRoot, "injected.txt"), "ignored injection\n", "utf8");

    const helperUrl = pathToFileURL(path.resolve("scripts/materialize-pinned-git-tree.mjs")).href;
    const helper = await import(helperUrl) as {
      materializePinnedGitTree(source: string, expected: string, label: string): Promise<{
        root: string;
        cleanup(): Promise<void>;
      }>;
    };
    const materialized = await helper.materializePinnedGitTree(sourceRoot, commit, "Fixture");
    cleanupMaterialized = materialized.cleanup;
    assert.equal(await readFile(path.join(materialized.root, "tracked.txt"), "utf8"), "committed\n");
    await assert.rejects(readFile(path.join(materialized.root, "injected.txt"), "utf8"), { code: "ENOENT" });
  } finally {
    await cleanupMaterialized();
    await rm(sourceRoot, { recursive: true, force: true });
  }
});

test("ripgrep conformance authenticates source before executing Cargo", async () => {
  const outputRoot = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-ripgrep-source-"));
  try {
    await assert.rejects(
      execFileAsync(process.execPath, [
        path.resolve("scripts/run-ripgrep-native-doc-conformance.mjs"),
        "--source", path.resolve("."),
        "--output", path.join(outputRoot, "results.json"),
      ], { env: { ...process.env, GIT_DIR: path.join(outputRoot, "redirected.git"), GIT_WORK_TREE: outputRoot } }),
      /Ripgrep source is at .* expected e89fff89ac9af12e8d4ce9d5fd07beb408ca730f/u,
    );
  } finally {
    await rm(outputRoot, { recursive: true, force: true });
  }
});

test("anti-slop import authenticates source before evaluating tests", async () => {
  await assert.rejects(
    execFileAsync(process.execPath, [path.resolve("scripts/import-anti-slop-conformance.mjs"), path.resolve(".")], {
      env: { ...process.env, GIT_DIR: path.join(os.tmpdir(), "redirected-anti-slop.git"), GIT_WORK_TREE: os.tmpdir() },
    }),
    /Anti-slop source is at .* expected 9b80d9a5c317d3af94d88a577bdbde4d9a45f7be/u,
  );
});
