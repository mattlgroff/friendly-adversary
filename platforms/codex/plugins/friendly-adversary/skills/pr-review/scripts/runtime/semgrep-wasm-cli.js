import { createRequire } from "node:module";
import { lstat, realpath } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { isMainThread, resourceLimits, Worker } from "node:worker_threads";
import { disableNetworkAccess } from "./network-guard.js";
const VERSION = "1.172.0-wasm-friendly-adversary.1";
const SEMGREP_VERSION = "1.172.0";
const SEMGREP_WORKER_STACK_SIZE_MB = 4;
const require = createRequire(import.meta.url);
const runtimeDirectory = path.dirname(fileURLToPath(import.meta.url));
const assetsRoot = path.resolve(runtimeDirectory, "../..");
async function createEngine(engineModule, assetsRootPath, language) {
    const engine = await engineModule.EngineFactory();
    if (language === "python") {
        const pythonModule = require(path.join(assetsRootPath, "engines", "semgrep-wasm", "runtime", "python", "index.cjs"));
        engine.addParser(await pythonModule.ParserFactory(path.join(assetsRootPath, "engines", "semgrep-wasm", "runtime", "python", "semgrep-parser.wasm")));
    }
    else {
        const typescriptModule = require(path.join(assetsRootPath, "engines", "semgrep-wasm", "runtime", "typescript", "index.cjs"));
        engine.addParser(await typescriptModule.ParserFactory(path.join(assetsRootPath, "engines", "semgrep-wasm", "runtime", "typescript", "semgrep-parser.wasm")));
    }
    return engine;
}
function usage(message) {
    process.stderr.write(`${message}\n`);
    process.exitCode = 2;
    throw new Error("invalid command line");
}
function requireSupportedNode() {
    const [major, minor, patch] = process.versions.node.split(".").map(Number);
    if (!Number.isInteger(major)
        || !Number.isInteger(minor)
        || !Number.isInteger(patch)
        || (major ?? 0) < 22
        || (major === 22 && ((minor ?? 0) < 22 || (minor === 22 && (patch ?? 0) < 0)))) {
        throw new Error(`Node 22.22.0 or newer is required; found ${process.versions.node}`);
    }
}
function isInside(parent, child) {
    const relative = path.relative(parent, child);
    return relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}
