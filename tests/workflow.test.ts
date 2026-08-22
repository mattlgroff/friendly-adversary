import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { access, link, mkdir, mkdtemp, readFile, readdir, rename, rm, symlink, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { authorityRoot, cleanupExpiredAuthorities } from "../src/authority.js";
import {
  abortWorkflow,
  completeWorkflow,
  establishWorkflowPlan,
  MAX_WORKFLOW_SNAPSHOT_FILE_BYTES,
  MAX_WORKFLOW_SNAPSHOT_TOTAL_BYTES,
  recordWorkflowArtifact,
  reserveWorkflowSnapshotBytes,
  resumeWorkflow,
  sealWorkflow,
  startAudit,
  startDesign,
  verifyWorkflow,
  workflowStatus,
} from "../src/workflow.js";

const authorityState = path.join(os.tmpdir(), `friendly-adversary-workflow-tests-${process.pid}`);
process.env.FRIENDLY_ADVERSARY_STATE_DIR = authorityState;
test.after(async () => rm(authorityState, { recursive: true, force: true }));

function git(repo: string, ...args: string[]): void {
  execFileSync("git", ["-C", repo, ...args], { stdio: "ignore" });
}

function workflowArtifactEnvelope(markdown: string): string {
  const body = `${markdown.trimEnd()}\n`;
  const digest = createHash("sha256").update(body).digest("hex");
  return `${body}<!-- friendly-adversary:artifact-complete sha256=${digest} -->\n`;
}

function canonical(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
}

function auditAdjudicationEnvelope(adjudication: string, report: string): string {
  const reportDigest = createHash("sha256").update(report).digest("hex");
  return workflowArtifactEnvelope(`${adjudication.trimEnd()}\n\n<!-- friendly-adversary:outcome-report-sha256:${reportDigest} -->`);
}

async function auditFixture(): Promise<string> {
  const repo = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-audit-"));
  git(repo, "init", "-b", "main");
  git(repo, "config", "user.email", "fixture@example.com");
  git(repo, "config", "user.name", "Fixture");
  await writeFile(path.join(repo, ".gitignore"), ".friendly-adversary/\nnode_modules/\n");
  await writeFile(path.join(repo, "app.py"), "value = 1\n");
  await writeFile(path.join(repo, "app.ts"), "export const value = 1;\n");
  git(repo, "add", ".");
  git(repo, "commit", "-m", "base");
  await writeFile(path.join(repo, "app.py"), "value = 2\n");
  await writeFile(path.join(repo, "untracked.py"), "other = 3\n");
  return repo;
}

function designLanes() {
  return [
    { id: "architecture", kind: "decision" as const, title: "Architecture", scope: "Runtime and boundaries", dimensions: [] },
    { id: "feasibility", kind: "challenge" as const, title: "Feasibility", scope: "Challenge feasibility", dimensions: [] },
    { id: "simplicity", kind: "challenge" as const, title: "Simplicity", scope: "Challenge unnecessary complexity", dimensions: [] },
    { id: "security", kind: "challenge" as const, title: "Security", scope: "Challenge trust boundaries", dimensions: [] },
    { id: "operability", kind: "challenge" as const, title: "Operability", scope: "Challenge operational gaps", dimensions: [] },
    { id: "verification", kind: "challenge" as const, title: "Verification", scope: "Challenge testability", dimensions: [] },
  ];
}

async function designReadyForOutcome(root: string) {
  const started = await startDesign({ root, host: "codex" });
  const planned = await establishWorkflowPlan({
    authorityId: started.authority.authority_id,
    capability: started.authority.capabilities.plan!,
    overviewMarkdown: "# Brief\n\nA concurrency-safe design workflow.",
    manifest: { lanes: designLanes() },
  });
  await recordWorkflowArtifact({
    authorityId: planned.authority_id,
    capability: planned.capabilities["lane:architecture"]!,
    relativePath: "decision-architecture-0001.md",
    markdown: "# Architecture\n\nUse one modular service.",
  });
  const challenges = await resumeWorkflow(started.receipt.outputDirectory);
  await Promise.all(["feasibility", "simplicity", "security", "operability", "verification"].map(async (id) => recordWorkflowArtifact({
    authorityId: challenges.authority_id,
    capability: challenges.capabilities[`lane:${id}`]!,
    relativePath: `challenge-${id}.md`,
    markdown: `# ${id}\n\nNo blocking contradiction.`,
  })));
  const outcome = await resumeWorkflow(started.receipt.outputDirectory);
  return { started, outcome };
}

test("codebase audit pins dirty state, publishes every planned lane, and seals offline reports", async (context) => {
  const repo = await auditFixture();
  context.after(() => rm(repo, { recursive: true, force: true }));
  const started = await startAudit({ repo, host: "codex", timeoutMs: 30_000 });
  assert.match(started.receipt.outputDirectory, /\.friendly-adversary[/\\]audits[/\\]/u);
  assert.ok(started.receipt.snapshot.files.some((file) => file.path === "untracked.py"));
  assert.ok(started.receipt.toolRuns.some((tool) => tool.name.startsWith("ruff-wasm")));
  assert.ok(started.receipt.toolRuns.some((tool) => tool.name.startsWith("oxlint-wasm")));
  assert.equal(started.receipt.toolRuns.some((tool) => tool.name.startsWith("repository-")), true);
  assert.equal(started.receipt.toolRuns.some((tool) => tool.name === "repository-build"), false);

  const planned = await establishWorkflowPlan({
    authorityId: started.authority.authority_id,
    capability: started.authority.capabilities.plan!,
    overviewMarkdown: "# Inventory\n\nThe complete repository is divided into one fixture subsystem.",
    manifest: { lanes: [
      { id: "core", kind: "subsystem", title: "Core", scope: "All application source", dimensions: ["correctness", "security"] },
    ] },
  });
  const publications = [["lane:core", "subsystem-core.md", "# No supported findings\n\nThe core subsystem was inspected."]] as const;
  await assert.rejects(recordWorkflowArtifact({
    authorityId: planned.authority_id,
    capability: planned.capabilities["lane:core"]!,
    relativePath: "subsystem-other.md",
    markdown: "# Unauthorized cross-lane write",
  }), /FA_CAPABILITY_DENIED/u);
  await assert.rejects(recordWorkflowArtifact({
    authorityId: planned.authority_id,
    capability: planned.capabilities["lane:core"]!,
    relativePath: "subsystem-core.md",
    markdown: "# Core\n\npostgres://user:secret@example.com/db",
  }), /FA_ARTIFACT_SECRET/u);
  await assert.rejects(recordWorkflowArtifact({
    authorityId: planned.authority_id,
    capability: planned.capabilities["lane:core"]!,
    relativePath: "subsystem-core.md",
    markdown: "# Narrative only\n\nNo structured outcome was declared.",
  }), /FA_REPORT_CONTRACT_INVALID/u);
  await Promise.all(publications.map(async ([scope, relativePath, markdown]) => recordWorkflowArtifact({
    authorityId: planned.authority_id,
    capability: planned.capabilities[scope]!,
    relativePath,
    markdown,
  })));
  const outcome = await resumeWorkflow(started.receipt.outputDirectory);
  const finalOutcome = {
    authorityId: outcome.authority_id,
    capability: outcome.capabilities.outcome!,
    artifacts: [
      { relativePath: "adjudication.md", markdown: "# Adjudication\n\nNo candidates survived validation." },
      { relativePath: "report.md", markdown: "# Codebase audit\n\nNo confirmed findings in the pinned snapshot." },
    ],
  };
  await assert.rejects(completeWorkflow({
    ...finalOutcome,
    artifacts: [
      finalOutcome.artifacts[0]!,
      { relativePath: "report.md", markdown: "# Codebase audit\n\npostgres://user:secret@example.com/db" },
    ],
  }), /FA_ARTIFACT_SECRET/u);
  const originalReportEnvelope = workflowArtifactEnvelope(finalOutcome.artifacts[1]!.markdown);
  await writeFile(
    path.join(started.receipt.outputDirectory, "adjudication.md"),
    auditAdjudicationEnvelope(finalOutcome.artifacts[0]!.markdown, originalReportEnvelope),
  );
  await assert.rejects(completeWorkflow({
    ...finalOutcome,
    artifacts: [
      { relativePath: "report.md", markdown: "# Conflicting report\n\nThis report was not covered by the committed adjudication." },
      finalOutcome.artifacts[0]!,
    ],
  }), /FA_ARTIFACT_CONFLICT/u);
  assert.equal(await readFile(path.join(started.receipt.outputDirectory, "report.md"), "utf8"), "");
  const firstCompletion = await completeWorkflow(finalOutcome);
  const retryCompletion = await completeWorkflow(finalOutcome);
  assert.deepEqual(retryCompletion, firstCompletion);
  const adjudicationPath = path.join(started.receipt.outputDirectory, "adjudication.md");
  const reportPath = path.join(started.receipt.outputDirectory, "report.md");
  const originalReport = await readFile(reportPath, "utf8");
  const reportDigest = createHash("sha256").update(originalReport).digest("hex");
  assert.match(await readFile(adjudicationPath, "utf8"), new RegExp(`friendly-adversary:outcome-report-sha256:${reportDigest}`, "u"));
  await writeFile(reportPath, "# Replaced report\n\nThis report was not adjudicated.\n");
  await assert.rejects(sealWorkflow(started.receipt.outputDirectory), /FA_OUTCOME_PAIR_MISMATCH/u);
  await writeFile(reportPath, originalReport);
  await writeFile(path.join(started.receipt.outputDirectory, "snapshot-files", "app.py"), "tampered = True\n");
  await assert.rejects(sealWorkflow(started.receipt.outputDirectory), /FA_SNAPSHOT_MATERIALIZATION_STALE/u);
  await writeFile(path.join(started.receipt.outputDirectory, "snapshot-files", "app.py"), "value = 2\n");
  const sealed = await sealWorkflow(started.receipt.outputDirectory);
  assert.equal(sealed.status, "sealed");
  assert.equal((await verifyWorkflow(started.receipt.outputDirectory)).valid, true);
  const html = await readFile(path.join(started.receipt.outputDirectory, "report.html"), "utf8");
  assert.match(html, /Content-Security-Policy/u);
  assert.doesNotMatch(html, /artifact-complete/u);
});

test("audit snapshot byte accounting enforces fixed production boundaries without large allocations", () => {
  assert.equal(
    reserveWorkflowSnapshotBytes(0, MAX_WORKFLOW_SNAPSHOT_FILE_BYTES, "largest-supported.bin"),
    MAX_WORKFLOW_SNAPSHOT_FILE_BYTES,
  );
  assert.throws(
    () => reserveWorkflowSnapshotBytes(0, MAX_WORKFLOW_SNAPSHOT_FILE_BYTES + 1, "too-large.bin"),
    /per-file snapshot byte limit/u,
  );
  assert.equal(
    reserveWorkflowSnapshotBytes(
      MAX_WORKFLOW_SNAPSHOT_TOTAL_BYTES - MAX_WORKFLOW_SNAPSHOT_FILE_BYTES,
      MAX_WORKFLOW_SNAPSHOT_FILE_BYTES,
      "last-supported.bin",
    ),
    MAX_WORKFLOW_SNAPSHOT_TOTAL_BYTES,
  );
  assert.throws(
    () => reserveWorkflowSnapshotBytes(MAX_WORKFLOW_SNAPSHOT_TOTAL_BYTES - 1, 2, "aggregate-overflow.bin"),
    /aggregate snapshot byte limit/u,
  );
});

test("codebase audit captures Git indexes larger than Node's default child-process buffer", async (context) => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-large-index-"));
  context.after(() => rm(repo, { recursive: true, force: true }));
  git(repo, "init", "-b", "main");
  git(repo, "config", "user.email", "fixture@example.com");
  git(repo, "config", "user.name", "Fixture");
  await writeFile(path.join(repo, ".gitignore"), ".friendly-adversary/\n");
  const tracked = path.join(repo, "tracked");
  await mkdir(tracked);
  const suffix = "x".repeat(170);
  for (let offset = 0; offset < 5_500; offset += 250) {
    await Promise.all(Array.from({ length: 250 }, (_, index) => {
      const sequence = String(offset + index).padStart(5, "0");
      return writeFile(path.join(tracked, `file-${sequence}-${suffix}.txt`), "x\n");
    }));
  }
  git(repo, "add", ".");
  git(repo, "commit", "-m", "large index");
  const rawIndex = execFileSync("git", ["-C", repo, "ls-files", "--stage", "-z"], { maxBuffer: 4 * 1024 * 1024 });
  assert.ok(rawIndex.byteLength > 1024 * 1024);

  const started = await startAudit({ repo, host: "codex", timeoutMs: 30_000 });
  assert.equal(started.receipt.snapshot.index.length, 5_501);
  assert.equal(started.receipt.snapshot.fileCount, 5_501);
  await abortWorkflow(started.receipt.outputDirectory);
});

