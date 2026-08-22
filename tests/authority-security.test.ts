import assert from "node:assert/strict";
import { access, chmod, link, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { authorityRoot, ensureAuthorityRoot, publishAuthorityControlFile, readAuthorityControlFile } from "../src/authority.js";

async function withAuthorityState<T>(state: string, callback: () => Promise<T>): Promise<T> {
  const previous = process.env.FRIENDLY_ADVERSARY_STATE_DIR;
  process.env.FRIENDLY_ADVERSARY_STATE_DIR = state;
  try {
    return await callback();
  } finally {
    if (previous === undefined) delete process.env.FRIENDLY_ADVERSARY_STATE_DIR;
    else process.env.FRIENDLY_ADVERSARY_STATE_DIR = previous;
  }
}

test("authority state creation never follows a precreated symlink or junction", async (context) => {
  const container = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-authority-parent-"));
  const outside = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-authority-outside-"));
  context.after(() => rm(container, { recursive: true, force: true }));
  context.after(() => rm(outside, { recursive: true, force: true }));
  const state = path.join(container, "state");
  await symlink(outside, state, process.platform === "win32" ? "junction" : "dir");

  await withAuthorityState(state, async () => {
    await assert.rejects(ensureAuthorityRoot(), /FA_AUTHORITY_ROOT_UNSAFE/u);
  });
  assert.deepEqual(await readdir(outside), [], "the redirected target must remain untouched");
});

test("authority state rejects a shared POSIX directory", { skip: process.platform === "win32" }, async (context) => {
  const container = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-authority-mode-"));
  context.after(() => rm(container, { recursive: true, force: true }));
  const state = path.join(container, "state");
  await mkdir(state, { mode: 0o755 });
  await chmod(state, 0o755);

  await withAuthorityState(state, async () => {
    await assert.rejects(ensureAuthorityRoot(), /FA_AUTHORITY_ROOT_UNSAFE/u);
  });
});

test("authority control reads reject a redirected authority file", async (context) => {
  const container = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-authority-file-"));
  context.after(() => rm(container, { recursive: true, force: true }));
  const state = path.join(container, "state");
  const outside = path.join(container, "outside.json");
  await writeFile(outside, "do not follow\n");

  await withAuthorityState(state, async () => {
    const root = await ensureAuthorityRoot();
    const redirected = path.join(root, "0123456789abcdef0123456789abcdef.json");
    await symlink(outside, redirected, process.platform === "win32" ? "file" : "file");
    await assert.rejects(readAuthorityControlFile(redirected), /FA_AUTHORITY_UNSAFE/u);
  });
  assert.equal(await readFile(outside, "utf8"), "do not follow\n");
});

test("authority publication never exposes an empty final record", async (context) => {
  const container = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-authority-atomic-"));
  context.after(() => rm(container, { recursive: true, force: true }));
  const state = path.join(container, "state");
  await withAuthorityState(state, async () => {
    const root = await ensureAuthorityRoot();
    const target = path.join(root, "0123456789abcdef0123456789abcdef.workflow.json");
    let candidateReady!: () => void;
    let releasePublication!: () => void;
    const ready = new Promise<void>((resolve) => { candidateReady = resolve; });
    const release = new Promise<void>((resolve) => { releasePublication = resolve; });
    const publishing = publishAuthorityControlFile(target, "complete authority\n", {
      beforePublish: async () => {
        candidateReady();
        await release;
      },
    });
    await ready;
    await assert.rejects(access(target), { code: "ENOENT" });
    assert.equal((await readdir(root)).some((entry) => entry.endsWith(".workflow.json")), false);
    releasePublication();
    await publishing;
    assert.equal(await readFile(target, "utf8"), "complete authority\n");
  });
});

test("authority root validation never reclaims an ambiguous committed candidate", async (context) => {
  const container = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-authority-ambiguous-"));
  context.after(() => rm(container, { recursive: true, force: true }));
  const state = path.join(container, "state");
  await withAuthorityState(state, async () => {
    const root = await ensureAuthorityRoot();
    const target = path.join(root, "0123456789abcdef0123456789abcdef.workflow.json");
    const candidate = `${target}.candidate-${"a".repeat(32)}`;
    await writeFile(candidate, "complete authority\n", { flag: "wx", mode: 0o600 });
    await link(candidate, target);
    await ensureAuthorityRoot();
    assert.equal(await readFile(candidate, "utf8"), "complete authority\n");
    assert.equal(await readFile(target, "utf8"), "complete authority\n");
    await assert.rejects(readAuthorityControlFile(target), /FA_AUTHORITY_UNSAFE/u);
  });
});
