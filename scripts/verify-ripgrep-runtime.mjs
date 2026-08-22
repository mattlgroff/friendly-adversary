import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const engine = path.join(root, "engines", "ripgrep-wasm");
const lock = JSON.parse(await readFile(path.join(engine, "upstream-lock.json"), "utf8"));
const errors = [];
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

async function verifyFile(relative, expectedHash, expectedBytes) {
  const absolute = path.join(engine, ...relative.split("/"));
  let bytes;
  try {
    bytes = await readFile(absolute);
  } catch {
    errors.push(`Missing ripgrep file: ${relative}`);
    return;
  }
  if (sha256(bytes) !== expectedHash) errors.push(`ripgrep checksum mismatch: ${relative}`);
  if (expectedBytes !== undefined && bytes.byteLength !== expectedBytes) errors.push(`ripgrep byte length mismatch: ${relative}`);
  return bytes;
}

const runtime = await verifyFile(lock.runtime.path, lock.runtime.sha256, lock.runtime.bytes);
await verifyFile(lock.upstream.sourceArchive.path, lock.upstream.sourceArchive.sha256);
await verifyFile(lock.conformance.classifiedInventoryPath, lock.conformance.classifiedInventorySha256);
await verifyFile(lock.conformance.researchInventoryPath, lock.conformance.researchInventorySha256);
await verifyFile(lock.conformance.testHarnessPatchPath, lock.conformance.testHarnessPatchSha256);
await verifyFile(lock.conformance.wasiResultsPath, lock.conformance.wasiResultsSha256);
await verifyFile(lock.conformance.nativeDocResultsPath, lock.conformance.nativeDocResultsSha256);