test("audit resume refuses a changed pinned snapshot", async (context) => {
  const repo = await auditFixture();
  context.after(() => rm(repo, { recursive: true, force: true }));
  const started = await startAudit({ repo, host: "codex", timeoutMs: 30_000 });
  await establishWorkflowPlan({
    authorityId: started.authority.authority_id,
    capability: started.authority.capabilities.plan!,
    overviewMarkdown: "# Inventory\n\nPinned fixture inventory.",
    manifest: { lanes: [
      { id: "core", kind: "subsystem", title: "Core", scope: "All source", dimensions: ["correctness"] },
    ] },
  });
  await writeFile(path.join(repo, "app.py"), "value = 99\n");
  await assert.rejects(resumeWorkflow(started.receipt.outputDirectory), /FA_SNAPSHOT_STALE/u);
});

test("codebase audit pins Git submodule object and dirty status", async (context) => {
  const child = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-submodule-child-"));
  const repo = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-submodule-parent-"));
  context.after(() => Promise.all([rm(repo, { recursive: true, force: true }), rm(child, { recursive: true, force: true })]));
  for (const target of [child, repo]) {
    git(target, "init", "-b", "main");
    git(target, "config", "user.email", "fixture@example.com");
    git(target, "config", "user.name", "Fixture");
  }
  await writeFile(path.join(child, "library.py"), "value = 1\n");
  git(child, "add", ".");
  git(child, "commit", "-m", "child");
  await writeFile(path.join(repo, ".gitignore"), ".friendly-adversary/\n");
  await writeFile(path.join(repo, "app.py"), "value = 1\n");
  git(repo, "add", ".");
  git(repo, "commit", "-m", "parent");
  git(repo, "-c", "protocol.file.allow=always", "submodule", "add", child, "vendor/demo");
  git(repo, "commit", "-am", "add submodule");

  const started = await startAudit({ repo, host: "codex", timeoutMs: 30_000 });
  const gitlink = started.receipt.snapshot.files.find((file) => file.path === "vendor/demo");
  assert.equal(gitlink?.kind, "gitlink");
  assert.match(gitlink?.gitObject ?? "", /^[a-f0-9]{40,64}$/u);
  assert.equal(gitlink?.gitStatus, "");
  const planned = await establishWorkflowPlan({
    authorityId: started.authority.authority_id,
    capability: started.authority.capabilities.plan!,
    overviewMarkdown: "# Inventory\n\nParent application plus one external gitlink boundary.",
    manifest: { lanes: [
      { id: "core", kind: "subsystem", title: "Core", scope: "Parent source and gitlink boundary", dimensions: ["correctness"] },
    ] },
  });
  assert.ok(planned.capabilities["lane:core"]);
  await writeFile(path.join(repo, "vendor", "demo", "library.py"), "value = 2\n");
  await assert.rejects(resumeWorkflow(started.receipt.outputDirectory), /FA_SNAPSHOT_STALE/u);
});

