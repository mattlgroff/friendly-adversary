import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { promisify } from "node:util";
import { analyzerReadableRoots, collectTools, windowsNodeCommandShimTarget } from "../src/tools.js";
import { installGlobalNodeFixture, installLocalNodeBin } from "./platform-fixtures.js";

const execFileAsync = promisify(execFile);

test("bundled ripgrep WebAssembly is required and ignores host executables", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-ripgrep-tools-"));
  const repo = path.join(root, "repo");
  const runDirectory = path.join(repo, ".friendly-adversary", "runs", "fixture");
  const binaries = path.join(root, "bin");
  const previousPath = process.env.PATH;
  try {
    await mkdir(runDirectory, { recursive: true });
    await writeFile(path.join(repo, "README.md"), "# Fixture\n");
    await mkdir(path.join(repo, ".review-contracts"), { recursive: true });
    await writeFile(path.join(repo, ".review-contracts", "policy.md"), "# Hidden policy\n");
    await mkdir(path.join(repo, ".git"), { recursive: true });
    await writeFile(path.join(repo, ".git", "must-not-index"), "internal git data\n");
    await installGlobalNodeFixture(binaries, repo, "rg", ".git/unused.mjs", "process.exit(93);");
    process.env.PATH = `${binaries}${path.delimiter}${previousPath ?? ""}`;
    const records = await collectTools({
      repo,
      runDirectory,
      changedFiles: ["README.md"],
      mergeBaseSha: "0000000000000000000000000000000000000000",
      options: { timeoutMs: 10_000 },
      assetsRoot: path.resolve("."),
    });
    const index = records.find((record) => record.name === "repository-file-index");
    assert.equal(index?.required, true);
    assert.equal(index?.status, "completed");
    assert.match(
      await readFile(path.join(runDirectory, "deterministic", "repository-file-index", "version.txt"), "utf8"),
      /^ripgrep 15\.2\.0\b/u,
    );
    assert.equal(
      await readFile(path.join(runDirectory, "deterministic", "repository-file-index", "stdout.txt"), "utf8"),
      ".review-contracts/policy.md\nREADME.md\n",
    );
  } finally {
    process.env.PATH = previousPath;
    await rm(root, { recursive: true, force: true });
  }
});

test("repository scripts use Bun when the repository declares a Bun lockfile", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-bun-tools-"));
  const repo = path.join(root, "repo");
  const runDirectory = path.join(repo, ".friendly-adversary", "runs", "fixture");
  const binaries = path.join(root, "bin");
  const marker = path.join(root, "bun-ran.txt");
  const previousPath = process.env.PATH;
  try {
    await mkdir(runDirectory, { recursive: true });
    await writeFile(path.join(repo, "README.md"), "# Fixture\n");
    await writeFile(path.join(repo, "package.json"), `${JSON.stringify({ private: true, scripts: { test: "fixture" } })}\n`);
    await writeFile(path.join(repo, "bun.lock"), "{\"lockfileVersion\": 1}\n");
    await installGlobalNodeFixture(
      binaries,
      repo,
      "bun",
      "run",
      `require("node:fs").writeFileSync(${JSON.stringify(marker)}, "yes"); process.exit(0);`,
    );
    process.env.PATH = `${binaries}${path.delimiter}${previousPath ?? ""}`;
    const records = await collectTools({
      repo,
      runDirectory,
      changedFiles: ["README.md"],
      mergeBaseSha: "0000000000000000000000000000000000000000",
      options: { timeoutMs: 10_000 },
      assetsRoot: path.resolve("."),
    });
    const repositoryTest = records.find((record) => record.name === "repository-test");
    assert.equal(repositoryTest?.status, "completed", repositoryTest?.reason);
    assert.match(repositoryTest?.command ?? "", /bun/u);
    assert.equal(await readFile(marker, "utf8"), "yes");
  } finally {
    process.env.PATH = previousPath;
    await rm(root, { recursive: true, force: true });
  }
});

test("standard pnpm and Yarn command shims resolve to JavaScript entrypoints without a shell", async () => {
  assert.equal(
    windowsNodeCommandShimTarget('@ECHO off\r\n"%~dp0\\node_modules\\corepack\\dist\\pnpm.js" %*\r\n'),
    "node_modules\\corepack\\dist\\pnpm.js",
  );
  assert.equal(
    windowsNodeCommandShimTarget('endLocal & "%_prog%" "%dp0%\\node_modules\\yarn\\bin\\yarn.cjs" %*\r\n'),
    "node_modules\\yarn\\bin\\yarn.cjs",
  );
  if (process.platform !== "win32") return;
  for (const manager of ["pnpm", "yarn"] as const) {
    const root = await mkdtemp(path.join(os.tmpdir(), `friendly-adversary-${manager}-cmd-shim-`));
    const repo = path.join(root, "repo");
    const runDirectory = path.join(repo, ".friendly-adversary", "runs", "fixture");
    const binaries = path.join(root, "bin");
    const cli = path.join(binaries, "node_modules", `${manager}-fixture`, "cli.mjs");
    const marker = path.join(root, `${manager}-ran.txt`);
    const previousPath = process.env.PATH;
    try {
      await mkdir(runDirectory, { recursive: true });
      await mkdir(path.dirname(cli), { recursive: true });
      await writeFile(path.join(repo, "README.md"), "# Fixture\n");
      await writeFile(path.join(repo, "package.json"), `${JSON.stringify({
        private: true,
        packageManager: `${manager}@1.0.0`,
        scripts: { test: "fixture" },
      })}\n`);
      await writeFile(cli, [
        "import { writeFileSync } from 'node:fs';",
        `if (process.argv[2] === '--version') { console.log('${manager} fixture 1.0'); process.exit(0); }`,
        `writeFileSync(${JSON.stringify(marker)}, process.argv.slice(2).join(' '));`,
      ].join("\n"));
      await writeFile(
        path.join(binaries, `${manager}.cmd`),
        `@ECHO off\r\n"${process.execPath}" "%~dp0\\node_modules\\${manager}-fixture\\cli.mjs" %*\r\n`,
      );
      process.env.PATH = binaries;
      const records = await collectTools({
        repo,
        runDirectory,
        changedFiles: ["README.md"],
        mergeBaseSha: "0000000000000000000000000000000000000000",
        options: { timeoutMs: 10_000 },
        assetsRoot: path.resolve("."),
      });
      const repositoryTest = records.find((record) => record.name === "repository-test");
      assert.equal(repositoryTest?.status, "completed", repositoryTest?.reason);
      const command = JSON.parse(repositoryTest?.command ?? "[]") as string[];
      assert.equal(command[0], process.execPath);
      assert.equal(command[1], await realpath(cli));
      assert.ok(!command.some((argument) => argument.toLowerCase().endsWith(".cmd")));
      assert.equal(await readFile(marker, "utf8"), "run test");
    } finally {
      process.env.PATH = previousPath;
      await rm(root, { recursive: true, force: true });
    }
  }
});

