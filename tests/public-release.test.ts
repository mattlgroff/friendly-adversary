import assert from "node:assert/strict";
import { execFileSync, spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { access, mkdir, mkdtemp, readFile, rename, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";

const guard = path.resolve("scripts", "enforce-public-release.mjs");
const publicationCli = path.resolve("scripts", "corresponding-source-publication.mjs");
const prepackGate = path.resolve("scripts", "run-exclusive-prepack.mjs");

function outputLock(operation: "acquire" | "release", lock: string, pid: number, token: string) {
  return spawnSync(process.execPath, [publicationCli, "lock", operation, lock, String(pid), token], {
    cwd: path.resolve("."),
    encoding: "utf8",
  });
}

function outputGuard(operation: "acquire" | "release", lock: string, pid: number, token: string) {
  return spawnSync(process.execPath, [publicationCli, "guard", operation, lock, String(pid), token], {
    cwd: path.resolve("."),
    encoding: "utf8",
  });
}

async function outputGuardClaimPath(lockGuard: string, predecessorToken?: string) {
  const owner = JSON.parse(await readFile(path.join(lockGuard, "owner.json"), "utf8")) as { generation?: unknown };
  assert.equal(typeof owner.generation, "string");
  return `${lockGuard}.reclaim.${String(owner.generation)}.${predecessorToken ?? "root"}.json`;
}

function publishNoClobber(source: string, destination: string) {
  return spawnSync(process.execPath, [publicationCli, "publication", "publish", source, destination], {
    cwd: path.resolve("."),
    encoding: "utf8",
  });
}

function removeOwnedPublication(source: string, destination: string) {
  return spawnSync(process.execPath, [publicationCli, "publication", "remove-owned", source, destination], {
    cwd: path.resolve("."),
    encoding: "utf8",
  });
}

function publicationTransaction(operation: "begin" | "prepare" | "recover" | "abort-unpublished", output: string, staging?: string, token?: string, transactionSource?: string) {
  return spawnSync(process.execPath, [
    publicationCli,
    "transaction",
    operation,
    output,
    ...(staging ? [staging] : []),
    ...(token ? [token] : []),
    ...(transactionSource ? [transactionSource] : []),
  ], { cwd: path.resolve("."), encoding: "utf8" });
}

test("an unpublished transaction can remove only its owned staging directory", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-unpublished-transaction-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const output = path.join(directory, "source.tar.gz");
  const staging = await mkdtemp(path.join(directory, `.${path.basename(output)}.staging.`));
  const token = "unpublished-transaction-token-000001";
  const begun = publicationTransaction("begin", output, staging, token);
  assert.equal(begun.status, 0, begun.stderr);
  const transactionSource = begun.stdout.trim();
  const aborted = publicationTransaction("abort-unpublished", output, staging, token, transactionSource);
  assert.equal(aborted.status, 0, aborted.stderr);
  await assert.rejects(access(staging), { code: "ENOENT" });
  await assert.rejects(access(`${output}.transaction.json`), { code: "ENOENT" });
});

test("prepack serialization rejects a live owner and recovers a dead owner", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-prepack-gate-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const { acquirePrepackLock, releasePrepackLock } = await import(pathToFileURL(prepackGate).href) as {
    acquirePrepackLock: (root: string) => Promise<{ path: string; ownerNonce: string }>;
    releasePrepackLock: (lock: { path: string; ownerNonce: string }) => Promise<void>;
  };
  const lock = await acquirePrepackLock(directory);
  await assert.rejects(acquirePrepackLock(directory), /Another prepack owns this checkout/u);
  await releasePrepackLock(lock);

  const stalePath = lock.path;
  await mkdir(stalePath, { mode: 0o700 });
  await writeFile(path.join(stalePath, "owner.json"), `${JSON.stringify({
    schemaVersion: "1",
    host: os.hostname(),
    pid: 2_147_483_647,
    processStartedAt: "dead-process",
    ownerNonce: "00000000-0000-4000-8000-000000000001",
    createdAt: new Date().toISOString(),
  })}\n`);
  const recovered = await acquirePrepackLock(directory);
  await releasePrepackLock(recovered);
  await assert.rejects(access(stalePath), { code: "ENOENT" });
});

test("prepack identity seam uses a stable environment and classifies PowerShell StartTime", async () => {
  const { classifyProcessIdentity, processStartIdentity } = await import(pathToFileURL(prepackGate).href) as {
    classifyProcessIdentity: (alive: boolean, recorded: string, observed: string | undefined) => string;
    processStartIdentity: (pid: number, platform: string, execute: (file: string, args: readonly string[], environment: NodeJS.ProcessEnv) => string, environment?: NodeJS.ProcessEnv) => string | undefined;
  };
  const observed = "2026-08-16T12:34:56.0000000Z";
  const identity = processStartIdentity(42, "win32", (file, args, environment) => {
    assert.equal(file, "powershell.exe");
    assert.equal(args.at(-1), "42");
    assert.deepEqual(environment, { KEEP: "yes", LC_ALL: "C", TZ: "UTC" });
    return observed;
  }, { KEEP: "yes", lang: "fr_FR", LC_TIME: "de_DE", tz: "America/New_York" });
  assert.equal(classifyProcessIdentity(true, observed, identity), "exact-owner");
  assert.equal(classifyProcessIdentity(true, "2026-08-16T12:34:55.0000000Z", identity), "pid-reused");

  const environments: NodeJS.ProcessEnv[] = [];
  const execute = (_file: string, _args: readonly string[], environment: NodeJS.ProcessEnv) => {
    environments.push(environment);
    return "Sun Aug 16 12:34:56 2026";
  };
  assert.equal(
    processStartIdentity(42, "darwin", execute, { PATH: "/bin", LANG: "en_US", LC_TIME: "en_US", TZ: "America/New_York" }),
    processStartIdentity(42, "linux", execute, { PATH: "/bin", LANGUAGE: "de", LC_ALL: "de_DE", TZ: "Europe/Berlin" }),
  );
  assert.deepEqual(environments, [
    { PATH: "/bin", LC_ALL: "C", TZ: "UTC" },
    { PATH: "/bin", LC_ALL: "C", TZ: "UTC" },
  ]);
});

