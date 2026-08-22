import { execFileSync } from "node:child_process";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const lock = JSON.parse(await readFile(path.join(root, "engines", "semgrep-wasm", "upstream-lock.json"), "utf8"));
const parserEvidence = JSON.parse(await readFile(path.join(root, "engines", "semgrep-wasm", "source", "generated-parser-license-evidence.json"), "utf8"));
const expectedParsers = new Map([
  ["semgrep-python", {
    sourceSubmodulePath: "languages/python/tree-sitter/semgrep-python",
    commit: "647a20f8207740b0a76541bb27e1eaaf111dca7e",
    grammarExtensionPath: "fyi/semgrep-grammars/src/semgrep-python/grammar.js",
    grammarExtensionGitBlobSha: "a4bf791e6eb22a36d2b2d4625d0e2e0fa41a38d8",
  }],
  ["semgrep-typescript", {
    sourceSubmodulePath: "languages/typescript/tree-sitter/semgrep-typescript",
    commit: "50fe6a5c46d3dee74d1d176b9767ffc520a1003e",
    grammarExtensionPath: "fyi/semgrep-grammars/src/semgrep-typescript/typescript/grammar.js",
    grammarExtensionGitBlobSha: "aabad764aea84334c2ffee1e24756bac3bd44010",
  }],
  ["semgrep-tsx", {
    sourceSubmodulePath: "languages/typescript/tree-sitter/semgrep-tsx",
    commit: "6005de74ed9e2fb891785a3df8582dbb91e272bc",
    grammarExtensionPath: "fyi/semgrep-grammars/src/semgrep-typescript/typescript/grammar.js",
    grammarExtensionGitBlobSha: "aabad764aea84334c2ffee1e24756bac3bd44010",
  }],
]);

function argument(name) {
  const at = process.argv.indexOf(name);
  return at >= 0 ? process.argv[at + 1] : undefined;
}

