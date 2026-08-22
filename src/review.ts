import { randomBytes } from "node:crypto";
import { constants as fsConstants, lstatSync } from "node:fs";
import { chmod, copyFile, link, lstat, mkdir, mkdtemp, open, readFile, readdir, realpath, rm, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createReviewAuthority,
  ensureAuthorityRoot,
  liveReviewAuthorityId,
  revokeReviewAuthorityById,
  RUN_PLAN_FILE,
  type ReviewAuthorityPacket,
} from "./authority.js";
import { DEFAULT_TIMEOUT_MS, OUTPUT_DIRECTORY, PRODUCT_VERSION, PYTHON_EXTENSIONS, RECEIPT_FILE, RUNS_DIRECTORY, TYPESCRIPT_EXTENSIONS } from "./constants.js";
import { FriendlyAdversaryError } from "./errors.js";
import { ensureSafeOutputRoot, pathExists, readJson, renameWithWindowsRetry, sha256, writeFileAtomic, writeJsonAtomic } from "./fs-utils.js";
import { inspectGit, writeGitArtifacts } from "./git.js";
import { DOCUMENT_COMPLETE, INCOMPLETE_STATUS, LENS_COMPLETE, validateCommittedOutcome, validatePersistedLensReportContract } from "./lens-report.js";
import { localCodexRuntime, runCodexLenses, type CodexLensRuntime, type LensExecutionReceipt } from "./lens-runner.js";
import { writeHtmlCompanion } from "./report-html.js";
import { detectRecognizableSecret } from "./secret-patterns.js";
import { collectTools } from "./tools.js";
import type { ModelMetadata, PrepareOptions, ReviewReceipt } from "./types.js";
import { reviewReceiptMarkdown } from "./review-receipt.js";

function runtimeAssets(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
}

function languages(files: string[]): Array<"typescript" | "python"> {
  const found: Array<"typescript" | "python"> = [];
  if (files.some((file) => TYPESCRIPT_EXTENSIONS.has(path.extname(file).toLowerCase()))) found.push("typescript");
  if (files.some((file) => PYTHON_EXTENSIONS.has(path.extname(file).toLowerCase()))) found.push("python");
  return found;
}

function runPrefix(headSha: string): string {
  return `${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}-${headSha.slice(0, 10)}-`;
}

async function privateRunsRoot(): Promise<string> {
  const authorityState = await ensureAuthorityRoot();
  const root = path.join(authorityState, "pr-review-runs");
  await mkdir(root, { mode: 0o700 }).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== "EEXIST") throw error;
  });
  const metadata = await lstat(root);
  if (metadata.isSymbolicLink() || !metadata.isDirectory()) throw new FriendlyAdversaryError("Private PR review state is redirected or not a directory", 3);
  await chmod(root, 0o700);
  const canonical = await realpath(root);
  if (path.dirname(canonical) !== authorityState) throw new FriendlyAdversaryError("Private PR review state escaped its authority root", 3);
  return canonical;
}

async function materializeLensDefinitions(ids: string[], runDirectory: string): Promise<Array<{ id: string; version: string; sha256: string }>> {
  const target = path.join(runDirectory, "lens-definitions");
  await mkdir(target, { mode: 0o700 });
  const records: Array<{ id: string; version: string; sha256: string }> = [];
  for (const id of ids) {
    const candidates = [path.join(runtimeAssets(), "lenses", id, "LENS.md"), path.join(runtimeAssets(), "references", "lenses", `${id}.md`)];
    const source = candidates.find((candidate) => requireExists(candidate));
    if (!source) throw new FriendlyAdversaryError(`Installed lens definition is missing: ${id}`, 2);
    const content = await readFile(source);
    await writeFileAtomic(path.join(target, `${id}.md`), content);
    records.push({ id, version: /^version:\s*([^\s]+)\s*$/mu.exec(content.toString("utf8"))?.[1] ?? "unknown", sha256: sha256(content) });
  }
  const findingContractCandidates = [
    path.join(runtimeAssets(), "references", "finding-contract.md"),
    path.join(runtimeAssets(), "..", "references", "finding-contract.md"),
  ];
  const findingContract = findingContractCandidates.find((candidate) => requireExists(candidate));
  if (!findingContract) throw new FriendlyAdversaryError("Installed finding contract is missing", 2);
  await writeFileAtomic(path.join(runDirectory, "finding-contract.md"), await readFile(findingContract));
  return records;
}

