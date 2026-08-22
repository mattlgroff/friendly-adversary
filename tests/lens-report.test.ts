import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { cleanupExpiredAuthorities, planProductVersionIsCompatible } from "../src/authority.js";
import { PRODUCT_VERSION } from "../src/constants.js";
import { recordLensReport, recordReviewOutcome, validateCommittedOutcome, validateLensReportContract } from "../src/lens-report.js";
import { runReview } from "../src/review.js";

function git(repo: string, ...args: string[]): void {
  execFileSync("git", ["-C", repo, ...args], { stdio: "ignore" });
}

async function fixture(lenses = ["correctness", "security"]) {
  const repo = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-lens-"));
  git(repo, "init", "-b", "main");
  git(repo, "config", "user.email", "fixture@example.com");
  git(repo, "config", "user.name", "Fixture");
  await writeFile(path.join(repo, "app.py"), "value = 1\n");
  git(repo, "add", ".");
  git(repo, "commit", "-m", "base");
  git(repo, "switch", "-c", "feature");
  await writeFile(path.join(repo, "app.py"), "value = 2\n");
  return { repo, run: await runReview({ repo, base: "main", timeoutMs: 20_000, expectedLenses: lenses, host: "codex" }) };
}

const body = "# No supported findings\n\nInspected the pinned evidence.";
const completeFinding = `### Contract regression
- Failure class: breaking response change
- Property violated: existing consumers remain compatible
- Location: src/example.ts:1
- Evidence: the response field changed
- Failure path: an existing consumer reads the removed field
- Impact: the consumer receives no value
- Disproof attempted: searched known consumers
- Uncertainty: external consumers are unavailable`;

test("run plans require the exact product version", () => {
  assert.equal(planProductVersionIsCompatible(PRODUCT_VERSION), true);
  assert.equal(planProductVersionIsCompatible("2.0.0"), false);
});

test("lens capabilities are exact, path scoped, and idempotent", async (t) => {
  const found = await fixture();
  t.after(() => rm(found.repo, { recursive: true, force: true }));
  const input = {
    operation: "publish" as const,
    authorityId: found.run.authority.authority_id,
    lensId: "correctness",
    writeCapability: found.run.authority.lens_capabilities.correctness!,
    reportMarkdown: body,
  };
  assert.equal((await recordLensReport(input)).publication, "created");
  assert.equal((await recordLensReport(input)).publication, "confirmed_existing");
  await assert.rejects(() => recordLensReport({ ...input, lensId: "security" }), /CAPABILITY_DENIED/u);
  await assert.rejects(() => recordLensReport({ ...input, reportMarkdown: `${body}\nchanged` }), /ALREADY_DIFFERENT/u);
});

test("all lens reports can publish concurrently", async (t) => {
  const found = await fixture();
  t.after(() => rm(found.repo, { recursive: true, force: true }));
  await Promise.all(["correctness", "security"].map((lensId) => recordLensReport({
    operation: "publish",
    authorityId: found.run.authority.authority_id,
    lensId,
    writeCapability: found.run.authority.lens_capabilities[lensId]!,
    reportMarkdown: body,
  })));
  const persisted = await Promise.all(["correctness", "security"].map((lens) => readFile(path.join(found.run.runDirectory, "lenses", `${lens}.md`), "utf8")));
  assert.equal(persisted.every((content) => content.includes("friendly-adversary:lens-complete")), true);
});

test("outcome requires every lens and is idempotent", async (t) => {
  const found = await fixture();
  t.after(() => rm(found.repo, { recursive: true, force: true }));
  const outcome = {
    operation: "publish" as const,
    authorityId: found.run.authority.authority_id,
    writeCapability: found.run.authority.outcome_capability,
    adjudicationMarkdown: "# Adjudication\n\nNo supported claims.",
    reportMarkdown: "# Report\n\nNo confirmed findings.",
  };
  await assert.rejects(() => recordReviewOutcome(outcome), /LENSES_INCOMPLETE/u);
  await Promise.all(["correctness", "security"].map((lensId) => recordLensReport({
    operation: "publish", authorityId: found.run.authority.authority_id, lensId,
    writeCapability: found.run.authority.lens_capabilities[lensId]!, reportMarkdown: body,
  })));
  assert.equal((await recordReviewOutcome(outcome)).publication, "created");
  assert.equal((await recordReviewOutcome(outcome)).publication, "confirmed_existing");
});