test("prepack serialization never reclaims the exact live owner", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-prepack-reused-pid-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const { acquirePrepackLock, releasePrepackLock } = await import(pathToFileURL(prepackGate).href) as {
    acquirePrepackLock: (root: string) => Promise<{ path: string; ownerNonce: string }>;
    releasePrepackLock: (lock: { path: string; ownerNonce: string }) => Promise<void>;
  };
  const first = await acquirePrepackLock(directory);
  await assert.rejects(acquirePrepackLock(directory), /Another prepack owns this checkout/u);
  await releasePrepackLock(first);
});

test("prepack serialization detects reuse of the current PID from processStartedAt", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-prepack-reused-current-pid-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const { acquirePrepackLock, releasePrepackLock } = await import(pathToFileURL(prepackGate).href) as {
    acquirePrepackLock: (root: string) => Promise<{ path: string; ownerNonce: string }>;
    releasePrepackLock: (lock: { path: string; ownerNonce: string }) => Promise<void>;
  };
  const first = await acquirePrepackLock(directory);
  const ownerPath = path.join(first.path, "owner.json");
  const owner = JSON.parse(await readFile(ownerPath, "utf8")) as Record<string, unknown>;
  await writeFile(ownerPath, `${JSON.stringify({ ...owner, processStartedAt: new Date(0).toISOString() })}\n`);
  const recovered = await acquirePrepackLock(directory);
  assert.notEqual(recovered.ownerNonce, first.ownerNonce);
  await releasePrepackLock(recovered);
});

test("concurrent PID-reuse reclaimers cannot remove the successor lock", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-prepack-concurrent-reclaim-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const { acquirePrepackLock, releasePrepackLock } = await import(pathToFileURL(prepackGate).href) as {
    acquirePrepackLock: (root: string) => Promise<{ path: string; ownerNonce: string }>;
    releasePrepackLock: (lock: { path: string; ownerNonce: string }) => Promise<void>;
  };
  const seed = await acquirePrepackLock(directory);
  const ownerPath = path.join(seed.path, "owner.json");
  const owner = JSON.parse(await readFile(ownerPath, "utf8")) as Record<string, unknown>;
  await writeFile(ownerPath, `${JSON.stringify({ ...owner, processStartedAt: new Date(0).toISOString() })}\n`);

  const attempts = await Promise.allSettled([
    acquirePrepackLock(directory),
    acquirePrepackLock(directory),
  ]);
  const winners = attempts.filter((attempt): attempt is PromiseFulfilledResult<Awaited<ReturnType<typeof acquirePrepackLock>>> => attempt.status === "fulfilled");
  const losers = attempts.filter((attempt): attempt is PromiseRejectedResult => attempt.status === "rejected");
  assert.equal(winners.length, 1);
  assert.equal(losers.length, 1);
  assert.match(String(losers[0]?.reason), /Another (?:prepack|corresponding-source build)/u);
  await releasePrepackLock(winners[0]!.value);
});

test("transaction begin failure removes its owned staging before returning", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-begin-failure-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const output = path.join(directory, "source.tar.gz");
  const staging = await mkdtemp(path.join(directory, `.${path.basename(output)}.staging.`));
  const { beginPublicationTransaction } = await import(pathToFileURL(publicationCli).href) as {
    beginPublicationTransaction: (
      outputPath: string,
      stagingPath: string,
      token: string,
      options: { afterRecordWrite: () => Promise<void> },
    ) => Promise<string>;
  };
  await assert.rejects(
    beginPublicationTransaction(output, staging, "begin-failure-token-0000000001", {
      afterRecordWrite: async () => {
        throw new Error("injected begin return failure");
      },
    }),
    /injected begin return failure/u,
  );
  await assert.rejects(access(staging), { code: "ENOENT" });
});

test("unpublished transaction cleanup rejects mismatched ownership", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-unpublished-mismatch-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const output = path.join(directory, "source.tar.gz");
  const staging = await mkdtemp(path.join(directory, `.${path.basename(output)}.staging.`));
  const token = "unpublished-mismatch-token-000001";
  const begun = publicationTransaction("begin", output, staging, token);
  assert.equal(begun.status, 0, begun.stderr);
  const rejected = publicationTransaction("abort-unpublished", output, staging, "different-owner-token-000001", begun.stdout.trim());
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /ownership metadata is invalid/u);
  await access(staging);
});