test("repository validate scripts are required deterministic checks", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-validate-script-"));
  const repo = path.join(root, "repo");
  const runDirectory = path.join(repo, ".friendly-adversary", "runs", "fixture");
  try {
    await mkdir(runDirectory, { recursive: true });
    await writeFile(path.join(repo, "README.md"), "# Fixture\n");
    await writeFile(path.join(repo, "package.json"), `${JSON.stringify({
      private: true,
      scripts: { validate: "node -e \"process.exit(0)\"" },
    })}\n`);
    const records = await collectTools({
      repo,
      runDirectory,
      changedFiles: ["README.md"],
      mergeBaseSha: "0000000000000000000000000000000000000000",
      options: { timeoutMs: 10_000 },
      assetsRoot: path.resolve("."),
    });
    const validation = records.find((record) => record.name === "repository-validate");
    assert.equal(validation?.required, true);
    assert.equal(validation?.status, "completed", validation?.reason);
    assert.match(validation?.command ?? "", /run.*validate/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("private evidence paths do not require repository output locks", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-invalid-output-"));
  const repo = path.join(root, "repo");
  const runDirectory = path.join(root, "outside-output", "fixture");
  try {
    await mkdir(repo, { recursive: true });
    await mkdir(runDirectory, { recursive: true });
    await writeFile(path.join(repo, "README.md"), "# Fixture\n");
    await writeFile(path.join(repo, "package.json"), `${JSON.stringify({ private: true, scripts: { test: "fixture" } })}\n`);
    const records = await collectTools({
        repo,
        runDirectory,
        scratchDirectory: path.join(root, "scratch"),
        changedFiles: ["README.md"],
        mergeBaseSha: "0000000000000000000000000000000000000000",
        options: { timeoutMs: 10_000 },
        assetsRoot: path.resolve("."),
      });
    assert.equal(records.find((record) => record.name === "repository-test")?.status, "execution-error");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("repository symbol search suppresses exact generated replicas without hiding unique evidence", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-symbol-replicas-"));
  const repo = path.join(root, "repo");
  const runDirectory = path.join(repo, ".friendly-adversary", "runs", "fixture");
  const codexMirror = "platforms/codex/plugins/friendly-adversary/skills/pr-review/engines/demo/mirror.ts";
  const claudeMirror = "platforms/claude-code/plugins/friendly-adversary/skills/pr-review/engines/demo/mirror.ts";
  const uniqueClaude = "platforms/claude-code/plugins/friendly-adversary/skills/pr-review/engines/demo/unique.ts";
  try {
    for (const file of ["src/change.ts", "engines/demo/mirror.ts", codexMirror, claudeMirror, uniqueClaude]) {
      await mkdir(path.dirname(path.join(repo, ...file.split("/"))), { recursive: true });
      await writeFile(path.join(repo, ...file.split("/")), "export function replicaSymbol() { return 1; }\n");
    }
    await mkdir(runDirectory, { recursive: true });
    const records = await collectTools({
      repo,
      runDirectory,
      changedFiles: ["src/change.ts"],
      mergeBaseSha: "0000000000000000000000000000000000000000",
      options: { timeoutMs: 10_000 },
      assetsRoot: path.resolve("."),
    });
    assert.equal(records.find((record) => record.name === "repository-symbol-search")?.status, "completed");
    const output = await readFile(path.join(runDirectory, "deterministic", "repository-symbol-search", "stdout.json"), "utf8");
    assert.match(output, /engines\/demo\/mirror\.ts/u);
    assert.match(output, new RegExp(uniqueClaude.replaceAll("/", "\\/"), "u"));
    assert.doesNotMatch(output, new RegExp(codexMirror.replaceAll("/", "\\/"), "u"));
    assert.doesNotMatch(output, new RegExp(claudeMirror.replaceAll("/", "\\/"), "u"));
  } finally {
    await rm(root, { recursive: true, force: true, maxRetries: 5, retryDelay: 50 });
  }
});

test("repository scripts run from changed package directories and replace direct TypeScript compilation", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-package-tools-"));
  const repo = path.join(root, "repo");
  const app = path.join(repo, "packages", "app");
  const other = path.join(repo, "packages", "other");
  const runDirectory = path.join(repo, ".friendly-adversary", "runs", "fixture");
  const binaries = path.join(root, "bin");
  const marker = path.join(root, "commands.ndjson");
  const previousPath = process.env.PATH;
  try {
    await mkdir(path.join(app, "src"), { recursive: true });
    await mkdir(path.join(other, "src"), { recursive: true });
    await mkdir(runDirectory, { recursive: true });
    await writeFile(path.join(repo, "package.json"), `${JSON.stringify({
      private: true,
      packageManager: "bun@1.3.14",
      scripts: { lint: "fixture", test: "fixture", typecheck: "fixture" },
    })}\n`);
    await writeFile(path.join(repo, "bun.lock"), "{\"lockfileVersion\":1}\n");
    await writeFile(path.join(repo, "tsconfig.json"), "{\"include\":[\"packages/**/*.ts\"]}\n");
    await writeFile(path.join(app, "package.json"), `${JSON.stringify({
      private: true,
      scripts: { test: "bun test --timeout 30000", typecheck: "fixture" },
    })}\n`);
    await writeFile(path.join(app, "src", "app.ts"), "export const app = true;\n");
    await writeFile(path.join(app, "src", "app.test.ts"), "export const appTest = true;\n");
    await writeFile(path.join(other, "package.json"), `${JSON.stringify({
      private: true,
      scripts: { test: "must-not-run" },
    })}\n`);
    await writeFile(path.join(other, "src", "other.ts"), "export const other = true;\n");
    await installGlobalNodeFixture(
      binaries,
      repo,
      "bun",
      "run",
      `process.getBuiltinModule("node:fs").appendFileSync(${JSON.stringify(marker)}, JSON.stringify({ cwd: process.cwd(), args: process.argv.slice(2) }) + "\\n"); process.exit(0);`,
      [repo, app],
    );
    process.env.PATH = `${binaries}${path.delimiter}${previousPath ?? ""}`;
    const records = await collectTools({
      repo,
      runDirectory,
      changedFiles: ["packages/app/src/app.ts", "packages/app/src/app.test.ts"],
      mergeBaseSha: "0000000000000000000000000000000000000000",
      options: { timeoutMs: 10_000 },
      assetsRoot: path.resolve("."),
    });
    assert.deepEqual(
      records.filter((record) => record.name.startsWith("repository-") && !record.name.startsWith("repository-file-") && record.name !== "repository-symbol-search")
        .map((record) => record.name)
        .sort(),
      [
        "repository-lint",
        "repository-packages-app-test",
        "repository-packages-app-typecheck",
        "repository-test",
        "repository-typecheck",
      ],
    );
    assert.ok(!records.some((record) => record.name === "typescript" || record.name.startsWith("typescript-project-")));
    for (const name of [
      "repository-lint",
      "repository-packages-app-test",
      "repository-packages-app-typecheck",
      "repository-test",
      "repository-typecheck",
    ]) {
      const record = records.find((candidate) => candidate.name === name);
      assert.equal(record?.status, "completed", `${name}: ${record?.reason ?? "missing"}`);
    }
    const commands = (await readFile(marker, "utf8")).trim().split("\n").map((line) => JSON.parse(line) as {
      cwd: string;
      args: string[];
    });
    assert.equal(commands.filter((command) => command.cwd.endsWith(path.join("packages", "app"))).length, 2);
    assert.equal(commands.filter((command) => path.basename(command.cwd) === "repo").length, 3);
    assert.ok(!commands.some((command) => command.cwd.endsWith(path.join("packages", "other"))));
    const packageTest = commands.find((command) => (
      command.cwd.endsWith(path.join("packages", "app")) && command.args.includes("test")
    ));
    assert.deepEqual(packageTest?.args.slice(-2), ["--", "src/app.test.ts"]);
  } finally {
    process.env.PATH = previousPath;
    await rm(root, { recursive: true, force: true });
  }
});

test("bundled Oxlint uses its certified profile independently of repository configuration", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-oxlint-config-"));
  const repo = path.join(root, "repo");
  const runDirectory = path.join(repo, ".friendly-adversary", "runs", "fixture");
  try {
    await mkdir(runDirectory, { recursive: true });
    await writeFile(path.join(repo, "app.ts"), "console.log('value');\n");
    await writeFile(path.join(repo, ".oxlintrc.json"), JSON.stringify({ rules: { "no-console": "error" } }));
    const records = await collectTools({
      repo,
      runDirectory,
      changedFiles: ["app.ts"],
      mergeBaseSha: "0000000000000000000000000000000000000000",
      options: { timeoutMs: 10_000 },
      assetsRoot: path.resolve("."),
    });
    const bundledOxlint = records.find((record) => record.name === "oxlint-wasm");
    const repositoryOxlint = records.find((record) => record.name === "oxlint");
    assert.equal(bundledOxlint?.status, "completed");
    assert.equal(repositoryOxlint?.status, "skipped");
    assert.equal(repositoryOxlint?.required, true);
    assert.match(repositoryOxlint?.reason ?? "", /configured but unavailable/u);
    const directory = path.join(runDirectory, "deterministic", "oxlint-wasm");
    const bundledResult = JSON.parse(await readFile(path.join(directory, "stdout.json"), "utf8")) as {
      files: Array<{ status: string; error: string | null }>;
    };
    const metadata = JSON.parse(await readFile(path.join(directory, "metadata.json"), "utf8")) as {
      configurationMode: string;
    };
    assert.equal(bundledResult.files[0]?.status, "ok");
    assert.equal(bundledResult.files[0]?.error, null);
    assert.equal(metadata.configurationMode, "certified-fixed-profile");
    await assert.rejects(readFile(path.join(directory, "configured-attempt.json"), "utf8"), /ENOENT/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("bundled Ruff WebAssembly ignores native repository and host executables", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-tools-"));
  const repo = path.join(root, "repo");
  const runDirectory = path.join(repo, ".friendly-adversary", "runs", "fixture");
  const binaries = path.join(root, "bin");
  const previousPath = process.env.PATH;
  try {
    await mkdir(runDirectory, { recursive: true });
    await mkdir(binaries, { recursive: true });
    await writeFile(path.join(repo, "app.py"), "print(undefined_name)\n");
    await installLocalNodeBin(repo, "ruff", "process.exit(9);");
    await installGlobalNodeFixture(binaries, repo, "ruff", "check", "console.log('[]'); process.exit(1);");
    process.env.PATH = `${binaries}${path.delimiter}${previousPath ?? ""}`;
    const records = await collectTools({
      repo,
      runDirectory,
      changedFiles: ["app.py"],
      mergeBaseSha: "0000000000000000000000000000000000000000",
      options: { timeoutMs: 10_000 },
      assetsRoot: path.resolve("."),
    });
    const ruff = records.find((record) => record.name === "ruff-wasm");
    assert.equal(ruff?.status, "completed");
    assert.equal(ruff?.exitCode, 1);
    assert.match(ruff?.command ?? "", /internal:ruff-wasm@0\.16\.2/);
    assert.ok(!records.some((record) => record.name === "ruff"));
  } finally {
    process.env.PATH = previousPath;
    await rm(root, { recursive: true, force: true });
  }
});

test("bundled Semgrep WebAssembly ignores an untrusted repository binary", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-untrusted-tools-"));
  const repo = path.join(root, "repo");
  const runDirectory = path.join(repo, ".friendly-adversary", "runs", "fixture");
  const previousPath = process.env.PATH;
  try {
    await mkdir(runDirectory, { recursive: true });
    await writeFile(path.join(repo, "app.py"), "value = 1\n");
    await installLocalNodeBin(repo, "semgrep", "process.exit(9);");
    process.env.PATH = process.platform === "win32" ? "" : "/usr/bin:/bin";
    const records = await collectTools({
      repo,
      runDirectory,
      changedFiles: ["app.py"],
      mergeBaseSha: "0000000000000000000000000000000000000000",
      options: { timeoutMs: 10_000 },
      assetsRoot: path.resolve("."),
    });
    assert.equal(records.find((record) => record.name === "semgrep")?.status, "completed");
    const output = JSON.parse(await readFile(path.join(runDirectory, "deterministic", "semgrep", "stdout.json"), "utf8")) as { version: string; results: unknown[] };
    assert.equal(output.version, "1.172.0");
    assert.deepEqual(output.results, []);
    const argv = JSON.parse(await readFile(path.join(runDirectory, "deterministic", "semgrep", "argv.json"), "utf8")) as string[];
    assert.deepEqual(
      argv.filter((argument) => argument.startsWith("--allow-fs-read=")).map((argument) => argument.slice("--allow-fs-read=".length)).sort(),
      await analyzerReadableRoots(path.resolve("."), repo),
    );
  } finally {
    process.env.PATH = previousPath;
    await rm(root, { recursive: true, force: true });
  }
});

test("Semgrep filesystem permissions deduplicate an assets root that is also the repository root", async () => {
  const repo = path.resolve(".");
  const readable = await analyzerReadableRoots(repo, repo);
  assert.deepEqual(readable, [...new Set([repo, await realpath(repo)])].sort());
});

test("analyzer permissions retain both requested and canonical path aliases", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-analyzer-alias-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const canonical = path.join(root, "canonical-runtime");
  const alias = path.join(root, "requested-runtime-alias");
  await mkdir(canonical);
  await symlink(canonical, alias, process.platform === "win32" ? "junction" : "dir");
  assert.deepEqual(
    await analyzerReadableRoots(alias),
    [path.resolve(alias), await realpath(alias)].sort(),
  );
});

test("exact generated analyzer bundles are omitted with digest-attested evidence", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-generated-bundle-omissions-"));
  const repo = path.join(root, "repo");
  const previousPath = process.env.PATH;
  const gitLookup = process.platform === "win32"
    ? await execFileAsync("where.exe", ["git"])
    : await execFileAsync("which", ["git"]);
  const gitExecutable = gitLookup.stdout.trim().split(/\r?\n/u)[0];
  if (!gitExecutable) throw new Error("Git executable lookup returned no path");
  const runDirectory = path.join(repo, ".friendly-adversary", "runs", "fixture");
  const runtimeFiles = ["engine", "python", "typescript"].map((name) => `engines/semgrep-wasm/runtime/${name}/index.cjs`);
  const ruffRuntimeFile = "engines/ruff-wasm/runtime/ruff_wasm.js";
  const changedFiles = [
    ...runtimeFiles,
    ...runtimeFiles.map((file) => `platforms/claude-code/plugins/friendly-adversary/skills/pr-review/${file}`),
    ...runtimeFiles.map((file) => `platforms/codex/plugins/friendly-adversary/skills/pr-review/${file}`),
    ruffRuntimeFile,
    `platforms/claude-code/plugins/friendly-adversary/skills/pr-review/${ruffRuntimeFile}`,
    `platforms/codex/plugins/friendly-adversary/skills/pr-review/${ruffRuntimeFile}`,
  ];
  try {
    for (const file of changedFiles) {
      await mkdir(path.dirname(path.join(repo, ...file.split("/"))), { recursive: true });
      const marker = "/skills/pr-review/";
      const canonical = file.includes(marker) ? file.slice(file.indexOf(marker) + marker.length) : file;
      await writeFile(path.join(repo, ...file.split("/")), await readFile(path.resolve(...canonical.split("/"))));
    }
    await mkdir(runDirectory, { recursive: true });
    process.env.PATH = path.dirname(gitExecutable);
    const records = await collectTools({
      repo,
      runDirectory,
      changedFiles,
      mergeBaseSha: "0000000000000000000000000000000000000000",
      options: { timeoutMs: 10_000 },
      assetsRoot: path.resolve("."),
    });
    assert.equal(records.find((record) => record.name === "generated-bundle-omissions")?.status, "completed");
    assert.ok(!records.some((record) => record.name === "semgrep"));
    assert.ok(!records.some((record) => record.name === "oxlint-wasm"));
    const evidence = JSON.parse(await readFile(path.join(runDirectory, "deterministic", "generated-bundle-omissions", "omissions.json"), "utf8")) as {
      omittedFileCount: number;
      omissions: Array<{ path: string; sha256: string; reason: string; attestationSource: string }>;
    };
    assert.equal(evidence.omittedFileCount, 12);
    assert.deepEqual(evidence.omissions.map((entry) => entry.path), [...changedFiles].sort());
    assert.ok(evidence.omissions.every((entry) => /^[a-f0-9]{64}$/u.test(entry.sha256)));
    assert.ok(evidence.omissions.every((entry) => entry.reason === "exact-generated-analyzer-runtime"));
    assert.ok(evidence.omissions.every((entry) => entry.attestationSource.startsWith("installed-assets:")));
  } finally {
    process.env.PATH = previousPath;
    await rm(root, { recursive: true, force: true });
  }
});

test("changed generated plugin bundles remain analyzer inputs after a successful build", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-plugin-bundle-omissions-"));
  const repo = path.join(root, "repo");
  const runDirectory = path.join(repo, ".friendly-adversary", "runs", "fixture");
  const pluginFiles = ["claude-code", "codex"].map((platform) => (
    `platforms/${platform}/plugins/friendly-adversary/skills/pr-review/scripts/runtime/friendly-adversary-mcp.cjs`
  ));
  const bundle = "'use strict';\nconsole.log('generated bundle');\n";
  try {
    await mkdir(path.join(repo, "scripts"), { recursive: true });
    await mkdir(path.join(repo, "src"), { recursive: true });
    await writeFile(path.join(repo, "src", "canonical.cjs"), bundle);
    await writeFile(path.join(repo, "scripts", "build-mcp.mjs"), [
      "import { access, copyFile, mkdir } from 'node:fs/promises';",
      "if (await access('FAIL_BUILD').then(() => true, () => false)) process.exit(9);",
      "await mkdir('dist/mcp', { recursive: true });",
      "await copyFile('src/canonical.cjs', 'dist/mcp/friendly-adversary-mcp.cjs');",
      "",
    ].join("\n"));
    await writeFile(path.join(repo, "scripts", "sync-platform-assets.mjs"), "// trusted fixture\n");
    await writeFile(path.join(repo, "tsconfig.json"), "{}\n");
    await writeFile(path.join(repo, "package.json"), `${JSON.stringify({
      name: "plugin-bundle-fixture",
      private: true,
      scripts: { build: "node scripts/build-mcp.mjs" },
    }, null, 2)}\n`);
    await writeFile(path.join(repo, "package-lock.json"), `${JSON.stringify({
      name: "plugin-bundle-fixture",
      lockfileVersion: 3,
      requires: true,
      packages: { "": { name: "plugin-bundle-fixture" } },
    }, null, 2)}\n`);
    for (const file of pluginFiles) {
      await mkdir(path.dirname(path.join(repo, ...file.split("/"))), { recursive: true });
      await writeFile(path.join(repo, ...file.split("/")), bundle);
    }
    await execFileAsync("git", ["init", "-b", "main"], { cwd: repo });
    await execFileAsync("git", ["config", "user.email", "fixture@example.com"], { cwd: repo });
    await execFileAsync("git", ["config", "user.name", "Fixture"], { cwd: repo });
    await execFileAsync("git", ["add", "."], { cwd: repo });
    await execFileAsync("git", ["commit", "-m", "trusted base"], { cwd: repo });
    const mergeBaseSha = (await execFileAsync("git", ["rev-parse", "HEAD"], { cwd: repo })).stdout.trim();
    await mkdir(runDirectory, { recursive: true });

    const records = await collectTools({
      repo,
      runDirectory,
      changedFiles: pluginFiles,
      mergeBaseSha,
      options: { timeoutMs: 10_000 },
      assetsRoot: path.resolve("."),
    });
    assert.equal(records.find((record) => record.name === "repository-build")?.status, "completed");
    assert.ok(!records.some((record) => record.name === "generated-bundle-omissions"));
    assert.equal(records.find((record) => record.name === "semgrep")?.status, "completed");
    assert.equal(records.find((record) => record.name === "oxlint-wasm")?.status, "completed");
    const semgrep = JSON.parse(await readFile(path.join(
      runDirectory,
      "deterministic",
      "semgrep",
      "stdout.json",
    ), "utf8")) as { errors: unknown[] };
    assert.deepEqual(semgrep.errors, []);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("project-controlled tests cannot hide changed generated plugin bundles", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-plugin-attestation-order-"));
  const repo = path.join(root, "repo");
  const runDirectory = path.join(repo, ".friendly-adversary", "runs", "fixture");
  const pluginFiles = ["claude-code", "codex"].map((platform) => (
    `platforms/${platform}/plugins/friendly-adversary/skills/pr-review/scripts/runtime/friendly-adversary-mcp.cjs`
  ));
  const benign = "'use strict';\nconsole.log('trusted generated bundle');\n";
  const malicious = "'use strict';\nconst input = process.argv[2];\nrequire('child_process').exec(input);\n";
  try {
    await mkdir(path.join(repo, "scripts"), { recursive: true });
    await mkdir(path.join(repo, "tests"), { recursive: true });
    await mkdir(path.join(repo, "node_modules"), { recursive: true });
    await writeFile(path.join(repo, "node_modules", "build-input.cjs"), benign);
    await writeFile(path.join(repo, "scripts", "build-mcp.mjs"), [
      "import { copyFile, mkdir } from 'node:fs/promises';",
      "await mkdir('dist/mcp', { recursive: true });",
      "await copyFile('node_modules/build-input.cjs', 'dist/mcp/friendly-adversary-mcp.cjs');",
      "",
    ].join("\n"));
    await writeFile(path.join(repo, "scripts", "sync-platform-assets.mjs"), "// trusted fixture\n");
    await writeFile(path.join(repo, "tests", "poison.mjs"), "// benign base test\n");
    await writeFile(path.join(repo, "tsconfig.json"), "{}\n");
    await writeFile(path.join(repo, "package.json"), `${JSON.stringify({
      name: "plugin-attestation-order-fixture",
      private: true,
      scripts: {
        test: "node tests/poison.mjs",
        build: "node scripts/build-mcp.mjs",
      },
    }, null, 2)}\n`);
    await writeFile(path.join(repo, "package-lock.json"), `${JSON.stringify({
      name: "plugin-attestation-order-fixture",
      lockfileVersion: 3,
      requires: true,
      packages: { "": { name: "plugin-attestation-order-fixture" } },
    }, null, 2)}\n`);
    for (const file of pluginFiles) {
      await mkdir(path.dirname(path.join(repo, ...file.split("/"))), { recursive: true });
      await writeFile(path.join(repo, ...file.split("/")), benign);
    }
    await execFileAsync("git", ["init", "-b", "main"], { cwd: repo });
    await execFileAsync("git", ["config", "user.email", "fixture@example.com"], { cwd: repo });
    await execFileAsync("git", ["config", "user.name", "Fixture"], { cwd: repo });
    await execFileAsync("git", ["add", "package.json", "package-lock.json", "tsconfig.json", "scripts", "tests", "platforms"], { cwd: repo });
    await execFileAsync("git", ["commit", "-m", "trusted base"], { cwd: repo });
    const mergeBaseSha = (await execFileAsync("git", ["rev-parse", "HEAD"], { cwd: repo })).stdout.trim();
    for (const file of pluginFiles) await writeFile(path.join(repo, ...file.split("/")), malicious);
    await writeFile(path.join(repo, "tests", "poison.mjs"), [
      "import { writeFile } from 'node:fs/promises';",
      `await writeFile('node_modules/build-input.cjs', ${JSON.stringify(malicious)});`,
      "",
    ].join("\n"));
    await mkdir(runDirectory, { recursive: true });

    const records = await collectTools({
      repo,
      runDirectory,
      changedFiles: [...pluginFiles, "tests/poison.mjs"],
      mergeBaseSha,
      options: { timeoutMs: 10_000 },
      assetsRoot: path.resolve("."),
    });
    const buildIndex = records.findIndex((record) => record.name === "repository-build");
    const testIndex = records.findIndex((record) => record.name === "repository-test");
    assert.ok(buildIndex >= 0 && testIndex > buildIndex);
    assert.ok(!records.some((record) => record.name === "generated-bundle-omissions"));
    assert.equal(records.find((record) => record.name === "semgrep")?.status, "completed");
    const semgrep = JSON.parse(await readFile(path.join(runDirectory, "deterministic", "semgrep", "stdout.json"), "utf8")) as { results: unknown[] };
    assert.ok(semgrep.results.length > 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a lookalike generated bundle with a different digest remains reviewable", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-generated-lookalike-"));
  const repo = path.join(root, "repo");
  const file = "engines/semgrep-wasm/runtime/engine/index.cjs";
  const runDirectory = path.join(repo, ".friendly-adversary", "runs", "fixture");
  try {
    await mkdir(path.dirname(path.join(repo, file)), { recursive: true });
    await mkdir(runDirectory, { recursive: true });
    await writeFile(path.join(repo, file), "const input = process.argv[2];\nrequire('child_process').exec(input);\n");
    const records = await collectTools({
      repo,
      runDirectory,
      changedFiles: [file],
      mergeBaseSha: "0000000000000000000000000000000000000000",
      options: { timeoutMs: 10_000 },
      assetsRoot: path.resolve("."),
    });
    assert.ok(!records.some((record) => record.name === "generated-bundle-omissions"));
    assert.equal(records.find((record) => record.name === "semgrep")?.status, "completed");
    const output = JSON.parse(await readFile(path.join(runDirectory, "deterministic", "semgrep", "stdout.json"), "utf8")) as { results: unknown[] };
    assert.ok(output.results.length > 0);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a pull request cannot self-attest a modified generated bundle", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-self-attestation-"));
  const repo = path.join(root, "repo");
  const manifestPath = path.join(repo, "engines", "semgrep-wasm", "runtime-manifest.json");
  const file = "platforms/codex/plugins/friendly-adversary/skills/pr-review/engines/semgrep-wasm/runtime/engine/index.cjs";
  const absoluteFile = path.join(repo, ...file.split("/"));
  const runDirectory = path.join(repo, ".friendly-adversary", "runs", "fixture");
  try {
    await mkdir(path.dirname(manifestPath), { recursive: true });
    await mkdir(path.dirname(absoluteFile), { recursive: true });
    const trustedManifest = await readFile(path.resolve("engines/semgrep-wasm/runtime-manifest.json"), "utf8");
    const trustedBundle = await readFile(path.resolve("engines/semgrep-wasm/runtime/engine/index.cjs"));
    await writeFile(manifestPath, trustedManifest);
    await writeFile(absoluteFile, trustedBundle);
    await execFileAsync("git", ["init", "-b", "main"], { cwd: repo });
    await execFileAsync("git", ["config", "user.email", "fixture@example.com"], { cwd: repo });
    await execFileAsync("git", ["config", "user.name", "Fixture"], { cwd: repo });
    await execFileAsync("git", ["add", "."], { cwd: repo });
    await execFileAsync("git", ["commit", "-m", "trusted base"], { cwd: repo });
    const mergeBaseSha = (await execFileAsync("git", ["rev-parse", "HEAD"], { cwd: repo })).stdout.trim();

    const tamperedBundle = Buffer.from("const input = process.argv[2];\nrequire('child_process').exec(input);\n");
    const maliciousManifest = JSON.parse(trustedManifest) as {
      files: Array<{ path: string; bytes: number; sha256: string }>;
    };
    const maliciousEntry = maliciousManifest.files.find((entry) => entry.path === "runtime/engine/index.cjs");
    assert.ok(maliciousEntry);
    maliciousEntry.bytes = tamperedBundle.byteLength;
    const { createHash } = await import("node:crypto");
    maliciousEntry.sha256 = createHash("sha256").update(tamperedBundle).digest("hex");
    await writeFile(absoluteFile, tamperedBundle);
    await writeFile(manifestPath, `${JSON.stringify(maliciousManifest, null, 2)}\n`);
    await mkdir(runDirectory, { recursive: true });

    const records = await collectTools({
      repo,
      runDirectory,
      changedFiles: [file, "engines/semgrep-wasm/runtime-manifest.json"],
      mergeBaseSha,
      options: { timeoutMs: 10_000 },
      assetsRoot: repo,
    });
    assert.ok(!records.some((record) => record.name === "generated-bundle-omissions"));
    assert.ok(records.some((record) => record.name === "semgrep"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a checked-in nested plugin cannot self-attest a modified generated bundle", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-nested-self-attestation-"));
  const repo = path.join(root, "repo");
  const assetsRelative = "platforms/codex/plugins/friendly-adversary/skills/pr-review";
  const assetsRoot = path.join(repo, ...assetsRelative.split("/"));
  const manifestPath = path.join(assetsRoot, "engines", "semgrep-wasm", "runtime-manifest.json");
  const file = `${assetsRelative}/engines/semgrep-wasm/runtime/engine/index.cjs`;
  const absoluteFile = path.join(repo, ...file.split("/"));
  const runDirectory = path.join(repo, ".friendly-adversary", "runs", "fixture");
  try {
    await mkdir(path.dirname(manifestPath), { recursive: true });
    await mkdir(path.dirname(absoluteFile), { recursive: true });
    const trustedManifest = await readFile(path.resolve("engines/semgrep-wasm/runtime-manifest.json"), "utf8");
    const trustedBundle = await readFile(path.resolve("engines/semgrep-wasm/runtime/engine/index.cjs"));
    await writeFile(manifestPath, trustedManifest);
    await writeFile(absoluteFile, trustedBundle);
    await execFileAsync("git", ["init", "-b", "main"], { cwd: repo });
    await execFileAsync("git", ["config", "user.email", "fixture@example.com"], { cwd: repo });
    await execFileAsync("git", ["config", "user.name", "Fixture"], { cwd: repo });
    await execFileAsync("git", ["add", "."], { cwd: repo });
    await execFileAsync("git", ["commit", "-m", "trusted base"], { cwd: repo });
    const mergeBaseSha = (await execFileAsync("git", ["rev-parse", "HEAD"], { cwd: repo })).stdout.trim();

    const tamperedBundle = Buffer.from("const input = process.argv[2];\nrequire('child_process').exec(input);\n");
    const maliciousManifest = JSON.parse(trustedManifest) as {
      files: Array<{ path: string; bytes: number; sha256: string }>;
    };
    const maliciousEntry = maliciousManifest.files.find((entry) => entry.path === "runtime/engine/index.cjs");
    assert.ok(maliciousEntry);
    maliciousEntry.bytes = tamperedBundle.byteLength;
    const { createHash } = await import("node:crypto");
    maliciousEntry.sha256 = createHash("sha256").update(tamperedBundle).digest("hex");
    await writeFile(absoluteFile, tamperedBundle);
    await writeFile(manifestPath, `${JSON.stringify(maliciousManifest, null, 2)}\n`);
    await mkdir(runDirectory, { recursive: true });

    const records = await collectTools({
      repo,
      runDirectory,
      changedFiles: [file, `${assetsRelative}/engines/semgrep-wasm/runtime-manifest.json`],
      mergeBaseSha,
      options: { timeoutMs: 10_000 },
      assetsRoot,
    });
    assert.ok(!records.some((record) => record.name === "generated-bundle-omissions"));
    assert.ok(records.some((record) => record.name === "semgrep"));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("TypeScript checks fail required when the repository compiler is missing", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-typescript-offline-"));
  const repo = path.join(root, "repo");
  const runDirectory = path.join(repo, ".friendly-adversary", "runs", "fixture");
  const previousPath = process.env.PATH;
  try {
    await mkdir(runDirectory, { recursive: true });
    await writeFile(path.join(repo, "app.ts"), "export const value = 1;\n");
    await writeFile(path.join(repo, "tsconfig.json"), "{\"compilerOptions\":{\"noEmit\":true}}\n");
    process.env.PATH = "";
    const records = await collectTools({
      repo,
      runDirectory,
      changedFiles: ["app.ts"],
      mergeBaseSha: "0000000000000000000000000000000000000000",
      options: { timeoutMs: 10_000 },
      assetsRoot: path.resolve("."),
    });
    const record = records.find((candidate) => candidate.name === "typescript");
    assert.equal(record?.status, "skipped");
    assert.equal(record?.required, true);
    assert.match(record?.reason ?? "", /repository-installed TypeScript compiler is unavailable/);
  } finally {
    process.env.PATH = previousPath;
    await rm(root, { recursive: true, force: true });
  }
});

test("configured Python project checks are required from the repository virtual environment", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-python-project-tools-"));
  const repo = path.join(root, "repo");
  const runDirectory = path.join(repo, ".friendly-adversary", "runs", "fixture");
  try {
    await mkdir(runDirectory, { recursive: true });
    await writeFile(path.join(repo, "app.py"), "value = 1\n");
    await writeFile(path.join(repo, "pyproject.toml"), "[tool.pytest]\nminversion = '9.0'\n\n[tool.mypy]\nstrict = true\n");
    const records = await collectTools({
      repo,
      runDirectory,
      changedFiles: ["app.py"],
      mergeBaseSha: "0000000000000000000000000000000000000000",
      options: { timeoutMs: 10_000 },
      assetsRoot: path.resolve("."),
    });
    const pytest = records.find((record) => record.name === "repository-pytest");
    const mypy = records.find((record) => record.name === "repository-mypy");
    assert.equal(pytest?.status, "skipped");
    assert.equal(pytest?.required, true);
    assert.match(pytest?.reason ?? "", /configured but unavailable/u);
    assert.equal(mypy?.status, "skipped");
    assert.equal(mypy?.required, true);
    assert.match(mypy?.reason ?? "", /configured but unavailable/u);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("setup.cfg and tox.ini Python configurations require repository checks", async () => {
  for (const fixture of [
    { file: "setup.cfg", content: "[tool:pytest]\naddopts = -q\n\n[mypy]\nstrict = true\n" },
    { file: "tox.ini", content: "[pytest]\naddopts = -q\n\n[mypy]\nstrict = true\n" },
  ]) {
    const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-python-ini-tools-"));
    const repo = path.join(root, "repo");
    const runDirectory = path.join(repo, ".friendly-adversary", "runs", "fixture");
    try {
      await mkdir(runDirectory, { recursive: true });
      await writeFile(path.join(repo, "app.py"), "value = 1\n");
      await writeFile(path.join(repo, fixture.file), fixture.content);
      const records = await collectTools({
        repo,
        runDirectory,
        changedFiles: ["app.py", fixture.file],
        mergeBaseSha: "0000000000000000000000000000000000000000",
        options: { timeoutMs: 10_000 },
        assetsRoot: path.resolve("."),
      });
      for (const name of ["repository-pytest", "repository-mypy"]) {
        const record = records.find((candidate) => candidate.name === name);
        assert.equal(record?.status, "skipped", `${fixture.file}: ${name}`);
        assert.equal(record?.required, true, `${fixture.file}: ${name}`);
        assert.match(record?.reason ?? "", /configured but unavailable/u, `${fixture.file}: ${name}`);
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
});

test("TypeScript checks resolve changed files to project configs instead of a no-op root config", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-typescript-projects-"));
  const repo = path.join(root, "repo");
  const runDirectory = path.join(repo, ".friendly-adversary", "runs", "fixture");
  const scratchDirectory = path.join(root, "scratch");
  try {
    await mkdir(path.join(repo, "apps", "web", "src"), { recursive: true });
    await mkdir(path.join(repo, "libs", "ui", "src"), { recursive: true });
    await mkdir(runDirectory, { recursive: true });
    await writeFile(path.join(repo, "tsconfig.json"), "{\"files\":[],\"references\":[]}\n");
    await writeFile(path.join(repo, "apps", "web", "tsconfig.json"), "{\"include\":[\"src/**/*.ts\"]}\n");
    await writeFile(path.join(repo, "apps", "web", "tsconfig.spec.json"), "{\"include\":[\"src/**/*.test.ts\"]}\n");
    await writeFile(path.join(repo, "libs", "ui", "tsconfig.lib.json"), "{\"include\":[\"src/**/*.ts\"]}\n");
    await writeFile(path.join(repo, "apps", "web", "src", "app.ts"), "export const app = 1;\n");
    await writeFile(path.join(repo, "apps", "web", "src", "app.test.ts"), "export const testValue = 1;\n");
    await writeFile(path.join(repo, "libs", "ui", "src", "button.ts"), "export const button = 1;\n");
    await installLocalNodeBin(
      repo,
      "tsc",
      "if (process.argv[2] === '--version') console.log('Version 5.9.3');",
    );
    const records = await collectTools({
      repo,
      runDirectory,
      scratchDirectory,
      changedFiles: ["apps/web/src/app.ts", "apps/web/src/app.test.ts", "libs/ui/src/button.ts"],
      mergeBaseSha: "0000000000000000000000000000000000000000",
      options: { timeoutMs: 10_000 },
      assetsRoot: path.resolve("."),
    });
    const projects = records.filter((record) => record.name.startsWith("typescript-project-"));
    assert.equal(projects.length, 3);
    const argv = await Promise.all(projects.map(async (record) => JSON.parse(
      await readFile(path.join(runDirectory, record.artifactDirectory ?? "", "argv.json"), "utf8"),
    ) as string[]));
    assert.deepEqual(argv.map((values) => values.at(-1)), [
      "apps/web/tsconfig.json",
      "apps/web/tsconfig.spec.json",
      "libs/ui/tsconfig.lib.json",
    ]);
    for (const values of argv) {
      const buildInfo = values[values.indexOf("--tsBuildInfoFile") + 1];
      if (typeof buildInfo !== "string") throw new Error("TypeScript plan omitted --tsBuildInfoFile");
      assert.ok(path.isAbsolute(buildInfo));
      assert.equal(buildInfo.startsWith(`${path.resolve(repo)}${path.sep}.friendly-adversary${path.sep}`), false, buildInfo);
      assert.equal(buildInfo.startsWith(`${scratchDirectory}${path.sep}`), true);
      assert.ok(!values.includes("tsconfig.json") || values.at(-1) !== "tsconfig.json");
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("TypeScript checks use the nearest package-local compiler", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-typescript-package-"));
  const repo = path.join(root, "repo");
  const app = path.join(repo, "packages", "app");
  const runDirectory = path.join(repo, ".friendly-adversary", "runs", "fixture");
  const scratchDirectory = path.join(root, "scratch");
  try {
    await mkdir(path.join(app, "src"), { recursive: true });
    await mkdir(runDirectory, { recursive: true });
    await writeFile(path.join(app, "tsconfig.json"), "{\"include\":[\"src/**/*.ts\"]}\n");
    await writeFile(path.join(app, "src", "app.ts"), "export const app = true;\n");
    const compilerCli = await installLocalNodeBin(
      app,
      "tsc",
      [
        "if (process.argv[2] === '--version') { console.log('Version 5.9.3'); process.exit(0); }",
        "const fs = await import('node:fs');",
        "const path = await import('node:path');",
        "const args = process.argv.slice(2);",
        "const index = args.indexOf('--tsBuildInfoFile');",
        "if (index < 0) process.exit(91);",
        "fs.mkdirSync(path.dirname(args[index + 1]), { recursive: true });",
        "fs.writeFileSync(args[index + 1], 'package-local compiler');",
      ].join("\n"),
    );
    const records = await collectTools({
      repo,
      runDirectory,
      scratchDirectory,
      changedFiles: ["packages/app/src/app.ts"],
      mergeBaseSha: "0000000000000000000000000000000000000000",
      options: { timeoutMs: 10_000 },
      assetsRoot: path.resolve("."),
    });
    const record = records.find((candidate) => candidate.name === "typescript");
    assert.equal(record?.status, "completed", record?.reason);
    const command = JSON.parse(record?.command ?? "[]") as string[];
    if (process.platform === "win32") {
      assert.equal(command[0], process.execPath);
      assert.equal(command[1], await realpath(compilerCli));
      assert.ok(!command.some((argument) => argument.toLowerCase().endsWith(".cmd")));
    } else {
      assert.equal(command[0], await realpath(path.join(app, "node_modules", ".bin", "tsc")));
    }
    assert.equal(
      await readFile(path.join(scratchDirectory, "typescript.tsbuildinfo"), "utf8"),
      "package-local compiler",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("ambient Python, secret, and dependency scanners are not planned", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-pyproject-tools-"));
  const repo = path.join(root, "repo");
  const runDirectory = path.join(repo, ".friendly-adversary", "runs", "fixture");
  const previousPath = process.env.PATH;
  try {
    await mkdir(runDirectory, { recursive: true });
    await writeFile(path.join(repo, "app.py"), "value: int = 1\n");
    await writeFile(path.join(repo, "pyproject.toml"), "[tool.mypy]\nstrict = true\n\n[tool.pyright]\ntypeCheckingMode = \"strict\"\n");
    await writeFile(path.join(repo, "package-lock.json"), "{}\n");
    process.env.PATH = "/usr/bin:/bin";
    const records = await collectTools({
      repo,
      runDirectory,
      changedFiles: ["app.py", "package-lock.json"],
      mergeBaseSha: "0000000000000000000000000000000000000000",
      options: { timeoutMs: 10_000 },
      assetsRoot: path.resolve("."),
    });
    for (const name of ["mypy", "pyright", "pytest", "gitleaks", "osv-scanner"]) {
      assert.ok(!records.some((record) => record.name === name), `${name} should not be planned`);
    }
    assert.equal(records.find((record) => record.name === "ruff-wasm")?.status, "completed");
  } finally {
    process.env.PATH = previousPath;
    await rm(root, { recursive: true, force: true });
  }
});

test("bundled Semgrep WebAssembly scans every supported syntax family deterministically", async () => {
  const root = path.resolve(".");
  const runner = path.join(root, "dist", "src", "semgrep-wasm-cli.js");
  const targets = [
    "tests/fixtures/semgrep-wasm/javascript-target.js",
    "tests/fixtures/semgrep-wasm/jsx-target.jsx",
    "tests/fixtures/semgrep-wasm/typescript-target.ts",
    "tests/fixtures/semgrep-wasm/tsx-target.tsx",
    "tests/fixtures/semgrep-wasm/python-target.py",
  ];
  const prefix = ["--max-old-space-size=512", runner, "scan", "--metrics=off", "--config", path.join(root, "rules", "semgrep"), "--json", "--"];
  const left = await execFileAsync(process.execPath, [...prefix, ...targets], { cwd: root, maxBuffer: 1024 * 1024 });
  const right = await execFileAsync(process.execPath, [...prefix, ...targets.reverse()], { cwd: root, maxBuffer: 1024 * 1024 });
  assert.equal(left.stdout, right.stdout);
  const output = JSON.parse(left.stdout) as {
    version: string;
    results: Array<{ check_id: string; path: string }>;
    errors: unknown[];
    time?: unknown;
    explanations?: unknown;
  };
  assert.equal(output.version, "1.172.0");
  assert.equal(output.results.length, 7);
  assert.deepEqual(output.errors, []);
  assert.equal(output.time, undefined);
  assert.equal(output.explanations, undefined);
  assert.deepEqual([...new Set(output.results.map((result) => path.extname(result.path)))].sort(), [".js", ".jsx", ".py", ".ts", ".tsx"]);
  assert.ok(output.results.some((result) => result.check_id === "friendly-adversary.javascript.shell-exec"));
  assert.ok(output.results.some((result) => result.check_id === "friendly-adversary.python.shell-exec"));
});

test("Semgrep coverage fails closed when bundled parsers report malformed TypeScript and Python", async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-malformed-coverage-"));
  const repo = path.join(root, "repo");
  const runDirectory = path.join(root, "run");
  try {
    await mkdir(repo, { recursive: true });
    await writeFile(path.join(repo, "broken.ts"), "export const value = (\n");
    await writeFile(path.join(repo, "broken.py"), "def broken(:\n");
    const records = await collectTools({
      repo,
      runDirectory,
      changedFiles: ["broken.py", "broken.ts"],
      mergeBaseSha: "0000000000000000000000000000000000000000",
      options: { timeoutMs: 20_000 },
      assetsRoot: path.resolve("."),
      includeRepositoryTools: false,
    });
    const semgrep = records.find((record) => record.name === "semgrep");
    assert.equal(semgrep?.status, "execution-error");
    assert.equal(semgrep?.reason, "Semgrep coverage is unreliable for 2 targets with syntax errors: broken.py, broken.ts");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("bundled Semgrep WebAssembly fully parses the production MCP bundle", async () => {
  const root = path.resolve(".");
  const runner = path.join(root, "dist", "src", "semgrep-wasm-cli.js");
  const bundle = "dist/mcp/friendly-adversary-mcp.cjs";
  const result = await execFileAsync(process.execPath, [
    "--max-old-space-size=8192",
    runner,
    "scan",
    "--metrics=off",
    "--config",
    path.join(root, "rules", "semgrep"),
    "--json",
    "--",
    bundle,
  ], { cwd: root, maxBuffer: 5 * 1024 * 1024 });
  const output = JSON.parse(result.stdout) as { errors: unknown[] };
  assert.deepEqual(output.errors, []);
});

test("bundled Semgrep WebAssembly rejects non-bundled rules before engine startup", async () => {
  const root = path.resolve(".");
  const runner = path.join(root, "dist", "src", "semgrep-wasm-cli.js");
  await assert.rejects(
    () => execFileAsync(process.execPath, [
      "--max-old-space-size=512",
      runner,
      "scan",
      "--metrics=off",
      "--config",
      path.join(root, "tests"),
      "--json",
      "--",
      "tests/fixtures/semgrep-wasm/javascript-target.js",
    ], { cwd: root }),
    (error: unknown) => error instanceof Error && /Only the bundled Friendly Adversary rules are supported/.test(String((error as Error & { stderr?: string }).stderr)),
  );
});
