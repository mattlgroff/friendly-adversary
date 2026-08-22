import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";
import { FriendlyAdversaryError } from "./errors.js";

export const RUFF_WASM_UPSTREAM_VERSION = "0.16.2";
export const RUFF_WASM_UPSTREAM_COMMIT = "5b48a040974781ba90b47c8df628f8fd9b6c95dd";
export const RUFF_WASM_SHA256 = "94bbf4cb394817181bcdf793eee3f0ae2574f0dca912fe99ab4012ee4d8bad4f";
export const RUFF_WASM_GLUE_SHA256 = "ec74250fabf2aadd864ffdc1df86fe5ec7901466837a7ebc7e8de306f0563897";
export const RUFF_WASM_DEFAULT_MAX_FILE_BYTES = 16 * 1024 * 1024;
export const RUFF_WASM_DEFAULT_MAX_TOTAL_BYTES = 64 * 1024 * 1024;

export interface RuffWasmFile {
  path: string;
  source: string;
}

export interface RuffWasmFileResult {
  path: string;
  status: "ok" | "error";
  diagnostics: unknown[];
  error: string | null;
}

export interface RuffWasmResult {
  engine: "friendly-adversary-ruff-wasm";
  upstreamVersion: "0.16.2";
  upstreamCommit: "5b48a040974781ba90b47c8df628f8fd9b6c95dd";
  wasmSha256: string;
  glueSha256: string;
  files: RuffWasmFileResult[];
}

export interface RuffWasmOptions {
  files: RuffWasmFile[];
  timeoutMs: number;
  maxFileBytes?: number;
  maxTotalBytes?: number;
  signal?: AbortSignal;
  runtimeDirectory?: string;
}

interface WorkerSuccess {
  ok: true;
  version: string;
  results: RuffWasmFileResult[];
}

interface WorkerFailure {
  ok: false;
  error: string;
}

type WorkerResponse = WorkerSuccess | WorkerFailure;

const WORKER_SOURCE = String.raw`
"use strict";
const { parentPort, workerData } = require("node:worker_threads");

function fail(error) {
  parentPort.postMessage({ ok: false, error: error instanceof Error ? error.stack || error.message : String(error) });
}

try {
  const runtime = require(workerData.gluePath);
  const version = runtime.Workspace.version();
  const workspace = new runtime.Workspace({}, runtime.PositionEncoding.Utf16);
  const results = [];
  try {
    for (const file of workerData.files) {
      try {
        const diagnostics = workspace.check(file.source);
        if (!Array.isArray(diagnostics)) throw new Error("Ruff WebAssembly returned a non-array diagnostic result");
        results.push({ path: file.path, status: "ok", diagnostics, error: null });
      } catch (error) {
        results.push({
          path: file.path,
          status: "error",
          diagnostics: [],
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  } finally {
    workspace.free();
  }
  parentPort.postMessage({ ok: true, version, results });
} catch (error) {
  fail(error);
}
`;

function comparePaths(left: RuffWasmFile, right: RuffWasmFile): number {
  return left.path < right.path ? -1 : left.path > right.path ? 1 : 0;
}

async function defaultRuntimeDirectory(): Promise<string> {
  const candidates = [
    fileURLToPath(new URL("../../engines/ruff-wasm/runtime/", import.meta.url)),
    fileURLToPath(new URL("engines/ruff-wasm/runtime/", import.meta.url)),
  ];
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next package or plugin layout.
    }
  }
  throw new FriendlyAdversaryError("The packaged Ruff WebAssembly runtime is missing", 2);
}

