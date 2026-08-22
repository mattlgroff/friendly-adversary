import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const mode = process.argv[2] ?? "verify";
const publicationMessage = [
  "Friendly Adversary has no npm registry distribution target.",
  "Install from the public GitHub repository or its release archive; npm publication is disabled unconditionally.",
].join(" ");
const expectedLinkedLicenseSelections = new Map([
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
const expectedDirectComponentSelections = new Map([
  ["Semgrep Community Edition", ["LGPL-2.1-only", "LGPL-2.1-only"]],
  ["ocaml-tree-sitter-core", ["LGPL-2.1-only WITH OCaml-LGPL-linking-exception", "LGPL-2.1-only WITH OCaml-LGPL-linking-exception"]],
  ["PCRE2", ["BSD-3-Clause", "BSD-3-Clause"]],
  ["tree-sitter", ["MIT", "MIT"]],
  ["libyaml", ["MIT", "MIT"]],
  ["Emscripten", ["MIT AND NCSA", "MIT AND NCSA"]],
  ["musl libc", ["MIT", "MIT"]],
  ["esbuild", ["MIT", "MIT"]],
  ["semgrep-python generated parser", ["GPL-3.0-only", "GPL-3.0-only"]],
  ["semgrep-typescript generated parser", ["GPL-3.0-only", "GPL-3.0-only"]],
  ["semgrep-tsx generated parser", ["GPL-3.0-only", "GPL-3.0-only"]],
]);

if (mode === "block") {
  process.stderr.write(`${publicationMessage}\n`);
  process.exitCode = 1;
} else if (mode !== "verify") {
  process.stderr.write("Usage: node scripts/enforce-public-release.mjs [verify|block]\n");
  process.exitCode = 2;
} else {
  const errors = [];
  const readJson = async (relative) => JSON.parse(await readFile(path.join(root, ...relative.split("/")), "utf8"));
  const sha256 = (content) => createHash("sha256").update(content).digest("hex");
  const gitBlobSha1 = (content) => createHash("sha1")
    .update(`blob ${content.byteLength}\0`)
    .update(content)
    .digest("hex");
  const packageJson = await readJson("package.json");
  const packageLock = await readJson("package-lock.json");

  if (packageJson.private !== true) errors.push("package.json must set private to true");
  if (packageLock.version !== packageJson.version || packageLock.packages?.[""]?.version !== packageJson.version) {
    errors.push("package-lock.json root versions must match package.json");
  }
  if (packageJson.license !== "GPL-3.0-only") errors.push("package.json must declare GPL-3.0-only");
  if (packageJson.publishConfig !== undefined) errors.push("package.json must not define publishConfig");
  if (packageJson.scripts?.prepublishOnly !== "node scripts/enforce-public-release.mjs block") {
    errors.push("package.json must retain the unconditional prepublishOnly blocker");
  }
  if (packageJson.scripts?.["verify:public-release"] !== "node scripts/enforce-public-release.mjs verify") {
    errors.push("package.json must retain the public-release verifier");
  }
  if (!packageJson.files?.includes("scripts/enforce-public-release.mjs")) {
    errors.push("The packed artifact must include the public-release guard");
  }
  if (!packageJson.files?.includes("LICENSING.md")) errors.push("The packed artifact must include LICENSING.md");

  const rootLicense = await readFile(path.join(root, "LICENSE"));
  const rootLicensing = await readFile(path.join(root, "LICENSING.md"));
  const rootLicensingText = rootLicensing.toString("utf8");
  for (const required of [
    "distributed under GPL-3.0-only",
    "must attach the exact complete Corresponding Source archive",
    "Forks and modified distributions must comply with GPL-3.0-only",
  ]) {
    if (!rootLicensingText.includes(required)) errors.push(`LICENSING.md is missing the public distribution boundary: ${required}`);
  }
  if (/\[[^\]]+\]\([^)]+\)/u.test(rootLicensingText)) {
    errors.push("LICENSING.md must use location-independent code paths instead of Markdown links");
  }
  const parserLicense = await readFile(path.join(root, "engines", "semgrep-wasm", "source", "licenses", "GENERATED-PARSERS-GPL-3.0.txt"));
  const expectedGplSha256 = "3972dc9744f6499f0f9b2dbf76696f2ae7ad8af9b23dde66d6af86c9dfb36986";
  if (sha256(rootLicense) !== expectedGplSha256) errors.push("Root GPL-3.0 license text is missing or changed");
  if (sha256(parserLicense) !== expectedGplSha256) errors.push("Generated-parser GPL-3.0 license text is missing or changed");
  for (const pluginRoot of [
    "platforms/codex/plugins/friendly-adversary",
    "platforms/claude-code/plugins/friendly-adversary",
  ]) {
    for (const relativeRoot of [pluginRoot, ...["pr-review", "audit-codebase", "design-new-codebase"].map((skill) => `${pluginRoot}/skills/${skill}`)]) {
      const license = await readFile(path.join(root, relativeRoot, "LICENSE")).catch(() => undefined);
      const licensing = await readFile(path.join(root, relativeRoot, "LICENSING.md")).catch(() => undefined);
      if (!license || sha256(license) !== expectedGplSha256) errors.push(`${relativeRoot}/LICENSE is missing or changed`);
      if (!licensing || !licensing.equals(rootLicensing)) errors.push(`${relativeRoot}/LICENSING.md is missing or changed`);
    }
  }

  const manifests = [
    ["platforms/codex/plugins/friendly-adversary/.codex-plugin/plugin.json", (manifest) => manifest],
    ["platforms/claude-code/plugins/friendly-adversary/.claude-plugin/plugin.json", (manifest) => manifest],
    [".claude-plugin/marketplace.json", (manifest) => manifest.plugins?.[0]],
  ];
  for (const [relative, select] of manifests) {
    const manifest = await readJson(relative);
    const distribution = select(manifest);
    if (distribution?.license !== "GPL-3.0-only") errors.push(`${relative} must declare GPL-3.0-only`);
    if (distribution?.version !== packageJson.version) {
      errors.push(`${relative} version must match package.json version ${packageJson.version}`);
    }
  }
  const constantsSource = await readFile(path.join(root, "src", "constants.ts"), "utf8");
  if (!constantsSource.includes(`PRODUCT_VERSION = ${JSON.stringify(packageJson.version)}`)) {
    errors.push(`src/constants.ts product version must match package.json version ${packageJson.version}`);
  }

  const evidence = await readJson("engines/semgrep-wasm/source/generated-parser-license-evidence.json");
  if (evidence.distributionLicense !== "GPL-3.0-only") errors.push("Generated-parser evidence must use the conservative GPL-3.0-only distribution license");
  if (evidence.releaseScope !== "public" || evidence.publicDistribution?.allowed !== true) {
    errors.push("Generated-parser evidence must authorize the audited public GPL-3.0-only distribution");
  }
  if (evidence.publicDistribution?.sourceOffer !== "https://github.com/mattlgroff/friendly-adversary/releases/download/v3.0.4/semgrep-1.172.0-friendly-adversary-corresponding-source.tar.gz") {
    errors.push("Generated-parser evidence must name the exact public corresponding-source offer");
  }
  const expectedGenerator = {
    repository: "https://github.com/semgrep/ocaml-tree-sitter-semgrep",
    commit: "d68c1d87318808ec1b36ce89570ef6c0bc763f77",
    license: "GPL-3.0-only",
    licenseGitBlobSha: "f288702d2fa16d3cdf0035b15a9fcbc552cd88e7",
    licenseSha256: expectedGplSha256,
    packagedLicenseFile: "source/licenses/GENERATED-PARSERS-GPL-3.0.txt",
  };
  for (const [field, expected] of Object.entries(expectedGenerator)) {
    if (evidence.generator?.[field] !== expected) errors.push(`Generated-parser generator ${field} differs from the pinned provenance`);
  }
  if (sha256(parserLicense) !== evidence.generator?.licenseSha256) {
    errors.push("Packaged generated-parser license does not match the provenance SHA-256");
  }
  if (gitBlobSha1(parserLicense) !== evidence.generator?.licenseGitBlobSha) {
    errors.push("Packaged generated-parser license does not match the provenance Git blob SHA");
  }
  const runtimeManifest = await readJson("engines/semgrep-wasm/runtime-manifest.json");
  const expectedParsers = new Map([
    ["semgrep-python", {
      repository: "https://github.com/semgrep/semgrep-python",
      commit: "647a20f8207740b0a76541bb27e1eaaf111dca7e",
      sourceSubmodulePath: "languages/python/tree-sitter/semgrep-python",
      grammarExtensionPath: "fyi/semgrep-grammars/src/semgrep-python/grammar.js",
      grammarExtensionGitBlobSha: "a4bf791e6eb22a36d2b2d4625d0e2e0fa41a38d8",
      matchingGeneratorPath: "lang/semgrep-grammars/src/semgrep-python/grammar.js",
      matchingGeneratorCommit: expectedGenerator.commit,
      upstreamGrammarLicense: "MIT",
      upstreamGrammarLicenseGitBlobSha: "ff8ed93cb0dd57d68feeefe4829dbc9083584b5e",
      runtimeOutputPaths: ["runtime/python/index.cjs", "runtime/python/semgrep-parser.wasm"],
    }],
    ["semgrep-typescript", {
      repository: "https://github.com/semgrep/semgrep-typescript",
      commit: "50fe6a5c46d3dee74d1d176b9767ffc520a1003e",
      sourceSubmodulePath: "languages/typescript/tree-sitter/semgrep-typescript",
      generationCommit: expectedGenerator.commit,
      generationCommitRecordedByUpstream: true,
      grammarExtensionPath: "fyi/semgrep-grammars/src/semgrep-typescript/typescript/grammar.js",
      grammarExtensionGitBlobSha: "aabad764aea84334c2ffee1e24756bac3bd44010",
      matchingGeneratorPath: "lang/semgrep-grammars/src/semgrep-typescript/typescript/grammar.js",
      upstreamGrammarLicenses: ["MIT", "MIT"],
      upstreamGrammarLicenseGitBlobShas: ["4b52d191cead337b11e274b79459a86f1b5a7779", "aa9f858db5722d9576104726471b11cc0e31f131"],
      runtimeOutputPaths: ["runtime/typescript/index.cjs", "runtime/typescript/semgrep-parser.wasm"],
    }],
    ["semgrep-tsx", {
      repository: "https://github.com/semgrep/semgrep-tsx",
      commit: "6005de74ed9e2fb891785a3df8582dbb91e272bc",
      sourceSubmodulePath: "languages/typescript/tree-sitter/semgrep-tsx",
      generationCommit: expectedGenerator.commit,
      generationCommitRecordedByUpstream: true,
      grammarExtensionPath: "fyi/semgrep-grammars/src/semgrep-typescript/typescript/grammar.js",
      grammarExtensionGitBlobSha: "aabad764aea84334c2ffee1e24756bac3bd44010",
      matchingGeneratorPath: "lang/semgrep-grammars/src/semgrep-typescript/typescript/grammar.js",
      upstreamGrammarLicenses: ["MIT", "MIT"],
      upstreamGrammarLicenseGitBlobShas: ["4b52d191cead337b11e274b79459a86f1b5a7779", "aa9f858db5722d9576104726471b11cc0e31f131"],
      runtimeOutputPaths: ["runtime/typescript/index.cjs", "runtime/typescript/semgrep-parser.wasm"],
    }],
  ]);
  if (!Array.isArray(evidence.generatedParsers) || evidence.generatedParsers.length !== 3) {
    errors.push("Generated-parser evidence must cover exactly three parsers");
  } else {
    const seenParsers = new Set();
    for (const parser of evidence.generatedParsers) {
      const expected = expectedParsers.get(parser.name);
      if (!expected || seenParsers.has(parser.name)) errors.push(`${parser.name}: unexpected or duplicate generated-parser identity`);
      else {
        const { runtimeOutputPaths, ...expectedFields } = expected;
        for (const [field, expectedValue] of Object.entries(expectedFields)) {
          if (JSON.stringify(parser[field]) !== JSON.stringify(expectedValue)) {
            errors.push(`${parser.name}: ${field} differs from the pinned provenance`);
          }
        }
        const actualOutputPaths = (parser.runtimeOutputs ?? []).map((output) => output.path).sort();
        if (JSON.stringify(actualOutputPaths) !== JSON.stringify([...runtimeOutputPaths].sort())) {
          errors.push(`${parser.name}: runtime output paths differ from the pinned provenance`);
        }
      }
      seenParsers.add(parser.name);
      if (parser.repositoryLicense !== "NOASSERTION") errors.push(`${parser.name}: upstream root-license absence must remain explicit`);
      if (parser.distributionLicense !== "GPL-3.0-only") errors.push(`${parser.name}: conservative distribution license changed`);
      if (!/^[a-f0-9]{40}$/u.test(parser.commit ?? "")) errors.push(`${parser.name}: invalid source commit`);
      if (!/^[a-f0-9]{40}$/u.test(parser.grammarExtensionGitBlobSha ?? "")) errors.push(`${parser.name}: invalid grammar-extension blob`);
      if (parser.buildCommand !== "bash scripts/build-semgrep-wasm.sh /absolute/pristine/semgrep /absolute/new-output") {
        errors.push(`${parser.name}: rebuild command changed`);
      }
      if (!Array.isArray(parser.runtimeOutputs) || parser.runtimeOutputs.length !== 2) {
        errors.push(`${parser.name}: runtime output evidence must contain JavaScript and WebAssembly`);
      } else {
        for (const output of parser.runtimeOutputs) {
          const manifestOutput = runtimeManifest.files?.find((entry) => entry.path === output.path);
          if (manifestOutput?.sha256 !== output.sha256) errors.push(`${parser.name}: runtime output hash differs for ${output.path}`);
        }
      }
    }
    for (const name of expectedParsers.keys()) if (!seenParsers.has(name)) errors.push(`${name}: generated-parser evidence is missing`);
  }

  const inventory = await readJson("engines/semgrep-wasm/source/linked-components.json");
  if (inventory.distributionLicense !== "GPL-3.0-only" || inventory.releaseScope !== "public") {
    errors.push("Linked inventory must retain the public GPL-3.0-only distribution boundary");
  }
  const actualLinkedSelections = inventory.linkedLicenseSelections ?? {};
  for (const [expression, selected] of expectedLinkedLicenseSelections) {
    if (actualLinkedSelections[expression] !== selected) {
      errors.push(`Linked inventory must select ${selected} for ${expression}`);
    }
  }
  for (const expression of Object.keys(actualLinkedSelections)) {
    if (!expectedLinkedLicenseSelections.has(expression)) errors.push(`Linked inventory contains unexpected license expression ${expression}`);
  }
  const linkedPackages = inventory.linkedOcamlPackages ?? [];
  const linkedPackagesWithLicenses = linkedPackages.filter((component) => Array.isArray(component.licenseFiles) && component.licenseFiles.length > 0);
  if (inventory.linkedLibraryCount !== 104
    || inventory.linkedOcamlPackageCount !== 104
    || inventory.linkedOcamlPackagesWithLicenseFiles !== 104
    || linkedPackages.length !== 104
    || linkedPackagesWithLicenses.length !== 104) {
    errors.push("Linked OPAM counters must match the complete 104-package source and license inventory");
  }
  const packageNames = linkedPackages.map((component) => component.name);
  const packageIdentities = linkedPackages.map((component) => `${component.name}@${component.version}`);
  const linkedLibraries = linkedPackages.flatMap((component) => component.libraries ?? []);
  const linkedLicensePaths = linkedPackages.flatMap((component) => (component.licenseFiles ?? []).map((license) => license.path));
  if (packageNames.some((name) => typeof name !== "string" || name.length === 0) || new Set(packageNames).size !== 104) {
    errors.push("Linked OPAM inventory must contain 104 unique non-empty package names");
  }
  if (linkedPackages.some((component) => typeof component.version !== "string" || component.version.length === 0)
    || new Set(packageIdentities).size !== 104) {
    errors.push("Linked OPAM inventory must contain 104 unique name@version identities");
  }
  if (linkedLibraries.length !== 104
    || new Set(linkedLibraries).size !== 104
    || linkedLibraries.some((library) => typeof library !== "string" || library.length === 0)) {
    errors.push("Linked OPAM inventory must contain exactly 104 unique non-empty library names");
  }
  if (linkedLicensePaths.length !== 104
    || new Set(linkedLicensePaths).size !== 104
    || linkedLicensePaths.some((licensePath) => typeof licensePath !== "string" || licensePath.length === 0)) {
    errors.push("Linked OPAM inventory must contain exactly 104 unique component-bound license paths");
  }
  for (const component of linkedPackages) {
    if (!Array.isArray(component.libraries) || component.libraries.length !== 1) {
      errors.push(`${component.name}: linked OPAM package must own exactly one linked library`);
    }
    if (!Array.isArray(component.licenseFiles) || component.licenseFiles.length !== 1) {
      errors.push(`${component.name}: linked OPAM package must own exactly one packaged license file`);
    }
    if (component.licenseFiles?.[0]?.path
      && path.posix.basename(component.licenseFiles[0].path).startsWith(`${component.name}--`) === false) {
      errors.push(`${component.name}: packaged license path is not bound to the component name`);
    }
    for (const license of component.licenses ?? []) {
      const selected = inventory.linkedLicenseSelections?.[license];
      const expected = expectedLinkedLicenseSelections.get(license);
      if (!expected || selected !== expected) errors.push(`${component.name}: license expression does not match the pinned selection contract for ${license}`);
    }
  }
  const directComponents = inventory.additionalRuntimeComponents ?? [];
  const seenDirectComponents = new Set();
  for (const component of directComponents) {
    const expected = expectedDirectComponentSelections.get(component.name);
    if (!expected || seenDirectComponents.has(component.name)) {
      errors.push(`${component.name}: unexpected or duplicate direct runtime component`);
    } else if (component.license !== expected[0] || component.selectedLicense !== expected[1]) {
      errors.push(`${component.name}: direct license selection differs from the pinned contract`);
    }
    seenDirectComponents.add(component.name);
  }
  for (const name of expectedDirectComponentSelections.keys()) {
    if (!seenDirectComponents.has(name)) errors.push(`${name}: direct runtime component is missing`);
  }
  const parserInventory = (inventory.additionalRuntimeComponents ?? []).filter((entry) => entry.name?.includes("generated parser"));
  if (parserInventory.length !== 3) errors.push("Linked inventory must contain exactly three generated parsers");
  const expectedInventoryParsers = new Map([...expectedParsers].map(([name, expected]) => [`${name} generated parser`, expected.commit]));
  const seenInventoryParsers = new Set();
  for (const parser of parserInventory) {
    if (!expectedInventoryParsers.has(parser.name) || seenInventoryParsers.has(parser.name) || parser.version !== expectedInventoryParsers.get(parser.name)) {
      errors.push(`${parser.name}: unexpected, duplicate, or mismatched linked parser inventory record`);
    }
    seenInventoryParsers.add(parser.name);
    if (parser.license !== "GPL-3.0-only") errors.push(`${parser.name}: linked inventory must use GPL-3.0-only`);
    if (parser.provenance !== "engines/semgrep-wasm/source/generated-parser-license-evidence.json") {
      errors.push(`${parser.name}: linked inventory must point to the pinned provenance evidence`);
    }
  }
  for (const name of expectedInventoryParsers.keys()) if (!seenInventoryParsers.has(name)) errors.push(`${name}: linked parser inventory record is missing`);

  const sourceManifest = await readJson("engines/semgrep-wasm/source/corresponding-source-manifest.json");
  const expectedSourceManifest = {
    schemaVersion: 1,
    archiveRoot: "semgrep-1.172.0-friendly-adversary-source",
    sourceDateEpoch: 1786147200,
    opamPackageCount: 104,
    contentTrees: [
      {
        archivePath: "semgrep",
        algorithm: "sha256",
        definitionVersion: 1,
        entryCount: 10429,
        sha256: "068aca988e5247e76a31964c90ea5d70afa8db6cf87815ee2948525cac75097b",
      },
      {
        archivePath: "opam-sources",
        algorithm: "sha256",
        definitionVersion: 1,
        entryCount: 55617,
        sha256: "1d78c5f486f77298cbd6b002eb3d6ea8620e563efecef6c251edb200a0208a87",
      },
    ],
    semgrepFiles: [
      { archivePath: "semgrep/LICENSE", sha256: "20c17d8b8c48a600800dfd14f95d5cb9ff47066a9641ddeab48dc54aec96e331" },
      { archivePath: "semgrep/semgrep.opam", sha256: "46865df6f9d083d1a3d9cd62516823d944f68dd3c556431e2800e5664a70a3a3" },
    ],
    externalSources: [
      { archivePath: "external-sources/pcre2-10.43.tar.gz", sha256: "889d16be5abb8d05400b33c25e151638b8d4bac0e2d9c76e9d6923118ae8a34e" },
      { archivePath: "external-sources/tree-sitter-0.22.6.tar.gz", sha256: "e2b687f74358ab6404730b7fb1a1ced7ddb3780202d37595ecd7b20a8f41861f" },
      { archivePath: "external-sources/ocaml-tree-sitter-semgrep-d68c1d87318808ec1b36ce89570ef6c0bc763f77.tar.gz", sha256: "85d1cede25cdf613f200e1df10d17e25cd83d42b4d08b079b7af15b965b21924" },
    ],
    repositoryFiles: [
      { sourcePath: "LICENSE", archivePath: "friendly-adversary/GPL-3.0-only.txt" },
      { sourcePath: "LICENSING.md", archivePath: "friendly-adversary/LICENSING.md" },
      { sourcePath: "scripts/build-semgrep-wasm.sh", archivePath: "friendly-adversary/build-semgrep-wasm.sh" },
      { sourcePath: "scripts/generate-semgrep-linked-inventory.mjs", archivePath: "friendly-adversary/generate-semgrep-linked-inventory.mjs" },
      { sourcePath: "engines/semgrep-wasm/upstream-lock.json", archivePath: "friendly-adversary/upstream-lock.json" },
      { sourcePath: "engines/semgrep-wasm/runtime-manifest.json", archivePath: "friendly-adversary/runtime-manifest.json" },
      { sourcePath: "engines/semgrep-wasm/source/linked-components.json", archivePath: "friendly-adversary/linked-components.json" },
      { sourcePath: "engines/semgrep-wasm/source/generated-parser-license-evidence.json", archivePath: "friendly-adversary/generated-parser-license-evidence.json" },
      { sourcePath: "engines/semgrep-wasm/source/corresponding-source-manifest.json", archivePath: "friendly-adversary/corresponding-source-manifest.json" },
    ],
    repositoryDirectories: [
      { sourcePath: "engines/semgrep-wasm/source/licenses", archivePath: "friendly-adversary/licenses" },
      { sourcePath: "engines/semgrep-wasm/source/patches", archivePath: "friendly-adversary/patches" },
    ],
    fingerprintFiles: [
      "scripts/package-semgrep-corresponding-source.sh",
      "scripts/corresponding-source-publication.mjs",
      "scripts/verify-semgrep-corresponding-source-evidence.mjs",
      "scripts/verify-semgrep-source.mjs",
    ],
    sourceBundlePatchFiles: [
      "engines/semgrep-wasm/source/patches/semgrep-1.172.0-wasm-port.patch",
      "engines/semgrep-wasm/source/patches/ocaml-tree-sitter-core-wasm-port.patch",
    ],
  };
  if (JSON.stringify(sourceManifest) !== JSON.stringify(expectedSourceManifest)) {
    errors.push("Corresponding-source manifest differs from the exact public release contract");
  }

  if (errors.length) {
    process.stderr.write(`Public release verification failed:\n${errors.map((error) => `- ${error}`).join("\n")}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`${JSON.stringify({
      schemaVersion: 1,
      packageLicense: packageJson.license,
      privateNpmPackage: packageJson.private,
      publicGitHubReleaseReady: true,
      generatedParserDistributionLicense: evidence.distributionLicense,
      generatedParserCount: evidence.generatedParsers.length,
      status: "verified",
    }, null, 2)}\n`);
  }
}
