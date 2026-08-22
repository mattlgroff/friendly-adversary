import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceIndex = process.argv.indexOf("--source");
const source = sourceIndex >= 0 ? process.argv[sourceIndex + 1] : undefined;
if (!source || !path.isAbsolute(source)) {
  process.stderr.write("Usage: node scripts/generate-semgrep-linked-inventory.mjs --source /absolute/patched/semgrep-source\n");
  process.exit(2);
}

function run(command, args, cwd = root) {
  return execFileSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function field(output, name) {
  const line = output.split("\n").find((entry) => entry.startsWith(`${name} `));
  return line?.slice(name.length).trim() ?? "";
}

function unquote(value) {
  if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
  return value;
}

const targets = [
  "js/engine/Main.bc-for-jsoo",
  "js/languages/python/Parser.bc-for-jsoo",
  "js/languages/typescript/Parser.bc-for-jsoo",
];
const switchPrefix = run("opam", ["var", "prefix"]);
const sourcesRoot = path.join(switchPrefix, ".opam-switch", "sources");
const sourceDirectories = await readdir(sourcesRoot, { withFileTypes: true });
const licenseRoot = path.join(root, "engines", "semgrep-wasm", "source", "licenses", "opam-linked");
await rm(licenseRoot, { recursive: true, force: true });
await mkdir(licenseRoot, { recursive: true });
const rules = run("dune", ["rules", "--profile", "release", ...targets], source);
const escapedPrefix = switchPrefix.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
const libraryPattern = new RegExp(`${escapedPrefix}/lib/([^/\\s)"]+)`, "gu");
const libraries = [...new Set([...rules.matchAll(libraryPattern)].map((match) => match[1]).filter(Boolean))].sort();
const packageLibraries = new Map();

for (const library of libraries) {
  const owners = run("opam", ["list", "--owns-file", path.join(switchPrefix, "lib", library), "--short", "--color=never"])
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
  if (owners.length === 0) throw new Error(`No installed OPAM package owns linked library ${library}`);
  for (const owner of owners) {
    const current = packageLibraries.get(owner) ?? [];
    current.push(library);
    packageLibraries.set(owner, current);
  }
}

const linkedOcamlPackages = [];
const selectedLicense = new Map([
  ["BSD-3-Clause", "BSD-3-Clause"],
  ["BSD-3-clause", "BSD-3-Clause"],
  ["GPL-2.0-or-later", "GPL-3.0-only"],
  ["ISC", "ISC"],
  ["LGPL-2.0-only with OCaml-LGPL-linking-exception", "LGPL-2.0-only WITH OCaml-LGPL-linking-exception"],
  ["LGPL-2.1-only", "LGPL-2.1-only"],
  ["LGPL-2.1-only WITH OCaml-LGPL-linking-exception", "LGPL-2.1-only WITH OCaml-LGPL-linking-exception"],
  ["LGPL-2.1-or-later WITH OCaml-LGPL-linking-exception", "LGPL-2.1-only WITH OCaml-LGPL-linking-exception"],
  ["LGPL-3.0-or-later WITH OCaml-LGPL-linking-exception", "LGPL-3.0-only WITH OCaml-LGPL-linking-exception"],
  ["MIT", "MIT"],
]);
for (const name of [...packageLibraries.keys()].sort()) {
  const metadata = run("opam", ["show", "--field=name,version,license,homepage,dev-repo", name, "--color=never"]);
  const licenseValue = field(metadata, "license");
  const version = unquote(field(metadata, "version"));
  const sourceDirectory = sourceDirectories
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .find((entry) => entry === name || entry === `${name}.${version}`);
  const candidateDirectories = [
    path.join(switchPrefix, "doc", name),
    ...(sourceDirectory ? [path.join(sourcesRoot, sourceDirectory)] : []),
  ];
  const licenseSources = [];
  for (const directory of candidateDirectories) {
    const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      if (entry.isFile() && /^(license|copying|copyright|notice)(\.|$)/iu.test(entry.name)) {
        licenseSources.push(path.join(directory, entry.name));
      }
    }
    if (licenseSources.length > 0) break;
  }
  const licenseFiles = [];
  for (const licenseSource of [...new Set(licenseSources)].sort()) {
    const destinationName = `${name}--${path.basename(licenseSource)}`;
    const destination = path.join(licenseRoot, destinationName);
    await copyFile(licenseSource, destination);
    const content = await readFile(destination);
    licenseFiles.push({
      path: path.relative(root, destination).split(path.sep).join("/"),
      sha256: createHash("sha256").update(content).digest("hex"),
    });
  }
  const declaredLicenses = [...licenseValue.matchAll(/"([^"]+)"/gu)].map((match) => match[1]);
  const selectedLicenses = declaredLicenses.map((license) => selectedLicense.get(license));
  if (selectedLicenses.some((license) => !license)) {
    throw new Error(`No GPL-3.0 compatibility choice is recorded for ${name}: ${declaredLicenses.join(", ")}`);
  }
  linkedOcamlPackages.push({
    name,
    version,
    licenses: declaredLicenses,
    homepage: unquote(field(metadata, "homepage")),
    devRepo: unquote(field(metadata, "dev-repo")),
    libraries: [...new Set(packageLibraries.get(name))].sort(),
    licenseFiles,
  });
}