function requireExists(candidate: string): boolean {
  try {
    return lstatSync(candidate).isFile();
  } catch {
    return false;
  }
}

async function validateRun(runDirectory: string): Promise<{ runReal: string; receipt: ReviewReceipt }> {
  const runReal = await realpath(runDirectory).catch(() => {
    throw new FriendlyAdversaryError(`Run directory does not exist: ${runDirectory}`, 2);
  });
  const receipt = await readJson<ReviewReceipt>(path.join(runReal, RECEIPT_FILE)).catch(() => {
    throw new FriendlyAdversaryError(`Invalid or missing ${RECEIPT_FILE}`, 2);
  });
  if (receipt.schemaVersion !== "1" || receipt.productVersion !== PRODUCT_VERSION || receipt.runId !== path.basename(runReal)) {
    throw new FriendlyAdversaryError(`The run receipt does not match Friendly Adversary ${PRODUCT_VERSION}`, 2);
  }
  if (receipt.status === "sealed" || receipt.status === "sealed-incomplete") {
    return { runReal, receipt };
  }
  const repoReal = await realpath(receipt.repositoryRoot);
  if (repoReal !== receipt.repositoryRoot) throw new FriendlyAdversaryError("The repository path is no longer canonical", 2);
  if (receipt.outputDirectory !== runReal || !receipt.publicationDirectory) {
    throw new FriendlyAdversaryError("The private run receipt does not identify its collection and publication paths", 2);
  }
  return { runReal, receipt };
}

function derivedIncompleteReasons(receipt: ReviewReceipt): string[] {
  return receipt.toolRuns
    .filter((run) => run.status === "execution-error" || run.status === "timed-out" || (run.status === "skipped" && run.required))
    .map((run) => `${run.name}: ${run.reason ?? run.status}`);
}

interface RunReviewHooks {
  removeFailedPath?: (target: string) => Promise<void>;
}

