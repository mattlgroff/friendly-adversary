import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { constants, realpathSync } from "node:fs";
import { link, lstat, mkdir, open, readFile, readdir, realpath, rm, unlink } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { LENS_HOST, LENS_MODEL, LENS_REASONING_EFFORT, LENS_SERVICE_TIER, PRODUCT_VERSION } from "./constants.js";
import { FriendlyAdversaryError } from "./errors.js";
import { sha256 } from "./fs-utils.js";

export const RUN_PLAN_FILE = "run-plan.json";
export const AUTHORITY_SCHEMA_VERSION = "1";
export const CAPABILITY_FORMAT_VERSION = "1";
export const TRANSACTION_FORMAT_VERSION = "1";
export const ARTIFACT_SCHEMA_VERSION = "3";
export const DOMAIN_CONTRACT = "friendly-adversary:local-mcp-control-plane:v1";
export const DOMAIN_CONTRACT_HASH = sha256(DOMAIN_CONTRACT);
export const DEFAULT_CAPABILITY_LIFETIME_MS = 24 * 60 * 60 * 1000;

const AUTHORITY_ID_PATTERN = /^[a-f0-9]{32}$/u;
const CAPABILITY_PATTERN = /^[A-Za-z0-9_-]{43}$/u;

export type ReviewHost = "claude-code" | "codex" | "unavailable";
export type CapabilityScope = { operation: "lens"; lensId: string } | { operation: "outcome" };

export interface RunPlan {
  schemaVersion: "1";
  productVersion: string;
  artifactSchemaVersion: typeof ARTIFACT_SCHEMA_VERSION;
  capabilityFormatVersion: typeof CAPABILITY_FORMAT_VERSION;
  transactionFormatVersion: typeof TRANSACTION_FORMAT_VERSION;
  domainContractHash: string;
  authorityId: string;
  runId: string;
  createdAt: string;
  expiresAt: string;
  repositoryRoot: string;
  outputDirectory: string;
  expectedLenses: string[];
  host: ReviewHost;
  plannedModel: "unavailable";
  plannedEffort: "unavailable";
  lensHost: typeof LENS_HOST;
  lensModel: typeof LENS_MODEL;
  lensEffort: typeof LENS_REASONING_EFFORT;
  lensServiceTier: typeof LENS_SERVICE_TIER;
}

interface AuthorityRecord {
  schemaVersion: "1";
  authorityId: string;
  runId: string;
  canonicalRunPath: string;
  planSha256: string;
  expiresAt: string;
  artifactSchemaVersion: string;
  capabilityFormatVersion: string;
  transactionFormatVersion: string;
  domainContractHash: string;
  capabilities: Record<string, string>;
}

export interface ReviewAuthorityPacket {
  run_directory: string;
  authority_id: string;
  expires_at: string;
  lens_capabilities: Record<string, string>;
  outcome_capability: string;
}

export interface ValidatedAuthority {
  plan: RunPlan;
  planSha256: string;
  runDirectory: string;
  scope: CapabilityScope;
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalize(record[key])}`).join(",")}}`;
}

export function canonicalJson(value: unknown): string {
  return `${canonicalize(value)}\n`;
}

export function planProductVersionIsCompatible(value: unknown): value is string {
  return value === PRODUCT_VERSION;
}

function lengthDelimitedHash(domain: string, fields: string[]): string {
  const hash = createHash("sha256");
  for (const field of [domain, ...fields]) {
    const bytes = Buffer.from(field, "utf8");
    const length = Buffer.allocUnsafe(4);
    length.writeUInt32BE(bytes.byteLength);
    hash.update(length);
    hash.update(bytes);
  }
  return hash.digest("hex");
}

function scopeKey(scope: CapabilityScope): string {
  return scope.operation === "lens" ? `lens:${scope.lensId}` : "outcome";
}

function capabilityDigest(token: string, record: Omit<AuthorityRecord, "capabilities">, scope: CapabilityScope): string {
  return lengthDelimitedHash("friendly-adversary:capability:v1", [
    token,
    record.authorityId,
    record.canonicalRunPath,
    record.runId,
    record.planSha256,
    scope.operation,
    scope.operation === "lens" ? scope.lensId : "",
    record.expiresAt,
    record.artifactSchemaVersion,
    record.capabilityFormatVersion,
    record.transactionFormatVersion,
    record.domainContractHash,
  ]);
}

function safeEqualHex(left: string, right: string): boolean {
  if (!/^[a-f0-9]{64}$/u.test(left) || !/^[a-f0-9]{64}$/u.test(right)) return false;
  return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}

