import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const engine = path.join(root, "engines", "ripgrep-wasm");

async function walk(current = engine) {
  const files = [];
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.isFile() && entry.name !== "SHA256SUMS") files.push(absolute);
  }
  return files;
}

const rows = [];
for (const absolute of (await walk()).sort()) {
  const relative = path.relative(engine, absolute).split(path.sep).join("/");
  const digest = createHash("sha256").update(await readFile(absolute)).digest("hex");
  rows.push(`${digest}  ${relative}`);
}
await writeFile(path.join(engine, "SHA256SUMS"), `${rows.join("\n")}\n`);
process.stdout.write(`ripgrep distribution manifest: ${rows.length} files\n`);