test("public release metadata and license evidence verify", () => {
  const result = spawnSync(process.execPath, [guard, "verify"], {
    cwd: path.resolve("."),
    encoding: "utf8",
  });
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout) as Record<string, unknown>;
  assert.equal(output.privateNpmPackage, true);
  assert.equal(output.packageLicense, "GPL-3.0-only");
  assert.equal(output.publicGitHubReleaseReady, true);
  assert.equal(output.generatedParserCount, 3);
});

test("publication guard fails unconditionally", () => {
  const result = spawnSync(process.execPath, [guard, "block"], {
    cwd: path.resolve("."),
    encoding: "utf8",
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /npm publication is disabled unconditionally/u);
});

test("every distribution manifest declares GPL-3.0-only", async () => {
  const manifests = [
    ["package.json", (value: Record<string, unknown>) => value.license],
    [".claude-plugin/marketplace.json", (value: Record<string, unknown>) => (value.plugins as Array<Record<string, unknown>>)[0]?.license],
    ["platforms/codex/plugins/friendly-adversary/.codex-plugin/plugin.json", (value: Record<string, unknown>) => value.license],
    ["platforms/claude-code/plugins/friendly-adversary/.claude-plugin/plugin.json", (value: Record<string, unknown>) => value.license],
  ] as const;
  for (const [relative, select] of manifests) {
    const value = JSON.parse(await readFile(path.resolve(relative), "utf8")) as Record<string, unknown>;
    assert.equal(select(value), "GPL-3.0-only", relative);
  }
});

test("every cache and receipt version surface matches package.json", async () => {
  const packageJson = JSON.parse(await readFile(path.resolve("package.json"), "utf8")) as { version: string };
  const packageLock = JSON.parse(await readFile(path.resolve("package-lock.json"), "utf8")) as {
    version: string;
    packages: Record<string, { version?: string }>;
  };
  const marketplace = JSON.parse(await readFile(path.resolve(".claude-plugin/marketplace.json"), "utf8")) as {
    plugins: Array<{ version: string }>;
  };
  const claudePlugin = JSON.parse(await readFile(
    path.resolve("platforms/claude-code/plugins/friendly-adversary/.claude-plugin/plugin.json"),
    "utf8",
  )) as { version: string };
  const codexPlugin = JSON.parse(await readFile(
    path.resolve("platforms/codex/plugins/friendly-adversary/.codex-plugin/plugin.json"),
    "utf8",
  )) as { version: string };
  const constants = await readFile(path.resolve("src/constants.ts"), "utf8");
  assert.equal(packageLock.version, packageJson.version);
  assert.equal(packageLock.packages[""]?.version, packageJson.version);
  assert.equal(marketplace.plugins[0]?.version, packageJson.version);
  assert.equal(claudePlugin.version, packageJson.version);
  assert.equal(codexPlugin.version, packageJson.version);
  assert.match(constants, new RegExp(`PRODUCT_VERSION = ${JSON.stringify(packageJson.version)}`));
});

test("portable licensing copies contain no location-dependent Markdown links", async () => {
  const rootLicensing = await readFile(path.resolve("LICENSING.md"));
  assert.doesNotMatch(rootLicensing.toString("utf8"), /\[[^\]]+\]\([^)]+\)/u);
  for (const relative of [
    "platforms/codex/plugins/friendly-adversary/LICENSING.md",
    "platforms/codex/plugins/friendly-adversary/skills/pr-review/LICENSING.md",
    "platforms/codex/plugins/friendly-adversary/skills/audit-codebase/LICENSING.md",
    "platforms/codex/plugins/friendly-adversary/skills/design-new-codebase/LICENSING.md",
    "platforms/claude-code/plugins/friendly-adversary/LICENSING.md",
    "platforms/claude-code/plugins/friendly-adversary/skills/pr-review/LICENSING.md",
    "platforms/claude-code/plugins/friendly-adversary/skills/audit-codebase/LICENSING.md",
    "platforms/claude-code/plugins/friendly-adversary/skills/design-new-codebase/LICENSING.md",
  ]) {
    assert.deepEqual(await readFile(path.resolve(relative)), rootLicensing, relative);
  }
});

test("corresponding-source packager never deletes output owned by another process", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-packager-lock-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const output = path.join(directory, "source.tar.gz");
  const sidecar = `${output}.evidence.json`;
  await writeFile(output, "winner archive\n");
  await writeFile(sidecar, "winner evidence\n");

  const staged = path.join(directory, "staged.tar.gz");
  await writeFile(staged, "our archive\n");
  const existingOutput = publishNoClobber(staged, output);
  assert.equal(existingOutput.status, 1);
  assert.match(existingOutput.stderr, /Refusing to overwrite/u);
  await access(output);
  await access(sidecar);

  await mkdir(`${output}.lock`);
  const lockedOutput = outputLock("acquire", `${output}.lock`, process.pid, "contender-token-0000000002");
  assert.equal(lockedOutput.status, 22);
  assert.match(lockedOutput.stderr, /regular non-symlink/u);
  assert.equal(await readFile(output, "utf8"), "winner archive\n");
  assert.equal(await readFile(sidecar, "utf8"), "winner evidence\n");
});