export async function runReview(
  options: PrepareOptions,
  hooks: RunReviewHooks = {},
): Promise<{ receipt: ReviewReceipt; runDirectory: string; authority: ReviewAuthorityPacket }> {
  const expectedLenses = [...new Set(options.expectedLenses)].sort();
  if (!expectedLenses.length) throw new FriendlyAdversaryError("At least one lens is required", 2);
  const git = await inspectGit(options.repo, options.base);
  if (!git.changedFiles.length) throw new FriendlyAdversaryError("No changes were found against the selected base.", 2);
  const requestedOutput = path.resolve(git.repositoryRoot, options.outputRoot ?? OUTPUT_DIRECTORY);
  const relativeOutput = path.relative(git.repositoryRoot, requestedOutput);
  if (path.isAbsolute(relativeOutput) || relativeOutput.startsWith("..") || (relativeOutput !== OUTPUT_DIRECTORY && !relativeOutput.startsWith(`${OUTPUT_DIRECTORY}${path.sep}`))) {
    throw new FriendlyAdversaryError("Output must be inside .friendly-adversary/", 2);
  }
  const runDirectory = await mkdtemp(path.join(await privateRunsRoot(), runPrefix(git.headSha)));
  await chmod(runDirectory, 0o700);
  const scratchDirectory = `${runDirectory}.scratch`;
  await mkdir(scratchDirectory, { mode: 0o700 });
  const now = new Date().toISOString();
  const publicationDirectory = path.join(requestedOutput, RUNS_DIRECTORY, path.basename(runDirectory));
  const receipt: ReviewReceipt = {
    schemaVersion: "1",
    productVersion: PRODUCT_VERSION,
    runId: path.basename(runDirectory),
    createdAt: now,
    updatedAt: now,
    status: "prepared",
    repositoryRoot: git.repositoryRoot,
    outputDirectory: runDirectory,
    publicationDirectory,
    git: { baseRef: git.baseRef, baseSha: git.baseSha, headSha: git.headSha, mergeBaseSha: git.mergeBaseSha, diffHash: git.diffHash, dirty: git.dirty },
    options: { timeoutMs: options.timeoutMs || DEFAULT_TIMEOUT_MS },
    changedFiles: git.changedFiles,
    changedFileCount: git.changedFiles.length,
    selectedLanguages: languages(git.changedFiles),
    expectedLenses,
    lensDefinitions: [],
    toolRuns: [],
    incompleteReasons: [],
  };
  try {
    receipt.lensDefinitions = await materializeLensDefinitions(expectedLenses, runDirectory);
    await writeGitArtifacts(git, runDirectory);
    await writeFileAtomic(path.join(runDirectory, "changed-files.txt"), `${git.changedFiles.join("\n")}\n`);
    await writeJsonAtomic(path.join(runDirectory, "changed-files.json"), git.changedFiles);
    await writeJsonAtomic(path.join(runDirectory, "changed-lines.json"), git.changedLines);
    await mkdir(path.join(runDirectory, "lenses"), { mode: 0o700 });
    let repositoryChangedDuringChecks = false;
    receipt.toolRuns = await collectTools({
      repo: git.repositoryRoot,
      runDirectory,
      scratchDirectory,
      changedFiles: git.changedFiles,
      mergeBaseSha: git.mergeBaseSha,
      options: receipt.options,
      assetsRoot: runtimeAssets(),
      afterRepositoryTool: async () => {
        const snapshot = await inspectGit(git.repositoryRoot, git.baseSha);
        if (snapshot.headSha !== git.headSha || snapshot.diffHash !== git.diffHash) repositoryChangedDuringChecks = true;
      },
    });
    const after = await inspectGit(git.repositoryRoot, git.baseSha);
    if (repositoryChangedDuringChecks || after.headSha !== git.headSha || after.diffHash !== git.diffHash) receipt.incompleteReasons.push("A repository check changed the reviewed snapshot");
    receipt.incompleteReasons.push(...derivedIncompleteReasons(receipt));
    receipt.incompleteReasons = [...new Set(receipt.incompleteReasons)];
    receipt.status = receipt.incompleteReasons.length ? "incomplete" : "collected";
    receipt.updatedAt = new Date().toISOString();
    await writeJsonAtomic(path.join(runDirectory, RECEIPT_FILE), receipt);
    await writeFileAtomic(path.join(runDirectory, "receipt.md"), reviewReceiptMarkdown(receipt));
    const authority = await createReviewAuthority({ runDirectory, repositoryRoot: git.repositoryRoot, expectedLenses, ...(options.host ? { host: options.host } : {}) });
    return { receipt, runDirectory, authority: authority.packet };
  } catch (error) {
    const removeFailedPath = hooks.removeFailedPath ?? ((target: string) => rm(target, { recursive: true, force: true }));
    const cleanup = await Promise.allSettled([
      removeFailedPath(runDirectory),
      removeFailedPath(scratchDirectory),
    ]);
    const cleanupErrors = cleanup.flatMap((result) => result.status === "rejected" ? [result.reason] : []);
    if (cleanupErrors.length) {
      throw new AggregateError(
        [error, ...cleanupErrors],
        "Review collection failed and private-state cleanup was incomplete",
      );
    }
    throw error;
  }
}

