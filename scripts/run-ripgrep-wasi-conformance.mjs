import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { WASI } from "node:wasi";

const execFileAsync = promisify(execFile);
const script = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(script), "..");
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

if (process.argv[2] === "--child") {
  const modulePath = process.argv[3];
  const temporaryDirectory = process.argv[4];
  const sourceDirectory = process.argv[5];
  if (!modulePath || !temporaryDirectory || !sourceDirectory) {
    throw new Error("Child mode requires a module, temporary directory, and source directory");
  }
  const wasi = new WASI({
    version: "preview1",
    args: [modulePath, ...process.argv.slice(6)],
    env: { RUST_BACKTRACE: "1" },
    preopens: { ".": sourceDirectory, "/tmp": temporaryDirectory },
    returnOnExit: true,
  });
  const module = await WebAssembly.compile(await readFile(modulePath));
  const instance = await WebAssembly.instantiate(module, { wasi_snapshot_preview1: wasi.wasiImport });
  process.exitCode = wasi.start(instance);
} else {
  const modulesFlag = process.argv.indexOf("--modules");
  const sourceFlag = process.argv.indexOf("--source");
  const outputFlag = process.argv.indexOf("--output");
  const modulesDirectory = modulesFlag >= 0 ? process.argv[modulesFlag + 1] : undefined;
  const sourceRoot = sourceFlag >= 0 ? process.argv[sourceFlag + 1] : undefined;
  const output = outputFlag >= 0 ? process.argv[outputFlag + 1] : undefined;
  if (!modulesDirectory || !sourceRoot || !output) {
    throw new Error("Usage: node scripts/run-ripgrep-wasi-conformance.mjs --modules <directory> --source <ripgrep source> --output <results.json>");
  }

  const componentPatterns = new Map([
    ["globset", /^globset-/u],
    ["grep-cli", /^grep_cli-/u],
    ["grep-matcher", /^grep_matcher-/u],
    ["grep-matcher-integration", /^integration-/u],
    ["grep-printer", /^grep_printer-/u],
    ["grep-regex", /^grep_regex-/u],
    ["grep-searcher", /^grep_searcher-/u],
    ["ignore", /^ignore-/u],
    ["ignore-integration-bom", /^gitignore_skip_bom-/u],
    ["ignore-integration-parent", /^gitignore_matched_path_or_any_parents_tests-/u],
    ["rg-core", /^rg-/u],
  ]);
  const files = (await readdir(modulesDirectory)).filter((file) => file.endsWith(".wasm")).sort();
  const selected = new Map();
  for (const [component, pattern] of componentPatterns) {
    const matches = files.filter((file) => pattern.test(file));
    if (component !== "rg-core") {
      if (matches.length !== 1) throw new Error(`Expected one ${component} WASI test module, found ${matches.length}`);
      selected.set(component, matches[0]);
      continue;
    }
    const withTests = [];
    for (const file of matches) {
      const modulePath = path.resolve(modulesDirectory, file);
      const probeDirectory = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-ripgrep-probe-"));
      try {
        const listed = await execFileAsync(
          process.execPath,
          [script, "--child", modulePath, probeDirectory, sourceRoot, "--list", "--format=terse"],
          { cwd: modulesDirectory, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
        ).catch(() => undefined);
        if (listed?.stdout.split(/\r?\n/u).some((line) => line.endsWith(": test"))) withTests.push(file);
      } finally {
        await rm(probeDirectory, { recursive: true, force: true });
      }
    }
    if (withTests.length !== 1) throw new Error(`Expected one rg-core WASI test module, found ${withTests.length}`);
    selected.set(component, withTests[0]);
  }

  const modules = [];
  const seenTests = new Set();
  let passed = 0;
  let ignored = 0;
  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-ripgrep-wasi-"));
  try {
    for (const [component, file] of selected) {
      const modulePath = path.resolve(modulesDirectory, file);
      const crateDirectory = component === "rg-core"
        ? path.resolve(sourceRoot)
        : path.resolve(sourceRoot, "crates", component.replace(/-integration(?:-bom|-parent)?$/u, "").replace("grep-matcher", "matcher").replace("grep-printer", "printer").replace("grep-regex", "regex").replace("grep-searcher", "searcher").replace("grep-cli", "cli"));
      const moduleTemporaryDirectory = await mkdtemp(path.join(temporaryRoot, `${component.replaceAll(/[^a-z0-9]+/gu, "-")}-`));
      const options = { cwd: modulesDirectory, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 };
      const listed = await execFileAsync(process.execPath, [script, "--child", modulePath, moduleTemporaryDirectory, crateDirectory, "--list", "--format=terse"], options);
      const testIds = listed.stdout.trim().split(/\r?\n/u).filter(Boolean).map((line) => {
        const match = /^(.*): test$/u.exec(line);
        if (!match) throw new Error(`${component}: malformed test-list row: ${line}`);
        return match[1];
      });
      const executed = await execFileAsync(process.execPath, [script, "--child", modulePath, moduleTemporaryDirectory, crateDirectory, "--test-threads=1"], options);
      const statuses = new Map();
      for (const line of executed.stdout.split(/\r?\n/u)) {
        const match = /^test (.+) \.\.\. (ok|ignored)(?:, .*)?$/u.exec(line);
        if (match) statuses.set(match[1].replace(/ - should panic$/u, ""), match[2]);
      }
      const tests = testIds.map((testId) => {
        const status = statuses.get(testId);
        if (!status) throw new Error(`${component}: no execution result for ${testId}`);
        const qualifiedId = `${component}:${testId}`;
        if (seenTests.has(qualifiedId)) throw new Error(`Duplicate WASI test result: ${qualifiedId}`);
        seenTests.add(qualifiedId);
        if (status === "ok") passed += 1;
        else ignored += 1;
        return { id: testId, status };
      });
      modules.push({
        component,
        file,
        sha256: sha256(await readFile(modulePath)),
        passed: tests.filter((test) => test.status === "ok").length,
        ignored: tests.filter((test) => test.status === "ignored").length,
        tests,
      });
    }
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true });
  }

  const lock = JSON.parse(await readFile(path.join(root, "engines", "ripgrep-wasm", "upstream-lock.json"), "utf8"));
  const result = {
    schemaVersion: 1,
    upstreamCommit: lock.upstream.commit,
    sourceArchiveSha256: lock.upstream.sourceArchive.sha256,
    testHarnessPatchSha256: sha256(await readFile(path.join(root, "engines", "ripgrep-wasm", "conformance", "test-harness-wasi.patch"))),
    runtime: `node ${process.versions.node}`,
    target: "wasm32-wasip1",
    modules: modules.length,
    passed,
    failed: 0,
    ignored,
    results: modules,
  };
  await writeFile(output, `${JSON.stringify(result, null, 2)}\n`);
  process.stdout.write(`ripgrep WASI conformance: ${passed} passed, 0 failed, ${ignored} ignored across ${modules.length} modules\n`);
}