export function authorityRoot(): string {
  const override = process.env.FRIENDLY_ADVERSARY_STATE_DIR?.trim();
  if (override) {
    const resolved = path.resolve(override);
    const canonicalParent = realpathSync.native(path.dirname(resolved));
    return path.join(canonicalParent, path.basename(resolved), "authorities");
  }
  const userIdentity = process.getuid?.().toString() ?? os.userInfo().username;
  const userScope = createHash("sha256").update(`${userIdentity}\0${os.homedir()}`, "utf8").digest("hex").slice(0, 16);
  return path.join(realpathSync.native(os.tmpdir()), `friendly-adversary-${userScope}`, "authorities");
}

async function ensurePrivateDirectory(parent: string, directory: string): Promise<void> {
  const [parentBefore, canonicalParent] = await Promise.all([
    lstat(parent, { bigint: true }),
    realpath(parent),
  ]);
  if (!parentBefore.isDirectory() || parentBefore.isSymbolicLink() || canonicalParent !== parent) {
    throw new FriendlyAdversaryError("FA_AUTHORITY_ROOT_UNSAFE: authority state parent is redirected", 3);
  }
  try {
    await mkdir(directory, { mode: 0o700 });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }
  const [metadata, canonical, parentAfter] = await Promise.all([
    lstat(directory, { bigint: true }),
    realpath(directory),
    lstat(parent, { bigint: true }),
  ]);
  const currentUid = process.getuid?.();
  const unsafePosixPermissions = process.platform !== "win32" && (
    (currentUid !== undefined && metadata.uid !== BigInt(currentUid))
    || (metadata.mode & 0o700n) !== 0o700n
    || (metadata.mode & 0o077n) !== 0n
  );
  if (
    !metadata.isDirectory() || metadata.isSymbolicLink() || canonical !== directory
    || !parentAfter.isDirectory() || parentAfter.isSymbolicLink()
    || parentAfter.dev !== parentBefore.dev || parentAfter.ino !== parentBefore.ino
    || unsafePosixPermissions
  ) {
    throw new FriendlyAdversaryError("FA_AUTHORITY_ROOT_UNSAFE: authority state directory is redirected, shared, or owned by another user", 3);
  }
}

export async function ensureAuthorityRoot(): Promise<string> {
  const root = authorityRoot();
  const stateRoot = path.dirname(root);
  await ensurePrivateDirectory(path.dirname(stateRoot), stateRoot);
  await ensurePrivateDirectory(stateRoot, root);
  return root;
}

async function authorityRootIdentity(root: string): Promise<{ device: string; inode: string }> {
  const [metadata, canonical] = await Promise.all([lstat(root, { bigint: true }), realpath(root)]);
  if (!metadata.isDirectory() || metadata.isSymbolicLink() || canonical !== root) {
    throw new FriendlyAdversaryError("FA_AUTHORITY_ROOT_UNSAFE: authority state directory changed identity", 3);
  }
  return { device: metadata.dev.toString(), inode: metadata.ino.toString() };
}

async function assertAuthorityRootIdentity(root: string, expected: { device: string; inode: string }): Promise<void> {
  const current = await authorityRootIdentity(root);
  if (current.device !== expected.device || current.inode !== expected.inode) {
    throw new FriendlyAdversaryError("FA_AUTHORITY_ROOT_UNSAFE: authority state directory changed during control-file access", 3);
  }
}

