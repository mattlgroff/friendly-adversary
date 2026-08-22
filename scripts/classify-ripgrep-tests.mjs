import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const conformance = path.join(root, "engines", "ripgrep-wasm", "conformance");
const input = path.join(conformance, "upstream-tests-research.tsv");
const output = path.join(conformance, "upstream-tests-classified.tsv");
const arguments_ = process.argv.slice(2);
const checkOnly = arguments_.includes("--check");
if (arguments_.some((argument) => argument !== "--check")) {
  throw new Error("Usage: node scripts/classify-ripgrep-tests.mjs [--check]");
}

const lines = (await readFile(input, "utf8")).trimEnd().split("\n");
const header = lines.shift();
if (header !== "kind\tcomponent\ttest_id\tmacos_inventory\tlinux_inventory\twasi_inventory\tclassification\treason") {
  throw new Error("Unexpected ripgrep research inventory schema");
}

const seen = new Set();
const counts = new Map();
const classified = lines.map((line) => {
  const columns = line.split("\t");
  if (columns.length !== 8) throw new Error(`Malformed ripgrep inventory row: ${line}`);
  const [kind, component, testId] = columns;
  const id = `${kind}:${component}:${testId}`;
  if (seen.has(id)) throw new Error(`Duplicate ripgrep inventory ID: ${id}`);
  seen.add(id);
  if (component === "rg-integration") {
    columns[6] = "non_applicable";
    columns[7] = "general-purpose CLI integration outside Friendly's fixed file-index and JSON symbol-search invocation; product CLI parity is tested separately";
  }
  if (component === "ignore-integration-parent" && testId === "test_path_should_be_under_root") {
    columns[6] = "non_applicable";
    columns[7] = "the upstream should-panic harness requires panic unwinding unavailable on wasm32-wasip1; product path rejection is tested separately";
  }
  if (component === "grep-cli" && testId === "pattern::tests::os") {
    columns[6] = "non_applicable";
    columns[7] = "uses the Unix-only OsStrExt API, which is not present on wasm32-wasip1";
  }
  if (component === "globset" && testId === "glob::tests::matchbackslash8") {
    columns[6] = "non_applicable";
    columns[7] = "tests non-Unix backslash path semantics excluded from the slash-based wasm32-wasip1 target";
  }
  if (component === "ignore" && ["walk::tests::first_path_not_symlink", "walk::tests::symlink_loop", "walk::tests::symlinks"].includes(testId)) {
    columns[6] = "non_applicable";
    columns[7] = "uses Unix-only symlink APIs, which are not compiled for wasm32-wasip1";
  }
  counts.set(columns[6], (counts.get(columns[6]) ?? 0) + 1);
  return columns.join("\t");
});

const expected = {
  applicable_required: 722,
  applicable_upstream_ignored: 1,
  non_applicable: 466,
};
if (seen.size !== 1189) throw new Error(`Expected 1189 ripgrep tests, found ${seen.size}`);
for (const [classification, count] of Object.entries(expected)) {
  if (counts.get(classification) !== count) {
    throw new Error(`Expected ${count} ${classification} rows, found ${counts.get(classification) ?? 0}`);
  }
}
for (const classification of counts.keys()) {
  if (!(classification in expected)) throw new Error(`Unclassified ripgrep result state: ${classification}`);
}

const next = `${header}\n${classified.join("\n")}\n`;
let current;
try {
  current = await readFile(output, "utf8");
} catch (error) {
  if (!error || typeof error !== "object" || !("code" in error) || error.code !== "ENOENT") throw error;
}
if (checkOnly && current !== next) {
  throw new Error("Ripgrep classified inventory is stale; run npm run ripgrep:classify-tests and commit the result");
}
if (!checkOnly && current !== next) await writeFile(output, next);
process.stdout.write(`ripgrep upstream inventory classified: ${seen.size} total, 722 required, 1 upstream ignored, 466 non-applicable, 0 unclassified\n`);