test("corresponding-source output lock recovers only a confirmed same-host dead owner", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-stale-output-lock-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const lock = path.join(directory, "source.tar.gz.lock");
  const firstToken = "first-owner-token-00000001";
  const secondToken = "second-owner-token-0000002";
  const owner = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { stdio: "ignore" });
  assert.ok(owner.pid);
  context.after(() => owner.kill("SIGKILL"));

  const acquired = outputLock("acquire", lock, owner.pid, firstToken);
  assert.equal(acquired.status, 0, acquired.stderr);
  assert.equal(acquired.stdout.trim(), "acquired");
  owner.kill("SIGTERM");
  await once(owner, "exit");

  const deadProspectiveOwner = outputLock("acquire", lock, owner.pid, "dead-prospective-token-00001");
  assert.equal(deadProspectiveOwner.status, 22);
  assert.match(deadProspectiveOwner.stderr, /not confirmed live/u);

  const recovered = outputLock("acquire", lock, process.pid, secondToken);
  assert.equal(recovered.status, 0, recovered.stderr);
  assert.equal(recovered.stdout.trim(), "reclaimed");
  const metadata = JSON.parse(await readFile(lock, "utf8")) as Record<string, unknown>;
  assert.equal(metadata.pid, process.pid);
  assert.equal(metadata.token, secondToken);

  const released = outputLock("release", lock, process.pid, secondToken);
  assert.equal(released.status, 0, released.stderr);
  await assert.rejects(access(lock), { code: "ENOENT" });
});

test("corresponding-source output lock preserves live ownership and token-scoped cleanup", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-live-output-lock-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const lock = path.join(directory, "source.tar.gz.lock");
  const ownerToken = "current-owner-token-0000001";
  const contenderToken = "contender-token-0000000002";

  const acquired = outputLock("acquire", lock, process.pid, ownerToken);
  assert.equal(acquired.status, 0, acquired.stderr);
  const blocked = outputLock("acquire", lock, process.pid, contenderToken);
  assert.equal(blocked.status, 20);
  assert.match(blocked.stderr, /owns the output lock/u);

  const wrongRelease = outputLock("release", lock, process.pid, contenderToken);
  assert.equal(wrongRelease.status, 22);
  assert.match(wrongRelease.stderr, /ownership changed/u);
  await access(lock);
  const released = outputLock("release", lock, process.pid, ownerToken);
  assert.equal(released.status, 0, released.stderr);
  const missingRelease = outputLock("release", lock, process.pid, ownerToken);
  assert.equal(missingRelease.status, 22);
  assert.match(missingRelease.stderr, /disappeared before owned cleanup/u);
});

test("corresponding-source output lock fails closed for foreign and ambiguous records", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-ambiguous-output-lock-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const lock = path.join(directory, "source.tar.gz.lock");
  const contenderToken = "contender-token-0000000002";
  await writeFile(lock, `${JSON.stringify({
    schemaVersion: 1,
    host: `foreign-${os.hostname()}`,
    pid: process.pid,
    processStartedAt: "untrusted",
    token: "foreign-owner-token-000001",
    createdAt: new Date().toISOString(),
  })}\n`);
  const foreign = outputLock("acquire", lock, process.pid, contenderToken);
  assert.equal(foreign.status, 21);
  assert.match(foreign.stderr, /another host/u);

  await writeFile(lock, "not owner metadata\n");
  const malformed = outputLock("acquire", lock, process.pid, contenderToken);
  assert.equal(malformed.status, 22);
  assert.match(malformed.stderr, /ambiguous and will not be reclaimed/u);

  await rm(lock);
  await mkdir(lock);
  const nonFile = outputLock("acquire", lock, process.pid, contenderToken);
  assert.equal(nonFile.status, 22);
  assert.match(nonFile.stderr, /regular non-symlink/u);

  await rm(lock, { recursive: true });
  await writeFile(lock, `${JSON.stringify({
    schemaVersion: 1,
    host: os.hostname(),
    pid: process.pid,
    processStartedAt: "forged-start-time",
    token: "reused-pid-owner-token-0001",
    createdAt: new Date().toISOString(),
  })}\n`);
  const reusedPid = outputLock("acquire", lock, process.pid, contenderToken);
  if (process.platform === "win32") {
    assert.equal(reusedPid.status, 20);
    assert.match(reusedPid.stderr, /owns the output lock/u);
  } else {
    assert.equal(reusedPid.status, 0, reusedPid.stderr);
    assert.equal(reusedPid.stdout.trim(), "reclaimed");
    const released = outputLock("release", lock, process.pid, contenderToken);
    assert.equal(released.status, 0, released.stderr);
  }
});