export async function runReviewWithLenses(
  options: PrepareOptions,
  runtime: CodexLensRuntime = localCodexRuntime,
): Promise<Awaited<ReturnType<typeof runReview>> & { lensReceipts: LensExecutionReceipt[] }> {
  const codexVersion = await runtime.version();
  const run = await runReview(options);
  try {
    run.receipt.status = "reviewing";
    run.receipt.updatedAt = new Date().toISOString();
    await writeJsonAtomic(path.join(run.runDirectory, RECEIPT_FILE), run.receipt);
    await writeFileAtomic(path.join(run.runDirectory, "receipt.md"), reviewReceiptMarkdown(run.receipt));
    const lensReceipts = await runCodexLenses(run.receipt, run.authority, runtime, codexVersion);
    run.receipt.status = run.receipt.incompleteReasons.length ? "incomplete" : "collected";
    run.receipt.updatedAt = new Date().toISOString();
    await writeJsonAtomic(path.join(run.runDirectory, RECEIPT_FILE), run.receipt);
    await writeFileAtomic(path.join(run.runDirectory, "receipt.md"), reviewReceiptMarkdown(run.receipt));
    return { ...run, lensReceipts };
  } catch (error) {
    if (run.receipt.status === "reviewing" || run.receipt.status === "collected") {
      run.receipt.status = "incomplete";
      run.receipt.updatedAt = new Date().toISOString();
      run.receipt.incompleteReasons = [...new Set([...run.receipt.incompleteReasons, "Lens batch did not complete"])];
      await Promise.allSettled([
        writeJsonAtomic(path.join(run.runDirectory, RECEIPT_FILE), run.receipt),
        writeFileAtomic(path.join(run.runDirectory, "receipt.md"), reviewReceiptMarkdown(run.receipt)),
      ]);
    }
    await revokeReviewAuthorityById(run.authority.authority_id);
    throw error;
  }
}

function readModelMetadata(content: string, label: string): ModelMetadata {
  const get = (field: "Model" | "Effort" | "Host"): string => {
    const value = new RegExp(`^- ${field}:\\s*(.+?)\\s*$`, "mu").exec(content)?.[1]?.trim();
    if (!value || value.length > 200) throw new FriendlyAdversaryError(`${label} must record '- ${field}: <value>'`, 2);
    return value;
  };
  return { model: get("Model"), effort: get("Effort"), host: get("Host") };
}

async function requireCompletedDocuments(runReal: string, expectedLenses: string[]): Promise<NonNullable<ReviewReceipt["modelMetadata"]>> {
  const actual = (await readdir(path.join(runReal, "lenses"))).filter((file) => file.endsWith(".md")).sort();
  const expected = expectedLenses.map((lens) => `${lens}.md`).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new FriendlyAdversaryError("Lens reports do not match the expected set", 2);
  const lenses: Array<ModelMetadata & { id: string }> = [];
  for (const file of actual) {
    const content = await readFile(path.join(runReal, "lenses", file), "utf8");
    if (!content.trimEnd().endsWith(LENS_COMPLETE)) throw new FriendlyAdversaryError(`${file} is incomplete`, 2);
    validatePersistedLensReportContract(content, file);
    lenses.push({ id: file.slice(0, -3), ...readModelMetadata(content, file) });
  }
  const adjudication = await readFile(path.join(runReal, "adjudication.md"), "utf8");
  const report = await readFile(path.join(runReal, "report.md"), "utf8");
  if (!adjudication.trimEnd().endsWith(DOCUMENT_COMPLETE) || !report.trimEnd().endsWith(DOCUMENT_COMPLETE)) throw new FriendlyAdversaryError("Final review documents are incomplete", 2);
  for (const [file, content] of [["adjudication.md", adjudication], ["report.md", report]] as const) {
    const secret = detectRecognizableSecret(content);
    if (secret) throw new FriendlyAdversaryError(`${file} contains a recognizable ${secret} value`, 2);
  }
  return { adjudicator: readModelMetadata(adjudication, "adjudication.md"), lenses };
}

