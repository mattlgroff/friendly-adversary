import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, readFile, readlink, realpath } from "node:fs/promises";
import path from "node:path";
import { MAX_CAPTURE_BYTES, OUTPUT_DIRECTORY } from "./constants.js";
import { FriendlyAdversaryError } from "./errors.js";
import { ensureDirectory, pathExists, writeFileAtomic } from "./fs-utils.js";
const SAFE_GIT_CONFIG = [
    "-c", "core.hooksPath=/dev/null",
    "-c", "core.fsmonitor=false",
    "-c", "diff.external=",
    "-c", "pager.diff=false",
    "-c", "pager.log=false",
    "-c", "color.ui=false",
];
function gitBuffer(repo, args) {
    try {
        return execFileSync("git", ["-C", repo, ...SAFE_GIT_CONFIG, ...args], {
            encoding: "buffer",
            maxBuffer: MAX_CAPTURE_BYTES,
            timeout: 60_000,
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
        const stderr = Buffer.isBuffer(failure.stderr)
            ? failure.stderr.toString("utf8")
            : String(failure.stderr ?? "");
        throw new FriendlyAdversaryError(`Git command failed: git ${args.join(" ")}\n${stderr.trim()}`, failure.status ?? 2);
    }
}
function gitText(repo, args) {
    return gitBuffer(repo, args).toString("utf8").trim();
}
function parseNullList(content) {
    return content.toString("utf8").split("\0").filter(Boolean);
}
export function ignoredGitPaths(repo, files) {
    if (!files.length)
        return new Set();
    try {
        const output = execFileSync("git", ["-C", repo, ...SAFE_GIT_CONFIG, "check-ignore", "--stdin", "-z"], {
            input: Buffer.from(`${files.join("\0")}\0`),
            encoding: "buffer",
            maxBuffer: MAX_CAPTURE_BYTES,
            timeout: 10_000,
            killSignal: "SIGKILL",
            stdio: ["pipe", "pipe", "pipe"],
            env: {
                PATH: process.env.PATH,
                LANG: process.env.LANG ?? "C.UTF-8",
                GIT_CONFIG_NOSYSTEM: "1",
                GIT_TERMINAL_PROMPT: "0",
            },
        });
        return new Set(parseNullList(output));
    }
    catch (error) {
        const status = error.status;
        if (status === 1)
            return new Set();
        throw new FriendlyAdversaryError("Could not classify changed paths against Git ignore rules", status ?? 2);
    }
}
export function monitoredGitPaths(repo) {
    return parseNullList(gitBuffer(repo, [
        "ls-files",
        "--cached",
        "--others",
        "--exclude-standard",
        "-z",
    ])).filter((file) => !inOutputDirectory(file)).sort();
}
export function monitoredGitDirectories(repo) {
    const directories = new Set(["."]);
    const addAncestors = (initial) => {
        let directory = initial;
        while (directory && directory !== ".") {
            directories.add(directory);
            const parent = path.posix.dirname(directory);
            if (parent === directory)
                break;
            directory = parent;
        }
    };
    for (const candidate of monitoredGitPaths(repo))
        addAncestors(path.posix.dirname(candidate));
    for (const candidate of parseNullList(gitBuffer(repo, ["ls-files", "--others", "--directory", "--exclude-standard", "-z"]))) {
        const directory = candidate.replace(/\/$/u, "");
        if (directory && !inOutputDirectory(directory))
            addAncestors(directory);
    }
    return [...directories].sort();
}
function inOutputDirectory(file) {
    return file === OUTPUT_DIRECTORY || file.startsWith(`${OUTPUT_DIRECTORY}/`);
}
const REVIEW_SCOPE = [".", `:(exclude)${OUTPUT_DIRECTORY}/**`];
export async function resolveRepositoryRoot(candidate) {
    const absolute = path.resolve(candidate);
    const root = gitText(absolute, ["rev-parse", "--show-toplevel"]);
    return realpath(root);
}
function refExists(repo, ref) {
    try {
        gitBuffer(repo, [
            "rev-parse",
            "--verify",
            "--quiet",
            "--end-of-options",
            `${ref}^{commit}`,
        ]);
        return true;
    }
    catch {
        return false;
    }
}
export function resolveBaseRef(repo, explicitBase) {
    if (explicitBase) {
        if (!refExists(repo, explicitBase)) {
            throw new FriendlyAdversaryError(`The requested base ref does not resolve to a commit: ${explicitBase}`, 2);
        }
        return explicitBase;
    }
    try {
        const symbolic = gitText(repo, [
            "symbolic-ref",
            "--quiet",
            "refs/remotes/origin/HEAD",
        ]);
        if (symbolic.startsWith("refs/remotes/")) {
            const remoteRef = symbolic.slice("refs/remotes/".length);
            if (refExists(repo, remoteRef))
                return remoteRef;
        }
    }
    catch {
        // Continue through the documented fallback order.
    }
    for (const candidate of ["origin/main", "origin/master", "main", "master"]) {
        if (refExists(repo, candidate))
            return candidate;
    }
    throw new FriendlyAdversaryError("No review baseline was found. Pass --base with a commit or branch from the existing application.", 2);
}
function parseHunkLines(diff) {
    const lines = new Set();
    for (const line of diff.split("\n")) {
        if (!line.startsWith("@@"))
            continue;
        const match = /\+(\d+)(?:,(\d+))?/.exec(line);
        if (!match)
            continue;
        const start = Number(match[1]);
        const count = match[2] === undefined ? 1 : Number(match[2]);
        for (let offset = 0; offset < count; offset += 1)
            lines.add(start + offset);
    }
    return [...lines].sort((left, right) => left - right);
}
async function untrackedLines(repo, file) {
    const absolute = path.join(repo, file);
    const metadata = await lstat(absolute);
    if (metadata.isSymbolicLink())
        return [1];
    if (!metadata.isFile())
        return [];
    const content = await readFile(absolute);
    if (content.includes(0))
        return [];
    if (content.length === 0)
        return [];
    const lineCount = content.toString("utf8").split("\n").length - (content.at(-1) === 10 ? 1 : 0);
    return Array.from({ length: lineCount }, (_, index) => index + 1);
}
async function changedLineMap(repo, mergeBaseSha, tracked, untracked) {
    const result = {};
    for (const file of tracked) {
        const diff = gitBuffer(repo, [
            "diff",
            "--no-ext-diff",
            "--no-textconv",
            "--unified=0",
            mergeBaseSha,
            "--",
            file,
        ]).toString("utf8");
        result[file] = parseHunkLines(diff);
    }
    for (const file of untracked)
        result[file] = await untrackedLines(repo, file);
    return result;
}
function hashSnapshot(headSha, changedFiles, changedLines, artifacts) {
    const hash = createHash("sha256");
    const part = (label, content) => {
        hash.update(`\0${label}\0`);
        hash.update(content);
    };
    part("head", headSha);
    part("changed-files", JSON.stringify(changedFiles));
    part("changed-lines", JSON.stringify(changedLines));
    part("status", artifacts.status);
    part("combined", artifacts.combinedDiff);
    part("index", artifacts.indexDiff);
    part("working-tree", artifacts.workingTreeDiff);
    part("zero-context", artifacts.zeroContextDiff);
    part("stat", artifacts.diffStat);
    part("numstat", artifacts.diffNumstat);
    part("recent-commits", artifacts.recentCommits);
    for (const [file, entry] of [...artifacts.untracked.entries()].sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)) {
        part(`untracked-${entry.kind}`, file);
        hash.update("\0content\0");
        hash.update(entry.content);
    }
    return hash.digest("hex");
}
export async function inspectGit(repoCandidate, explicitBase) {
    const repositoryRoot = await resolveRepositoryRoot(repoCandidate);
    const baseRef = resolveBaseRef(repositoryRoot, explicitBase);
    const baseSha = gitText(repositoryRoot, [
        "rev-parse",
        "--verify",
        "--end-of-options",
        `${baseRef}^{commit}`,
    ]);
    const headSha = gitText(repositoryRoot, ["rev-parse", "--verify", "HEAD^{commit}"]);
    const mergeBaseSha = gitText(repositoryRoot, ["merge-base", baseSha, headSha]);
    const tracked = parseNullList(gitBuffer(repositoryRoot, [
        "diff",
        "--no-ext-diff",
        "--no-textconv",
        "--name-only",
        "--diff-filter=ACDMRTUXB",
        "-z",
        mergeBaseSha,
        "--",
    ])).filter((file) => !inOutputDirectory(file));
    const untrackedFiles = parseNullList(gitBuffer(repositoryRoot, [
        "ls-files",
        "--others",
        "--exclude-standard",
        "-z",
    ])).filter((file) => !inOutputDirectory(file));
    const changedFiles = [...new Set([...tracked, ...untrackedFiles])].sort();
    const changedLines = await changedLineMap(repositoryRoot, mergeBaseSha, tracked, untrackedFiles);
    const untracked = new Map();
    for (const file of untrackedFiles) {
        const absolute = path.join(repositoryRoot, file);
        const metadata = await lstat(absolute);
        if (metadata.isSymbolicLink())
            untracked.set(file, { kind: "symlink", content: Buffer.from(await readlink(absolute)) });
        else if (metadata.isFile())
            untracked.set(file, { kind: "file", content: await readFile(absolute) });
    }
    const artifacts = {
        status: gitBuffer(repositoryRoot, ["status", "--short", "--branch", "--", ...REVIEW_SCOPE]),
        combinedDiff: gitBuffer(repositoryRoot, ["diff", "--no-ext-diff", "--no-textconv", "--binary", mergeBaseSha, "--", ...REVIEW_SCOPE]),
        indexDiff: gitBuffer(repositoryRoot, ["diff", "--cached", "--no-ext-diff", "--no-textconv", "--binary", mergeBaseSha, "--", ...REVIEW_SCOPE]),
        workingTreeDiff: gitBuffer(repositoryRoot, ["diff", "--no-ext-diff", "--no-textconv", "--binary", "--", ...REVIEW_SCOPE]),
        zeroContextDiff: gitBuffer(repositoryRoot, ["diff", "--no-ext-diff", "--no-textconv", "--unified=0", mergeBaseSha, "--", ...REVIEW_SCOPE]),
        diffStat: gitBuffer(repositoryRoot, ["diff", "--no-ext-diff", "--stat", mergeBaseSha, "--", ...REVIEW_SCOPE]),
        diffNumstat: gitBuffer(repositoryRoot, ["diff", "--no-ext-diff", "--numstat", mergeBaseSha, "--", ...REVIEW_SCOPE]),
        recentCommits: gitBuffer(repositoryRoot, ["log", "--oneline", "--decorate", `${mergeBaseSha}..${headSha}`]),
        untracked,
    };
    const dirty = artifacts.status.toString("utf8").split("\n").slice(1).join("\n").trim().length > 0;
    return {
        repositoryRoot,
        baseRef,
        baseSha,
        headSha,
        mergeBaseSha,
        diffHash: hashSnapshot(headSha, changedFiles, changedLines, artifacts),
        dirty,
        changedFiles,
        untrackedFiles,
        changedLines,
        artifacts,
    };
}
function safeArtifactPath(root, repositoryPath) {
    const destination = path.resolve(root, ...repositoryPath.split("/"));
    const relative = path.relative(path.resolve(root), destination);
    if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
        throw new FriendlyAdversaryError(`Unsafe repository path: ${repositoryPath}`, 2);
    }
    return destination;
}
export async function writeGitArtifacts(context, runDirectory) {
    const gitDirectory = path.join(runDirectory, "git");
    await ensureDirectory(gitDirectory);
    const artifacts = [
        ["status.txt", context.artifacts.status],
        ["diff.patch", context.artifacts.combinedDiff],
        ["diff-index.patch", context.artifacts.indexDiff],
        ["diff-working-tree.patch", context.artifacts.workingTreeDiff],
        ["diff-zero-context.patch", context.artifacts.zeroContextDiff],
        ["diff-stat.txt", context.artifacts.diffStat],
        ["diff-numstat.txt", context.artifacts.diffNumstat],
        ["recent-commits.txt", context.artifacts.recentCommits],
    ];
    for (const [file, content] of artifacts) {
        await writeFileAtomic(path.join(gitDirectory, file), content);
    }
    await writeFileAtomic(path.join(gitDirectory, "untracked-files.txt"), `${context.untrackedFiles.join("\n")}${context.untrackedFiles.length ? "\n" : ""}`);
    const untrackedRoot = path.join(gitDirectory, "untracked-files");
    for (const file of context.untrackedFiles) {
        const captured = context.artifacts.untracked.get(file);
        if (!captured || captured.kind !== "file")
            continue;
        await writeFileAtomic(safeArtifactPath(untrackedRoot, file), captured.content);
    }
    const baseFilesRoot = path.join(gitDirectory, "base-files");
    for (const file of context.changedFiles) {
        try {
            const content = gitBuffer(context.repositoryRoot, ["show", `${context.mergeBaseSha}:${file}`]);
            await writeFileAtomic(safeArtifactPath(baseFilesRoot, file), content);
        }
        catch {
            // New files have no base-side content.
        }
    }
    const instructionFiles = parseNullList(gitBuffer(context.repositoryRoot, [
        "ls-tree",
        "-r",
        "--name-only",
        "-z",
        context.mergeBaseSha,
    ])).filter((file) => {
        const basename = path.posix.basename(file);
        return basename === "AGENTS.md" || basename === "CLAUDE.md" || file === ".github/copilot-instructions.md";
    }).sort();
    const trustedRoot = path.join(gitDirectory, "trusted-instructions");
    for (const file of instructionFiles) {
        const content = gitBuffer(context.repositoryRoot, ["show", `${context.mergeBaseSha}:${file}`]);
        await writeFileAtomic(safeArtifactPath(trustedRoot, file), content);
    }
    await writeFileAtomic(path.join(gitDirectory, "trusted-instructions.txt"), `${instructionFiles.join("\n")}${instructionFiles.length ? "\n" : ""}`);
}
export async function snapshotStillMatches(context) {
    if (!await pathExists(context.repositoryRoot))
        return false;
    const current = await inspectGit(context.repositoryRoot, context.baseSha);
    return current.headSha === context.headSha && current.diffHash === context.diffHash;
}
//# sourceMappingURL=git.js.map