test("corresponding-source output guard serializes concurrent reclaimers", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-output-guard-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const lockGuard = path.join(directory, "source.tar.gz.lock.guard");
  const owner = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { stdio: "ignore" });
  assert.ok(owner.pid);
  context.after(() => owner.kill("SIGKILL"));
  const firstToken = "guard-owner-token-0000000001";
  const first = outputGuard("acquire", lockGuard, owner.pid, firstToken);
  assert.equal(first.status, 0, first.stderr);
  const wrongRelease = outputGuard("release", lockGuard, owner.pid, "guard-wrong-token-0000000002");
  assert.equal(wrongRelease.status, 22);
  assert.match(wrongRelease.stderr, /ownership changed/u);
  await access(lockGuard);
  owner.kill("SIGTERM");
  await once(owner, "exit");

  const deadProspectiveOwner = outputGuard("acquire", lockGuard, owner.pid, "guard-dead-owner-token-000001");
  assert.equal(deadProspectiveOwner.status, 22);
  assert.match(deadProspectiveOwner.stderr, /not confirmed live/u);

  const tokens = ["guard-contender-token-000001", "guard-contender-token-000002"];
  const contenders = tokens.map((token) => spawn(
    process.execPath,
    [publicationCli, "guard", "acquire", lockGuard, String(process.pid), token],
    { cwd: path.resolve("."), stdio: ["ignore", "pipe", "pipe"] },
  ));
  const results = await Promise.all(contenders.map(async (child) => {
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    const [status] = await once(child, "exit") as [number];
    return { status, stdout, stderr };
  }));
  assert.deepEqual(
    results.map((result) => result.status).sort((left, right) => left - right),
    [0, 20],
    JSON.stringify(results),
  );
  assert.match(results.find((result) => result.status === 20)?.stderr ?? "", /holds the output guard/u);
  const winnerIndex = results.findIndex((result) => result.status === 0);
  assert.match((results[winnerIndex]?.stdout ?? "").trim(), /^(?:acquired|reclaimed)$/u);
  const released = outputGuard("release", lockGuard, process.pid, tokens[winnerIndex] ?? "");
  assert.equal(released.status, 0, released.stderr);
  const missingRelease = outputGuard("release", lockGuard, process.pid, tokens[winnerIndex] ?? "");
  assert.equal(missingRelease.status, 22);
  assert.match(missingRelease.stderr, /disappeared before owned cleanup/u);
});

test("corresponding-source output guard atomically recovers a confirmed dead reclaimer", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-stale-reclaimer-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const lockGuard = path.join(directory, "source.tar.gz.lock.guard");
  const owner = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { stdio: "ignore" });
  const reclaimer = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { stdio: "ignore" });
  assert.ok(owner.pid);
  assert.ok(reclaimer.pid);
  context.after(() => owner.kill("SIGKILL"));
  context.after(() => reclaimer.kill("SIGKILL"));
  const acquired = outputGuard("acquire", lockGuard, owner.pid, "stale-reclaimer-owner-token-001");
  assert.equal(acquired.status, 0, acquired.stderr);
  const rootClaim = await outputGuardClaimPath(lockGuard);
  await writeFile(rootClaim, `${JSON.stringify({
    schemaVersion: 2,
    host: os.hostname(),
    pid: reclaimer.pid,
    token: "stale-reclaimer-claim-token-001",
    createdAt: new Date().toISOString(),
  })}\n`);
  owner.kill("SIGTERM");
  reclaimer.kill("SIGTERM");
  await Promise.all([once(owner, "exit"), once(reclaimer, "exit")]);

  const tokens = [
    "stale-reclaimer-winner-token-01",
    "stale-reclaimer-winner-token-02",
    "stale-reclaimer-winner-token-03",
  ];
  const contenders = tokens.map((token) => spawn(
    process.execPath,
    [publicationCli, "guard", "acquire", lockGuard, String(process.pid), token],
    { cwd: path.resolve("."), stdio: ["ignore", "pipe", "pipe"] },
  ));
  const results = await Promise.all(contenders.map(async (child) => {
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    const [status] = await once(child, "exit") as [number];
    return { status, stdout, stderr };
  }));
  assert.deepEqual(
    results.map((result) => result.status).sort((left, right) => left - right),
    [0, 20, 20],
    JSON.stringify(results),
  );
  const winnerIndex = results.findIndex((result) => result.status === 0);
  assert.match(results[winnerIndex]?.stdout.trim() ?? "", /^(?:acquired|reclaimed)$/u);
  const released = outputGuard("release", lockGuard, process.pid, tokens[winnerIndex] ?? "");
  assert.equal(released.status, 0, released.stderr);
});

