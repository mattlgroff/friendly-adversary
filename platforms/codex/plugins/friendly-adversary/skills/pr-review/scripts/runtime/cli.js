#!/usr/bin/env node
import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DEFAULT_TIMEOUT_MS } from "./constants.js";
import { formatFailureDetail, FriendlyAdversaryError } from "./errors.js";
import { runReviewWithLenses, sealReview, statRun, verifyReview, } from "./review.js";
import { validateRepository } from "./validate.js";
import { abortWorkflow, resumeWorkflow, sealWorkflow, startAudit, startDesign, verifyWorkflow, workflowStatus } from "./workflow.js";
import { recoverRunLock } from "./run-lock.js";
const BOOLEAN_FLAGS = new Set(["summary"]);
const VALUE_FLAGS = new Set(["repo", "base", "output", "timeout-ms", "run", "root", "lenses", "host", "revise"]);
function requireSupportedNode() {
    const [major, minor] = process.versions.node.split(".").map(Number);
    if (!Number.isInteger(major) || !Number.isInteger(minor) || (major ?? 0) < 22 || (major === 22 && (minor ?? 0) < 22)) {
        throw new FriendlyAdversaryError(`Node 22.22.0 or newer is required; found ${process.versions.node}`, 2);
    }
}
function parse(argv) {
    const [command = "help", ...rest] = argv;
    const values = new Map();
    for (let index = 0; index < rest.length; index += 1) {
        const token = rest[index];
        if (!token?.startsWith("--"))
            throw new FriendlyAdversaryError(`Unexpected argument: ${token}`, 2);
        const key = token.slice(2);
        if (values.has(key))
            throw new FriendlyAdversaryError(`Duplicate option: --${key}`, 2);
        if (BOOLEAN_FLAGS.has(key)) {
            values.set(key, true);
            continue;
        }
        if (!VALUE_FLAGS.has(key))
            throw new FriendlyAdversaryError(`Unknown option: --${key}`, 2);
        const next = rest[index + 1];
        if (next === undefined)
            throw new FriendlyAdversaryError(`Missing value for --${key}`, 2);
        values.set(key, next);
        index += 1;
    }
    return { command, values };
}
function value(args, key) {
    const found = args.values.get(key);
    return typeof found === "string" ? found : undefined;
}
async function discoveredLenses() {
    const assetsRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
    try {
        const entries = await readdir(path.join(assetsRoot, "lenses"), { withFileTypes: true });
        const ids = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name).filter((id) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)).sort();
        if (ids.length)
            return ids;
    }
    catch {
        // The plugin runtime stores flattened lens references instead.
    }
    try {
        const entries = await readdir(path.join(assetsRoot, "references", "lenses"), { withFileTypes: true });
        const ids = entries.filter((entry) => entry.isFile() && entry.name.endsWith(".md")).map((entry) => entry.name.slice(0, -3)).filter((id) => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)).sort();
        if (ids.length)
            return ids;
    }
    catch {
        // The error below reports the required bundle invariant.
    }
    throw new FriendlyAdversaryError("The installed plugin bundle does not contain any lens definitions", 3);
}
function lensSelection(raw, defaults) {
    if (!raw)
        return defaults;
    const selected = raw.split(",").map((value) => value.trim()).filter(Boolean);
    if (!selected.length || selected.some((lens) => !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(lens))) {
        throw new FriendlyAdversaryError("--lenses must be a comma-separated list of safe lens identifiers", 2);
    }
    const unavailable = selected.filter((lens) => !defaults.includes(lens));
    if (unavailable.length) {
        throw new FriendlyAdversaryError(`Unknown lens identifier${unavailable.length === 1 ? "" : "s"}: ${unavailable.join(", ")}`, 2);
    }
    return selected;
}
async function options(args) {
    const timeoutMs = Number(value(args, "timeout-ms") ?? DEFAULT_TIMEOUT_MS);
    if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1_000) {
        throw new FriendlyAdversaryError("--timeout-ms must be an integer of at least 1000", 2);
    }
    const base = value(args, "base");
    const outputRoot = value(args, "output");
    const hostValue = value(args, "host") ?? "unavailable";
    if (hostValue !== "claude-code" && hostValue !== "codex" && hostValue !== "unavailable") {
        throw new FriendlyAdversaryError("--host must be claude-code, codex, or unavailable", 2);
    }
    const host = hostValue;
    return {
        repo: value(args, "repo") ?? process.cwd(),
        timeoutMs,
        expectedLenses: lensSelection(value(args, "lenses"), await discoveredLenses()),
        host,
        ...(base ? { base } : {}),
        ...(outputRoot ? { outputRoot } : {}),
    };
}
function host(args) {
    const found = value(args, "host") ?? "unavailable";
    if (found !== "claude-code" && found !== "codex" && found !== "unavailable")
        throw new FriendlyAdversaryError("--host must be claude-code, codex, or unavailable", 2);
    return found;
}
async function workflowKind(runDirectory) {
    try {
        const receipt = await workflowStatus(runDirectory);
        return typeof receipt.kind === "string" ? receipt.kind : undefined;
    }
    catch {
        return undefined;
    }
}
function runPath(args) {
    const found = value(args, "run");
    if (!found)
        throw new FriendlyAdversaryError("This command requires --run <directory>", 2);
    return path.resolve(found);
}
function help() {
    process.stdout.write(`Friendly Adversary local review collector

Usage:
  friendly-adversary review [--repo .] [--base ref] [--output .friendly-adversary/path] [--lenses a,b]
  friendly-adversary audit [--repo .] [--host claude-code|codex]
  friendly-adversary design [--root .] [--host claude-code|codex]
  friendly-adversary resume-audit --run <directory>
  friendly-adversary resume-design --run <directory> [--revise decision-lane-id,...]
  friendly-adversary recover-lock --run <directory>
  friendly-adversary abort --run <audit-or-design-directory>
  friendly-adversary seal --run <directory>
  friendly-adversary verify --run <directory>
  friendly-adversary status --run <directory> [--summary]
  friendly-adversary validate [--root .]

The review command prepares a pinned run, collects deterministic evidence, and runs every lens concurrently through the required local Codex CLI Luna runtime.
The audit command snapshots a full brownfield repository and runs only bundled analyzers.
The design command starts an interview-driven greenfield decision session.
The calling Codex or Claude Code model performs final adjudication only.
Repository code, tests, executable configs, and local binaries are required review inputs.
Analyzer installation, package downloads, updates, and network queries never run at review time.
`);
}
async function main() {
    requireSupportedNode();
    const args = parse(process.argv.slice(2));
    if (["help", "--help", "-h"].includes(args.command))
        return help();
    if (args.command === "review") {
        const run = await runReviewWithLenses(await options(args));
        process.stdout.write(`${JSON.stringify({
            run_directory: run.runDirectory,
            authority_id: run.authority.authority_id,
            expires_at: run.authority.expires_at,
            outcome_capability: run.authority.outcome_capability,
            lenses: run.lensReceipts.map(({ lensId, publication }) => ({
                lens_id: lensId,
                relative_path: publication.relativePath,
                bytes: publication.bytes,
                sha256: publication.sha256,
            })),
        }, null, 2)}\n`);
        return;
    }
    if (args.command === "audit") {
        const timeoutMs = Number(value(args, "timeout-ms") ?? DEFAULT_TIMEOUT_MS);
        if (!Number.isSafeInteger(timeoutMs) || timeoutMs < 1_000)
            throw new FriendlyAdversaryError("--timeout-ms must be an integer of at least 1000", 2);
        process.stdout.write(`${JSON.stringify((await startAudit({ repo: value(args, "repo") ?? process.cwd(), host: host(args), timeoutMs })).authority, null, 2)}\n`);
        return;
    }
    if (args.command === "design") {
        process.stdout.write(`${JSON.stringify((await startDesign({ root: value(args, "root") ?? process.cwd(), host: host(args) })).authority, null, 2)}\n`);
        return;
    }
    if (args.command === "resume-audit" || args.command === "resume-design") {
        const revisions = (value(args, "revise") ?? "").split(",").map((item) => item.trim()).filter(Boolean);
        process.stdout.write(`${JSON.stringify(await resumeWorkflow(runPath(args), revisions), null, 2)}\n`);
        return;
    }
    if (args.command === "recover-lock") {
        const receipt = await workflowStatus(runPath(args));
        await recoverRunLock(receipt.root, receipt.outputDirectory);
        process.stdout.write(`${receipt.outputDirectory}\n`);
        return;
    }
    if (args.command === "abort") {
        const run = runPath(args);
        process.stdout.write(`${(await abortWorkflow(run)).outputDirectory}\n`);
        return;
    }
    if (args.command === "seal") {
        const run = runPath(args);
        const workflow = await workflowKind(run);
        process.stdout.write(`${workflow ? (await sealWorkflow(run)).outputDirectory : (await sealReview(run)).outputDirectory}\n`);
        return;
    }
    if (args.command === "verify") {
        const run = runPath(args);
        process.stdout.write(`${JSON.stringify(await workflowKind(run) ? await verifyWorkflow(run) : await verifyReview(run), null, 2)}\n`);
        return;
    }
    if (args.command === "status") {
        const run = runPath(args);
        const workflow = await workflowKind(run);
        const status = workflow ? await workflowStatus(run) : await statRun(run);
        const receipt = "receipt" in status ? status.receipt : status;
        const output = args.values.has("summary") ? {
            runId: receipt.runId,
            status: receipt.status,
            outputDirectory: receipt.outputDirectory,
            incompleteReasons: receipt.incompleteReasons,
            ...(workflow && "kind" in receipt ? { kind: receipt.kind, receiptGeneration: receipt.receiptGeneration } : {}),
        } : status;
        process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
        return;
    }
    if (args.command === "validate") {
        const root = path.resolve(value(args, "root") ?? process.cwd());
        for (const line of await validateRepository(root))
            process.stdout.write(`${line}\n`);
        return;
    }
    throw new FriendlyAdversaryError(`Unknown command: ${args.command}`, 2);
}
main().catch((error) => {
    const friendly = error instanceof FriendlyAdversaryError
        ? error
        : new FriendlyAdversaryError(formatFailureDetail(error));
    process.stderr.write(`friendly-adversary: ${friendly.message}\n`);
    process.exitCode = friendly.exitCode;
});
//# sourceMappingURL=cli.js.map