export async function cleanupExpiredAuthorities(now = new Date()): Promise<number> {
  const root = await ensureAuthorityRoot();
  const entries = await readdir(root, { withFileTypes: true }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  let removed = 0;
  for (const entry of entries) {
    if (!entry.isFile() || !/^[a-f0-9]{32}(?:\.workflow)?\.json$/u.test(entry.name)) continue;
    const filePath = path.join(root, entry.name);
    const before = await lstat(filePath).catch(() => undefined);
    if (!before?.isFile() || before.isSymbolicLink() || before.nlink !== 1) continue;
    let record: { expiresAt?: unknown } | null = null;
    try {
      record = JSON.parse(await readFile(filePath, "utf8")) as { expiresAt?: unknown };
    } catch {
      continue;
    }
    const expiry = typeof record?.expiresAt === "string" ? Date.parse(record.expiresAt) : Number.NaN;
    if (!Number.isFinite(expiry) || expiry > now.getTime()) continue;
    const after = await lstat(filePath).catch(() => undefined);
    if (!after || after.dev !== before.dev || after.ino !== before.ino) continue;
    await unlink(filePath).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
    removed += 1;
  }
  return removed;
}

function authorityPath(authorityId: string): string {
  if (!AUTHORITY_ID_PATTERN.test(authorityId)) {
    throw new FriendlyAdversaryError("FA_AUTHORITY_INVALID: authority_id must be 32 lowercase hexadecimal characters", 2);
  }
  return path.join(authorityRoot(), `${authorityId}.json`);
}

async function readStableSingleRegularFile(filePath: string, missingCode: string, unsafeCode: string): Promise<string> {
  const authorityDirectory = path.dirname(filePath) === authorityRoot() ? await ensureAuthorityRoot() : undefined;
  const authorityIdentity = authorityDirectory ? await authorityRootIdentity(authorityDirectory) : undefined;
  const before = await lstat(filePath).catch(() => {
    throw new FriendlyAdversaryError(`${missingCode}: required control file is missing`, 2);
  });
  if (before.isSymbolicLink() || !before.isFile() || before.nlink !== 1) {
    throw new FriendlyAdversaryError(`${unsafeCode}: control file is not a single regular file`, 2);
  }
  const handle = await open(filePath, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0)).catch(() => {
    throw new FriendlyAdversaryError(`${unsafeCode}: control file could not be opened safely`, 2);
  });
  try {
    const opened = await handle.stat();
    if (!opened.isFile() || opened.nlink !== 1 || opened.dev !== before.dev || opened.ino !== before.ino) {
      throw new FriendlyAdversaryError(`${unsafeCode}: control file changed while opening`, 2);
    }
    const content = await handle.readFile("utf8");
    const [after, current] = await Promise.all([handle.stat(), lstat(filePath)]);
    if (
      after.dev !== opened.dev || after.ino !== opened.ino || after.size !== opened.size || after.mtimeMs !== opened.mtimeMs
      || current.dev !== after.dev || current.ino !== after.ino || current.size !== after.size || current.mtimeMs !== after.mtimeMs
    ) throw new FriendlyAdversaryError(`${unsafeCode}: control file changed while reading`, 2);
    if (authorityDirectory && authorityIdentity) await assertAuthorityRootIdentity(authorityDirectory, authorityIdentity);
    return content;
  } finally {
    await handle.close();
  }
}

export async function readAuthorityControlFile(
  filePath: string,
  missingCode = "FA_AUTHORITY_NOT_FOUND",
  unsafeCode = "FA_AUTHORITY_UNSAFE",
): Promise<string> {
  const root = await ensureAuthorityRoot();
  if (path.dirname(filePath) !== root || !/^[a-f0-9]{32}(?:\.workflow)?\.json$/u.test(path.basename(filePath))) {
    throw new FriendlyAdversaryError(`${unsafeCode}: authority control path escaped its private state directory`, 3);
  }
  return readStableSingleRegularFile(filePath, missingCode, unsafeCode);
}

async function publishExclusive(filePath: string, content: string, beforePublish?: () => Promise<void>): Promise<void> {
  const authorityDirectory = path.dirname(filePath) === authorityRoot() ? await ensureAuthorityRoot() : undefined;
  const authorityIdentity = authorityDirectory ? await authorityRootIdentity(authorityDirectory) : undefined;
  if (!authorityDirectory) await mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
  const candidatePath = `${filePath}.candidate-${randomBytes(16).toString("hex")}`;
  const flags = constants.O_CREAT | constants.O_EXCL | constants.O_WRONLY | (constants.O_NOFOLLOW ?? 0);
  const handle = await open(candidatePath, flags, 0o600);
  let complete = false;
  let publishedIdentity: { device: bigint; inode: bigint } | undefined;
  try {
    await handle.writeFile(content);
    await handle.sync();
    if (authorityDirectory && authorityIdentity) await assertAuthorityRootIdentity(authorityDirectory, authorityIdentity);
    await beforePublish?.();
    await link(candidatePath, filePath).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "EEXIST") throw new FriendlyAdversaryError("FA_AUTHORITY_EXISTS: authority identifier collision", 3);
      throw error;
    });
    const [opened, published] = await Promise.all([
      handle.stat({ bigint: true }),
      lstat(filePath, { bigint: true }),
    ]);
    publishedIdentity = { device: opened.dev, inode: opened.ino };
    if (
      !opened.isFile() || opened.nlink !== 2n
      || published.isSymbolicLink() || !published.isFile() || published.nlink !== 2n
      || opened.dev !== published.dev || opened.ino !== published.ino
      || published.size !== BigInt(Buffer.byteLength(content))
    ) {
      throw new FriendlyAdversaryError("FA_AUTHORITY_UNSAFE: authority control file changed during publication", 3);
    }
    if (authorityDirectory && authorityIdentity) await assertAuthorityRootIdentity(authorityDirectory, authorityIdentity);
    complete = true;
  } finally {
    await handle.close();
    await unlink(candidatePath).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== "ENOENT") throw error;
    });
    if (!complete && publishedIdentity) {
      const current = await lstat(filePath, { bigint: true }).catch(() => undefined);
      if (current?.dev === publishedIdentity.device && current.ino === publishedIdentity.inode) {
        await unlink(filePath).catch((error: NodeJS.ErrnoException) => {
          if (error.code !== "ENOENT") throw error;
        });
      }
    }
  }
}