async function walk(root: string, current = root): Promise<string[]> {
  const files: string[] = [];
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name);
    const metadata = await lstat(absolute);
    if (metadata.isSymbolicLink()) throw new FriendlyAdversaryError(`Artifact tree contains a symbolic link: ${absolute}`, 2);
    if (metadata.isDirectory()) files.push(...await walk(root, absolute));
    else if (metadata.isFile()) files.push(path.relative(root, absolute).split(path.sep).join("/"));
    else throw new FriendlyAdversaryError(`Artifact tree contains an unsupported entry: ${absolute}`, 2);
  }
  return files.sort();
}

function manifestLine(relative: string, content: Buffer): string {
  return `${sha256(content)}  ${content.byteLength}  ${JSON.stringify(relative)}`;
}

async function copyArtifactTree(source: string, destination: string): Promise<void> {
  await mkdir(destination, { recursive: true, mode: 0o700 });
  for (const relative of await walk(source)) {
    if (relative === RUN_PLAN_FILE) continue;
    const target = path.join(destination, ...relative.split("/"));
    await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    await copyFile(path.join(source, ...relative.split("/")), target, fsConstants.COPYFILE_EXCL);
  }
}

async function terminalClaim(runReal: string): Promise<string | undefined> {
  return readFile(path.join(`${runReal}.scratch`, "terminal-operation"), "utf8").catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return undefined;
    throw error;
  });
}

async function claimTerminalOperation(runReal: string, claimValue: string): Promise<string> {
  const claimPath = path.join(`${runReal}.scratch`, "terminal-operation");
  const candidatePath = path.join(`${runReal}.scratch`, `.terminal-${randomBytes(16).toString("hex")}`);
  const candidate = await open(candidatePath, "wx", 0o600);
  try {
    await candidate.writeFile(claimValue, "utf8");
    await candidate.sync();
    try {
      await link(candidatePath, claimPath);
      return claimValue;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const existing = await readFile(claimPath, "utf8");
      return existing;
    }
  } finally {
    await candidate.close().catch(() => undefined);
    await unlink(candidatePath).catch(() => undefined);
  }
}

interface SealReviewHooks {
  afterAuthorityRevocation?: () => Promise<void>;
  beforeStagingVerification?: (stagingDirectory: string) => Promise<void>;
  afterTerminalClaim?: () => Promise<void>;
  afterFinalRename?: () => Promise<void>;
}

async function recoverPublishedReview(finalDirectory: string, runReal: string): Promise<ReviewReceipt | undefined> {
  const published = await lstat(finalDirectory).catch(() => undefined);
  if (!published?.isDirectory() || published.isSymbolicLink()) return undefined;
  await verifyReview(finalDirectory);
  const recovered = (await validateRun(finalDirectory)).receipt;
  await rm(runReal, { recursive: true, force: true });
  await rm(`${runReal}.scratch`, { recursive: true, force: true });
  return recovered;
}