export async function runRuffWasm(options: RuffWasmOptions): Promise<RuffWasmResult> {
  const major = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
  if (major < 22) throw new FriendlyAdversaryError(`Ruff WebAssembly requires Node 22 or newer, received ${process.version}`, 2);
  if (!Number.isSafeInteger(options.timeoutMs) || options.timeoutMs <= 0) {
    throw new FriendlyAdversaryError("Ruff WebAssembly timeout must be a positive integer", 2);
  }
  const maxFileBytes = options.maxFileBytes ?? RUFF_WASM_DEFAULT_MAX_FILE_BYTES;
  const maxTotalBytes = options.maxTotalBytes ?? RUFF_WASM_DEFAULT_MAX_TOTAL_BYTES;
  if (!Number.isSafeInteger(maxFileBytes) || maxFileBytes <= 0 || !Number.isSafeInteger(maxTotalBytes) || maxTotalBytes <= 0) {
    throw new FriendlyAdversaryError("Ruff WebAssembly input limits must be positive integers", 2);
  }
  if (options.signal?.aborted) throw new FriendlyAdversaryError("Ruff WebAssembly review was cancelled", 130);

  const files = [...options.files].sort(comparePaths);
  const seen = new Set<string>();
  let totalBytes = 0;
  for (const file of files) {
    if (seen.has(file.path)) throw new FriendlyAdversaryError(`Duplicate Ruff input path: ${file.path}`, 2);
    seen.add(file.path);
    const bytes = Buffer.byteLength(file.source, "utf8");
    totalBytes += bytes;
    if (bytes > maxFileBytes) throw new FriendlyAdversaryError(`Ruff input ${file.path} exceeds the ${maxFileBytes}-byte file limit`, 2);
  }
  if (totalBytes > maxTotalBytes) throw new FriendlyAdversaryError(`Ruff inputs exceed the ${maxTotalBytes}-byte batch limit`, 2);

  const runtimeDirectory = options.runtimeDirectory ?? await defaultRuntimeDirectory();
  const gluePath = path.join(runtimeDirectory, "ruff_wasm.js");
  const wasmPath = path.join(runtimeDirectory, "ruff_wasm_bg.wasm");
  const [glue, wasm] = await Promise.all([readFile(gluePath), readFile(wasmPath)]);
  const glueSha256 = createHash("sha256").update(glue).digest("hex");
  const wasmSha256 = createHash("sha256").update(wasm).digest("hex");
  if (glueSha256 !== RUFF_WASM_GLUE_SHA256 || wasmSha256 !== RUFF_WASM_SHA256) {
    throw new FriendlyAdversaryError("Ruff WebAssembly runtime checksum mismatch", 2);
  }

  const worker = new Worker(WORKER_SOURCE, {
    eval: true,
    workerData: { gluePath, files },
    resourceLimits: {
      maxOldGenerationSizeMb: 256,
      maxYoungGenerationSizeMb: 32,
      stackSizeMb: 8,
    },
  });
  const response = await new Promise<WorkerResponse>((resolve, reject) => {
    let settled = false;
    const finish = (action: () => void): void => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      options.signal?.removeEventListener("abort", abort);
      action();
    };
    const abort = (): void => finish(() => {
      void worker.terminate();
      reject(new FriendlyAdversaryError("Ruff WebAssembly review was cancelled", 130));
    });
    const timeout = setTimeout(() => finish(() => {
      void worker.terminate();
      reject(new FriendlyAdversaryError(`Ruff WebAssembly exceeded ${options.timeoutMs} ms`, 2));
    }), options.timeoutMs);
    timeout.unref();
    options.signal?.addEventListener("abort", abort, { once: true });
    worker.once("message", (message: WorkerResponse) => finish(() => resolve(message)));
    worker.once("error", (error) => finish(() => reject(new FriendlyAdversaryError(`Ruff WebAssembly worker failed: ${error.message}`, 2))));
    worker.once("exit", (code) => {
      if (code !== 0) finish(() => reject(new FriendlyAdversaryError(`Ruff WebAssembly worker exited with code ${code}`, 2)));
    });
  });
  await worker.terminate();
  if (!response.ok) throw new FriendlyAdversaryError(`Ruff WebAssembly failed: ${response.error}`, 2);
  if (response.version !== RUFF_WASM_UPSTREAM_VERSION) {
    throw new FriendlyAdversaryError(`Ruff WebAssembly reported unexpected version ${response.version}`, 2);
  }
  if (response.results.length !== files.length) throw new FriendlyAdversaryError("Ruff WebAssembly returned the wrong number of file results", 2);
  return {
    engine: "friendly-adversary-ruff-wasm",
    upstreamVersion: RUFF_WASM_UPSTREAM_VERSION,
    upstreamCommit: RUFF_WASM_UPSTREAM_COMMIT,
    wasmSha256,
    glueSha256,
    files: response.results,
  };
}
