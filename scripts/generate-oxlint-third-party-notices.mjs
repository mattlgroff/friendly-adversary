import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { constants } from "node:fs";
import { access, copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = path.join(ROOT, "build", "oxlint-wasm", "Cargo.toml");
const OUTPUT = path.join(ROOT, "third-party", "oxlint-wasm");
const OVERRIDES = path.join(ROOT, "build", "oxlint-wasm", "license-overrides");

async function exists(file) {
  try {
    await access(file, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function command(executable, args, env) {
  const result = spawnSync(executable, args, {
    cwd: ROOT,
    env,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error?.code === "ENOENT") {
    throw new Error(`Cargo is required to regenerate Oxlint dependency notices. Install Rust 1.97.1 or set CARGO to its cargo executable. Attempted: ${executable}`);
  }
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${JSON.stringify([executable, ...args])} exited ${result.status}\n${result.stdout ?? ""}${result.stderr ?? ""}`);
  return result.stdout ?? "";
}

function safeName(value) {
  return value.replace(/[^A-Za-z0-9._-]+/g, "-");
}

const GPL3_COMPATIBLE_SELECTIONS = new Map([
  ["(MIT OR Apache-2.0) AND Unicode-3.0", "MIT AND Unicode-3.0"],
  ["0BSD OR MIT OR Apache-2.0", "MIT"],
  ["Apache-2.0", "Apache-2.0"],
  ["Apache-2.0 OR BSL-1.0", "Apache-2.0"],
  ["Apache-2.0 OR GPL-2.0-only", "Apache-2.0"],
  ["Apache-2.0 OR MIT", "MIT"],
  ["Apache-2.0 WITH LLVM-exception OR BSL-1.0", "Apache-2.0 WITH LLVM-exception"],
  ["Apache-2.0/MIT", "MIT"],
  ["MIT", "MIT"],
  ["MIT OR Apache-2.0", "MIT"],
  ["MIT OR Zlib OR Apache-2.0", "MIT"],
  ["MIT/Apache-2.0", "MIT"],
  ["Unicode-3.0", "Unicode-3.0"],
  ["Unlicense OR MIT", "MIT"],
  ["Unlicense/MIT", "MIT"],
  ["Zlib", "Zlib"],
]);

async function listFiles(root, current = root) {
  const files = [];
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name);
    if (entry.isDirectory()) files.push(...await listFiles(root, absolute));
    else if (entry.isFile()) files.push(path.relative(root, absolute).split(path.sep).join("/"));
  }
  return files;
}

async function licenseFilesForPackage(packageRoot) {
  let current = packageRoot;
  for (let depth = 0; depth < 12; depth += 1) {
    const files = (await readdir(current, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && /^(?:LICENSE|COPYING|NOTICE)/i.test(entry.name))
      .map((entry) => path.join(current, entry.name));
    if (files.length) return files;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return [];
}

async function main() {
  const cargo = process.env.CARGO ?? "cargo";
  const metadata = JSON.parse(command(cargo, [
    "metadata", "--manifest-path", MANIFEST, "--locked", "--offline", "--filter-platform", "wasm32-wasip1", "--format-version", "1",
  ]));
  const tree = command(cargo, [
    "tree", "--manifest-path", MANIFEST, "--locked", "--offline", "--target", "wasm32-wasip1", "--edges", "normal", "--prefix", "none", "--format", "{p}",
  ]);
  const identities = new Map();
  for (const line of tree.split("\n")) {
    const match = /^([^ ]+) v([^ ]+)/.exec(line);
    if (!match || match[1] === "friendly_adversary_oxlint_wasm") continue;
    identities.set(`${match[1]}\0${match[2]}`, { name: match[1], version: match[2] });
  }
  const packages = [...identities.values()].map((identity) => {
    const candidates = metadata.packages.filter((candidate) => candidate.name === identity.name && candidate.version === identity.version);
    if (candidates.length !== 1) throw new Error(`Expected one Cargo package for ${identity.name} ${identity.version}, found ${candidates.length}`);
    return candidates[0];
  }).sort((left, right) => left.name.localeCompare(right.name) || left.version.localeCompare(right.version));

  await rm(OUTPUT, { recursive: true, force: true });
  await mkdir(path.join(OUTPUT, "licenses"), { recursive: true });
  const rows = [];
  for (const pkg of packages) {
    if (!pkg.license) throw new Error(`${pkg.name} ${pkg.version} has no SPDX license expression`);
    const selectedLicense = GPL3_COMPATIBLE_SELECTIONS.get(pkg.license);
    if (!selectedLicense) throw new Error(`${pkg.name} ${pkg.version} has no recorded GPL-3.0-compatible license selection for ${pkg.license}`);
    const packageRoot = path.dirname(pkg.manifest_path);
    let licenseFiles = await licenseFilesForPackage(packageRoot);
    const override = path.join(OVERRIDES, safeName(`${pkg.name}-${pkg.version}`), "LICENSE");
    if (licenseFiles.length === 0 && await exists(override)) licenseFiles = [override];
    if (licenseFiles.length === 0) throw new Error(`${pkg.name} ${pkg.version} has no distributable license file`);
    const destination = path.join(OUTPUT, "licenses", safeName(`${pkg.name}-${pkg.version}`));
    await mkdir(destination, { recursive: true });
    for (const file of licenseFiles.sort()) await copyFile(file, path.join(destination, path.basename(file)));
    const source = pkg.repository ?? pkg.homepage ?? "Cargo registry package metadata";
    rows.push(`| ${pkg.name} | ${pkg.version} | ${pkg.license.replaceAll("|", "\\|")} | ${source.replaceAll("|", "\\|")} |`);
  }

  const compatibilityRows = [...new Set(packages.map((pkg) => pkg.license))]
    .sort()
    .map((license) => `| \`${license}\` | \`${GPL3_COMPATIBLE_SELECTIONS.get(license)}\` |`);

  const notice = [
    "# Oxlint WebAssembly third-party notices",
    "",
    "This inventory is generated from the locked normal-dependency closure of `build/oxlint-wasm/Cargo.toml` for `wasm32-wasip1`. Development-only and explicitly build-only edges are excluded. The inventory conservatively retains proc-macro packages reached through normal dependency edges even though those macros execute while compiling rather than at runtime.",
    "",
    `The recorded closure contains ${packages.length} third-party Rust packages. Exact license and notice files are preserved under \`licenses/<package>-<version>/\`. SPDX expressions containing \`OR\` describe upstream alternative licensing choices. Friendly Adversary does not relicense those components.`,
    "",
    "## GPL-3.0 compatibility selections",
    "",
    "Every upstream expression in the locked closure has an explicit GPL-3.0-compatible choice. The original expression and all component notices remain in force.",
    "",
    "| Upstream license expression | Selected compatible license |",
    "| --- | --- |",
    ...compatibilityRows,
    "",
    "| Package | Version | Upstream license expression | Source |",
    "| --- | --- | --- | --- |",
    ...rows,
    "",
  ].join("\n");
  await writeFile(path.join(OUTPUT, "NOTICE.md"), notice);
  const noticeFiles = (await listFiles(OUTPUT)).filter((file) => file !== "SHA256SUMS").sort();
  const sums = [];
  for (const file of noticeFiles) {
    const digest = createHash("sha256").update(await readFile(path.join(OUTPUT, ...file.split("/")))).digest("hex");
    sums.push(`${digest}  ${file}`);
  }
  await writeFile(path.join(OUTPUT, "SHA256SUMS"), `${sums.join("\n")}\n`);
  process.stdout.write(`Recorded ${packages.length} dependency packages in ${path.relative(ROOT, OUTPUT)}\n`);
}

await main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
  process.exitCode = 1;
});
