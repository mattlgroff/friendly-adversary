import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { pathToFileURL } from "node:url";
import { collectTools } from "../src/tools.js";

const execFileAsync = promisify(execFile);
const packageRoot = path.resolve(".");
const runner = path.join(packageRoot, "dist", "src", "semgrep-wasm-cli.js");
const config = path.join(packageRoot, "rules", "semgrep");

async function scan(repo: string, targets: string[]): Promise<string> {
  const sandbox = path.join(repo, ".scan-sandbox");
  await mkdir(sandbox, { recursive: true });
  const [packageReal, repoReal, sandboxReal] = await Promise.all([
    realpath(packageRoot),
    realpath(repo),
    realpath(sandbox),
  ]);
  const readable = [...new Set([path.resolve(packageRoot), packageReal, path.resolve(repo), repoReal])];
  const result = await execFileAsync(process.execPath, [
    "--permission",
    "--allow-worker",
    ...readable.map((target) => `--allow-fs-read=${target}`),
    `--allow-fs-write=${sandboxReal}`,
    "--max-old-space-size=512",
    runner,
    "scan",
    "--metrics=off",
    "--config",
    config,
    "--json",
    "--",
    ...targets,
  ], {
    cwd: repo,
    env: { PATH: process.env.PATH, TMPDIR: sandboxReal, TEMP: sandboxReal, TMP: sandboxReal },
    maxBuffer: 16 * 1024 * 1024,
  });
  return result.stdout;
}

