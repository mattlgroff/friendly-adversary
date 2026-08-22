import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { WASI } from "node:wasi";
import {
  OXLINT_WASM_ABI_VERSION,
  OXLINT_WASM_MAX_MEMORY_BYTES,
  OXLINT_WASM_SHA256,
  OXLINT_WASM_UPSTREAM_COMMIT,
  OXLINT_WASM_UPSTREAM_VERSION,
  runOxlintWasm,
} from "../src/oxlint-wasm.js";

const wasmPath = path.resolve("wasm", "oxlint", "engine.wasm");

test("pinned Oxlint WebAssembly lints JS, JSX, TypeScript, and TSX", async () => {
  const result = await runOxlintWasm({
    wasmPath,
    timeoutMs: 20_000,
    files: [
      { path: "src/app.js", source: "debugger;\n" },
      { path: "src/app.jsx", source: "export const App = () => <button onClick={() => { debugger; }}>Go</button>;\n" },
      { path: "src/app.ts", source: "const value: number = 1;\ndebugger;\n" },
      { path: "src/app.tsx", source: "export const App = (): JSX.Element => <div>{(() => { debugger; return 1; })()}</div>;\n" },
    ],
  });

  assert.equal(result.upstreamVersion, OXLINT_WASM_UPSTREAM_VERSION);
  assert.equal(result.upstreamCommit, OXLINT_WASM_UPSTREAM_COMMIT);
  assert.equal(result.wasmSha256, OXLINT_WASM_SHA256);
  assert.deepEqual(result.files.map((file) => file.path), ["src/app.js", "src/app.jsx", "src/app.ts", "src/app.tsx"]);
  for (const file of result.files) {
    assert.equal(file.status, "ok");
    assert.ok(file.diagnostics.some((diagnostic) => diagnostic.code === "eslint(no-debugger)"));
  }
});

test("bundled anti-slop profile exposes and executes all fifteen named rules", async () => {
  const source = [
    "type Handler = () => void;",
    "type ExternalValue = unknown;",
    "type Metadata = Record<string, unknown>;",
    "interface UserShape { id: number }",
    "function acceptObject(value: object): void { console.log(value); }",
    "function acceptUnknown(input: unknown): void { console.log(input); }",
    "function exposeUnknown(): Promise<unknown> { return Promise.resolve(1); }",
    "const handlers: Record<string, Handler> = { start() {} };",
    "const options = { ...(true ? { timeout: 1 } : {}) };",
    "vi.mock('./module');",
    "Reflect.apply(acceptObject, null, [{}]);",
    "Reflect.get(options, 'timeout');",
    "if (typeof options === 'object') console.log(options);",
    "const chained = options as object as { timeout?: number };",
    "const stored: unknown = { id: 1 };",
    "const restored = stored as { id: number };",
    "console.log(handlers, chained, restored);",
  ].join("\n");
  const result = await runOxlintWasm({
    wasmPath,
    timeoutMs: 20_000,
    files: [{ path: "src/anti-slop.ts", source }],
  });
  const rules = new Set(
    (result.files[0]?.diagnostics ?? []).flatMap((diagnostic) => {
      const rule = /^anti-slop\(([^)]+)\)$/u.exec(diagnostic.code ?? "")?.[1];
      return rule === undefined ? [] : [rule];
    }),
  );
  assert.deepEqual([...rules].sort(), [
    "no-chained-type-assertions",
    "no-conditional-empty-object-spread",
    "no-known-value-widening",
    "no-module-mocking",
    "no-object-parameters",
    "no-reflect-apply",
    "no-reflect-get",
    "no-runtime-typeof",
    "no-shape-in-symbol-names",
    "no-unknown-parameters",
    "no-unknown-returns",
    "no-unknown-type-aliases",
    "no-unsafe-dictionary-type",
    "no-widen-then-assert",
    "require-safety-comment-for-type-assertion",
  ]);
});

test("bundled anti-slop profile matches the pinned upstream valid and invalid corpus", async () => {
  const fixture = JSON.parse(await readFile(
    path.resolve("conformance", "anti-slop-9b80d9a5", "cases.json"),
    "utf8",
  )) as {
    commit: string;
    cases: Array<{ rule: string; source: string; expected: number; origin: string }>;
  };
  assert.equal(fixture.commit, "9b80d9a5c317d3af94d88a577bdbde4d9a45f7be");
  const result = await runOxlintWasm({
    wasmPath,
    timeoutMs: 60_000,
    files: fixture.cases.map((entry, index) => ({ path: `conformance/case-${index}.ts`, source: entry.source })),
  });
  const filesByPath = new Map(result.files.map((file) => [file.path, file]));
  const mismatches = fixture.cases.flatMap((entry, index) => {
    const code = `anti-slop(${entry.rule})`;
    const actual = filesByPath.get(`conformance/case-${index}.ts`)?.diagnostics.filter((diagnostic) => diagnostic.code === code).length ?? 0;
    return actual === entry.expected ? [] : [{ index, rule: entry.rule, origin: entry.origin, expected: entry.expected, actual, source: entry.source }];
  });
  assert.deepEqual(mismatches, []);
});

