import { createHash, randomUUID } from "node:crypto";
import { chmod, lstat, mkdir, mkdtemp, readFile, realpath, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { FriendlyAdversaryError } from "./errors.js";

const pendingWrites = new Map<string, Promise<void>>();

export interface RenameIo {
  platform: NodeJS.Platform;
  rename(source: string, destination: string): Promise<void>;
  delay(milliseconds: number): Promise<void>;
}

const DEFAULT_RENAME_IO: RenameIo = {
  platform: process.platform,
  rename,
  delay: async (milliseconds) => delay(milliseconds),
};

export async function renameWithWindowsRetry(
  source: string,
  destination: string,
  io: RenameIo = DEFAULT_RENAME_IO,
): Promise<void> {
  for (let attempt = 0; ; attempt += 1) {
    try {
      await io.rename(source, destination);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (io.platform !== "win32" || !["EACCES", "EBUSY", "EPERM"].includes(code ?? "") || attempt >= 11) {
        throw error;
      }
      await io.delay(Math.min(5 * (2 ** attempt), 100));
    }
  }
}

export async function replaceFileAtomic(
  temporary: string,
  destination: string,
  io: RenameIo = DEFAULT_RENAME_IO,
): Promise<void> {
  await renameWithWindowsRetry(temporary, destination, io);
}

export async function ensureDirectory(directory: string): Promise<void> {
  await mkdir(directory, { recursive: true });
}

export async function pathExists(candidate: string): Promise<boolean> {
  try {
    await stat(candidate);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

export async function writeFileAtomic(
  filePath: string,
  content: string | Uint8Array,
): Promise<void> {
  const key = path.resolve(filePath);
  const previous = pendingWrites.get(key) ?? Promise.resolve();
  const current = previous.catch(() => undefined).then(async () => {
    await ensureDirectory(path.dirname(filePath));
    const temporary = `${filePath}.tmp-${process.pid}-${randomUUID()}`;
    try {
      await writeFile(temporary, content, { flag: "wx", mode: 0o600 });
      await replaceFileAtomic(temporary, filePath);
    } finally {
      await rm(temporary, { force: true });
    }
  });
  pendingWrites.set(key, current);
  try {
    await current;
  } finally {
    if (pendingWrites.get(key) === current) pendingWrites.delete(key);
  }
}

export async function writeJsonAtomic(
  filePath: string,
  value: unknown,
): Promise<void> {
  await writeFileAtomic(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, "utf8")) as T;
}

export function sha256(content: string | Uint8Array): string {
  return createHash("sha256").update(content).digest("hex");
}

export function assertInside(parent: string, child: string): void {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new FriendlyAdversaryError(
      `Output must remain inside the reviewed repository: ${child}`,
      2,
    );
  }
}

export async function ensureSafeOutputRoot(
  repositoryRoot: string,
  outputRoot: string,
): Promise<string> {
  const repoReal = await realpath(repositoryRoot);
  const absolute = path.resolve(outputRoot);
  assertInside(repoReal, absolute);
  const relative = path.relative(repoReal, absolute);
  if (relative !== ".friendly-adversary" && !relative.startsWith(`.friendly-adversary${path.sep}`)) {
    throw new FriendlyAdversaryError("Output must be inside .friendly-adversary/", 2);
  }
  if (relative.split(path.sep).slice(1).includes(".friendly-adversary")) {
    throw new FriendlyAdversaryError("Output cannot contain a nested .friendly-adversary directory", 2);
  }
  let cursor = repoReal;
  for (const component of relative.split(path.sep)) {
    cursor = path.join(cursor, component);
    try {
      const metadata = await lstat(cursor);
      if (metadata.isSymbolicLink()) {
        throw new FriendlyAdversaryError(`Refusing symbolic-link output path: ${cursor}`, 2);
      }
      if (!metadata.isDirectory()) {
        throw new FriendlyAdversaryError(`Output path component is not a directory: ${cursor}`, 2);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      try {
        await mkdir(cursor, { mode: 0o700 });
      } catch (createError) {
        if ((createError as NodeJS.ErrnoException).code !== "EEXIST") throw createError;
        const metadata = await lstat(cursor);
        if (metadata.isSymbolicLink() || !metadata.isDirectory()) {
          throw new FriendlyAdversaryError(`Refusing unsafe output path created concurrently: ${cursor}`, 2);
        }
      }
    }
  }
  const outputReal = await realpath(absolute);
  assertInside(repoReal, outputReal);
  await chmod(outputReal, 0o700);
  return outputReal;
}

export async function createUniqueRunDirectory(
  runsRoot: string,
  prefix: string,
): Promise<string> {
  await ensureDirectory(runsRoot);
  const directory = await mkdtemp(path.join(runsRoot, `${prefix}-`));
  await chmod(directory, 0o700);
  return directory;
}
