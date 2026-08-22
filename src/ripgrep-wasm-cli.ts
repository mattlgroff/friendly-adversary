#!/usr/bin/env node
import { lstat, realpath } from "node:fs/promises";
import { WASI } from "node:wasi";
import { verifiedRipgrepWasm } from "./ripgrep-wasm.js";
import { withWindowsDirectoryReads, type WasiPreview1Imports } from "./wasi-preview1-windows.js";

function fail(message: string): never {
  throw new Error(message);
}

function parse(argv: string[]): { repo: string; ripgrepArgs: string[] } {
  if (argv[0] !== "--repo" || !argv[1] || argv[2] !== "--" || argv.length < 4) {
    return fail("Usage: ripgrep-wasm-cli --repo <repository> -- <ripgrep arguments>");
  }
  const ripgrepArgs = argv.slice(3);
  const unsupported = ripgrepArgs.find((argument) => (
    argument === "--threads"
    || argument.startsWith("--threads=")
    || /^-j(?:\d+)?$/u.test(argument)
    || argument === "--pre"
    || argument.startsWith("--pre=")
    || argument === "--pre-glob"
    || argument.startsWith("--pre-glob=")
    || argument === "--search-zip"
    || argument === "-z"
    || argument === "--hostname-bin"
    || argument.startsWith("--hostname-bin=")
  ));
  if (unsupported) return fail(`Unsupported ripgrep WebAssembly argument: ${unsupported}`);
  return { repo: argv[1], ripgrepArgs };
}

async function main(): Promise<void> {
  const parsed = parse(process.argv.slice(2));
  const repository = await realpath(parsed.repo);
  if (!(await lstat(repository)).isDirectory()) fail(`Repository is not a directory: ${parsed.repo}`);
  const artifact = await verifiedRipgrepWasm();
  const module = await WebAssembly.compile(Uint8Array.from(artifact));
  const wasi = new WASI({
    version: "preview1",
    args: ["rg", "--no-config", "--threads", "1", ...parsed.ripgrepArgs],
    env: {},
    preopens: { ".": repository },
    returnOnExit: true,
  });
  let memory: WebAssembly.Memory | undefined;
  const nativeImports = wasi.wasiImport as unknown as WasiPreview1Imports;
  const wasiImports = process.platform === "win32"
    ? withWindowsDirectoryReads(nativeImports, repository, () => {
        if (!memory) fail("ripgrep WebAssembly memory is unavailable");
        return memory;
      })
    : nativeImports;
  const instance = await WebAssembly.instantiate(module, {
    wasi_snapshot_preview1: wasiImports,
  });
  const exportedMemory = instance.exports.memory;
  if (!(exportedMemory instanceof WebAssembly.Memory)) fail("ripgrep WebAssembly does not export memory");
  memory = exportedMemory;
  process.exitCode = wasi.start(instance);
}

main().catch((error: unknown) => {
  process.stderr.write(`friendly-adversary: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 2;
});
