import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtemp, readFile, readdir, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function fail(message) {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function sourceReference(upstream, file) {
  return path.relative(upstream, file).split(path.sep).join("/");
}

async function discover(upstream) {
  const patternsRoot = path.join(upstream, "tests", "patterns");
  const definitions = [
    { directory: "js", extension: ".js", language: "javascript" },
    { directory: "ts", extension: ".ts", language: "typescript" },
    { directory: "python", extension: ".py", language: "python" },
  ];
  const cases = [];
  for (const definition of definitions) {
    const directory = path.join(patternsRoot, definition.directory);
    const targets = (await readdir(directory))
      .filter((file) => path.extname(file) === definition.extension)
      .sort();
    for (const targetName of targets) {
      const basename = path.basename(targetName, definition.extension);
      const localPattern = path.join(directory, `${basename}.sgrep`);
      const polyglotPattern = path.join(patternsRoot, "POLYGLOT", `${basename}.sgrep`);
      const pattern = await realpath(localPattern).catch(() => realpath(polyglotPattern).catch(() => undefined));
      if (!pattern) fail(`Unclassified upstream case without a pattern: ${definition.directory}/${targetName}`);
      cases.push({
        id: `patterns/${definition.directory}/${basename}`,
        language: definition.language,
        target: path.join(directory, targetName),
        pattern,
      });
    }
  }
  return cases;
}

function expectedLines(source) {
  const lines = source.split(/\r?\n/u);
  return lines.flatMap((line, index) => /(?:ERROR|MATCH):/u.test(line) ? [index + 2] : []);
}

function stableUnique(numbers) {
  return [...new Set(numbers)].sort((left, right) => left - right);
}

const upstreamArgument = argument("--upstream") ?? process.env.SEMGREP_SOURCE_DIR;
if (!upstreamArgument) fail("Pass --upstream /absolute/path or set SEMGREP_SOURCE_DIR");
const upstream = await realpath(upstreamArgument);
execFileSync(process.execPath, [path.join(root, "scripts", "verify-semgrep-source.mjs"), "--source", upstream], {
  cwd: root,
  stdio: ["ignore", "ignore", "inherit"],
});

const temporary = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-semgrep-conformance-"));
try {
  const engineModule = require(path.join(root, "engines", "semgrep-wasm", "runtime", "engine", "index.cjs"));
  const engine = await engineModule.EngineFactory();
  const pythonModule = require(path.join(root, "engines", "semgrep-wasm", "runtime", "python", "index.cjs"));
  const typescriptModule = require(path.join(root, "engines", "semgrep-wasm", "runtime", "typescript", "index.cjs"));
  engine.addParser(await pythonModule.ParserFactory(path.join(root, "engines", "semgrep-wasm", "runtime", "python", "semgrep-parser.wasm")));
  engine.addParser(await typescriptModule.ParserFactory(path.join(root, "engines", "semgrep-wasm", "runtime", "typescript", "semgrep-parser.wasm")));

  const discovered = await discover(upstream);
  const cases = [];
  for (let index = 0; index < discovered.length; index += 1) {
    const testCase = discovered[index];
    const pattern = await readFile(testCase.pattern, "utf8");
    const rule = {
      rules: [{
        id: "friendly-adversary.conformance",
        message: "upstream conformance case",
        severity: "ERROR",
        languages: [testCase.language],
        pattern,
      }],
    };
    const rulePath = path.join(temporary, `${index}.json`);
    await writeFile(rulePath, `${JSON.stringify(rule)}\n`, { mode: 0o600 });
    const expected = stableUnique(expectedLines(await readFile(testCase.target, "utf8")));
    let actual = [];
    let errors = [];
    try {
      const output = JSON.parse(engine.execute(testCase.language, rulePath, upstream, [testCase.target]));
      actual = stableUnique(output.results.map((result) => result.start.line));
      errors = output.errors;
    } catch (error) {
      errors = [{ message: error instanceof Error ? error.message : String(error) }];
    }
    const passed = errors.length === 0 && JSON.stringify(actual) === JSON.stringify(expected);
    cases.push({
      id: testCase.id,
      status: passed ? "adapted-pass" : "fail",
      enabledBehavior: true,
      adaptation: "The upstream single-pattern .sgrep fixture is wrapped in an equivalent one-rule JSON document because the product runtime accepts Semgrep rule documents, not the internal -e pattern-test interface.",
      source: {
        target: sourceReference(upstream, testCase.target),
        pattern: sourceReference(upstream, testCase.pattern),
      },
      expectedLines: expected,
      actualLines: actual,
      errors,
    });
  }
  const counts = Object.fromEntries(["pass", "fail", "adapted-pass", "not-applicable"].map((status) => [status, cases.filter((testCase) => testCase.status === status).length]));
  const scoreboard = {
    schemaVersion: 1,
    upstream: { tag: "v1.172.0", commit: "651f37efa397bf066e1cf627414eeabe40b07e27" },
    discovery: {
      roots: ["tests/patterns/js/*.js", "tests/patterns/ts/*.ts", "tests/patterns/python/*.py"],
      rule: "Every supported-language target is paired with the same-basename local or POLYGLOT .sgrep pattern.",
      discovered: cases.length,
      classified: cases.length,
      unclassified: 0,
    },
    counts,
    enabledBehaviorPassRate: cases.length === 0 ? 0 : (counts.pass + counts["adapted-pass"]) / cases.length,
    cases,
  };
  const serialized = `${JSON.stringify(scoreboard, null, 2)}\n`;
  const outputPath = argument("--output");
  if (outputPath) await writeFile(path.resolve(outputPath), serialized, { mode: 0o600 });
  else process.stdout.write(serialized);
  if (counts.fail > 0 || scoreboard.discovery.unclassified > 0) process.exitCode = 1;
} finally {
  await rm(temporary, { recursive: true, force: true });
}
