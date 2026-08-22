import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { FriendlyAdversaryError } from "./errors.js";

export const RIPGREP_WASM_UPSTREAM_VERSION = "15.2.0";
export const RIPGREP_WASM_UPSTREAM_COMMIT = "e89fff89ac9af12e8d4ce9d5fd07beb408ca730f";
export const RIPGREP_WASM_SHA256 = "cb7a661e78f55ea0e82567867fc7ad5f09e3b352e3424eecd8fed8ebe1e37416";

export async function defaultRipgrepWasmPath(): Promise<string> {
  const candidates = [
    fileURLToPath(new URL("../../engines/ripgrep-wasm/runtime/rg.wasm", import.meta.url)),
    fileURLToPath(new URL("engines/ripgrep-wasm/runtime/rg.wasm", import.meta.url)),
  ];
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return candidate;
    } catch {
      // Try the next package or plugin layout.
    }
  }
  throw new FriendlyAdversaryError("The packaged ripgrep WebAssembly artifact is missing", 2);
}

export async function verifiedRipgrepWasm(artifactPath?: string): Promise<Buffer> {
  const path = artifactPath ?? await defaultRipgrepWasmPath();
  const artifact = await readFile(path);
  const digest = createHash("sha256").update(artifact).digest("hex");
  if (digest !== RIPGREP_WASM_SHA256) {
    throw new FriendlyAdversaryError(`ripgrep WebAssembly checksum mismatch for ${path}`, 2);
  }
  let module: WebAssembly.Module;
  try {
    module = new WebAssembly.Module(Uint8Array.from(artifact));
  } catch (error) {
    throw new FriendlyAdversaryError(`ripgrep WebAssembly is invalid: ${error instanceof Error ? error.message : String(error)}`, 2);
  }
  const imports = WebAssembly.Module.imports(module);
  if (imports.some((entry) => entry.module !== "wasi_snapshot_preview1")) {
    throw new FriendlyAdversaryError("ripgrep WebAssembly imports a non-WASI capability", 2);
  }
  const exports = new Set(WebAssembly.Module.exports(module).map((entry) => entry.name));
  for (const required of ["memory", "_start"]) {
    if (!exports.has(required)) throw new FriendlyAdversaryError(`ripgrep WebAssembly is missing export: ${required}`, 2);
  }
  return artifact;
}
