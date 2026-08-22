import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path, { delimiter } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { materializePinnedGitTree } from "./materialize-pinned-git-tree.mjs";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceFlag = process.argv.indexOf("--source");
const outputFlag = process.argv.indexOf("--output");
const sourceRoot = sourceFlag >= 0 ? process.argv[sourceFlag + 1] : undefined;
const output = outputFlag >= 0 ? process.argv[outputFlag + 1] : undefined;
if (!sourceRoot || !output) {
  throw new Error("Usage: node scripts/run-ripgrep-native-doc-conformance.mjs --source <ripgrep source> --output <results.json>");
}

const lock = JSON.parse(await readFile(path.join(root, "engines", "ripgrep-wasm", "upstream-lock.json"), "utf8"));
let authenticated;
let scratchRoot;
try {
authenticated = await materializePinnedGitTree(sourceRoot, lock.upstream.commit, "Ripgrep");
scratchRoot = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-ripgrep-conformance-"));
const resolveTool = async (name) => {
  const result = await execFileAsync("rustup", ["which", "--toolchain", lock.build.rustc, name], {
    encoding: "utf8",
    env: process.env,
  });
  return realpath(result.stdout.trim());
};
const rustcPath = await resolveTool("rustc");
const cargoPath = await resolveTool("cargo");
if (path.dirname(rustcPath) !== path.dirname(cargoPath)) {
  throw new Error("Pinned rustc and cargo do not belong to the same toolchain directory");
}
const cargoHome = path.join(scratchRoot, "cargo-home");
const targetDirectory = path.join(scratchRoot, "target");
await mkdir(cargoHome);
await mkdir(targetDirectory);
const environment = {};
for (const key of ["SystemRoot", "WINDIR", "ComSpec", "PATHEXT", "TMPDIR", "TMP", "TEMP", "SSL_CERT_FILE", "SSL_CERT_DIR", "HTTPS_PROXY", "HTTP_PROXY", "NO_PROXY", "ALL_PROXY"]) {
  if (process.env[key] !== undefined) environment[key] = process.env[key];
}
environment.PATH = `${path.dirname(rustcPath)}${delimiter}${process.env.PATH ?? ""}`;
environment.CARGO_HOME = cargoHome;
environment.CARGO_TARGET_DIR = targetDirectory;
environment.CARGO_INCREMENTAL = "0";
environment.RUSTC = rustcPath;
const options = { cwd: authenticated.root, encoding: "utf8", env: environment, maxBuffer: 64 * 1024 * 1024 };
const rustc = await execFileAsync(rustcPath, ["--version", "--verbose"], options);
const rustcRelease = /^release: (.+)$/mu.exec(rustc.stdout)?.[1];
const rustcCommit = /^commit-hash: ([a-f0-9]+)$/mu.exec(rustc.stdout)?.[1];
if (rustcRelease !== lock.build.rustc || rustcCommit !== lock.build.rustcCommit) {
  throw new Error(`Ripgrep conformance requires rustc ${lock.build.rustc} at ${lock.build.rustcCommit}`);
}
const cargo = await execFileAsync(cargoPath, ["--version", "--verbose"], options);
const cargoRelease = /^release: (.+)$/mu.exec(cargo.stdout)?.[1];
if (cargoRelease !== lock.build.rustc) throw new Error(`Ripgrep conformance requires cargo ${lock.build.rustc}`);
await execFileAsync(cargoPath, ["fetch", "--locked"], options);
const run = await execFileAsync(
  cargoPath,
  ["test", "--offline", "--workspace", "--exclude", "grep-pcre2", "--doc", "--locked"],
  { ...options, env: { ...environment, CARGO_NET_OFFLINE: "true" } },
);
const componentFromId = (id) => {
  if (id.startsWith("crates/globset/")) return "globset";
  if (id.startsWith("crates/cli/")) return "grep-cli";
  if (id.startsWith("crates/matcher/")) return "grep-matcher";
  if (id.startsWith("crates/printer/")) return "grep-printer";
  if (id.startsWith("crates/searcher/")) return "grep-searcher";
  if (id.startsWith("crates/ignore/")) return "ignore";
  throw new Error(`Unexpected ripgrep documentation test: ${id}`);
};
const tests = [];
for (const line of run.stdout.split(/\r?\n/u)) {
  const match = /^test (.+?)(?: - compile)? \.\.\. (ok|ignored)$/u.exec(line);
  if (!match) continue;
  tests.push({ component: componentFromId(match[1]), id: match[1], status: match[2] });
}
const passed = tests.filter((test) => test.status === "ok").length;
const ignored = tests.filter((test) => test.status === "ignored").length;
if (tests.length !== 24 || passed !== 22 || ignored !== 2) {
  throw new Error(`Expected 24 documentation tests with 22 passed and 2 ignored, found ${tests.length}, ${passed}, and ${ignored}`);
}
await writeFile(output, `${JSON.stringify({
  schemaVersion: 1,
  upstreamCommit: lock.upstream.commit,
  sourceArchiveSha256: lock.upstream.sourceArchive.sha256,
  runtime: rustc.stdout.trim(),
  passed,
  failed: 0,
  ignored,
  tests,
}, null, 2)}\n`);
process.stdout.write(`ripgrep native documentation conformance: ${passed} passed, 0 failed, ${ignored} ignored\n`);
} finally {
  await authenticated?.cleanup();
  if (scratchRoot) await rm(scratchRoot, { recursive: true, force: true });
}