test("audit pins index objects, modes, deletions, and immutable materialized bytes", async (context) => {
  const repo = await auditFixture();
  context.after(() => rm(repo, { recursive: true, force: true }));
  await writeFile(path.join(repo, "app.py"), "value = 10\n");
  git(repo, "add", "app.py");
  await writeFile(path.join(repo, "app.py"), "value = 2\n");
  await rm(path.join(repo, "app.ts"));
  const first = await startAudit({ repo, host: "codex", timeoutMs: 30_000 });
  assert.equal(first.receipt.snapshot.files.find((file) => file.path === "app.ts")?.kind, "deleted");
  assert.equal(await readFile(path.join(first.receipt.outputDirectory, "snapshot-files", "app.py"), "utf8"), "value = 2\n");

  await writeFile(path.join(repo, "app.py"), "value = 11\n");
  git(repo, "add", "app.py");
  await writeFile(path.join(repo, "app.py"), "value = 2\n");
  const second = await startAudit({ repo, host: "codex", timeoutMs: 30_000 });
  assert.notEqual(first.receipt.snapshot.digest, second.receipt.snapshot.digest);
  assert.notDeepEqual(first.receipt.snapshot.index, second.receipt.snapshot.index);
});

test("workflow roots and flat artifacts reject symlink escapes", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-design-symlink-"));
  const outside = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-outside-"));
  context.after(() => Promise.all([rm(root, { recursive: true, force: true }), rm(outside, { recursive: true, force: true })]));
  await mkdir(path.join(root, ".friendly-adversary"));
  await symlink(outside, path.join(root, ".friendly-adversary", "designs"));
  await assert.rejects(startDesign({ root, host: "codex" }), /symbolic-link|unsafe output/u);

  await rm(path.join(root, ".friendly-adversary", "designs"));
  const started = await startDesign({ root, host: "codex" });
  const planned = await establishWorkflowPlan({
    authorityId: started.authority.authority_id,
    capability: started.authority.capabilities.plan!,
    overviewMarkdown: "# Brief\n\nA confined design.",
    manifest: { lanes: [
      { id: "architecture", kind: "decision", title: "Architecture", scope: "Architecture", dimensions: [] },
      { id: "feasibility", kind: "challenge", title: "Feasibility", scope: "Feasibility", dimensions: [] },
      { id: "simplicity", kind: "challenge", title: "Simplicity", scope: "Simplicity", dimensions: [] },
      { id: "security", kind: "challenge", title: "Security", scope: "Security", dimensions: [] },
      { id: "operability", kind: "challenge", title: "Operability", scope: "Operability", dimensions: [] },
      { id: "verification", kind: "challenge", title: "Verification", scope: "Verification", dimensions: [] },
    ] },
  });
  await assert.rejects(recordWorkflowArtifact({
    authorityId: planned.authority_id,
    capability: planned.capabilities["lane:architecture"]!,
    relativePath: "decisions/architecture/0001.md",
    markdown: "# Escape",
  }), /FA_ARTIFACT_PATH_INVALID/u);
  const moved = `${started.receipt.outputDirectory}-moved`;
  await rename(started.receipt.outputDirectory, moved);
  await symlink(outside, started.receipt.outputDirectory, process.platform === "win32" ? "junction" : "dir");
  await assert.rejects(recordWorkflowArtifact({
    authorityId: planned.authority_id,
    capability: planned.capabilities["lane:architecture"]!,
    relativePath: "decision-architecture-0001.md",
    markdown: "# Redirected",
  }), /FA_PUBLICATION_SLOT_MISSING|FA_RUN_INCOMPATIBLE|FA_RUN_NOT_FOUND/u);
  assert.equal((await readdir(outside)).length, 0);
});