async function sealReviewAttempt(runReal: string, receipt: ReviewReceipt, hooks: SealReviewHooks): Promise<ReviewReceipt> {
  const publication = receipt.publicationDirectory!;
  const outputRoot = path.dirname(path.dirname(publication));
  const runsRoot = path.join(outputRoot, RUNS_DIRECTORY);
  const finalDirectory = path.join(runsRoot, receipt.runId);
  if (finalDirectory !== publication) throw new FriendlyAdversaryError("The final review publication path is unavailable", 3);

  const ensurePublicationRoot = async (): Promise<void> => {
    const safeOutput = await ensureSafeOutputRoot(receipt.repositoryRoot, outputRoot);
    if (path.join(safeOutput, RUNS_DIRECTORY) !== runsRoot) throw new FriendlyAdversaryError("The final review publication path is unavailable", 3);
    await mkdir(runsRoot, { recursive: true, mode: 0o700 });
  };

  const claimedStaging = (claim: string): string => {
    const prefix = `seal .staging-${receipt.runId}-`;
    if (!claim.startsWith(prefix) || !claim.endsWith("\n")) {
      throw new FriendlyAdversaryError("The review is already being terminalized", 3);
    }
    const name = claim.slice("seal ".length, -1);
    if (path.basename(name) !== name || !name.startsWith(`.staging-${receipt.runId}-`)) {
      throw new FriendlyAdversaryError("The review seal claim is malformed", 3);
    }
    return path.join(runsRoot, name);
  };

  const finishClaimedSeal = async (staging: string): Promise<ReviewReceipt> => {
    try {
      await verifyArtifactTree(staging);
      await hooks.afterTerminalClaim?.();
      await renameWithWindowsRetry(staging, finalDirectory);
      await hooks.afterFinalRename?.();
    } catch (error) {
      const recovered = await recoverPublishedReview(finalDirectory, runReal);
      if (recovered) return recovered;
      throw error;
    }
    await verifyReview(finalDirectory);
    const sealed = (await validateRun(finalDirectory)).receipt;
    await rm(runReal, { recursive: true, force: true });
    await rm(`${runReal}.scratch`, { recursive: true, force: true });
    return sealed;
  };

  const existingClaim = await terminalClaim(runReal);
  if (existingClaim) {
    await ensurePublicationRoot();
    return finishClaimedSeal(claimedStaging(existingClaim));
  }

  const current = await inspectGit(receipt.repositoryRoot, receipt.git.baseSha);
  if (current.headSha !== receipt.git.headSha || current.diffHash !== receipt.git.diffHash) throw new FriendlyAdversaryError("The reviewed Git snapshot changed before publication", 3);
  receipt.modelMetadata = await requireCompletedDocuments(runReal, receipt.expectedLenses);
  await validateCommittedOutcome(runReal);
  if (receipt.incompleteReasons.length) {
    const reportPath = path.join(runReal, "report.md");
    const report = await readFile(reportPath, "utf8");
    if (!report.includes(INCOMPLETE_STATUS)) throw new FriendlyAdversaryError("Incomplete review report must disclose its coverage gaps", 2);
  }
  await writeHtmlCompanion(runReal, "report.md", "report.html", "Friendly Adversary PR review");
  await ensurePublicationRoot();
  const finalEntry = await lstat(finalDirectory).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return undefined;
    throw error;
  });
  if (finalEntry) {
    if (finalEntry.isSymbolicLink() || !finalEntry.isDirectory()) throw new FriendlyAdversaryError("The final review publication path is redirected or not a directory", 3);
    await verifyReview(finalDirectory);
    const finalReceipt = (await validateRun(finalDirectory)).receipt;
    await rm(runReal, { recursive: true, force: true });
    await rm(`${runReal}.scratch`, { recursive: true, force: true });
    return finalReceipt;
  }
  const authorityId = await liveReviewAuthorityId(runReal);
  if (authorityId) await revokeReviewAuthorityById(authorityId);
  await hooks.afterAuthorityRevocation?.();
  const sealedAt = new Date().toISOString();
  const finalReceipt: ReviewReceipt = {
    ...receipt,
    status: receipt.incompleteReasons.length ? "sealed-incomplete" : "sealed",
    sealedAt,
    updatedAt: sealedAt,
    outputDirectory: finalDirectory,
    publicationDirectory: finalDirectory,
  };
  const staging = await mkdtemp(path.join(runsRoot, `.staging-${receipt.runId}-`));
  let terminallyClaimed = false;
  try {
    await copyArtifactTree(runReal, staging);
    let files = (await walk(staging)).filter((file) => file !== "artifacts.sha256");
    finalReceipt.artifactCount = files.length + 1;
    await writeJsonAtomic(path.join(staging, RECEIPT_FILE), finalReceipt);
    await writeFileAtomic(path.join(staging, "receipt.md"), reviewReceiptMarkdown(finalReceipt));
    files = (await walk(staging)).filter((file) => file !== "artifacts.sha256");
    const lines: string[] = [];
    for (const file of files) lines.push(manifestLine(file, await readFile(path.join(staging, ...file.split("/")))));
    await writeFileAtomic(path.join(staging, "artifacts.sha256"), `${lines.join("\n")}\n`);
    await hooks.beforeStagingVerification?.(staging);
    await verifyArtifactTree(staging);
    const finalSnapshot = await inspectGit(receipt.repositoryRoot, receipt.git.baseSha);
    if (finalSnapshot.headSha !== receipt.git.headSha || finalSnapshot.diffHash !== receipt.git.diffHash) throw new FriendlyAdversaryError("The reviewed Git snapshot changed during publication", 3);
    const claim = await claimTerminalOperation(runReal, `seal ${path.basename(staging)}\n`);
    const committedStaging = claimedStaging(claim);
    terminallyClaimed = true;
    if (committedStaging !== staging) await rm(staging, { recursive: true, force: true });
    return await finishClaimedSeal(committedStaging);
  } catch (error) {
    if (!terminallyClaimed) await rm(staging, { recursive: true, force: true });
    const recovered = await recoverPublishedReview(finalDirectory, runReal);
    if (recovered) return recovered;
    throw error;
  }
  throw new FriendlyAdversaryError("Review sealing ended without a publication", 3);
}