test("corresponding-source output guard rejects malformed, cyclic, and exhausted reclaim chains before mutation", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-reclaim-chain-"));
  context.after(() => rm(directory, { recursive: true, force: true }));

  async function deadGuard(name: string) {
    const guard = path.join(directory, name);
    const owner = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { stdio: "ignore" });
    assert.ok(owner.pid);
    const acquired = outputGuard("acquire", guard, owner.pid, `${name}-owner-token-00000001`);
    assert.equal(acquired.status, 0, acquired.stderr);
    owner.kill("SIGTERM");
    await once(owner, "exit");
    return { guard, pid: owner.pid };
  }

  const malformed = await deadGuard("malformed");
  const malformedClaim = await outputGuardClaimPath(malformed.guard);
  await writeFile(malformedClaim, "");
  const malformedResult = outputGuard("acquire", malformed.guard, process.pid, "malformed-contender-token-00001");
  assert.equal(malformedResult.status, 22);
  assert.match(malformedResult.stderr, /ambiguous/u);
  assert.equal(await readFile(malformedClaim, "utf8"), "");

  const cyclic = await deadGuard("cyclic");
  const cyclicToken = "cyclic-reclaim-token-00000001";
  const cyclicRecord = {
    schemaVersion: 2,
    host: os.hostname(),
    pid: cyclic.pid,
    token: cyclicToken,
    createdAt: new Date().toISOString(),
  };
  await writeFile(await outputGuardClaimPath(cyclic.guard), `${JSON.stringify(cyclicRecord)}\n`);
  await writeFile(await outputGuardClaimPath(cyclic.guard, cyclicToken), `${JSON.stringify(cyclicRecord)}\n`);
  const cycleResult = outputGuard("acquire", cyclic.guard, process.pid, "cyclic-contender-token-000001");
  assert.equal(cycleResult.status, 22);
  assert.match(cycleResult.stderr, /cyclic/u);

  const exhausted = await deadGuard("exhausted");
  let predecessorToken: string | undefined;
  for (let index = 0; index < 64; index += 1) {
    const token = `exhausted-reclaim-token-${String(index).padStart(3, "0")}`;
    await writeFile(await outputGuardClaimPath(exhausted.guard, predecessorToken), `${JSON.stringify({
      schemaVersion: 2,
      host: os.hostname(),
      pid: exhausted.pid,
      token,
      createdAt: new Date().toISOString(),
    })}\n`);
    predecessorToken = token;
  }
  const forbiddenClaim = await outputGuardClaimPath(exhausted.guard, predecessorToken);
  const exhaustedResult = outputGuard("acquire", exhausted.guard, process.pid, "exhausted-contender-token-0001");
  assert.equal(exhaustedResult.status, 22);
  assert.match(exhaustedResult.stderr, /safety limit/u);
  await assert.rejects(access(forbiddenClaim), { code: "ENOENT" });
});

test("corresponding-source publication is atomic and never overwrites another writer", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-no-clobber-publication-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const source = path.join(directory, "staged & source");
  const destination = path.join(directory, "published; whoami");
  await writeFile(source, "our staged bytes\n");
  await writeFile(destination, "another writer's bytes\n");

  const blocked = publishNoClobber(source, destination);
  assert.equal(blocked.status, 1);
  assert.match(blocked.stderr, /Refusing to overwrite/u);
  assert.equal(await readFile(destination, "utf8"), "another writer's bytes\n");

  await rm(destination);
  const published = publishNoClobber(source, destination);
  assert.equal(published.status, 0, published.stderr);
  assert.equal(await readFile(destination, "utf8"), "our staged bytes\n");
});

test("corresponding-source transactions reject traversal and redirected staging roots", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-transaction-paths-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const output = path.join(directory, "source.tar.gz");
  const outside = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-transaction-outside-"));
  context.after(() => rm(outside, { recursive: true, force: true }));

  const traversed = publicationTransaction("begin", output, outside, "traversal-transaction-token-0001");
  assert.equal(traversed.status, 1);
  assert.match(traversed.stderr, /outside the output transaction namespace/u);

  const redirected = path.join(directory, `.${path.basename(output)}.staging.redirected`);
  await symlink(outside, redirected, process.platform === "win32" ? "junction" : "dir");
  const rejected = publicationTransaction("begin", output, redirected, "redirected-transaction-token-001");
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /not a regular directory/u);

  const staging = await mkdtemp(path.join(directory, `.${path.basename(output)}.staging.`));
  const unsafeToken = publicationTransaction("begin", output, staging, "../../unsafe-transaction-token");
  assert.equal(unsafeToken.status, 22);
  assert.match(unsafeToken.stderr, /path-safe characters/u);
});

test("corresponding-source preparation rejects a substituted staging directory", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-staging-substitution-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const output = path.join(directory, "source.tar.gz");
  const staging = await mkdtemp(path.join(directory, `.${path.basename(output)}.staging.`));
  const displaced = `${staging}.displaced`;
  const token = "staging-substitution-token-000001";
  for (const [file, content] of [
    ["source.tar.gz", "authorized archive\n"],
    ["corresponding-source.evidence.json", "authorized evidence\n"],
    ["corresponding-source.complete.json", "authorized completion\n"],
  ] as Array<[string, string]>) await writeFile(path.join(staging, file), content);
  const begun = publicationTransaction("begin", output, staging, token);
  assert.equal(begun.status, 0, begun.stderr);
  assert.equal(publishNoClobber(begun.stdout.trim(), `${output}.transaction.json`).status, 0);
  await rename(staging, displaced);
  await mkdir(staging);
  for (const file of ["source.tar.gz", "corresponding-source.evidence.json", "corresponding-source.complete.json"]) {
    await writeFile(path.join(staging, file), "substituted bytes\n");
  }
  const prepared = publicationTransaction("prepare", output, staging, token);
  assert.equal(prepared.status, 1);
  assert.match(prepared.stderr, /Staging directory identity changed before preparation/u);
  await assert.rejects(access(`${output}.transaction.ready.json`), { code: "ENOENT" });
});

