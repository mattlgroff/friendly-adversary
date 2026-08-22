import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { access, chmod, lstat, mkdtemp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const temporary = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-pack-"));
const semgrepLicenseDirectory = "engines/semgrep-wasm/source/licenses";
const linkedComponentsInventory = "engines/semgrep-wasm/source/linked-components.json";
const requiredInstalledComplianceFiles = [
  "LICENSE",
  "LICENSING.md",
  "scripts/enforce-public-release.mjs",
  "engines/semgrep-wasm/source/generated-parser-license-evidence.json",
  "engines/semgrep-wasm/source/corresponding-source-manifest.json",
  linkedComponentsInventory,
  ...[
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
  ].map((file) => `${semgrepLicenseDirectory}/${file}`),
];

function run(command, args, cwd, options = {}) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...options,
  }).trim();
}

function runNpm(args, cwd, options = {}) {
  if (process.platform !== "win32") return run("npm", args, cwd, options);
  const npmCli = process.env.npm_execpath
    ?? path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
  return run(process.execPath, [npmCli, ...args], cwd, options);
}

async function installAnalyzerTripwires(target) {
  const directory = `${target}-tripwire`;
  await mkdir(directory, { recursive: true });
  const markers = {};
  for (const analyzer of ["oxlint", "ruff", "rg"]) {
    const marker = path.join(directory, `native-${analyzer}-was-invoked`);
    const implementation = path.join(directory, `${analyzer}-tripwire.mjs`);
    markers[analyzer] = marker;
    await writeFile(
      implementation,
      `import { writeFileSync } from "node:fs";\nwriteFileSync(${JSON.stringify(marker)}, "invoked\\n");\nprocess.stderr.write(${JSON.stringify(`native ${analyzer} tripwire invoked\n`)});\nprocess.exit(97);\n`,
    );
    if (process.platform === "win32") {
      await writeFile(
        path.join(directory, `${analyzer}.cmd`),
        `@echo off\r\n"${process.execPath.replaceAll('"', '""')}" "${implementation.replaceAll('"', '""')}" %*\r\n`,
      );
    } else {
      const executable = path.join(directory, analyzer);
      await writeFile(executable, `#!${process.execPath}\nimport ${JSON.stringify(implementation)};\n`);
      await chmod(executable, 0o755);
    }
  }
  const codexInvocation = path.join(directory, "codex-invocation.json");
  const codexImplementation = path.join(directory, "codex-smoke.mjs");
  await writeFile(codexImplementation, `import { writeFileSync } from "node:fs";
const args = process.argv.slice(2);
if (args.length === 1 && args[0] === "--version") {
  process.stdout.write("codex-cli smoke-test\\n");
  process.exit(0);
}
const outputFlag = args.indexOf("--output-last-message");
if (outputFlag < 0 || !args[outputFlag + 1]) process.exit(98);
writeFileSync(args[outputFlag + 1], "# No supported findings\\n\\nPacked smoke Codex fixture inspected the pinned evidence.\\n");
writeFileSync(${JSON.stringify(codexInvocation)}, JSON.stringify(args));
`);
  if (process.platform === "win32") {
    await writeFile(path.join(directory, "codex.cmd"), `@echo off\r\n"${process.execPath.replaceAll('"', '""')}" "${codexImplementation.replaceAll('"', '""')}" %*\r\n`);
  } else {
    const codex = path.join(directory, "codex");
    await writeFile(codex, `#!${process.execPath}\nimport ${JSON.stringify(codexImplementation)};\n`);
    await chmod(codex, 0o755);
  }
  return {
    markers,
    codexInvocation,
    path: `${directory}${path.delimiter}${process.env.PATH ?? ""}`,
  };
}

function forbiddenPackageEntries(entries) {
  return entries.filter((entry) => entry.endsWith(".node")
    || entry.includes("node_modules/")
    || /(?:^|\/)(?:oxlint|ruff|rg)(?:\.exe)?$/u.test(entry));
}

