import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { closeSync, mkdtempSync, openSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { WASI } from "node:wasi";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const upstreamCommit = "65fe65d8429e1d1bdf86c517ff08bd119ee87660";
const expectedTestCount = 1175;
const expectedRuleCount = 847;
const expectedCertifiedRuleCount = 96;
const expectedCertifiedTestCount = 147;
const expectedRuleSnapshotCount = 825;
const expectedCliFixtureCount = 306;
const expectedCliSnapshotCount = 186;
const upstreamIgnoredTest = "rules::eslint::no_use_before_define::test";

function argumentsMap(argv) {
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!flag?.startsWith("--") || value === undefined) throw new Error("Expected --name value arguments");
    values.set(flag.slice(2), value);
  }
  return values;
}

function run(command, args, cwd = root) {
  return execFileSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

function runRaw(command, args, cwd = root) {
  return execFileSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function wasmInventory(wasmPath) {
  const bytes = readFileSync(wasmPath);
  const module = new WebAssembly.Module(bytes);
  const wasi = new WASI({ version: "preview1", args: [], env: {}, preopens: {}, returnOnExit: true });
  const instance = new WebAssembly.Instance(module, wasi.getImportObject());
  wasi.initialize(instance);
  const exports = instance.exports;
  const packed = exports.friendly_adversary_oxlint_rules();
  const pointer = Number(packed & 0xffff_ffffn);
  const length = Number(packed >> 32n);
  const inventory = JSON.parse(new TextDecoder().decode(new Uint8Array(exports.memory.buffer, pointer, length)));
  exports.friendly_adversary_oxlint_dealloc(pointer, length);
  return { bytes, inventory };
}

function locateTestWasm(upstreamRoot, explicit) {
  if (explicit) return path.resolve(explicit);
  const directory = path.join(upstreamRoot, "target", "wasm32-wasip1", "debug", "deps");
  const candidates = readdirSync(directory)
    .filter((entry) => /^oxc_linter-[a-f0-9]+\.wasm$/u.test(entry))
    .map((entry) => path.join(directory, entry));
  if (candidates.length !== 1) throw new Error(`Expected one upstream test WebAssembly artifact, found ${candidates.length}`);
  return candidates[0];
}

function captureWasi(module, upstreamRoot, args) {
  const temporary = mkdtempSync(path.join(os.tmpdir(), "friendly-adversary-conformance-"));
  const stdoutPath = path.join(temporary, "stdout.txt");
  const stderrPath = path.join(temporary, "stderr.txt");
  const stdout = openSync(stdoutPath, "w+");
  const stderr = openSync(stderrPath, "w+");
  let exitCode = 0;
  let trap;
  try {
    const wasi = new WASI({
      version: "preview1",
      args: ["oxc_linter-tests", ...args],
      env: { CI: "1", INSTA_UPDATE: "no", INSTA_WORKSPACE_ROOT: "/work" },
      preopens: { "/work": upstreamRoot, ".": path.join(upstreamRoot, "crates", "oxc_linter") },
      stdout,
      stderr,
      returnOnExit: true,
    });
    const instance = new WebAssembly.Instance(module, wasi.getImportObject());
    exitCode = wasi.start(instance);
  } catch (error) {
    exitCode = 1;
    trap = error instanceof Error ? error.stack ?? error.message : String(error);
  } finally {
    closeSync(stdout);
    closeSync(stderr);
  }
  const result = {
    exitCode,
    stdout: readFileSync(stdoutPath, "utf8"),
    stderr: readFileSync(stderrPath, "utf8"),
    trap,
  };
  rmSync(temporary, { recursive: true, force: true });
  return result;
}

function rulePrefix(rule) {
  return `rules::${rule.plugin.replaceAll("-", "_")}::${rule.name.replaceAll("-", "_")}::`;
}

function markdownCell(value) {
  return String(value).replaceAll("|", "\\|").replaceAll("\n", " ");
}

function table(title, headers, rows) {
  return [
    `## ${title}`,
    "",
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(markdownCell).join(" | ")} |`),
    "",
  ].join("\n");
}

function fixtureGroup(file) {
  return file.split("/")[4] ?? "";
}

function registerArtifacts(target, adapter, values) {
  for (const value of values) {
    if (target.has(value)) throw new Error(`Conformance artifact is assigned twice: ${value}`);
    target.set(value, adapter);
  }
}

const fixtureAdapterByFile = new Map();
const snapshotAdapterByFile = new Map();
const fixture = (value) => `apps/oxlint/fixtures/cli/${value}`;
const snapshot = (value) => `apps/oxlint/src/snapshots/${value}`;

registerArtifacts(fixtureAdapterByFile, "auto-config-json", [
  fixture("auto_config_detection/.oxlintrc.json"),
  fixture("auto_config_detection/debugger.js"),
]);
registerArtifacts(snapshotAdapterByFile, "auto-config-json", [
  snapshot("fixtures__cli__auto_config_detection_debugger.js@oxlint.snap"),
]);
registerArtifacts(fixtureAdapterByFile, "auto-config-jsonc", [
  fixture("auto_config_detection_jsonc/.oxlintrc.jsonc"),
  fixture("auto_config_detection_jsonc/debugger.js"),
]);
registerArtifacts(snapshotAdapterByFile, "auto-config-jsonc", [
  snapshot("fixtures__cli__auto_config_detection_jsonc_debugger.js@oxlint.snap"),
]);
registerArtifacts(fixtureAdapterByFile, "malformed-config", [
  fixture("auto_config_parse_error/.oxlintrc.json"),
  fixture("auto_config_parse_error/debugger.js"),
]);
registerArtifacts(snapshotAdapterByFile, "malformed-config", [
  snapshot("fixtures__cli__auto_config_parse_error_debugger.js@oxlint.snap"),
]);
registerArtifacts(fixtureAdapterByFile, "ignore-directory", [
  fixture("config_ignore_patterns/ignore_directory/eslintrc.json"),
  fixture("config_ignore_patterns/ignore_directory/main.js"),
  fixture("config_ignore_patterns/ignore_directory/tests/main.spec.js"),
]);
registerArtifacts(snapshotAdapterByFile, "ignore-directory", [
  snapshot("fixtures__cli__config_ignore_patterns__ignore_directory_-c eslintrc.json@oxlint.snap"),
]);
registerArtifacts(fixtureAdapterByFile, "ignore-extension", [
  fixture("config_ignore_patterns/ignore_extension/eslintrc.json"),
  fixture("config_ignore_patterns/ignore_extension/main.js"),
  fixture("config_ignore_patterns/ignore_extension/main.ts"),
]);
registerArtifacts(snapshotAdapterByFile, "ignore-extension", [
  snapshot("_-c fixtures__cli__config_ignore_patterns__ignore_extension__eslintrc.json fixtures__cli__config_ignore_patterns__ignore_extension@oxlint.snap"),
  snapshot("_-c fixtures__cli__config_ignore_patterns__ignore_extension__eslintrc.json fixtures__cli__config_ignore_patterns__ignore_extension__main.js@oxlint.snap"),
]);
registerArtifacts(fixtureAdapterByFile, "ignore-current-directory", [
  fixture("ignore_file_current_dir/.oxlintrc.json"),
  fixture("ignore_file_current_dir/a/bar.js"),
  fixture("ignore_file_current_dir/foo.js"),
]);
registerArtifacts(snapshotAdapterByFile, "ignore-current-directory", [
  snapshot("fixtures__cli__ignore_file_current_dir_ .@oxlint.snap"),
]);
registerArtifacts(fixtureAdapterByFile, "ignore-non-glob", [
  fixture("ignore_pattern_non_glob_syntax/.oxlintrc.json"),
  fixture("ignore_pattern_non_glob_syntax/ignored_dir/index.ts"),
]);
registerArtifacts(snapshotAdapterByFile, "ignore-non-glob", [
  snapshot("fixtures__cli__ignore_pattern_non_glob_syntax_ .@oxlint.snap"),
]);
registerArtifacts(fixtureAdapterByFile, "ignore-empty-nested-root", [
  fixture("ignore_patterns_empty_nested/.oxlintrc.json"),
  fixture("ignore_patterns_empty_nested/ignored-file.ts"),
]);
registerArtifacts(snapshotAdapterByFile, "ignore-empty-nested-root", [
  snapshot("fixtures__cli__ignore_patterns_empty_nested_ .@oxlint.snap"),
]);
registerArtifacts(fixtureAdapterByFile, "ignore-mixed-root", [
  fixture("ignore_patterns_mixed/.oxlintrc.json"),
  fixture("ignore_patterns_mixed/should_be_ignored.ts"),
]);
registerArtifacts(fixtureAdapterByFile, "ignore-relative", [
  fixture("ignore_patterns_relative/.oxlintrc.json"),
  fixture("ignore_patterns_relative/nested/should_be_ignored.ts"),
  fixture("ignore_patterns_relative/nested/should_not_be_ignored.js"),
  fixture("ignore_patterns_relative/should_not_be_ignored.ts"),
]);
registerArtifacts(snapshotAdapterByFile, "ignore-relative", [
  snapshot("fixtures__cli__ignore_patterns_relative_ .@oxlint.snap"),
]);
registerArtifacts(fixtureAdapterByFile, "ignore-whitelist", [
  fixture("ignore_patterns_whitelist/.oxlintrc.json"),
  fixture("ignore_patterns_whitelist/index.ts"),
  fixture("ignore_patterns_whitelist/index.whitelist.ts"),
]);
registerArtifacts(snapshotAdapterByFile, "ignore-whitelist", [
  snapshot("fixtures__cli__ignore_patterns_whitelist_ .@oxlint.snap"),
]);
registerArtifacts(fixtureAdapterByFile, "explicit-config", [
  fixture("linter/eslintrc.json"),
  fixture("linter/debugger.js"),
]);
registerArtifacts(snapshotAdapterByFile, "explicit-config", [
  snapshot("_-c fixtures__cli__linter__eslintrc.json fixtures__cli__linter__debugger.js@oxlint.snap"),
]);
registerArtifacts(fixtureAdapterByFile, "native-json-diagnostics", [
  fixture("output_formatter_diagnostic/.oxlintrc.json"),
  fixture("output_formatter_diagnostic/ok.js"),
  fixture("output_formatter_diagnostic/parser-error.js"),
  fixture("output_formatter_diagnostic/test.js"),
]);
registerArtifacts(snapshotAdapterByFile, "native-json-diagnostics", [
  snapshot("fixtures__cli__output_formatter_diagnostic_--format=json ok.js@oxlint.snap"),
  snapshot("fixtures__cli__output_formatter_diagnostic_--format=json parser-error.js@oxlint.snap"),
  snapshot("fixtures__cli__output_formatter_diagnostic_--format=json test.js@oxlint.snap"),
]);

function classifyFixture(file) {
  const adapter = fixtureAdapterByFile.get(file);
  if (adapter) return ["enabled", `adapter:${adapter}`];
  const group = fixtureGroup(file);
  if (group.startsWith("tsgolint")) return ["non-applicable", "type-aware-tsgolint"];
  if (["astro", "flow", "svelte", "vue"].includes(group)) return ["non-applicable", "language-outside-v1"];
  if (group.includes("import") || group.startsWith("cross_module")) return ["non-applicable", "module-graph-not-exposed"];
  if (group.includes("fix")) return ["non-applicable", "fixing-not-exposed"];
  if (group.includes("override") || group.includes("nested") || group.includes("extends") || file.includes("/nested/") || file.includes("/another_config/")) {
    return ["non-applicable", "nested-or-advanced-config-not-exposed"];
  }
  if (file.endsWith("disable-directive.js")) return ["non-applicable", "unused-disable-reporting-not-exposed"];
  if (group === "linter") return ["non-applicable", "cli-flag-or-config-option-not-exposed"];
  if (group === "config_ignore_patterns") return ["non-applicable", "nested-config-not-exposed"];
  return ["non-applicable", "cli-or-rule-outside-v1"];
}

function classifyCliSnapshot(file) {
  const adapter = snapshotAdapterByFile.get(file);
  if (adapter) return ["enabled", `adapter:${adapter}`];
  const normalized = file.replaceAll("__", "/");
  if (normalized.includes("tsgolint")) return ["non-applicable", "type-aware-tsgolint"];
  if (/fixtures\/cli\/(?:astro|flow|svelte|vue)/u.test(normalized)) return ["non-applicable", "language-outside-v1"];
  if (normalized.includes("import")) return ["non-applicable", "module-graph-not-exposed"];
  if (normalized.includes("output_formatter_diagnostic")) return ["non-applicable", "reporter-or-unused-disable-output-not-exposed"];
  return ["non-applicable", "cli-reporter-or-command-not-exposed"];
}

function fixtureAbsolute(upstreamRoot, relative) {
  return path.join(upstreamRoot, "apps", "oxlint", "fixtures", "cli", relative);
}

function readFixture(upstreamRoot, relative) {
  return readFileSync(fixtureAbsolute(upstreamRoot, relative), "utf8");
}

function diagnosticSummary(result) {
  return result.files.map((file) => ({
    path: file.path,
    status: file.status,
    diagnostics: file.diagnostics.map((diagnostic) => [diagnostic.code ?? null, diagnostic.severity]),
    error: file.error,
  }));
}

function extractJsonDiagnostics(snapshotText) {
  const match = snapshotText.match(/\{ "diagnostics": (\[[\s\S]*?\]),\n\s+"number_of_files"/u);
  if (!match) throw new Error("Unable to extract native JSON diagnostics from upstream snapshot");
  return JSON.parse(match[1]);
}

async function runFixtureAdapters(upstreamRoot) {
  const modulePath = pathToFileURL(path.join(root, "dist", "src", "oxlint-wasm.js")).href;
  const { runOxlintWasm } = await import(modulePath);
  const adapterResults = new Map();
  let activeAdapter = "not-started";

  async function lint(adapter, fixtureRoot, configName, sourceFiles) {
    const absoluteRoot = fixtureAbsolute(upstreamRoot, fixtureRoot);
    const result = await runOxlintWasm({
      timeoutMs: 20_000,
      configJson: readFixture(upstreamRoot, `${fixtureRoot}/${configName}`),
      configPath: path.join(absoluteRoot, configName),
      ignoreRoot: absoluteRoot,
      files: sourceFiles.map((relative) => ({
        path: relative,
        lintPath: path.join(absoluteRoot, relative),
        source: readFixture(upstreamRoot, `${fixtureRoot}/${relative}`),
      })),
    });
    return result;
  }

  try {
    for (const [adapter, fixtureRoot, configName] of [
      ["auto-config-json", "auto_config_detection", ".oxlintrc.json"],
      ["auto-config-jsonc", "auto_config_detection_jsonc", ".oxlintrc.jsonc"],
      ["explicit-config", "linter", "eslintrc.json"],
    ]) {
      activeAdapter = adapter;
      const result = await lint(adapter, fixtureRoot, configName, ["debugger.js"]);
      assert.deepEqual(diagnosticSummary(result), [{
        path: "debugger.js",
        status: "ok",
        diagnostics: [["eslint(no-debugger)", "error"]],
        error: null,
      }]);
      adapterResults.set(adapter, "passed");
    }

    activeAdapter = "malformed-config";
    const malformed = await lint("malformed-config", "auto_config_parse_error", ".oxlintrc.json", ["debugger.js"]);
    assert.equal(malformed.files[0]?.status, "error");
    assert.match(malformed.files[0]?.error ?? "", /Failed to parse oxlint configuration/u);
    adapterResults.set(activeAdapter, "passed");

    activeAdapter = "ignore-directory";
    const ignoreDirectory = await lint(
      "ignore-directory",
      "config_ignore_patterns/ignore_directory",
      "eslintrc.json",
      ["main.js", "tests/main.spec.js"],
    );
    assert.deepEqual(diagnosticSummary(ignoreDirectory), [
      { path: "main.js", status: "ok", diagnostics: [["unicorn(no-empty-file)", "warning"]], error: null },
      { path: "tests/main.spec.js", status: "ignored", diagnostics: [], error: null },
    ]);
    adapterResults.set(activeAdapter, "passed");

    activeAdapter = "ignore-extension";
    const ignoreExtension = await lint(
      "ignore-extension",
      "config_ignore_patterns/ignore_extension",
      "eslintrc.json",
      ["main.js", "main.ts"],
    );
    assert.deepEqual(diagnosticSummary(ignoreExtension), [
      { path: "main.js", status: "ignored", diagnostics: [], error: null },
      { path: "main.ts", status: "ok", diagnostics: [["unicorn(no-empty-file)", "error"]], error: null },
    ]);
    adapterResults.set(activeAdapter, "passed");

    activeAdapter = "ignore-current-directory";
    const ignoreCurrent = await lint(
      "ignore-current-directory",
      "ignore_file_current_dir",
      ".oxlintrc.json",
      ["a/bar.js", "foo.js"],
    );
    assert.deepEqual(diagnosticSummary(ignoreCurrent), [
      { path: "a/bar.js", status: "ignored", diagnostics: [], error: null },
      { path: "foo.js", status: "ignored", diagnostics: [], error: null },
    ]);
    adapterResults.set(activeAdapter, "passed");

    activeAdapter = "ignore-non-glob";
    const ignoreNonGlob = await lint(
      "ignore-non-glob",
      "ignore_pattern_non_glob_syntax",
      ".oxlintrc.json",
      ["ignored_dir/index.ts"],
    );
    assert.deepEqual(diagnosticSummary(ignoreNonGlob), [
      { path: "ignored_dir/index.ts", status: "ignored", diagnostics: [], error: null },
    ]);
    adapterResults.set(activeAdapter, "passed");

    activeAdapter = "ignore-empty-nested-root";
    const ignoreEmptyNested = await lint(
      "ignore-empty-nested-root",
      "ignore_patterns_empty_nested",
      ".oxlintrc.json",
      ["ignored-file.ts"],
    );
    assert.deepEqual(diagnosticSummary(ignoreEmptyNested), [
      { path: "ignored-file.ts", status: "ignored", diagnostics: [], error: null },
    ]);
    adapterResults.set(activeAdapter, "passed");

    activeAdapter = "ignore-mixed-root";
    const ignoreMixed = await lint(
      "ignore-mixed-root",
      "ignore_patterns_mixed",
      ".oxlintrc.json",
      ["should_be_ignored.ts"],
    );
    assert.deepEqual(diagnosticSummary(ignoreMixed), [
      { path: "should_be_ignored.ts", status: "ignored", diagnostics: [], error: null },
    ]);
    adapterResults.set(activeAdapter, "passed");

    activeAdapter = "ignore-relative";
    const ignoreRelative = await lint(
      "ignore-relative",
      "ignore_patterns_relative",
      ".oxlintrc.json",
      ["nested/should_be_ignored.ts", "nested/should_not_be_ignored.js", "should_not_be_ignored.ts"],
    );
    assert.deepEqual(diagnosticSummary(ignoreRelative), [
      { path: "nested/should_be_ignored.ts", status: "ignored", diagnostics: [], error: null },
      { path: "nested/should_not_be_ignored.js", status: "ok", diagnostics: [["eslint(no-debugger)", "warning"]], error: null },
      { path: "should_not_be_ignored.ts", status: "ok", diagnostics: [["eslint(no-debugger)", "warning"]], error: null },
    ]);
    adapterResults.set(activeAdapter, "passed");

    activeAdapter = "ignore-whitelist";
    const ignoreWhitelist = await lint(
      "ignore-whitelist",
      "ignore_patterns_whitelist",
      ".oxlintrc.json",
      ["index.ts", "index.whitelist.ts"],
    );
    assert.deepEqual(diagnosticSummary(ignoreWhitelist), [
      { path: "index.ts", status: "ignored", diagnostics: [], error: null },
      { path: "index.whitelist.ts", status: "ok", diagnostics: [["eslint(no-debugger)", "error"]], error: null },
    ]);
    adapterResults.set(activeAdapter, "passed");

    activeAdapter = "native-json-diagnostics";
    const nativeJson = await lint(
      "native-json-diagnostics",
      "output_formatter_diagnostic",
      ".oxlintrc.json",
      ["ok.js", "parser-error.js", "test.js"],
    );
    for (const file of nativeJson.files) {
      const snapshotPath = snapshot(
        `fixtures__cli__output_formatter_diagnostic_--format=json ${file.path}@oxlint.snap`,
      );
      const expected = extractJsonDiagnostics(readFileSync(path.join(upstreamRoot, snapshotPath), "utf8"));
      assert.deepEqual(file.diagnostics, expected);
    }
    adapterResults.set(activeAdapter, "passed");
  } catch (error) {
    adapterResults.set(activeAdapter, `failed:${error instanceof Error ? error.message : String(error)}`);
  }

  return adapterResults;
}

const args = argumentsMap(process.argv.slice(2));
const upstreamRoot = path.resolve(args.get("upstream-root") ?? "");
if (!args.get("upstream-root")) throw new Error("--upstream-root is required");
if (Number(process.versions.node.split(".")[0]) !== 22) throw new Error(`Node 22 is required, received ${process.version}`);
const head = run("git", ["rev-parse", "HEAD"], upstreamRoot);
if (head !== upstreamCommit) throw new Error(`Upstream commit mismatch: ${head}`);
const harnessFiles = [
  "crates/oxc_linter/src/service/runtime.rs",
  "crates/oxc_linter/src/tester.rs",
];
const changedTrackedFiles = run("git", ["diff", "--name-only"], upstreamRoot).split("\n").filter(Boolean);
assert.deepEqual(changedTrackedFiles, harnessFiles, "Upstream checkout contains changes outside the audited WASI harness patch");
const stagedFiles = run("git", ["diff", "--cached", "--name-only"], upstreamRoot).split("\n").filter(Boolean);
assert.deepEqual(stagedFiles, [], "Upstream checkout contains staged changes");
const expectedHarnessPatch = readFileSync(
  path.join(root, "conformance", "oxlint-v1.76.0", "wasi-test-harness.patch"),
  "utf8",
);
const actualHarnessPatch = runRaw("git", ["diff", "--unified=0", "--", ...harnessFiles], upstreamRoot);
assert.equal(actualHarnessPatch, expectedHarnessPatch, "Upstream WASI harness patch differs from the audited patch");

const productionWasm = path.join(root, "wasm", "oxlint", "engine.wasm");
const { bytes: productionBytes, inventory: ruleInventory } = wasmInventory(productionWasm);
if (ruleInventory.total !== expectedRuleCount || ruleInventory.rules.length !== expectedRuleCount) {
  throw new Error(`Expected ${expectedRuleCount} upstream rules`);
}
const certifiedRules = ruleInventory.rules.filter((rule) => rule.certified_by_friendly_adversary);
if (certifiedRules.length !== expectedCertifiedRuleCount) throw new Error(`Expected ${expectedCertifiedRuleCount} certified rules`);

const testWasm = locateTestWasm(upstreamRoot, args.get("test-wasm"));
const testBytes = readFileSync(testWasm);
const testModule = new WebAssembly.Module(testBytes);
const listing = captureWasi(testModule, upstreamRoot, ["--list", "--format", "terse"]);
if (listing.exitCode !== 0) throw new Error(`Upstream test listing failed: ${listing.stderr || listing.trap}`);
const testIds = listing.stdout.split(/\r?\n/u)
  .filter((line) => line.endsWith(": test"))
  .map((line) => line.slice(0, -": test".length));
if (testIds.length !== expectedTestCount) throw new Error(`Expected ${expectedTestCount} upstream tests, found ${testIds.length}`);

const certifiedPrefixes = new Map(certifiedRules.map((rule) => [rulePrefix(rule), `${rule.plugin}/${rule.name}`]));
const testRows = testIds.map((id) => {
  if (id === upstreamIgnoredTest) return { id, classification: "upstream-ignored", reason: "upstream-ignored-failing-eslint-cases" };
  for (const [prefix, rule] of certifiedPrefixes) {
    if (id.startsWith(prefix)) return { id, classification: "enabled", reason: `certified-rule:${rule}` };
  }
  if (id.startsWith("rules::")) return { id, classification: "non-applicable", reason: "rule-outside-v1-set" };
  return { id, classification: "non-applicable", reason: "internal-or-unexposed-support-test" };
});
const certifiedTestRows = testRows.filter((row) => row.classification === "enabled");
if (certifiedTestRows.length !== expectedCertifiedTestCount) {
  throw new Error(`Expected ${expectedCertifiedTestCount} certified upstream tests, found ${certifiedTestRows.length}`);
}

const ruleResults = new Map();
const nativeOutput = [];
if (args.get("run") === "true") {
  for (const rule of certifiedRules) {
    const prefix = rulePrefix(rule);
    const expected = certifiedTestRows.filter((row) => row.id.startsWith(prefix)).length;
    if (expected === 0) throw new Error(`Certified rule ${rule.plugin}/${rule.name} has no upstream test`);
    const result = captureWasi(testModule, upstreamRoot, [prefix, "--test-threads", "1", "--quiet"]);
    nativeOutput.push(`# ${rule.plugin}/${rule.name}\n${result.stdout}${result.stderr}${result.trap ?? ""}`);
    const summary = result.stdout.match(/test result: ok\. (\d+) passed; 0 failed; 0 ignored;/u);
    const passed = Number(summary?.[1] ?? -1);
    ruleResults.set(`${rule.plugin}/${rule.name}`, result.exitCode === 0 && passed === expected ? "passed" : "failed");
  }
}

const tracked = run("git", ["ls-tree", "-r", "--name-only", "HEAD"], upstreamRoot).split("\n").filter(Boolean);
const snapshots = tracked.filter((file) => file.startsWith("crates/oxc_linter/") && file.includes("/snapshots/") && file.endsWith(".snap"));
const cliFixtures = tracked.filter((file) => file.startsWith("apps/oxlint/fixtures/cli/"));
const cliSnapshots = tracked.filter((file) => file.startsWith("apps/oxlint/src/snapshots/") && file.endsWith(".snap"));
if (snapshots.length !== expectedRuleSnapshotCount) {
  throw new Error(`Expected ${expectedRuleSnapshotCount} rule snapshots, found ${snapshots.length}`);
}
if (cliFixtures.length !== expectedCliFixtureCount) {
  throw new Error(`Expected ${expectedCliFixtureCount} CLI fixture entries, found ${cliFixtures.length}`);
}
if (cliSnapshots.length !== expectedCliSnapshotCount) {
  throw new Error(`Expected ${expectedCliSnapshotCount} CLI snapshots, found ${cliSnapshots.length}`);
}

const snapshotRows = snapshots.map((file) => {
  const basename = path.basename(file, ".snap");
  const rule = certifiedRules.find((candidate) => basename.startsWith(`${candidate.plugin}_${candidate.name.replaceAll("-", "_")}`));
  return rule
    ? [file, "inventory-only", `runtime-tested-without-nondeterministic-native-snapshot:${rule.plugin}/${rule.name}`]
    : [file, "non-applicable", "rule-outside-v1-set-or-internal"];
});
const fixtureRows = cliFixtures.map((file) => [file, ...classifyFixture(file)]);
const cliSnapshotRows = cliSnapshots.map((file) => [file, ...classifyCliSnapshot(file)]);
const adapterResults = args.get("run") === "true" ? await runFixtureAdapters(upstreamRoot) : new Map();
const expectedAdapters = [...new Set([...fixtureAdapterByFile.values(), ...snapshotAdapterByFile.values()])].sort();
const adapterRows = expectedAdapters.map((adapter) => [adapter, adapterResults.get(adapter) ?? "not-run"]);

const ruleRows = ruleInventory.rules.map((rule) => [
  `${rule.plugin}/${rule.name}`,
  rule.category,
  rule.is_tsgolint_rule ? "tsgolint" : "oxc-wasm",
  rule.certified_by_friendly_adversary ? "enabled" : "non-applicable",
  rule.certified_by_friendly_adversary ? "certified-v1" : rule.is_tsgolint_rule ? "type-aware-tsgolint" : "rule-outside-v1-set",
]);

const inventoryHeader = [
  "# Oxlint v1.76.0 conformance inventory",
  "",
  `- Upstream commit: \`${upstreamCommit}\``,
  `- Production WASM SHA-256: \`${sha256(productionBytes)}\``,
  `- Upstream test WASM SHA-256: \`${sha256(testBytes)}\``,
  `- Upstream test-list SHA-256: \`${sha256(`${testIds.join("\n")}\n`)}\``,
  `- Rules: ${ruleRows.length}`,
  `- Certified rules: ${certifiedRules.length}`,
  `- Upstream library tests: ${testRows.length}`,
  `- Certified rule tests: ${certifiedTestRows.length}`,
  `- Rule snapshots: ${snapshotRows.length}`,
  `- CLI fixture entries: ${fixtureRows.length}`,
  `- CLI snapshots: ${cliSnapshotRows.length}`,
  "",
].join("\n");
const inventoryMarkdown = inventoryHeader
  + table("Rule ledger", ["Rule", "Category", "Backend", "Classification", "Reason"], ruleRows)
  + table("Upstream test ledger", ["Test", "Classification", "Reason"], testRows.map((row) => [row.id, row.classification, row.reason]))
  + table("Rule snapshot ledger", ["Snapshot", "Classification", "Reason"], snapshotRows)
  + table("CLI fixture ledger", ["Fixture", "Classification", "Reason"], fixtureRows)
  + table("CLI snapshot ledger", ["Snapshot", "Classification", "Reason"], cliSnapshotRows)
  + table("Production ABI adapter ledger", ["Adapter", "Status"], adapterRows);

const inventoryPath = path.resolve(args.get("inventory-output") ?? path.join(root, "conformance", "oxlint-v1.76.0", "inventory.md"));
writeFileSync(inventoryPath, inventoryMarkdown);

const applicablePassed = [...ruleResults.values()].filter((status) => status === "passed").length;
const applicableFailed = [...ruleResults.values()].filter((status) => status === "failed").length;
const enabledFixtures = fixtureRows.filter((row) => row[1] === "enabled").length;
const enabledCliSnapshots = cliSnapshotRows.filter((row) => row[1] === "enabled").length;
const adaptersPassed = adapterRows.filter((row) => row[1] === "passed").length;
const adaptersFailed = adapterRows.filter((row) => String(row[1]).startsWith("failed:"));
const adaptersNotRun = adapterRows.filter((row) => row[1] === "not-run").length;
const gatePassed = args.get("run") === "true"
  && applicableFailed === 0
  && applicablePassed === certifiedRules.length
  && adaptersPassed === expectedAdapters.length
  && adaptersFailed.length === 0
  && adaptersNotRun === 0;
const scoreboard = [
  "# Oxlint v1.76.0 conformance scoreboard",
  "",
  `- Upstream tests inventoried: ${testRows.length}`,
  `- Certified rules: ${certifiedRules.length}`,
  `- Certified rule tests: ${certifiedTestRows.length}`,
  `- Certified rule batches passed: ${applicablePassed}/${certifiedRules.length}`,
  `- Certified rule batches failed: ${applicableFailed}`,
  `- Upstream ignored tests: ${testRows.filter((row) => row.classification === "upstream-ignored").length}`,
  `- Rule snapshots inventoried but not asserted: ${snapshotRows.length}`,
  `- Enabled CLI fixture entries mapped to adapters: ${enabledFixtures}`,
  `- Enabled CLI snapshots mapped to adapters: ${enabledCliSnapshots}`,
  `- Production ABI adapters passed: ${adaptersPassed}/${expectedAdapters.length}`,
  `- Production ABI adapters failed: ${adaptersFailed.length}`,
  `- Production ABI adapters not run: ${adaptersNotRun}`,
  `- Unclassified rows: 0`,
  "",
  ...adaptersFailed.map(([adapter, status]) => `- Adapter failure ${adapter}: ${String(status).slice("failed:".length)}`),
  adaptersFailed.length > 0 ? "" : null,
  gatePassed ? "Semantic rule and production ABI gate: PASS" : "Semantic rule and production ABI gate: FAIL",
  "",
].filter((line) => line !== null).join("\n");
const scoreboardPath = path.resolve(args.get("scoreboard-output") ?? path.join(root, "conformance", "oxlint-v1.76.0", "scoreboard.md"));
writeFileSync(scoreboardPath, scoreboard);
if (args.get("native-output")) writeFileSync(path.resolve(args.get("native-output")), `${nativeOutput.join("\n\n")}\n`);
process.stdout.write(scoreboard);