export async function publishAuthorityControlFile(
  filePath: string,
  content: string,
  options: { beforePublish?: () => Promise<void> } = {},
): Promise<void> {
  const root = await ensureAuthorityRoot();
  if (path.dirname(filePath) !== root || !/^[a-f0-9]{32}(?:\.workflow)?\.json$/u.test(path.basename(filePath))) {
    throw new FriendlyAdversaryError("FA_AUTHORITY_ROOT_UNSAFE: authority publication escaped its private state directory", 3);
  }
  await publishExclusive(filePath, content, options.beforePublish);
}

export async function createReviewAuthority(input: {
  runDirectory: string;
  repositoryRoot: string;
  expectedLenses: string[];
  host?: ReviewHost;
  now?: Date;
  lifetimeMs?: number;
}): Promise<{ plan: RunPlan; packet: ReviewAuthorityPacket }> {
  const runDirectory = await realpath(input.runDirectory);
  const repositoryRoot = await realpath(input.repositoryRoot);
  const now = input.now ?? new Date();
  await cleanupExpiredAuthorities(now);
  const expiresAt = new Date(now.getTime() + (input.lifetimeMs ?? DEFAULT_CAPABILITY_LIFETIME_MS)).toISOString();
  const authorityId = randomBytes(16).toString("hex");
  const plan: RunPlan = {
    schemaVersion: "1",
    productVersion: PRODUCT_VERSION,
    artifactSchemaVersion: ARTIFACT_SCHEMA_VERSION,
    capabilityFormatVersion: CAPABILITY_FORMAT_VERSION,
    transactionFormatVersion: TRANSACTION_FORMAT_VERSION,
    domainContractHash: DOMAIN_CONTRACT_HASH,
    authorityId,
    runId: path.basename(runDirectory),
    createdAt: now.toISOString(),
    expiresAt,
    repositoryRoot,
    outputDirectory: runDirectory,
    expectedLenses: [...input.expectedLenses].sort(),
    host: input.host ?? "unavailable",
    plannedModel: "unavailable",
    plannedEffort: "unavailable",
    lensHost: LENS_HOST,
    lensModel: LENS_MODEL,
    lensEffort: LENS_REASONING_EFFORT,
    lensServiceTier: LENS_SERVICE_TIER,
  };
  const planContent = canonicalJson(plan);
  await publishExclusive(path.join(runDirectory, RUN_PLAN_FILE), planContent);
  const authorityBase: Omit<AuthorityRecord, "capabilities"> = {
    schemaVersion: AUTHORITY_SCHEMA_VERSION,
    authorityId,
    runId: plan.runId,
    canonicalRunPath: runDirectory,
    planSha256: sha256(planContent),
    expiresAt,
    artifactSchemaVersion: ARTIFACT_SCHEMA_VERSION,
    capabilityFormatVersion: CAPABILITY_FORMAT_VERSION,
    transactionFormatVersion: TRANSACTION_FORMAT_VERSION,
    domainContractHash: DOMAIN_CONTRACT_HASH,
  };
  const lensCapabilities: Record<string, string> = {};
  const digests: Record<string, string> = {};
  for (const lensId of plan.expectedLenses) {
    const token = randomBytes(32).toString("base64url");
    lensCapabilities[lensId] = token;
    const scope: CapabilityScope = { operation: "lens", lensId };
    digests[scopeKey(scope)] = capabilityDigest(token, authorityBase, scope);
  }
  const outcomeCapability = randomBytes(32).toString("base64url");
  digests.outcome = capabilityDigest(outcomeCapability, authorityBase, { operation: "outcome" });
  const authority: AuthorityRecord = { ...authorityBase, capabilities: digests };
  try {
    await publishAuthorityControlFile(authorityPath(authorityId), canonicalJson(authority));
  } catch (error) {
    await rm(path.join(runDirectory, RUN_PLAN_FILE), { force: true });
    throw error;
  }
  return {
    plan,
    packet: {
      run_directory: runDirectory,
      authority_id: authorityId,
      expires_at: expiresAt,
      lens_capabilities: lensCapabilities,
      outcome_capability: outcomeCapability,
    },
  };
}

