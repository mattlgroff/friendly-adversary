#!/usr/bin/env node

import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { constants } from "node:fs";
import {
  link,
  lstat,
  mkdir,
  open,
  readdir,
  rename,
  rm,
  rmdir,
} from "node:fs/promises";
import { hostname } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { fileURLToPath } from "node:url";

class PublicationError extends Error {
  constructor(message, exitCode = 1) {
    super(message);
    this.exitCode = exitCode;
  }
}

const sameFileIdentity = (left, right) => left.dev === right.dev
  && left.ino === right.ino
  && left.mode === right.mode
  && left.size === right.size;

const sameDirectoryIdentity = (left, right) => left.dev === right.dev
  && left.ino === right.ino
  && left.mode === right.mode;

const sameSnapshotIdentity = (left, right) => sameFileIdentity(left, right)
  && left.mtimeNs === right.mtimeNs
  && left.ctimeNs === right.ctimeNs;

const sameClaimRetryIdentity = (left, right) => sameSnapshotIdentity(left, right)
  && left.nlink === right.nlink;

const storedIdentity = (metadata) => ({
  dev: String(metadata.dev),
  ino: String(metadata.ino),
  mode: String(metadata.mode),
  size: String(metadata.size),
});

function decodedIdentity(value) {
  if (!value || !["dev", "ino", "mode", "size"].every(
    (key) => typeof value[key] === "string" && /^\d+$/u.test(value[key]),
  )) return undefined;
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, BigInt(entry)]));
}

function validateOwnerArguments(pid, token) {
  if (!Number.isSafeInteger(pid) || pid <= 0) throw new PublicationError("Owner PID must be a positive integer", 22);
  if (!validToken(token)) throw new PublicationError("Owner token must be 16 to 128 path-safe characters", 22);
}

const validToken = (token) => typeof token === "string" && /^[A-Za-z0-9_-]{16,128}$/u.test(token);

async function currentMetadata(file) {
  try {
    return await lstat(file, { bigint: true });
  } catch (error) {
    if (error?.code === "ENOENT") return undefined;
    throw error;
  }
}

async function syncDirectory(directoryPath) {
  let handle;
  try {
    handle = await open(directoryPath, "r");
    await handle.sync();
  } catch (error) {
    if (process.platform !== "win32" || !["EACCES", "EISDIR", "EPERM"].includes(error?.code)) throw error;
  } finally {
    await handle?.close();
  }
}

async function inspectRegularFile(file, maximumBytes) {
  const pathMetadata = await lstat(file, { bigint: true });
  if (!pathMetadata.isFile() || pathMetadata.isSymbolicLink()) {
    throw new PublicationError(`Not a regular non-symlink file: ${file}`);
  }
  if (maximumBytes !== undefined && pathMetadata.size > BigInt(maximumBytes)) {
    throw new PublicationError(`File exceeds the ${maximumBytes}-byte safety limit: ${file}`);
  }
  const handle = await open(file, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const opened = await handle.stat({ bigint: true });
    if (!sameFileIdentity(pathMetadata, opened)) throw new PublicationError(`File changed while opening: ${file}`);
    return { handle, metadata: opened };
  } catch (error) {
    await handle.close();
    throw error;
  }
}

async function readTrustedJson(file, maximumBytes = 16 * 1024) {
  const inspected = await inspectRegularFile(file, maximumBytes);
  try {
    const bytes = await inspected.handle.readFile("utf8");
    const [openedAfter, pathAfter] = await Promise.all([
      inspected.handle.stat({ bigint: true }),
      lstat(file, { bigint: true }),
    ]);
    if (!pathAfter.isFile() || pathAfter.isSymbolicLink()
      || !sameSnapshotIdentity(inspected.metadata, openedAfter)
      || !sameSnapshotIdentity(openedAfter, pathAfter)) {
      throw new PublicationError(`File changed while reading: ${file}`);
    }
    return { inspected, value: JSON.parse(bytes) };
  } catch (error) {
    await inspected.handle.close();
    throw error;
  }
}

