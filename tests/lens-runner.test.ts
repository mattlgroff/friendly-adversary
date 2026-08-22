import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { hasLiveReviewAuthority, revokeReviewAuthorityById } from "../src/authority.js";
import { runReview, runReviewWithLenses } from "../src/review.js";
import { createLocalCodexRuntime, exitCodeForSignal, runCodexLenses, runLensProcess, type CodexLensRuntime, type LensInvocation } from "../src/lens-runner.js";

function git(repo: string, ...args: string[]): void {
  execFileSync("git", ["-C", repo, ...args], { stdio: "ignore" });
}

async function fixture(): Promise<string> {
  const repo = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-luna-"));
  git(repo, "init", "-b", "main");
  git(repo, "config", "user.email", "fixture@example.com");
  git(repo, "config", "user.name", "Fixture");
  await writeFile(path.join(repo, "app.py"), "value = 1\n");
  git(repo, "add", ".");
  git(repo, "commit", "-m", "base");
  git(repo, "switch", "-c", "feature");
  await writeFile(path.join(repo, "app.py"), "value = 2\n");
  return realpath(repo);
}

test("review dispatches every lens concurrently through exact Luna high fast invocations", async (t) => {
  const repo = await fixture();
  t.after(() => rm(repo, { recursive: true, force: true }));
  let versionCalls = 0;
  let active = 0;
  let maximumActive = 0;
  const invocations: LensInvocation[] = [];
  const runtime: CodexLensRuntime = {
    async version() {
      versionCalls += 1;
      return "codex-cli 0.test";
    },
    async execute(invocation) {
      invocations.push(invocation);
      active += 1;
      maximumActive = Math.max(maximumActive, active);
      await new Promise((resolve) => setTimeout(resolve, 25));
      active -= 1;
      return "# No supported findings\n\nInspected and disproved the candidate failures.";
    },
  };
  const run = await runReviewWithLenses({
    repo,
    base: "main",
    timeoutMs: 20_000,
    expectedLenses: ["correctness", "security", "verification"],
    host: "claude-code",
  }, runtime);
  t.after(async () => {
    await revokeReviewAuthorityById(run.authority.authority_id);
    await Promise.all([rm(run.runDirectory, { recursive: true, force: true }), rm(`${run.runDirectory}.scratch`, { recursive: true, force: true })]);
  });

  assert.equal(versionCalls, 1);
  assert.equal(maximumActive, 3);
  assert.equal(invocations.length, 3);
  for (const item of invocations) {
    assert.deepEqual(item.args.slice(0, 7), [
      "exec", "-m", "gpt-5.6-luna", "-c", 'model_reasoning_effort="high"', "-c", 'service_tier="fast"',
    ]);
    assert.ok(item.args.includes("read-only"));
    assert.ok(item.args.includes("--ephemeral"));
    assert.ok(item.args.includes("--ignore-user-config"));
    assert.ok(item.args.includes("--ignore-rules"));
    assert.ok(item.args.includes('shell_environment_policy.inherit="core"'));
    assert.ok(item.args.includes("shell_environment_policy.ignore_default_excludes=false"));
    assert.match(item.prompt, /Do not delegate to another agent/u);
    assert.ok(item.prompt.includes(`The target repository is ${repo}.`));
    assert.match(item.prompt, /includes uncommitted working-tree changes/u);
    assert.match(item.prompt, /Even if base and head SHA are identical/u);
  }
  const evidence = JSON.parse(await readFile(path.join(run.runDirectory, "lens-runtime.json"), "utf8")) as Record<string, unknown>;
  assert.equal(evidence.model, "gpt-5.6-luna");
  assert.equal(evidence.reasoningEffort, "high");
  assert.equal(evidence.serviceTier, "fast");
  assert.equal(evidence.dispatch, "concurrent");
  for (const lens of run.receipt.expectedLenses) {
    const report = await readFile(path.join(run.runDirectory, "lenses", `${lens}.md`), "utf8");
    assert.match(report, /^- Model: gpt-5\.6-luna\n- Effort: high\n- Host: codex-cli/mu);
  }
});

test("a failed lens persists an incomplete receipt without diagnostic text", async (t) => {
  const repo = await fixture();
  t.after(() => rm(repo, { recursive: true, force: true }));
  const run = await runReview({ repo, base: "main", timeoutMs: 20_000, expectedLenses: ["correctness", "security"], host: "codex" });
  t.after(async () => {
    await revokeReviewAuthorityById(run.authority.authority_id);
    await Promise.all([rm(run.runDirectory, { recursive: true, force: true }), rm(`${run.runDirectory}.scratch`, { recursive: true, force: true })]);
  });
  const runtime: CodexLensRuntime = {
    async version() { return "codex-cli 0.test"; },
    async execute(invocation) {
      if (invocation.lensId === "security") throw new Error("SECRET_DIAGNOSTIC_MUST_NOT_PERSIST");
      return "# No supported findings\n\nInspected the pinned evidence.";
    },
  };
  await assert.rejects(() => runCodexLenses(run.receipt, run.authority, runtime), /FA_CODEX_LENSES_INCOMPLETE/u);
  const receipt = JSON.parse(await readFile(path.join(run.runDirectory, "receipt.json"), "utf8")) as { status: string; incompleteReasons: string[] };
  assert.equal(receipt.status, "incomplete");
  assert.deepEqual(receipt.incompleteReasons, ["Codex lens execution failed: security (lens_execution_failed)"]);
  assert.match(await readFile(path.join(run.runDirectory, "receipt.md"), "utf8"), /Status: incomplete/u);
  const evidence = await readFile(path.join(run.runDirectory, "lens-runtime.json"), "utf8");
  assert.doesNotMatch(evidence, /SECRET_DIAGNOSTIC_MUST_NOT_PERSIST/u);
  assert.match(evidence, /lens_execution_failed/u);
});