test("README-only anti-slop rules preserve ordinary typed code", async () => {
  const cases = [
    ["no-chained-type-assertions", "const literal = 'ready' as const;"],
    ["no-runtime-typeof", "function read(input: string): string { return input; }"],
    ["no-shape-in-symbol-names", "interface UserRecord { id: string }"],
    ["no-unknown-parameters", "function parse(input: string): string { return input; }"],
    ["no-unknown-type-aliases", "type ExternalValue = string;"],
    ["no-widen-then-assert", "type User = { id: number }; const user = { id: 1 } satisfies User; console.log(user.id);"],
  ] as const;
  const result = await runOxlintWasm({
    wasmPath,
    timeoutMs: 20_000,
    files: cases.map(([, source], index) => ({ path: `negative/case-${index}.ts`, source })),
  });
  for (const [index, [rule]] of cases.entries()) {
    const diagnostics = result.files[index]?.diagnostics ?? [];
    assert.equal(diagnostics.some((diagnostic) => diagnostic.code === `anti-slop(${rule})`), false, rule);
  }
});

test("anti-slop binding evidence does not cross lexical scopes by identifier spelling", async () => {
  const source = [
    "function first(): void { const value: unknown = { id: 1 }; console.log(value); }",
    "function second(value: unknown): number { return (value as { id: number }).id; }",
    "function third(): number { const local: unknown = { id: 1 }; return (local as { id: number }).id; }",
  ].join("\n");
  const result = await runOxlintWasm({
    wasmPath,
    timeoutMs: 20_000,
    files: [{ path: "scopes.ts", source }],
  });
  const diagnostics = result.files[0]?.diagnostics.filter((diagnostic) => diagnostic.code === "anti-slop(no-widen-then-assert)") ?? [];
  assert.equal(diagnostics.length, 1);
  assert.match(diagnostics[0]?.message ?? "", /Binding "local"/u);
});

test("diagnostics preserve byte spans and expose stable line and column locations", async () => {
  const source = "const π = 1;\n debugger;\n";
  const result = await runOxlintWasm({
    wasmPath,
    timeoutMs: 20_000,
    files: [{ path: "unicode.ts", source }],
  });
  const diagnostic = result.files[0]?.diagnostics.find((candidate) => candidate.code === "eslint(no-debugger)");
  assert.ok(diagnostic);
  assert.equal(diagnostic.labels[0]?.span.offset, Buffer.byteLength("const π = 1;\n ", "utf8"));
  assert.equal(diagnostic.labels[0]?.span.length, 9);
  assert.equal(diagnostic.labels[0]?.span.line, 2);
  assert.equal(diagnostic.labels[0]?.span.column, 2);
  assert.equal(diagnostic.filename, "unicode.ts");
  assert.equal(diagnostic.url, "https://oxc.rs/docs/guide/usage/linter/rules/eslint/no-debugger.html");
});

test("certified JSON and JSONC configuration changes rules and malformed configuration is explicit", async () => {
  const configured = await runOxlintWasm({
    wasmPath,
    timeoutMs: 20_000,
    configJson: JSON.stringify({ rules: { "no-debugger": "error", "no-const-assign": "off" } }),
    configPath: path.resolve(".oxlintrc.json"),
    files: [{ path: path.resolve("src/configured.ts"), source: "debugger;\nconst value = 1;\nvalue = 2;\nconsole.log(value);\n" }],
  });
  assert.deepEqual(configured.files[0]?.diagnostics.map((diagnostic) => [diagnostic.code, diagnostic.severity]), [
    ["eslint(no-debugger)", "error"],
  ]);

  const commentedJson = await runOxlintWasm({
    wasmPath,
    timeoutMs: 20_000,
    configJson: "{ // Oxlint accepts comments in .json files\n \"rules\": { \"no-debugger\": \"off\" } }",
    configPath: path.resolve(".oxlintrc.json"),
    files: [{ path: "src/commented-json.ts", lintPath: path.resolve("src/commented-json.ts"), source: "debugger;\n" }],
  });
  assert.deepEqual(commentedJson.files[0]?.diagnostics, []);

  const jsonc = await runOxlintWasm({
    wasmPath,
    timeoutMs: 20_000,
    configJson: "{ /* comment */ \"rules\": { \"no-debugger\": \"off\" } }",
    configPath: path.resolve(".oxlintrc.jsonc"),
    files: [{ path: "src/jsonc.ts", lintPath: path.resolve("src/jsonc.ts"), source: "debugger;\n" }],
  });
  assert.deepEqual(jsonc.files[0]?.diagnostics, []);

  const malformed = await runOxlintWasm({
    wasmPath,
    timeoutMs: 20_000,
    configJson: "[",
    files: [{ path: "src/app.ts", source: "debugger;\n" }],
  });
  assert.equal(malformed.files[0]?.status, "error");
  assert.match(malformed.files[0]?.error ?? "", /Failed to parse oxlint configuration/);

  const unsupported = await runOxlintWasm({
    wasmPath,
    timeoutMs: 20_000,
    configJson: JSON.stringify({ rules: { "no-console": "error" } }),
    configPath: path.resolve(".oxlintrc.json"),
    files: [{ path: "src/unsupported.ts", lintPath: path.resolve("src/unsupported.ts"), source: "console.log(1);\n" }],
  });
  assert.equal(unsupported.files[0]?.status, "error");
  assert.match(unsupported.files[0]?.error ?? "", /outside the certified WebAssembly rule profile/);
});