test("audit refuses a tracked file whose parent redirects outside the repository", async (context) => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-source-symlink-"));
  const outside = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-source-outside-"));
  context.after(() => Promise.all([rm(repo, { recursive: true, force: true }), rm(outside, { recursive: true, force: true })]));
  git(repo, "init", "-b", "main");
  git(repo, "config", "user.email", "fixture@example.com");
  git(repo, "config", "user.name", "Fixture");
  await writeFile(path.join(repo, ".gitignore"), ".friendly-adversary/\n");
  await mkdir(path.join(repo, "nested"));
  await writeFile(path.join(repo, "nested", "app.py"), "safe = True\n");
  git(repo, "add", ".");
  git(repo, "commit", "-m", "base");
  await rm(path.join(repo, "nested"), { recursive: true });
  await writeFile(path.join(outside, "app.py"), "outside_secret = True\n");
  await symlink(outside, path.join(repo, "nested"), process.platform === "win32" ? "junction" : "dir");
  await assert.rejects(startAudit({ repo, host: "codex", timeoutMs: 30_000 }), /FA_SNAPSHOT_UNSAFE/u);
  assert.deepEqual(await readdir(path.join(repo, ".friendly-adversary", "audits")), []);
});

test("audit records tracked symlinks as an explicit coverage limitation", async (context) => {
  if (process.platform === "win32") return context.skip("native Windows checkouts commonly materialize Git symlinks as regular files");
  const repo = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-tracked-symlink-"));
  context.after(() => rm(repo, { recursive: true, force: true }));
  git(repo, "init", "-b", "main");
  git(repo, "config", "user.email", "fixture@example.com");
  git(repo, "config", "user.name", "Fixture");
  await writeFile(path.join(repo, ".gitignore"), ".friendly-adversary/\n");
  await writeFile(path.join(repo, "target.ts"), "export const value = 1;\n");
  await symlink("target.ts", path.join(repo, "linked.ts"));
  git(repo, "add", ".");
  git(repo, "commit", "-m", "base");
  const started = await startAudit({ repo, host: "codex", timeoutMs: 30_000 });
  assert.ok(started.receipt.snapshot.files.some((file) => file.path === "linked.ts" && file.kind === "symlink"));
  assert.deepEqual(
    started.receipt.incompleteReasons.filter((reason) => reason.includes("tracked symlink")),
    ["1 tracked symlink was recorded in snapshot.json but not dereferenced or analyzed"],
  );
});

