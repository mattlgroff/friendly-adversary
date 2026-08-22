import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, readFile, readdir, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const engineRoot = path.join(root, "engines", "semgrep-wasm");
const manifest = JSON.parse(await readFile(path.join(engineRoot, "runtime-manifest.json"), "utf8"));
const upstreamLock = JSON.parse(await readFile(path.join(engineRoot, "upstream-lock.json"), "utf8"));
const errors = [];
const linkedLicenseDirectory = "engines/semgrep-wasm/source/licenses/opam-linked";
const linkedLicenseRoot = path.join(root, ...linkedLicenseDirectory.split("/"));

function sha256(content) {
  return createHash("sha256").update(content).digest("hex");
}

async function walk(directory, current = directory) {
  const files = [];
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...await walk(directory, absolute));
    else files.push(path.relative(directory, absolute).split(path.sep).join("/"));
  }
  return files.sort();
}

const expectedRuntimeFiles = manifest.files.map((entry) => entry.path.replace(/^runtime\//u, "")).sort();
const actualRuntimeFiles = await walk(path.join(engineRoot, "runtime"));
if (JSON.stringify(expectedRuntimeFiles) !== JSON.stringify(actualRuntimeFiles)) {
  errors.push(`Runtime file set differs from runtime-manifest.json: ${JSON.stringify(actualRuntimeFiles)}`);
}

for (const entry of manifest.files) {
  const file = path.join(engineRoot, ...entry.path.split("/"));
  const metadata = await lstat(file).catch(() => undefined);
  if (!metadata?.isFile() || metadata.isSymbolicLink()) {
    errors.push(`${entry.path}: missing, non-regular, or symbolic link`);
    continue;
  }
  const content = await readFile(file);
  if (content.byteLength !== entry.bytes) errors.push(`${entry.path}: ${content.byteLength} bytes, expected ${entry.bytes}`);
  if (sha256(content) !== entry.sha256) errors.push(`${entry.path}: SHA-256 does not match the manifest`);
  const extension = path.extname(entry.path);
  if (!new Set([".cjs", ".wasm"]).has(extension)) errors.push(`${entry.path}: runtime code must be JavaScript or WebAssembly`);
}

const pluginRoots = [
  path.join(root, "platforms", "codex", "plugins", "friendly-adversary", "skills", "pr-review", "engines", "semgrep-wasm"),
  path.join(root, "platforms", "claude-code", "plugins", "friendly-adversary", "skills", "pr-review", "engines", "semgrep-wasm"),
];
const canonicalFiles = await walk(engineRoot);
for (const pluginRoot of pluginRoots) {
  const resolved = await realpath(pluginRoot).catch(() => undefined);
  if (!resolved) {
    errors.push(`${path.relative(root, pluginRoot)}: missing engine copy`);
    continue;
  }
  const pluginFiles = await walk(resolved);
  if (JSON.stringify(pluginFiles) !== JSON.stringify(canonicalFiles)) {
    errors.push(`${path.relative(root, pluginRoot)}: engine file set differs from canonical`);
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
const packedFiles = new Set(packed.files.map((entry) => entry.path.replace(/^package\//u, "")));
for (const runtimeWasm of [
  "engines/semgrep-wasm/runtime/engine/semgrep-engine.wasm",
  "engines/semgrep-wasm/runtime/python/semgrep-parser.wasm",
  "engines/semgrep-wasm/runtime/typescript/semgrep-parser.wasm",
]) {
  const entry = packed.files.find((file) => file.path === runtimeWasm);
  if (!entry) errors.push(`Packed artifact is missing ${runtimeWasm}`);
  else if (entry.mode !== 0o644) errors.push(`Packed artifact gives ${runtimeWasm} mode ${entry.mode.toString(8)} instead of 644`);
}
const forbiddenExtensions = new Set([
  ".a", ".bc", ".cma", ".cmx", ".cmxa", ".dll", ".dylib", ".exe", ".o", ".obj", ".py", ".pyc", ".pyd", ".so", ".wasm.map",
]);
const nativeMagic = [
  ["ELF", Buffer.from([0x7f, 0x45, 0x4c, 0x46])],
  ["PE", Buffer.from([0x4d, 0x5a])],
  ["Mach-O", Buffer.from([0xfe, 0xed, 0xfa, 0xce])],
  ["Mach-O", Buffer.from([0xfe, 0xed, 0xfa, 0xcf])],
  ["Mach-O", Buffer.from([0xcf, 0xfa, 0xed, 0xfe])],
  ["Mach-O", Buffer.from([0xca, 0xfe, 0xba, 0xbe])],
];
for (const entry of packed.files) {
  const relative = entry.path.replace(/^package\//u, "");
  const extension = [...forbiddenExtensions].find((candidate) => relative.toLowerCase().endsWith(candidate));
  if (extension) errors.push(`${relative}: forbidden packaged artifact ${extension}`);
  const absolute = path.join(root, relative);
  const content = await readFile(absolute).catch(() => undefined);
  if (!content) continue;
  const magic = nativeMagic.find(([, prefix]) => content.subarray(0, prefix.length).equals(prefix));
  if (magic) errors.push(`${relative}: packaged ${magic[0]} native executable content`);
}

if (packed.files.some((entry) => /(^|\/)tests\/semgrep-rules\//u.test(entry.path))) {
  errors.push("The separately licensed Semgrep community rule pack is present in the package");
}
if (!packed.files.some((entry) => entry.path === "engines/semgrep-wasm/runtime/engine/semgrep-engine.wasm")) {
  errors.push("The packed npm file list does not contain the Semgrep engine WASM");
}

const toolsSource = await readFile(path.join(root, "src", "tools.ts"), "utf8");
for (const prohibited of ["semgrep==", "trustedExecutable(input.repo, \"semgrep\"", "PINNED.semgrep"]) {
  if (toolsSource.includes(prohibited)) errors.push(`src/tools.ts retains prohibited Semgrep fallback text: ${prohibited}`);
}
for (const required of ["--permission", "--allow-worker", "--allow-fs-read=", "--allow-fs-write=", "--max-old-space-size=8192"]) {
  if (!toolsSource.includes(required)) errors.push(`src/tools.ts is missing runtime boundary ${required}`);
}
const cliSource = await readFile(path.join(root, "src", "semgrep-wasm-cli.ts"), "utf8");
if (!cliSource.includes("disableNetworkAccess();")) errors.push("The Semgrep wrapper does not activate the network deny guard");
if (!cliSource.includes("const SEMGREP_WORKER_STACK_SIZE_MB = 4;")) errors.push("The Semgrep wrapper does not declare the certified 4 MiB worker stack");
if (!cliSource.includes("resourceLimits: { stackSizeMb: SEMGREP_WORKER_STACK_SIZE_MB }")) errors.push("The Semgrep wrapper does not isolate scans in a stack-sized worker");
if (!cliSource.includes("resourceLimits.stackSizeMb ?? 0")) errors.push("The Semgrep wrapper does not verify its effective worker stack limit");
if (!cliSource.includes("Unsupported target language")) errors.push("The Semgrep wrapper does not reject unsupported target languages");
if (!cliSource.includes("for (const target of languageTargets)")) errors.push("The Semgrep wrapper does not isolate engine calls by target");
if (!cliSource.includes("if (output.errors.length > 0) engine = await createEngine")) errors.push("The Semgrep wrapper does not replace a parser after target errors");
const outputContractSource = await readFile(path.join(root, "src", "semgrep-output.ts"), "utf8");
if (!outputContractSource.includes("output.errors.length > 0")) errors.push("The Semgrep output contract does not fail closed on scan errors");
if (!outputContractSource.includes("!scanned.has(file)")) errors.push("The Semgrep output contract does not fail closed on missing target coverage");
const networkGuardSource = await readFile(path.join(root, "src", "network-guard.ts"), "utf8");
for (const required of ["node:net", "node:dns", "node:http", "node:https", "node:dgram", "fetch"]) {
  if (!networkGuardSource.includes(required)) errors.push(`The network deny guard does not cover ${required}`);
}
const sourcePatch = await readFile(path.join(engineRoot, "source", "patches", "semgrep-1.172.0-wasm-port.patch"), "utf8");
const wasmMemoryCaps = [...sourcePatch.matchAll(/-sMAXIMUM_MEMORY=268435456/gu)].length;
if (wasmMemoryCaps !== 2) errors.push(`Expected engine and shared parser WASM memory caps, found ${wasmMemoryCaps}`);
const packageJson = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
if (packageJson.engines?.node !== ">=22.22.0") errors.push("package.json must require Node 22.22.0 or newer");
const linkedInventory = JSON.parse(await readFile(path.join(engineRoot, "source", "linked-components.json"), "utf8"));
const parserLicenseEvidence = JSON.parse(await readFile(path.join(engineRoot, "source", "generated-parser-license-evidence.json"), "utf8"));
const expectedParsers = new Map([
  ["semgrep-python", {
    sourceSubmodulePath: "languages/python/tree-sitter/semgrep-python",
    commit: "647a20f8207740b0a76541bb27e1eaaf111dca7e",
    grammarExtensionPath: "fyi/semgrep-grammars/src/semgrep-python/grammar.js",
    grammarExtensionGitBlobSha: "a4bf791e6eb22a36d2b2d4625d0e2e0fa41a38d8",
  }],
  ["semgrep-typescript", {
    sourceSubmodulePath: "languages/typescript/tree-sitter/semgrep-typescript",
    commit: "50fe6a5c46d3dee74d1d176b9767ffc520a1003e",
    grammarExtensionPath: "fyi/semgrep-grammars/src/semgrep-typescript/typescript/grammar.js",
    grammarExtensionGitBlobSha: "aabad764aea84334c2ffee1e24756bac3bd44010",
  }],
  ["semgrep-tsx", {
    sourceSubmodulePath: "languages/typescript/tree-sitter/semgrep-tsx",
    commit: "6005de74ed9e2fb891785a3df8582dbb91e272bc",
    grammarExtensionPath: "fyi/semgrep-grammars/src/semgrep-typescript/typescript/grammar.js",
    grammarExtensionGitBlobSha: "aabad764aea84334c2ffee1e24756bac3bd44010",
  }],
]);
if (linkedInventory.distributionLicense !== "GPL-3.0-only" || linkedInventory.releaseScope !== "public") {
  errors.push("The Semgrep linked inventory must retain the public GPL-3.0-only distribution boundary");
}
const linkedPackages = linkedInventory.linkedOcamlPackages ?? [];
const linkedPackagesWithLicenses = linkedPackages.filter((component) => Array.isArray(component.licenseFiles) && component.licenseFiles.length > 0);
if (linkedInventory.linkedLibraryCount !== 104
  || linkedInventory.linkedOcamlPackageCount !== 104
  || linkedInventory.linkedOcamlPackagesWithLicenseFiles !== 104
  || linkedPackages.length !== 104
  || linkedPackagesWithLicenses.length !== 104) {
  errors.push("The release link inventory does not contain the verified 104-library OPAM closure");
}
const linkedPackageNames = linkedPackages.map((component) => component.name);
const linkedPackageIdentities = linkedPackages.map((component) => `${component.name}@${component.version}`);
const linkedLibraries = linkedPackages.flatMap((component) => component.libraries ?? []);
const inventoryLicensePaths = linkedPackages.flatMap((component) => (component.licenseFiles ?? []).map((license) => license.path));
if (linkedPackageNames.some((name) => typeof name !== "string" || name.length === 0)
  || new Set(linkedPackageNames).size !== 104) {
  errors.push("The release link inventory must contain 104 unique non-empty OPAM package names");
}
if (linkedPackages.some((component) => typeof component.version !== "string" || component.version.length === 0)
  || new Set(linkedPackageIdentities).size !== 104) {
  errors.push("The release link inventory must contain 104 unique name@version identities");
}
if (linkedLibraries.length !== 104
  || new Set(linkedLibraries).size !== 104
  || linkedLibraries.some((library) => typeof library !== "string" || library.length === 0)) {
  errors.push("The release link inventory must contain exactly 104 unique non-empty linked libraries");
}
if (inventoryLicensePaths.length !== 104
  || new Set(inventoryLicensePaths).size !== 104
  || inventoryLicensePaths.some((licensePath) => typeof licensePath !== "string" || licensePath.length === 0)) {
  errors.push("The release link inventory must contain exactly 104 unique component-bound license paths");
}
let linkedLicenseFiles = 0;
const linkedLicenseRootMetadata = await lstat(linkedLicenseRoot).catch(() => undefined);
const linkedLicenseRootReal = await realpath(linkedLicenseRoot).catch(() => undefined);
if (!linkedLicenseRootMetadata?.isDirectory() || linkedLicenseRootMetadata.isSymbolicLink() || !linkedLicenseRootReal) {
  errors.push(`${linkedLicenseDirectory}: missing, non-directory, or symbolic link`);
}
const compatibleLinkedSelections = new Set([
  "BSD-3-Clause",
  "GPL-3.0-only",
  "ISC",
  "LGPL-2.0-only WITH OCaml-LGPL-linking-exception",
  "LGPL-2.1-only",
  "LGPL-2.1-only WITH OCaml-LGPL-linking-exception",
  "LGPL-3.0-only WITH OCaml-LGPL-linking-exception",
  "MIT",
]);
for (const component of linkedPackages) {
  if (!Array.isArray(component.libraries) || component.libraries.length !== 1) {
    errors.push(`Linked OPAM package ${component.name} must own exactly one linked library`);
  }
  for (const license of component.licenses ?? []) {
    const selected = linkedInventory.linkedLicenseSelections?.[license];
    if (!compatibleLinkedSelections.has(selected)) errors.push(`Linked OPAM package ${component.name} has no recorded GPL-3.0-compatible selection for ${license}`);
  }
  if (!Array.isArray(component.licenseFiles) || component.licenseFiles.length !== 1) {
    errors.push(`Linked OPAM package ${component.name} must own exactly one packaged license file`);
    continue;
  }
  if (!path.posix.basename(component.licenseFiles[0].path ?? "").startsWith(`${component.name}--`)) {
    errors.push(`Linked OPAM package ${component.name} has a license path not bound to its component name`);
  }
  for (const license of component.licenseFiles) {
    linkedLicenseFiles += 1;
    const relative = license.path;
    const normalized = typeof relative === "string" ? path.posix.normalize(relative) : undefined;
    if (!normalized
      || normalized !== relative
      || relative.includes("\\")
      || !relative.startsWith(`${linkedLicenseDirectory}/`)) {
      errors.push(`${String(relative)}: linked license path is not normalized under ${linkedLicenseDirectory}`);
      continue;
    }
    const absolute = path.resolve(root, ...relative.split("/"));
    const metadata = await lstat(absolute).catch(() => undefined);
    const resolved = await realpath(absolute).catch(() => undefined);
    const fromLicenseRoot = linkedLicenseRootReal && resolved ? path.relative(linkedLicenseRootReal, resolved) : undefined;
    if (!metadata?.isFile()
      || metadata.isSymbolicLink()
      || !resolved
      || !fromLicenseRoot
      || fromLicenseRoot.startsWith(`..${path.sep}`)
      || path.isAbsolute(fromLicenseRoot)) {
      errors.push(`${relative}: linked license file is missing, non-regular, symbolic, or outside ${linkedLicenseDirectory}`);
      continue;
    }
    if (!packedFiles.has(relative)) {
      errors.push(`${relative}: linked license file is absent from the npm pack manifest`);
      continue;
    }
    const content = await readFile(absolute).catch(() => undefined);
    if (!content || sha256(content) !== license.sha256) errors.push(`${relative}: linked license file is missing or changed`);
  }
}
const compatibleDirectLicenses = new Set([
  "BSD-3-Clause",
  "GPL-3.0-only",
  "LGPL-2.1-only",
  "LGPL-2.1-only WITH OCaml-LGPL-linking-exception",
  "MIT",
  "MIT AND NCSA",
]);
for (const component of linkedInventory.additionalRuntimeComponents ?? []) {
  if (component.license !== component.selectedLicense || !compatibleDirectLicenses.has(component.selectedLicense)) {
    errors.push(`Runtime component ${component.name} has no exact GPL-3.0-compatible license selection`);
  }
}
for (const required of [
  "EMSCRIPTEN-LICENSE.txt",
  "ESBUILD-MIT.txt",
  "GENERATED-PARSERS-GPL-3.0.txt",
  "LIBYAML-MIT.txt",
  "MUSL-COPYRIGHT.txt",
  "OCAML-TREE-SITTER-LGPL.txt",
  "PCRE2-BSD.txt",
  "SEMGREP-LGPL-2.1.txt",
  "TREE-SITTER-MIT.txt",
  "TREE-SITTER-UNICODE.txt",
]) {
  const metadata = await lstat(path.join(engineRoot, "source", "licenses", required)).catch(() => undefined);
  if (!metadata?.isFile()) errors.push(`Missing direct runtime license notice ${required}`);
}
if (parserLicenseEvidence.distributionLicense !== "GPL-3.0-only"
  || parserLicenseEvidence.releaseScope !== "public"
  || parserLicenseEvidence.publicDistribution?.allowed !== true) {
  errors.push("Generated-parser evidence must retain the public GPL-3.0-only release decision");
}
if (!Array.isArray(parserLicenseEvidence.generatedParsers) || parserLicenseEvidence.generatedParsers.length !== 3) {
  errors.push("Generated-parser evidence must cover Python, TypeScript, and TSX");
} else {
  const seenParsers = new Set();
  for (const parser of parserLicenseEvidence.generatedParsers) {
    const expected = expectedParsers.get(parser.name);
    if (!expected || seenParsers.has(parser.name)) errors.push(`${parser.name}: unexpected or duplicate generated-parser identity`);
    else if (parser.sourceSubmodulePath !== expected.sourceSubmodulePath
      || parser.commit !== expected.commit
      || parser.grammarExtensionPath !== expected.grammarExtensionPath
      || parser.grammarExtensionGitBlobSha !== expected.grammarExtensionGitBlobSha) {
      errors.push(`${parser.name}: source identity or grammar provenance differs from the pinned parser set`);
    }
    seenParsers.add(parser.name);
    const lockedSubmodule = upstreamLock.requiredSubmodules.find((entry) => entry.path === parser.sourceSubmodulePath);
    if (lockedSubmodule?.commit !== parser.commit) errors.push(`${parser.name}: provenance commit differs from upstream-lock.json`);
    if (parser.repositoryLicense !== "NOASSERTION" || parser.distributionLicense !== "GPL-3.0-only") {
      errors.push(`${parser.name}: license classification changed`);
    }
    for (const output of parser.runtimeOutputs ?? []) {
      const lockedOutput = manifest.files.find((entry) => entry.path === output.path);
      if (lockedOutput?.sha256 !== output.sha256) errors.push(`${parser.name}: runtime output evidence differs for ${output.path}`);
    }
  }
  for (const name of expectedParsers.keys()) if (!seenParsers.has(name)) errors.push(`${name}: generated-parser evidence is missing`);
}
const parserInventory = (linkedInventory.additionalRuntimeComponents ?? []).filter((entry) => entry.name?.includes("generated parser"));
const expectedInventoryParsers = new Map([...expectedParsers].map(([name, expected]) => [`${name} generated parser`, expected.commit]));
const seenInventoryParsers = new Set();
for (const parser of parserInventory) {
  if (!expectedInventoryParsers.has(parser.name) || seenInventoryParsers.has(parser.name) || parser.version !== expectedInventoryParsers.get(parser.name)) {
    errors.push(`${parser.name}: unexpected, duplicate, or mismatched linked parser inventory record`);
  }
  seenInventoryParsers.add(parser.name);
}
if (parserInventory.length !== 3) errors.push("Linked inventory must contain exactly three generated parsers");
for (const name of expectedInventoryParsers.keys()) if (!seenInventoryParsers.has(name)) errors.push(`${name}: linked parser inventory record is missing`);
for (const runtimeFile of actualRuntimeFiles.filter((file) => file.endsWith(".cjs"))) {
  const content = await readFile(path.join(engineRoot, "runtime", runtimeFile), "utf8");
  if (content.includes("cross-dirname")) errors.push(`${runtimeFile}: retains the removed path-unsafe cross-dirname dependency`);
}

if (errors.length) {
  process.stderr.write(`Semgrep runtime verification failed:\n${errors.map((error) => `- ${error}`).join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`${JSON.stringify({
    schemaVersion: 1,
    semgrepVersion: manifest.semgrepVersion,
    runtimeFiles: actualRuntimeFiles.length,
    packedFiles: packed.files.length,
    packedBytes: packed.size,
    pluginCopies: pluginRoots.length,
    nativeArtifacts: 0,
    communityRulesBundled: false,
    nodePermissionModel: true,
    networkGuard: true,
    v8HeapLimitMiB: 8192,
    v8WorkerStackLimitMiB: 4,
    wasmModuleLimitMiB: 256,
    maximumLoadedWasmModules: 3,
    linkedOcamlPackages: linkedInventory.linkedOcamlPackageCount,
    linkedLicenseFiles,
    generatedParserLicenses: 3,
    upstreamParserRootLicensesMissing: 3,
    distributionLicense: linkedInventory.distributionLicense,
    releaseScope: linkedInventory.releaseScope,
    publicPublicationBlocked: false,
    status: "verified",
  }, null, 2)}\n`);
}