const missingLicenseFiles = linkedOcamlPackages.filter((entry) => entry.licenseFiles.length === 0).map((entry) => entry.name);
if (missingLicenseFiles.length > 0) {
  throw new Error(`No authoritative license file was found for linked OPAM packages: ${missingLicenseFiles.join(", ")}`);
}

const inventory = {
  schemaVersion: 1,
  distributionLicense: "GPL-3.0-only",
  releaseScope: "public",
  compatibilityMethod: "Every linked OPAM license expression has an explicit GPL-3.0-compatible selection; original component licenses and notices remain in force",
  linkedLicenseSelections: Object.fromEntries([...selectedLicense.entries()].sort(([left], [right]) => left.localeCompare(right))),
  semgrepCommit: "651f37efa397bf066e1cf627414eeabe40b07e27",
  duneProfile: "release",
  targets,
  discovery: "Dune release link rules mapped through opam list --owns-file",
  linkedLibraryCount: libraries.length,
  linkedOcamlPackageCount: linkedOcamlPackages.length,
  linkedOcamlPackagesWithLicenseFiles: linkedOcamlPackages.length,
  linkedOcamlPackages,
  additionalRuntimeComponents: [
    { name: "Semgrep Community Edition", version: "1.172.0", license: "LGPL-2.1-only", selectedLicense: "LGPL-2.1-only", source: "https://github.com/semgrep/semgrep/tree/651f37efa397bf066e1cf627414eeabe40b07e27" },
    { name: "ocaml-tree-sitter-core", version: "2dc9e0c738086df1ce4de93723302d9560d5b76c", license: "LGPL-2.1-only WITH OCaml-LGPL-linking-exception", selectedLicense: "LGPL-2.1-only WITH OCaml-LGPL-linking-exception", source: "https://github.com/returntocorp/ocaml-tree-sitter-core/tree/2dc9e0c738086df1ce4de93723302d9560d5b76c" },
    { name: "PCRE2", version: "10.43", license: "BSD-3-Clause", selectedLicense: "BSD-3-Clause", source: "https://github.com/PCRE2Project/pcre2/releases/tag/pcre2-10.43" },
    { name: "tree-sitter", version: "0.22.6", license: "MIT", selectedLicense: "MIT", source: "https://github.com/tree-sitter/tree-sitter/tree/v0.22.6" },
    { name: "libyaml", version: "0.2.5@2c891fc7a770e8ba2fec34fc6b545c672beb37e6", license: "MIT", selectedLicense: "MIT", source: "https://github.com/yaml/libyaml/tree/2c891fc7a770e8ba2fec34fc6b545c672beb37e6" },
    { name: "Emscripten", version: "6.0.6-git", license: "MIT AND NCSA", selectedLicense: "MIT AND NCSA", source: "https://github.com/emscripten-core/emscripten" },
    { name: "musl libc", version: "Emscripten 6.0.6 vendored source", license: "MIT", selectedLicense: "MIT", source: "https://github.com/emscripten-core/emscripten/tree/6.0.6/system/lib/libc/musl" },
    { name: "esbuild", version: "0.17.18", license: "MIT", selectedLicense: "MIT", source: "https://github.com/evanw/esbuild/tree/v0.17.18" },
    { name: "semgrep-python generated parser", version: "647a20f8207740b0a76541bb27e1eaaf111dca7e", license: "GPL-3.0-only", selectedLicense: "GPL-3.0-only", source: "https://github.com/semgrep/semgrep-python/tree/647a20f8207740b0a76541bb27e1eaaf111dca7e", provenance: "engines/semgrep-wasm/source/generated-parser-license-evidence.json", gate: "cleared for the public GPL-3.0-only distribution; upstream root license remains NOASSERTION" },
    { name: "semgrep-typescript generated parser", version: "50fe6a5c46d3dee74d1d176b9767ffc520a1003e", license: "GPL-3.0-only", selectedLicense: "GPL-3.0-only", source: "https://github.com/semgrep/semgrep-typescript/tree/50fe6a5c46d3dee74d1d176b9767ffc520a1003e", provenance: "engines/semgrep-wasm/source/generated-parser-license-evidence.json", gate: "cleared for the public GPL-3.0-only distribution; upstream root license remains NOASSERTION" },
    { name: "semgrep-tsx generated parser", version: "6005de74ed9e2fb891785a3df8582dbb91e272bc", license: "GPL-3.0-only", selectedLicense: "GPL-3.0-only", source: "https://github.com/semgrep/semgrep-tsx/tree/6005de74ed9e2fb891785a3df8582dbb91e272bc", provenance: "engines/semgrep-wasm/source/generated-parser-license-evidence.json", gate: "cleared for the public GPL-3.0-only distribution; upstream root license remains NOASSERTION" },
  ],
};

const output = path.join(root, "engines", "semgrep-wasm", "source", "linked-components.json");
await writeFile(output, `${JSON.stringify(inventory, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ output: path.relative(root, output), linkedLibraries: libraries.length, linkedOcamlPackages: linkedOcamlPackages.length }, null, 2)}\n`);
