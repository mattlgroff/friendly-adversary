import { spawn } from "node:child_process";
import { lstat, mkdtemp, open, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { MAX_CAPTURE_BYTES } from "./constants.js";
import { FriendlyAdversaryError } from "./errors.js";
import { ensureDirectory, writeFileAtomic, writeJsonAtomic } from "./fs-utils.js";
import { forceKillProcessTree, terminateProcessTree } from "./process-tree.js";
let shutdownSignal;
function throwIfShuttingDown() {
    if (!shutdownSignal)
        return;
    const exitCode = shutdownSignal === "SIGINT" ? 130 : shutdownSignal === "SIGTERM" ? 143 : 129;
    throw new FriendlyAdversaryError(`Review cancelled by ${shutdownSignal}`, exitCode);
}
export function displayCommand(executable, args) {
    return JSON.stringify([executable, ...args]);
}
function safeEnvironment(spec) {
    const supplied = spec.env ?? {};
    return {
        PATH: supplied.PATH ?? process.env.PATH,
        LANG: supplied.LANG ?? process.env.LANG ?? "C.UTF-8",
        LC_ALL: supplied.LC_ALL ?? process.env.LC_ALL,
        TMPDIR: supplied.TMPDIR ?? process.env.TMPDIR,
        TEMP: supplied.TEMP ?? process.env.TEMP,
        TMP: supplied.TMP ?? process.env.TMP,
        HOME: supplied.HOME,
        USERPROFILE: supplied.USERPROFILE,
        HOMEDRIVE: supplied.HOMEDRIVE,
        HOMEPATH: supplied.HOMEPATH,
        APPDATA: supplied.APPDATA,
        LOCALAPPDATA: supplied.LOCALAPPDATA,
        SystemRoot: supplied.SystemRoot ?? process.env.SystemRoot,
        WINDIR: supplied.WINDIR ?? process.env.WINDIR,
        ComSpec: supplied.ComSpec ?? process.env.ComSpec,
        PATHEXT: supplied.PATHEXT ?? process.env.PATHEXT,
        NO_COLOR: "1",
        CI: "1",
        GIT_TERMINAL_PROMPT: "0",
    };
}
function attachSignalForwarding(child) {
    const signals = ["SIGINT", "SIGTERM", "SIGHUP"];
    let escalation;
    const handler = (signal) => {
        shutdownSignal = signal;
        process.exitCode = signal === "SIGINT" ? 130 : signal === "SIGTERM" ? 143 : 129;
        terminateProcessTree(child);
        if (!escalation) {
            escalation = setTimeout(() => {
                if (child.exitCode !== null || child.signalCode !== null || !child.pid)
                    return;
                forceKillProcessTree(child);
            }, 2_000);
        }
    };
    for (const signal of signals)
        process.on(signal, handler);
    return () => {
        if (escalation)
            clearTimeout(escalation);
        for (const signal of signals)
            process.off(signal, handler);
    };
}
async function captureVersion(spec) {
    if (!spec.versionArgs)
        return undefined;
    const versionArgs = spec.versionArgs;
    return new Promise((resolve) => {
        const startedAt = Date.now();
        const child = spawn(spec.executable, versionArgs, {
            cwd: spec.cwd,
            env: safeEnvironment(spec),
            detached: process.platform !== "win32",
            shell: false,
            stdio: ["ignore", "pipe", "pipe"],
        });
        const stopForwarding = attachSignalForwarding(child);
        const stdout = [];
        const stderr = [];
        let bytes = 0;
        let truncated = false;
        let timedOut = false;
        let spawnError;
        let escalation;
        const timeout = setTimeout(() => {
            timedOut = true;
            terminateProcessTree(child);
            escalation = setTimeout(() => {
                if (child.exitCode !== null || child.signalCode !== null || !child.pid)
                    return;
                forceKillProcessTree(child);
            }, 2_000).unref();
        }, Math.min(spec.timeoutMs, 30_000));
        timeout.unref();
        const collect = (target, chunk) => {
            if (bytes >= 1024 * 1024) {
                truncated = true;
                return;
            }
            const remaining = 1024 * 1024 - bytes;
            target.push(chunk.subarray(0, remaining));
            bytes += Math.min(chunk.length, remaining);
            if (chunk.length > remaining)
                truncated = true;
        };
        child.stdout?.on("data", (chunk) => collect(stdout, chunk));
        child.stderr?.on("data", (chunk) => collect(stderr, chunk));
        child.once("error", (error) => {
            spawnError = error.message;
        });
        child.once("close", (exitCode, signal) => {
            stopForwarding();
            clearTimeout(timeout);
            if (escalation)
                clearTimeout(escalation);
            const result = {
                stdout: Buffer.concat(stdout),
                stderr: Buffer.concat(stderr),
                exitCode: spawnError ? 127 : (exitCode ?? 1),
                durationMs: Date.now() - startedAt,
                timedOut,
                truncated,
            };
            if (signal)
                result.signal = signal;
            if (spawnError)
                result.spawnError = spawnError;
            resolve(result);
        });
    });
}
export async function runCaptured(spec) {
    throwIfShuttingDown();
    await ensureDirectory(spec.artifactDirectory);
    const artifactDirectoryIdentity = await lstat(spec.artifactDirectory, { bigint: true });
    if (!artifactDirectoryIdentity.isDirectory() || artifactDirectoryIdentity.isSymbolicLink()) {
        throw new FriendlyAdversaryError("FA_EVIDENCE_DIRECTORY_UNSAFE: evidence path is not a real directory", 3);
    }
    const home = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-home-"));
    try {
        const windowsHome = process.platform === "win32"
            ? {
                USERPROFILE: home,
                HOMEDRIVE: path.parse(home).root.slice(0, 2),
                HOMEPATH: home.slice(2),
                APPDATA: home,
                LOCALAPPDATA: home,
            }
            : {};
        const effectiveSpec = {
            ...spec,
            env: { ...spec.env, HOME: home, ...windowsHome },
        };
        const commandDisplay = displayCommand(spec.executable, spec.args);
        const versionCapture = await captureVersion(effectiveSpec);
        let version;
        if (versionCapture !== undefined) {
            const preferred = versionCapture.stdout.length ? versionCapture.stdout : versionCapture.stderr;
            version = preferred.toString("utf8").trim();
        }
        throwIfShuttingDown();
        const stdout = [];
        const stderr = [];
        const startedAt = Date.now();
        let timedOut = false;
        let outputLimitExceeded = false;
        let spawnError;
        let capturedBytes = 0;
        let escalation;
        const child = spawn(spec.executable, spec.args, {
            cwd: spec.cwd,
            env: safeEnvironment(effectiveSpec),
            detached: process.platform !== "win32",
            shell: false,
            stdio: ["ignore", "pipe", "pipe"],
        });
        const stopForwarding = attachSignalForwarding(child);
        const guard = (chunk) => {
            capturedBytes += chunk.length;
            if (capturedBytes <= MAX_CAPTURE_BYTES)
                return true;
            outputLimitExceeded = true;
            terminateProcessTree(child);
            return false;
        };
        child.stdout.on("data", (chunk) => {
            if (guard(chunk))
                stdout.push(Buffer.from(chunk));
        });
        child.stderr.on("data", (chunk) => {
            if (guard(chunk))
                stderr.push(Buffer.from(chunk));
        });
        const result = await new Promise((resolve) => {
            child.once("error", (error) => {
                spawnError = error.message;
            });
            const timeout = setTimeout(() => {
                timedOut = true;
                terminateProcessTree(child);
                escalation = setTimeout(() => {
                    if (child.exitCode !== null || child.signalCode !== null)
                        return;
                    if (!child.pid)
                        return;
                    forceKillProcessTree(child);
                }, 2_000).unref();
            }, spec.timeoutMs);
            timeout.unref();
            child.once("close", (exitCode, signal) => {
                stopForwarding();
                clearTimeout(timeout);
                if (escalation)
                    clearTimeout(escalation);
                const base = {
                    exitCode: spawnError ? 127 : (exitCode ?? 1),
                    durationMs: Date.now() - startedAt,
                    timedOut,
                    outputLimitExceeded,
                    commandDisplay,
                };
                if (signal)
                    base.signal = signal;
                if (spawnError)
                    base.spawnError = spawnError;
                resolve(base);
            });
        });
        if (versionCapture && (versionCapture.timedOut || versionCapture.truncated || versionCapture.spawnError || versionCapture.signal || versionCapture.exitCode !== 0)) {
            result.versionFailure = versionCapture.timedOut
                ? "Version probe timed out"
                : versionCapture.truncated
                    ? "Version probe output was truncated"
                    : versionCapture.spawnError
                        ? `Version probe failed to start: ${versionCapture.spawnError}`
                        : versionCapture.signal
                            ? `Version probe terminated by ${versionCapture.signal}`
                            : `Version probe exited with code ${versionCapture.exitCode}`;
        }
        const current = await lstat(spec.artifactDirectory, { bigint: true }).catch(() => undefined);
        if (!current?.isDirectory() || current.isSymbolicLink()
            || current.dev !== artifactDirectoryIdentity.dev
            || current.ino !== artifactDirectoryIdentity.ino) {
            throw new FriendlyAdversaryError("FA_EVIDENCE_DIRECTORY_UNSAFE: repository-controlled check redirected its evidence directory", 3);
        }
        const stdoutPath = path.join(spec.artifactDirectory, `stdout.${spec.stdoutExtension ?? "txt"}`);
        const stderrPath = path.join(spec.artifactDirectory, "stderr.txt");
        const stdoutHandle = await open(stdoutPath, "wx", 0o600);
        let stderrHandle;
        let streamsPublished = false;
        try {
            stderrHandle = await open(stderrPath, "wx", 0o600);
            await Promise.all([
                stdoutHandle.writeFile(Buffer.concat(stdout)),
                stderrHandle.writeFile(Buffer.concat(stderr)),
            ]);
            await Promise.all([stdoutHandle.sync(), stderrHandle.sync()]);
            streamsPublished = true;
        }
        finally {
            await stdoutHandle.close();
            await stderrHandle?.close();
            if (!streamsPublished) {
                await rm(stdoutPath, { force: true });
                await rm(stderrPath, { force: true });
            }
        }
        await writeFileAtomic(path.join(spec.artifactDirectory, "command.txt"), `${commandDisplay}\n`);
        await writeJsonAtomic(path.join(spec.artifactDirectory, "argv.json"), [spec.executable, ...spec.args]);
        if (versionCapture !== undefined) {
            await writeFileAtomic(path.join(spec.artifactDirectory, "version-stdout.txt"), versionCapture.stdout);
            await writeFileAtomic(path.join(spec.artifactDirectory, "version-stderr.txt"), versionCapture.stderr);
            await writeFileAtomic(path.join(spec.artifactDirectory, "version-exit-code.txt"), `${versionCapture.exitCode}\n`);
            await writeFileAtomic(path.join(spec.artifactDirectory, "version-duration-ms.txt"), `${versionCapture.durationMs}\n`);
            await writeJsonAtomic(path.join(spec.artifactDirectory, "version-metadata.json"), {
                exitCode: versionCapture.exitCode,
                signal: versionCapture.signal,
                durationMs: versionCapture.durationMs,
                timedOut: versionCapture.timedOut,
                truncated: versionCapture.truncated,
                spawnError: versionCapture.spawnError,
            });
            const preferred = versionCapture.stdout.length ? versionCapture.stdout : versionCapture.stderr;
            await writeFileAtomic(path.join(spec.artifactDirectory, "version.txt"), preferred);
        }
        await writeFileAtomic(path.join(spec.artifactDirectory, "exit-code.txt"), `${result.exitCode}\n`);
        await writeFileAtomic(path.join(spec.artifactDirectory, "duration-ms.txt"), `${result.durationMs}\n`);
        await writeJsonAtomic(path.join(spec.artifactDirectory, "metadata.json"), {
            ...result,
            capturedBytes,
            executable: spec.executable,
            args: spec.args,
            cwd: spec.cwd,
            version,
            completedAt: new Date().toISOString(),
        });
        if (outputLimitExceeded) {
            await writeFileAtomic(path.join(spec.artifactDirectory, "OUTPUT_LIMIT_EXCEEDED.txt"), `${MAX_CAPTURE_BYTES}\n`);
        }
        throwIfShuttingDown();
        return result;
    }
    finally {
        await rm(home, { recursive: true, force: true });
    }
}
export async function capturedBytes(filePath) {
    return readFile(filePath);
}
//# sourceMappingURL=command.js.map