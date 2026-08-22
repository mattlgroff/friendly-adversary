import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { access, mkdir, mkdtemp, readFile, realpath, rm, symlink, unlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { hasLiveReviewAuthority, revokeReviewAuthorityById } from "../src/authority.js";
import { recordLensReport, recordReviewOutcome } from "../src/lens-report.js";
import { runReview, sealReview, statRun, verifyReview } from "../src/review.js";
import type { PrepareOptions } from "../src/types.js";

function git(repo: string, ...args: string[]): void {
  execFileSync("git", ["-C", repo, ...args], { stdio: "ignore" });
}

async function fixture(): Promise<string> {
  const repo = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-review-"));
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

function options(repo: string): PrepareOptions {
  return { repo, base: "main", timeoutMs: 20_000, expectedLenses: ["correctness"], host: "codex" };
}

async function complete(run: Awaited<ReturnType<typeof runReview>>): Promise<void> {
  await recordLensReport({
    operation: "publish",
    authorityId: run.authority.authority_id,
    lensId: "correctness",
    writeCapability: run.authority.lens_capabilities.correctness!,
    reportMarkdown: "# No supported findings\n\nInspected the pinned evidence.",
  });
  const incomplete = run.receipt.incompleteReasons.length
    ? `\n\n<!-- friendly-adversary:incomplete-status -->\n\n## Required coverage gaps\n\n${run.receipt.incompleteReasons.map((reason) => `- ${reason}`).join("\n")}`
    : "";
  await recordReviewOutcome({
    operation: "publish",
    authorityId: run.authority.authority_id,
    writeCapability: run.authority.outcome_capability,
    adjudicationMarkdown: "# Adjudication\n\nNo supported claims.",
    reportMarkdown: `# Report\n\nNo confirmed findings.${incomplete}`,
  });
}

async function discardPreparedRun(run: Awaited<ReturnType<typeof runReview>>): Promise<void> {
  await revokeReviewAuthorityById(run.authority.authority_id);
  await Promise.all([
    rm(run.runDirectory, { recursive: true, force: true }),
    rm(`${run.runDirectory}.scratch`, { recursive: true, force: true }),
  ]);
}

test("collects outside the repository and publishes only a complete sealed directory", async (t) => {
  const repo = await fixture();
  t.after(() => rm(repo, { recursive: true, force: true }));
  const run = await runReview(options(repo));
  assert.equal(path.relative(repo, run.runDirectory).startsWith(".."), true);
  await assert.rejects(access(path.join(repo, ".friendly-adversary")));
  assert.equal(await hasLiveReviewAuthority(run.runDirectory), true);
  await complete(run);
  const sealed = await sealReview(run.runDirectory);
  assert.equal(sealed.status, run.receipt.incompleteReasons.length ? "sealed-incomplete" : "sealed");
  assert.ok(sealed.outputDirectory.startsWith(path.join(repo, ".friendly-adversary", "pr-reviews")));
  await assert.rejects(access(run.runDirectory));
  assert.deepEqual(await verifyReview(sealed.outputDirectory), { valid: true, artifacts: sealed.artifactCount });
});

test("collection cleanup attempts both paths and preserves every failure", async (t) => {
  const repo = await fixture();
  t.after(() => rm(repo, { recursive: true, force: true }));
  const attempted: string[] = [];
  let privateRun = "";
  await assert.rejects(
    () => runReview(
      { ...options(repo), expectedLenses: ["missing-lens"] },
      {
        removeFailedPath: async (target) => {
          attempted.push(target);
          if (!target.endsWith(".scratch")) {
            privateRun = target;
            throw new Error("injected run cleanup failure");
          }
          await rm(target, { recursive: true, force: true });
        },
      },
    ),
    (error: unknown) => {
      assert.ok(error instanceof AggregateError);
      assert.match(String(error.errors[0]), /Installed lens definition is missing: missing-lens/u);
      assert.match(String(error.errors[1]), /injected run cleanup failure/u);
      return true;
    },
  );
  assert.equal(attempted.length, 2);
  assert.ok(attempted.some((target) => target.endsWith(".scratch")));
  assert.ok(attempted.some((target) => !target.endsWith(".scratch")));
  await rm(privateRun, { recursive: true, force: true });
});

test("verification rejects corruption after sealing", async (t) => {
  const repo = await fixture();
  t.after(() => rm(repo, { recursive: true, force: true }));
  const run = await runReview(options(repo));
  await complete(run);
  const sealed = await sealReview(run.runDirectory);
  await writeFile(path.join(sealed.outputDirectory, "report.md"), "corrupted\n");
  await assert.rejects(() => verifyReview(sealed.outputDirectory), /Artifact verification failed: report\.md/u);
});

test("refuses publication when the reviewed snapshot changes", async (t) => {
  const repo = await fixture();
  t.after(() => rm(repo, { recursive: true, force: true }));
  const run = await runReview(options(repo));
  t.after(() => discardPreparedRun(run));
  await complete(run);
  await writeFile(path.join(repo, "app.py"), "value = 3\n");
  await assert.rejects(() => sealReview(run.runDirectory), /snapshot changed/u);
  await assert.rejects(access(path.join(repo, ".friendly-adversary")));
});

test("refuses a redirected publication root", async (t) => {
  const repo = await fixture();
  const outside = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-outside-"));
  t.after(() => Promise.all([rm(repo, { recursive: true, force: true }), rm(outside, { recursive: true, force: true })]));
  await writeFile(path.join(repo, ".git", "info", "exclude"), ".friendly-adversary\n");
  await symlink(outside, path.join(repo, ".friendly-adversary"));
  const run = await runReview(options(repo));
  await complete(run);
  await assert.rejects(() => sealReview(run.runDirectory), /symbolic-link output path/u);
  assert.deepEqual(await readFile(path.join(outside, ".keep")).catch(() => undefined), undefined);
  await unlink(path.join(repo, ".friendly-adversary"));
  const sealed = await sealReview(run.runDirectory);
  assert.equal((await verifyReview(sealed.outputDirectory)).valid, true);
});

test("reviews of independent repositories use independent private and final paths", async (t) => {
  const [leftRepo, rightRepo] = await Promise.all([fixture(), fixture()]);
  t.after(() => Promise.all([
    rm(leftRepo, { recursive: true, force: true }),
    rm(rightRepo, { recursive: true, force: true }),
  ]));
  const [left, right] = await Promise.all([runReview(options(leftRepo)), runReview(options(rightRepo))]);
  t.after(() => Promise.all([discardPreparedRun(left), discardPreparedRun(right)]));
  assert.notEqual(left.runDirectory, right.runDirectory);
  assert.notEqual(left.receipt.publicationDirectory, right.receipt.publicationDirectory);
});

test("seal retries after authority revocation without recollecting", async (t) => {
  const repo = await fixture();
  t.after(() => rm(repo, { recursive: true, force: true }));
  const run = await runReview(options(repo));
  await complete(run);
  await assert.rejects(() => sealReview(run.runDirectory, {
    afterAuthorityRevocation: async () => { throw new Error("injected post-revocation failure"); },
  }), /injected post-revocation failure/u);
  const sealed = await sealReview(run.runDirectory);
  assert.equal((await verifyReview(sealed.outputDirectory)).valid, true);
});

test("a failed seal preflight leaves private evidence intact", async (t) => {
  const repo = await fixture();
  t.after(() => rm(repo, { recursive: true, force: true }));
  const run = await runReview(options(repo));
  t.after(() => discardPreparedRun(run));
  await complete(run);
  await writeFile(path.join(repo, "app.py"), "value = 3\n");
  await assert.rejects(() => sealReview(run.runDirectory), /snapshot changed/u);
  assert.ok((await statRun(run.runDirectory)).artifactBytes > 0);
});

test("a crash after the seal decision resumes the verified staging despite later checkout changes", async (t) => {
  const repo = await fixture();
  t.after(() => rm(repo, { recursive: true, force: true }));
  const run = await runReview(options(repo));
  await complete(run);
  await assert.rejects(() => sealReview(run.runDirectory, {
    afterTerminalClaim: async () => { throw new Error("injected post-claim crash"); },
  }), /injected post-claim crash/u);
  await writeFile(path.join(repo, "app.py"), "value = 3\n");
  const sealed = await sealReview(run.runDirectory);
  assert.equal((await verifyReview(sealed.outputDirectory)).valid, true);
});

test("concurrent seals use independent staging and converge on one verified publication", async (t) => {
  const repo = await fixture();
  t.after(() => rm(repo, { recursive: true, force: true }));
  const run = await runReview(options(repo));
  await complete(run);
  let releaseFirst!: () => void;
  const held = new Promise<void>((resolve) => { releaseFirst = resolve; });
  let firstClaimed!: () => void;
  const claimed = new Promise<void>((resolve) => { firstClaimed = resolve; });
  const first = sealReview(run.runDirectory, {
    afterAuthorityRevocation: async () => {
      firstClaimed();
      await held;
    },
  });
  await claimed;
  const second = sealReview(run.runDirectory);
  const secondResult = await second;
  releaseFirst();
  const firstResult = await first;
  assert.equal(firstResult.outputDirectory, secondResult.outputDirectory);
  assert.equal((await verifyReview(firstResult.outputDirectory)).valid, true);
});

test("seal recovers a final run after a crash immediately after rename", async (t) => {
  const repo = await fixture();
  t.after(() => rm(repo, { recursive: true, force: true }));
  const run = await runReview(options(repo));
  await complete(run);
  const recovered = await sealReview(run.runDirectory, {
    afterFinalRename: async () => { throw new Error("injected post-rename crash"); },
  });
  assert.equal((await verifyReview(recovered.outputDirectory)).valid, true);
  await assert.rejects(access(run.runDirectory));
});

test("abandoned staging from a prior hard crash cannot poison sealing", async (t) => {
  const repo = await fixture();
  t.after(() => rm(repo, { recursive: true, force: true }));
  const run = await runReview(options(repo));
  await complete(run);
  const staging = path.join(path.dirname(run.receipt.publicationDirectory!), `.staging-${run.receipt.runId}`);
  await mkdir(staging, { recursive: true });
  await writeFile(path.join(staging, "partial.txt"), "partial\n");
  const sealed = await sealReview(run.runDirectory);
  assert.equal((await verifyReview(sealed.outputDirectory)).valid, true);
});

test("seal never replaces a dangling final symlink", async (t) => {
  const repo = await fixture();
  t.after(() => rm(repo, { recursive: true, force: true }));
  const run = await runReview(options(repo));
  await complete(run);
  const publication = run.receipt.publicationDirectory!;
  await mkdir(path.dirname(publication), { recursive: true });
  await symlink(path.join(repo, "missing-final-target"), publication, "dir");
  await assert.rejects(() => sealReview(run.runDirectory), /redirected or not a directory/u);
});

test("staging corruption fails before final publication and remains retryable", async (t) => {
  const repo = await fixture();
  t.after(() => rm(repo, { recursive: true, force: true }));
  const run = await runReview(options(repo));
  await complete(run);
  await assert.rejects(() => sealReview(run.runDirectory, {
    beforeStagingVerification: async (staging) => writeFile(path.join(staging, "report.md"), "corrupted\n"),
  }), /Artifact verification failed/u);
  await assert.rejects(access(run.receipt.publicationDirectory!));
  const sealed = await sealReview(run.runDirectory);
  assert.equal((await verifyReview(sealed.outputDirectory)).valid, true);
});

test("publication scratch debris cannot poison sealing", async (t) => {
  const repo = await fixture();
  t.after(() => rm(repo, { recursive: true, force: true }));
  const run = await runReview(options(repo));
  await complete(run);
  const candidate = path.join(`${run.runDirectory}.scratch`, ".publish-0123456789abcdef0123456789abcdef.tmp");
  await writeFile(candidate, "partial\n");
  const sealed = await sealReview(run.runDirectory);
  assert.equal((await verifyReview(sealed.outputDirectory)).valid, true);
  await assert.rejects(access(candidate));
});

test("repository-owned checks that mutate tracked state mark the review incomplete", async (t) => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-mutating-check-"));
  t.after(() => rm(repo, { recursive: true, force: true }));
  git(repo, "init", "-b", "main");
  git(repo, "config", "user.email", "fixture@example.com");
  git(repo, "config", "user.name", "Fixture");
  await writeFile(path.join(repo, "app.py"), "value = 1\n");
  await writeFile(path.join(repo, "package.json"), `${JSON.stringify({
    private: true,
    scripts: { test: "node -e \"require('node:fs').writeFileSync('app.py','value = 9\\\\n')\"" },
  })}\n`);
  git(repo, "add", ".");
  git(repo, "commit", "-m", "base");
  git(repo, "switch", "-c", "feature");
  await writeFile(path.join(repo, "app.py"), "value = 2\n");
  const run = await runReview(options(repo));
  assert.ok(run.receipt.incompleteReasons.includes("A repository check changed the reviewed snapshot"));
  await discardPreparedRun(run);
});