test("eslint and config ignore patterns use the upstream matcher", async () => {
  const root = path.resolve("fixture-root");
  const result = await runOxlintWasm({
    wasmPath,
    timeoutMs: 20_000,
    ignoreRoot: root,
    ignorePatterns: ["ignored/**", "!ignored/keep.ts"],
    configJson: JSON.stringify({ ignorePatterns: ["generated/**"] }),
    configPath: path.join(root, ".oxlintrc.json"),
    files: [
      { path: "ignored/drop.ts", lintPath: path.join(root, "ignored/drop.ts"), source: "debugger;\n" },
      { path: "ignored/keep.ts", lintPath: path.join(root, "ignored/keep.ts"), source: "debugger;\n" },
      { path: "generated/file.ts", lintPath: path.join(root, "generated/file.ts"), source: "debugger;\n" },
    ],
  });
  assert.deepEqual(result.files.map((file) => [file.path, file.status, file.diagnostics.length]), [
    ["generated/file.ts", "ignored", 0],
    ["ignored/drop.ts", "ignored", 0],
    ["ignored/keep.ts", "ok", 1],
  ]);
});

test("ignored malformed files are excluded before parsing", async () => {
  const root = path.resolve("/fixture");
  const result = await runOxlintWasm({
    wasmPath,
    timeoutMs: 20_000,
    files: [{
      path: "ignored/broken.ts",
      lintPath: path.join(root, "ignored", "broken.ts"),
      source: "const = ;\n",
    }],
    ignoreRoot: root,
    ignorePatterns: ["ignored/**"],
  });
  assert.deepEqual(result.files.map(({ path: file, status, diagnostics }) => [file, status, diagnostics.length]), [
    ["ignored/broken.ts", "ignored", 0],
  ]);
});

test("Windows logical paths are normalized before entering the WASI path model", async () => {
  const result = await runOxlintWasm({
    wasmPath,
    timeoutMs: 20_000,
    ignoreRoot: "C:\\repo",
    ignorePatterns: ["generated/**"],
    configJson: JSON.stringify({ categories: { correctness: "off" }, rules: { "no-debugger": "error" } }),
    configPath: "C:\\repo\\.oxlintrc.json",
    files: [
      { path: "generated\\drop.ts", lintPath: "C:\\repo\\generated\\drop.ts", source: "debugger;\r\n" },
      { path: "src\\windows.ts", lintPath: "C:\\repo\\src\\windows.ts", source: "debugger;\r\n" },
    ],
  });
  assert.deepEqual(result.files.map((file) => [file.path, file.status]), [
    ["generated\\drop.ts", "ignored"],
    ["src\\windows.ts", "ok"],
  ]);
  assert.equal(result.files[1]?.diagnostics[0]?.filename, "src/windows.ts");
  assert.equal(result.files[1]?.diagnostics[0]?.labels[0]?.span.line, 1);
  assert.equal(result.files[1]?.diagnostics[0]?.labels[0]?.span.column, 1);
});

test("malformed JS, JSX, TypeScript, and TSX produce parser diagnostics instead of crashing", async () => {
  const result = await runOxlintWasm({
    wasmPath,
    timeoutMs: 20_000,
    files: ["js", "jsx", "ts", "tsx"].map((extension) => ({ path: `broken.${extension}`, source: "const = ;\r\n" })),
  });
  for (const file of result.files) {
    assert.equal(file.status, "ok");
    assert.ok(file.diagnostics.length > 0);
    assert.ok((file.diagnostics[0]?.labels.length ?? 0) > 0);
  }
});