function git(source, args) {
  return execFileSync("git", ["-C", source, ...args], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

function fail(errors) {
  process.stderr.write(`Semgrep source verification failed:\n${errors.map((error) => `- ${error}`).join("\n")}\n`);
  process.exitCode = 1;
}

const sourceArg = argument("--source") ?? process.env.SEMGREP_SOURCE_DIR;
if (!sourceArg) {
  fail(["Pass --source /absolute/path or set SEMGREP_SOURCE_DIR"]);
} else {
  const source = path.resolve(sourceArg);
  const errors = [];
  let head;

  try {
    head = git(source, ["rev-parse", "HEAD"]);
    if (head !== lock.commit) errors.push(`HEAD is ${head}, expected ${lock.commit}`);
  } catch (error) {
    errors.push(`Cannot inspect Git HEAD: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const tagCommit = git(source, ["rev-list", "-n", "1", lock.tag]);
    if (tagCommit !== lock.commit) errors.push(`${lock.tag} resolves to ${tagCommit}, expected ${lock.commit}`);
  } catch (error) {
    errors.push(`Cannot resolve ${lock.tag}: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const status = git(source, ["status", "--short", "--untracked-files=all"]);
    if (status) errors.push("Source checkout is dirty; verify the pristine pin before applying portability patches");
  } catch (error) {
    errors.push(`Cannot inspect source status: ${error instanceof Error ? error.message : String(error)}`);
  }

  for (const submodule of lock.requiredSubmodules) {
    try {
      const treeEntry = git(source, ["ls-tree", "HEAD", "--", submodule.path]);
      const match = /^160000 commit ([0-9a-f]{40})\t/.exec(treeEntry);
      if (match?.[1] !== submodule.commit) {
        errors.push(`${submodule.path} gitlink is ${match?.[1] ?? "missing"}, expected ${submodule.commit}`);
        continue;
      }
      const actual = git(path.join(source, submodule.path), ["rev-parse", "HEAD"]);
      if (actual !== submodule.commit) errors.push(`${submodule.path} checkout is ${actual}, expected ${submodule.commit}`);
      const submoduleStatus = git(path.join(source, submodule.path), ["status", "--short", "--untracked-files=all"]);
      if (submoduleStatus) errors.push(`${submodule.path} checkout is dirty`);
    } catch (error) {
      errors.push(`${submodule.path} is missing or unreadable: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  const generatedParsers = parserEvidence.generatedParsers ?? [];
  if (!Array.isArray(generatedParsers) || generatedParsers.length !== expectedParsers.size) {
    errors.push("Generated-parser evidence must contain exactly the pinned Python, TypeScript, and TSX records");
  }
  const seenParsers = new Set();
  for (const parser of Array.isArray(generatedParsers) ? generatedParsers : []) {
    const expected = expectedParsers.get(parser.name);
    if (!expected || seenParsers.has(parser.name)) {
      errors.push(`${parser.name}: unexpected or duplicate generated-parser identity`);
      continue;
    }
    seenParsers.add(parser.name);
    for (const field of ["sourceSubmodulePath", "commit", "grammarExtensionPath", "grammarExtensionGitBlobSha"]) {
      if (parser[field] !== expected[field]) errors.push(`${parser.name}: ${field} differs from the pinned provenance`);
    }
    const locked = lock.requiredSubmodules.find((entry) => entry.path === expected.sourceSubmodulePath);
    if (locked?.commit !== expected.commit) {
      errors.push(`${parser.name}: pinned provenance does not match upstream-lock.json`);
      continue;
    }
    try {
      const parserRoot = path.join(source, expected.sourceSubmodulePath);
      const grammarBlob = git(parserRoot, ["hash-object", "--", expected.grammarExtensionPath]);
      if (grammarBlob !== expected.grammarExtensionGitBlobSha) {
        errors.push(`${parser.name}: grammar extension blob is ${grammarBlob}, expected ${expected.grammarExtensionGitBlobSha}`);
      }
    } catch (error) {
      errors.push(`${parser.name}: cannot verify grammar extension provenance (${error instanceof Error ? error.message : String(error)})`);
    }
  }
  for (const name of expectedParsers.keys()) if (!seenParsers.has(name)) errors.push(`${name}: generated-parser evidence is missing`);

  try {
    const license = await readFile(path.join(source, "LICENSE"), "utf8");
    if (!license.includes("GNU LESSER GENERAL PUBLIC LICENSE") || !license.includes("Version 2.1")) {
      errors.push("Upstream LICENSE is not the expected LGPL 2.1 text");
    }
    const opam = await readFile(path.join(source, "semgrep.opam"), "utf8");
    if (!opam.includes('license: "LGPL-2.1-only"')) errors.push("semgrep.opam does not declare LGPL-2.1-only");
  } catch (error) {
    errors.push(`Cannot verify upstream license files: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const rulePackPath = path.join(source, lock.prohibitedRulePackSubmodule);
    const entries = await readdir(rulePackPath);
    if (entries.length > 0) errors.push(`${lock.prohibitedRulePackSubmodule} is populated and must not be bundled`);
  } catch (error) {
    if (!(error && typeof error === "object" && "code" in error && error.code === "ENOENT")) {
      errors.push(`Cannot inspect prohibited rule-pack path: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (errors.length) {
    fail(errors);
  } else {
    process.stdout.write(`${JSON.stringify({
      schemaVersion: 1,
      component: lock.component,
      tag: lock.tag,
      commit: head,
      license: lock.license,
      requiredSubmodules: lock.requiredSubmodules.map(({ path: submodulePath, commit }) => ({ path: submodulePath, commit })),
      communityRulesBundled: false,
      generatedParserProvenance: parserEvidence.generatedParsers.length,
      distributionLicense: parserEvidence.distributionLicense,
      releaseScope: parserEvidence.releaseScope,
      publicPublicationBlocked: false,
      status: "verified",
    }, null, 2)}\n`);
  }
}