test("outcome retry completes a partial two-document publication", async (t) => {
  const found = await fixture(["correctness"]);
  t.after(() => rm(found.repo, { recursive: true, force: true }));
  await recordLensReport({
    operation: "publish",
    authorityId: found.run.authority.authority_id,
    lensId: "correctness",
    writeCapability: found.run.authority.lens_capabilities.correctness!,
    reportMarkdown: body,
  });
  const outcome = {
    operation: "publish" as const,
    authorityId: found.run.authority.authority_id,
    writeCapability: found.run.authority.outcome_capability,
    adjudicationMarkdown: "# Adjudication\n\nNo supported claims.",
    reportMarkdown: "# Report\n\nNo confirmed findings.",
  };
  await recordReviewOutcome(outcome);
  await unlink(path.join(found.run.runDirectory, "report.md"));
  assert.equal((await recordReviewOutcome(outcome)).publication, "confirmed_existing");
  assert.match(await readFile(path.join(found.run.runDirectory, "report.md"), "utf8"), /friendly-adversary:complete/u);
});

test("outcome retry cannot pair an earlier adjudication with a different report", async (t) => {
  const found = await fixture(["correctness"]);
  t.after(() => rm(found.repo, { recursive: true, force: true }));
  await recordLensReport({
    operation: "publish",
    authorityId: found.run.authority.authority_id,
    lensId: "correctness",
    writeCapability: found.run.authority.lens_capabilities.correctness!,
    reportMarkdown: body,
  });
  const outcome = {
    operation: "publish" as const,
    authorityId: found.run.authority.authority_id,
    writeCapability: found.run.authority.outcome_capability,
    adjudicationMarkdown: "# Adjudication\n\nNo supported claims.",
    reportMarkdown: "# Report\n\nNo confirmed findings.",
  };
  await recordReviewOutcome(outcome);
  await unlink(path.join(found.run.runDirectory, "report.md"));
  await assert.rejects(() => recordReviewOutcome({
    ...outcome,
    reportMarkdown: "# Report\n\nA different conclusion.",
  }), /ALREADY_DIFFERENT/u);
});

test("committed outcome validation binds adjudication to the exact report", async (t) => {
  const found = await fixture(["correctness"]);
  t.after(() => rm(found.repo, { recursive: true, force: true }));
  await recordLensReport({
    operation: "publish",
    authorityId: found.run.authority.authority_id,
    lensId: "correctness",
    writeCapability: found.run.authority.lens_capabilities.correctness!,
    reportMarkdown: body,
  });
  await recordReviewOutcome({
    operation: "publish",
    authorityId: found.run.authority.authority_id,
    writeCapability: found.run.authority.outcome_capability,
    adjudicationMarkdown: "# Adjudication\n\nNo supported claims.",
    reportMarkdown: "# Report\n\nNo confirmed findings.",
  });
  await writeFile(path.join(found.run.runDirectory, "report.md"), "# Replaced report\n");
  await assert.rejects(() => validateCommittedOutcome(found.run.runDirectory), /OUTCOME_PAIR_MISMATCH/u);
});

test("cancellation is honored before the publication commit point", async (t) => {
  const found = await fixture(["correctness"]);
  t.after(() => rm(found.repo, { recursive: true, force: true }));
  const cancelled = new AbortController();
  cancelled.abort();
  await assert.rejects(() => recordLensReport({
    operation: "publish",
    authorityId: found.run.authority.authority_id,
    lensId: "correctness",
    writeCapability: found.run.authority.lens_capabilities.correctness!,
    reportMarkdown: body,
    signal: cancelled.signal,
  }), /FA_CANCELLED/u);
  await assert.rejects(readFile(path.join(found.run.runDirectory, "lenses", "correctness.md")), { code: "ENOENT" });
});

test("cancellation after candidate sync still prevents the hard-link commit", async (t) => {
  const found = await fixture(["correctness"]);
  t.after(() => rm(found.repo, { recursive: true, force: true }));
  let checks = 0;
  const signal = { get aborted() { checks += 1; return checks > 1; } } as AbortSignal;
  await assert.rejects(() => recordLensReport({
    operation: "publish",
    authorityId: found.run.authority.authority_id,
    lensId: "correctness",
    writeCapability: found.run.authority.lens_capabilities.correctness!,
    reportMarkdown: body,
    signal,
  }), /FA_CANCELLED/u);
  await assert.rejects(readFile(path.join(found.run.runDirectory, "lenses", "correctness.md")), { code: "ENOENT" });
});

