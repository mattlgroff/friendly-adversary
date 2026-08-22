import assert from "node:assert/strict";
import { mkdtemp, open, readFile, readdir, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { renameWithWindowsRetry, replaceFileAtomic, writeFileAtomic } from "../src/fs-utils.js";

test("Windows atomic replacement retries injected sharing violations", async () => {
  let attempts = 0;
  const delays: number[] = [];
  await replaceFileAtomic("temporary", "destination", {
    platform: "win32",
    rename: async () => {
      attempts += 1;
      if (attempts < 3) throw Object.assign(new Error("injected sharing violation"), { code: "EBUSY" });
    },
    delay: async (milliseconds) => { delays.push(milliseconds); },
  });
  assert.equal(attempts, 3);
  assert.deepEqual(delays, [5, 10]);
});

test("Windows directory renames retry injected sharing violations", async () => {
  let attempts = 0;
  const delays: number[] = [];
  await renameWithWindowsRetry("isolated-output", "restored-output", {
    platform: "win32",
    rename: async () => {
      attempts += 1;
      if (attempts < 4) throw Object.assign(new Error("injected directory sharing violation"), { code: "EACCES" });
    },
    delay: async (milliseconds) => { delays.push(milliseconds); },
  });
  assert.equal(attempts, 4);
  assert.deepEqual(delays, [5, 10, 20]);
});

test("atomic replacement works repeatedly and concurrently in a path containing spaces", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly adversary atomic "));
  const target = path.join(root, "receipt.json");
  try {
    await writeFileAtomic(target, "initial\n");
    await writeFileAtomic(target, "replacement\n");
    assert.equal(await readFile(target, "utf8"), "replacement\n");
    const values = Array.from({ length: 16 }, (_, index) => `value-${index}\n`);
    await Promise.all(values.map((value) => writeFileAtomic(target, value)));
    assert.ok(values.includes(await readFile(target, "utf8")));
    assert.deepEqual(await readdir(root), ["receipt.json"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("atomic replacement retries while Windows holds the destination open", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-atomic-retry-"));
  const target = path.join(root, "receipt.json");
  try {
    await writeFileAtomic(target, "initial\n");
    const held = await open(target, "r");
    const started = Date.now();
    const release = setTimeout(() => void held.close(), 200);
    try {
      await writeFileAtomic(target, "replacement\n");
    } finally {
      clearTimeout(release);
      await held.close().catch(() => undefined);
    }
    if (process.platform === "win32") assert.ok(Date.now() - started >= 150);
    assert.equal(await readFile(target, "utf8"), "replacement\n");
    assert.deepEqual(await readdir(root), ["receipt.json"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