test("interrupted publication cleanup removes only links owned by its staging inode", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-owned-publication-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const source = path.join(directory, "staged");
  const destination = path.join(directory, "published");
  await writeFile(source, "our staged bytes\n");

  const published = publishNoClobber(source, destination);
  assert.equal(published.status, 0, published.stderr);
  const removed = removeOwnedPublication(source, destination);
  assert.equal(removed.status, 0, removed.stderr);
  await assert.rejects(access(destination), { code: "ENOENT" });

  const republished = publishNoClobber(source, destination);
  assert.equal(republished.status, 0, republished.stderr);
  await rm(destination);
  await writeFile(destination, "replacement bytes\n");
  const preserved = removeOwnedPublication(source, destination);
  assert.equal(preserved.status, 0, preserved.stderr);
  assert.equal(await readFile(destination, "utf8"), "replacement bytes\n");
});

test("durable publication transaction recovers hard-crash partials and preserves completed output", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-publication-recovery-"));
  context.after(() => rm(directory, { recursive: true, force: true }));

  const buildingOutput = path.join(directory, "building.tar.gz");
  const buildingStaging = await mkdtemp(path.join(directory, `.${path.basename(buildingOutput)}.staging.`));
  await writeFile(path.join(buildingStaging, "large-partial-build"), "unfinished source tree\n");
  const building = publicationTransaction("begin", buildingOutput, buildingStaging, "building-transaction-token-000001");
  assert.equal(building.status, 0, building.stderr);
  assert.equal(publishNoClobber(building.stdout.trim(), `${buildingOutput}.transaction.json`).status, 0);
  const buildingRecovered = publicationTransaction("recover", buildingOutput);
  assert.equal(buildingRecovered.status, 0, buildingRecovered.stderr);
  assert.equal(buildingRecovered.stdout.trim(), "recovered");
  await assert.rejects(access(buildingStaging), { code: "ENOENT" });
  await assert.rejects(access(`${buildingOutput}.transaction.json`), { code: "ENOENT" });

  const prepare = async (name: string) => {
    const output = path.join(directory, `${name}.tar.gz`);
    const staging = await mkdtemp(path.join(directory, `.${path.basename(output)}.staging.`));
    const files = {
      archive: path.join(staging, "source.tar.gz"),
      evidence: path.join(staging, "corresponding-source.evidence.json"),
      completion: path.join(staging, "corresponding-source.complete.json"),
    };
    await writeFile(files.archive, `${name} archive\n`);
    await writeFile(files.evidence, `${name} evidence\n`);
    await writeFile(files.completion, `${name} completion\n`);
    const begun = publicationTransaction("begin", output, staging, `${name}-transaction-token-00000001`);
    assert.equal(begun.status, 0, begun.stderr);
    const transactionSource = begun.stdout.trim();
    const transaction = `${output}.transaction.json`;
    assert.equal(publishNoClobber(transactionSource, transaction).status, 0);
    const prepared = publicationTransaction("prepare", output, staging, `${name}-transaction-token-00000001`);
    assert.equal(prepared.status, 0, prepared.stderr);
    return { files, output, staging, transaction, readyTransaction: `${output}.transaction.ready.json` };
  };

  const partial = await prepare("partial");
  assert.equal(publishNoClobber(partial.files.evidence, `${partial.output}.evidence.json`).status, 0);
  assert.equal(publishNoClobber(partial.files.archive, partial.output).status, 0);
  await rm(partial.staging, { recursive: true });
  const recovered = publicationTransaction("recover", partial.output);
  assert.equal(recovered.status, 0, recovered.stderr);
  assert.equal(recovered.stdout.trim(), "recovered");
  for (const file of [partial.output, `${partial.output}.evidence.json`, partial.transaction, partial.readyTransaction]) {
    await assert.rejects(access(file), { code: "ENOENT" });
  }

  const complete = await prepare("complete");
  assert.equal(publishNoClobber(complete.files.evidence, `${complete.output}.evidence.json`).status, 0);
  assert.equal(publishNoClobber(complete.files.archive, complete.output).status, 0);
  assert.equal(publishNoClobber(complete.files.completion, `${complete.output}.complete.json`).status, 0);
  const completed = publicationTransaction("recover", complete.output);
  assert.equal(completed.status, 0, completed.stderr);
  assert.equal(completed.stdout.trim(), "completed");
  for (const file of [complete.output, `${complete.output}.evidence.json`, `${complete.output}.complete.json`]) await access(file);
  await assert.rejects(access(complete.transaction), { code: "ENOENT" });
  await assert.rejects(access(complete.readyTransaction), { code: "ENOENT" });
  await assert.rejects(access(complete.staging), { code: "ENOENT" });
});

test("durable publication transaction fails closed when a partial is replaced", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-publication-replacement-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const output = path.join(directory, "source.tar.gz");
  const staging = await mkdtemp(path.join(directory, `.${path.basename(output)}.staging.`));
  const evidence = path.join(staging, "corresponding-source.evidence.json");
  await writeFile(path.join(staging, "source.tar.gz"), "archive\n");
  await writeFile(evidence, "owned evidence\n");
  await writeFile(path.join(staging, "corresponding-source.complete.json"), "completion\n");
  const begun = publicationTransaction("begin", output, staging, "replacement-transaction-token-0001");
  assert.equal(begun.status, 0, begun.stderr);
  assert.equal(publishNoClobber(begun.stdout.trim(), `${output}.transaction.json`).status, 0);
  const prepared = publicationTransaction("prepare", output, staging, "replacement-transaction-token-0001");
  assert.equal(prepared.status, 0, prepared.stderr);
  assert.equal(publishNoClobber(evidence, `${output}.evidence.json`).status, 0);
  await rm(`${output}.evidence.json`);
  await writeFile(`${output}.evidence.json`, "replacement evidence\n");

  const rejected = publicationTransaction("recover", output);
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /not owned by the interrupted transaction/u);
  assert.equal(await readFile(`${output}.evidence.json`, "utf8"), "replacement evidence\n");
  await access(`${output}.transaction.json`);
  await access(`${output}.transaction.ready.json`);
});