function validatePlan(value: unknown): RunPlan {
  const plan = value as Partial<RunPlan>;
  const lenses = Array.isArray(plan?.expectedLenses) ? plan.expectedLenses : [];
  if (
    !plan || plan.schemaVersion !== "1" || !planProductVersionIsCompatible(plan.productVersion)
    || plan.artifactSchemaVersion !== ARTIFACT_SCHEMA_VERSION
    || plan.capabilityFormatVersion !== CAPABILITY_FORMAT_VERSION
    || plan.transactionFormatVersion !== TRANSACTION_FORMAT_VERSION
    || plan.domainContractHash !== DOMAIN_CONTRACT_HASH
    || typeof plan.authorityId !== "string" || !AUTHORITY_ID_PATTERN.test(plan.authorityId) || typeof plan.runId !== "string" || !plan.runId
    || typeof plan.repositoryRoot !== "string" || typeof plan.outputDirectory !== "string"
    || typeof plan.createdAt !== "string" || !Number.isFinite(Date.parse(plan.createdAt))
    || typeof plan.expiresAt !== "string" || !Number.isFinite(Date.parse(plan.expiresAt))
    || !lenses.length || lenses.some((lens) => typeof lens !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(lens))
    || JSON.stringify(lenses) !== JSON.stringify([...new Set(lenses)].sort())
    || !["claude-code", "codex", "unavailable"].includes(String(plan.host))
    || plan.plannedModel !== "unavailable" || plan.plannedEffort !== "unavailable"
    || plan.lensHost !== LENS_HOST || plan.lensModel !== LENS_MODEL
    || plan.lensEffort !== LENS_REASONING_EFFORT || plan.lensServiceTier !== LENS_SERVICE_TIER
  ) {
    throw new FriendlyAdversaryError("FA_PLAN_INCOMPATIBLE: run plan is missing, malformed, or belongs to another runtime contract", 2);
  }
  return plan as RunPlan;
}

function validateAuthorityRecord(value: unknown, authorityId: string): AuthorityRecord {
  const record = value as Partial<AuthorityRecord>;
  if (
    !record || record.schemaVersion !== AUTHORITY_SCHEMA_VERSION || record.authorityId !== authorityId
    || typeof record.runId !== "string" || typeof record.canonicalRunPath !== "string"
    || typeof record.planSha256 !== "string" || !/^[a-f0-9]{64}$/u.test(record.planSha256)
    || typeof record.expiresAt !== "string" || !Number.isFinite(Date.parse(record.expiresAt))
    || record.artifactSchemaVersion !== ARTIFACT_SCHEMA_VERSION
    || record.capabilityFormatVersion !== CAPABILITY_FORMAT_VERSION
    || record.transactionFormatVersion !== TRANSACTION_FORMAT_VERSION
    || record.domainContractHash !== DOMAIN_CONTRACT_HASH
    || !record.capabilities || typeof record.capabilities !== "object"
    || Object.entries(record.capabilities).some(([key, digest]) => !/^(?:outcome|lens:[a-z0-9]+(?:-[a-z0-9]+)*)$/u.test(key) || !/^[a-f0-9]{64}$/u.test(digest))
  ) {
    throw new FriendlyAdversaryError("FA_AUTHORITY_INCOMPATIBLE: authority record is malformed or belongs to another runtime contract", 2);
  }
  return record as AuthorityRecord;
}