function hasNativeExecutableSignature(bytes) {
  const prefix = bytes.subarray(0, 4).toString("hex");
  return bytes.subarray(0, 4).equals(Buffer.from([0x7f, 0x45, 0x4c, 0x46]))
    || bytes.subarray(0, 2).equals(Buffer.from("MZ"))
    || bytes.subarray(0, 8).equals(Buffer.from("!<arch>\n"))
    || bytes.subarray(0, 4).equals(Buffer.from([0x42, 0x43, 0xc0, 0xde]))
    || ["feedface", "feedfacf", "cefaedfe", "cffaedfe", "cafebabe", "cafebabf"].includes(prefix);
}

async function verifyInstalledPackage(packageRoot) {
  const entries = (await readdir(packageRoot, { recursive: true }))
    .map((entry) => entry.split(path.sep).join("/"));
  const files = [];
  for (const entry of entries) {
    if ((await lstat(path.join(packageRoot, ...entry.split("/")))).isFile()) files.push(entry);
  }
  const fileSet = new Set(files);
  if (!fileSet.has("wasm/oxlint/engine.wasm")) {
    throw new Error("Installed artifact is missing the Oxlint WebAssembly engine");
  }
  if (!fileSet.has("engines/ruff-wasm/runtime/ruff_wasm_bg.wasm")) {
    throw new Error("Installed artifact is missing the Ruff WebAssembly engine");
  }
  const missingComplianceFiles = requiredInstalledComplianceFiles.filter((file) => !fileSet.has(file));
  if (missingComplianceFiles.length) {
    throw new Error(`Installed artifact is missing required compliance files: ${missingComplianceFiles.join(", ")}`);
  }
  for (const relative of requiredInstalledComplianceFiles) {
    const [trusted, installed] = await Promise.all([
      readFile(path.join(root, ...relative.split("/"))),
      readFile(path.join(packageRoot, ...relative.split("/"))),
    ]);
    if (!installed.equals(trusted)) {
      throw new Error(`Installed artifact compliance file differs from the trusted repository bytes: ${relative}`);
    }
  }
  let linkedInventory;
  try {
    linkedInventory = JSON.parse(await readFile(path.join(packageRoot, ...linkedComponentsInventory.split("/")), "utf8"));
  } catch (error) {
    throw new Error(`Installed artifact has an invalid linked-components inventory: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!Array.isArray(linkedInventory.linkedOcamlPackages)) {
    throw new Error("Installed artifact linked-components inventory has no linkedOcamlPackages array");
  }
  const trustedInventory = await readFile(path.join(root, ...linkedComponentsInventory.split("/")));
  const installedInventory = await readFile(path.join(packageRoot, ...linkedComponentsInventory.split("/")));
  if (!installedInventory.equals(trustedInventory)) {
    throw new Error("Installed artifact linked-components inventory differs from the trusted repository inventory");
  }
  const sourceManifestPath = "engines/semgrep-wasm/source/corresponding-source-manifest.json";
  const [trustedSourceManifest, installedSourceManifest] = await Promise.all([
    readFile(path.join(root, ...sourceManifestPath.split("/"))),
    readFile(path.join(packageRoot, ...sourceManifestPath.split("/"))),
  ]);
  if (!installedSourceManifest.equals(trustedSourceManifest)) {
    throw new Error("Installed artifact corresponding-source manifest differs from the trusted repository contract");
  }
  if (linkedInventory.linkedLibraryCount !== 104
    || linkedInventory.linkedOcamlPackageCount !== 104
    || linkedInventory.linkedOcamlPackagesWithLicenseFiles !== 104
    || linkedInventory.linkedOcamlPackages.length !== 104) {
    throw new Error("Installed artifact does not contain the complete 104-package linked closure");
  }
  const packageNames = linkedInventory.linkedOcamlPackages.map((component) => component.name);
  const packageIdentities = linkedInventory.linkedOcamlPackages.map((component) => `${component.name}@${component.version}`);
  const linkedLibraries = linkedInventory.linkedOcamlPackages.flatMap((component) => component.libraries ?? []);
  if (new Set(packageNames).size !== 104 || new Set(packageIdentities).size !== 104) {
    throw new Error("Installed artifact linked closure contains duplicate package identities");
  }
  if (linkedLibraries.length !== 104 || new Set(linkedLibraries).size !== 104) {
    throw new Error("Installed artifact linked closure does not contain 104 unique libraries");
  }
  const linkedLicensePrefix = `${semgrepLicenseDirectory}/opam-linked/`;
  const linkedLicensePaths = [];
  for (const component of linkedInventory.linkedOcamlPackages) {
    if (!Array.isArray(component?.libraries) || component.libraries.length !== 1) {
      throw new Error(`Installed artifact linked component ${JSON.stringify(component?.name ?? "unknown")} must own exactly one library`);
    }
    if (!Array.isArray(component?.licenseFiles) || component.licenseFiles.length !== 1) {
      throw new Error(`Installed artifact linked component ${JSON.stringify(component?.name ?? "unknown")} must own exactly one license file`);
    }
    if (!path.posix.basename(component.licenseFiles[0].path ?? "").startsWith(`${component.name}--`)) {
      throw new Error(`Installed artifact linked component ${JSON.stringify(component?.name ?? "unknown")} has a license path not bound to its name`);
    }
    for (const license of component.licenseFiles) {
      if (typeof license?.path !== "string"
        || !license.path.startsWith(linkedLicensePrefix)
        || license.path.split("/").includes("..")) {
        throw new Error(`Installed artifact linked component ${JSON.stringify(component?.name ?? "unknown")} has an invalid license path`);
      }
      if (!/^[a-f0-9]{64}$/u.test(license.sha256 ?? "")) {
        throw new Error(`Installed artifact linked component ${JSON.stringify(component?.name ?? "unknown")} has an invalid license digest`);
      }
      linkedLicensePaths.push(license.path);
    }
  }
  if (linkedLicensePaths.length !== 104 || new Set(linkedLicensePaths).size !== 104) {
    throw new Error("Installed artifact linked closure does not contain 104 unique component-bound license paths");
  }
  const missingLinkedLicenses = linkedLicensePaths.filter((file) => !fileSet.has(file));
  if (missingLinkedLicenses.length) {
    throw new Error(`Installed artifact is missing linked-component license files: ${missingLinkedLicenses.join(", ")}`);
  }
  for (const component of linkedInventory.linkedOcamlPackages) {
    const license = component.licenseFiles[0];
    const content = await readFile(path.join(packageRoot, ...license.path.split("/")));
    const digest = createHash("sha256").update(content).digest("hex");
    if (digest !== license.sha256) {
      throw new Error(`Installed artifact linked license differs from its trusted digest: ${license.path}`);
    }
  }
  const forbidden = forbiddenPackageEntries(files);
  if (forbidden.length) throw new Error(`Installed artifact contains a native analyzer path: ${forbidden.join(", ")}`);
  for (const file of files) {
    if (file.endsWith(".wasm")) continue;
    if (hasNativeExecutableSignature(await readFile(path.join(packageRoot, ...file.split("/"))))) {
      throw new Error(`Installed artifact contains a native executable signature: ${file}`);
    }
  }
}

async function targetFixture(name, file, initial, changed, expectedRule, tarball) {
  const target = path.join(temporary, name);
  const extension = path.extname(file);
  const changedFiles = [`committed${extension}`, `staged${extension}`, `unstaged${extension}`, `untracked${extension}`];
  await mkdir(target, { recursive: true });
  run("git", ["init", "-b", "main"], target);
  run("git", ["config", "user.email", "fixture@example.com"], target);
  run("git", ["config", "user.name", "Fixture"], target);
  for (const tracked of changedFiles.slice(0, 3)) await writeFile(path.join(target, tracked), initial);
  await writeFile(path.join(target, "package.json"), "{\"private\":true}\n");
  await writeFile(path.join(target, ".gitignore"), "node_modules/\n.venv/\n.npm-cache/\n.friendly-adversary/\n");
  run("git", ["add", "."], target);
  run("git", ["commit", "-m", "base"], target);
  run("git", ["switch", "-c", "feature"], target);
  await writeFile(path.join(target, changedFiles[0]), changed);
  run("git", ["add", changedFiles[0]], target);
  run("git", ["commit", "-m", "committed change"], target);
  await writeFile(path.join(target, changedFiles[1]), changed);
  run("git", ["add", changedFiles[1]], target);
  await writeFile(path.join(target, changedFiles[2]), changed);
  await writeFile(path.join(target, changedFiles[3]), changed);
  const npmCache = path.join(target, ".npm-cache");
  await mkdir(npmCache, { recursive: true });
  const offlineEnvironment = {
    ...process.env,
    npm_config_cache: npmCache,
    npm_config_offline: "true",
    npm_config_audit: "false",
    npm_config_fund: "false",
    npm_config_update_notifier: "false",
  };
  runNpm(["install", "--dry-run=false", "--offline", "--ignore-scripts", "--no-audit", "--no-fund", "--no-save", "--package-lock=false", tarball], target, { env: offlineEnvironment });
  await verifyInstalledPackage(path.join(target, "node_modules", "friendly-adversary"));
  const tripwire = await installAnalyzerTripwires(target);
  offlineEnvironment.PATH = tripwire.path;
  const cli = path.join(target, "node_modules", "friendly-adversary", "dist", "src", "cli.js");
  const authority = JSON.parse(run(
    process.execPath,
    [cli, "review", "--host", "codex", "--repo", target, "--base", "main", "--lenses", "correctness"],
    target,
    { env: offlineEnvironment },
  ));
  const runDirectory = authority.run_directory;
  if (!Array.isArray(authority.lenses) || authority.lenses.length !== 1 || authority.lenses[0]?.lens_id !== "correctness") {
    throw new Error(`${name} packed CLI did not execute the selected Codex lens`);
  }
  const codexArgs = JSON.parse(await readFile(tripwire.codexInvocation, "utf8"));
  for (const required of ["gpt-5.6-luna", 'model_reasoning_effort="high"', 'service_tier="fast"', "read-only", "--ephemeral", "--ignore-user-config"]) {
    if (!codexArgs.includes(required)) throw new Error(`${name} packed Codex lens omitted ${required}`);
  }
  const receipt = JSON.parse(await readFile(path.join(runDirectory, "receipt.json"), "utf8"));
  if (JSON.stringify(receipt.changedFiles) !== JSON.stringify([...changedFiles].sort())) {
    throw new Error(`${name} packed CLI did not capture all four Git states`);
  }
  if (receipt.status !== "collected" && receipt.status !== "incomplete") {
    throw new Error(`${name} packed CLI collection was ${receipt.status}`);
  }
  await assertMissing(tripwire.markers.oxlint, `Packed ${name} review invoked a native Oxlint binary`);
  await assertMissing(tripwire.markers.ruff, `Packed ${name} review invoked a native Ruff binary`);
  await assertMissing(tripwire.markers.rg, `Packed ${name} review invoked a native ripgrep binary`);
  const ripgrep = receipt.toolRuns.find((tool) => tool.name === "repository-file-index");
  if (ripgrep?.status !== "completed") {
    const stderr = await readFile(path.join(runDirectory, "deterministic", "repository-file-index", "stderr.txt"), "utf8").catch(() => "<missing stderr>");
    throw new Error(`${name} packed ripgrep run was not completed: ${JSON.stringify(ripgrep)} stderr=${JSON.stringify(stderr)}`);
  }
  const ripgrepVersion = await readFile(path.join(runDirectory, "deterministic", "repository-file-index", "version.txt"), "utf8");
  const ripgrepFiles = await readFile(path.join(runDirectory, "deterministic", "repository-file-index", "stdout.txt"), "utf8");
  const indexedFiles = new Set(ripgrepFiles.split(/\r?\n/u).filter(Boolean));
  if (!/^ripgrep 15\.2\.0\b/u.test(ripgrepVersion)
    || changedFiles.some((changedFile) => !indexedFiles.has(changedFile))) {
    throw new Error(`${name} packed ripgrep output or provenance was incomplete`);
  }
  if (!file.endsWith(".py")) {
    const metadata = JSON.parse(await readFile(path.join(runDirectory, "deterministic", "oxlint-wasm", "metadata.json"), "utf8"));
    const stdout = await readFile(path.join(runDirectory, "deterministic", "oxlint-wasm", "stdout.json"), "utf8");
    if (!stdout.trim()) {
      const stderr = await readFile(path.join(runDirectory, "deterministic", "oxlint-wasm", "stderr.txt"), "utf8");
      throw new Error(`Packed TypeScript WebAssembly output was empty: ${JSON.stringify({ metadata, stderr })}`);
    }
    const nativeOutput = JSON.parse(stdout);
    if (metadata.nativeExecutable !== false || metadata.upstreamVersion !== "1.76.0") {
      throw new Error("Packed TypeScript review did not record the pinned WebAssembly engine provenance");
    }
    if (nativeOutput.engine !== "friendly-adversary-oxlint-wasm" || nativeOutput.files.length !== changedFiles.length) {
      throw new Error("Packed TypeScript review did not analyze every changed file through WebAssembly");
    }
  } else {
    const ruff = receipt.toolRuns.find((tool) => tool.name === "ruff-wasm");
    if (ruff?.status !== "completed") {
      const stderr = await readFile(path.join(runDirectory, "deterministic", "ruff-wasm", "stderr.txt"), "utf8").catch(() => "<missing stderr>");
      throw new Error(`Packed Python Ruff run was not completed: ${JSON.stringify(ruff)} stderr=${JSON.stringify(stderr)}`);
    }
    const metadata = JSON.parse(await readFile(path.join(runDirectory, "deterministic", "ruff-wasm", "metadata.json"), "utf8"));
    const output = JSON.parse(await readFile(path.join(runDirectory, "deterministic", "ruff-wasm", "stdout.json"), "utf8"));
    if (metadata.nativeExecutable !== false || metadata.upstreamVersion !== "0.16.2") {
      throw new Error("Packed Python review did not record the pinned Ruff WebAssembly provenance");
    }
    if (output.engine !== "friendly-adversary-ruff-wasm" || output.files.length !== changedFiles.length) {
      throw new Error("Packed Python review did not analyze every changed file through Ruff WebAssembly");
    }
    if (!output.files.every((result) => result.status === "ok" && result.diagnostics.length > 0)) {
      throw new Error(`Packed Python Ruff output was incomplete: ${JSON.stringify(output.files)}`);
    }
  }
  const semgrep = receipt.toolRuns.find((tool) => tool.name === "semgrep");
  if (semgrep?.status !== "completed") {
    const stderr = await readFile(path.join(runDirectory, "deterministic", "semgrep", "stderr.txt"), "utf8").catch(() => "<missing stderr>");
    throw new Error(`${name} packed Semgrep run was not completed: ${JSON.stringify(semgrep)} stderr=${JSON.stringify(stderr)}`);
  }
  const output = JSON.parse(await readFile(path.join(runDirectory, "deterministic", "semgrep", "stdout.json"), "utf8"));
  if (output.version !== "1.172.0") throw new Error(`${name} packed Semgrep version was ${JSON.stringify(output.version)}`);
  if (output.errors.length !== 0) throw new Error(`${name} packed Semgrep emitted errors: ${JSON.stringify(output.errors)}`);
  const resultPaths = output.results.map((result) => result.path).sort();
  if (output.results.length !== changedFiles.length
    || output.results.some((result) => result.check_id !== expectedRule)
    || JSON.stringify(resultPaths) !== JSON.stringify([...changedFiles].sort())) {
    throw new Error(`${name} packed Semgrep findings differed: ${JSON.stringify(output.results)}`);
  }
  const argv = JSON.parse(await readFile(path.join(runDirectory, "deterministic", "semgrep", "argv.json"), "utf8"));
  if (!argv.includes("--permission") || !argv.some((value) => value.startsWith("--allow-fs-read=")) || !argv.some((value) => value.startsWith("--allow-fs-write="))) {
    throw new Error(`${name} packed Semgrep process did not enable the filesystem permission boundary`);
  }
  const mcp = path.join(target, "node_modules", "friendly-adversary", "dist", "mcp", "friendly-adversary-mcp.cjs");
  const incomplete = receipt.incompleteReasons.length
    ? `<!-- friendly-adversary:incomplete-status -->\n\n## Required coverage gaps\n\n${receipt.incompleteReasons.map((reason) => `- ${reason}`).join("\n")}\n\n`
    : "";
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["--permission", "--allow-fs-read=*", "--allow-fs-write=*", "--no-addons", mcp],
    cwd: target,
    env: { ...offlineEnvironment, NODE_OPTIONS: "", NODE_PATH: "" },
    stderr: "pipe",
  });
  const client = new Client({ name: "packed-smoke", version: "1" });
  try {
    await client.connect(transport);
    const calls = [await client.callTool({ name: "record_artifact", arguments: { operation: "complete", workflow: "pr-review", authority_id: authority.authority_id, write_capability: authority.outcome_capability, artifacts: [{ relative_path: "adjudication.md", markdown: "# Adjudication\n\nNo claims." }, { relative_path: "report.md", markdown: `# Report\n\n${incomplete}No confirmed findings.` }] } })];
    if (calls.some((response) => response.isError)) throw new Error(`Packed ${name} MCP persistence returned an error`);
  } finally {
    await client.close();
  }
  const sealedDirectory = run(process.execPath, [cli, "seal", "--run", runDirectory], target).trim();
  const verification = JSON.parse(run(process.execPath, [cli, "verify", "--run", sealedDirectory], target));
  if (verification.valid !== true) throw new Error(`${name} packed CLI verification failed`);
}

