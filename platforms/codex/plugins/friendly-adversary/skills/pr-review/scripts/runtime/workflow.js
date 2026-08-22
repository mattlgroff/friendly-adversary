import { execFileSync } from "node:child_process";
import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { constants } from "node:fs";
import { copyFile, lstat, open, readFile, readdir, readlink, realpath, rm, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { authorityRoot, cleanupExpiredAuthorities, DEFAULT_CAPABILITY_LIFETIME_MS, ensureAuthorityRoot, publishAuthorityControlFile, readAuthorityControlFile, } from "./authority.js";
import { DEFAULT_TIMEOUT_MS, MAX_CAPTURE_BYTES, OUTPUT_DIRECTORY, PRODUCT_VERSION } from "./constants.js";
import { FriendlyAdversaryError } from "./errors.js";
import { createUniqueRunDirectory, ensureDirectory, ensureSafeOutputRoot, pathExists, sha256, writeFileAtomic } from "./fs-utils.js";
import { monitoredGitPaths, resolveRepositoryRoot } from "./git.js";
import { validateLensReportContract } from "./lens-report.js";
import { renderMarkdownReport } from "./report-html.js";
import { acquireRunLock, releaseRunLock } from "./run-lock.js";
import { detectRecognizableSecret } from "./secret-patterns.js";
const RECEIPT = "receipt.json";
const RECEIPT_ALTERNATE = ".receipt-alternate.json";
const SNAPSHOT = "snapshot.json";
const PLAN = "workflow-plan.json";
const MANIFEST = "artifacts.sha256";
const SNAPSHOT_FILES = "snapshot-files";
const PUBLICATION_PREFIX = ".publication-";
const ARTIFACT_COMPLETE = "<!-- friendly-adversary:artifact-complete";
const MANIFEST_COMPLETE = "# friendly-adversary:manifest-complete";
const SEAL_TRANSACTION_DOMAIN = "friendly-adversary:workflow-seal:v1";
const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const AUTHORITY_ID = /^[a-f0-9]{32}$/u;
const CAPABILITY = /^[A-Za-z0-9_-]{43}$/u;
const MAX_ARTIFACT_BYTES = 2 * 1024 * 1024;
export const MAX_WORKFLOW_SNAPSHOT_FILE_BYTES = 256 * 1024 * 1024;
export const MAX_WORKFLOW_SNAPSHOT_TOTAL_BYTES = 2 * 1024 * 1024 * 1024;
const OUTCOME_REPORT_SHA256 = "friendly-adversary:outcome-report-sha256";
function throwIfWorkflowCancelled(signal) {
    if (signal?.aborted)
        throw new FriendlyAdversaryError("FA_CANCELLED: tool call was cancelled before publication", 3);
}
function canonical(value) {
    if (value === null || typeof value !== "object")
        return JSON.stringify(value);
    if (Array.isArray(value))
        return `[${value.map(canonical).join(",")}]`;
    const record = value;
    return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonical(record[key])}`).join(",")}}`;
}
function safeEqual(left, right) {
    if (!/^[a-f0-9]{64}$/u.test(left) || !/^[a-f0-9]{64}$/u.test(right))
        return false;
    return timingSafeEqual(Buffer.from(left, "hex"), Buffer.from(right, "hex"));
}
function authorityFile(authorityId) {
    if (!AUTHORITY_ID.test(authorityId))
        throw new FriendlyAdversaryError("FA_AUTHORITY_INVALID: invalid workflow authority ID", 2);
    return path.join(authorityRoot(), `${authorityId}.workflow.json`);
}
function workflowAuthorityPrefix(runDirectory) {
    return sha256(path.resolve(runDirectory)).slice(0, 16);
}
function sealTransactionFile(runDirectory) {
    return path.join(authorityRoot(), sha256(`${SEAL_TRANSACTION_DOMAIN}\0${path.resolve(runDirectory)}`).slice(0, 32) + ".json");
}
function sealReceiptDigest(receipt) {
    return sha256(`${SEAL_TRANSACTION_DOMAIN}\0${canonical(receipt)}`);
}
async function writeSealTransaction(receipt, manifestDigest) {
    const file = sealTransactionFile(receipt.outputDirectory);
    await rm(file, { force: true });
    await publishAuthorityControlFile(file, `${canonical({
        schemaVersion: "1",
        runDirectory: receipt.outputDirectory,
        runId: receipt.runId,
        receiptDigest: sealReceiptDigest(receipt),
        manifestDigest,
    })}\n`);
}
async function sealTransactionMatches(receipt, manifest) {
    try {
        const value = JSON.parse(await readAuthorityControlFile(sealTransactionFile(receipt.outputDirectory), "FA_SEAL_TRANSACTION_NOT_FOUND", "FA_SEAL_TRANSACTION_UNSAFE"));
        if (!isPlainRecord(value) || Object.keys(value).sort().join(",") !== "manifestDigest,receiptDigest,runDirectory,runId,schemaVersion")
            return false;
        return value.schemaVersion === "1"
            && value.runDirectory === receipt.outputDirectory
            && value.runId === receipt.runId
            && typeof value.receiptDigest === "string"
            && safeEqual(value.receiptDigest, sealReceiptDigest(receipt))
            && typeof value.manifestDigest === "string"
            && safeEqual(value.manifestDigest, sha256(manifest));
    }
    catch {
        return false;
    }
}
async function readWorkflowAuthority(authorityId) {
    let parsed;
    try {
        parsed = JSON.parse(await readAuthorityControlFile(authorityFile(authorityId)));
    }
    catch (error) {
        if (error instanceof FriendlyAdversaryError)
            throw error;
        throw new FriendlyAdversaryError("FA_AUTHORITY_INCOMPATIBLE: workflow authority is not valid JSON", 2);
    }
    return validateWorkflowAuthorityRecord(parsed, authorityId);
}
function isPlainRecord(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}
function isPublicationSlot(value) {
    if (!isPlainRecord(value) || Object.keys(value).sort().join(",") !== "device,inode,parentDevice,parentInode")
        return false;
    return [value.device, value.inode, value.parentDevice, value.parentInode]
        .every((candidate) => typeof candidate === "string" && /^[0-9]+$/u.test(candidate));
}
function isValidAuthorityArtifactPath(value) {
    if (typeof value !== "string")
        return false;
    try {
        return validateRelativeArtifact(value) === value;
    }
    catch {
        return false;
    }
}
function validateWorkflowAuthorityRecord(value, authorityId) {
    if (!isPlainRecord(value))
        throw new FriendlyAdversaryError("FA_AUTHORITY_INCOMPATIBLE: workflow authority is malformed", 2);
    const required = ["authorityId", "createdAt", "expiresAt", "kind", "productVersion", "receiptSlots", "runDirectory", "runId", "schemaVersion", "scopes", "snapshotDigest"];
    if (Object.keys(value).sort().join(",") !== required.sort().join(",")
        || value.schemaVersion !== "1" || value.productVersion !== PRODUCT_VERSION || value.authorityId !== authorityId
        || (value.kind !== "audit-codebase" && value.kind !== "design-new-codebase")
        || typeof value.runId !== "string" || !value.runId
        || typeof value.runDirectory !== "string" || !path.isAbsolute(value.runDirectory)
        || typeof value.snapshotDigest !== "string" || !/^[a-f0-9]{64}$/u.test(value.snapshotDigest)
        || typeof value.createdAt !== "string" || !Number.isFinite(Date.parse(value.createdAt))
        || typeof value.expiresAt !== "string" || !Number.isFinite(Date.parse(value.expiresAt))
        || !isPlainRecord(value.receiptSlots) || Object.keys(value.receiptSlots).sort().join(",") !== `${RECEIPT_ALTERNATE},${RECEIPT}`
        || !isPublicationSlot(value.receiptSlots[RECEIPT]) || !isPublicationSlot(value.receiptSlots[RECEIPT_ALTERNATE])
        || !isPlainRecord(value.scopes) || !Object.keys(value.scopes).length) {
        throw new FriendlyAdversaryError("FA_AUTHORITY_INCOMPATIBLE: workflow authority is malformed", 2);
    }
    for (const [scope, candidate] of Object.entries(value.scopes)) {
        if (!scope || !isPlainRecord(candidate) || Object.keys(candidate).sort().join(",") !== "digest,exactPaths,maxArtifacts,prefixPaths"
            || typeof candidate.digest !== "string" || !/^[a-f0-9]{64}$/u.test(candidate.digest)
            || !Array.isArray(candidate.exactPaths) || !candidate.exactPaths.every(isValidAuthorityArtifactPath)
            || !Array.isArray(candidate.prefixPaths) || !candidate.prefixPaths.every((item) => typeof item === "string" && item.length > 0 && !path.isAbsolute(item) && !item.includes("..") && !item.includes("\\"))
            || !Number.isSafeInteger(candidate.maxArtifacts) || candidate.maxArtifacts < 1) {
            throw new FriendlyAdversaryError("FA_AUTHORITY_INCOMPATIBLE: workflow authority scope is malformed", 2);
        }
    }
    return value;
}
function capabilityDigest(token, record, scope) {
    return sha256(`friendly-adversary:workflow-capability:v1\0${token}\0${record.authorityId}\0${record.runDirectory}\0${record.snapshotDigest}\0${canonical(record.receiptSlots)}\0${scope}\0${record.expiresAt}`);
}
async function reservePublicationSlot(runDirectory, relativePath) {
    if (relativePath.includes("/") || relativePath.includes("\\"))
        throw new FriendlyAdversaryError("FA_PUBLICATION_SLOT_INVALID: workflow slots must be flat", 2);
    const parentBefore = await lstat(runDirectory, { bigint: true });
    if (!parentBefore.isDirectory() || parentBefore.isSymbolicLink())
        throw new FriendlyAdversaryError("FA_PUBLICATION_PARENT_CHANGED: run root is unsafe", 3);
    const target = path.join(runDirectory, relativePath);
    const handle = await open(target, constants.O_CREAT | constants.O_EXCL | constants.O_RDWR | (constants.O_NOFOLLOW ?? 0), 0o600).catch((error) => {
        if (error.code !== "EEXIST")
            throw error;
        return open(target, constants.O_RDWR | (constants.O_NOFOLLOW ?? 0));
    });
    try {
        const opened = await handle.stat({ bigint: true });
        const [canonical, parentAfter] = await Promise.all([lstat(target, { bigint: true }), lstat(runDirectory, { bigint: true })]);
        if (!opened.isFile() || opened.nlink !== 1n || opened.size !== 0n || canonical.isSymbolicLink() || !canonical.isFile()
            || opened.dev !== canonical.dev || opened.ino !== canonical.ino || parentAfter.isSymbolicLink() || !parentAfter.isDirectory()
            || parentBefore.dev !== parentAfter.dev || parentBefore.ino !== parentAfter.ino) {
            throw new FriendlyAdversaryError("FA_PUBLICATION_SLOT_UNSAFE: reserved workflow artifact changed during creation", 3);
        }
        return { device: opened.dev.toString(), inode: opened.ino.toString(), parentDevice: parentAfter.dev.toString(), parentInode: parentAfter.ino.toString() };
    }
    finally {
        await handle.close();
    }
}
async function reservePublicationSlots(receipt, relativePaths, persist = false) {
    for (const relativePath of [...new Set(relativePaths)].sort()) {
        if (!receipt.publicationSlots[relativePath]) {
            receipt.publicationSlots[relativePath] = await reservePublicationSlot(receipt.outputDirectory, relativePath);
        }
    }
    if (persist)
        await writeReceipt(receipt);
}
function markdownEnvelope(markdown) {
    const body = `${markdown.trimEnd()}\n`;
    return `${body}${ARTIFACT_COMPLETE} sha256=${sha256(body)} -->\n`;
}
function stripMarkdownEnvelope(markdown) {
    const markerPrefix = `\n${ARTIFACT_COMPLETE} sha256=`;
    const markerStart = markdown.lastIndexOf(markerPrefix);
    if (markerStart < 0 || !markdown.endsWith(" -->\n"))
        return markdown.trimEnd();
    const digest = markdown.slice(markerStart + markerPrefix.length, -5);
    if (!/^[a-f0-9]{64}$/u.test(digest))
        return markdown.trimEnd();
    return markdown.slice(0, markerStart + 1).trimEnd();
}
function manifestEnvelope(manifest) {
    const body = `${manifest.trimEnd()}\n`;
    return `${body}${MANIFEST_COMPLETE} sha256=${sha256(body)}\n`;
}
function manifestBody(manifest) {
    const markerStart = manifest.lastIndexOf(`\n${MANIFEST_COMPLETE}`);
    const digestPrefix = `${MANIFEST_COMPLETE} sha256=`;
    if (markerStart < 0 || !manifest.endsWith("\n"))
        throw new FriendlyAdversaryError("FA_MANIFEST_INVALID: artifact manifest has no valid completion record", 2);
    const marker = manifest.slice(markerStart + 1, -1);
    const digest = marker.startsWith(digestPrefix) ? marker.slice(digestPrefix.length) : "";
    const body = manifest.slice(0, markerStart + 1);
    if (!safeEqual(sha256(body), digest))
        throw new FriendlyAdversaryError("FA_MANIFEST_INVALID: artifact manifest completion hash is invalid", 2);
    return body;
}
function committedSlotContent(relativePath, content) {
    if (!content.byteLength)
        return false;
    if (relativePath.endsWith(".md")) {
        const markdown = content.toString("utf8");
        const markerPrefix = `\n${ARTIFACT_COMPLETE} sha256=`;
        const markerStart = markdown.lastIndexOf(markerPrefix);
        if (markerStart < 0 || !markdown.endsWith(" -->\n"))
            return false;
        const digest = markdown.slice(markerStart + markerPrefix.length, -5);
        return safeEqual(sha256(content.subarray(0, Buffer.byteLength(markdown.slice(0, markerStart + 1)))), digest);
    }
    if (relativePath.endsWith(".json")) {
        try {
            JSON.parse(content.toString("utf8"));
            return true;
        }
        catch {
            return false;
        }
    }
    if (relativePath.endsWith(".html"))
        return content.toString("utf8").trimEnd().endsWith("</html>");
    if (relativePath === MANIFEST) {
        try {
            manifestBody(content.toString("utf8"));
            return true;
        }
        catch {
            return false;
        }
    }
    return false;
}
async function readHandle(handle, size) {
    const content = Buffer.alloc(size);
    let offset = 0;
    while (offset < size) {
        const result = await handle.read(content, offset, size - offset, offset);
        if (!result.bytesRead)
            break;
        offset += result.bytesRead;
    }
    return content.subarray(0, offset);
}
async function publishReserved(receipt, relativePath, content) {
    const slot = receipt.publicationSlots[relativePath];
    if (!slot)
        throw new FriendlyAdversaryError(`FA_PUBLICATION_SLOT_MISSING: ${relativePath}`, 2);
    const target = path.join(receipt.outputDirectory, relativePath);
    const handle = await open(target, constants.O_RDWR | (constants.O_NOFOLLOW ?? 0)).catch(() => { throw new FriendlyAdversaryError("FA_PUBLICATION_SLOT_MISSING: reserved artifact is missing or redirected", 3); });
    try {
        const expectedDevice = BigInt(slot.device);
        const expectedInode = BigInt(slot.inode);
        const expectedParentDevice = BigInt(slot.parentDevice);
        const expectedParentInode = BigInt(slot.parentInode);
        const parent = await lstat(receipt.outputDirectory, { bigint: true });
        const canonicalParent = await realpath(receipt.outputDirectory);
        const before = await handle.stat({ bigint: true });
        if (canonicalParent !== receipt.outputDirectory || parent.isSymbolicLink() || !parent.isDirectory() || parent.dev !== expectedParentDevice || parent.ino !== expectedParentInode
            || !before.isFile() || before.nlink !== 1n || before.dev !== expectedDevice || before.ino !== expectedInode) {
            throw new FriendlyAdversaryError("FA_PUBLICATION_SLOT_CHANGED: authenticated workflow slot changed", 3);
        }
        const desired = typeof content === "string" ? Buffer.from(content) : Buffer.from(content);
        const previous = before.size ? await readHandle(handle, Number(before.size)) : Buffer.alloc(0);
        if (previous.equals(desired))
            return "confirmed_existing";
        if (committedSlotContent(relativePath, previous))
            throw new FriendlyAdversaryError("FA_ARTIFACT_CONFLICT: artifact already contains a different committed publication", 2);
        await handle.truncate(0);
        await handle.writeFile(desired);
        await handle.sync();
        const after = await handle.stat({ bigint: true });
        const [canonical, parentAfter] = await Promise.all([lstat(target, { bigint: true }), lstat(receipt.outputDirectory, { bigint: true })]);
        if (after.dev !== expectedDevice || after.ino !== expectedInode || after.nlink !== 1n || after.size !== BigInt(desired.byteLength)
            || canonical.isSymbolicLink() || canonical.dev !== expectedDevice || canonical.ino !== expectedInode
            || parentAfter.isSymbolicLink() || parentAfter.dev !== expectedParentDevice || parentAfter.ino !== expectedParentInode
            || !(await readHandle(handle, desired.byteLength)).equals(desired)) {
            throw new FriendlyAdversaryError("FA_PUBLICATION_SLOT_CHANGED: workflow slot changed during publication", 3);
        }
        return previous.byteLength ? "recovered_transaction" : "created";
    }
    finally {
        await handle.close();
    }
}
async function preflightReservedPublication(receipt, relativePath, content) {
    const slot = receipt.publicationSlots[relativePath];
    if (!slot)
        throw new FriendlyAdversaryError(`FA_PUBLICATION_SLOT_MISSING: ${relativePath}`, 2);
    const target = path.join(receipt.outputDirectory, relativePath);
    const handle = await open(target, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0)).catch(() => {
        throw new FriendlyAdversaryError("FA_PUBLICATION_SLOT_MISSING: reserved artifact is missing or redirected", 3);
    });
    try {
        const expectedDevice = BigInt(slot.device);
        const expectedInode = BigInt(slot.inode);
        const expectedParentDevice = BigInt(slot.parentDevice);
        const expectedParentInode = BigInt(slot.parentInode);
        const [opened, canonical, parent, canonicalParent] = await Promise.all([
            handle.stat({ bigint: true }),
            lstat(target, { bigint: true }),
            lstat(receipt.outputDirectory, { bigint: true }),
            realpath(receipt.outputDirectory),
        ]);
        if (canonicalParent !== receipt.outputDirectory || parent.isSymbolicLink() || !parent.isDirectory()
            || parent.dev !== expectedParentDevice || parent.ino !== expectedParentInode
            || !opened.isFile() || opened.nlink !== 1n || opened.dev !== expectedDevice || opened.ino !== expectedInode
            || canonical.isSymbolicLink() || !canonical.isFile() || canonical.dev !== expectedDevice || canonical.ino !== expectedInode) {
            throw new FriendlyAdversaryError("FA_PUBLICATION_SLOT_CHANGED: authenticated workflow slot changed", 3);
        }
        const desired = typeof content === "string" ? Buffer.from(content) : Buffer.from(content);
        const previous = opened.size ? await readHandle(handle, Number(opened.size)) : Buffer.alloc(0);
        if (previous.equals(desired) || !committedSlotContent(relativePath, previous))
            return;
        throw new FriendlyAdversaryError("FA_ARTIFACT_CONFLICT: artifact already contains a different committed publication", 2);
    }
    finally {
        await handle.close();
    }
}
async function writeReservedMutable(receipt, relativePath, content) {
    const slot = receipt.publicationSlots[relativePath];
    if (!slot)
        throw new FriendlyAdversaryError(`FA_PUBLICATION_SLOT_MISSING: ${relativePath}`, 2);
    const target = path.join(receipt.outputDirectory, relativePath);
    const handle = await open(target, constants.O_RDWR | (constants.O_NOFOLLOW ?? 0)).catch(() => { throw new FriendlyAdversaryError("FA_PUBLICATION_SLOT_MISSING: mutable workflow slot is missing or redirected", 3); });
    try {
        const expectedDevice = BigInt(slot.device);
        const expectedInode = BigInt(slot.inode);
        const expectedParentDevice = BigInt(slot.parentDevice);
        const expectedParentInode = BigInt(slot.parentInode);
        const [before, parent, canonicalParent] = await Promise.all([handle.stat({ bigint: true }), lstat(receipt.outputDirectory, { bigint: true }), realpath(receipt.outputDirectory)]);
        if (canonicalParent !== receipt.outputDirectory || parent.isSymbolicLink() || !parent.isDirectory() || parent.dev !== expectedParentDevice || parent.ino !== expectedParentInode
            || !before.isFile() || before.nlink !== 1n || before.dev !== expectedDevice || before.ino !== expectedInode) {
            throw new FriendlyAdversaryError("FA_PUBLICATION_SLOT_CHANGED: mutable workflow slot changed", 3);
        }
        const desired = typeof content === "string" ? Buffer.from(content) : Buffer.from(content);
        await handle.truncate(0);
        await handle.writeFile(desired);
        await handle.sync();
        const after = await handle.stat({ bigint: true });
        const [canonical, parentAfter] = await Promise.all([lstat(target, { bigint: true }), lstat(receipt.outputDirectory, { bigint: true })]);
        if (after.dev !== expectedDevice || after.ino !== expectedInode || after.nlink !== 1n || after.size !== BigInt(desired.byteLength)
            || canonical.isSymbolicLink() || canonical.dev !== expectedDevice || canonical.ino !== expectedInode
            || parentAfter.isSymbolicLink() || parentAfter.dev !== expectedParentDevice || parentAfter.ino !== expectedParentInode
            || !(await readHandle(handle, desired.byteLength)).equals(desired)) {
            throw new FriendlyAdversaryError("FA_PUBLICATION_SLOT_CHANGED: mutable workflow slot changed during write", 3);
        }
    }
    finally {
        await handle.close();
    }
}
async function readReceiptCandidate(runDirectory, name) {
    const candidatePath = path.join(runDirectory, name);
    try {
        const receipt = JSON.parse(await readFile(candidatePath, "utf8"));
        const slot = receipt.publicationSlots?.[name];
        if (receipt.schemaVersion !== "1" || receipt.productVersion !== PRODUCT_VERSION || receipt.outputDirectory !== runDirectory
            || !["audit-codebase", "design-new-codebase"].includes(receipt.kind) || !Number.isSafeInteger(receipt.receiptGeneration) || receipt.receiptGeneration < 0
            || !receipt.pendingDecisionRevisions || typeof receipt.pendingDecisionRevisions !== "object" || Array.isArray(receipt.pendingDecisionRevisions)
            || !slot || ![slot.device, slot.inode, slot.parentDevice, slot.parentInode].every((value) => /^[0-9]+$/u.test(value)))
            return undefined;
        const [metadata, parent] = await Promise.all([lstat(candidatePath, { bigint: true }), lstat(runDirectory, { bigint: true })]);
        if (!metadata.isFile() || metadata.isSymbolicLink() || metadata.nlink !== 1n
            || metadata.dev !== BigInt(slot.device) || metadata.ino !== BigInt(slot.inode)
            || !parent.isDirectory() || parent.isSymbolicLink()
            || parent.dev !== BigInt(slot.parentDevice) || parent.ino !== BigInt(slot.parentInode))
            return undefined;
        return receipt;
    }
    catch {
        return undefined;
    }
}
async function writeReceipt(receipt) {
    const candidates = (await Promise.all([
        readReceiptCandidate(receipt.outputDirectory, RECEIPT),
        readReceiptCandidate(receipt.outputDirectory, RECEIPT_ALTERNATE),
    ])).filter((candidate) => candidate !== undefined)
        .sort((left, right) => right.receiptGeneration - left.receiptGeneration);
    const latest = candidates[0];
    const target = !latest || latest.receiptGeneration % 2 !== 0 ? RECEIPT : RECEIPT_ALTERNATE;
    receipt.receiptGeneration = latest ? latest.receiptGeneration + 1 : 0;
    await writeReservedMutable(receipt, target, `${JSON.stringify(receipt, null, 2)}\n`);
}
function validateRelativeArtifact(relativePath) {
    if (!relativePath || path.isAbsolute(relativePath) || relativePath.includes("\\") || relativePath.includes("/")) {
        throw new FriendlyAdversaryError("FA_ARTIFACT_PATH_INVALID: workflow artifacts must be flat portable filenames in the authorized run root", 2);
    }
    if (!relativePath.endsWith(".md"))
        throw new FriendlyAdversaryError("FA_ARTIFACT_TYPE_INVALID: agent-authored artifacts must be Markdown", 2);
    return relativePath;
}
function validateMarkdown(markdown) {
    const bytes = Buffer.byteLength(markdown, "utf8");
    if (!markdown.trim() || bytes > MAX_ARTIFACT_BYTES)
        throw new FriendlyAdversaryError("FA_ARTIFACT_INVALID: Markdown is empty or exceeds the size limit", 2);
    if (detectRecognizableSecret(markdown))
        throw new FriendlyAdversaryError("FA_ARTIFACT_SECRET: Markdown contains credential-like material", 2);
}
function workflowGitBuffer(repositoryRoot, args) {
    try {
        return execFileSync("git", ["-C", repositoryRoot, "-c", "core.hooksPath=/dev/null", "-c", "core.fsmonitor=false", ...args], {
            encoding: "buffer",
            maxBuffer: MAX_CAPTURE_BYTES,
            timeout: DEFAULT_TIMEOUT_MS,
            killSignal: "SIGKILL",
            stdio: ["ignore", "pipe", "pipe"],
            env: {
                PATH: process.env.PATH,
                LANG: process.env.LANG ?? "C.UTF-8",
                GIT_CONFIG_NOSYSTEM: "1",
                GIT_PAGER: "cat",
                GIT_TERMINAL_PROMPT: "0",
            },
        });
    }
    catch (error) {
        const failure = error;
        const stderr = Buffer.isBuffer(failure.stderr) ? failure.stderr.toString("utf8") : String(failure.stderr ?? "");
        throw new FriendlyAdversaryError(`Git command failed while pinning the workflow snapshot: git ${args.join(" ")}\n${stderr.trim()}`, failure.status ?? 2);
    }
}
function gitHead(repositoryRoot) {
    return workflowGitBuffer(repositoryRoot, ["rev-parse", "--verify", "HEAD^{commit}"]).toString("utf8").trim();
}
function gitText(repositoryRoot, args) {
    return workflowGitBuffer(repositoryRoot, args).toString("utf8");
}
function gitlinkContent(repositoryRoot, relative) {
    const staged = gitText(repositoryRoot, ["ls-files", "--stage", "--", relative]).trim();
    const match = /^160000 ([a-f0-9]{40,64}) 0\t/u.exec(staged);
    if (!match?.[1])
        throw new FriendlyAdversaryError(`FA_SNAPSHOT_UNSUPPORTED: tracked directory is not a valid Git submodule: ${relative}`, 2);
    const status = gitText(repositoryRoot, ["status", "--porcelain=v2", "-z", "--", relative]);
    return { content: Buffer.from(`gitlink\0${match[1]}\0${status}`, "utf8"), object: match[1], status };
}
async function assertSourcePathConfined(repositoryRoot, relative) {
    const parts = relative.split("/");
    let cursor = repositoryRoot;
    for (const part of parts.slice(0, -1)) {
        cursor = path.join(cursor, part);
        const metadata = await lstat(cursor).catch(() => undefined);
        if (!metadata?.isDirectory() || metadata.isSymbolicLink()) {
            throw new FriendlyAdversaryError(`FA_SNAPSHOT_UNSAFE: tracked path has a symlinked or invalid parent: ${relative}`, 2);
        }
    }
}
async function assertCanonicalSourceInside(repositoryRoot, absolute, relative) {
    const canonical = await realpath(absolute);
    const contained = path.relative(repositoryRoot, canonical);
    if (path.isAbsolute(contained) || contained.startsWith(".."))
        throw new FriendlyAdversaryError(`FA_SNAPSHOT_UNSAFE: tracked path resolves outside the repository: ${relative}`, 2);
}
export function reserveWorkflowSnapshotBytes(totalBytes, fileBytes, relative) {
    if (fileBytes > MAX_WORKFLOW_SNAPSHOT_FILE_BYTES) {
        throw new FriendlyAdversaryError(`FA_SNAPSHOT_TOO_LARGE: ${relative} exceeds the per-file snapshot byte limit`, 2);
    }
    if (totalBytes + fileBytes > MAX_WORKFLOW_SNAPSHOT_TOTAL_BYTES) {
        throw new FriendlyAdversaryError("FA_SNAPSHOT_TOO_LARGE: repository files exceed the aggregate snapshot byte limit", 2);
    }
    return totalBytes + fileBytes;
}
async function readSnapshotFile(absolute, relative, expected, totalBytes) {
    const handle = await open(absolute, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
    try {
        const before = await handle.stat();
        if (!before.isFile() || before.dev !== expected.dev || before.ino !== expected.ino) {
            throw new FriendlyAdversaryError(`FA_SNAPSHOT_CHANGED: ${relative} changed while opening`, 2);
        }
        const reservedBytes = reserveWorkflowSnapshotBytes(totalBytes, before.size, relative);
        const content = await readHandle(handle, before.size);
        const after = await handle.stat();
        if (content.byteLength !== before.size || after.size !== before.size || after.mtimeMs !== before.mtimeMs) {
            throw new FriendlyAdversaryError(`FA_SNAPSHOT_CHANGED: ${relative} changed while reading`, 2);
        }
        return { content, totalBytes: reservedBytes };
    }
    finally {
        await handle.close();
    }
}
function gitIndex(repositoryRoot) {
    const output = workflowGitBuffer(repositoryRoot, ["ls-files", "--stage", "-z"]);
    return output.toString("utf8").split("\0").filter(Boolean).map((entry) => {
        const tab = entry.indexOf("\t");
        const header = entry.slice(0, tab).split(" ");
        return { mode: header[0], object: header[1], stage: Number(header[2]), path: entry.slice(tab + 1) };
    }).filter((entry) => !entry.path.startsWith(`${OUTPUT_DIRECTORY}/`)).sort((left, right) => left.path.localeCompare(right.path) || left.stage - right.stage);
}
async function auditSnapshot(candidate, materializeRoot) {
    const root = await resolveRepositoryRoot(candidate);
    const files = monitoredGitPaths(root);
    const records = [];
    const digest = createHash("sha256");
    const headSha = gitHead(root);
    let totalBytes = 0;
    digest.update(`head\0${headSha}\0`);
    const index = gitIndex(root);
    for (const entry of index)
        digest.update(`index\0${entry.mode}\0${entry.object}\0${entry.stage}\0${entry.path}\0`);
    if (materializeRoot)
        await ensureDirectory(materializeRoot);
    for (const relative of files) {
        const absolute = path.join(root, ...relative.split("/"));
        await assertSourcePathConfined(root, relative);
        const metadata = await lstat(absolute).catch((error) => {
            if (error.code === "ENOENT")
                return undefined;
            throw error;
        });
        if (!metadata) {
            const record = { path: relative, kind: "deleted", mode: 0, bytes: 0, sha256: sha256("") };
            records.push(record);
            digest.update(`deleted\0${relative}\0`);
            continue;
        }
        const mode = metadata.mode & 0o777;
        if (metadata.isSymbolicLink()) {
            const target = await readlink(absolute);
            const content = Buffer.from(target);
            const record = { path: relative, kind: "symlink", mode, bytes: content.byteLength, sha256: sha256(content), target };
            records.push(record);
            digest.update(`symlink\0${relative}\0${target}\0`);
        }
        else if (metadata.isFile()) {
            await assertCanonicalSourceInside(root, absolute, relative);
            const bounded = await readSnapshotFile(absolute, relative, metadata, totalBytes);
            const { content } = bounded;
            totalBytes = bounded.totalBytes;
            const record = { path: relative, kind: "file", mode, bytes: content.byteLength, sha256: sha256(content) };
            records.push(record);
            digest.update(`file\0${relative}\0${record.mode}\0${record.sha256}\0${record.bytes}\0`);
            if (materializeRoot)
                await writeFileAtomic(path.join(materializeRoot, ...relative.split("/")), content);
        }
        else if (metadata.isDirectory()) {
            await assertCanonicalSourceInside(root, absolute, relative);
            const gitlink = gitlinkContent(root, relative);
            const content = gitlink.content;
            const record = { path: relative, kind: "gitlink", mode, bytes: content.byteLength, sha256: sha256(content), gitObject: gitlink.object, gitStatus: gitlink.status };
            records.push(record);
            digest.update(`gitlink\0${relative}\0${record.sha256}\0${record.bytes}\0`);
        }
    }
    return { mode: "git-files", root, headSha, digest: digest.digest("hex"), fileCount: records.length, files: records, index };
}
async function directorySnapshot(candidate) {
    const root = await realpath(path.resolve(candidate)).catch(() => {
        throw new FriendlyAdversaryError("FA_DESIGN_ROOT_NOT_FOUND: the design root must already exist", 2);
    });
    const metadata = await stat(root, { bigint: true });
    if (!metadata.isDirectory())
        throw new FriendlyAdversaryError("FA_DESIGN_ROOT_INVALID: the design root must be a directory", 2);
    const digest = sha256(`directory\0${root}\0${metadata.dev}\0${metadata.ino}`);
    return { mode: "directory-identity", root, headSha: null, digest, fileCount: 0, files: [], index: [] };
}
async function currentSnapshot(receipt) {
    return receipt.kind === "audit-codebase" ? auditSnapshot(receipt.root) : directorySnapshot(receipt.root);
}
async function verifyMaterializedSnapshot(receipt) {
    const snapshotRoot = path.join(receipt.outputDirectory, SNAPSHOT_FILES);
    const expected = receipt.snapshot.files.filter((file) => file.kind === "file");
    const actual = await walk(snapshotRoot);
    if (actual.length !== expected.length || actual.some((file) => !expected.some((record) => record.path === file))) {
        throw new FriendlyAdversaryError("FA_SNAPSHOT_MATERIALIZATION_STALE: materialized file inventory changed", 3);
    }
    for (const file of expected) {
        const candidate = path.join(snapshotRoot, ...file.path.split("/"));
        const metadata = await lstat(candidate).catch(() => undefined);
        if (!metadata?.isFile() || metadata.isSymbolicLink())
            throw new FriendlyAdversaryError(`FA_SNAPSHOT_MATERIALIZATION_STALE: ${file.path}`, 3);
        const content = await readFile(candidate);
        if (content.byteLength !== file.bytes || sha256(content) !== file.sha256)
            throw new FriendlyAdversaryError(`FA_SNAPSHOT_MATERIALIZATION_STALE: ${file.path}`, 3);
    }
}
async function readReceipt(runDirectory) {
    const runReal = await realpath(runDirectory).catch(() => { throw new FriendlyAdversaryError("FA_RUN_NOT_FOUND: workflow run is missing", 2); });
    const candidates = (await Promise.all([
        readReceiptCandidate(runReal, RECEIPT),
        readReceiptCandidate(runReal, RECEIPT_ALTERNATE),
    ])).filter((candidate) => candidate !== undefined)
        .sort((left, right) => right.receiptGeneration - left.receiptGeneration);
    if (!candidates[0])
        throw new FriendlyAdversaryError("FA_RUN_NOT_FOUND: workflow receipt generations are missing or incomplete", 2);
    return candidates[0];
}
const WORKFLOW_LOCK_WAIT_MS = 60_000;
async function acquireWorkflowLock(receipt, operation) {
    await ensureSafeOutputRoot(receipt.root, path.join(receipt.root, OUTPUT_DIRECTORY, ".internal"));
    const deadline = Date.now() + WORKFLOW_LOCK_WAIT_MS;
    for (;;) {
        try {
            return await acquireRunLock(receipt.root, receipt.outputDirectory, operation);
        }
        catch (error) {
            if (!(error instanceof FriendlyAdversaryError) || !error.message.startsWith("FA_RUN_BUSY:") || Date.now() >= deadline)
                throw error;
            await new Promise((resolve) => setTimeout(resolve, 25));
        }
    }
}
async function withWorkflowMutation(runDirectory, operation, mutate) {
    const initial = await readReceipt(runDirectory);
    const lock = await acquireWorkflowLock(initial, operation);
    try {
        const current = await readReceipt(initial.outputDirectory);
        if (current.outputDirectory !== initial.outputDirectory || current.root !== initial.root || current.runId !== initial.runId) {
            throw new FriendlyAdversaryError("FA_RUN_CHANGED: workflow identity changed while waiting for its lifecycle lock", 3);
        }
        return await mutate(current);
    }
    finally {
        await releaseRunLock(lock);
    }
}
async function createAuthority(receipt, scopes) {
    const authorityId = `${workflowAuthorityPrefix(receipt.outputDirectory)}${randomBytes(8).toString("hex")}`;
    const now = new Date();
    await cleanupExpiredAuthorities(now);
    const expiresAt = new Date(now.getTime() + DEFAULT_CAPABILITY_LIFETIME_MS).toISOString();
    const base = {
        schemaVersion: "1",
        productVersion: PRODUCT_VERSION,
        authorityId,
        runId: receipt.runId,
        runDirectory: receipt.outputDirectory,
        kind: receipt.kind,
        snapshotDigest: receipt.snapshot.digest,
        receiptSlots: {
            [RECEIPT]: receipt.publicationSlots[RECEIPT],
            [RECEIPT_ALTERNATE]: receipt.publicationSlots[RECEIPT_ALTERNATE],
        },
        createdAt: now.toISOString(),
        expiresAt,
    };
    const capabilities = {};
    const stored = {};
    for (const [scope, limits] of Object.entries(scopes)) {
        const token = randomBytes(32).toString("base64url");
        capabilities[scope] = token;
        stored[scope] = {
            digest: capabilityDigest(token, base, scope),
            exactPaths: [...new Set(limits.exactPaths ?? [])].sort(),
            prefixPaths: [...new Set(limits.prefixPaths ?? [])].sort(),
            maxArtifacts: limits.maxArtifacts ?? 1,
        };
    }
    await publishAuthorityControlFile(authorityFile(authorityId), `${canonical({ ...base, scopes: stored })}\n`);
    return { run_directory: receipt.outputDirectory, authority_id: authorityId, expires_at: expiresAt, capabilities };
}
async function validateAuthority(authorityId, capability, relativePath) {
    if (!CAPABILITY.test(capability))
        throw new FriendlyAdversaryError("FA_CAPABILITY_INVALID: invalid workflow capability", 2);
    const record = await readWorkflowAuthority(authorityId);
    if (record.schemaVersion !== "1" || record.productVersion !== PRODUCT_VERSION || record.authorityId !== authorityId || Date.now() >= Date.parse(record.expiresAt)
        || !record.receiptSlots || [RECEIPT, RECEIPT_ALTERNATE].some((name) => {
        const slot = record.receiptSlots[name];
        return !slot || ![slot.device, slot.inode, slot.parentDevice, slot.parentInode].every((value) => /^[0-9]+$/u.test(value));
    })) {
        throw new FriendlyAdversaryError("FA_AUTHORITY_INCOMPATIBLE: workflow authority is malformed or expired", 2);
    }
    const { scopes, ...base } = record;
    let matched;
    for (const [scope, limits] of Object.entries(scopes)) {
        if (!safeEqual(capabilityDigest(capability, base, scope), limits.digest))
            continue;
        const allowed = limits.exactPaths.includes(relativePath) || limits.prefixPaths.some((prefix) => relativePath.startsWith(prefix));
        if (!allowed)
            throw new FriendlyAdversaryError("FA_CAPABILITY_DENIED: capability does not authorize this artifact path", 2);
        const existingPaths = new Set();
        for (const exact of limits.exactPaths) {
            if (scope === "plan" ? await pathExists(path.join(record.runDirectory, exact)) : await publicationExists(record.runDirectory, scope, exact))
                existingPaths.add(exact);
        }
        for (const prefix of limits.prefixPaths) {
            for (const entry of await readdir(record.runDirectory, { withFileTypes: true })) {
                if (entry.isFile() && entry.name.startsWith(prefix) && entry.name.endsWith(".md") && await publicationExists(record.runDirectory, scope, entry.name))
                    existingPaths.add(entry.name);
            }
        }
        if (!existingPaths.has(relativePath) && existingPaths.size >= limits.maxArtifacts) {
            throw new FriendlyAdversaryError("FA_CAPABILITY_EXHAUSTED: capability reached its artifact limit", 2);
        }
        matched = scope;
        break;
    }
    if (!matched)
        throw new FriendlyAdversaryError("FA_CAPABILITY_DENIED: capability does not authorize this workflow", 2);
    const receipt = await readReceipt(record.runDirectory);
    if (receipt.runId !== record.runId || receipt.kind !== record.kind || receipt.snapshot.digest !== record.snapshotDigest
        || canonical({ [RECEIPT]: receipt.publicationSlots[RECEIPT], [RECEIPT_ALTERNATE]: receipt.publicationSlots[RECEIPT_ALTERNATE] }) !== canonical(record.receiptSlots)) {
        throw new FriendlyAdversaryError("FA_AUTHORITY_MISMATCH: workflow authority no longer matches its run", 2);
    }
    if (receipt.kind === "audit-codebase")
        await verifyMaterializedSnapshot(receipt);
    return { receipt, scope: matched, record };
}
function runPrefix(kind) {
    return `${new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-")}-${kind}-${randomUUID().slice(0, 8)}`;
}
async function startWorkflow(kind, candidate, host, timeoutMs) {
    const initial = kind === "audit-codebase" ? await resolveRepositoryRoot(candidate) : (await directorySnapshot(candidate)).root;
    const output = await ensureSafeOutputRoot(initial, path.join(initial, OUTPUT_DIRECTORY));
    const collection = kind === "audit-codebase" ? "audits" : "designs";
    const collectionRoot = await ensureSafeOutputRoot(initial, path.join(output, collection));
    const runDirectory = await createUniqueRunDirectory(collectionRoot, runPrefix(kind));
    try {
        const snapshot = kind === "audit-codebase"
            ? await auditSnapshot(initial, path.join(runDirectory, SNAPSHOT_FILES))
            : await directorySnapshot(initial);
        const now = new Date().toISOString();
        const receipt = {
            schemaVersion: "1",
            productVersion: PRODUCT_VERSION,
            kind,
            runId: path.basename(runDirectory),
            createdAt: now,
            updatedAt: now,
            status: "prepared",
            root: snapshot.root,
            outputDirectory: runDirectory,
            snapshot,
            host,
            lanes: [],
            toolRuns: [],
            incompleteReasons: [],
            signedOff: false,
            publicationCount: 0,
            publicationSlots: {},
            receiptGeneration: 0,
            pendingDecisionRevisions: {},
        };
        if (kind === "audit-codebase") {
            const symlinkCount = snapshot.files.filter((file) => file.kind === "symlink").length;
            if (symlinkCount) {
                receipt.incompleteReasons.push(`${symlinkCount} tracked symlink${symlinkCount === 1 ? " was" : "s were"} recorded in snapshot.json but not dereferenced or analyzed`);
            }
        }
        const overview = kind === "audit-codebase" ? "inventory.md" : "brief.md";
        await reservePublicationSlots(receipt, [RECEIPT, RECEIPT_ALTERNATE, SNAPSHOT, overview, PLAN]);
        await publishReserved(receipt, SNAPSHOT, `${canonical(snapshot)}\n`);
        await writeReceipt(receipt);
        if (kind === "audit-codebase") {
            const assetsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
            const bundledDefinitions = path.join(assetsRoot, "references", "lenses");
            const canonicalDefinitions = path.join(assetsRoot, "lenses");
            const definitionSource = await pathExists(bundledDefinitions) ? bundledDefinitions : canonicalDefinitions;
            const definitionTarget = path.join(runDirectory, "dimension-definitions");
            await ensureDirectory(definitionTarget);
            for (const entry of await readdir(definitionSource, { withFileTypes: true })) {
                if (entry.isFile() && entry.name.endsWith(".md")) {
                    await copyFile(path.join(definitionSource, entry.name), path.join(definitionTarget, entry.name));
                }
                else if (entry.isDirectory() && await pathExists(path.join(definitionSource, entry.name, "LENS.md"))) {
                    await copyFile(path.join(definitionSource, entry.name, "LENS.md"), path.join(definitionTarget, `${entry.name}.md`));
                }
            }
            const { collectTools } = await import("./tools.js");
            receipt.toolRuns = await collectTools({
                repo: path.join(runDirectory, SNAPSHOT_FILES),
                runDirectory,
                changedFiles: snapshot.files.filter((file) => file.kind === "file").map((file) => file.path),
                mergeBaseSha: snapshot.headSha ?? "",
                options: { timeoutMs },
                assetsRoot,
                includeRepositoryTools: false,
            });
            receipt.incompleteReasons.push(...receipt.toolRuns
                .filter((tool) => tool.required && tool.status !== "completed")
                .map((tool) => `${tool.name}: ${tool.reason ?? tool.status}`));
            receipt.updatedAt = new Date().toISOString();
            await writeReceipt(receipt);
        }
        const planPaths = [overview];
        return { receipt, authority: await createAuthority(receipt, { plan: { exactPaths: planPaths, maxArtifacts: planPaths.length } }) };
    }
    catch (error) {
        await rm(runDirectory, { recursive: true, force: true });
        throw error;
    }
}
export async function startAudit(input) {
    return startWorkflow("audit-codebase", input.repo, input.host, input.timeoutMs ?? DEFAULT_TIMEOUT_MS);
}
export async function startDesign(input) {
    return startWorkflow("design-new-codebase", input.root, input.host, DEFAULT_TIMEOUT_MS);
}
function validateManifest(kind, manifest) {
    if (!Array.isArray(manifest.lanes) || !manifest.lanes.length)
        throw new FriendlyAdversaryError("FA_PLAN_INVALID: workflow plan requires at least one lane", 2);
    const lanes = manifest.lanes.map((lane) => ({ ...lane, dimensions: [...new Set(lane.dimensions)].sort() })).sort((left, right) => left.id.localeCompare(right.id));
    const allowedKinds = kind === "audit-codebase" ? ["subsystem"] : ["decision", "research", "challenge"];
    if (lanes.some((lane) => !SAFE_ID.test(lane.id) || !allowedKinds.includes(lane.kind) || !lane.title.trim() || !lane.scope.trim() || lane.dimensions.some((dimension) => !SAFE_ID.test(dimension))) || new Set(lanes.map((lane) => lane.id)).size !== lanes.length) {
        throw new FriendlyAdversaryError("FA_PLAN_INVALID: workflow lanes are malformed, duplicated, or incompatible", 2);
    }
    if (kind === "audit-codebase" && !lanes.some((lane) => lane.kind === "subsystem")) {
        throw new FriendlyAdversaryError("FA_PLAN_INVALID: audit plans require at least one subsystem lane", 2);
    }
    if (kind === "design-new-codebase" && (!lanes.some((lane) => lane.kind === "decision") || !lanes.some((lane) => lane.kind === "challenge"))) {
        throw new FriendlyAdversaryError("FA_PLAN_INVALID: design plans require decision and challenge lanes", 2);
    }
    if (kind === "design-new-codebase") {
        const challengeIds = new Set(lanes.filter((lane) => lane.kind === "challenge").map((lane) => lane.id));
        const missing = ["feasibility", "simplicity", "security", "operability", "verification"].filter((id) => !challengeIds.has(id));
        if (missing.length)
            throw new FriendlyAdversaryError(`FA_PLAN_INVALID: design plan is missing required challenges: ${missing.join(", ")}`, 2);
    }
    return lanes;
}
function lanePath(lane) {
    if (lane.kind === "subsystem")
        return `subsystem-${lane.id}.md`;
    if (lane.kind === "research")
        return `research-${lane.id}.md`;
    if (lane.kind === "challenge")
        return `challenge-${lane.id}.md`;
    return `decision-${lane.id}-`;
}
function isPrimaryLane(kind, lane) {
    return kind === "audit-codebase" ? lane.kind === "subsystem" : lane.kind === "decision" || lane.kind === "research";
}
function allPlannedArtifactPaths(kind, lanes) {
    const agentPaths = [];
    for (const lane of lanes) {
        if (lane.kind === "decision")
            agentPaths.push(`${lanePath(lane)}0001.md`);
        else
            agentPaths.push(lanePath(lane));
    }
    const outcomes = kind === "audit-codebase"
        ? ["adjudication.md", "report.md"]
        : ["architecture.md", "diagrams.md", "test-strategy.md", "implementation-plan.md", "open-questions.md"];
    const sealFiles = kind === "audit-codebase" ? ["report.html", MANIFEST] : ["design-pack.md", "design.html", MANIFEST];
    const published = [...agentPaths, ...outcomes];
    return [...published, ...published.map((relative) => path.basename(publicationPath(".", relative))), ...sealFiles];
}
function publicationPath(runDirectory, relativePath) {
    return path.join(runDirectory, `${PUBLICATION_PREFIX}${sha256(relativePath)}.json`);
}
async function recordPublication(receipt, scope, relativePath, content) {
    const record = {
        schemaVersion: "1",
        productVersion: PRODUCT_VERSION,
        runId: receipt.runId,
        snapshotDigest: receipt.snapshot.digest,
        scope,
        relativePath,
        bytes: Buffer.byteLength(content),
        sha256: sha256(content),
    };
    await publishReserved(receipt, path.basename(publicationPath(receipt.outputDirectory, relativePath)), `${canonical(record)}\n`);
}
async function publicationExists(runDirectory, scope, relativePath) {
    try {
        const artifact = await readFile(path.join(runDirectory, relativePath));
        const record = JSON.parse(await readFile(publicationPath(runDirectory, relativePath), "utf8"));
        return record.scope === scope && record.relativePath === relativePath && record.bytes === artifact.byteLength && record.sha256 === sha256(artifact);
    }
    catch {
        return false;
    }
}
export async function establishWorkflowPlan(input) {
    validateMarkdown(input.overviewMarkdown);
    const record = await readWorkflowAuthority(input.authorityId);
    return withWorkflowMutation(record.runDirectory, "workflow-establish", async (receipt) => {
        const expected = receipt.kind === "audit-codebase" ? "inventory.md" : "brief.md";
        await validateAuthority(input.authorityId, input.capability, expected);
        if (input.workflow && receipt.kind !== input.workflow)
            throw new FriendlyAdversaryError("FA_WORKFLOW_MISMATCH: authority belongs to another workflow", 2);
        if (receipt.status !== "prepared")
            throw new FriendlyAdversaryError("FA_PLAN_STATE_INVALID: workflow plan can only be established once", 2);
        const lanes = validateManifest(receipt.kind, input.manifest);
        throwIfWorkflowCancelled(input.signal);
        await publishReserved(receipt, expected, markdownEnvelope(input.overviewMarkdown));
        await publishReserved(receipt, PLAN, `${canonical({ schemaVersion: "1", productVersion: PRODUCT_VERSION, kind: receipt.kind, snapshotDigest: receipt.snapshot.digest, lanes })}\n`);
        await reservePublicationSlots(receipt, allPlannedArtifactPaths(receipt.kind, lanes), true);
        receipt.lanes = lanes;
        receipt.status = "planned";
        receipt.updatedAt = new Date().toISOString();
        const scopes = {};
        for (const lane of lanes.filter((candidate) => isPrimaryLane(receipt.kind, candidate))) {
            const target = lanePath(lane);
            scopes[`lane:${lane.id}`] = lane.kind === "decision"
                ? { exactPaths: [`${target}0001.md`], maxArtifacts: 1 }
                : { exactPaths: [target], maxArtifacts: 1 };
        }
        const replacement = await createAuthority(receipt, scopes);
        try {
            await writeReceipt(receipt);
        }
        catch (error) {
            await rm(authorityFile(replacement.authority_id), { force: true }).catch(() => undefined);
            throw error;
        }
        await revokeWorkflowAuthorities(receipt.outputDirectory, replacement.authority_id);
        return replacement;
    });
}
export async function recordWorkflowArtifact(input) {
    const relativePath = validateRelativeArtifact(input.relativePath);
    validateMarkdown(input.markdown);
    const record = await readWorkflowAuthority(input.authorityId);
    return withWorkflowMutation(record.runDirectory, "workflow-publication", async () => {
        const { receipt, scope } = await validateAuthority(input.authorityId, input.capability, relativePath);
        if (input.workflow && receipt.kind !== input.workflow)
            throw new FriendlyAdversaryError("FA_WORKFLOW_MISMATCH: authority belongs to another workflow", 2);
        if (!["planned", "incomplete"].includes(receipt.status))
            throw new FriendlyAdversaryError("FA_RUN_STATE_INVALID: workflow is not accepting lane artifacts", 2);
        if (scope.startsWith("lane:")) {
            const laneId = scope.slice(5);
            const lane = receipt.lanes.find((candidate) => candidate.id === laneId);
            if (!lane)
                throw new FriendlyAdversaryError("FA_PLAN_MISMATCH: capability lane is not in the immutable plan", 2);
            if (lane.kind === "decision" && !new RegExp(`^decision-${lane.id}-[0-9]{4}\\.md$`, "u").test(relativePath)) {
                throw new FriendlyAdversaryError("FA_DECISION_REVISION_INVALID: decision paths require a four-digit append-only revision", 2);
            }
        }
        if (receipt.kind === "audit-codebase" && scope.startsWith("lane:")) {
            validateLensReportContract(input.markdown, relativePath);
        }
        const normalized = markdownEnvelope(input.markdown);
        throwIfWorkflowCancelled(input.signal);
        const publication = await publishReserved(receipt, relativePath, normalized);
        await recordPublication(receipt, scope, relativePath, normalized);
        if (scope.startsWith("lane:") && receipt.pendingDecisionRevisions[scope.slice(5)] === relativePath) {
            delete receipt.pendingDecisionRevisions[scope.slice(5)];
            receipt.updatedAt = new Date().toISOString();
            await writeReceipt(receipt);
        }
        return { run_id: receipt.runId, relative_path: relativePath, publication, bytes: Buffer.byteLength(normalized), sha256: sha256(normalized) };
    });
}
export async function preflightWorkflowArtifact(input) {
    const relativePath = validateRelativeArtifact(input.relativePath);
    const { receipt, scope } = await validateAuthority(input.authorityId, input.capability, relativePath);
    if (input.workflow && receipt.kind !== input.workflow)
        throw new FriendlyAdversaryError("FA_WORKFLOW_MISMATCH: authority belongs to another workflow", 2);
    return { run_id: receipt.runId, relative_path: relativePath, scope };
}
async function laneCompleted(runDirectory, lane) {
    const target = lanePath(lane);
    if (lane.kind !== "decision")
        return publicationExists(runDirectory, `lane:${lane.id}`, target);
    const entries = await readdir(runDirectory).catch(() => []);
    for (const entry of entries.filter((name) => new RegExp(`^decision-${lane.id}-[0-9]{4}\\.md$`, "u").test(name))) {
        if (await publicationExists(runDirectory, `lane:${lane.id}`, entry))
            return true;
    }
    return false;
}
async function nextDecisionPath(runDirectory, lane) {
    const entries = await readdir(runDirectory).catch(() => []);
    let highest = 0;
    for (const entry of entries) {
        const match = new RegExp(`^decision-${lane.id}-([0-9]{4})\\.md$`, "u").exec(entry);
        if (match?.[1] && await publicationExists(runDirectory, `lane:${lane.id}`, entry))
            highest = Math.max(highest, Number(match[1]));
    }
    if (highest >= 9999)
        throw new FriendlyAdversaryError(`FA_DECISION_REVISION_EXHAUSTED: ${lane.id}`, 2);
    return `decision-${lane.id}-${String(highest + 1).padStart(4, "0")}.md`;
}
async function reconcilePendingDecisionRevisions(receipt) {
    let changed = false;
    for (const [laneId, relativePath] of Object.entries(receipt.pendingDecisionRevisions)) {
        const lane = receipt.lanes.find((candidate) => candidate.id === laneId && candidate.kind === "decision");
        if (!lane || !new RegExp(`^decision-${laneId}-[0-9]{4}\\.md$`, "u").test(relativePath)) {
            throw new FriendlyAdversaryError("FA_REVISION_INVALID: persisted decision revision state is malformed", 3);
        }
        if (await publicationExists(receipt.outputDirectory, `lane:${laneId}`, relativePath)) {
            delete receipt.pendingDecisionRevisions[laneId];
            changed = true;
        }
    }
    if (changed) {
        receipt.updatedAt = new Date().toISOString();
        await writeReceipt(receipt);
    }
}
export async function completeWorkflow(input) {
    if (!input.artifacts.length)
        throw new FriendlyAdversaryError("FA_OUTCOME_INVALID: final outcome requires artifacts", 2);
    const firstPath = validateRelativeArtifact(input.artifacts[0].relativePath);
    const record = await readWorkflowAuthority(input.authorityId);
    return withWorkflowMutation(record.runDirectory, "workflow-complete", async () => {
        const { receipt, scope } = await validateAuthority(input.authorityId, input.capability, firstPath);
        if (input.workflow && receipt.kind !== input.workflow)
            throw new FriendlyAdversaryError("FA_WORKFLOW_MISMATCH: authority belongs to another workflow", 2);
        if (scope !== "outcome")
            throw new FriendlyAdversaryError("FA_CAPABILITY_DENIED: outcome capability required", 2);
        if (!["planned", "incomplete", "ready"].includes(receipt.status))
            throw new FriendlyAdversaryError("FA_RUN_STATE_INVALID: workflow is not accepting a final outcome", 2);
        if (Object.keys(receipt.pendingDecisionRevisions).length)
            throw new FriendlyAdversaryError("FA_REVISION_PENDING: every requested decision revision must publish before completion", 2);
        const missing = [];
        for (const lane of receipt.lanes)
            if (!await laneCompleted(receipt.outputDirectory, lane))
                missing.push(lane.id);
        if (missing.length)
            throw new FriendlyAdversaryError(`FA_LANES_INCOMPLETE: missing workflow lanes: ${missing.join(", ")}`, 2);
        if (receipt.kind === "design-new-codebase" && input.userSignoff !== true)
            throw new FriendlyAdversaryError("FA_SIGNOFF_REQUIRED: explicit user signoff is required", 2);
        const expected = receipt.kind === "audit-codebase"
            ? ["adjudication.md", "report.md"]
            : ["architecture.md", "diagrams.md", "test-strategy.md", "implementation-plan.md", "open-questions.md"];
        if (JSON.stringify(input.artifacts.map((artifact) => artifact.relativePath).sort()) !== JSON.stringify([...expected].sort())) {
            throw new FriendlyAdversaryError("FA_OUTCOME_INVALID: final artifact set does not match the workflow contract", 2);
        }
        const results = [];
        const normalizedArtifacts = new Map();
        for (const artifact of input.artifacts) {
            validateRelativeArtifact(artifact.relativePath);
            validateMarkdown(artifact.markdown);
            normalizedArtifacts.set(artifact.relativePath, markdownEnvelope(artifact.markdown));
        }
        if (receipt.kind === "audit-codebase") {
            const report = normalizedArtifacts.get("report.md");
            const adjudication = input.artifacts.find((artifact) => artifact.relativePath === "adjudication.md");
            if (adjudication.markdown.includes(`<!-- ${OUTCOME_REPORT_SHA256}:`)) {
                throw new FriendlyAdversaryError("FA_OUTCOME_INVALID: adjudication contains a reserved outcome binding", 2);
            }
            normalizedArtifacts.set("adjudication.md", markdownEnvelope(`${adjudication.markdown.trimEnd()}\n\n<!-- ${OUTCOME_REPORT_SHA256}:${sha256(report)} -->`));
        }
        for (const relativePath of expected) {
            await validateAuthority(input.authorityId, input.capability, relativePath);
            await preflightReservedPublication(receipt, relativePath, normalizedArtifacts.get(relativePath));
        }
        throwIfWorkflowCancelled(input.signal);
        for (const relativePath of expected) {
            const normalized = normalizedArtifacts.get(relativePath);
            await publishReserved(receipt, relativePath, normalized);
            await recordPublication(receipt, "outcome", relativePath, normalized);
            results.push({ relative_path: relativePath, sha256: sha256(normalized) });
        }
        receipt.status = "ready";
        receipt.signedOff = receipt.kind === "design-new-codebase";
        receipt.updatedAt = new Date().toISOString();
        receipt.publicationCount = (await readdir(receipt.outputDirectory)).filter((name) => name.startsWith(PUBLICATION_PREFIX)).length;
        await writeReceipt(receipt);
        return { run_id: receipt.runId, artifacts: results };
    });
}
async function walk(root, relative = "") {
    const entries = await readdir(path.join(root, relative), { withFileTypes: true });
    const files = [];
    for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
        const child = path.join(relative, entry.name);
        if (entry.isDirectory())
            files.push(...await walk(root, child));
        else if (entry.isFile())
            files.push(child.split(path.sep).join("/"));
        else
            throw new FriendlyAdversaryError("FA_ARTIFACT_UNSAFE: workflow artifacts contain an unsupported filesystem entry", 2);
    }
    return files;
}
function manifestLine(relative, content) {
    return `${sha256(content)}  ${content.byteLength}  ${JSON.stringify(relative)}`;
}
async function expectedManifest(receipt, overrides = new Map()) {
    const files = (await walk(receipt.outputDirectory)).filter((file) => file !== MANIFEST);
    const lines = [];
    for (const file of files)
        lines.push(manifestLine(file, overrides.get(file) ?? await readFile(path.join(receipt.outputDirectory, ...file.split("/")))));
    return manifestEnvelope(lines.join("\n"));
}
async function validateAuditOutcomeBinding(receipt) {
    if (receipt.kind !== "audit-codebase")
        return;
    const [adjudication, report] = await Promise.all([
        readFile(path.join(receipt.outputDirectory, "adjudication.md"), "utf8"),
        readFile(path.join(receipt.outputDirectory, "report.md"), "utf8"),
    ]);
    const matches = [...adjudication.matchAll(new RegExp(`<!-- ${OUTCOME_REPORT_SHA256}:([a-f0-9]{64}) -->`, "gu"))];
    if (matches.length !== 1 || matches[0][1] !== sha256(report)) {
        throw new FriendlyAdversaryError("FA_OUTCOME_PAIR_MISMATCH: adjudication and report were not committed as one outcome", 2);
    }
}
export async function sealWorkflow(runDirectory) {
    return withWorkflowMutation(runDirectory, "workflow-seal", async (receipt) => {
        if (receipt.status === "sealed" || receipt.status === "sealed-incomplete") {
            try {
                await verifyWorkflow(receipt.outputDirectory);
            }
            catch (error) {
                const manifest = await readFile(path.join(receipt.outputDirectory, MANIFEST)).catch(() => undefined);
                const expected = await expectedManifest(receipt);
                if (!manifest || committedSlotContent(MANIFEST, manifest) || !(await sealTransactionMatches(receipt, expected)))
                    throw error;
                await publishReserved(receipt, MANIFEST, expected);
            }
            await rm(sealTransactionFile(receipt.outputDirectory), { force: true });
            await verifyWorkflow(receipt.outputDirectory);
            await revokeWorkflowAuthorities(receipt.outputDirectory);
            return receipt;
        }
        if (receipt.status !== "ready")
            throw new FriendlyAdversaryError(`FA_SEAL_STATE_INVALID: cannot seal workflow in ${receipt.status}`, 2);
        if (Object.keys(receipt.pendingDecisionRevisions).length)
            throw new FriendlyAdversaryError("FA_REVISION_PENDING: a workflow with pending decision revisions cannot seal", 2);
        await validateAuditOutcomeBinding(receipt);
        if (receipt.kind === "audit-codebase")
            await verifyMaterializedSnapshot(receipt);
        const current = await currentSnapshot(receipt);
        if (current.digest !== receipt.snapshot.digest) {
            receipt.status = "incomplete";
            receipt.incompleteReasons.push("Workflow snapshot changed before sealing");
            receipt.updatedAt = new Date().toISOString();
            await writeReceipt(receipt);
            throw new FriendlyAdversaryError("FA_SNAPSHOT_STALE: workflow snapshot changed before sealing", 3);
        }
        if (receipt.kind === "audit-codebase") {
            const report = stripMarkdownEnvelope(await readFile(path.join(receipt.outputDirectory, "report.md"), "utf8"));
            await publishReserved(receipt, "report.html", renderMarkdownReport(report, "Friendly Adversary codebase audit"));
        }
        else {
            const names = ["brief.md", "architecture.md", "diagrams.md", "test-strategy.md", "implementation-plan.md", "open-questions.md"];
            const combined = (await Promise.all(names.map(async (name) => stripMarkdownEnvelope(await readFile(path.join(receipt.outputDirectory, name), "utf8"))))).join("\n\n");
            await publishReserved(receipt, "design-pack.md", markdownEnvelope(combined));
            await publishReserved(receipt, "design.html", renderMarkdownReport(combined, "Friendly Adversary new codebase design"));
        }
        receipt.status = receipt.incompleteReasons.length ? "sealed-incomplete" : "sealed";
        receipt.sealedAt = new Date().toISOString();
        receipt.updatedAt = receipt.sealedAt;
        const beforeManifest = (await walk(receipt.outputDirectory)).filter((file) => file !== MANIFEST);
        receipt.artifactCount = beforeManifest.length + 1;
        const receiptTarget = receipt.receiptGeneration % 2 !== 0 ? RECEIPT : RECEIPT_ALTERNATE;
        receipt.receiptGeneration += 1;
        const plannedManifest = await expectedManifest(receipt, new Map([
            [receiptTarget, Buffer.from(`${JSON.stringify(receipt, null, 2)}\n`)],
        ]));
        await writeSealTransaction(receipt, sha256(plannedManifest));
        await writeReceipt(receipt);
        await publishReserved(receipt, MANIFEST, plannedManifest);
        await rm(sealTransactionFile(receipt.outputDirectory), { force: true });
        await verifyWorkflow(receipt.outputDirectory);
        await revokeWorkflowAuthorities(receipt.outputDirectory);
        return receipt;
    });
}
export async function verifyWorkflow(runDirectory) {
    const receipt = await readReceipt(runDirectory);
    if (receipt.status !== "sealed" && receipt.status !== "sealed-incomplete")
        throw new FriendlyAdversaryError("FA_VERIFY_STATE_INVALID: workflow is not sealed", 2);
    const manifest = await readFile(path.join(receipt.outputDirectory, MANIFEST), "utf8")
        .catch(() => { throw new FriendlyAdversaryError("FA_MANIFEST_INVALID: artifact manifest is missing", 2); });
    const lines = manifestBody(manifest).trimEnd().split("\n");
    const expected = new Map();
    for (const line of lines) {
        const match = /^([a-f0-9]{64})  (\d+)  (".*")$/u.exec(line);
        if (!match)
            throw new FriendlyAdversaryError("FA_MANIFEST_INVALID: artifact manifest is malformed", 2);
        expected.set(JSON.parse(match[3]), { hash: match[1], bytes: Number(match[2]) });
    }
    const actual = (await walk(receipt.outputDirectory)).filter((file) => file !== MANIFEST);
    if (actual.length !== expected.size || actual.some((file) => !expected.has(file)))
        throw new FriendlyAdversaryError("FA_MANIFEST_MISMATCH: artifact inventory differs from the seal", 3);
    for (const file of actual) {
        const content = await readFile(path.join(receipt.outputDirectory, ...file.split("/")));
        const record = expected.get(file);
        if (content.byteLength !== record.bytes || sha256(content) !== record.hash)
            throw new FriendlyAdversaryError(`FA_ARTIFACT_TAMPERED: ${file}`, 3);
    }
    return { valid: true, artifacts: actual.length + 1 };
}
async function revokeWorkflowAuthorities(runDirectory, preserveAuthorityId) {
    const root = await ensureAuthorityRoot();
    const entries = await readdir(root);
    const prefix = workflowAuthorityPrefix(runDirectory);
    for (const entry of entries.filter((name) => name.startsWith(prefix) && AUTHORITY_ID.test(name.slice(0, 32)) && name.endsWith(".workflow.json"))) {
        const authorityId = entry.slice(0, 32);
        if (authorityId === preserveAuthorityId)
            continue;
        await rm(path.join(root, entry), { force: true });
    }
}
export async function resumeWorkflow(runDirectory, revisionLaneIds = []) {
    return withWorkflowMutation(runDirectory, "workflow-resume", async (receipt) => {
        if (receipt.status !== "planned" && receipt.status !== "incomplete")
            throw new FriendlyAdversaryError("FA_RESUME_STATE_INVALID: only planned or incomplete workflows may resume", 2);
        await reconcilePendingDecisionRevisions(receipt);
        const current = await currentSnapshot(receipt);
        if (current.digest !== receipt.snapshot.digest)
            throw new FriendlyAdversaryError("FA_SNAPSHOT_STALE: changed snapshot requires a new workflow run", 3);
        const scopes = {};
        const primary = receipt.lanes.filter((lane) => isPrimaryLane(receipt.kind, lane));
        const primaryComplete = (await Promise.all(primary.map((lane) => laneCompleted(receipt.outputDirectory, lane)))).every(Boolean);
        if (revisionLaneIds.length && receipt.kind !== "design-new-codebase")
            throw new FriendlyAdversaryError("FA_REVISION_INVALID: only design workflows support decision revisions", 2);
        const requestedRevisions = new Set(revisionLaneIds);
        if (requestedRevisions.size !== revisionLaneIds.length || revisionLaneIds.some((id) => !SAFE_ID.test(id)))
            throw new FriendlyAdversaryError("FA_REVISION_INVALID: decision revision lane IDs are malformed or duplicated", 2);
        const decisionIds = new Set(receipt.lanes.filter((lane) => lane.kind === "decision").map((lane) => lane.id));
        const unavailableRevisions = revisionLaneIds.filter((id) => !decisionIds.has(id));
        if (unavailableRevisions.length)
            throw new FriendlyAdversaryError(`FA_REVISION_INVALID: unknown decision lanes: ${unavailableRevisions.join(", ")}`, 2);
        const challenges = receipt.lanes.filter((lane) => lane.kind === "challenge");
        const challengesComplete = (await Promise.all(challenges.map((lane) => laneCompleted(receipt.outputDirectory, lane)))).every(Boolean);
        if (requestedRevisions.size && (!primaryComplete || !challengesComplete)) {
            throw new FriendlyAdversaryError("FA_REVISION_BARRIER: decision revisions require every planned challenge publication", 2);
        }
        const pendingRevisions = new Set(Object.keys(receipt.pendingDecisionRevisions));
        const revisionsToIssue = new Set([...requestedRevisions, ...pendingRevisions]);
        const eligible = revisionsToIssue.size
            ? receipt.lanes.filter((lane) => lane.kind === "decision" && revisionsToIssue.has(lane.id))
            : primaryComplete
                ? receipt.lanes.filter((lane) => !isPrimaryLane(receipt.kind, lane))
                : primary;
        for (const lane of eligible) {
            if (await laneCompleted(receipt.outputDirectory, lane) && !revisionsToIssue.has(lane.id))
                continue;
            if (lane.kind === "decision") {
                const target = receipt.pendingDecisionRevisions[lane.id] ?? await nextDecisionPath(receipt.outputDirectory, lane);
                await reservePublicationSlots(receipt, [target, path.basename(publicationPath(receipt.outputDirectory, target))]);
                if (!receipt.pendingDecisionRevisions[lane.id]) {
                    receipt.pendingDecisionRevisions[lane.id] = target;
                    receipt.updatedAt = new Date().toISOString();
                    await writeReceipt(receipt);
                }
                scopes[`lane:${lane.id}`] = { exactPaths: [target], maxArtifacts: 1 };
            }
            else {
                scopes[`lane:${lane.id}`] = { exactPaths: [lanePath(lane)], maxArtifacts: 1 };
            }
        }
        const allComplete = !Object.keys(receipt.pendingDecisionRevisions).length
            && (await Promise.all(receipt.lanes.map((lane) => laneCompleted(receipt.outputDirectory, lane)))).every(Boolean);
        if (allComplete && !revisionLaneIds.length) {
            scopes.outcome = receipt.kind === "audit-codebase"
                ? { exactPaths: ["adjudication.md", "report.md"], maxArtifacts: 2 }
                : { exactPaths: ["architecture.md", "diagrams.md", "test-strategy.md", "implementation-plan.md", "open-questions.md"], maxArtifacts: 5 };
        }
        if (!Object.keys(scopes).length)
            throw new FriendlyAdversaryError("FA_RESUME_STATE_INVALID: workflow has no eligible incomplete phase", 2);
        const replacement = await createAuthority(receipt, scopes);
        await revokeWorkflowAuthorities(receipt.outputDirectory, replacement.authority_id);
        return replacement;
    });
}
export async function abortWorkflow(runDirectory) {
    return withWorkflowMutation(runDirectory, "workflow-abort", async (receipt) => {
        if (receipt.status === "sealed" || receipt.status === "sealed-incomplete")
            throw new FriendlyAdversaryError("FA_ABORT_SEALED: sealed workflows cannot be aborted", 2);
        receipt.status = "aborted";
        receipt.incompleteReasons.push("Workflow was aborted before sealing");
        receipt.updatedAt = new Date().toISOString();
        await writeReceipt(receipt);
        await revokeWorkflowAuthorities(receipt.outputDirectory);
        return receipt;
    });
}
export async function workflowStatus(runDirectory) {
    return readReceipt(runDirectory);
}
//# sourceMappingURL=workflow.js.map