test("workflow phases require tool-owned publication provenance", async (context) => {
  const repo = await auditFixture();
  context.after(() => rm(repo, { recursive: true, force: true }));
  const started = await startAudit({ repo, host: "codex", timeoutMs: 30_000 });
  const planned = await establishWorkflowPlan({
    authorityId: started.authority.authority_id,
    capability: started.authority.capabilities.plan!,
    overviewMarkdown: "# Inventory\n\nOne subsystem.",
    manifest: { lanes: [
      { id: "core", kind: "subsystem", title: "Core", scope: "Core", dimensions: [] },
    ] },
  });
  assert.ok(planned.capabilities["lane:core"]);
  assert.equal(planned.capabilities.outcome, undefined);
  await assert.rejects(recordWorkflowArtifact({
    workflow: "design-new-codebase",
    authorityId: planned.authority_id,
    capability: planned.capabilities["lane:core"]!,
    relativePath: "subsystem-core.md",
    markdown: "# Wrong workflow",
  }), /FA_WORKFLOW_MISMATCH/u);
  await writeFile(path.join(started.receipt.outputDirectory, "subsystem-core.md"), "# Unproven\n");
  const resumed = await resumeWorkflow(started.receipt.outputDirectory);
  assert.ok(resumed.capabilities["lane:core"]);
});

test("cancelled workflow publication commits no immutable artifact", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-workflow-cancel-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const started = await startDesign({ root, host: "codex" });
  const planned = await establishWorkflowPlan({
    authorityId: started.authority.authority_id,
    capability: started.authority.capabilities.plan!,
    overviewMarkdown: "# Brief\n\nCancellation fixture.",
    manifest: { lanes: designLanes() },
  });
  const cancelled = new AbortController();
  cancelled.abort();
  await assert.rejects(recordWorkflowArtifact({
    authorityId: planned.authority_id,
    capability: planned.capabilities["lane:architecture"]!,
    relativePath: "decision-architecture-0001.md",
    markdown: "# Architecture\n\nMust not commit.",
    signal: cancelled.signal,
  }), /FA_CANCELLED/u);
  assert.equal(await readFile(path.join(started.receipt.outputDirectory, "decision-architecture-0001.md"), "utf8"), "");
});

test("cancelled workflow completion commits no outcome artifact", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-completion-cancel-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const { started, outcome } = await designReadyForOutcome(root);
  const cancelled = new AbortController();
  cancelled.abort();
  await assert.rejects(completeWorkflow({
    workflow: "design-new-codebase",
    authorityId: outcome.authority_id,
    capability: outcome.capabilities.outcome!,
    userSignoff: true,
    signal: cancelled.signal,
    artifacts: [
      { relativePath: "architecture.md", markdown: "# Architecture" },
      { relativePath: "diagrams.md", markdown: "# Diagrams" },
      { relativePath: "test-strategy.md", markdown: "# Tests" },
      { relativePath: "implementation-plan.md", markdown: "# Plan" },
      { relativePath: "open-questions.md", markdown: "# Questions" },
    ],
  }), /FA_CANCELLED/u);
  assert.equal(await readFile(path.join(started.receipt.outputDirectory, "architecture.md"), "utf8"), "");
  assert.equal(await readFile(path.join(started.receipt.outputDirectory, "open-questions.md"), "utf8"), "");
});

test("workflow receipt updates recover the previous authenticated generation after interruption", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-receipt-recovery-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const started = await startDesign({ root, host: "codex" });
  await abortWorkflow(started.receipt.outputDirectory);
  await writeFile(path.join(started.receipt.outputDirectory, ".receipt-alternate.json"), "{\"schemaVersion\":");
  const recovered = await workflowStatus(started.receipt.outputDirectory);
  assert.equal(recovered.status, "prepared");
  assert.equal(recovered.receiptGeneration, 0);
  assert.equal((await abortWorkflow(started.receipt.outputDirectory)).status, "aborted");
});