async function assertMissing(file, message) {
  try {
    await access(file);
  } catch {
    return;
  }
  throw new Error(message);
}

try {
  if (process.argv.length > 3) throw new Error("Usage: node scripts/smoke-pack.mjs [artifact.tgz]");
  let tarball = process.argv[2] ? path.resolve(process.argv[2]) : undefined;
  if (tarball) {
    await access(tarball);
  } else {
    const packed = JSON.parse(runNpm(["pack", "--ignore-scripts", "--dry-run=false", "--json", "--pack-destination", temporary], root));
    const result = packed[0];
    if (!result?.filename || !Array.isArray(result.files)) throw new Error("npm pack did not return its artifact manifest");
    tarball = path.join(temporary, result.filename);
    const entries = result.files.map((entry) => entry.path);
    if (!entries.includes("wasm/oxlint/engine.wasm")) throw new Error("Packed artifact is missing the Oxlint WebAssembly engine");
    if (!entries.includes("engines/semgrep-wasm/runtime/engine/semgrep-engine.wasm")) throw new Error("Packed artifact is missing the Semgrep WebAssembly engine");
    if (!entries.includes("engines/ruff-wasm/runtime/ruff_wasm_bg.wasm")) throw new Error("Packed artifact is missing the Ruff WebAssembly engine");
    if (!entries.includes("engines/ripgrep-wasm/runtime/rg.wasm")) throw new Error("Packed artifact is missing the ripgrep WebAssembly engine");
    if (!entries.includes("engines/ripgrep-wasm/source/ripgrep-15.2.0-source.tar.gz")) throw new Error("Packed artifact is missing the ripgrep source archive");
    if (!entries.includes("engines/ripgrep-wasm/SHA256SUMS")) throw new Error("Packed artifact is missing the ripgrep distribution manifest");
    if (!entries.includes("engines/ruff-wasm/LICENSE")) throw new Error("Packed artifact is missing the Ruff MIT license");
    if (!entries.includes("engines/ruff-wasm/upstream-lock.json")) throw new Error("Packed artifact is missing the Ruff artifact lock");
    if (!entries.includes("engines/semgrep-wasm/source/licenses/SEMGREP-LGPL-2.1.txt")) throw new Error("Packed artifact is missing the Semgrep LGPL license");
    if (!entries.includes("third-party/oxlint-wasm/NOTICE.md")) throw new Error("Packed artifact is missing the Oxlint third-party notice");
    const forbidden = forbiddenPackageEntries(entries);
    if (forbidden.length) throw new Error(`Packed artifact contains a native analyzer path: ${forbidden.join(", ")}`);
  }
  await targetFixture(
    "typescript target",
    "app.ts",
    "export const value = 1;\n",
    "const input = process.argv[2];\neval(input);\n",
    "friendly-adversary.javascript.dynamic-code-execution",
    tarball,
  );
  await targetFixture(
    "python target",
    "app.py",
    "value = 1\n",
    "value = undefined_name\neval(input())\n",
    "friendly-adversary.python.dynamic-code-execution",
    tarball,
  );
  process.stdout.write("Offline packed CLI scan passed for TypeScript and Python targets with all four embedded WebAssembly analyzers.\n");
} finally {
  await rm(temporary, { recursive: true, force: true });
}
