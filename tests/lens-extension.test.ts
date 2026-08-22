import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cp, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

async function sourceSnapshot(root: string): Promise<Map<string, Buffer>> {
  const result = new Map<string, Buffer>();
  async function visit(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(absolute);
      else if (entry.isFile()) result.set(path.relative(root, absolute), await readFile(absolute));
    }
  }
  await visit(path.join(root, "src"));
  return result;
}

test("a copied lens can be renamed, synchronized, and validated without application-code changes", async () => {
  const sourceRoot = path.resolve(".");
  const temporaryParent = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-lens-extension-"));
  const root = path.join(temporaryParent, "repository");
  try {
    await cp(sourceRoot, root, {
      recursive: true,
      filter: (candidate) => {
        const relative = path.relative(sourceRoot, candidate);
        return !relative.split(path.sep).some((part) => [".git", ".friendly-adversary", "node_modules"].includes(part));
      },
    });
    const before = await sourceSnapshot(root);
    const copiedLens = path.join(root, "lenses", "performance");
    await cp(path.join(root, "lenses", "correctness"), copiedLens, { recursive: true });
    const lensPath = path.join(copiedLens, "LENS.md");
    const lens = (await readFile(lensPath, "utf8"))
      .replace(/^id: correctness$/m, "id: performance")
      .replace(/^title: Correctness$/m, "title: Performance")
      .replace(/^# Correctness$/m, "# Performance");
    await writeFile(lensPath, lens);
    const staleReferences = [
      path.join(root, "platforms", "claude-code", "plugins", "friendly-adversary", "skills", "audit-codebase", "references", "retired.md"),
      path.join(root, "platforms", "codex", "plugins", "friendly-adversary", "skills", "design-new-codebase", "references", "retired.md"),
    ];
    for (const stale of staleReferences) await writeFile(stale, "retired generated reference\n");

    const sync = spawnSync(process.execPath, [path.join(root, "scripts", "sync-platform-assets.mjs")], {
      cwd: root,
      encoding: "utf8",
    });
    assert.equal(sync.status, 0, sync.stderr);
    const validate = spawnSync(process.execPath, [path.join(root, "dist", "src", "cli.js"), "validate", "--root", root], {
      cwd: root,
      encoding: "utf8",
    });
    assert.equal(validate.status, 0, validate.stderr);
    for (const stale of staleReferences) await assert.rejects(readFile(stale), /ENOENT/u);
    assert.match(validate.stdout, /Validated 10 lenses/);
    assert.match(await readFile(path.join(root, "platforms", "claude-code", "plugins", "friendly-adversary", "skills", "pr-review", "references", "lenses", "performance.md"), "utf8"), /^id: performance$/mu);
    await assert.rejects(readFile(path.join(root, "platforms", "claude-code", "plugins", "friendly-adversary", "agents", "performance.md")), /ENOENT/u);

    const after = await sourceSnapshot(root);
    assert.deepEqual([...after.keys()].sort(), [...before.keys()].sort());
    for (const [file, content] of before) assert.deepEqual(after.get(file), content, file);
  } finally {
    await rm(temporaryParent, { recursive: true, force: true });
  }
});