test("workflow authority reads reject multiply linked control files", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-workflow-authority-hardlink-"));
  const duplicate = path.join(root, "authority-duplicate.json");
  context.after(() => rm(root, { recursive: true, force: true }));
  const started = await startDesign({ root, host: "codex" });
  const control = path.join(authorityRoot(), `${started.authority.authority_id}.workflow.json`);
  await link(control, duplicate);
  await assert.rejects(establishWorkflowPlan({
    authorityId: started.authority.authority_id,
    capability: started.authority.capabilities.plan!,
    overviewMarkdown: "# Brief\n\nUnsafe authority state must fail closed.",
    manifest: { lanes: designLanes() },
  }), /FA_AUTHORITY_UNSAFE/u);
  await unlink(duplicate);
  await abortWorkflow(started.receipt.outputDirectory);
});

test("expired workflow authorities are reclaimed by the shared authority cleanup", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-workflow-authority-expiry-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const started = await startDesign({ root, host: "codex" });
  const control = path.join(authorityRoot(), `${started.authority.authority_id}.workflow.json`);
  const record = JSON.parse(await readFile(control, "utf8")) as Record<string, unknown>;
  await writeFile(control, `${JSON.stringify({ ...record, expiresAt: "2000-01-01T00:00:00.000Z" })}\n`, { mode: 0o600 });
  assert.equal(await cleanupExpiredAuthorities(new Date()), 1);
  await assert.rejects(access(control), { code: "ENOENT" });
  await abortWorkflow(started.receipt.outputDirectory);
});

test("workflow revocation ignores an unrelated ambiguous authority publication", async (context) => {
  const firstRoot = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-workflow-revoke-first-"));
  const secondRoot = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-workflow-revoke-second-"));
  context.after(() => rm(firstRoot, { recursive: true, force: true }));
  context.after(() => rm(secondRoot, { recursive: true, force: true }));
  const first = await startDesign({ root: firstRoot, host: "codex" });
  const second = await startDesign({ root: secondRoot, host: "codex" });
  const secondControl = path.join(authorityRoot(), `${second.authority.authority_id}.workflow.json`);
  const publicationCandidate = `${secondControl}.candidate-${"b".repeat(32)}`;
  await link(secondControl, publicationCandidate);
  assert.equal((await abortWorkflow(first.receipt.outputDirectory)).status, "aborted");
  await access(secondControl);
  await unlink(publicationCandidate);
  assert.equal((await abortWorkflow(second.receipt.outputDirectory)).status, "aborted");
});

test("workflow authority payloads are validated before selecting a lifecycle lock", async (context) => {
  const cases: Array<[string, (record: Record<string, unknown>) => string]> = [
    ["invalid JSON", () => "{\"schemaVersion\":"],
    ["missing run directory", (record) => JSON.stringify(Object.fromEntries(Object.entries(record).filter(([key]) => key !== "runDirectory")))],
    ["relative run directory", (record) => JSON.stringify({ ...record, runDirectory: "outside" })],
    ["malformed scope", (record) => JSON.stringify({ ...record, scopes: { plan: { digest: "0".repeat(64), exactPaths: ["../outside.md"], prefixPaths: [], maxArtifacts: 1 } } })],
  ];
  for (const [label, mutate] of cases) {
    const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-workflow-authority-payload-"));
    context.after(() => rm(root, { recursive: true, force: true }));
    const started = await startDesign({ root, host: "codex" });
    const control = path.join(authorityRoot(), `${started.authority.authority_id}.workflow.json`);
    const record = JSON.parse(await readFile(control, "utf8")) as Record<string, unknown>;
    await writeFile(control, `${mutate(record)}\n`, { mode: 0o600 });
    await assert.rejects(establishWorkflowPlan({
      authorityId: started.authority.authority_id,
      capability: started.authority.capabilities.plan!,
      overviewMarkdown: "# Brief\n\nMalformed authority state must fail before lock selection.",
      manifest: { lanes: designLanes() },
    }), /FA_AUTHORITY_INCOMPATIBLE/u, label);
    await abortWorkflow(started.receipt.outputDirectory);
  }
});

test("workflow lifecycle locking rejects a redirected output control root", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-workflow-control-root-"));
  const outside = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-workflow-control-outside-"));
  context.after(() => Promise.all([
    rm(root, { recursive: true, force: true }),
    rm(outside, { recursive: true, force: true }),
  ]));
  const started = await startDesign({ root, host: "codex" });
  const internal = path.join(root, ".friendly-adversary", ".internal");
  await symlink(outside, internal, process.platform === "win32" ? "junction" : "dir");
  await assert.rejects(
    abortWorkflow(started.receipt.outputDirectory),
    /symbolic-link output path/u,
  );
  assert.deepEqual(await readdir(outside), []);
  await unlink(internal);
  await abortWorkflow(started.receipt.outputDirectory);
});

