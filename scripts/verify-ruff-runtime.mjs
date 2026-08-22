import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile, readdir, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const engineRoot = path.join(root, "engines", "ruff-wasm");
const lock = JSON.parse(await readFile(path.join(engineRoot, "upstream-lock.json"), "utf8"));
const errors = [];

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

async function walk(directory, current = directory) {
  const files = [];
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...await walk(directory, absolute));
    else if (entry.isFile()) files.push(path.relative(directory, absolute).split(path.sep).join("/"));
    else errors.push(`${path.relative(root, absolute)}: non-regular engine entry`);
  }
  return files.sort();
}

for (const [file, expected] of Object.entries(lock.runtime)) {
  const content = await readFile(path.join(engineRoot, "runtime", file)).catch(() => undefined);
  if (!content || sha256(content) !== expected) errors.push(`engines/ruff-wasm/runtime/${file}: missing or changed`);
}
for (const [file, expected] of Object.entries(lock.notices)) {
  const content = await readFile(path.join(engineRoot, file)).catch(() => undefined);
  if (!content || sha256(content) !== expected) errors.push(`engines/ruff-wasm/${file}: missing or changed`);
}

const upstreamPackage = JSON.parse(await readFile(path.join(engineRoot, "UPSTREAM_PACKAGE.json"), "utf8"));
if (upstreamPackage.name !== "@astral-sh/ruff-wasm-nodejs" || upstreamPackage.version !== lock.package.version) {
  errors.push("The preserved upstream package identity does not match the lock");
}
for (const field of ["dependencies", "optionalDependencies", "peerDependencies", "scripts"]) {
  if (upstreamPackage[field] && Object.keys(upstreamPackage[field]).length) errors.push(`The upstream Ruff package unexpectedly declares ${field}`);
}
if (upstreamPackage.license !== "MIT") errors.push("The upstream Ruff package license is not MIT");

const glue = await readFile(path.join(engineRoot, "runtime", "ruff_wasm.js"), "utf8");
const requires = [...glue.matchAll(/require\((['"])(.*?)\1\)/gu)].map((match) => match[2]).sort();
if (JSON.stringify(requires) !== JSON.stringify(["fs"])) {
  errors.push(`The Ruff JavaScript glue imports unexpected modules: ${JSON.stringify(requires)}`);
}
if (!glue.includes("/ruff_wasm_bg.wasm")) errors.push("The Ruff JavaScript glue does not load its adjacent WebAssembly artifact");

const wasm = await readFile(path.join(engineRoot, "runtime", "ruff_wasm_bg.wasm"));
const module = new WebAssembly.Module(wasm);
const wasmImports = WebAssembly.Module.imports(module);
if (wasmImports.some((entry) => entry.module !== "./ruff_wasm_bg.js")) {
  errors.push("The Ruff WebAssembly module imports an unexpected capability module");
}
if (!WebAssembly.Module.exports(module).some((entry) => entry.name === "workspace_check" && entry.kind === "function")) {
  errors.push("The Ruff WebAssembly module does not export workspace_check");
}

const pluginRoots = [
  path.join(root, "platforms", "codex", "plugins", "friendly-adversary", "skills", "pr-review", "engines", "ruff-wasm"),
  path.join(root, "platforms", "claude-code", "plugins", "friendly-adversary", "skills", "pr-review", "engines", "ruff-wasm"),
];
const canonicalFiles = await walk(engineRoot);
for (const pluginRoot of pluginRoots) {
  const resolved = await realpath(pluginRoot).catch(() => undefined);
  if (!resolved) {
    errors.push(`${path.relative(root, pluginRoot)}: missing Ruff engine copy`);
    continue;
  }
  const pluginFiles = await walk(resolved);
  if (JSON.stringify(pluginFiles) !== JSON.stringify(canonicalFiles)) {
    errors.push(`${path.relative(root, pluginRoot)}: Ruff file set differs from canonical`);
    continue;
  }
  for (const relative of canonicalFiles) {
    const [canonical, copy] = await Promise.all([
      readFile(path.join(engineRoot, relative)),
      readFile(path.join(resolved, relative)),
    ]);
    if (!canonical.equals(copy)) errors.push(`${path.relative(root, pluginRoot)}/${relative}: differs from canonical`);
  }
}

const npmExecutable = process.platform === "win32" ? process.execPath : "npm";
const npmPrefix = process.platform === "win32"
  ? [process.env.npm_execpath ?? path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js")]
  : [];
const dryRun = execFileSync(npmExecutable, [...npmPrefix, "pack", "--dry-run", "--json", "--ignore-scripts"], {
  cwd: root,
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});
const packed = JSON.parse(dryRun)[0];
for (const required of [
  "engines/ruff-wasm/runtime/ruff_wasm.js",
  "engines/ruff-wasm/runtime/ruff_wasm_bg.wasm",
  "engines/ruff-wasm/LICENSE",
  "engines/ruff-wasm/upstream-lock.json",
]) {
  if (!packed.files.some((entry) => entry.path === required)) errors.push(`Packed artifact is missing ${required}`);
}
if (packed.files.some((entry) => /(?:^|\/)ruff(?:\.exe|\.node)?$/iu.test(entry.path))) {
  errors.push("Packed artifact contains a native Ruff executable or binding");
}

const toolsSource = await readFile(path.join(root, "src", "tools.ts"), "utf8");
for (const prohibited of ["trustedInvocation(input.repo, \"ruff\"", "uvx", "ruff@", "osv-scanner", "gitleaks", "pyright"]) {
  if (toolsSource.includes(prohibited)) errors.push(`src/tools.ts retains prohibited ambient analyzer integration: ${prohibited}`);
}
if (!toolsSource.includes('internal: "ruff-wasm"') || !toolsSource.includes("runRuffWasm")) {
  errors.push("src/tools.ts does not use the bundled Ruff WebAssembly engine");
}

const runner = await import(new URL("../dist/src/ruff-wasm.js", import.meta.url).href);
const result = await runner.runRuffWasm({
  timeoutMs: 20_000,
  files: [{ path: "verify.py", source: "import os\nprint(undefined_name)\n" }],
});
if (result.upstreamVersion !== lock.package.version || result.wasmSha256 !== lock.runtime["ruff_wasm_bg.wasm"] || result.glueSha256 !== lock.runtime["ruff_wasm.js"]) {
  errors.push("The executed Ruff runtime provenance does not match the lock");
}
if (!result.files[0]?.diagnostics.some((diagnostic) => diagnostic.code === "F821")) {
  errors.push("The executed Ruff runtime did not emit the expected Python diagnostic");
}

if (errors.length) {
  process.stderr.write(`Ruff runtime verification failed:\n${errors.map((error) => `- ${error}`).join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`${JSON.stringify({
    schemaVersion: 1,
    ruffVersion: lock.package.version,
    upstreamCommit: lock.upstream.commit,
    runtimeFiles: Object.keys(lock.runtime).length,
    wasmBytes: wasm.byteLength,
    wasmSha256: lock.runtime["ruff_wasm_bg.wasm"],
    glueSha256: lock.runtime["ruff_wasm.js"],
    pluginCopies: pluginRoots.length,
    nativeArtifacts: 0,
    runtimeDependencies: 0,
    runtimeNetworkAccess: false,
    status: "verified",
  }, null, 2)}\n`);
}
