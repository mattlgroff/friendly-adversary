import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  defaultRipgrepWasmPath,
  RIPGREP_WASM_SHA256,
  RIPGREP_WASM_UPSTREAM_VERSION,
  verifiedRipgrepWasm,
} from "../src/ripgrep-wasm.js";

interface Capture {
  code: number;
  stdout: string;
  stderr: string;
}

function run(repo: string, args: string[], env: NodeJS.ProcessEnv = process.env): Promise<Capture> {
  const cli = fileURLToPath(new URL("../src/ripgrep-wasm-cli.js", import.meta.url));
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["--no-warnings", cli, "--repo", repo, "--", ...args], {
      env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk: string) => { stdout += chunk; });
    child.stderr.setEncoding("utf8").on("data", (chunk: string) => { stderr += chunk; });
    child.once("error", reject);
    child.once("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
  });
}

test("packaged ripgrep is one checksummed WASI module", async () => {
  const artifact = await verifiedRipgrepWasm();
  assert.equal(await defaultRipgrepWasmPath(), path.resolve("engines/ripgrep-wasm/runtime/rg.wasm"));
  assert.equal((await readFile(await defaultRipgrepWasmPath())).equals(artifact), true);
  const module = new WebAssembly.Module(Uint8Array.from(artifact));
  assert.ok(WebAssembly.Module.imports(module).every((entry) => entry.module === "wasi_snapshot_preview1"));
  assert.match(RIPGREP_WASM_SHA256, /^[a-f0-9]{64}$/u);
});

test("packaged ripgrep reports the pinned upstream version", async () => {
  const result = await run(path.resolve("."), ["--version"]);
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, new RegExp(`^ripgrep ${RIPGREP_WASM_UPSTREAM_VERSION.replaceAll(".", "\\.")}\\b`, "u"));
});

test("packaged ripgrep preserves native JSON search output and ignore behavior", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-ripgrep-"));
  try {
    await mkdir(path.join(root, "src"), { recursive: true });
    await mkdir(path.join(root, "ignored"), { recursive: true });
    await mkdir(path.join(root, ".git"), { recursive: true });
    await writeFile(path.join(root, ".gitignore"), "ignored/\nTopÑapa\n");
    await writeFile(path.join(root, "src", "index.ts"), "export function needleValue() { return 1; }\n");
    await writeFile(path.join(root, "ignored", "hidden.ts"), "needleValue\n");
    await writeFile(path.join(root, "TopÑapa"), "needleValue\n");
    const result = await run(root, ["--json", "--word-regexp", "needleValue", "--", "."], { ...process.env, PATH: "" });
    assert.equal(result.code, 0, result.stderr);
    const messages = result.stdout.trim().split(/\r?\n/u).map((line) => JSON.parse(line) as { type: string; data?: { path?: { text?: string } } });
    const matches = messages.filter((message) => message.type === "match");
    assert.equal(matches.length, 1);
    assert.equal(matches[0]?.data?.path?.text, "./src/index.ts");
    assert.ok(messages.some((message) => message.type === "summary"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("ripgrep artifact tampering fails closed", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-ripgrep-tamper-"));
  try {
    const tampered = path.join(root, "rg.wasm");
    await writeFile(tampered, Buffer.from("not wasm"));
    await assert.rejects(() => verifiedRipgrepWasm(tampered), /checksum mismatch/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