test("Semgrep wrapper handles malformed source deterministically without false findings", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-malformed-"));
  try {
    await writeFile(path.join(repo, "broken.ts"), "export const value = (\n");
    const left = await scan(repo, ["broken.ts"]);
    const right = await scan(repo, ["broken.ts"]);
    assert.equal(left, right);
    const output = JSON.parse(left) as { results: unknown[]; errors: unknown[]; paths: { scanned: string[] } };
    assert.deepEqual(output.results, []);
    assert.deepEqual(output.errors, []);
    assert.deepEqual(output.paths.scanned, ["broken.ts"]);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("Semgrep wrapper accepts leading-hyphen targets after the option separator", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-hyphen-path-"));
  try {
    await writeFile(path.join(repo, "-leading.js"), "eval(input);\n");
    await writeFile(path.join(repo, "regular.js"), "const value = 1;\n");
    const output = JSON.parse(await scan(repo, ["-leading.js", "regular.js"])) as {
      paths: { scanned: string[] };
      errors: unknown[];
    };
    assert.deepEqual(output.paths.scanned, ["-leading.js", "regular.js"]);
    assert.deepEqual(output.errors, []);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("JavaScript shell detection does not confuse regular expression execution with child processes", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-shell-rule-"));
  try {
    await writeFile(
      path.join(repo, "commands.js"),
      "const childProcess = require(\"node:child_process\");\nconst input = process.argv[2];\n/unsafe/.exec(input);\nchildProcess.exec(input);\n",
    );
    const output = JSON.parse(await scan(repo, ["commands.js"])) as {
      results: Array<{ check_id: string; start: { line: number } }>;
      errors: unknown[];
    };
    const findings = output.results.filter((result) => result.check_id === "friendly-adversary.javascript.shell-exec");
    assert.deepEqual(findings.map((finding) => finding.start.line), [4]);
    assert.deepEqual(output.errors, []);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("shell execution rules resolve direct and aliased imports without matching local callables", async () => {
  const targets = [
    "tests/fixtures/semgrep-wasm/javascript-shell-imports.js",
    "tests/fixtures/semgrep-wasm/javascript-shell-requires.js",
    "tests/fixtures/semgrep-wasm/typescript-shell-imports.ts",
    "tests/fixtures/semgrep-wasm/python-shell-imports.py",
  ];
  const output = JSON.parse(await scan(packageRoot, targets)) as {
    results: Array<{ check_id: string; path: string; start: { line: number } }>;
    errors: unknown[];
  };
  const findings = output.results
    .filter((result) => result.check_id.endsWith(".shell-exec"))
    .map((result) => [result.path, result.start.line] as const);
  assert.deepEqual(findings, [
    ["tests/fixtures/semgrep-wasm/javascript-shell-imports.js", 7],
    ["tests/fixtures/semgrep-wasm/javascript-shell-imports.js", 8],
    ["tests/fixtures/semgrep-wasm/javascript-shell-imports.js", 9],
    ["tests/fixtures/semgrep-wasm/javascript-shell-requires.js", 5],
    ["tests/fixtures/semgrep-wasm/javascript-shell-requires.js", 6],
    ["tests/fixtures/semgrep-wasm/javascript-shell-requires.js", 7],
    ["tests/fixtures/semgrep-wasm/python-shell-imports.py", 6],
    ["tests/fixtures/semgrep-wasm/python-shell-imports.py", 7],
    ["tests/fixtures/semgrep-wasm/python-shell-imports.py", 8],
    ["tests/fixtures/semgrep-wasm/typescript-shell-imports.ts", 4],
    ["tests/fixtures/semgrep-wasm/typescript-shell-imports.ts", 5],
  ]);
  assert.deepEqual(output.errors, []);
});

test("Semgrep wrapper preserves Unicode and CRLF source locations", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-locations-"));
  try {
    const source = "const café = \"é\";\r\nconst input = process.argv[2];\r\neval(input);\r\n";
    await writeFile(path.join(repo, "unicode.js"), source);
    const output = JSON.parse(await scan(repo, ["unicode.js"])) as {
      results: Array<{ check_id: string; start: { line: number; col: number; offset: number }; end: { line: number; col: number; offset: number } }>;
      errors: unknown[];
    };
    const finding = output.results.find((result) => result.check_id === "friendly-adversary.javascript.dynamic-code-execution");
    assert.ok(finding);
    const startOffset = Buffer.byteLength(source.slice(0, source.indexOf("eval(input)")));
    assert.deepEqual(finding.start, { line: 3, col: 1, offset: startOffset });
    assert.deepEqual(finding.end, { line: 3, col: 12, offset: startOffset + Buffer.byteLength("eval(input)") });
    assert.deepEqual(output.errors, []);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("dynamic-code rule covers callable Function and nonliteral constructor bodies", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-function-constructor-"));
  try {
    await writeFile(path.join(repo, "functions.js"), [
      "const input = process.argv[2];",
      "Function(input);",
      "new Function(\"value\", input);",
      "Function(\"return 1\");",
      "",
    ].join("\n"));
    const output = JSON.parse(await scan(repo, ["functions.js"])) as {
      results: Array<{ check_id: string; start: { line: number } }>;
      errors: unknown[];
    };
    assert.deepEqual(
      output.results
        .filter((result) => result.check_id === "friendly-adversary.javascript.dynamic-code-execution")
        .map((result) => result.start.line),
      [2, 3],
    );
    assert.deepEqual(output.errors, []);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("Semgrep wrapper rejects traversal, redirected paths, and unsupported languages", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-paths-"));
  const repo = path.join(root, "repo");
  try {
    await mkdir(repo);
    await writeFile(path.join(root, "outside.js"), "eval(input);\n");
    await writeFile(path.join(repo, "notes.txt"), "eval(input);\n");
    await assert.rejects(() => scan(repo, ["../outside.js"]), (error: unknown) =>
      /Target is not a regular file|Target resolves outside the repository/u.test(String((error as Error & { stderr?: string }).stderr)));
    await assert.rejects(() => scan(repo, ["notes.txt"]), (error: unknown) =>
      /Unsupported target language/u.test(String((error as Error & { stderr?: string }).stderr)));
    if (process.platform === "win32") {
      const outsideDirectory = path.join(root, "outside");
      await mkdir(outsideDirectory);
      await writeFile(path.join(outsideDirectory, "outside.js"), "eval(input);\n");
      await symlink(outsideDirectory, path.join(repo, "linked"), "junction");
      await assert.rejects(() => scan(repo, ["linked/outside.js"]), (error: unknown) =>
        /Target is not a regular file|Target resolves outside the repository/u.test(String((error as Error & { stderr?: string }).stderr)));
    } else {
      await symlink(path.join(root, "outside.js"), path.join(repo, "linked.js"));
      await assert.rejects(() => scan(repo, ["linked.js"]), (error: unknown) =>
        /Target is not a regular file/u.test(String((error as Error & { stderr?: string }).stderr)));
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("Semgrep accepts legal repository filenames beginning with two dots", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-dotdot-name-"));
  const leftRepo = path.join(root, "left");
  const rightRepo = path.join(root, "right");
  try {
    await mkdir(leftRepo);
    await mkdir(rightRepo);
    for (const repo of [leftRepo, rightRepo]) {
      await writeFile(path.join(repo, "..generated.js"), "const input = process.argv[2];\neval(input);\n");
    }
    const left = await scan(leftRepo, ["..generated.js"]);
    const right = await scan(rightRepo, ["..generated.js"]);
    assert.equal(left, right);
    const output = JSON.parse(left) as {
      paths: { scanned: string[] };
      friendly_adversary_native_outputs: Array<{ target: string; stdout: string }>;
      results: unknown[];
    };
    assert.deepEqual(output.paths.scanned, ["..generated.js"]);
    assert.equal(output.friendly_adversary_native_outputs[0]?.target, "..generated.js");
    const native = JSON.parse(output.friendly_adversary_native_outputs[0]?.stdout ?? "") as { results: unknown[] };
    assert.deepEqual(native.results, output.results);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("explicit changed files are scanned regardless of repository ignore files", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-ignore-"));
  try {
    await writeFile(path.join(repo, ".semgrepignore"), "ignored.js\n");
    await writeFile(path.join(repo, "ignored.js"), "const input = process.argv[2];\neval(input);\n");
    const output = JSON.parse(await scan(repo, ["ignored.js"])) as { results: unknown[]; paths: { scanned: string[] } };
    assert.equal(output.results.length, 1);
    assert.deepEqual(output.paths.scanned, ["ignored.js"]);
  } finally {
    await rm(repo, { recursive: true, force: true });
  }
});

test("Semgrep network guard denies every protected network API", async () => {
  const guard = path.join(packageRoot, "dist", "src", "network-guard.js");
  const script = `
    import { disableNetworkAccess } from ${JSON.stringify(pathToFileURL(guard).href)};
    disableNetworkAccess();
    const net = await import("node:net");
    const tls = await import("node:tls");
    const http = await import("node:http");
    const https = await import("node:https");
    const http2 = await import("node:http2");
    const dgram = await import("node:dgram");
    const dns = await import("node:dns");
    const dnsPromises = await import("node:dns/promises");
    const attempts = [
      ["net.connect", () => net.connect(9, "127.0.0.1")],
      ["net.createConnection", () => net.createConnection(9, "127.0.0.1")],
      ["net.Socket.connect", () => new net.Socket().connect(9, "127.0.0.1")],
      ["net.Socket.open", () => new net.Socket().open({ port: 9, host: "127.0.0.1" })],
      ["tls.connect", () => tls.connect(443, "example.com")],
      ["tls.TLSSocket.connect", () => new tls.TLSSocket().connect(443, "example.com")],
      ["http.get", () => http.get("http://example.com")],
      ["http.request", () => http.request("http://example.com")],
      ["https.get", () => https.get("https://example.com")],
      ["https.request", () => https.request("https://example.com")],
      ["http2.connect", () => http2.connect("https://example.com")],
      ["dgram.createSocket", () => dgram.createSocket("udp4")],
      ["dgram.Socket.bind", () => new dgram.Socket("udp4").bind(9, "127.0.0.1")],
      ["dgram.Socket.connect", () => new dgram.Socket("udp4").connect(9, "127.0.0.1")],
      ["dgram.Socket.send", () => new dgram.Socket("udp4").send("x", 9, "127.0.0.1")],
      ...[
        "getDefaultResultOrder", "getServers", "lookup", "lookupService", "resolve", "resolve4", "resolve6",
        "resolveAny", "resolveCaa", "resolveCname", "resolveMx", "resolveNaptr", "resolveNs", "resolvePtr",
        "resolveSoa", "resolveSrv", "resolveTlsa", "resolveTxt", "reverse", "setDefaultResultOrder", "setServers",
      ].map((name) => [
        'dns.' + name,
        () => dns[name](),
      ]),
      ...[
        "getDefaultResultOrder", "getServers", "lookup", "lookupService", "resolve", "resolve4", "resolve6",
        "resolveAny", "resolveCaa", "resolveCname", "resolveMx", "resolveNaptr", "resolveNs", "resolvePtr",
        "resolveSoa", "resolveSrv", "resolveTlsa", "resolveTxt", "reverse", "setDefaultResultOrder", "setServers",
      ].flatMap((name) => [
        ['dns.promises.' + name, () => dns.promises[name]()],
        ['node:dns/promises.' + name, () => dnsPromises[name]()],
      ]),
      ['dns.Resolver.resolve', () => new dns.Resolver().resolve('example.com', () => {})],
      ['dns.promises.Resolver.resolve', () => new dns.promises.Resolver().resolve('example.com')],
      ['node:dns/promises.Resolver.resolve', () => new dnsPromises.Resolver().resolve('example.com')],
      ["fetch", () => fetch("https://example.com")],
      ...("WebSocket" in globalThis ? [["WebSocket", () => new WebSocket("wss://example.com")]] : []),
    ];
    const results = [];
    for (const [name, attempt] of attempts) {
      try { await attempt(); results.push([name, "NOT DENIED"]); } catch (error) { results.push([name, error.message]); }
    }
    process.stdout.write(JSON.stringify(results));
  `;
  const result = await execFileAsync(process.execPath, ["--input-type=module", "-e", script]);
  const attempts = JSON.parse(result.stdout) as Array<[string, string]>;
  assert.ok(attempts.length >= 80);
  assert.ok(attempts.every(([, message]) => message === "Network access is disabled for the bundled Semgrep engine"));
});

test("rule validation rejects unsupported Semgrep features", async () => {
  const rules = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-rules-"));
  try {
    await writeFile(path.join(rules, "unsupported.yml"), `rules:
  - id: friendly-adversary.python.unsupported
    message: Unsupported fixture
    severity: WARNING
    languages: [python]
    mode: taint
    pattern: eval($VALUE)
`);
    await assert.rejects(
      () => execFileAsync(process.execPath, [path.join(packageRoot, "scripts", "validate-semgrep-rules.mjs"), "--rules", rules]),
      (error: unknown) => /unsupported rule key mode/u.test(String((error as Error & { stderr?: string }).stderr)),
    );
  } finally {
    await rm(rules, { recursive: true, force: true });
  }
});

test("rule validation rejects quoted YAML keys before they can bypass the allowlist", async () => {
  const rules = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-quoted-rules-"));
  try {
    await writeFile(path.join(rules, "unsupported.yml"), `rules:
  - id: friendly-adversary.python.unsupported
    message: Unsupported fixture
    severity: WARNING
    languages: [python]
    "pattern-regex": "eval\\("
`);
    await assert.rejects(
      () => execFileAsync(process.execPath, [path.join(packageRoot, "scripts", "validate-semgrep-rules.mjs"), "--rules", rules]),
      (error: unknown) => /only unquoted block mapping keys are supported/u.test(String((error as Error & { stderr?: string }).stderr)),
    );
  } finally {
    await rm(rules, { recursive: true, force: true });
  }
});

test("rule validation rejects flow mappings that could hide unsupported keys", async () => {
  const rules = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-flow-rules-"));
  try {
    await writeFile(path.join(rules, "unsupported.yml"), "rules: [{ id: friendly-adversary.python.unsupported, pattern-regex: eval } ]\n");
    await assert.rejects(
      () => execFileAsync(process.execPath, [path.join(packageRoot, "scripts", "validate-semgrep-rules.mjs"), "--rules", rules]),
      (error: unknown) => /rules must use block mapping syntax/u.test(String((error as Error & { stderr?: string }).stderr)),
    );
  } finally {
    await rm(rules, { recursive: true, force: true });
  }
});

test("Semgrep product execution is cancellable and strips inherited secrets", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-cancel-"));
  const repo = path.join(root, "repo");
  const runDirectory = path.join(repo, ".friendly-adversary", "runs", "fixture");
  const previous = process.env.FRIENDLY_ADVERSARY_TEST_SECRET;
  process.env.FRIENDLY_ADVERSARY_TEST_SECRET = "must-not-cross-semgrep-boundary";
  try {
    await mkdir(runDirectory, { recursive: true });
    await writeFile(path.join(repo, "app.js"), "const input = process.argv[2];\neval(input);\n");
    const started = Date.now();
    const records = await collectTools({
      repo,
      runDirectory,
      changedFiles: ["app.js"],
      mergeBaseSha: "0000000000000000000000000000000000000000",
      options: { timeoutMs: 50 },
      assetsRoot: packageRoot,
    });
    const semgrep = records.find((record) => record.name === "semgrep");
    assert.equal(semgrep?.status, "timed-out");
    assert.ok(Date.now() - started < 5_000);
    const artifacts = await Promise.all([
      readFile(path.join(runDirectory, "deterministic", "semgrep", "stdout.json"), "utf8"),
      readFile(path.join(runDirectory, "deterministic", "semgrep", "stderr.txt"), "utf8"),
      readFile(path.join(runDirectory, "deterministic", "semgrep", "metadata.json"), "utf8"),
    ]);
    assert.ok(artifacts.every((value) => !value.includes("must-not-cross-semgrep-boundary")));
  } finally {
    if (previous === undefined) delete process.env.FRIENDLY_ADVERSARY_TEST_SECRET;
    else process.env.FRIENDLY_ADVERSARY_TEST_SECRET = previous;
    await rm(root, { recursive: true, force: true });
  }
});