test("every design resume retires the previous phase authority", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-design-authority-replacement-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const started = await startDesign({ root, host: "codex" });
  const planned = await establishWorkflowPlan({
    authorityId: started.authority.authority_id,
    capability: started.authority.capabilities.plan!,
    overviewMarkdown: "# Brief\n\nAuthority replacement must be exact.",
    manifest: { lanes: designLanes() },
  });
  const replacement = await resumeWorkflow(started.receipt.outputDirectory);
  await assert.rejects(recordWorkflowArtifact({
    authorityId: planned.authority_id,
    capability: planned.capabilities["lane:architecture"]!,
    relativePath: "decision-architecture-0001.md",
    markdown: "# Stale decision\n\nThis authority was retired.",
  }), /FA_AUTHORITY_NOT_FOUND/u);
  await recordWorkflowArtifact({
    authorityId: replacement.authority_id,
    capability: replacement.capabilities["lane:architecture"]!,
    relativePath: "decision-architecture-0001.md",
    markdown: "# Current decision\n\nThis replacement authority is live.",
  });
});

test("concurrent completion and batched revision cannot lose revision state", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-design-transition-race-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const { started, outcome } = await designReadyForOutcome(root);
  const artifacts = [
    { relativePath: "architecture.md", markdown: "# Architecture\n\nA modular service." },
    { relativePath: "diagrams.md", markdown: "# Diagrams\n\n```text\nclient -> service\n```" },
    { relativePath: "test-strategy.md", markdown: "# Test strategy\n\nUnit and contract tests." },
    { relativePath: "implementation-plan.md", markdown: "# Implementation plan\n\nBuild one vertical slice." },
    { relativePath: "open-questions.md", markdown: "# Open questions\n\nNone." },
  ];
  const raced = await Promise.allSettled([
    completeWorkflow({
      authorityId: outcome.authority_id,
      capability: outcome.capabilities.outcome!,
      artifacts,
      userSignoff: true,
    }),
    resumeWorkflow(started.receipt.outputDirectory, ["architecture"]),
  ]);
  assert.equal(raced.filter((result) => result.status === "fulfilled").length, 1);
  assert.equal(raced.filter((result) => result.status === "rejected").length, 1);
  const receipt = await workflowStatus(started.receipt.outputDirectory);
  if (receipt.status === "ready") {
    assert.deepEqual(receipt.pendingDecisionRevisions, {});
  } else {
    assert.equal(receipt.status, "planned");
    assert.equal(receipt.pendingDecisionRevisions.architecture, "decision-architecture-0002.md");
    assert.equal(await readFile(path.join(receipt.outputDirectory, "architecture.md"), "utf8"), "");
  }
});