test("output is deterministic regardless of input order", async () => {
  const options = {
    wasmPath,
    timeoutMs: 20_000,
    files: [
      { path: "z.ts", source: "debugger;\n" },
      { path: "a.ts", source: "const value = 1;\n" },
    ],
  };
  const first = await runOxlintWasm(options);
  const second = await runOxlintWasm({ ...options, files: [...options.files].reverse() });
  assert.deepEqual(second, first);
});

test("cancellation, timeouts, and file limits fail closed", async () => {
  const cancelled = new AbortController();
  cancelled.abort();
  await assert.rejects(
    () => runOxlintWasm({ wasmPath, timeoutMs: 20_000, signal: cancelled.signal, files: [] }),
    /was cancelled/,
  );
  await assert.rejects(
    () => runOxlintWasm({
      wasmPath,
      timeoutMs: 1,
      files: [{ path: "slow.ts", source: "const value = 1;\n".repeat(100_000) }],
    }),
    /exceeded 1 ms/,
  );
  await assert.rejects(
    () => runOxlintWasm({
      wasmPath,
      timeoutMs: 20_000,
      maxFileBytes: 4,
      files: [{ path: "large.ts", source: "12345" }],
    }),
    /exceeds the 4-byte file limit/,
  );
  await assert.rejects(
    () => runOxlintWasm({
      wasmPath,
      timeoutMs: 20_000,
      maxTotalBytes: 8,
      files: [{ path: "one.ts", source: "12345" }, { path: "two.ts", source: "12345" }],
    }),
    /exceed the 8-byte batch limit/,
  );
});

test("artifact imports only capability-free WASI and enforces its memory maximum", async () => {
  const bytes = await readFile(wasmPath);
  const module = new WebAssembly.Module(bytes);
  assert.ok(WebAssembly.Module.imports(module).every((entry) => entry.module === "wasi_snapshot_preview1"));
  assert.deepEqual(
    WebAssembly.Module.exports(module).map((entry) => entry.name).sort(),
    [
      "friendly_adversary_oxlint_abi_version",
      "friendly_adversary_oxlint_alloc",
      "friendly_adversary_oxlint_dealloc",
      "friendly_adversary_oxlint_lint",
      "friendly_adversary_oxlint_rules",
      "memory",
    ].sort(),
  );
  const wasi = new WASI({ version: "preview1", args: [], env: {}, preopens: {}, returnOnExit: true });
  const instance = new WebAssembly.Instance(module, wasi.getImportObject() as WebAssembly.Imports);
  wasi.initialize(instance);
  const exports = instance.exports as {
    memory: WebAssembly.Memory;
    friendly_adversary_oxlint_abi_version(): number;
    friendly_adversary_oxlint_dealloc(pointer: number, length: number): void;
    friendly_adversary_oxlint_rules(): bigint;
  };
  assert.equal(exports.friendly_adversary_oxlint_abi_version(), OXLINT_WASM_ABI_VERSION);
  const packedRules = exports.friendly_adversary_oxlint_rules();
  const rulesPointer = Number(packedRules & 0xffff_ffffn);
  const rulesLength = Number(packedRules >> 32n);
  const inventory = JSON.parse(new TextDecoder().decode(
    new Uint8Array(exports.memory.buffer, rulesPointer, rulesLength),
  )) as {
    total: number;
    turned_on_by_default_count: number;
    certified_count: number;
    rules: Array<{ plugin: string; certified_by_friendly_adversary: boolean }>;
  };
  exports.friendly_adversary_oxlint_dealloc(rulesPointer, rulesLength);
  assert.equal(inventory.total, 862);
  assert.equal(inventory.turned_on_by_default_count, 126);
  assert.equal(inventory.certified_count, 111);
  const certifiedByPlugin: Record<string, number> = {};
  for (const rule of inventory.rules.filter((candidate) => candidate.certified_by_friendly_adversary)) {
    certifiedByPlugin[rule.plugin] = (certifiedByPlugin[rule.plugin] ?? 0) + 1;
  }
  assert.deepEqual(certifiedByPlugin, { "anti-slop": 15, eslint: 57, oxc: 14, typescript: 12, unicorn: 13 });
  const currentPages = exports.memory.buffer.byteLength / 65_536;
  const maximumPages = OXLINT_WASM_MAX_MEMORY_BYTES / 65_536;
  exports.memory.grow(maximumPages - currentPages);
  assert.throws(() => exports.memory.grow(1), /Maximum memory size exceeded/);
});