export async function sealReview(runDirectory: string, hooks: SealReviewHooks = {}): Promise<ReviewReceipt> {
  const { runReal, receipt } = await validateRun(runDirectory);
  if (receipt.status !== "collected" && receipt.status !== "incomplete") throw new FriendlyAdversaryError(`Cannot seal a run in status ${receipt.status}`, 2);
  try {
    return await sealReviewAttempt(runReal, receipt, hooks);
  } catch (error) {
    const recovered = await recoverPublishedReview(receipt.publicationDirectory!, runReal);
    if (recovered) return recovered;
    throw error;
  }
}

async function readArtifactManifest(runReal: string): Promise<Map<string, { hash: string; size: number }>> {
  const expected = new Map<string, { hash: string; size: number }>();
  for (const line of (await readFile(path.join(runReal, "artifacts.sha256"), "utf8")).trimEnd().split("\n")) {
    const match = /^([a-f0-9]{64})  (\d+)  (".*")$/u.exec(line);
    if (!match) throw new FriendlyAdversaryError("Artifact manifest is malformed", 2);
    expected.set(JSON.parse(match[3]!) as string, { hash: match[1]!, size: Number(match[2]) });
  }
  return expected;
}

async function verifyArtifactTree(runReal: string): Promise<{ valid: true; artifacts: number }> {
  const expected = await readArtifactManifest(runReal);
  const actual = (await walk(runReal)).filter((file) => file !== "artifacts.sha256");
  if (actual.length !== expected.size || actual.some((file) => !expected.has(file))) throw new FriendlyAdversaryError("Artifact set differs from the seal", 3);
  for (const file of actual) {
    const content = await readFile(path.join(runReal, ...file.split("/")));
    const record = expected.get(file)!;
    if (record.size !== content.byteLength || record.hash !== sha256(content)) throw new FriendlyAdversaryError(`Artifact verification failed: ${file}`, 3);
  }
  return { valid: true, artifacts: actual.length + 1 };
}

export async function verifyReview(runDirectory: string): Promise<{ valid: true; artifacts: number }> {
  const { runReal, receipt } = await validateRun(runDirectory);
  if (receipt.status !== "sealed" && receipt.status !== "sealed-incomplete") throw new FriendlyAdversaryError(`Run is not sealed: ${receipt.status}`, 2);
  return verifyArtifactTree(runReal);
}

export async function statRun(runDirectory: string): Promise<{ receipt: ReviewReceipt; artifactBytes: number }> {
  const { runReal, receipt } = await validateRun(runDirectory);
  let artifactBytes = 0;
  for (const file of await walk(runReal)) artifactBytes += (await stat(path.join(runReal, ...file.split("/")))).size;
  return { receipt, artifactBytes };
}