test("new codebase design requires append-only decisions and explicit signoff", async (context) => {
  const root = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-design-"));
  context.after(() => rm(root, { recursive: true, force: true }));
  const started = await startDesign({ root, host: "claude-code" });
  const planned = await establishWorkflowPlan({
    authorityId: started.authority.authority_id,
    capability: started.authority.capabilities.plan!,
    overviewMarkdown: "# Brief\n\nDesign a small service without scaffolding it.",
    manifest: { lanes: [
      { id: "architecture", kind: "decision", title: "Architecture", scope: "Runtime and boundaries", dimensions: [] },
      { id: "feasibility", kind: "challenge", title: "Feasibility", scope: "Challenge feasibility", dimensions: [] },
      { id: "simplicity", kind: "challenge", title: "Simplicity", scope: "Challenge unnecessary complexity", dimensions: [] },
      { id: "security", kind: "challenge", title: "Security", scope: "Challenge trust boundaries", dimensions: [] },
      { id: "operability", kind: "challenge", title: "Operability", scope: "Challenge operational gaps", dimensions: [] },
      { id: "verification", kind: "challenge", title: "Verification", scope: "Challenge testability", dimensions: [] },
    ] },
  });
  await assert.rejects(recordWorkflowArtifact({
    authorityId: planned.authority_id,
    capability: planned.capabilities["lane:architecture"]!,
    relativePath: "decision-architecture-latest.md",
    markdown: "# Invalid revision",
  }), /FA_CAPABILITY_DENIED/u);
  await writeFile(path.join(started.receipt.outputDirectory, "decision-architecture-0001.md"), "partial");
  const recovered = await recordWorkflowArtifact({ authorityId: planned.authority_id, capability: planned.capabilities["lane:architecture"]!, relativePath: "decision-architecture-0001.md", markdown: "# Architecture decision\n\nUse a modular service." });
  assert.equal(recovered.publication, "recovered_transaction");
  const confirmed = await recordWorkflowArtifact({ authorityId: planned.authority_id, capability: planned.capabilities["lane:architecture"]!, relativePath: "decision-architecture-0001.md", markdown: "# Architecture decision\n\nUse a modular service." });
  assert.equal(confirmed.publication, "confirmed_existing");
  await assert.rejects(
    resumeWorkflow(started.receipt.outputDirectory, ["architecture"]),
    /FA_REVISION_BARRIER/u,
  );
  const challenges = await resumeWorkflow(started.receipt.outputDirectory);
  await Promise.all(["feasibility", "simplicity", "security", "operability", "verification"].map(async (id) => recordWorkflowArtifact({
    authorityId: challenges.authority_id,
    capability: challenges.capabilities[`lane:${id}`]!,
    relativePath: `challenge-${id}.md`,
    markdown: `# ${id}\n\nThe ${id} challenge found no blocking contradiction.`,
  })));
  const challengeRevision = await resumeWorkflow(started.receipt.outputDirectory, ["architecture"]);
  assert.deepEqual(Object.keys(challengeRevision.capabilities), ["lane:architecture"]);
  await recordWorkflowArtifact({
    authorityId: challengeRevision.authority_id,
    capability: challengeRevision.capabilities["lane:architecture"]!,
    relativePath: "decision-architecture-0002.md",
    markdown: "# Architecture decision revision\n\nThe challenge evidence was incorporated before signoff.",
  });
  const staleOutcome = await resumeWorkflow(started.receipt.outputDirectory);
  assert.ok(staleOutcome.capabilities.outcome);
  const explicitRevision = await resumeWorkflow(started.receipt.outputDirectory, ["architecture"]);
  assert.equal(explicitRevision.capabilities.outcome, undefined);
  const recoveredRevision = await resumeWorkflow(started.receipt.outputDirectory);
  assert.equal(recoveredRevision.capabilities.outcome, undefined);
  await recordWorkflowArtifact({
    authorityId: recoveredRevision.authority_id,
    capability: recoveredRevision.capabilities["lane:architecture"]!,
    relativePath: "decision-architecture-0003.md",
    markdown: "# Architecture decision revision\n\nThe explicitly requested final revision is complete.",
  });
  const artifacts = [
    { relativePath: "architecture.md", markdown: "# Architecture\n\nA modular service." },
    { relativePath: "diagrams.md", markdown: "# Diagrams\n\n```text\nclient -> service\n```" },
    { relativePath: "test-strategy.md", markdown: "# Test strategy\n\nUnit and contract tests." },
    { relativePath: "implementation-plan.md", markdown: "# Implementation plan\n\nBuild one vertical slice." },
    { relativePath: "open-questions.md", markdown: "# Open questions\n\nNone." },
  ];
  await assert.rejects(completeWorkflow({
    authorityId: staleOutcome.authority_id,
    capability: staleOutcome.capabilities.outcome!,
    artifacts,
    userSignoff: true,
  }), /FA_AUTHORITY_NOT_FOUND/u);
  const outcome = await resumeWorkflow(started.receipt.outputDirectory);
  await assert.rejects(completeWorkflow({ authorityId: outcome.authority_id, capability: outcome.capabilities.outcome!, artifacts }), /FA_SIGNOFF_REQUIRED/u);
  await completeWorkflow({ authorityId: outcome.authority_id, capability: outcome.capabilities.outcome!, artifacts, userSignoff: true });
  await assert.rejects(recordWorkflowArtifact({
    authorityId: challengeRevision.authority_id,
    capability: challengeRevision.capabilities["lane:architecture"]!,
    relativePath: "decision-architecture-0002.md",
    markdown: "# Late rewrite\n\nThis must never reopen a signed-off design.",
  }), /FA_AUTHORITY_NOT_FOUND/u);
  assert.equal((await readdir(started.receipt.outputDirectory)).includes("decision-architecture-0004.md"), false);
  const sealed = await sealWorkflow(started.receipt.outputDirectory);
  assert.equal(sealed.status, "sealed");
  assert.equal((await verifyWorkflow(started.receipt.outputDirectory)).valid, true);
  const manifestPath = path.join(started.receipt.outputDirectory, "artifacts.sha256");
  const committedReceipt = await workflowStatus(started.receipt.outputDirectory);
  const transactionDomain = "friendly-adversary:workflow-seal:v1";
  const transactionPath = path.join(
    authorityRoot(),
    `${createHash("sha256").update(`${transactionDomain}\0${path.resolve(committedReceipt.outputDirectory)}`).digest("hex").slice(0, 32)}.json`,
  );
  const transaction = {
    schemaVersion: "1",
    runDirectory: committedReceipt.outputDirectory,
    runId: committedReceipt.runId,
    receiptDigest: createHash("sha256").update(`${transactionDomain}\0${canonical(committedReceipt)}`).digest("hex"),
    manifestDigest: createHash("sha256").update(await readFile(manifestPath)).digest("hex"),
  };
  await writeFile(transactionPath, `${canonical(transaction)}\n`);
  await writeFile(manifestPath, "partial manifest publication");
  assert.equal((await sealWorkflow(started.receipt.outputDirectory)).status, "sealed");
  assert.equal((await verifyWorkflow(started.receipt.outputDirectory)).valid, true);
  await assert.rejects(access(transactionPath), /ENOENT/u);
  const manifest = await readFile(manifestPath, "utf8");
  await writeFile(manifestPath, `${manifest.split("\n")[0]}\n`);
  await assert.rejects(verifyWorkflow(started.receipt.outputDirectory), /FA_MANIFEST_INVALID/u);
  await assert.rejects(sealWorkflow(started.receipt.outputDirectory), /FA_MANIFEST_INVALID/u);
  await writeFile(manifestPath, manifest);
  await writeFile(transactionPath, `${canonical({ ...transaction, manifestDigest: createHash("sha256").update(manifest).digest("hex") })}\n`);
  await writeFile(path.join(started.receipt.outputDirectory, "architecture.md"), workflowArtifactEnvelope("# Tampered architecture\n\nThis was changed after the seal decision."));
  await writeFile(manifestPath, "partial manifest publication");
  await assert.rejects(sealWorkflow(started.receipt.outputDirectory), /FA_MANIFEST_INVALID/u);
  await access(path.join(started.receipt.outputDirectory, "design-pack.md"));
  await access(path.join(started.receipt.outputDirectory, "design.html"));
});
