import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { access, lstat, readFile, readdir, realpath, rm } from "node:fs/promises";
import path, { delimiter } from "node:path";
import { fileURLToPath } from "node:url";
import { runCaptured } from "./command.js";
import { PYTHON_EXTENSIONS, TYPESCRIPT_EXTENSIONS } from "./constants.js";
import { FriendlyAdversaryError } from "./errors.js";
import { ensureDirectory, pathExists, writeFileAtomic, writeJsonAtomic } from "./fs-utils.js";
import { runOxlintWasm } from "./oxlint-wasm.js";
import { runRuffWasm, RUFF_WASM_UPSTREAM_COMMIT, RUFF_WASM_UPSTREAM_VERSION } from "./ruff-wasm.js";
import { validateSemgrepRunOutput } from "./semgrep-output.js";
import { ShutdownGuard } from "./shutdown.js";
const RUNTIME_DIRECTORY = path.dirname(fileURLToPath(import.meta.url));
const AUDIT_ANALYZER_BATCH_BYTES = 32 * 1024 * 1024;
const AUDIT_ANALYZER_BATCH_FILES = 400;
async function analyzerBatches(repo, files, enabled) {
    if (!files.length)
        return [];
    if (!enabled)
        return [files];
    const batches = [];
    let current = [];
    let currentBytes = 0;
    for (const file of files) {
        const bytes = Number((await lstat(path.join(repo, ...file.split("/")))).size);
        if (current.length && (current.length >= AUDIT_ANALYZER_BATCH_FILES || currentBytes + bytes > AUDIT_ANALYZER_BATCH_BYTES)) {
            batches.push(current);
            current = [];
            currentBytes = 0;
        }
        current.push(file);
        currentBytes += bytes;
    }
    if (current.length)
        batches.push(current);
    return batches;
}
function batchedToolName(name, index, count) {
    return count === 1 ? name : `${name}-${String(index + 1).padStart(3, "0")}`;
}
async function executableOnPath(name) {
    const bases = name.includes(path.sep)
        ? [name]
        : (process.env.PATH ?? "").split(delimiter).filter(Boolean).map((directory) => path.join(directory, name));
    const candidates = process.platform === "win32"
        ? bases.flatMap((candidate) => path.extname(candidate) ? [candidate] : [`${candidate}.COM`, `${candidate}.EXE`])
        : bases;
    for (const candidate of candidates) {
        try {
            await access(candidate, constants.X_OK);
            return realpath(candidate);
        }
        catch {
            // Continue searching.
        }
    }
    return undefined;
}
async function fileOnPath(name, extensions) {
    const bases = name.includes(path.sep)
        ? [name]
        : (process.env.PATH ?? "").split(delimiter).filter(Boolean).map((directory) => path.join(directory, name));
    const candidates = bases.flatMap((candidate) => path.extname(candidate)
        ? [candidate]
        : extensions.map((extension) => `${candidate}${extension}`));
    for (const candidate of candidates) {
        try {
            await access(candidate, constants.F_OK);
            return realpath(candidate);
        }
        catch {
            // Continue searching.
        }
    }
    return undefined;
}
export function windowsNodeCommandShimTarget(content) {
    const targetPattern = /["']?%(?:~dp0|dp0%)[\\/]([^"'\r\n]*?\.(?:cjs|mjs|js))["']?/giu;
    for (const match of content.matchAll(targetPattern)) {
        const relativeTarget = match[1];
        if (relativeTarget)
            return relativeTarget;
    }
    return undefined;
}
async function windowsNodeCommandShimInvocation(name) {
    if (process.platform !== "win32")
        return undefined;
    const shim = await fileOnPath(name, [".CMD"]);
    if (!shim)
        return undefined;
    const content = await readFile(shim, "utf8").catch(() => "");
    if (!content || Buffer.byteLength(content) > 64 * 1024)
        return undefined;
    const relativeTarget = windowsNodeCommandShimTarget(content);
    if (relativeTarget) {
        const resolved = await realpath(path.resolve(path.dirname(shim), relativeTarget)).catch(() => undefined);
        if (!resolved || !isInside(path.dirname(path.dirname(shim)), resolved))
            return undefined;
        const metadata = await lstat(resolved).catch(() => undefined);
        if (!metadata?.isFile() || metadata.isSymbolicLink())
            return undefined;
        return { executable: process.execPath, argsPrefix: [resolved] };
    }
    return undefined;
}
async function npmInvocation() {
    if (process.platform !== "win32") {
        const executable = await executableOnPath("npm");
        return executable ? { executable, argsPrefix: [] } : undefined;
    }
    const candidates = [
        process.env.npm_execpath
            ? path.join(path.dirname(process.env.npm_execpath), "npm-cli.js")
            : undefined,
        path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js"),
    ].filter((candidate) => candidate !== undefined);
    for (const candidate of candidates) {
        const resolved = await realpath(candidate).catch(() => undefined);
        if (resolved)
            return { executable: process.execPath, argsPrefix: [resolved] };
    }
    return undefined;
}
function isInside(parent, child) {
    const relative = path.relative(path.resolve(parent), path.resolve(child));
    return relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}
