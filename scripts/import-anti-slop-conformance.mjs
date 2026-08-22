import { readFile, readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";
import { materializePinnedGitTree } from "./materialize-pinned-git-tree.mjs";

const UPSTREAM_COMMIT = "9b80d9a5c317d3af94d88a577bdbde4d9a45f7be";
const upstreamRoot = path.resolve(process.argv[2] ?? "");
const output = path.resolve("conformance", `anti-slop-${UPSTREAM_COMMIT.slice(0, 8)}`, "cases.json");

if (!process.argv[2]) {
  throw new Error("Usage: node scripts/import-anti-slop-conformance.mjs <anti-slop-checkout>");
}

const authenticated = await materializePinnedGitTree(upstreamRoot, UPSTREAM_COMMIT, "Anti-slop");
try {
const captures = [];
class RuleTester {
  run(name, _rule, cases) {
    captures.push({ name, cases });
  }
}

const testRoot = path.join(authenticated.root, "src", "rules");
const files = (await readdir(testRoot)).filter((file) => file.endsWith(".test.ts")).sort();
for (const file of files) {
  const source = await readFile(path.join(testRoot, file), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: file,
  }).outputText;
  const sandbox = {
    exports: {},
    module: { exports: {} },
    require(specifier) {
      if (specifier === "oxlint/plugins-dev") return { RuleTester };
      if (specifier.startsWith("./")) {
        return new Proxy({}, { get: () => ({ meta: {} }) });
      }
      throw new Error(`Unexpected conformance import ${specifier} in ${file}`);
    },
  };
  vm.runInNewContext(compiled, sandbox, { filename: file });
}

function expectedCount(errors) {
  if (typeof errors === "number") return errors;
  if (Array.isArray(errors)) return errors.length;
  throw new Error("Upstream invalid case does not declare an error count");
}

const cases = captures.flatMap(({ name, cases: group }) => [
  ...group.valid.map((entry) => ({
    rule: name.replace(/^anti-slop\//u, ""),
    source: typeof entry === "string" ? entry : entry.code,
    expected: 0,
    origin: "upstream-test-valid",
  })),
  ...group.invalid.map((entry) => ({
    rule: name.replace(/^anti-slop\//u, ""),
    source: typeof entry === "string" ? entry : entry.code,
    expected: expectedCount(typeof entry === "string" ? 1 : entry.errors),
    origin: "upstream-test-invalid",
  })),
]);

const covered = new Set(cases.map((entry) => entry.rule));
const readmeCases = [
  ["no-chained-type-assertions", "const user = input as object as User;"],
  ["no-runtime-typeof", "if (typeof input === 'string') useName(input);"],
  ["no-shape-in-symbol-names", "interface UserShape { id: string }"],
  ["no-unknown-parameters", "function handle(input: unknown) {}"],
  ["no-unknown-type-aliases", "type ExternalValue = unknown;"],
  ["no-widen-then-assert", "type User = { id: number }; const stored: unknown = { id: 1 }; const user = stored as User;"],
];
for (const [rule, source] of readmeCases) {
  if (!covered.has(rule)) cases.push({ rule, source, expected: 1, origin: "upstream-readme-violation" });
}

cases.sort((left, right) => left.rule.localeCompare(right.rule) || left.origin.localeCompare(right.origin) || left.source.localeCompare(right.source));
await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify({
  schema: 1,
  upstream: "https://github.com/dmmulroy/anti-slop",
  commit: UPSTREAM_COMMIT,
  generatedFrom: files.map((file) => `src/rules/${file}`),
  cases,
}, null, 2)}\n`, "utf8");
process.stdout.write(`Wrote ${cases.length} anti-slop conformance cases to ${path.relative(process.cwd(), output)}\n`);
} finally {
  await authenticated.cleanup();
}
