import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { Worker } from "node:worker_threads";
import { FriendlyAdversaryError } from "./errors.js";
export const OXLINT_WASM_UPSTREAM_VERSION = "1.76.0";
export const OXLINT_WASM_UPSTREAM_COMMIT = "65fe65d8429e1d1bdf86c517ff08bd119ee87660";
export const OXLINT_WASM_SHA256 = "8893c7e1a230eea648ca646a578afbd62c1712f9f8d36a4ab2e8589c73b6a5bb";
export const OXLINT_WASM_ABI_VERSION = 2;
export const OXLINT_WASM_MAX_MEMORY_BYTES = 4 * 1024 * 1024 * 1024;
export const OXLINT_WASM_DEFAULT_MAX_FILE_BYTES = 16 * 1024 * 1024;
export const OXLINT_WASM_DEFAULT_MAX_TOTAL_BYTES = 64 * 1024 * 1024;
const WORKER_SOURCE = String.raw `
"use strict";
const { parentPort, workerData } = require("node:worker_threads");
const { WASI } = require("node:wasi");

function fail(message) {
  parentPort.postMessage({ ok: false, error: message });
}

function portablePath(value) {
  return typeof value === "string" ? value.replaceAll("\\", "/") : value;
}

try {
  const bytes = new Uint8Array(workerData.wasmBytes);
  const module = new WebAssembly.Module(bytes);
  const imports = WebAssembly.Module.imports(module);
  if (imports.some((entry) => entry.module !== "wasi_snapshot_preview1")) {
    throw new Error("WebAssembly module imports a non-WASI capability");
  }
  const wasi = new WASI({ version: "preview1", args: [], env: {}, preopens: {}, returnOnExit: true });
  const instance = new WebAssembly.Instance(module, wasi.getImportObject());
  wasi.initialize(instance);
  const exports = instance.exports;
  const required = [
    "memory",
    "friendly_adversary_oxlint_abi_version",
    "friendly_adversary_oxlint_alloc",
    "friendly_adversary_oxlint_dealloc",
    "friendly_adversary_oxlint_lint",
  ];
  for (const name of required) {
    if (!(name in exports)) throw new Error("WebAssembly module is missing export: " + name);
  }
  if (exports.friendly_adversary_oxlint_abi_version() !== workerData.abiVersion) {
    throw new Error("WebAssembly ABI version does not match the JavaScript host");
  }
  const encoder = new TextEncoder();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const responses = [];
  for (const file of workerData.files) {
    const request = encoder.encode(JSON.stringify({
      source: file.source,
      path: portablePath(file.lintPath || file.path),
      config_json: workerData.configJson,
      config_path: portablePath(workerData.configPath),
      ignore_patterns: workerData.ignorePatterns,
      ignore_root: portablePath(workerData.ignoreRoot),
    }));
    const inputPointer = exports.friendly_adversary_oxlint_alloc(request.length);
    if (inputPointer === 0) throw new Error("WebAssembly request allocation failed");
    try {
      new Uint8Array(exports.memory.buffer, inputPointer, request.length).set(request);
      const packed = exports.friendly_adversary_oxlint_lint(inputPointer, request.length);
      if (packed === 0n) throw new Error("WebAssembly response allocation failed");
      const outputPointer = Number(packed & 0xffffffffn);
      const outputLength = Number(packed >> 32n);
      try {
        const responseBytes = new Uint8Array(exports.memory.buffer, outputPointer, outputLength);
        responses.push(JSON.parse(decoder.decode(responseBytes)));
      } finally {
        exports.friendly_adversary_oxlint_dealloc(outputPointer, outputLength);
      }
    } finally {
      exports.friendly_adversary_oxlint_dealloc(inputPointer, request.length);
    }
  }
  parentPort.postMessage({ ok: true, responses });
} catch (error) {
  fail(error instanceof Error ? error.stack || error.message : String(error));
}
`;
function comparePaths(left, right) {
    return left.path < right.path ? -1 : left.path > right.path ? 1 : 0;
}
async function defaultWasmPath() {
    const candidates = [
        fileURLToPath(new URL("../../wasm/oxlint/engine.wasm", import.meta.url)),
        fileURLToPath(new URL("wasm/oxlint/engine.wasm", import.meta.url)),
    ];
    for (const candidate of candidates) {
        try {
            await access(candidate);
            return candidate;
        }
        catch {
            // Try the next package or plugin layout.
        }
    }
    throw new FriendlyAdversaryError("The packaged Oxlint WebAssembly artifact is missing", 2);
}
function validateRawResponse(response) {
    if (response.abi_version !== OXLINT_WASM_ABI_VERSION) {
        throw new FriendlyAdversaryError(`Oxlint WebAssembly returned ABI ${response.abi_version}`, 2);
    }
    if (response.upstream_version !== OXLINT_WASM_UPSTREAM_VERSION || response.upstream_commit !== OXLINT_WASM_UPSTREAM_COMMIT) {
        throw new FriendlyAdversaryError("Oxlint WebAssembly provenance does not match the pinned upstream release", 2);
    }
    if (response.status !== "ok" && response.status !== "ignored" && response.status !== "error") {
        throw new FriendlyAdversaryError("Oxlint WebAssembly returned an invalid status", 2);
    }
}
export async function runOxlintWasm(options) {
    const major = Number.parseInt(process.versions.node.split(".")[0] ?? "0", 10);
    if (major < 22)
        throw new FriendlyAdversaryError(`Oxlint WebAssembly requires Node 22 or newer, received ${process.version}`, 2);
    if (!Number.isSafeInteger(options.timeoutMs) || options.timeoutMs <= 0) {
        throw new FriendlyAdversaryError("Oxlint WebAssembly timeout must be a positive integer", 2);
    }
    const maxFileBytes = options.maxFileBytes ?? OXLINT_WASM_DEFAULT_MAX_FILE_BYTES;
    if (!Number.isSafeInteger(maxFileBytes) || maxFileBytes <= 0) {
        throw new FriendlyAdversaryError("Oxlint WebAssembly file limit must be a positive integer", 2);
    }
    const maxTotalBytes = options.maxTotalBytes ?? OXLINT_WASM_DEFAULT_MAX_TOTAL_BYTES;
    if (!Number.isSafeInteger(maxTotalBytes) || maxTotalBytes <= 0) {
        throw new FriendlyAdversaryError("Oxlint WebAssembly batch limit must be a positive integer", 2);
    }
    if ((options.ignorePatterns?.length ?? 0) > 0 && !options.ignoreRoot) {
        throw new FriendlyAdversaryError("Oxlint WebAssembly ignoreRoot is required when ignore patterns are provided", 2);
    }
    if (options.signal?.aborted)
        throw new FriendlyAdversaryError("Oxlint WebAssembly review was cancelled", 130);
    const files = [...options.files].sort(comparePaths);
    const seen = new Set();
    let totalBytes = 0;
    for (const file of files) {
        if (seen.has(file.path))
            throw new FriendlyAdversaryError(`Duplicate Oxlint input path: ${file.path}`, 2);
        seen.add(file.path);
        const bytes = Buffer.byteLength(file.source, "utf8");
        totalBytes += bytes;
        if (bytes > maxFileBytes) {
            throw new FriendlyAdversaryError(`Oxlint input ${file.path} exceeds the ${maxFileBytes}-byte file limit`, 2);
        }
    }
    if (totalBytes > maxTotalBytes) {
        throw new FriendlyAdversaryError(`Oxlint inputs exceed the ${maxTotalBytes}-byte batch limit`, 2);
    }
    const wasmPath = options.wasmPath ?? await defaultWasmPath();
    const wasm = await readFile(wasmPath);
    const digest = createHash("sha256").update(wasm).digest("hex");
    if (digest !== OXLINT_WASM_SHA256) {
        throw new FriendlyAdversaryError(`Oxlint WebAssembly checksum mismatch for ${wasmPath}`, 2);
    }
    const transferable = wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength);
    const worker = new Worker(WORKER_SOURCE, {
        eval: true,
        execArgv: ["--no-warnings"],
        workerData: {
            wasmBytes: transferable,
            abiVersion: OXLINT_WASM_ABI_VERSION,
            files,
            configJson: options.configJson,
            configPath: options.configPath,
            ignorePatterns: options.ignorePatterns ?? [],
            ignoreRoot: options.ignoreRoot,
        },
        transferList: [transferable],
        resourceLimits: {
            maxOldGenerationSizeMb: 128,
            maxYoungGenerationSizeMb: 32,
            stackSizeMb: 8,
        },
    });
    const response = await new Promise((resolve, reject) => {
        let settled = false;
        const finish = (action) => {
            if (settled)
                return;
            settled = true;
            clearTimeout(timeout);
            options.signal?.removeEventListener("abort", abort);
            action();
        };
        const abort = () => {
            finish(() => {
                void worker.terminate();
                reject(new FriendlyAdversaryError("Oxlint WebAssembly review was cancelled", 130));
            });
        };
        const timeout = setTimeout(() => {
            finish(() => {
                void worker.terminate();
                reject(new FriendlyAdversaryError(`Oxlint WebAssembly exceeded ${options.timeoutMs} ms`, 2));
            });
        }, options.timeoutMs);
        timeout.unref();
        options.signal?.addEventListener("abort", abort, { once: true });
        worker.once("message", (message) => finish(() => resolve(message)));
        worker.once("error", (error) => finish(() => reject(new FriendlyAdversaryError(`Oxlint WebAssembly worker failed: ${error.message}`, 2))));
        worker.once("exit", (code) => {
            if (code !== 0)
                finish(() => reject(new FriendlyAdversaryError(`Oxlint WebAssembly worker exited with code ${code}`, 2)));
        });
    });
    await worker.terminate();
    if (!response.ok)
        throw new FriendlyAdversaryError(`Oxlint WebAssembly failed: ${response.error}`, 2);
    if (response.responses.length !== files.length) {
        throw new FriendlyAdversaryError("Oxlint WebAssembly returned the wrong number of file results", 2);
    }
    const results = response.responses.map((raw, index) => {
        validateRawResponse(raw);
        const file = files[index];
        if (!file)
            throw new FriendlyAdversaryError("Oxlint WebAssembly response has no matching input", 2);
        return {
            path: file.path,
            status: raw.status,
            diagnostics: raw.diagnostics,
            error: raw.error,
        };
    });
    return {
        engine: "friendly-adversary-oxlint-wasm",
        abiVersion: OXLINT_WASM_ABI_VERSION,
        upstreamVersion: OXLINT_WASM_UPSTREAM_VERSION,
        upstreamCommit: OXLINT_WASM_UPSTREAM_COMMIT,
        wasmSha256: digest,
        files: results,
    };
}
//# sourceMappingURL=oxlint-wasm.js.map