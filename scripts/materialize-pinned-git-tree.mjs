import { execFileSync } from "node:child_process";
import { chmod, mkdir, mkdtemp, realpath, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

function isInside(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === "" || (relative !== ".." && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative));
}

export async function materializePinnedGitTree(sourceRoot, expectedCommit, label) {
  const canonicalSourceRoot = await realpath(sourceRoot);
  const environment = {
    PATH: process.env.PATH,
    LANG: "C.UTF-8",
    LC_ALL: "C.UTF-8",
    GIT_CONFIG_NOSYSTEM: "1",
    GIT_PAGER: "cat",
    GIT_TERMINAL_PROMPT: "0",
    SystemRoot: process.env.SystemRoot,
    WINDIR: process.env.WINDIR,
    ComSpec: process.env.ComSpec,
    PATHEXT: process.env.PATHEXT,
  };
  const git = (args, options = {}) => execFileSync("git", ["-C", canonicalSourceRoot, "-c", "core.fsmonitor=false", "-c", "core.untrackedCache=false", ...args], {
    cwd: canonicalSourceRoot,
    env: environment,
    maxBuffer: 1024 * 1024 * 1024,
    ...options,
  });
  const toplevel = await realpath(git(["rev-parse", "--show-toplevel"], { encoding: "utf8" }).trim());
  if (toplevel !== canonicalSourceRoot) throw new Error(`${label} Git toplevel is ${toplevel}, expected ${canonicalSourceRoot}`);
  const head = git(["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  if (head !== expectedCommit) throw new Error(`${label} source is at ${head}, expected ${expectedCommit}`);

  const entries = git(["ls-tree", "-r", "-z", "--full-tree", expectedCommit], { encoding: "utf8" })
    .split("\0")
    .filter(Boolean)
    .map((record) => {
      const match = /^(100644|100755|120000) blob ([a-f0-9]+)\t([^\0]+)$/u.exec(record);
      if (!match?.[1] || !match[2] || !match[3]) throw new Error(`${label} pinned tree contains an unsupported Git entry`);
      const relative = match[3];
      if (path.isAbsolute(relative) || relative.split("/").includes("..")) throw new Error(`${label} pinned tree contains an unsafe path`);
      return { mode: match[1], object: match[2], relative };
    });
  const batch = git(["cat-file", "--batch"], {
    input: `${entries.map(({ object }) => object).join("\n")}\n`,
  });
  let offset = 0;
  const blobs = entries.map(({ object }) => {
    const newline = batch.indexOf(0x0a, offset);
    if (newline < 0) throw new Error(`${label} Git object batch ended before its header`);
    const header = batch.subarray(offset, newline).toString("utf8");
    const match = new RegExp(`^${object} blob (\\d+)$`, "u").exec(header);
    if (!match?.[1]) throw new Error(`${label} Git object batch returned an unexpected object`);
    const size = Number(match[1]);
    const start = newline + 1;
    const end = start + size;
    if (!Number.isSafeInteger(size) || end >= batch.length || batch[end] !== 0x0a) throw new Error(`${label} Git object batch returned a truncated blob`);
    offset = end + 1;
    return batch.subarray(start, end);
  });
  if (offset !== batch.length) throw new Error(`${label} Git object batch returned trailing data`);

  const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), "friendly-adversary-pinned-tree-"));
  const tree = path.join(temporaryRoot, "tree");
  await mkdir(tree);
  try {
    for (let index = 0; index < entries.length; index += 1) {
      const entry = entries[index];
      const blob = blobs[index];
      const destination = path.join(tree, ...entry.relative.split("/"));
      if (!isInside(tree, destination)) throw new Error(`${label} materialized path escaped its root`);
      await mkdir(path.dirname(destination), { recursive: true });
      if (entry.mode === "120000") {
        const target = blob.toString("utf8");
        const resolved = path.resolve(path.dirname(destination), target);
        if (path.isAbsolute(target) || !isInside(tree, resolved)) throw new Error(`${label} pinned tree contains an escaping symbolic link`);
        await symlink(target, destination);
      } else {
        await writeFile(destination, blob);
        if (entry.mode === "100755") await chmod(destination, 0o755);
      }
    }
    return { root: tree, cleanup: () => rm(temporaryRoot, { recursive: true, force: true }) };
  } catch (error) {
    await rm(temporaryRoot, { recursive: true, force: true });
    throw error;
  }
}