function portableRelative(root, target) {
    return path.relative(root, target).split(path.sep).join("/");
}
function compareText(left, right) {
    return left < right ? -1 : left > right ? 1 : 0;
}
function compareJson(left, right) {
    return compareText(JSON.stringify(left), JSON.stringify(right));
}
function normalizeTargetPath(repo, value) {
    return path.isAbsolute(value) && isInside(repo, value) ? portableRelative(repo, value) : value.split(path.sep).join("/");
}
function normalizeErrorPaths(value, repo) {
    if (Array.isArray(value))
        return value.map((entry) => normalizeErrorPaths(entry, repo));
    if (value === null || typeof value !== "object")
        return value;
    const normalized = {};
    for (const [key, entry] of Object.entries(value)) {
        normalized[key] = key === "path" && typeof entry === "string"
            ? normalizeTargetPath(repo, entry)
            : normalizeErrorPaths(entry, repo);
    }
    return normalized;
}
async function validateTargets(repo, values) {
    const targets = new Set();
    for (const value of values) {
        if (!value)
            usage(`Unsupported target: ${JSON.stringify(value)}`);
        const candidate = path.resolve(repo, value);
        const metadata = await lstat(candidate).catch(() => undefined);
        if (!metadata?.isFile() || metadata.isSymbolicLink())
            usage(`Target is not a regular file: ${value}`);
        const resolved = await realpath(candidate);
        if (!isInside(repo, resolved))
            usage(`Target resolves outside the repository: ${value}`);
        if (languageFor(resolved) === undefined)
            usage(`Unsupported target language: ${value}`);
        targets.add(resolved);
    }
    return [...targets].sort();
}
function parseArguments(argv) {
    if (argv.length === 1 && argv[0] === "--version") {
        process.stdout.write(`${VERSION}\n`);
        process.exit(0);
    }
    if (argv[0] !== "scan")
        usage("Only the scan command is supported");
    let config;
    const targets = [];
    let afterSeparator = false;
    for (let index = 1; index < argv.length; index += 1) {
        const argument = argv[index];
        if (afterSeparator) {
            if (argument !== undefined)
                targets.push(argument);
            continue;
        }
        if (argument === "--") {
            afterSeparator = true;
            continue;
        }
        if (argument === "--metrics=off" || argument === "--json")
            continue;
        if (argument === "--config") {
            config = argv[index + 1];
            index += 1;
            continue;
        }
        usage(`Unsupported option: ${argument}`);
    }
    if (!afterSeparator || !config || targets.length === 0)
        usage("Expected --config PATH -- TARGET...");
    return { config, targets };
}
function languageFor(target) {
    const extension = path.extname(target).toLowerCase();
    if ([".js", ".jsx", ".mjs", ".cjs"].includes(extension))
        return "javascript";
    if ([".ts", ".tsx", ".mts", ".cts"].includes(extension))
        return "typescript";
    if ([".py", ".pyi"].includes(extension))
        return "python";
    return undefined;
}
function parseOutput(raw) {
    const parsed = JSON.parse(raw);
    if (parsed.version !== SEMGREP_VERSION)
        throw new Error(`Unexpected Semgrep core version: ${parsed.version}`);
    if (parsed.time !== undefined || parsed.explanations !== undefined) {
        throw new Error("The bundled engine emitted nondeterministic scan metadata");
    }
    if (!Array.isArray(parsed.results) || !Array.isArray(parsed.errors) || !Array.isArray(parsed.skipped_rules)) {
        throw new Error("The bundled engine emitted an invalid result shape");
    }
    return parsed;
}
async function main() {
    requireSupportedNode();
    if (!isMainThread && (resourceLimits.stackSizeMb ?? 0) < SEMGREP_WORKER_STACK_SIZE_MB) {
        throw new Error("The Semgrep worker did not receive its required 4 MiB stack limit");
    }
    disableNetworkAccess();
    const { config, targets: rawTargets } = parseArguments(process.argv.slice(2));
    const repo = await realpath(process.cwd());
    const expectedConfig = await realpath(path.join(assetsRoot, "rules", "semgrep"));
    const requestedConfig = await realpath(path.resolve(repo, config)).catch(() => undefined);
    if (requestedConfig !== expectedConfig)
        usage("Only the bundled Friendly Adversary rules are supported");
    const targets = await validateTargets(repo, rawTargets);
    const engineModule = require(path.join(assetsRoot, "engines", "semgrep-wasm", "runtime", "engine", "index.cjs"));
    const outputs = [];
    const nativeOutputs = [];
    for (const language of ["javascript", "typescript", "python"]) {
        const languageTargets = targets.filter((target) => languageFor(target) === language);
        if (languageTargets.length === 0)
            continue;
        const ruleFile = language === "python" ? "python.yml" : "javascript.yml";
        let engine = await createEngine(engineModule, assetsRoot, language);
        for (const target of languageTargets) {
            const relativeTarget = portableRelative(repo, target);
            const rawOutput = engine.execute(language, path.join(expectedConfig, ruleFile), repo, [relativeTarget]);
            const output = parseOutput(rawOutput);
            outputs.push(output);
            nativeOutputs.push({ target: relativeTarget, stdout: rawOutput });
            if (output.errors.length > 0)
                engine = await createEngine(engineModule, assetsRoot, language);
        }
    }
    const results = outputs.flatMap((output) => output.results.map((result) => ({
        ...result,
        path: normalizeTargetPath(repo, result.path),
    }))).sort((left, right) => compareText(left.path, right.path)
        || left.start.offset - right.start.offset
        || left.end.offset - right.end.offset
        || compareText(left.check_id, right.check_id)
        || compareJson(left.extra, right.extra));
    const errors = outputs.flatMap((output) => output.errors)
        .map((error) => normalizeErrorPaths(error, repo))
        .sort(compareJson);
    const scanned = [...new Set(outputs.flatMap((output) => output.paths.scanned)
            .map((target) => normalizeTargetPath(repo, target)))].sort();
    const pathSkipped = outputs.flatMap((output) => output.paths.skipped ?? [])
        .map((entry) => normalizeErrorPaths(entry, repo))
        .sort(compareJson);
    const rulesByEngine = [...new Map(outputs.flatMap((output) => output.rules_by_engine)
            .map((entry) => [JSON.stringify(entry), entry])).values()]
        .sort((left, right) => compareText(left[0], right[0]) || compareText(left[1], right[1]));
    const skippedRules = outputs.flatMap((output) => output.skipped_rules).sort(compareJson);
    const output = {
        version: SEMGREP_VERSION,
        results,
        errors,
        paths: { scanned, skipped: pathSkipped },
        rules_by_engine: rulesByEngine,
        engine_requested: "OSS",
        interfile_languages_used: [],
        skipped_rules: skippedRules,
        profiling_results: [],
        friendly_adversary_native_outputs: nativeOutputs,
    };
    process.stdout.write(`${JSON.stringify(output)}\n`);
}
async function run() {
    if (!isMainThread || process.argv[2] !== "scan") {
        await main();
        return;
    }
    requireSupportedNode();
    disableNetworkAccess();
    const exitCode = await new Promise((resolve, reject) => {
        const worker = new Worker(new URL(import.meta.url), {
            argv: process.argv.slice(2),
            name: "friendly-adversary-semgrep",
            resourceLimits: { stackSizeMb: SEMGREP_WORKER_STACK_SIZE_MB },
        });
        worker.once("error", reject);
        worker.once("exit", resolve);
    });
    if (exitCode !== 0)
        process.exitCode = exitCode;
}
run().catch((error) => {
    if (process.exitCode === 2)
        return;
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
});
//# sourceMappingURL=semgrep-wasm-cli.js.map