async function writeSyncedFile(file, contents) {
  const handle = await open(file, "wx", 0o600);
  try {
    await handle.writeFile(contents, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
}

function processLiveness(pid) {
  try {
    process.kill(pid, 0);
    return "live";
  } catch (error) {
    if (error?.code === "ESRCH") return "dead";
    return "ambiguous";
  }
}

function processStartIdentity(pid) {
  if (process.platform === "win32") return undefined;
  try {
    const value = execFileSync("/bin/ps", ["-o", "lstart=", "-p", String(pid)], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    return value || undefined;
  } catch {
    return undefined;
  }
}

function ownerLiveness(record) {
  const liveness = processLiveness(record.pid);
  if (liveness !== "live" || process.platform === "win32" || typeof record.processStartedAt !== "string") {
    return liveness;
  }
  const currentIdentity = processStartIdentity(record.pid);
  if (!currentIdentity) return "ambiguous";
  return currentIdentity === record.processStartedAt ? "live" : "reused";
}

function validOwnerRecord(record) {
  return record
    && [1, 2].includes(record.schemaVersion)
    && typeof record.host === "string"
    && Number.isSafeInteger(record.pid)
    && record.pid > 0
    && validToken(record.token)
    && (record.processStartedAt === undefined || typeof record.processStartedAt === "string")
    && typeof record.createdAt === "string"
    && Number.isFinite(Date.parse(record.createdAt));
}

function reclaimClaimPath(guardPath, guardRecord, predecessorToken) {
  if (!validToken(guardRecord.generation)) {
    throw new PublicationError(`Output guard generation is invalid: ${guardPath}`, 22);
  }
  return `${guardPath}.reclaim.${guardRecord.generation}.${predecessorToken ?? "root"}.json`;
}

function guardGenerationChanged(guardPath) {
  const changed = new PublicationError(`Output guard generation changed while being inspected: ${guardPath}`, 22);
  changed.retryGuardAcquisition = true;
  return changed;
}

async function confirmGuardDirectoryIdentity(guardPath, expected) {
  const current = await currentMetadata(guardPath);
  if (!current) {
    const error = new Error(`Output guard disappeared while being inspected: ${guardPath}`);
    error.code = "ENOENT";
    throw error;
  }
  if (!sameDirectoryIdentity(current, expected)) throw guardGenerationChanged(guardPath);
  return current;
}

async function inspectGuardDirectory(guardPath) {
  const directoryMetadata = await lstat(guardPath, { bigint: true });
  if (!directoryMetadata.isDirectory() || directoryMetadata.isSymbolicLink()) {
    throw new PublicationError(`Output guard is not a regular non-symlink directory: ${guardPath}`, 22);
  }
  let names;
  try {
    names = (await readdir(guardPath)).sort();
  } catch (error) {
    if (error?.code === "ENOENT"
      || (process.platform === "win32" && ["EACCES", "EBUSY", "EPERM"].includes(error?.code))) {
      await confirmGuardDirectoryIdentity(guardPath, directoryMetadata);
      throw new PublicationError(`Output guard metadata is temporarily unreadable: ${guardPath}`, 22);
    }
    throw error;
  }
  if (JSON.stringify(names) !== JSON.stringify(["owner.json"])) {
    await confirmGuardDirectoryIdentity(guardPath, directoryMetadata);
    throw new PublicationError(`Output guard metadata is ambiguous and will not be reclaimed: ${guardPath}`, 22);
  }
  const ownerPath = join(guardPath, "owner.json");
  let read;
  try {
    read = await readTrustedJson(ownerPath);
  } catch (error) {
    if (error?.code === "ENOENT"
      || (error instanceof PublicationError && error.message.startsWith("File changed while reading:"))
      || (process.platform === "win32" && ["EACCES", "EBUSY", "EPERM"].includes(error?.code))) {
      await confirmGuardDirectoryIdentity(guardPath, directoryMetadata);
    }
    throw new PublicationError(`Output guard metadata is ambiguous and will not be reclaimed: ${guardPath}`, 22);
  }
  await read.inspected.handle.close();
  await confirmGuardDirectoryIdentity(guardPath, directoryMetadata);
  if (!validOwnerRecord(read.value)
    || !validToken(read.value.generation)) {
    throw new PublicationError(`Output guard metadata is ambiguous and will not be reclaimed: ${guardPath}`, 22);
  }
  return {
    directoryMetadata,
    ownerMetadata: read.inspected.metadata,
    record: read.value,
  };
}

async function inspectReclaimChain(guardPath, guard, transientSnapshots = new Map()) {
  const reclaimChain = [];
  const tokens = new Set();
  let predecessorToken;
  for (;;) {
    const reclaimPath = reclaimClaimPath(guardPath, guard.record, predecessorToken);
    let metadata;
    try {
      metadata = await currentMetadata(reclaimPath);
    } catch {
      throw new PublicationError(`Output guard reclaim metadata is ambiguous: ${guardPath}`, 22);
    }
    if (!metadata) break;
    const transientSnapshot = transientSnapshots.get(reclaimPath);
    if (transientSnapshot && !sameClaimRetryIdentity(metadata, transientSnapshot)) {
      throw new PublicationError(`Output guard reclaim claim changed during retry: ${guardPath}`, 22);
    }
    if (reclaimChain.length >= 64) {
      throw new PublicationError(`Output guard reclaim chain exceeds its safety limit: ${guardPath}`, 22);
    }
    let reclaim;
    try {
      reclaim = await readTrustedJson(reclaimPath);
    } catch (error) {
      if (process.platform === "win32" && ["EACCES", "EBUSY", "EPERM"].includes(error?.code)) {
        let current;
        try {
          current = await currentMetadata(reclaimPath);
        } catch (metadataError) {
          if (!["EACCES", "EBUSY", "EPERM"].includes(metadataError?.code)) throw metadataError;
          current = metadata;
        }
        if (!current || !sameClaimRetryIdentity(metadata, current)) {
          throw new PublicationError(`Output guard reclaim claim changed during retry: ${guardPath}`, 22);
        }
        transientSnapshots.set(reclaimPath, metadata);
        const transient = new PublicationError(`Output guard reclaim claim is temporarily unavailable: ${guardPath}`, 22);
        transient.retryClaimInspection = true;
        throw transient;
      }
      if (error instanceof PublicationError && error.message.startsWith("File changed while reading:")) {
        const current = await currentMetadata(reclaimPath);
        if (current && sameClaimRetryIdentity(metadata, current)) {
          transientSnapshots.set(reclaimPath, current);
          const transient = new PublicationError(`Output guard reclaim claim read was interrupted: ${guardPath}`, 22);
          transient.retryClaimInspection = true;
          throw transient;
        }
      }
      if (error?.code === "ENOENT"
        || (error instanceof PublicationError && error.message.startsWith("File changed while reading:"))) {
        const changed = new PublicationError(`Output guard reclaim claim changed while being inspected: ${guardPath}`, 22);
        changed.checkGuardChange = true;
        throw changed;
      }
      throw new PublicationError(`Output guard reclaim metadata is ambiguous: ${guardPath}`, 22);
    }
    await reclaim.inspected.handle.close();
    if (!validOwnerRecord(reclaim.value)) {
      throw new PublicationError(`Output guard reclaim metadata is ambiguous: ${guardPath}`, 22);
    }
    if (tokens.has(reclaim.value.token)) {
      throw new PublicationError(`Output guard reclaim chain is cyclic: ${guardPath}`, 22);
    }
    tokens.add(reclaim.value.token);
    reclaimChain.push({
      path: reclaimPath,
      metadata: reclaim.inspected.metadata,
      record: reclaim.value,
    });
    predecessorToken = reclaim.value.token;
  }
  return reclaimChain;
}

async function inspectGuard(guardPath) {
  const transientSnapshots = new Map();
  for (let attempt = 0; ; attempt += 1) {
    const guard = await inspectGuardDirectory(guardPath);
    let reclaimChain;
    try {
      reclaimChain = await inspectReclaimChain(guardPath, guard, transientSnapshots);
    } catch (error) {
      let after;
      try {
        after = await inspectGuardDirectory(guardPath);
      } catch (afterError) {
        if (afterError?.code === "ENOENT") throw afterError;
        if (afterError?.retryGuardAcquisition) throw afterError;
        throw error;
      }
      if (!sameGuardBaseState(guard, after)) {
        const changed = new PublicationError(`Output guard changed while reclaim metadata was inspected: ${guardPath}`, 22);
        changed.retryGuardAcquisition = true;
        throw changed;
      }
      if (!error?.retryClaimInspection || attempt >= 11) throw error;
      await delay(Math.min(5 * (2 ** attempt), 100));
      continue;
    }
    const after = await inspectGuardDirectory(guardPath);
    if (!sameGuardBaseState(guard, after)) {
      const changed = new PublicationError(`Output guard changed while being inspected: ${guardPath}`, 22);
      changed.retryGuardAcquisition = true;
      throw changed;
    }
    const reclaim = reclaimChain.at(-1);
    return {
      ...guard,
      reclaimChain,
      reclaimMetadata: reclaim?.metadata,
      reclaimRecord: reclaim?.record,
    };
  }
}

async function createGuardCandidate(guardPath, pid, token) {
  const candidate = `${guardPath}.candidate.${randomUUID()}`;
  await mkdir(candidate, { mode: 0o700 });
  try {
    const record = {
      schemaVersion: 2,
      host: hostname(),
      pid,
      processStartedAt: processStartIdentity(pid),
      token,
      generation: randomUUID(),
      createdAt: new Date().toISOString(),
    };
    await writeSyncedFile(join(candidate, "owner.json"), `${JSON.stringify(record, null, 2)}\n`);
    await syncDirectory(candidate);
    return { path: candidate, expected: await inspectGuard(candidate) };
  } catch (error) {
    await rmdir(candidate).catch(() => undefined);
    throw error;
  }
}

function sameGuardBaseState(left, right) {
  return sameDirectoryIdentity(left.directoryMetadata, right.directoryMetadata)
    && sameFileIdentity(left.ownerMetadata, right.ownerMetadata)
    && left.record.host === right.record.host
    && left.record.pid === right.record.pid
    && left.record.token === right.record.token
    && left.record.generation === right.record.generation;
}

function sameGuardState(left, right) {
  return sameGuardBaseState(left, right)
    && left.reclaimChain.length === right.reclaimChain.length
    && left.reclaimChain.every((entry, index) => {
      const other = right.reclaimChain[index];
      return entry.path === other?.path
        && sameFileIdentity(entry.metadata, other.metadata)
        && entry.record.host === other.record.host
        && entry.record.pid === other.record.pid
        && entry.record.token === other.record.token;
    });
}

async function removeExactRegularFile(file, expected, label) {
  const current = await currentMetadata(file);
  if (!current) throw new PublicationError(`${label} disappeared before cleanup`, 22);
  if (!sameFileIdentity(current, expected)) throw new PublicationError(`${label} changed before cleanup`, 22);
  const quarantine = await quarantineRegularFile(file, expected, label);
  await rm(quarantine);
}

async function removeGuardQuarantine(quarantine, guardPath, expected) {
  const moved = await inspectGuardDirectory(quarantine);
  const reclaimChain = await inspectReclaimChain(guardPath, moved);
  if (!sameGuardBaseState(moved, expected)
    || reclaimChain.length !== expected.reclaimChain.length
    || !reclaimChain.every((entry, index) => entry.path === expected.reclaimChain[index]?.path
      && sameFileIdentity(entry.metadata, expected.reclaimChain[index]?.metadata))) {
    throw new PublicationError("Output guard ownership changed during cleanup", 22);
  }
  for (const reclaim of [...reclaimChain].reverse()) {
    await removeExactRegularFile(reclaim.path, reclaim.metadata, "Output guard reclaim claim");
  }
  await removeExactRegularFile(join(quarantine, "owner.json"), moved.ownerMetadata, "Output guard owner");
  await rmdir(quarantine);
  await syncDirectory(dirname(quarantine));
}

async function moveGuardToQuarantine(guardPath, expected) {
  const quarantine = `${guardPath}.cleanup.${randomUUID()}`;
  for (let attempt = 0; ; attempt += 1) {
    try {
      await rename(guardPath, quarantine);
      break;
    } catch (error) {
      if (!expected.reclaimRecord
        || !["EACCES", "EBUSY", "EPERM"].includes(error?.code)
        || attempt >= 11) throw error;
      const current = await inspectGuard(guardPath);
      if (!sameGuardState(current, expected)) {
        throw new PublicationError("Output guard changed during quarantine retry", 22);
      }
      await delay(Math.min(5 * (2 ** attempt), 100));
    }
  }
  await syncDirectory(dirname(guardPath));
  try {
    const moved = await inspectGuardDirectory(quarantine);
    const reclaimChain = await inspectReclaimChain(guardPath, moved);
    if (!sameGuardBaseState(moved, expected)
      || reclaimChain.length !== expected.reclaimChain.length
      || !reclaimChain.every((entry, index) => entry.path === expected.reclaimChain[index]?.path
        && sameFileIdentity(entry.metadata, expected.reclaimChain[index]?.metadata))) {
      throw new PublicationError("Output guard changed while being quarantined", 22);
    }
    return quarantine;
  } catch (error) {
    try {
      if (!(await currentMetadata(guardPath))) await rename(quarantine, guardPath);
    } catch {
      // Preserve both paths for manual inspection when safe restoration is impossible.
    }
    throw error;
  }
}

async function installReclaimClaim(claimPath, record) {
  const candidatePath = `${claimPath}.candidate.${randomUUID()}`;
  await writeSyncedFile(candidatePath, `${JSON.stringify(record, null, 2)}\n`);
  const candidate = await inspectRegularFile(candidatePath);
  await candidate.handle.close();
  try {
    await link(candidatePath, claimPath);
    await syncDirectory(dirname(claimPath));
    const published = await inspectRegularFile(claimPath);
    await published.handle.close();
    if (!sameFileIdentity(published.metadata, candidate.metadata)) {
      throw new PublicationError("Output guard reclaim claim changed during publication", 22);
    }
    return {
      metadata: candidate.metadata,
      candidatePath,
      candidateMetadata: candidate.metadata,
    };
  } catch (error) {
    const current = await currentMetadata(candidatePath);
    if (current) {
      if (!sameFileIdentity(current, candidate.metadata)) {
        throw new PublicationError("Output guard reclaim candidate changed before cleanup", 22);
      }
      await removeExactRegularFile(candidatePath, candidate.metadata, "Output guard reclaim candidate");
    }
    await syncDirectory(dirname(claimPath));
    throw error;
  }
}

async function removeInstalledClaimCandidate(installed) {
  await removeExactRegularFile(
    installed.candidatePath,
    installed.candidateMetadata,
    "Output guard reclaim candidate",
  );
}

export async function acquireOutputGuard(guardPathInput, pid, token) {
  const guardPath = resolve(guardPathInput);
  validateOwnerArguments(pid, token);
  if (processLiveness(pid) !== "live") {
    throw new PublicationError("Prospective output guard owner is not confirmed live", 22);
  }
  const candidate = await createGuardCandidate(guardPath, pid, token);
  let reclaimed = false;
  const acquire = async () => {
    for (;;) {
      try {
        await rename(candidate.path, guardPath);
        await syncDirectory(dirname(guardPath));
        const installed = await inspectGuard(guardPath);
        if (!sameGuardBaseState(installed, candidate.expected) || installed.reclaimChain.length !== 0) {
          throw new PublicationError(`Output guard changed during installation: ${guardPath}`, 22);
        }
        return reclaimed ? "reclaimed" : "acquired";
      } catch (error) {
        if (!["EEXIST", "ENOTEMPTY", "EPERM"].includes(error?.code)) throw error;
      }

      let existing;
      try {
        existing = await inspectGuard(guardPath);
      } catch (error) {
        if (error?.code === "ENOENT" || error?.retryGuardAcquisition) continue;
        throw error;
      }
      if (existing.record.host !== hostname()) {
        throw new PublicationError(`Another host owns the output guard: ${guardPath}`, 21);
      }
      if (existing.reclaimRecord) {
        if (existing.reclaimRecord.host !== hostname()) {
          throw new PublicationError(`Another host owns output guard reclamation: ${guardPath}`, 21);
        }
        const reclaimLiveness = ownerLiveness(existing.reclaimRecord);
        if (reclaimLiveness === "live") {
          throw new PublicationError(`Another corresponding-source build holds the output guard: ${guardPath}`, 20);
        }
        if (!["dead", "reused"].includes(reclaimLiveness) || !["dead", "reused"].includes(ownerLiveness(existing.record))) {
          throw new PublicationError(`Output guard reclamation is ambiguous and will not be replaced: ${guardPath}`, 22);
        }
      }
      if (!existing.reclaimRecord) {
        const liveness = ownerLiveness(existing.record);
        if (liveness === "live") throw new PublicationError(`Another corresponding-source build holds the output guard: ${guardPath}`, 20);
        if (!["dead", "reused"].includes(liveness)) {
          throw new PublicationError(`Output guard ownership is ambiguous and will not be reclaimed: ${guardPath}`, 22);
        }
      }
      const reclaimRecord = {
        schemaVersion: 2,
        host: hostname(),
        pid: process.pid,
        processStartedAt: processStartIdentity(process.pid),
        token: randomUUID(),
        createdAt: new Date().toISOString(),
      };
      const previousReclaimCount = existing.reclaimChain.length;
      if (previousReclaimCount >= 64) {
        throw new PublicationError(`Output guard reclaim chain exceeds its safety limit: ${guardPath}`, 22);
      }
      const reclaimPath = reclaimClaimPath(guardPath, existing.record, existing.reclaimRecord?.token);
      let installed;
      try {
        installed = await installReclaimClaim(reclaimPath, reclaimRecord);
      } catch (error) {
        if (["EEXIST", "ENOENT"].includes(error?.code)) continue;
        throw error;
      }
      let claimed;
      try {
        claimed = await inspectGuard(guardPath);
      } catch (error) {
        await removeExactRegularFile(reclaimPath, installed.metadata, "Stale output guard reclaim claim");
        await removeInstalledClaimCandidate(installed);
        if (error?.code === "ENOENT") continue;
        throw error;
      }
      if (!sameGuardBaseState(claimed, existing)
        || claimed.reclaimChain.length !== previousReclaimCount + 1
        || !claimed.reclaimChain.slice(0, previousReclaimCount).every((entry, index) => {
          const previous = existing.reclaimChain[index];
          return entry.path === previous?.path
            && sameFileIdentity(entry.metadata, previous.metadata)
            && entry.record.host === previous.record.host
            && entry.record.pid === previous.record.pid
            && entry.record.token === previous.record.token;
        })
        || claimed.reclaimRecord?.host !== reclaimRecord.host
        || claimed.reclaimRecord?.pid !== reclaimRecord.pid
        || claimed.reclaimRecord?.token !== reclaimRecord.token
        || !["dead", "reused"].includes(ownerLiveness(existing.record))) {
        await removeExactRegularFile(reclaimPath, installed.metadata, "Stale output guard reclaim claim");
        await removeInstalledClaimCandidate(installed);
        continue;
      }
      const quarantine = await moveGuardToQuarantine(guardPath, claimed);
      await removeGuardQuarantine(quarantine, guardPath, claimed);
      await removeInstalledClaimCandidate(installed);
      reclaimed = true;
    }
  };
  let result;
  let acquisitionError;
  try {
    result = await acquire();
  } catch (error) {
    acquisitionError = error;
  }
  let cleanupError;
  try {
    await removeGuardQuarantine(candidate.path, candidate.path, candidate.expected);
  } catch (error) {
    if (error?.code !== "ENOENT") cleanupError = error;
  }
  if (acquisitionError && cleanupError) throw new AggregateError([acquisitionError, cleanupError], "Output guard acquisition and candidate cleanup both failed");
  if (acquisitionError) throw acquisitionError;
  if (cleanupError) throw cleanupError;
  return result;
}

export async function releaseOutputGuard(guardPathInput, pid, token) {
  const guardPath = resolve(guardPathInput);
  validateOwnerArguments(pid, token);
  let existing;
  try {
    existing = await inspectGuard(guardPath);
  } catch (error) {
    if (error?.code === "ENOENT") throw new PublicationError("Output guard disappeared before owned cleanup", 22);
    throw error;
  }
  if (existing.record.host !== hostname() || existing.record.pid !== pid || existing.record.token !== token) {
    throw new PublicationError("Output guard ownership changed; refusing cleanup", 22);
  }
  if (existing.reclaimRecord) throw new PublicationError("Output guard reclamation is in progress; refusing cleanup", 22);
  const quarantine = await moveGuardToQuarantine(guardPath, existing);
  await removeGuardQuarantine(quarantine, guardPath, existing);
  return "released";
}

async function withOperationGuard(lockPath, action) {
  const guardPath = `${lockPath}.operation.guard`;
  const token = randomUUID();
  await acquireOutputGuard(guardPath, process.pid, token);
  try {
    return await action();
  } finally {
    await releaseOutputGuard(guardPath, process.pid, token);
  }
}

async function readOutputLock(lockPath) {
  let read;
  try {
    read = await readTrustedJson(lockPath);
  } catch (error) {
    if (error?.code === "ENOENT") return undefined;
    if (error instanceof PublicationError && error.message.startsWith("Not a regular non-symlink file:")) {
      throw new PublicationError(`Output lock must be a regular non-symlink file: ${lockPath}`, 22);
    }
    throw new PublicationError(`Output lock metadata is ambiguous and will not be reclaimed: ${lockPath}`, 22);
  }
  await read.inspected.handle.close();
  if (!validOwnerRecord(read.value)) {
    throw new PublicationError(`Output lock metadata is ambiguous and will not be reclaimed: ${lockPath}`, 22);
  }
  return { metadata: read.inspected.metadata, record: read.value };
}

async function quarantineRegularFile(file, expected, label) {
  const quarantine = `${file}.cleanup.${randomUUID()}`;
  await rename(file, quarantine);
  await syncDirectory(dirname(file));
  try {
    const moved = await inspectRegularFile(quarantine);
    await moved.handle.close();
    if (!sameFileIdentity(moved.metadata, expected)) throw new PublicationError(`${label} changed during cleanup`, 22);
    return quarantine;
  } catch (error) {
    try {
      if (!(await currentMetadata(file))) await rename(quarantine, file);
    } catch {
      // Preserve the quarantined path when safe restoration is impossible.
    }
    throw error;
  }
}

async function installOutputLock(lockPath, record) {
  const temporary = `${lockPath}.candidate.${randomUUID()}`;
  await writeSyncedFile(temporary, `${JSON.stringify(record, null, 2)}\n`);
  const candidate = await inspectRegularFile(temporary);
  await candidate.handle.close();
  let publicationError;
  try {
    await link(temporary, lockPath);
    await syncDirectory(dirname(lockPath));
  } catch (error) {
    publicationError = error;
  }
  let cleanupError;
  try {
    const current = await currentMetadata(temporary);
    if (current) {
      if (!sameFileIdentity(current, candidate.metadata)) {
        throw new PublicationError("Output lock candidate changed before cleanup", 22);
      }
      const quarantine = await quarantineRegularFile(temporary, candidate.metadata, "Output lock candidate");
      await rm(quarantine);
    }
  } catch (error) {
    cleanupError = error;
  }
  if (publicationError && cleanupError) throw new AggregateError([publicationError, cleanupError], "Output lock publication and candidate cleanup both failed");
  if (publicationError) throw publicationError;
  if (cleanupError) throw cleanupError;
}

export async function acquireOutputLock(lockPathInput, pid, token) {
  const lockPath = resolve(lockPathInput);
  validateOwnerArguments(pid, token);
  if (processLiveness(pid) !== "live") {
    throw new PublicationError("Prospective output lock owner is not confirmed live", 22);
  }
  return withOperationGuard(lockPath, async () => {
    const existing = await readOutputLock(lockPath);
    let reclaimed = false;
    if (existing) {
      if (existing.record.host !== hostname()) throw new PublicationError(`another host owns the output lock: ${lockPath}`, 21);
      const liveness = ownerLiveness(existing.record);
      if (liveness === "live") throw new PublicationError(`Another corresponding-source build owns the output lock: ${lockPath}`, 20);
      if (!["dead", "reused"].includes(liveness)) {
        throw new PublicationError(`Output lock metadata is ambiguous and will not be reclaimed: ${lockPath}`, 22);
      }
      const quarantine = await quarantineRegularFile(lockPath, existing.metadata, "Output lock");
      await rm(quarantine);
      await syncDirectory(dirname(lockPath));
      reclaimed = true;
    }
    await installOutputLock(lockPath, {
      schemaVersion: 2,
      host: hostname(),
      pid,
      processStartedAt: processStartIdentity(pid),
      token,
      createdAt: new Date().toISOString(),
    });
    return reclaimed ? "reclaimed" : "acquired";
  });
}

export async function releaseOutputLock(lockPathInput, pid, token) {
  const lockPath = resolve(lockPathInput);
  validateOwnerArguments(pid, token);
  return withOperationGuard(lockPath, async () => {
    const existing = await readOutputLock(lockPath);
    if (!existing) throw new PublicationError("Output lock disappeared before owned cleanup", 22);
    if (existing.record.host !== hostname() || existing.record.pid !== pid || existing.record.token !== token) {
      throw new PublicationError("Output lock ownership changed; refusing cleanup", 22);
    }
    const quarantine = await quarantineRegularFile(lockPath, existing.metadata, "Output lock");
    await rm(quarantine);
    await syncDirectory(dirname(lockPath));
    return "released";
  });
}

export async function publishNoClobber(sourceInput, destinationInput) {
  const source = resolve(sourceInput);
  const destination = resolve(destinationInput);
  const inspected = await inspectRegularFile(source);
  await inspected.handle.close();
  const writable = await open(source, constants.O_RDWR | (constants.O_NOFOLLOW ?? 0));
  try {
    const opened = await writable.stat({ bigint: true });
    if (!sameFileIdentity(inspected.metadata, opened)) throw new PublicationError(`File changed before synchronization: ${source}`);
    await writable.sync();
  } finally {
    await writable.close();
  }
  try {
    await link(source, destination);
  } catch (error) {
    if (error?.code === "EEXIST") throw new PublicationError(`Refusing to overwrite existing publication: ${destination}`);
    throw error;
  }
  try {
    const published = await inspectRegularFile(destination);
    await published.handle.close();
    if (!sameFileIdentity(inspected.metadata, published.metadata)) {
      const quarantine = await quarantineRegularFile(destination, published.metadata, "Published file");
      await rm(quarantine);
      throw new PublicationError(`Staged file changed during publication: ${source}`);
    }
    await syncDirectory(dirname(destination));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
    throw new PublicationError(`Published file disappeared before verification: ${destination}`);
  }
}

export async function removeOwnedPublication(sourceInput, destinationInput) {
  const source = resolve(sourceInput);
  const destination = resolve(destinationInput);
  let sourceMetadata;
  let destinationMetadata;
  try {
    const sourceInspected = await inspectRegularFile(source);
    sourceMetadata = sourceInspected.metadata;
    await sourceInspected.handle.close();
    const destinationInspected = await inspectRegularFile(destination);
    destinationMetadata = destinationInspected.metadata;
    await destinationInspected.handle.close();
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  if (!sameFileIdentity(sourceMetadata, destinationMetadata)) return;
  const quarantine = await quarantineRegularFile(destination, destinationMetadata, "Published file");
  await rm(quarantine);
  await syncDirectory(dirname(destination));
}

async function sha256Handle(handle) {
  const hash = createHash("sha256");
  const stream = handle.createReadStream({ autoClose: false, start: 0 });
  for await (const chunk of stream) hash.update(chunk);
  return hash.digest("hex");
}

function transactionPaths(output, stagingRoot) {
  const destinations = {
    archive: output,
    evidence: `${output}.evidence.json`,
    completion: `${output}.complete.json`,
  };
  const sourceBasenames = {
    archive: "source.tar.gz",
    evidence: "corresponding-source.evidence.json",
    completion: "corresponding-source.complete.json",
  };
  return {
    transactionPath: `${output}.transaction.json`,
    readyTransactionPath: `${output}.transaction.ready.json`,
    cleanupTransactionPath: `${output}.transaction.cleanup.json`,
    destinations,
    sourceBasenames,
    sources: Object.fromEntries(Object.entries(sourceBasenames).map(
      ([kind, name]) => [kind, stagingRoot ? join(stagingRoot, name) : undefined],
    )),
  };
}

function validateStagingLocation(output, stagingRoot) {
  const expectedPrefix = `.${basename(output)}.staging.`;
  if (dirname(stagingRoot) !== dirname(output) || !basename(stagingRoot).startsWith(expectedPrefix)) {
    throw new PublicationError("Staging root is outside the output transaction namespace");
  }
}

async function writeTransactionRecord(stagingRoot, record) {
  const target = join(stagingRoot, `corresponding-source.transaction.${randomUUID()}.json`);
  await writeSyncedFile(target, `${JSON.stringify(record, null, 2)}\n`);
  await syncDirectory(stagingRoot);
  return target;
}

async function readTransaction(transactionPath, readyTransactionPath, cleanupTransactionPath) {
  for (const candidate of [cleanupTransactionPath, readyTransactionPath, transactionPath].filter(Boolean)) {
    let read;
    try {
      read = await readTrustedJson(candidate);
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    }
    return { inspected: read.inspected, transaction: read.value, transactionPath: candidate };
  }
  return undefined;
}

async function matchesRecorded(file, record) {
  let inspected;
  try {
    inspected = await inspectRegularFile(file);
  } catch (error) {
    if (error?.code === "ENOENT") return { exists: false };
    if (error instanceof PublicationError) return { exists: true, matches: false };
    throw error;
  }
  const expected = decodedIdentity(record.identity);
  try {
    if (!expected || !sameFileIdentity(inspected.metadata, expected)) return { exists: true, matches: false };
    const digest = await sha256Handle(inspected.handle);
    const [openedAfter, pathAfter] = await Promise.all([
      inspected.handle.stat({ bigint: true }),
      lstat(file, { bigint: true }),
    ]);
    if (!pathAfter.isFile() || pathAfter.isSymbolicLink()
      || !sameSnapshotIdentity(inspected.metadata, openedAfter)
      || !sameSnapshotIdentity(openedAfter, pathAfter)) {
      return { exists: true, matches: false };
    }
    return { exists: true, matches: digest === record.sha256, metadata: inspected.metadata };
  } finally {
    await inspected.handle.close();
  }
}

async function removeRecordedFile(file, record, label, transactionToken, output) {
  const quarantine = `${file}.cleanup.${transactionToken}.${label}`;
  const [published, quarantined] = await Promise.all([currentMetadata(file), currentMetadata(quarantine)]);
  if (published && quarantined) throw new PublicationError(`${label} exists at both publication and recovery paths`);
  let target = published ? file : quarantined ? quarantine : undefined;
  if (!target) return;
  let state = await matchesRecorded(target, record);
  if (!state.matches) throw new PublicationError(`Partial publication ${label} is not owned by the interrupted transaction`);
  if (target === file) {
    await rename(file, quarantine);
    await syncDirectory(dirname(output));
    target = quarantine;
    state = await matchesRecorded(target, record);
    if (!state.matches) {
      await link(quarantine, file).catch(() => undefined);
      throw new PublicationError(`Partial publication ${label} changed during recovery`);
    }
  }
  await rm(target);
  await syncDirectory(dirname(output));
}

async function removeStaging(transaction, output) {
  const quarantine = `${transaction.stagingRoot}.cleanup.${transaction.token}`;
  const [staged, quarantined] = await Promise.all([
    currentMetadata(transaction.stagingRoot),
    currentMetadata(quarantine),
  ]);
  if (staged && quarantined) throw new PublicationError("Staging exists at both build and recovery paths");
  let target = staged ? transaction.stagingRoot : quarantined ? quarantine : undefined;
  if (!target) return;
  const expected = decodedIdentity(transaction.stagingIdentity);
  let metadata = await lstat(target, { bigint: true });
  if (!expected || !metadata.isDirectory() || metadata.isSymbolicLink()
    || !sameDirectoryIdentity(metadata, expected)) {
    throw new PublicationError("Staging root is not owned by the interrupted transaction");
  }
  if (target === transaction.stagingRoot) {
    await rename(target, quarantine);
    await syncDirectory(dirname(output));
    target = quarantine;
    metadata = await lstat(target, { bigint: true });
    if (!metadata.isDirectory() || metadata.isSymbolicLink() || !sameDirectoryIdentity(metadata, expected)) {
      throw new PublicationError("Staging root changed during recovery");
    }
  }
  await rm(target, { recursive: true });
  await syncDirectory(dirname(output));
}

async function removeTransaction(transactionPath, inspected, transactionToken, output) {
  const quarantine = `${transactionPath}.cleanup.${transactionToken}`;
  const [published, quarantined] = await Promise.all([
    currentMetadata(transactionPath),
    currentMetadata(quarantine),
  ]);
  if (published && quarantined) throw new PublicationError("Transaction exists at both publication and recovery paths");
  let target = published ? transactionPath : quarantined ? quarantine : undefined;
  if (!target) return;
  if (target === transactionPath) {
    await rename(transactionPath, quarantine);
    await syncDirectory(dirname(output));
    target = quarantine;
  }
  const moved = await lstat(target, { bigint: true });
  if (!sameFileIdentity(moved, inspected.metadata)) throw new PublicationError("Transaction changed during recovery cleanup");
  await rm(target);
  await syncDirectory(dirname(output));
}

export async function beginPublicationTransaction(outputInput, stagingInput, token, options = {}) {
  const output = resolve(outputInput);
  const stagingRoot = resolve(stagingInput);
  validateOwnerArguments(process.pid, token);
  validateStagingLocation(output, stagingRoot);
  const staging = await lstat(stagingRoot, { bigint: true });
  if (!staging.isDirectory() || staging.isSymbolicLink()) throw new PublicationError("Staging root is not a regular directory");
  const transaction = {
    schemaVersion: 2,
    phase: "building",
    host: hostname(),
    token,
    output,
    stagingRoot,
    stagingIdentity: storedIdentity(staging),
    createdAt: new Date().toISOString(),
  };
  try {
    const transactionSource = await writeTransactionRecord(stagingRoot, transaction);
    await options.afterRecordWrite?.(transactionSource);
    return transactionSource;
  } catch (error) {
    try {
      await removeStaging(transaction, output);
    } catch (cleanupError) {
      throw new PublicationError(`Transaction begin failed and owned staging cleanup also failed (${error.message}; ${cleanupError.message})`);
    }
    throw error;
  }
}

export async function abortUnpublishedPublicationTransaction(outputInput, stagingInput, token, transactionSourceInput) {
  const output = resolve(outputInput);
  const stagingRoot = resolve(stagingInput);
  const transactionSource = resolve(transactionSourceInput);
  validateOwnerArguments(process.pid, token);
  validateStagingLocation(output, stagingRoot);
  if (dirname(transactionSource) !== stagingRoot
    || !basename(transactionSource).startsWith("corresponding-source.transaction.")
    || !basename(transactionSource).endsWith(".json")) {
    throw new PublicationError("Unpublished transaction source is outside its owned staging root");
  }
  const read = await readTrustedJson(transactionSource);
  const transaction = read.value;
  try {
    if (transaction.schemaVersion !== 2 || transaction.phase !== "building"
      || transaction.host !== hostname() || transaction.token !== token
      || transaction.output !== output || transaction.stagingRoot !== stagingRoot
      || !decodedIdentity(transaction.stagingIdentity)) {
      throw new PublicationError("Unpublished transaction ownership metadata is invalid");
    }
  } finally {
    await read.inspected.handle.close();
  }
  await removeStaging(transaction, output);
}

export async function preparePublicationTransaction(outputInput, stagingInput, token) {
  const output = resolve(outputInput);
  const stagingRoot = resolve(stagingInput);
  validateOwnerArguments(process.pid, token);
  validateStagingLocation(output, stagingRoot);
  const { transactionPath, readyTransactionPath, destinations, sources } = transactionPaths(output, stagingRoot);
  const staging = await lstat(stagingRoot, { bigint: true });
  if (!staging.isDirectory() || staging.isSymbolicLink()) throw new PublicationError("Staging root is not a regular directory");
  const files = {};
  for (const kind of Object.keys(destinations)) {
    const inspected = await inspectRegularFile(sources[kind]);
    try {
      const digest = await sha256Handle(inspected.handle);
      const [openedAfter, pathAfter] = await Promise.all([
        inspected.handle.stat({ bigint: true }),
        lstat(sources[kind], { bigint: true }),
      ]);
      if (!pathAfter.isFile() || pathAfter.isSymbolicLink()
        || !sameSnapshotIdentity(inspected.metadata, openedAfter)
        || !sameSnapshotIdentity(openedAfter, pathAfter)) {
        throw new PublicationError(`Publication source changed during preparation: ${sources[kind]}`);
      }
      files[kind] = {
        source: sources[kind],
        destination: destinations[kind],
        identity: storedIdentity(inspected.metadata),
        sha256: digest,
      };
    } finally {
      await inspected.handle.close();
    }
  }
  const existing = await readTransaction(transactionPath);
  if (!existing) throw new PublicationError("Building transaction disappeared before preparation");
  const building = existing.transaction;
  if (building.phase !== "building" || building.token !== token || building.stagingRoot !== stagingRoot) {
    await existing.inspected.handle.close();
    throw new PublicationError("Building transaction ownership changed before preparation");
  }
  const authorizedStagingIdentity = decodedIdentity(building.stagingIdentity);
  if (!authorizedStagingIdentity || !sameDirectoryIdentity(staging, authorizedStagingIdentity)) {
    await existing.inspected.handle.close();
    throw new PublicationError("Staging directory identity changed before preparation");
  }
  const currentStagingIdentity = storedIdentity(staging);
  const buildingIdentity = storedIdentity(existing.inspected.metadata);
  await existing.inspected.handle.close();
  const target = await writeTransactionRecord(stagingRoot, {
    schemaVersion: 2,
    phase: "ready",
    host: hostname(),
    token,
    output,
    stagingRoot,
    stagingIdentity: currentStagingIdentity,
    buildingIdentity,
    files,
    createdAt: new Date().toISOString(),
  });
  await publishNoClobber(target, readyTransactionPath);
}

export async function recoverPublicationTransaction(outputInput) {
  const output = resolve(outputInput);
  const {
    transactionPath,
    readyTransactionPath,
    cleanupTransactionPath,
    destinations,
    sourceBasenames,
  } = transactionPaths(output);
  const read = await readTransaction(transactionPath, readyTransactionPath, cleanupTransactionPath);
  if (!read) return undefined;
  const { inspected, transaction } = read;
  await inspected.handle.close();
  const expectedStagingPrefix = `.${basename(output)}.staging.`;
  const stagingIdentity = decodedIdentity(transaction.stagingIdentity);
  if (transaction.schemaVersion !== 2 || !["building", "ready"].includes(transaction.phase)
    || transaction.host !== hostname() || transaction.output !== output
    || !validToken(transaction.token)
    || typeof transaction.stagingRoot !== "string" || dirname(transaction.stagingRoot) !== dirname(output)
    || !basename(transaction.stagingRoot).startsWith(expectedStagingPrefix)
    || !stagingIdentity
    || typeof transaction.createdAt !== "string" || !Number.isFinite(Date.parse(transaction.createdAt))) {
    throw new PublicationError("Interrupted publication transaction metadata is invalid");
  }
  let completed = false;
  if (transaction.phase === "ready") {
    const buildingIdentity = decodedIdentity(transaction.buildingIdentity);
    if (!buildingIdentity || ![readyTransactionPath, cleanupTransactionPath].includes(read.transactionPath)) {
      throw new PublicationError("Ready publication transaction metadata is invalid");
    }
    let building;
    try {
      building = await readTrustedJson(transactionPath);
    } catch (error) {
      if (error?.code !== "ENOENT") throw error;
    }
    if (!building && read.transactionPath !== cleanupTransactionPath) {
      throw new PublicationError("Building transaction disappeared after preparation");
    }
    if (building) {
      try {
        if (!sameFileIdentity(building.inspected.metadata, buildingIdentity)
          || building.value.phase !== "building"
          || building.value.host !== transaction.host
          || building.value.token !== transaction.token
          || building.value.output !== transaction.output
          || building.value.stagingRoot !== transaction.stagingRoot) {
          throw new PublicationError("Building transaction ownership changed after preparation");
        }
      } finally {
        await building.inspected.handle.close();
      }
    }
    const paths = transactionPaths(output, transaction.stagingRoot);
    for (const kind of Object.keys(destinations)) {
      const file = transaction.files?.[kind];
      if (!file || file.source !== join(transaction.stagingRoot, sourceBasenames[kind])
        || file.destination !== destinations[kind] || !decodedIdentity(file.identity)
        || typeof file.sha256 !== "string" || !/^[a-f0-9]{64}$/u.test(file.sha256)) {
        throw new PublicationError(`Interrupted publication ${kind} metadata is invalid`);
      }
      if (file.source !== paths.sources[kind]) throw new PublicationError(`Interrupted publication ${kind} source is invalid`);
    }
    const states = {};
    for (const kind of Object.keys(destinations)) states[kind] = await matchesRecorded(destinations[kind], transaction.files[kind]);
    completed = states.completion.exists;
    if (completed) {
      if (!Object.values(states).every((state) => state.exists && state.matches)) {
        throw new PublicationError("Completed publication does not match its interrupted transaction record");
      }
    } else {
      await removeRecordedFile(destinations.archive, transaction.files.archive, "archive", transaction.token, output);
      await removeRecordedFile(destinations.evidence, transaction.files.evidence, "evidence", transaction.token, output);
    }
  }
  await removeStaging(transaction, output);
  let cleanup = read;
  if (read.transactionPath !== cleanupTransactionPath) {
    await publishNoClobber(read.transactionPath, cleanupTransactionPath);
    cleanup = await readTransaction(undefined, undefined, cleanupTransactionPath);
    if (!cleanup) throw new PublicationError("Transaction cleanup marker disappeared after publication");
    await cleanup.inspected.handle.close();
  }
  if (transaction.phase === "ready" && transaction.schemaVersion === 2) {
    await removeTransaction(readyTransactionPath, cleanup.inspected, transaction.token, output);
    const expectedBuilding = decodedIdentity(transaction.buildingIdentity);
    if (!expectedBuilding) throw new PublicationError("Building transaction identity is invalid during cleanup");
    await removeTransaction(transactionPath, { metadata: expectedBuilding }, transaction.token, output);
  } else {
    await removeTransaction(transactionPath, cleanup.inspected, transaction.token, output);
  }
  await removeTransaction(cleanupTransactionPath, cleanup.inspected, transaction.token, output);
  return completed ? "completed" : "recovered";
}

function numericPid(value) {
  if (!/^\d+$/u.test(value ?? "")) return Number.NaN;
  return Number(value);
}

async function main(argv) {
  const [category, operation, ...args] = argv;
  let result;
  if (category === "lock" && operation === "acquire") result = await acquireOutputLock(args[0], numericPid(args[1]), args[2]);
  else if (category === "lock" && operation === "release") result = await releaseOutputLock(args[0], numericPid(args[1]), args[2]);
  else if (category === "guard" && operation === "acquire") result = await acquireOutputGuard(args[0], numericPid(args[1]), args[2]);
  else if (category === "guard" && operation === "release") result = await releaseOutputGuard(args[0], numericPid(args[1]), args[2]);
  else if (category === "publication" && operation === "publish") await publishNoClobber(args[0], args[1]);
  else if (category === "publication" && operation === "remove-owned") await removeOwnedPublication(args[0], args[1]);
  else if (category === "transaction" && operation === "begin") result = await beginPublicationTransaction(args[0], args[1], args[2]);
  else if (category === "transaction" && operation === "abort-unpublished") await abortUnpublishedPublicationTransaction(args[0], args[1], args[2], args[3]);
  else if (category === "transaction" && operation === "prepare") await preparePublicationTransaction(args[0], args[1], args[2]);
  else if (category === "transaction" && operation === "recover") result = await recoverPublicationTransaction(args[0]);
  else throw new PublicationError(`Unknown corresponding-source publication operation: ${[category, operation].filter(Boolean).join(" ")}`);
  if (result !== undefined) process.stdout.write(`${result}\n`);
}

const isMain = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMain) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof PublicationError ? error.message : `Corresponding-source publication failed closed: ${error.message}`);
    process.exitCode = error instanceof PublicationError ? error.exitCode : 1;
  });
}