test("durable publication transaction rejects a replaced building record after preparation", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-building-replacement-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const output = path.join(directory, "source.tar.gz");
  const staging = await mkdtemp(path.join(directory, `.${path.basename(output)}.staging.`));
  const token = "building-replacement-token-000001";
  await writeFile(path.join(staging, "source.tar.gz"), "archive\n");
  await writeFile(path.join(staging, "corresponding-source.evidence.json"), "evidence\n");
  await writeFile(path.join(staging, "corresponding-source.complete.json"), "completion\n");
  const begun = publicationTransaction("begin", output, staging, token);
  assert.equal(begun.status, 0, begun.stderr);
  const transaction = `${output}.transaction.json`;
  assert.equal(publishNoClobber(begun.stdout.trim(), transaction).status, 0);
  const prepared = publicationTransaction("prepare", output, staging, token);
  assert.equal(prepared.status, 0, prepared.stderr);
  await access(`${output}.transaction.ready.json`);
  await rm(transaction);
  await writeFile(transaction, `${JSON.stringify({ schemaVersion: 1, phase: "building", token: "replacement" })}\n`);

  const rejected = publicationTransaction("recover", output);
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /Building transaction ownership changed after preparation/u);
  assert.match(await readFile(transaction, "utf8"), /"replacement"/u);
  await access(`${output}.transaction.ready.json`);
});

test("durable publication transaction resumes from its cleanup marker", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-cleanup-resume-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const output = path.join(directory, "source.tar.gz");
  const staging = await mkdtemp(path.join(directory, `.${path.basename(output)}.staging.`));
  const token = "cleanup-resume-transaction-token-001";
  await writeFile(path.join(staging, "source.tar.gz"), "archive\n");
  await writeFile(path.join(staging, "corresponding-source.evidence.json"), "evidence\n");
  await writeFile(path.join(staging, "corresponding-source.complete.json"), "completion\n");
  const begun = publicationTransaction("begin", output, staging, token);
  assert.equal(begun.status, 0, begun.stderr);
  const transaction = `${output}.transaction.json`;
  const ready = `${output}.transaction.ready.json`;
  const cleanup = `${output}.transaction.cleanup.json`;
  assert.equal(publishNoClobber(begun.stdout.trim(), transaction).status, 0);
  const prepared = publicationTransaction("prepare", output, staging, token);
  assert.equal(prepared.status, 0, prepared.stderr);
  assert.equal(publishNoClobber(ready, cleanup).status, 0);
  await rm(ready);
  await rm(transaction);
  await rm(staging, { recursive: true });

  const recovered = publicationTransaction("recover", output);
  assert.equal(recovered.status, 0, recovered.stderr);
  assert.equal(recovered.stdout.trim(), "recovered");
  await assert.rejects(access(cleanup), { code: "ENOENT" });
});

test("packed smoke rejects a changed direct license notice", async (context) => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-direct-license-"));
  context.after(() => rm(directory, { recursive: true, force: true }));
  const npmArguments = ["pack", "--ignore-scripts", "--dry-run=false", "--json", "--pack-destination", directory];
  const npmExecutable = process.platform === "win32" ? process.execPath : "npm";
  if (process.platform === "win32") {
    const npmCli = process.env.npm_execpath
      ?? path.join(path.dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
    npmArguments.unshift(npmCli);
  }
  const packed = JSON.parse(execFileSync(npmExecutable, npmArguments, {
    cwd: path.resolve("."),
    encoding: "utf8",
    env: {
      ...process.env,
      npm_config_dry_run: "false",
      NPM_CONFIG_DRY_RUN: "false",
    },
  })) as Array<{ filename?: string }>;
  const filename = packed[0]?.filename;
  assert.ok(filename, "npm pack did not return an artifact filename");
  const extracted = path.join(directory, "extracted");
  await mkdir(extracted);
  execFileSync("tar", ["-xzf", path.join(directory, filename), "-C", extracted]);
  await writeFile(
    path.join(extracted, "package", "engines", "semgrep-wasm", "source", "licenses", "SEMGREP-LGPL-2.1.txt"),
    "altered license\n",
  );
  const tampered = path.join(directory, "tampered.tgz");
  execFileSync("tar", ["-czf", tampered, "-C", extracted, "package"]);
  const rejected = spawnSync(process.execPath, ["scripts/smoke-pack.mjs", tampered], {
    cwd: path.resolve("."),
    encoding: "utf8",
  });
  assert.equal(rejected.status, 1);
  assert.match(rejected.stderr, /SEMGREP-LGPL-2\.1\.txt/u);
  assert.match(rejected.stderr, /differs from the trusted repository bytes/u);
});
