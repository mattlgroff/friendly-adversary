import assert from "node:assert/strict";
import { closeSync, openSync } from "node:fs";
import { mkdir, mkdtemp, readFile, realpath, rename, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { WASI } from "node:wasi";
import { verifiedRipgrepWasm } from "../src/ripgrep-wasm.js";
import {
  withWindowsDirectoryReads,
  type WasiPreview1Function,
  type WasiPreview1Imports,
} from "../src/wasi-preview1-windows.js";

interface DecodedEntry {
  cookie: bigint;
  name: string;
  type: number;
}

function decodeEntries(memory: WebAssembly.Memory, pointer: number, used: number): DecodedEntry[] {
  const output: DecodedEntry[] = [];
  let offset = pointer;
  const end = pointer + used;
  while (offset + 24 <= end) {
    const header = new DataView(memory.buffer, offset, 24);
    const nameLength = header.getUint32(16, true);
    const nameStart = offset + 24;
    if (nameStart + nameLength > end) break;
    output.push({
      cookie: header.getBigUint64(0, true),
      name: Buffer.from(memory.buffer, nameStart, nameLength).toString("utf8"),
      type: header.getUint8(20),
    });
    offset = nameStart + nameLength;
  }
  return output;
}

test("Windows WASI directory compatibility enumerates and tracks confined descriptors", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-windows-wasi-"));
  const repository = path.join(root, "repo");
  const outside = path.join(root, "outside");
  const memory = new WebAssembly.Memory({ initial: 2 });
  const descriptorPointer = 120_000;
  const pathPointer = 100_000;
  let nextDescriptor = 4;
  const native: WasiPreview1Imports = {
    path_open: (...args): number => {
      const resultPointer = Number(args[8]);
      new DataView(memory.buffer).setUint32(resultPointer, nextDescriptor, true);
      nextDescriptor += 1;
      return 0;
    },
    fd_close: (): number => 0,
    fd_readdir: (): number => 52,
  };

  try {
    await mkdir(path.join(repository, "nested"), { recursive: true });
    await mkdir(outside, { recursive: true });
    await writeFile(path.join(repository, "alpha.txt"), "alpha\n");
    await writeFile(path.join(repository, "café.txt"), "café\n");
    await writeFile(path.join(repository, "nested", "child.ts"), "export {};\n");
    const imports = withWindowsDirectoryReads(native, await realpath(repository), () => memory);
    const readdir = imports.fd_readdir as WasiPreview1Function;

    const usedPointer = 110_000;
    assert.equal(readdir(3, 0, 8192, 0n, usedPointer), 0);
    const used = new DataView(memory.buffer).getUint32(usedPointer, true);
    const rootEntries = decodeEntries(memory, 0, used).sort((left, right) => left.name.localeCompare(right.name));
    assert.deepEqual(rootEntries.map((entry) => entry.name), ["alpha.txt", "café.txt", "nested"]);
    assert.equal(rootEntries.find((entry) => entry.name === "nested")?.type, 3);
    assert.equal(rootEntries.find((entry) => entry.name === "alpha.txt")?.type, 4);

    const nestedBytes = Buffer.from("nested", "utf8");
    new Uint8Array(memory.buffer, pathPointer, nestedBytes.length).set(nestedBytes);
    assert.equal(imports.path_open?.(3, 0, pathPointer, nestedBytes.length, 0, 1n << 14n, 0n, 0, descriptorPointer), 0);
    const nestedFd = new DataView(memory.buffer).getUint32(descriptorPointer, true);
    assert.equal(readdir(nestedFd, 20_000, 8192, 0n, usedPointer), 0);
    const nestedUsed = new DataView(memory.buffer).getUint32(usedPointer, true);
    assert.deepEqual(decodeEntries(memory, 20_000, nestedUsed).map((entry) => entry.name), ["child.ts"]);

    assert.equal(imports.fd_close?.(nestedFd), 0);
    assert.equal(readdir(nestedFd, 20_000, 8192, 0n, usedPointer), 8);

    new Uint8Array(memory.buffer, pathPointer, nestedBytes.length).set(nestedBytes);
    assert.equal(imports.path_open?.(3, 0, pathPointer, nestedBytes.length, 0, 0n, 0n, 0, descriptorPointer), 0);
    const noRightsFd = new DataView(memory.buffer).getUint32(descriptorPointer, true);
    assert.equal(readdir(noRightsFd, 20_000, 8192, 0n, usedPointer), 76);
    assert.equal(imports.fd_close?.(noRightsFd), 0);

    new Uint8Array(memory.buffer, pathPointer, nestedBytes.length).set(nestedBytes);
    assert.equal(imports.path_open?.(3, 0, pathPointer, nestedBytes.length, 0, 1n << 14n, 0n, 0, descriptorPointer), 0);
    const replacedFd = new DataView(memory.buffer).getUint32(descriptorPointer, true);
    await rename(path.join(repository, "nested"), path.join(repository, "original-nested"));
    await mkdir(path.join(repository, "nested"));
    assert.equal(readdir(replacedFd, 20_000, 8192, 0n, usedPointer), 76);
    assert.equal(imports.fd_close?.(replacedFd), 0);

    const outsideBytes = Buffer.from("../outside", "utf8");
    new Uint8Array(memory.buffer, pathPointer, outsideBytes.length).set(outsideBytes);
    assert.equal(imports.path_open?.(3, 0, pathPointer, outsideBytes.length, 0, 1n << 14n, 0n, 0, descriptorPointer), 0);
    const outsideFd = new DataView(memory.buffer).getUint32(descriptorPointer, true);
    assert.equal(readdir(outsideFd, 20_000, 8192, 0n, usedPointer), 8);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Windows WASI directory compatibility honors cookies, rights, and buffer bounds", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-windows-wasi-pages-"));
  const memory = new WebAssembly.Memory({ initial: 1 });
  const usedPointer = 60_000;
  const native: WasiPreview1Imports = {
    path_open: (): number => 0,
    fd_close: (): number => 0,
    fd_readdir: (): number => 52,
  };

  try {
    await writeFile(path.join(root, "first.txt"), "first\n");
    await writeFile(path.join(root, "second.txt"), "second\n");
    const imports = withWindowsDirectoryReads(native, await realpath(root), () => memory);
    const readdir = imports.fd_readdir as WasiPreview1Function;

    assert.equal(readdir(3, 0, 34, 0n, usedPointer), 0);
    const firstUsed = new DataView(memory.buffer).getUint32(usedPointer, true);
    const firstPage = decodeEntries(memory, 0, firstUsed);
    assert.equal(firstPage.length, 1);
    assert.equal(readdir(3, 128, 4096, firstPage[0]?.cookie ?? 0n, usedPointer), 0);
    const secondUsed = new DataView(memory.buffer).getUint32(usedPointer, true);
    const secondPage = decodeEntries(memory, 128, secondUsed);
    assert.equal(secondPage.length, 1);
    assert.notEqual(firstPage[0]?.name, secondPage[0]?.name);

    assert.equal(readdir(999, 0, 16, 0n, usedPointer), 8);
    assert.equal(readdir(3, memory.buffer.byteLength - 2, 8, 0n, usedPointer), 21);
    assert.equal(readdir(3, 0, 8, BigInt(Number.MAX_SAFE_INTEGER) + 1n, usedPointer), 61);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Windows WASI directory compatibility drives the real ripgrep file index", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-windows-wasi-ripgrep-"));
  const repository = path.join(root, "repo");
  const stdoutPath = path.join(root, "stdout.txt");
  const stderrPath = path.join(root, "stderr.txt");
  let stdout = -1;
  let stderr = -1;

  try {
    await mkdir(path.join(repository, "nested"), { recursive: true });
    await mkdir(path.join(repository, ".git"), { recursive: true });
    await writeFile(path.join(repository, "alpha.ts"), "export const alpha = true;\n");
    await writeFile(path.join(repository, "nested", "café.ts"), "export const café = true;\n");
    await writeFile(path.join(repository, ".git", "config"), "must not index\n");
    stdout = openSync(stdoutPath, "w");
    stderr = openSync(stderrPath, "w");

    const artifact = await verifiedRipgrepWasm();
    const module = await WebAssembly.compile(Uint8Array.from(artifact));
    const wasi = new WASI({
      version: "preview1",
      args: ["rg", "--no-config", "--threads", "1", "--sort", "path", "--files", "--hidden", "--glob", "!.git/**"],
      env: {},
      preopens: { ".": await realpath(repository) },
      stdout,
      stderr,
      returnOnExit: true,
    });
    let memory: WebAssembly.Memory | undefined;
    const imports = withWindowsDirectoryReads(
      wasi.wasiImport as unknown as WasiPreview1Imports,
      await realpath(repository),
      () => {
        assert.ok(memory);
        return memory;
      },
    );
    const instance = await WebAssembly.instantiate(module, { wasi_snapshot_preview1: imports });
    assert.ok(instance.exports.memory instanceof WebAssembly.Memory);
    memory = instance.exports.memory;
    assert.equal(wasi.start(instance), 0);
    closeSync(stdout);
    closeSync(stderr);
    stdout = -1;
    stderr = -1;

    assert.equal(await readFile(stdoutPath, "utf8"), "alpha.ts\nnested/café.ts\n");
    assert.equal(await readFile(stderrPath, "utf8"), "");
  } finally {
    if (stdout >= 0) closeSync(stdout);
    if (stderr >= 0) closeSync(stderr);
    await rm(root, { recursive: true, force: true });
  }
});
