import assert from "node:assert/strict";
import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {
  RUFF_WASM_GLUE_SHA256,
  RUFF_WASM_SHA256,
  RUFF_WASM_UPSTREAM_COMMIT,
  RUFF_WASM_UPSTREAM_VERSION,
  runRuffWasm,
} from "../src/ruff-wasm.js";

const runtimeDirectory = path.resolve("engines", "ruff-wasm", "runtime");

test("pinned Ruff WebAssembly lints Python without Python or a native Ruff executable", async () => {
  const result = await runRuffWasm({
    runtimeDirectory,
    timeoutMs: 20_000,
    files: [{ path: "src/app.py", source: "import os\nprint(undefined_name)\n" }],
  });
  assert.equal(result.upstreamVersion, RUFF_WASM_UPSTREAM_VERSION);
  assert.equal(result.upstreamCommit, RUFF_WASM_UPSTREAM_COMMIT);
  assert.equal(result.wasmSha256, RUFF_WASM_SHA256);
  assert.equal(result.glueSha256, RUFF_WASM_GLUE_SHA256);
  const diagnostics = result.files[0]?.diagnostics as Array<{
    code?: string;
    annotations?: Array<{ location?: { path?: string } | null }>;
  }>;
  assert.ok(diagnostics.some((diagnostic) => diagnostic.code === "F821"));
  assert.ok(diagnostics.some((diagnostic) => diagnostic.code === "F401"));
  assert.ok(diagnostics.flatMap((diagnostic) => diagnostic.annotations ?? []).some((annotation) => annotation.location?.path === "<filename>"));
  assert.equal(result.files[0]?.path, "src/app.py");
});

test("Ruff WebAssembly output is deterministic across input order and Windows-style logical paths", async () => {
  const files = [
    { path: "z.py", source: "print(undefined_z)\r\n" },
    { path: "src\\a.py", source: "print(undefined_a)\r\n" },
  ];
  const first = await runRuffWasm({ runtimeDirectory, timeoutMs: 20_000, files });
  const second = await runRuffWasm({ runtimeDirectory, timeoutMs: 20_000, files: [...files].reverse() });
  assert.deepEqual(second, first);
  assert.deepEqual(first.files.map((file) => file.path), ["src\\a.py", "z.py"]);
});

test("Ruff WebAssembly cancellation, limits, and runtime hashes fail closed", async () => {
  const cancelled = new AbortController();
  cancelled.abort();
  await assert.rejects(
    () => runRuffWasm({ runtimeDirectory, timeoutMs: 20_000, signal: cancelled.signal, files: [] }),
    /was cancelled/,
  );
  await assert.rejects(
    () => runRuffWasm({ runtimeDirectory, timeoutMs: 20_000, maxFileBytes: 4, files: [{ path: "large.py", source: "12345" }] }),
    /exceeds the 4-byte file limit/,
  );
  await assert.rejects(
    () => runRuffWasm({
      runtimeDirectory,
      timeoutMs: 20_000,
      maxTotalBytes: 8,
      files: [{ path: "one.py", source: "12345" }, { path: "two.py", source: "12345" }],
    }),
    /exceed the 8-byte batch limit/,
  );

  const temporary = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-ruff-tamper-"));
  try {
    await cp(runtimeDirectory, temporary, { recursive: true });
    await writeFile(path.join(temporary, "ruff_wasm_bg.wasm"), Buffer.from("not wasm"));
    await assert.rejects(
      () => runRuffWasm({ runtimeDirectory: temporary, timeoutMs: 20_000, files: [] }),
      /checksum mismatch/,
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("vendored Ruff runtime has no native binary and JavaScript loads only the adjacent WASM", async () => {
  const glue = await readFile(path.join(runtimeDirectory, "ruff_wasm.js"), "utf8");
  assert.deepEqual([...glue.matchAll(/require\((['"])(.*?)\1\)/gu)].map((match) => match[2]), ["fs"]);
  assert.match(glue, /\/ruff_wasm_bg\.wasm/);
  const wasm = await readFile(path.join(runtimeDirectory, "ruff_wasm_bg.wasm"));
  assert.ok(wasm.subarray(0, 4).equals(Buffer.from([0x00, 0x61, 0x73, 0x6d])));
  const module = new WebAssembly.Module(wasm);
  assert.ok(WebAssembly.Module.imports(module).every((entry) => entry.module === "./ruff_wasm_bg.js"));
});