test("review fails closed before collection when the Codex CLI is unavailable", async (t) => {
  const repo = await fixture();
  t.after(() => rm(repo, { recursive: true, force: true }));
  const runtime: CodexLensRuntime = {
    async version() { throw new Error("missing codex"); },
    async execute() { throw new Error("must not execute"); },
  };
  await assert.rejects(() => runReviewWithLenses({
    repo,
    base: "main",
    timeoutMs: 20_000,
    expectedLenses: ["correctness"],
    host: "codex",
  }, runtime), /missing codex/u);
});

test("review rejects an empty lens set", async (t) => {
  const repo = await fixture();
  t.after(() => rm(repo, { recursive: true, force: true }));
  await assert.rejects(() => runReview({ repo, base: "main", timeoutMs: 20_000, expectedLenses: [], host: "codex" }), /At least one lens is required/u);
});

test("top-level lens failure revokes the run authority", async (t) => {
  const repo = await fixture();
  t.after(() => rm(repo, { recursive: true, force: true }));
  let runDirectory = "";
  const runtime: CodexLensRuntime = {
    async version() { return "codex-cli 0.test"; },
    async execute(invocation) {
      runDirectory = invocation.runDirectory;
      throw new Error("injected lens failure");
    },
  };
  await assert.rejects(() => runReviewWithLenses({ repo, base: "main", timeoutMs: 20_000, expectedLenses: ["correctness"], host: "codex" }, runtime), /FA_CODEX_LENSES_INCOMPLETE/u);
  assert.ok(runDirectory);
  assert.equal(await hasLiveReviewAuthority(runDirectory), false);
  await Promise.all([rm(runDirectory, { recursive: true, force: true }), rm(`${runDirectory}.scratch`, { recursive: true, force: true })]);
});

test("lens timeout force-kills a child that ignores graceful termination", async () => {
  const startedAt = Date.now();
  await assert.rejects(
    () => runLensProcess(process.execPath, ["-e", "process.on('SIGTERM',()=>{}); setInterval(()=>{},1000)"], process.cwd(), undefined, 50),
    /FA_CODEX_LENS_TIMEOUT/u,
  );
  assert.ok(Date.now() - startedAt < 5_000);
});

test("lens timeout force-kills descendants after the direct child exits", async (t) => {
  if (process.platform === "win32") return t.skip("Windows taskkill tree behavior is covered by native acceptance");
  const temporary = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-descendant-"));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const pidFile = path.join(temporary, "pid");
  const script = [
    "const {spawn}=require('node:child_process');",
    "const {writeFileSync}=require('node:fs');",
    "const child=spawn(process.execPath,['-e',\"process.on('SIGTERM',()=>{});setInterval(()=>{},1000)\"],{stdio:'ignore'});",
    "writeFileSync(process.argv[1],String(child.pid));",
    "process.on('SIGTERM',()=>process.exit(0));",
    "setInterval(()=>{},1000);",
  ].join("");
  await assert.rejects(() => runLensProcess(process.execPath, ["-e", script, pidFile], process.cwd(), undefined, 100), /FA_CODEX_LENS_TIMEOUT/u);
  const descendantPid = Number(await readFile(pidFile, "utf8"));
  await new Promise((resolve) => setTimeout(resolve, 100));
  assert.throws(() => process.kill(descendantPid, 0));
});

test("lens process receives only the bounded Codex environment", async () => {
  const secretName = "FRIENDLY_ADVERSARY_TEST_SECRET";
  const previous = process.env[secretName];
  process.env[secretName] = "must-not-cross";
  try {
    const result = await runLensProcess(process.execPath, ["-e", `process.stdout.write(process.env.${secretName} ?? "absent")`], process.cwd(), undefined, 5_000);
    assert.equal(result.stdout, "absent");
  } finally {
    if (previous === undefined) delete process.env[secretName];
    else process.env[secretName] = previous;
  }
});

test("local Codex runtime exercises stdin and output-last-message through a real subprocess", async (t) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-codex-shim-"));
  t.after(() => rm(temporary, { recursive: true, force: true }));
  const shim = path.join(temporary, "codex-shim.cjs");
  await writeFile(shim, [
    "const fs=require('node:fs');",
    "const args=process.argv.slice(2);",
    "if(args[0]==='--version'){process.stdout.write('codex-cli shim');process.exit(0);}",
    "let input='';process.stdin.setEncoding('utf8');process.stdin.on('data',c=>input+=c);",
    "process.stdin.on('end',()=>{if(!input.includes('independent, evidence-first review'))process.exit(4);const i=args.indexOf('--output-last-message');fs.writeFileSync(args[i+1],'# No supported findings\\n\\nShim inspected the pinned evidence.');});",
  ].join(""));
  const runtime = createLocalCodexRuntime(process.execPath, [shim]);
  assert.equal(await runtime.version(), "codex-cli shim");
  const outputFile = path.join(temporary, "result.md");
  const result = await runtime.execute({
    lensId: "correctness",
    repositoryRoot: temporary,
    runDirectory: temporary,
    outputFile,
    args: ["exec", "--output-last-message", outputFile, "-"],
    prompt: "Perform one independent, evidence-first review.",
    timeoutMs: 5_000,
  });
  assert.match(result, /No supported findings/u);
});

test("signal cancellations retain conventional exit codes", () => {
  assert.equal(exitCodeForSignal("SIGINT"), 130);
  assert.equal(exitCodeForSignal("SIGTERM"), 143);
  assert.equal(exitCodeForSignal("SIGHUP"), 129);
  assert.equal(exitCodeForSignal(undefined), undefined);
});