export async function validateReviewAuthority(input: {
  authorityId: string;
  capability: string;
  scope: CapabilityScope;
  now?: Date;
}): Promise<ValidatedAuthority> {
  if (!CAPABILITY_PATTERN.test(input.capability)) {
    throw new FriendlyAdversaryError("FA_CAPABILITY_INVALID: write_capability has an invalid format", 2);
  }
  const filePath = authorityPath(input.authorityId);
  const authorityContent = await readStableSingleRegularFile(filePath, "FA_AUTHORITY_NOT_FOUND", "FA_AUTHORITY_UNSAFE");
  const authority = validateAuthorityRecord(JSON.parse(authorityContent), input.authorityId);
  if ((input.now ?? new Date()).getTime() >= Date.parse(authority.expiresAt)) {
    throw new FriendlyAdversaryError("FA_CAPABILITY_EXPIRED: review authority has expired; start a new review", 2);
  }
  const expected = authority.capabilities[scopeKey(input.scope)];
  const { capabilities: _capabilities, ...authorityBase } = authority;
  const actual = capabilityDigest(input.capability, authorityBase, input.scope);
  if (typeof expected !== "string" || !safeEqualHex(actual, expected)) {
    throw new FriendlyAdversaryError("FA_CAPABILITY_DENIED: capability does not authorize this operation", 2);
  }
  const runDirectory = await realpath(authority.canonicalRunPath).catch(() => {
    throw new FriendlyAdversaryError("FA_RUN_NOT_FOUND: authorized run directory is missing", 2);
  });
  if (runDirectory !== authority.canonicalRunPath || path.basename(runDirectory) !== authority.runId) {
    throw new FriendlyAdversaryError("FA_AUTHORITY_MISMATCH: authority path no longer identifies its original run", 2);
  }
  const planContent = await readStableSingleRegularFile(path.join(runDirectory, RUN_PLAN_FILE), "FA_PLAN_NOT_FOUND", "FA_PLAN_UNSAFE");
  const plan = validatePlan(JSON.parse(planContent));
  if (
    !safeEqualHex(sha256(planContent), authority.planSha256)
    || plan.authorityId !== authority.authorityId || plan.runId !== authority.runId
    || plan.outputDirectory !== authority.canonicalRunPath || plan.expiresAt !== authority.expiresAt
    || JSON.stringify(Object.keys(authority.capabilities).sort()) !== JSON.stringify(["outcome", ...plan.expectedLenses.map((lens) => `lens:${lens}`)].sort())
  ) {
    throw new FriendlyAdversaryError("FA_PLAN_TAMPERED: run plan does not match external authority", 2);
  }
  return { plan, planSha256: authority.planSha256, runDirectory, scope: input.scope };
}

export async function liveReviewAuthorityId(runDirectoryInput: string, now = new Date()): Promise<string | undefined> {
  const runDirectory = await realpath(runDirectoryInput).catch(() => undefined);
  if (!runDirectory) return undefined;
  const planPath = path.join(runDirectory, RUN_PLAN_FILE);
  const planContent = await readStableSingleRegularFile(planPath, "FA_PLAN_NOT_FOUND", "FA_PLAN_UNSAFE");
  const plan = validatePlan(JSON.parse(planContent));
  if (plan.outputDirectory !== runDirectory || plan.runId !== path.basename(runDirectory)) {
    throw new FriendlyAdversaryError("FA_PLAN_TAMPERED: run plan does not identify its canonical run directory", 2);
  }
  if (now.getTime() >= Date.parse(plan.expiresAt)) return undefined;
  let authorityContent: string;
  try {
    authorityContent = await readStableSingleRegularFile(
      authorityPath(plan.authorityId),
      "FA_AUTHORITY_NOT_FOUND",
      "FA_AUTHORITY_UNSAFE",
    );
  } catch (error) {
    if (error instanceof FriendlyAdversaryError && error.message.startsWith("FA_AUTHORITY_NOT_FOUND:")) return undefined;
    throw error;
  }
  const authority = validateAuthorityRecord(JSON.parse(authorityContent), plan.authorityId);
  if (now.getTime() >= Date.parse(authority.expiresAt)) return undefined;
  if (
    !safeEqualHex(sha256(planContent), authority.planSha256)
    || authority.runId !== plan.runId || authority.canonicalRunPath !== runDirectory
    || authority.expiresAt !== plan.expiresAt
    || JSON.stringify(Object.keys(authority.capabilities).sort()) !== JSON.stringify(["outcome", ...plan.expectedLenses.map((lens) => `lens:${lens}`)].sort())
  ) {
    throw new FriendlyAdversaryError("FA_PLAN_TAMPERED: live authority does not match its run plan", 2);
  }
  return authority.authorityId;
}

export async function hasLiveReviewAuthority(runDirectoryInput: string, now = new Date()): Promise<boolean> {
  return await liveReviewAuthorityId(runDirectoryInput, now) !== undefined;
}

export async function revokeReviewAuthorityById(authorityId: string): Promise<void> {
  await ensureAuthorityRoot();
  await rm(authorityPath(authorityId), { force: true });
}