test("cancelled outcome publication commits neither document", async (t) => {
  const found = await fixture(["correctness"]);
  t.after(() => rm(found.repo, { recursive: true, force: true }));
  await recordLensReport({
    operation: "publish",
    authorityId: found.run.authority.authority_id,
    lensId: "correctness",
    writeCapability: found.run.authority.lens_capabilities.correctness!,
    reportMarkdown: body,
  });
  const cancelled = new AbortController();
  cancelled.abort();
  await assert.rejects(() => recordReviewOutcome({
    operation: "publish",
    authorityId: found.run.authority.authority_id,
    writeCapability: found.run.authority.outcome_capability,
    adjudicationMarkdown: "# Adjudication\n\nNo supported claims.",
    reportMarkdown: "# Report\n\nNo confirmed findings.",
    signal: cancelled.signal,
  }), /FA_CANCELLED/u);
  await assert.rejects(readFile(path.join(found.run.runDirectory, "adjudication.md")), { code: "ENOENT" });
  await assert.rejects(readFile(path.join(found.run.runDirectory, "report.md")), { code: "ENOENT" });
});

test("report validation rejects secrets and adjudicator fields in lenses", async (t) => {
  const found = await fixture(["correctness"]);
  t.after(() => rm(found.repo, { recursive: true, force: true }));
  const base = { operation: "publish" as const, authorityId: found.run.authority.authority_id, lensId: "correctness", writeCapability: found.run.authority.lens_capabilities.correctness! };
  await assert.rejects(() => recordLensReport({ ...base, reportMarkdown: "### Finding\n- Priority: high" }), /CONTRACT_INVALID/u);
  await assert.rejects(() => recordLensReport({
    ...base,
    reportMarkdown: "### Incomplete finding\n- Failure class: correctness",
  }), /missing '- Property violated: <value>'/u);
  await assert.rejects(() => recordLensReport({ ...base, reportMarkdown: "# No supported findings\n\nsk-abcdefghijklmnopqrstuvwxyz" }), /SECRET_PATTERN/u);
  await assert.rejects(() => recordLensReport({ ...base, reportMarkdown: "# No supported findings\n\npostgres://user:secret@example.com/db" }), /SECRET_PATTERN/u);
});

test("fenced terminal headings do not satisfy the lens outcome contract", () => {
  for (const heading of ["# No supported findings", "# Abstained"]) {
    assert.throws(
      () => validateLensReportContract(`\`\`\`markdown\n${heading}\n\`\`\``, "contracts.md"),
      /must declare '# No supported findings', '# Abstained', or structured '###' findings/u,
    );
  }
});

test("terminal lens outcomes require an inspection or abstention rationale", () => {
  assert.throws(() => validateLensReportContract("# No supported findings", "contracts.md"), /must explain/u);
  assert.throws(() => validateLensReportContract("# Abstained", "contracts.md"), /must explain/u);
  assert.throws(() => validateLensReportContract("# No supported findings\n\n<!-- nothing inspected -->", "contracts.md"), /must explain/u);
  assert.throws(() => validateLensReportContract("# Abstained\n\n<!-- no rationale -->", "contracts.md"), /must explain/u);
});

test("fenced findings do not conflict with a terminal lens outcome", () => {
  assert.doesNotThrow(() => validateLensReportContract(
    `# No supported findings\n\nInspected the pinned evidence.\n\n\`\`\`markdown\n${completeFinding}\n\`\`\``,
    "contracts.md",
  ));
});

test("tilde-fenced headings and findings are ignored", () => {
  assert.doesNotThrow(() => validateLensReportContract(
    `# Abstained\n\nThe required runtime evidence was unavailable.\n\n~~~markdown\n# No supported findings\n${completeFinding}\n~~~`,
    "contracts.md",
  ));
});

test("legitimate findings adjacent to fences remain validated", () => {
  assert.doesNotThrow(() => validateLensReportContract(
    `\`\`\`text\n### Not a finding\n\`\`\`\n${completeFinding}\n~~~text\n# Abstained\n~~~`,
    "contracts.md",
  ));
});

test("expired authority cleanup remains independent of repository state", async () => {
  assert.ok(await cleanupExpiredAuthorities(new Date("9999-01-01T00:00:00.000Z")) >= 0);
});