if (runtime) {
  try {
    const module = new WebAssembly.Module(Uint8Array.from(runtime));
    if (WebAssembly.Module.imports(module).some((entry) => entry.module !== "wasi_snapshot_preview1")) {
      errors.push("ripgrep WebAssembly imports a non-WASI capability");
    }
    const exports = new Set(WebAssembly.Module.exports(module).map((entry) => entry.name));
    for (const required of ["memory", "_start"]) if (!exports.has(required)) errors.push(`ripgrep WebAssembly lacks ${required}`);
  } catch (error) {
    errors.push(`ripgrep WebAssembly cannot compile: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const classified = (await readFile(path.join(engine, lock.conformance.classifiedInventoryPath), "utf8")).trimEnd().split("\n").slice(1);
const counts = new Map();
const inventory = classified.map((line) => line.split("\t"));
for (const columns of inventory) {
  counts.set(columns[6], (counts.get(columns[6]) ?? 0) + 1);
}
const expectedCounts = new Map([
  ["applicable_required", lock.conformance.productApplicablePassed],
  ["applicable_upstream_ignored", lock.conformance.productApplicableUpstreamIgnored],
  ["non_applicable", lock.conformance.productNonApplicable],
]);
if (classified.length !== lock.conformance.upstreamInventory) errors.push("ripgrep upstream inventory count mismatch");
for (const [classification, expected] of expectedCounts) {
  if (counts.get(classification) !== expected) errors.push(`ripgrep ${classification} count mismatch`);
}
if (lock.conformance.productApplicableFailed !== 0 || lock.conformance.productUnclassified !== 0) {
  errors.push("ripgrep conformance lock records a failure or unclassified test");
}

const wasiResults = JSON.parse(await readFile(path.join(engine, lock.conformance.wasiResultsPath), "utf8"));
const docResults = JSON.parse(await readFile(path.join(engine, lock.conformance.nativeDocResultsPath), "utf8"));
if (wasiResults.upstreamCommit !== lock.upstream.commit || docResults.upstreamCommit !== lock.upstream.commit) {
  errors.push("ripgrep conformance results use the wrong upstream commit");
}
if (wasiResults.sourceArchiveSha256 !== lock.upstream.sourceArchive.sha256 || docResults.sourceArchiveSha256 !== lock.upstream.sourceArchive.sha256) {
  errors.push("ripgrep conformance results use the wrong source archive");
}
if (wasiResults.testHarnessPatchSha256 !== lock.conformance.testHarnessPatchSha256) {
  errors.push("ripgrep WASI results use the wrong test-only harness patch");
}
if (wasiResults.passed !== lock.conformance.wasiPassed || wasiResults.failed !== 0 || wasiResults.ignored !== lock.conformance.wasiUpstreamIgnored) {
  errors.push("ripgrep WASI result totals do not match the lock");
}
if (docResults.passed !== lock.conformance.nativeDocPassed || docResults.failed !== 0 || docResults.ignored !== lock.conformance.nativeDocIgnored) {
  errors.push("ripgrep documentation result totals do not match the lock");
}

const wasiById = new Map();
for (const module of wasiResults.results ?? []) {
  for (const test of module.tests ?? []) {
    const id = `${module.component}:${test.id}`;
    if (wasiById.has(id)) errors.push(`Duplicate ripgrep WASI result: ${id}`);
    wasiById.set(id, test.status);
  }
}
const docsById = new Map();
for (const test of docResults.tests ?? []) {
  const id = `${test.component}:${test.id}`;
  if (docsById.has(id)) errors.push(`Duplicate ripgrep documentation result: ${id}`);
  docsById.set(id, test.status);
}
const testInventory = new Map();
const docInventory = new Map();
let provenApplicable = 0;
let provenIgnored = 0;
for (const columns of inventory) {
  const [kind, component, testId, , , wasiInventory, classification] = columns;
  const id = `${component}:${testId}`;
  if (kind === "test") testInventory.set(id, wasiInventory);
  if (kind === "doc") docInventory.set(id, "native");
  if (classification !== "applicable_required" && classification !== "applicable_upstream_ignored") continue;
  const status = kind === "test" ? wasiById.get(id) : docsById.get(id);
  const expected = classification === "applicable_required" ? "ok" : "ignored";
  if (status !== expected) errors.push(`ripgrep ${classification} lacks ${expected} execution evidence: ${kind}:${id}`);
  else if (expected === "ok") provenApplicable += 1;
  else provenIgnored += 1;
}
for (const id of wasiById.keys()) {
  if (testInventory.get(id) !== "yes") errors.push(`ripgrep WASI result is absent from the WASI inventory: ${id}`);
}
for (const [id, wasiInventory] of testInventory) {
  if (wasiInventory === "yes" && !wasiById.has(id)) errors.push(`ripgrep WASI inventory lacks an execution result: ${id}`);
}
for (const id of docsById.keys()) {
  if (!docInventory.has(id)) errors.push(`ripgrep documentation result is absent from the upstream inventory: ${id}`);
}
if (provenApplicable !== lock.conformance.productApplicablePassed) errors.push("ripgrep applicable pass total is not backed by per-case evidence");
if (provenIgnored !== lock.conformance.productApplicableUpstreamIgnored) errors.push("ripgrep applicable ignored total is not backed by per-case evidence");

const licenseManifest = await readFile(path.join(engine, "conformance", "licenses.sha256"), "utf8");
if (sha256(licenseManifest) !== lock.notices.licenseManifestSha256) errors.push("ripgrep license manifest checksum mismatch");
for (const line of licenseManifest.trimEnd().split("\n")) {
  const match = /^([a-f0-9]{64})  (licenses\/.+)$/u.exec(line);
  if (!match) {
    errors.push(`Malformed ripgrep license manifest row: ${line}`);
    continue;
  }
  await verifyFile(match[2], match[1]);
}

for (const host of ["codex", "claude-code"]) {
  const packaged = path.join(root, "platforms", host, "plugins", "friendly-adversary", "skills", "pr-review", "engines", "ripgrep-wasm", "runtime", "rg.wasm");
  try {
    if (sha256(await readFile(packaged)) !== lock.runtime.sha256) errors.push(`${host} ripgrep copy differs from the root artifact`);
  } catch {
    errors.push(`${host} ripgrep copy is missing`);
  }
}

const toolsSource = await readFile(path.join(root, "src", "tools.ts"), "utf8");
for (const prohibited of ["executableOnPath(\"rg\")", "trustedInvocation(input.repo, \"rg\"", "fallbackProfileExecuted", "polling-fallback"]) {
  if (toolsSource.includes(prohibited)) errors.push(`Friendly runtime retains prohibited fallback text: ${prohibited}`);
}
for (const required of ["repository-file-index", "repository-symbol-search", "ripgrep-wasm-cli.js"]) {
  if (!toolsSource.includes(required)) errors.push(`Friendly runtime is missing required ripgrep integration: ${required}`);
}

const runner = path.join(root, "dist", "src", "ripgrep-wasm-cli.js");
const fixture = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-ripgrep-verify-"));
const outsideFixture = `${fixture}-outside.txt`;
const runRipgrep = async (args) => {
  try {
    const result = await execFileAsync(process.execPath, [runner, "--repo", fixture, "--", ...args], { cwd: root });
    return { code: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return {
      code: typeof error.code === "number" ? error.code : 1,
      stdout: String(error.stdout ?? ""),
      stderr: String(error.stderr ?? error.message ?? ""),
    };
  }
};
let productRuntimeCases = 0;
const verifyRuntimeCase = async (name, args, check) => {
  const result = await runRipgrep(args);
  productRuntimeCases += 1;
  if (!await check(result)) errors.push(`ripgrep product runtime case failed: ${name}\n${result.stderr}`);
  return result;
};
try {
  await mkdir(path.join(fixture, "src"), { recursive: true });
  await mkdir(path.join(fixture, ".review"), { recursive: true });
  await mkdir(path.join(fixture, "ignored"), { recursive: true });
  await mkdir(path.join(fixture, ".git"), { recursive: true });
  await writeFile(path.join(fixture, ".gitignore"), "ignored/\nTopÑapa\n");
  await writeFile(path.join(fixture, "src", "index.ts"), "export function needleValue() { return \"café\"; }\n");
  await writeFile(path.join(fixture, "src", "word.ts"), "export const needleValueExtra = true;\n");
  await writeFile(path.join(fixture, ".review", "policy.md"), "needleValue\n");
  await writeFile(path.join(fixture, "ignored", "ignored.ts"), "needleValue\n");
  await writeFile(path.join(fixture, ".git", "config"), "needleValue\n");
  await writeFile(path.join(fixture, "TopÑapa"), "needleValue\n");
  await writeFile(outsideFixture, "needleValue\n");
  const before = new Map();
  for (const relative of [".gitignore", "src/index.ts", "src/word.ts", ".review/policy.md", "ignored/ignored.ts", ".git/config", "TopÑapa"]) {
    before.set(relative, sha256(await readFile(path.join(fixture, ...relative.split("/")))));
  }

  const version = await runRipgrep(["--version"]);
  if (!version.stdout.startsWith(`ripgrep ${lock.upstream.tag}`)) errors.push("Packaged ripgrep reports the wrong version");
  const rejectedThreads = await runRipgrep(["--threads", "2", "--files"]);
  if (rejectedThreads.code === 0 || !rejectedThreads.stderr.includes("Unsupported ripgrep WebAssembly argument")) {
    errors.push("Packaged ripgrep did not reject a caller-supplied thread count");
  }

  await verifyRuntimeCase("hidden file index with Git metadata exclusion", ["--sort", "path", "--files", "--hidden", "--glob", "!.git/**"], (result) => (
    result.code === 0 && result.stdout.includes(".review/policy.md\n") && !result.stdout.includes(".git/config") && !result.stdout.includes("ignored/ignored.ts")
  ));
  await verifyRuntimeCase("default ignore and hidden behavior", ["--sort", "path", "--files"], (result) => (
    result.code === 0 && result.stdout.includes("src/index.ts\n") && !result.stdout.includes(".review/policy.md") && !result.stdout.includes("TopÑapa")
  ));
  await verifyRuntimeCase("JSON word search", ["--json", "--word-regexp", "needleValue", "--", "."], (result) => (
    result.code === 0 && result.stdout.includes('"type":"match"') && result.stdout.includes("./src/index.ts") && !result.stdout.includes("word.ts")
  ));
  await verifyRuntimeCase("hidden JSON search with Git exclusion", ["--hidden", "--glob", "!.git/**", "--json", "--word-regexp", "needleValue", "--", "."], (result) => (
    result.code === 0 && result.stdout.includes("./.review/policy.md") && !result.stdout.includes("./.git/config") && !result.stdout.includes("ignored/ignored.ts")
  ));
  await verifyRuntimeCase("glob-filtered file index", ["--sort", "path", "--files", "--glob", "*.ts"], (result) => (
    result.code === 0 && result.stdout === "src/index.ts\nsrc/word.ts\n"
  ));
  await verifyRuntimeCase("custom type-filtered file index", ["--type-add", "friendly:*.ts", "--type", "friendly", "--sort", "path", "--files"], (result) => (
    result.code === 0 && result.stdout === "src/index.ts\nsrc/word.ts\n"
  ));
  await verifyRuntimeCase("Unicode fixed-string search", ["--fixed-strings", "café", "--", "src/index.ts"], (result) => (
    result.code === 0 && result.stdout.includes("café")
  ));
  await verifyRuntimeCase("WASI path confinement", ["needleValue", "--", `../${path.basename(outsideFixture)}`], (result) => (
    result.code !== 0 && !result.stdout.includes("needleValue")
  ));
  await verifyRuntimeCase("sorted deterministic file index", ["--sort", "path", "--files"], async (result) => {
    const repeated = await runRipgrep(["--sort", "path", "--files"]);
    return result.code === 0 && repeated.code === 0 && repeated.stdout === result.stdout;
  });
  if (productRuntimeCases !== lock.conformance.productRuntimeCases) errors.push("ripgrep product runtime case count mismatch");

  const exitZero = await runRipgrep(["--fixed-strings", "café", "--", "src/index.ts"]);
  const exitOne = await runRipgrep(["definitely-absent", "--", "src/index.ts"]);
  const exitTwo = await runRipgrep(["[", "--", "src/index.ts"]);
  if (exitZero.code !== 0 || exitOne.code !== 1 || exitTwo.code !== 2) errors.push("ripgrep exit-code cases did not produce 0, 1, and 2");
  if (new Set([exitZero.code, exitOne.code, exitTwo.code]).size !== lock.conformance.exitCodeCases) errors.push("ripgrep exit-code case count mismatch");

  for (const [relative, digest] of before) {
    if (sha256(await readFile(path.join(fixture, ...relative.split("/")))) !== digest) errors.push(`ripgrep modified its read-only fixture: ${relative}`);
  }
} finally {
  await rm(fixture, { recursive: true, force: true });
  await rm(outsideFixture, { force: true });
}

if (runtime && (await stat(path.join(engine, lock.runtime.path))).mode & 0o111) errors.push("ripgrep WebAssembly must not be executable");
if (errors.length) throw new Error(errors.join("\n"));
process.stdout.write(`ripgrep WebAssembly verified: ${lock.upstream.tag}, ${lock.runtime.bytes} bytes, ${provenApplicable}/${lock.conformance.productApplicablePassed} applicable upstream cases proven, ${lock.conformance.wasiPassed} WASI tests passed, ${lock.conformance.productRuntimeCases} product runtime cases passed\n`);