async function localNodeBinInvocation(repo, name) {
    const modules = path.join(repo, "node_modules");
    if (!await pathExists(path.join(modules, ".bin", `${name}.cmd`)))
        return undefined;
    const packageDirectories = [];
    for (const entry of await readdir(modules, { withFileTypes: true }).catch(() => [])) {
        if (!entry.isDirectory() || entry.name === ".bin")
            continue;
        const candidate = path.join(modules, entry.name);
        if (!entry.name.startsWith("@")) {
            packageDirectories.push(candidate);
            continue;
        }
        for (const scoped of await readdir(candidate, { withFileTypes: true }).catch(() => [])) {
            if (scoped.isDirectory())
                packageDirectories.push(path.join(candidate, scoped.name));
        }
    }
    for (const packageDirectory of packageDirectories) {
        try {
            const manifest = JSON.parse(await readFile(path.join(packageDirectory, "package.json"), "utf8"));
            const target = typeof manifest.bin === "string"
                ? path.basename(manifest.name ?? "") === name ? manifest.bin : undefined
                : manifest.bin?.[name];
            if (!target)
                continue;
            const resolved = await realpath(path.resolve(packageDirectory, target));
            if (!isInside(packageDirectory, resolved) || !(await lstat(resolved)).isFile())
                continue;
            return { executable: process.execPath, argsPrefix: [resolved] };
        }
        catch {
            // Ignore malformed or incomplete packages and continue searching.
        }
    }
    return undefined;
}
function portableRelative(parent, child) {
    return path.relative(parent, child).split(path.sep).join("/");
}
async function repositoryInvocation(repo, name) {
    const repoReal = await realpath(repo).catch(() => path.resolve(repo));
    if (name === "npm")
        return npmInvocation();
    if (name === "pnpm" || name === "yarn" || name === "bun") {
        const commandShim = await windowsNodeCommandShimInvocation(name);
        if (commandShim)
            return commandShim;
        const manager = await executableOnPath(name);
        if (manager)
            return { executable: manager, argsPrefix: [] };
    }
    const pythonDirectory = process.platform === "win32" ? "Scripts" : "bin";
    const pythonLocal = await executableOnPath(path.join(repoReal, ".venv", pythonDirectory, name));
    if (pythonLocal)
        return { executable: pythonLocal, argsPrefix: [] };
    if (process.platform === "win32") {
        const nodeBin = await localNodeBinInvocation(repoReal, name);
        if (nodeBin)
            return nodeBin;
    }
    else {
        const nodeLocal = await executableOnPath(path.join(repoReal, "node_modules", ".bin", name));
        if (nodeLocal)
            return { executable: nodeLocal, argsPrefix: [] };
    }
    return undefined;
}
async function repositoryNodeInvocationFrom(repo, startDirectory, name) {
    const repoReal = await realpath(repo);
    let directory = await realpath(startDirectory).catch(() => path.resolve(startDirectory));
    while (isInside(repoReal, directory)) {
        if (process.platform === "win32") {
            const invocation = await localNodeBinInvocation(directory, name);
            if (invocation)
                return invocation;
        }
        else {
            const executable = await executableOnPath(path.join(directory, "node_modules", ".bin", name));
            if (executable)
                return { executable, argsPrefix: [] };
        }
        if (directory === repoReal)
            break;
        directory = path.dirname(directory);
    }
    return undefined;
}
async function anyFile(repo, files) {
    for (const file of files)
        if (await pathExists(path.join(repo, file)))
            return true;
    return false;
}
async function reviewableFiles(repo, files, extensions) {
    const selected = [];
    for (const file of files) {
        if (!extensions.has(path.extname(file).toLowerCase()))
            continue;
        try {
            const metadata = await lstat(path.join(repo, file));
            if (metadata.isFile() && !metadata.isSymbolicLink())
                selected.push(file);
        }
        catch {
            // Deleted files remain Git evidence but cannot be passed to a working-tree analyzer.
        }
    }
    return selected;
}
export async function analyzerReadableRoots(...roots) {
    const requested = roots.map((root) => path.resolve(root));
    const canonical = await Promise.all(requested.map((root) => realpath(root)));
    return [...new Set([...requested, ...canonical])].sort();
}
async function generatedBundleOmissions(repo, assetsRoot, mergeBaseSha, files) {
    const semgrepPrefixes = [
        "engines/semgrep-wasm/",
        "platforms/claude-code/plugins/friendly-adversary/skills/pr-review/engines/semgrep-wasm/",
        "platforms/codex/plugins/friendly-adversary/skills/pr-review/engines/semgrep-wasm/",
    ];
    const ruffPrefixes = [
        "engines/ruff-wasm/",
        "platforms/claude-code/plugins/friendly-adversary/skills/pr-review/engines/ruff-wasm/",
        "platforms/codex/plugins/friendly-adversary/skills/pr-review/engines/ruff-wasm/",
    ];
    const semgrepCandidates = files.filter((file) => semgrepPrefixes.some((prefix) => file.startsWith(prefix)
        && /^runtime\/(?:engine|python|typescript)\/index\.cjs$/u.test(file.slice(prefix.length))));
    const ruffCandidates = files.filter((file) => ruffPrefixes.some((prefix) => file.startsWith(prefix)
        && file.slice(prefix.length) === "runtime/ruff_wasm.js"));
    if (semgrepCandidates.length === 0 && ruffCandidates.length === 0)
        return [];
    const [repoReal, assetsReal] = await Promise.all([realpath(repo), realpath(assetsRoot)]);
    const assetsFromRepo = path.relative(repoReal, assetsReal);
    const selfReview = assetsFromRepo === ""
        || (!assetsFromRepo.startsWith(`..${path.sep}`) && !path.isAbsolute(assetsFromRepo));
    const attestationRoot = assetsFromRepo === "" ? "" : assetsFromRepo.split(path.sep).join("/");
    if (selfReview && !/^[a-f0-9]{40}$/u.test(mergeBaseSha)) {
        throw new FriendlyAdversaryError("Self-review generated-bundle attestations require a full merge-base commit", 2);
    }
    const trustedAsset = async (relative) => {
        if (!selfReview) {
            return {
                content: await readFile(path.join(assetsRoot, ...relative.split("/"))),
                source: `installed-assets:${relative}`,
            };
        }
        const repositoryRelative = attestationRoot ? `${attestationRoot}/${relative}` : relative;
        try {
            return {
                content: execFileSync("git", [
                    "-C", repo,
                    "-c", "core.hooksPath=/dev/null",
                    "-c", "core.fsmonitor=false",
                    "show", `${mergeBaseSha}:${repositoryRelative}`,
                ], { maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] }),
                source: `merge-base:${mergeBaseSha}:${repositoryRelative}`,
            };
        }
        catch (error) {
            throw new FriendlyAdversaryError(`Cannot read trusted merge-base attestation ${repositoryRelative}: ${error instanceof Error ? error.message : String(error)}`, 2);
        }
    };
    const omissions = [];
    if (semgrepCandidates.length) {
        const semgrepManifestRelative = "engines/semgrep-wasm/runtime-manifest.json";
        const trustedSemgrepManifest = await trustedAsset(semgrepManifestRelative);
        const manifest = JSON.parse(trustedSemgrepManifest.content.toString("utf8"));
        const generatedRuntimeFiles = new Map((manifest.files ?? [])
            .filter((entry) => (typeof entry.path === "string"
            && /^runtime\/(?:engine|python|typescript)\/index\.cjs$/u.test(entry.path)
            && Number.isSafeInteger(entry.bytes)
            && typeof entry.sha256 === "string"
            && /^[a-f0-9]{64}$/u.test(entry.sha256)))
            .map((entry) => [entry.path, entry]));
        if (generatedRuntimeFiles.size !== 3) {
            throw new FriendlyAdversaryError("The trusted Semgrep runtime manifest does not identify exactly three generated JavaScript bundles", 2);
        }
        for (const file of semgrepCandidates) {
            const prefix = semgrepPrefixes.find((candidate) => file.startsWith(candidate));
            if (!prefix)
                continue;
            const runtimeManifestPath = file.slice(prefix.length);
            const expected = generatedRuntimeFiles.get(runtimeManifestPath);
            if (!expected)
                continue;
            const absolute = path.join(repo, ...file.split("/"));
            const metadata = await lstat(absolute).catch(() => undefined);
            if (!metadata?.isFile() || metadata.isSymbolicLink() || metadata.size !== expected.bytes)
                continue;
            const content = await readFile(absolute);
            const digest = createHash("sha256").update(content).digest("hex");
            if (digest !== expected.sha256)
                continue;
            omissions.push({
                path: file,
                bytes: content.byteLength,
                sha256: digest,
                runtimeManifestPath,
                attestationFile: semgrepManifestRelative,
                attestationSource: trustedSemgrepManifest.source,
                reason: "exact-generated-analyzer-runtime",
            });
        }
    }
    if (ruffCandidates.length) {
        const ruffLockRelative = "engines/ruff-wasm/upstream-lock.json";
        const trustedRuffLock = await trustedAsset(ruffLockRelative);
        const ruffLock = JSON.parse(trustedRuffLock.content.toString("utf8"));
        const expectedRuffSha256 = ruffLock.runtime?.["ruff_wasm.js"];
        if (typeof expectedRuffSha256 !== "string" || !/^[a-f0-9]{64}$/u.test(expectedRuffSha256)) {
            throw new FriendlyAdversaryError("The trusted Ruff runtime lock does not attest ruff_wasm.js", 2);
        }
        const trustedRuffContent = (await trustedAsset("engines/ruff-wasm/runtime/ruff_wasm.js")).content;
        if (createHash("sha256").update(trustedRuffContent).digest("hex") !== expectedRuffSha256) {
            throw new FriendlyAdversaryError("The trusted Ruff JavaScript runtime differs from its lock", 2);
        }
        for (const file of ruffCandidates) {
            const prefix = ruffPrefixes.find((candidate) => file.startsWith(candidate));
            if (!prefix || file.slice(prefix.length) !== "runtime/ruff_wasm.js")
                continue;
            const absolute = path.join(repo, ...file.split("/"));
            const metadata = await lstat(absolute).catch(() => undefined);
            if (!metadata?.isFile() || metadata.isSymbolicLink() || metadata.size !== trustedRuffContent.byteLength)
                continue;
            const content = await readFile(absolute);
            const digest = createHash("sha256").update(content).digest("hex");
            if (digest !== expectedRuffSha256)
                continue;
            omissions.push({
                path: file,
                bytes: content.byteLength,
                sha256: digest,
                runtimeManifestPath: "runtime/ruff_wasm.js",
                attestationFile: ruffLockRelative,
                attestationSource: trustedRuffLock.source,
                reason: "exact-generated-analyzer-runtime",
            });
        }
    }
    return omissions.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
}
async function nearestTypeScriptConfig(repo, file) {
    const repositoryRoot = path.resolve(repo);
    let directory = path.dirname(path.resolve(repo, file));
    const testFile = /(?:^|[.-])(?:spec|test)\.[^.]+$/u.test(path.basename(file));
    while (isInside(repositoryRoot, directory)) {
        const candidates = testFile
            ? ["tsconfig.spec.json", "tsconfig.test.json", "tsconfig.lib.json", "tsconfig.app.json", "tsconfig.json"]
            : ["tsconfig.lib.json", "tsconfig.app.json", "tsconfig.json"];
        for (const candidate of candidates) {
            const config = path.join(directory, candidate);
            if (await pathExists(config))
                return path.relative(repositoryRoot, config).split(path.sep).join("/");
        }
        if (directory === repositoryRoot)
            break;
        directory = path.dirname(directory);
    }
    return undefined;
}
async function typescriptConfigs(repo, files) {
    const configs = new Set();
    for (const file of files) {
        if (!TYPESCRIPT_EXTENSIONS.has(path.extname(file).toLowerCase()))
            continue;
        const config = await nearestTypeScriptConfig(repo, file);
        if (config)
            configs.add(config);
    }
    return [...configs].sort((left, right) => left < right ? -1 : left > right ? 1 : 0);
}
async function typescriptPlans(input, files) {
    const configs = await typescriptConfigs(input.repo, files);
    if (!configs.length)
        return [];
    const plans = [];
    for (const [index, config] of configs.entries()) {
        const name = configs.length === 1 ? "typescript" : `typescript-project-${index + 1}`;
        const tsc = await repositoryNodeInvocationFrom(input.repo, path.dirname(path.join(input.repo, config)), "tsc");
        if (!tsc) {
            plans.push(skipped(name, `TypeScript project ${config} was found, but its repository-installed TypeScript compiler is unavailable`, true));
            continue;
        }
        const buildInfo = path.join(input.scratchDirectory ?? path.join(input.runDirectory, "volatile"), `${name}.tsbuildinfo`);
        plans.push({
            name,
            projectControlled: true,
            executable: tsc.executable,
            args: [...tsc.argsPrefix, "--noEmit", "--pretty", "false", "--incremental", "--tsBuildInfoFile", buildInfo, "--project", config],
            versionArgs: [...tsc.argsPrefix, "--version"],
            findingExitCodes: [0, 1, 2],
            required: true,
        });
    }
    return plans;
}
async function pythonProjectPlans(input, files) {
    const pyprojectPath = path.join(input.repo, "pyproject.toml");
    const pyproject = await readFile(pyprojectPath, "utf8").catch(() => "");
    const setupConfig = await readFile(path.join(input.repo, "setup.cfg"), "utf8").catch(() => "");
    const toxConfig = await readFile(path.join(input.repo, "tox.ini"), "utf8").catch(() => "");
    const pytestConfigured = /^\[tool\.pytest(?:\.|\])/mu.test(pyproject)
        || /^\[tool:pytest\]/mu.test(setupConfig)
        || /^\[pytest\]/mu.test(toxConfig)
        || await anyFile(input.repo, ["pytest.ini"]);
    const mypyConfigured = /^\[tool\.mypy\]/mu.test(pyproject)
        || /^\[mypy\]/mu.test(setupConfig)
        || /^\[mypy\]/mu.test(toxConfig)
        || await anyFile(input.repo, ["mypy.ini", ".mypy.ini"]);
    const plans = [];
    if (pytestConfigured) {
        const pytest = await repositoryInvocation(input.repo, "pytest");
        plans.push(pytest
            ? {
                name: "repository-pytest",
                projectControlled: true,
                executable: pytest.executable,
                args: [...pytest.argsPrefix],
                versionArgs: [...pytest.argsPrefix, "--version"],
                findingExitCodes: [0, 1, 5],
                required: true,
            }
            : skipped("repository-pytest", "pytest is configured but unavailable in the repository's installed virtual environment", true));
    }
    if (mypyConfigured) {
        const mypy = await repositoryInvocation(input.repo, "mypy");
        plans.push(mypy
            ? {
                name: "repository-mypy",
                projectControlled: true,
                executable: mypy.executable,
                args: [...mypy.argsPrefix, ...files],
                versionArgs: [...mypy.argsPrefix, "--version"],
                findingExitCodes: [0, 1],
                required: true,
            }
            : skipped("repository-mypy", "mypy is configured but unavailable in the repository's installed virtual environment", true));
    }
    return plans;
}
function skipped(name, reason, required = false) {
    return { name, args: [], versionArgs: [], findingExitCodes: [], reason, required };
}
function isJavaScriptTestFile(file) {
    return /(?:^|[.-])(?:spec|test)\.[^.]+$/u.test(path.basename(file));
}
function focusedTestArguments(script, packageDirectory, input) {
    if (!/^\s*(?:bun\s+test|vitest(?:\s+run)?|jest|node\s+--test)\b/u.test(script))
        return [];
    const tests = input.changedFiles
        .filter(isJavaScriptTestFile)
        .map((file) => path.resolve(input.repo, file))
        .filter((file) => isInside(packageDirectory, file))
        .map((file) => path.relative(packageDirectory, file).split(path.sep).join("/"))
        .sort();
    return tests.length ? ["--", ...tests] : [];
}
async function repositoryScriptPlans(input) {
    if (!await pathExists(path.join(input.repo, "package.json")))
        return [];
    let rootManifest;
    try {
        rootManifest = JSON.parse(await readFile(path.join(input.repo, "package.json"), "utf8"));
    }
    catch {
        return [skipped("repository-scripts", "The working-tree package.json is not valid JSON", true)];
    }
    const declared = typeof rootManifest.packageManager === "string"
        ? /^(npm|pnpm|yarn|bun)@/u.exec(rootManifest.packageManager)?.[1]
        : undefined;
    if (typeof rootManifest.packageManager === "string" && !declared) {
        return [skipped("repository-scripts", `Unsupported packageManager declaration: ${rootManifest.packageManager}`, true)];
    }
    const lockManagers = new Set();
    if (await pathExists(path.join(input.repo, "pnpm-lock.yaml")))
        lockManagers.add("pnpm");
    if (await pathExists(path.join(input.repo, "yarn.lock")))
        lockManagers.add("yarn");
    if (await pathExists(path.join(input.repo, "bun.lock")) || await pathExists(path.join(input.repo, "bun.lockb")))
        lockManagers.add("bun");
    if (await pathExists(path.join(input.repo, "package-lock.json")) || await pathExists(path.join(input.repo, "npm-shrinkwrap.json")))
        lockManagers.add("npm");
    if (!declared && lockManagers.size > 1) {
        return [skipped("repository-scripts", `Multiple package-manager lockfile families found: ${[...lockManagers].sort().join(", ")}`, true)];
    }
    const manager = declared ?? [...lockManagers][0] ?? "npm";
    const invocation = await repositoryInvocation(input.repo, manager);
    if (!invocation)
        return [skipped("repository-scripts", `${manager} is required by the repository but is not installed`, true)];
    const packageDirectories = new Set([path.resolve(input.repo)]);
    for (const changedFile of input.changedFiles) {
        let directory = path.dirname(path.resolve(input.repo, changedFile));
        while (isInside(path.resolve(input.repo), directory) && directory !== path.resolve(input.repo)) {
            if (await pathExists(path.join(directory, "package.json"))) {
                packageDirectories.add(directory);
                break;
            }
            directory = path.dirname(directory);
        }
    }
    const plans = [];
    for (const directory of [...packageDirectories].sort()) {
        const relative = path.relative(input.repo, directory).split(path.sep).join("/");
        let manifest;
        try {
            manifest = directory === path.resolve(input.repo)
                ? rootManifest
                : JSON.parse(await readFile(path.join(directory, "package.json"), "utf8"));
        }
        catch {
            const label = relative || "root";
            plans.push(skipped(`repository-${label.replaceAll(/[^A-Za-z0-9]+/gu, "-")}-scripts`, `${label}/package.json is not valid JSON`, true));
            continue;
        }
        const scripts = Object.fromEntries(Object.entries(manifest.scripts ?? {}).filter((entry) => typeof entry[1] === "string"));
        for (const name of ["lint", "typecheck", "type-check", "test", "build", "validate"]) {
            if (typeof scripts[name] !== "string")
                continue;
            const scope = relative ? `${relative.replaceAll(/[^A-Za-z0-9]+/gu, "-")}-` : "";
            plans.push({
                name: `repository-${scope}${name}`,
                projectControlled: true,
                scriptKind: name,
                executable: invocation.executable,
                cwd: directory,
                args: [
                    ...invocation.argsPrefix,
                    "run",
                    name,
                    ...(name === "test" ? focusedTestArguments(scripts[name], directory, input) : []),
                ],
                versionArgs: [...invocation.argsPrefix, "--version"],
                findingExitCodes: [0, 1, 2],
                required: true,
            });
        }
    }
    return plans;
}
async function changedSymbols(input, files) {
    const symbols = new Set();
    const patterns = [
        /\b(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g,
        /\b(?:class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g,
        /^\s*(?:async\s+)?def\s+([A-Za-z_]\w*)/gm,
        /^\s*class\s+([A-Za-z_]\w*)/gm,
    ];
    for (const file of files) {
        try {
            const content = await readFile(path.join(input.repo, file), "utf8");
            for (const pattern of patterns) {
                for (const match of content.matchAll(pattern)) {
                    if (match[1] && match[1].length >= 3)
                        symbols.add(match[1]);
                    if (symbols.size >= 100)
                        return [...symbols].sort();
                }
            }
        }
        catch {
            // Binary, deleted, and unreadable files do not produce symbol hints.
        }
    }
    return [...symbols].sort();
}
const PLATFORM_SKILL_ROOTS = [
    "platforms/codex/plugins/friendly-adversary/skills/pr-review",
    "platforms/claude-code/plugins/friendly-adversary/skills/pr-review",
];
const SEARCH_REPLICA_EXTENSIONS = new Set([
    ".cjs", ".js", ".json", ".jsonc", ".jsx", ".md", ".mjs", ".py", ".toml", ".ts", ".tsx", ".txt", ".yaml", ".yml",
]);
async function regularFileDigest(file) {
    try {
        if (!(await lstat(file)).isFile())
            return undefined;
        return createHash("sha256").update(await readFile(file)).digest("hex");
    }
    catch {
        return undefined;
    }
}
async function replicaFiles(repo, relativeRoot, current = relativeRoot) {
    const files = [];
    for (const entry of await readdir(path.join(repo, ...current.split("/")), { withFileTypes: true }).catch(() => [])) {
        const relative = `${current}/${entry.name}`;
        if (entry.isDirectory())
            files.push(...await replicaFiles(repo, relativeRoot, relative));
        else if (entry.isFile() && SEARCH_REPLICA_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
            files.push(relative);
    }
    return files;
}
function canonicalReplicaPath(relative) {
    if (/^(?:engines|rules|third-party)\//u.test(relative))
        return relative;
    if (relative.startsWith("scripts/runtime/wasm/oxlint/"))
        return `wasm/oxlint/${relative.slice("scripts/runtime/wasm/oxlint/".length)}`;
    const lens = /^references\/lenses\/(.+)\.md$/u.exec(relative)?.[1];
    if (lens)
        return `lenses/${lens}/LENS.md`;
    if (relative === "LICENSE" || relative === "LICENSING.md")
        return relative;
    return undefined;
}
async function generatedReplicaSearchExclusions(repo) {
    const filesByRoot = new Map();
    for (const root of PLATFORM_SKILL_ROOTS) {
        const files = await replicaFiles(repo, root);
        filesByRoot.set(root, new Map(files.map((file) => [file.slice(root.length + 1), file])));
    }
    const exclusions = new Set();
    const allRelative = new Set([...filesByRoot.values()].flatMap((files) => [...files.keys()]));
    for (const relative of allRelative) {
        const replicas = PLATFORM_SKILL_ROOTS.map((root) => filesByRoot.get(root)?.get(relative)).filter((file) => file !== undefined);
        const replicaDigests = await Promise.all(replicas.map((file) => regularFileDigest(path.join(repo, ...file.split("/")))));
        const canonical = canonicalReplicaPath(relative);
        const canonicalDigest = canonical ? await regularFileDigest(path.join(repo, ...canonical.split("/"))) : undefined;
        if (canonicalDigest !== undefined && replicaDigests.every((digest) => digest === canonicalDigest)) {
            for (const replica of replicas)
                exclusions.add(replica);
            continue;
        }
        const retainedDigest = replicaDigests[0];
        if (retainedDigest === undefined)
            continue;
        for (let index = 1; index < replicas.length; index += 1) {
            if (replicaDigests[index] === retainedDigest)
                exclusions.add(replicas[index]);
        }
    }
    return [...exclusions].sort();
}
async function planTools(input, repositoryPlans) {
    const reviewableTypeScript = await reviewableFiles(input.repo, input.changedFiles, TYPESCRIPT_EXTENSIONS);
    const omissions = await generatedBundleOmissions(input.repo, input.assetsRoot, input.mergeBaseSha, reviewableTypeScript);
    const omittedPaths = new Set(omissions.map((entry) => entry.path));
    const relevantChangedFiles = input.changedFiles.filter((file) => !omittedPaths.has(file));
    const ts = reviewableTypeScript.filter((file) => !omittedPaths.has(file));
    const py = await reviewableFiles(input.repo, input.changedFiles, PYTHON_EXTENSIONS);
    const tsApplicable = relevantChangedFiles.some((file) => TYPESCRIPT_EXTENSIONS.has(path.extname(file).toLowerCase()));
    const pyApplicable = relevantChangedFiles.some((file) => PYTHON_EXTENSIONS.has(path.extname(file).toLowerCase()));
    const plans = [];
    const repositoryLintConfigured = repositoryPlans.some((plan) => plan.scriptKind === "lint");
    const repositoryTypecheckConfigured = repositoryPlans.some((plan) => plan.scriptKind === "typecheck" || plan.scriptKind === "type-check");
    if (omissions.length) {
        plans.push({
            name: "generated-bundle-omissions",
            internal: "generated-bundle-omissions",
            omissions,
            args: [],
            versionArgs: [],
            findingExitCodes: [0],
            required: true,
        });
    }
    const ripgrepRunner = path.join(RUNTIME_DIRECTORY, "ripgrep-wasm-cli.js");
    const ripgrepRepository = await realpath(input.repo);
    const runtimeAssetsRoot = path.resolve(RUNTIME_DIRECTORY, "../..");
    const ripgrepReadable = await analyzerReadableRoots(input.assetsRoot, input.repo, runtimeAssetsRoot);
    const ripgrepPermissionArgs = [
        "--permission",
        "--allow-wasi",
        ...ripgrepReadable.map((target) => `--allow-fs-read=${target}`),
    ];
    const ripgrepPrefix = [
        "--no-warnings",
        ...ripgrepPermissionArgs,
        ripgrepRunner,
        "--repo",
        ripgrepRepository,
        "--",
    ];
    plans.push({
        name: "repository-file-index",
        executable: process.execPath,
        args: [...ripgrepPrefix, "--sort", "path", "--files", "--hidden", "--glob", "!.git/**", "--glob", "!.friendly-adversary/**", "--glob", "!node_modules/**"],
        versionArgs: [...ripgrepPrefix, "--version"],
        extension: "txt",
        findingExitCodes: [0],
        required: true,
    });
    const symbols = await changedSymbols(input, [...ts, ...py]);
    if (symbols.length) {
        const replicaExclusions = await generatedReplicaSearchExclusions(input.repo);
        plans.push({
            name: "repository-symbol-search",
            executable: process.execPath,
            args: [
                ...ripgrepPrefix,
                "--sort", "path", "--json", "--word-regexp",
                ...symbols.flatMap((symbol) => ["-e", symbol]),
                "--glob", "!.friendly-adversary/**",
                "--glob", "!node_modules/**",
                ...replicaExclusions.flatMap((file) => ["--glob", `!${file}`]),
                "--", ".",
            ],
            versionArgs: [...ripgrepPrefix, "--version"],
            extension: "json",
            findingExitCodes: [0, 1],
            required: true,
        });
    }
    if (ts.length) {
        const batches = await analyzerBatches(input.repo, ts, input.includeRepositoryTools === false);
        plans.push(...batches.map((files, index) => ({
            name: batchedToolName("oxlint-wasm", index, batches.length),
            internal: "oxlint-wasm",
            files,
            args: [],
            versionArgs: [],
            extension: "json",
            findingExitCodes: [0, 1],
            required: true,
        })));
        if (input.includeRepositoryTools !== false && !repositoryLintConfigured) {
            const oxlintConfig = await anyFile(input.repo, [".oxlintrc.json", ".oxlintrc.jsonc", "oxlint.config.ts", "oxlint.config.mts"]);
            const biomeConfig = await anyFile(input.repo, ["biome.json", "biome.jsonc"]);
            const eslintConfig = await anyFile(input.repo, [
                "eslint.config.js", "eslint.config.mjs", "eslint.config.cjs", ".eslintrc", ".eslintrc.json", ".eslintrc.js", ".eslintrc.cjs",
            ]);
            if (oxlintConfig) {
                const oxlint = await repositoryInvocation(input.repo, "oxlint");
                plans.push(oxlint
                    ? { name: "oxlint", projectControlled: true, executable: oxlint.executable, args: [...oxlint.argsPrefix, "--format", "json", "--", ...ts], versionArgs: [...oxlint.argsPrefix, "--version"], extension: "json", findingExitCodes: [0, 1], required: true }
                    : skipped("oxlint", "Oxlint is configured but unavailable", true));
            }
            if (biomeConfig) {
                const biome = await repositoryInvocation(input.repo, "biome");
                plans.push(biome
                    ? { name: "biome", projectControlled: true, executable: biome.executable, args: [...biome.argsPrefix, "lint", "--reporter=json", "--", ...ts], versionArgs: [...biome.argsPrefix, "--version"], extension: "json", findingExitCodes: [0, 1], required: true }
                    : skipped("biome", "Biome is configured but unavailable", true));
            }
            if (eslintConfig) {
                const eslint = await repositoryInvocation(input.repo, "eslint");
                plans.push(eslint
                    ? { name: "eslint", projectControlled: true, executable: eslint.executable, args: [...eslint.argsPrefix, "--format", "json", "--", ...ts], versionArgs: [...eslint.argsPrefix, "--version"], extension: "json", findingExitCodes: [0, 1], required: true }
                    : skipped("eslint", "ESLint is configured but unavailable", true));
            }
        }
        if (input.includeRepositoryTools !== false && !repositoryTypecheckConfigured)
            plans.push(...await typescriptPlans(input, ts));
    }
    if (tsApplicable && !ts.length) {
        plans.push(skipped("typescript-linter", "All changed TypeScript or JavaScript paths are deleted or non-regular files", true));
        if (input.includeRepositoryTools !== false && !repositoryTypecheckConfigured)
            plans.push(...await typescriptPlans(input, relevantChangedFiles));
    }
    if (py.length) {
        const batches = await analyzerBatches(input.repo, py, input.includeRepositoryTools === false);
        plans.push(...batches.map((files, index) => ({
            name: batchedToolName("ruff-wasm", index, batches.length),
            internal: "ruff-wasm",
            files,
            args: [],
            versionArgs: [],
            extension: "json",
            findingExitCodes: [0, 1],
            required: true,
        })));
        if (input.includeRepositoryTools !== false)
            plans.push(...await pythonProjectPlans(input, py));
    }
    if (pyApplicable && !py.length) {
        plans.push(skipped("ruff-wasm", "All changed Python paths are deleted or non-regular files", true));
    }
    if (ts.length || py.length) {
        const runner = path.join(RUNTIME_DIRECTORY, "semgrep-wasm-cli.js");
        const sandbox = path.join(input.scratchDirectory ?? path.join(input.runDirectory, "volatile"), "semgrep");
        await ensureDirectory(sandbox);
        const sandboxReal = await realpath(sandbox);
        const readable = await analyzerReadableRoots(input.assetsRoot, input.repo, runtimeAssetsRoot);
        const permissionArgs = [
            "--permission",
            "--allow-worker",
            ...readable.map((target) => `--allow-fs-read=${target}`),
            `--allow-fs-write=${sandboxReal}`,
        ];
        const files = [...ts, ...py];
        const batches = await analyzerBatches(input.repo, files, input.includeRepositoryTools === false);
        plans.push(...batches.map((batch, index) => ({
            name: batchedToolName("semgrep", index, batches.length),
            outputContract: "semgrep-wasm",
            files: batch,
            executable: process.execPath,
            args: [...permissionArgs, "--max-old-space-size=8192", runner, "scan", "--metrics=off", "--config", path.join(input.assetsRoot, "rules", "semgrep"), "--json", "--", ...batch],
            versionArgs: ["--permission", ...readable.map((target) => `--allow-fs-read=${target}`), "--max-old-space-size=8192", runner, "--version"],
            extension: "json",
            findingExitCodes: [0],
            ...(index === batches.length - 1 ? { cleanupDirectory: sandbox } : {}),
            env: { TMPDIR: sandboxReal, TEMP: sandboxReal, TMP: sandboxReal },
            required: true,
        })));
    }
    else if (tsApplicable || pyApplicable) {
        plans.push(skipped("semgrep", "All changed language paths are deleted or non-regular files", true));
    }
    return [...repositoryPlans, ...plans];
}
async function collectInventory(input) {
    const directory = path.join(input.runDirectory, "deterministic", "inventory");
    const candidates = [
        "package.json", "tsconfig.json", "pyproject.toml", "pytest.ini", "mypy.ini", ".mypy.ini", "setup.cfg", "tox.ini", "requirements.txt", "uv.lock", "package-lock.json", "npm-shrinkwrap.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb", "biome.json", "biome.jsonc", "eslint.config.js", "eslint.config.mjs", ".eslintrc.json",
    ];
    const found = [];
    const failures = [];
    for (const candidate of candidates) {
        const source = path.join(input.repo, candidate);
        let metadata;
        try {
            metadata = await lstat(source);
        }
        catch (error) {
            if (error.code === "ENOENT")
                continue;
            failures.push(`${candidate}: ${error instanceof Error ? error.message : String(error)}`);
            continue;
        }
        if (!metadata.isFile() || metadata.isSymbolicLink())
            continue;
        try {
            found.push(candidate);
            await writeFileAtomic(path.join(directory, "native", candidate), await readFile(source));
        }
        catch (error) {
            found.pop();
            failures.push(`${candidate}: ${error instanceof Error ? error.message : String(error)}`);
        }
    }
    await writeJsonAtomic(path.join(directory, "files.json"), found);
    if (failures.length) {
        await writeFileAtomic(path.join(directory, "ERRORS.txt"), `${failures.join("\n")}\n`);
        return {
            name: "inventory",
            status: "execution-error",
            required: true,
            reason: `Could not preserve ${failures.length} configuration file${failures.length === 1 ? "" : "s"}`,
            artifactDirectory: portableRelative(input.runDirectory, directory),
        };
    }
    return { name: "inventory", status: "completed", required: true, artifactDirectory: portableRelative(input.runDirectory, directory) };
}
export async function collectTools(input) {
    await ensureDirectory(input.scratchDirectory ?? path.join(input.runDirectory, "volatile"));
    const records = [];
    const syntaxFailures = new Set();
    const discoveredRepositoryPlans = input.includeRepositoryTools === false ? [] : await repositoryScriptPlans(input);
    const repositoryPlans = [
        ...discoveredRepositoryPlans.filter((plan) => plan.name === "repository-build"),
        ...discoveredRepositoryPlans.filter((plan) => plan.name !== "repository-build"),
    ];
    const ordered = await planTools(input, repositoryPlans);
    records.push(await collectInventory(input));
    for (const tool of ordered) {
        const record = await collectTool(input, tool);
        if (tool.internal === "oxlint-wasm" && record.status === "completed") {
            const raw = JSON.parse(await readFile(path.join(input.runDirectory, "deterministic", tool.name, "stdout.json"), "utf8"));
            for (const file of raw.files ?? []) {
                if (typeof file.path !== "string" || !Array.isArray(file.diagnostics))
                    continue;
                const hasSyntaxFailure = file.diagnostics.some((diagnostic) => {
                    if (diagnostic === null || typeof diagnostic !== "object")
                        return false;
                    const value = diagnostic;
                    return value.severity === "error" && typeof value.code !== "string";
                });
                if (hasSyntaxFailure)
                    syntaxFailures.add(file.path);
            }
        }
        if (tool.internal === "ruff-wasm" && record.status === "completed") {
            const raw = JSON.parse(await readFile(path.join(input.runDirectory, "deterministic", tool.name, "stdout.json"), "utf8"));
            for (const file of raw.files ?? []) {
                if (typeof file.path !== "string" || !Array.isArray(file.diagnostics))
                    continue;
                const hasSyntaxFailure = file.diagnostics.some((diagnostic) => {
                    if (diagnostic === null || typeof diagnostic !== "object")
                        return false;
                    return diagnostic.code === "invalid-syntax";
                });
                if (hasSyntaxFailure)
                    syntaxFailures.add(file.path);
            }
        }
        if (tool.outputContract === "semgrep-wasm" && record.status === "completed") {
            const affected = (tool.files ?? []).filter((file) => syntaxFailures.has(file)).sort();
            if (affected.length) {
                record.status = "execution-error";
                record.reason = `Semgrep coverage is unreliable for ${affected.length} target${affected.length === 1 ? "" : "s"} with syntax errors: ${affected.join(", ")}`;
            }
        }
        records.push(record);
        if (tool.projectControlled)
            await input.afterRepositoryTool?.();
    }
    return records;
}
async function collectTool(input, tool) {
    const directory = path.join(input.runDirectory, "deterministic", tool.name);
    await ensureDirectory(directory);
    if (tool.internal === "generated-bundle-omissions")
        return collectGeneratedBundleOmissions(input, tool, directory);
    if (tool.internal === "oxlint-wasm")
        return collectOxlintWasm(input, tool, directory);
    if (tool.internal === "ruff-wasm")
        return collectRuffWasm(input, tool, directory);
    if (!tool.executable) {
        await writeFileAtomic(path.join(directory, "SKIPPED.txt"), `${tool.reason}\n`);
        return { name: tool.name, status: "skipped", reason: tool.reason ?? "Unavailable", required: tool.required, artifactDirectory: portableRelative(input.runDirectory, directory) };
    }
    try {
        const result = await runCaptured({
            name: tool.name,
            executable: tool.executable,
            args: tool.args,
            cwd: tool.cwd ?? input.repo,
            artifactDirectory: directory,
            versionArgs: tool.versionArgs,
            timeoutMs: input.options.timeoutMs,
            ...(tool.env ? { env: tool.env } : {}),
            ...(tool.extension ? { stdoutExtension: tool.extension } : {}),
        });
        const commandFailure = result.timedOut || result.outputLimitExceeded || result.spawnError !== undefined || result.signal !== undefined || result.versionFailure !== undefined || !tool.findingExitCodes.includes(result.exitCode);
        const outputFailure = !commandFailure && tool.outputContract === "semgrep-wasm"
            ? validateSemgrepRunOutput(await readFile(path.join(directory, "stdout.json"), "utf8"), tool.files ?? [])
            : undefined;
        const operationalFailure = commandFailure || outputFailure !== undefined;
        const record = {
            name: tool.name,
            status: result.timedOut ? "timed-out" : operationalFailure ? "execution-error" : "completed",
            command: result.commandDisplay,
            exitCode: result.exitCode,
            durationMs: result.durationMs,
            artifactDirectory: portableRelative(input.runDirectory, directory),
            required: tool.required,
        };
        if (result.signal)
            record.signal = result.signal;
        if (result.timedOut)
            record.reason = "Command exceeded its configured timeout";
        else if (result.outputLimitExceeded)
            record.reason = "Command exceeded the output capture limit";
        else if (result.spawnError)
            record.reason = result.spawnError;
        else if (result.versionFailure)
            record.reason = result.versionFailure;
        else if (outputFailure)
            record.reason = outputFailure;
        else if (operationalFailure)
            record.reason = `Unexpected tool exit code ${result.exitCode}`;
        return record;
    }
    finally {
        if (tool.cleanupDirectory)
            await rm(tool.cleanupDirectory, { recursive: true, force: true });
    }
}
async function collectGeneratedBundleOmissions(input, tool, directory) {
    const omissions = tool.omissions ?? [];
    await writeJsonAtomic(path.join(directory, "omissions.json"), {
        schemaVersion: 1,
        policy: "Only exact generated analyzer bundles matching trusted attestations are omitted from source analyzers. Changed plugin runtime bundles remain analyzer inputs.",
        trustedAttestationFiles: [...new Set(omissions.map((entry) => entry.attestationFile))].sort(),
        trustedAttestationSources: [...new Set(omissions.map((entry) => entry.attestationSource))].sort(),
        omittedFileCount: omissions.length,
        omissions,
    });
    return {
        name: tool.name,
        status: "completed",
        exitCode: 0,
        artifactDirectory: portableRelative(input.runDirectory, directory),
        required: tool.required,
    };
}
async function collectRuffWasm(input, tool, directory) {
    const startedAt = Date.now();
    const files = tool.files ?? [];
    const identity = `internal:ruff-wasm@${RUFF_WASM_UPSTREAM_VERSION}`;
    const display = JSON.stringify([identity, "--", ...files]);
    await writeFileAtomic(path.join(directory, "command.txt"), `${display}\n`);
    await writeJsonAtomic(path.join(directory, "argv.json"), [identity, "--", ...files]);
    const version = `ruff ${RUFF_WASM_UPSTREAM_VERSION} (WebAssembly, ${RUFF_WASM_UPSTREAM_COMMIT})\n`;
    await writeFileAtomic(path.join(directory, "version.txt"), version);
    await writeFileAtomic(path.join(directory, "version-stdout.txt"), version);
    await writeFileAtomic(path.join(directory, "version-stderr.txt"), "");
    await writeFileAtomic(path.join(directory, "version-exit-code.txt"), "0\n");
    await writeFileAtomic(path.join(directory, "version-duration-ms.txt"), "0\n");
    await writeJsonAtomic(path.join(directory, "version-metadata.json"), {
        exitCode: 0,
        durationMs: 0,
        timedOut: false,
        truncated: false,
    });
    const shutdown = new ShutdownGuard("Ruff WebAssembly review");
    try {
        const decoder = new TextDecoder("utf-8", { fatal: true });
        const sources = [];
        for (const file of files) {
            const bytes = await readFile(path.join(input.repo, file));
            sources.push({ path: file, source: decoder.decode(bytes) });
        }
        const result = await runRuffWasm({
            files: sources,
            timeoutMs: input.options.timeoutMs,
            signal: shutdown.controller.signal,
        });
        shutdown.throwIfRequested();
        const engineErrors = result.files.filter((file) => file.status === "error");
        const diagnostics = result.files.reduce((count, file) => count + file.diagnostics.length, 0);
        const exitCode = engineErrors.length ? 2 : diagnostics ? 1 : 0;
        const durationMs = Date.now() - startedAt;
        await writeJsonAtomic(path.join(directory, "stdout.json"), result);
        await writeFileAtomic(path.join(directory, "stderr.txt"), engineErrors.map((file) => `${file.path}: ${file.error ?? "unknown engine error"}`).join("\n"));
        await writeFileAtomic(path.join(directory, "exit-code.txt"), `${exitCode}\n`);
        await writeFileAtomic(path.join(directory, "duration-ms.txt"), `${durationMs}\n`);
        await writeJsonAtomic(path.join(directory, "metadata.json"), {
            commandDisplay: display,
            durationMs,
            exitCode,
            timedOut: false,
            outputLimitExceeded: false,
            completedAt: new Date().toISOString(),
            engine: result.engine,
            upstreamVersion: result.upstreamVersion,
            upstreamCommit: result.upstreamCommit,
            wasmSha256: result.wasmSha256,
            glueSha256: result.glueSha256,
            nativeExecutable: false,
            fileCount: result.files.length,
            diagnosticCount: diagnostics,
        });
        shutdown.throwIfRequested();
        return {
            name: tool.name,
            status: engineErrors.length ? "execution-error" : "completed",
            command: display,
            exitCode,
            durationMs,
            artifactDirectory: portableRelative(input.runDirectory, directory),
            required: tool.required,
            ...(engineErrors.length ? { reason: `${engineErrors.length} file${engineErrors.length === 1 ? "" : "s"} could not be linted` } : {}),
        };
    }
    catch (error) {
        const durationMs = Date.now() - startedAt;
        let reason = error instanceof Error ? error.message : String(error);
        let timedOut = /exceeded \d+ ms/.test(reason);
        let cancelled = shutdown.requestedSignal !== undefined || (error instanceof FriendlyAdversaryError && [129, 130, 143].includes(error.exitCode));
        let exitCode = shutdown.requestedSignal ? shutdown.exitCode : cancelled ? 130 : 2;
        await writeFileAtomic(path.join(directory, "stdout.json"), "");
        await writeFileAtomic(path.join(directory, "stderr.txt"), `${reason}\n`);
        await writeFileAtomic(path.join(directory, "exit-code.txt"), `${exitCode}\n`);
        await writeFileAtomic(path.join(directory, "duration-ms.txt"), `${durationMs}\n`);
        await writeJsonAtomic(path.join(directory, "metadata.json"), {
            commandDisplay: display,
            durationMs,
            exitCode,
            timedOut,
            outputLimitExceeded: false,
            completedAt: new Date().toISOString(),
            nativeExecutable: false,
            error: reason,
        });
        if (shutdown.requestedSignal && reason !== shutdown.reason) {
            reason = shutdown.reason;
            timedOut = false;
            cancelled = true;
            exitCode = shutdown.exitCode;
            await writeFileAtomic(path.join(directory, "stderr.txt"), `${reason}\n`);
            await writeFileAtomic(path.join(directory, "exit-code.txt"), `${exitCode}\n`);
            await writeJsonAtomic(path.join(directory, "metadata.json"), {
                commandDisplay: display,
                durationMs,
                exitCode,
                timedOut,
                outputLimitExceeded: false,
                completedAt: new Date().toISOString(),
                nativeExecutable: false,
                error: reason,
            });
        }
        if (cancelled)
            throw new FriendlyAdversaryError(reason, exitCode);
        return {
            name: tool.name,
            status: timedOut ? "timed-out" : "execution-error",
            command: display,
            exitCode,
            durationMs,
            artifactDirectory: portableRelative(input.runDirectory, directory),
            required: tool.required,
            reason,
        };
    }
    finally {
        shutdown.close();
    }
}
async function collectOxlintWasm(input, tool, directory) {
    const startedAt = Date.now();
    const files = tool.files ?? [];
    const display = JSON.stringify(["internal:oxlint-wasm@1.76.0", "--", ...files]);
    await writeFileAtomic(path.join(directory, "command.txt"), `${display}\n`);
    await writeJsonAtomic(path.join(directory, "argv.json"), ["internal:oxlint-wasm@1.76.0", "--", ...files]);
    await writeFileAtomic(path.join(directory, "version.txt"), "oxlint 1.76.0 (WebAssembly, 65fe65d8429e1d1bdf86c517ff08bd119ee87660)\n");
    await writeFileAtomic(path.join(directory, "version-stdout.txt"), "oxlint 1.76.0 (WebAssembly, 65fe65d8429e1d1bdf86c517ff08bd119ee87660)\n");
    await writeFileAtomic(path.join(directory, "version-stderr.txt"), "");
    await writeFileAtomic(path.join(directory, "version-exit-code.txt"), "0\n");
    await writeFileAtomic(path.join(directory, "version-duration-ms.txt"), "0\n");
    await writeJsonAtomic(path.join(directory, "version-metadata.json"), {
        exitCode: 0,
        durationMs: 0,
        timedOut: false,
        truncated: false,
    });
    const shutdown = new ShutdownGuard("Oxlint WebAssembly review");
    try {
        const decoder = new TextDecoder("utf-8", { fatal: true });
        const sources = [];
        for (const file of files) {
            const bytes = await readFile(path.join(input.repo, file));
            sources.push({ path: file, source: decoder.decode(bytes) });
        }
        const result = await runOxlintWasm({
            files: sources,
            timeoutMs: input.options.timeoutMs,
            signal: shutdown.controller.signal,
        });
        shutdown.throwIfRequested();
        const engineErrors = result.files.filter((file) => file.status === "error");
        const diagnostics = result.files.reduce((count, file) => count + file.diagnostics.length, 0);
        const ignoredFiles = result.files.filter((file) => file.status === "ignored").length;
        const exitCode = engineErrors.length ? 2 : diagnostics ? 1 : 0;
        const durationMs = Date.now() - startedAt;
        await writeJsonAtomic(path.join(directory, "stdout.json"), result);
        const stderr = engineErrors.map((file) => `${file.path}: ${file.error ?? "unknown engine error"}`).join("\n");
        await writeFileAtomic(path.join(directory, "stderr.txt"), stderr ? `${stderr}\n` : "");
        await writeFileAtomic(path.join(directory, "exit-code.txt"), `${exitCode}\n`);
        await writeFileAtomic(path.join(directory, "duration-ms.txt"), `${durationMs}\n`);
        await writeJsonAtomic(path.join(directory, "metadata.json"), {
            commandDisplay: display,
            durationMs,
            exitCode,
            timedOut: false,
            outputLimitExceeded: false,
            completedAt: new Date().toISOString(),
            engine: result.engine,
            abiVersion: result.abiVersion,
            upstreamVersion: result.upstreamVersion,
            upstreamCommit: result.upstreamCommit,
            wasmSha256: result.wasmSha256,
            nativeExecutable: false,
            fileCount: result.files.length,
            ignoredFileCount: ignoredFiles,
            diagnosticCount: diagnostics,
            configurationMode: "certified-fixed-profile",
        });
        shutdown.throwIfRequested();
        return {
            name: tool.name,
            status: engineErrors.length ? "execution-error" : "completed",
            command: display,
            exitCode,
            durationMs,
            artifactDirectory: portableRelative(input.runDirectory, directory),
            required: tool.required,
            ...(engineErrors.length
                ? { reason: `${engineErrors.length} file${engineErrors.length === 1 ? "" : "s"} could not be linted` }
                : {}),
        };
    }
    catch (error) {
        const durationMs = Date.now() - startedAt;
        let reason = error instanceof Error ? error.message : String(error);
        let timedOut = /exceeded \d+ ms/.test(reason);
        let cancelled = shutdown.requestedSignal !== undefined || (error instanceof FriendlyAdversaryError && [129, 130, 143].includes(error.exitCode));
        let exitCode = shutdown.requestedSignal ? shutdown.exitCode : cancelled ? 130 : 2;
        await writeFileAtomic(path.join(directory, "stdout.json"), "");
        await writeFileAtomic(path.join(directory, "stderr.txt"), `${reason}\n`);
        await writeFileAtomic(path.join(directory, "exit-code.txt"), `${exitCode}\n`);
        await writeFileAtomic(path.join(directory, "duration-ms.txt"), `${durationMs}\n`);
        await writeJsonAtomic(path.join(directory, "metadata.json"), {
            commandDisplay: display,
            durationMs,
            exitCode,
            timedOut,
            outputLimitExceeded: false,
            completedAt: new Date().toISOString(),
            nativeExecutable: false,
            error: reason,
        });
        if (shutdown.requestedSignal && reason !== shutdown.reason) {
            reason = shutdown.reason;
            timedOut = false;
            cancelled = true;
            exitCode = shutdown.exitCode;
            await writeFileAtomic(path.join(directory, "stderr.txt"), `${reason}\n`);
            await writeFileAtomic(path.join(directory, "exit-code.txt"), `${exitCode}\n`);
            await writeJsonAtomic(path.join(directory, "metadata.json"), {
                commandDisplay: display,
                durationMs,
                exitCode,
                timedOut,
                outputLimitExceeded: false,
                completedAt: new Date().toISOString(),
                nativeExecutable: false,
                error: reason,
            });
        }
        if (cancelled)
            throw new FriendlyAdversaryError(reason, exitCode);
        return {
            name: tool.name,
            status: timedOut ? "timed-out" : "execution-error",
            command: display,
            exitCode,
            durationMs,
            artifactDirectory: portableRelative(input.runDirectory, directory),
            required: tool.required,
            reason,
        };
    }
    finally {
        shutdown.close();
    }
}
//# sourceMappingURL=tools.js.map