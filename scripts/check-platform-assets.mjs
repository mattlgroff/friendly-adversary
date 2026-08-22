#!/usr/bin/env node

import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import {
  claudeAgentsRoot,
  allSkillRoots,
  auditReferenceFiles,
  auditSkillRoots,
  copiedTrees,
  designReferenceFiles,
  designSkillRoots,
  lensesSource,
  mcpBundleSource,
  retiredSkillRoots,
  root,
  sharedSkillFiles,
  runtimeSource,
  skillRoots,
  skillRuntimePackage,
  workflowAgentsSource,
} from "./platform-asset-plan.mjs";

const runtimeFiles = (await readdir(runtimeSource))
  .filter((file) => file.endsWith(".js") && !file.startsWith("lens-report-mcp"))
  .map((file) => ({ source: path.join(runtimeSource, file), target: file }));
runtimeFiles.push(
  { source: path.join(mcpBundleSource, "friendly-adversary-mcp.cjs"), target: "friendly-adversary-mcp.cjs" },
  { source: path.join(mcpBundleSource, "bundle-manifest.json"), target: "bundle-manifest.json" },
);

async function filesBelow(directory, relativeDirectory = "") {
  const entries = await readdir(path.join(directory, relativeDirectory), { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const relative = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) files.push(...await filesBelow(directory, relative));
    else if (entry.isFile()) files.push(relative);
    else throw new Error(`unsupported synchronized asset type: ${path.join(directory, relative)}`);
  }
  return files;
}

export async function assertFileEqual(source, target, label) {
  const [expected, actual] = await Promise.all([readFile(source), readFile(target)]);
  if (!expected.equals(actual)) throw new Error(`${label} is stale`);
}

export async function assertTreeEqual(source, target, label) {
  const [expectedFiles, actualFiles] = await Promise.all([filesBelow(source), filesBelow(target)]);
  if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) {
    throw new Error(`${label} has a stale file inventory`);
  }
  for (const relative of expectedFiles) {
    await assertFileEqual(path.join(source, relative), path.join(target, relative), `${label}/${relative}`);
  }
  return expectedFiles.length;
}

export function assertExactInventory(actual, expected, label) {
  const actualNames = [...actual].sort();
  const expectedNames = [...expected].sort();
  if (JSON.stringify(actualNames) !== JSON.stringify(expectedNames)) {
    throw new Error(`${label} has a stale file inventory`);
  }
}

const canonicalRuntimeFiles = (await readdir(path.join(root, "src"), { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
  .map((entry) => `${entry.name.slice(0, -3)}.js`);
const builtRuntimeFiles = (await readdir(runtimeSource, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".js"))
  .map((entry) => entry.name);
assertExactInventory(builtRuntimeFiles, canonicalRuntimeFiles, "canonical compiled runtime");

const expectedPackage = JSON.parse(skillRuntimePackage);
const lensIds = (await readdir(lensesSource, { withFileTypes: true }))
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();
let verifiedFiles = 0;

for (const retired of retiredSkillRoots) {
  try {
    await access(retired);
    throw new Error(`retired skill still exists: ${retired}`);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("retired skill still exists:")) throw error;
  }
}

for (const skillRoot of skillRoots) {
  const platform = skillRoot.includes(`${path.sep}codex${path.sep}`) ? "codex" : "claude-code";
  const pluginRoot = path.resolve(skillRoot, "..", "..");
  const runtimeRoot = path.join(skillRoot, "scripts", "runtime");
  const actualPackage = JSON.parse(await readFile(path.join(skillRoot, "package.json"), "utf8"));
  if (JSON.stringify(actualPackage) !== JSON.stringify(expectedPackage)) {
    throw new Error(`${platform} skill runtime package metadata is stale`);
  }
  verifiedFiles += 1;
  const actualRuntimeRootEntries = (await readdir(runtimeRoot, { withFileTypes: true }))
    .map((entry) => entry.name);
  const expectedRuntimeRootEntries = [
    ...runtimeFiles.map(({ target }) => target),
    ...new Set(copiedTrees.flatMap(({ target }) => {
      const relative = path.relative(path.join("scripts", "runtime"), target);
      return relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative) ? [] : [relative.split(path.sep)[0]];
    })),
  ];
  assertExactInventory(actualRuntimeRootEntries, expectedRuntimeRootEntries, `${platform} runtime root`);
  for (const entry of runtimeFiles) {
    await assertFileEqual(entry.source, path.join(runtimeRoot, entry.target), `${platform} runtime/${entry.target}`);
    verifiedFiles += 1;
  }
  for (const tree of copiedTrees) {
    verifiedFiles += await assertTreeEqual(tree.source, path.join(skillRoot, tree.target), `${platform} ${tree.target}`);
  }
  for (const file of sharedSkillFiles) {
    await assertFileEqual(file.source, path.join(skillRoot, file.target), `${platform} ${file.target}`);
    verifiedFiles += 1;
  }
  for (const licenseFile of ["LICENSE", "LICENSING.md"]) {
    await assertFileEqual(path.join(root, licenseFile), path.join(pluginRoot, licenseFile), `${platform} plugin ${licenseFile}`);
    await assertFileEqual(path.join(root, licenseFile), path.join(skillRoot, licenseFile), `${platform} skill ${licenseFile}`);
    verifiedFiles += 2;
  }
  const actualLensFiles = (await readdir(path.join(skillRoot, "references", "lenses"))).sort();
  const expectedLensFiles = lensIds.map((lensId) => `${lensId}.md`);
  if (JSON.stringify(actualLensFiles) !== JSON.stringify(expectedLensFiles)) {
    throw new Error(`${platform} lenses have a stale file inventory`);
  }
  for (const lensId of lensIds) {
    await assertFileEqual(
      path.join(lensesSource, lensId, "LENS.md"),
      path.join(skillRoot, "references", "lenses", `${lensId}.md`),
      `${platform} lens ${lensId}`,
    );
    verifiedFiles += 1;
  }
}

for (const [roots, references, label] of [
  [auditSkillRoots, auditReferenceFiles, "audit-codebase"],
  [designSkillRoots, designReferenceFiles, "design-new-codebase"],
]) {
  for (const skillRoot of roots) {
    const platform = skillRoot.includes(`${path.sep}codex${path.sep}`) ? "codex" : "claude-code";
    const expectedReferences = references.map((file) => path.relative("references", file.target));
    if (label === "audit-codebase") expectedReferences.push(...lensIds.map((lensId) => path.join("lenses", `${lensId}.md`)));
    assertExactInventory(await filesBelow(path.join(skillRoot, "references")), expectedReferences, `${platform} ${label} references`);
    for (const file of references) {
      await assertFileEqual(file.source, path.join(skillRoot, file.target), `${platform} ${label} ${file.target}`);
      verifiedFiles += 1;
    }
  }
}

for (const skillRoot of allSkillRoots) {
  const platform = skillRoot.includes(`${path.sep}codex${path.sep}`) ? "codex" : "claude-code";
  for (const licenseFile of ["LICENSE", "LICENSING.md"]) {
    await assertFileEqual(path.join(root, licenseFile), path.join(skillRoot, licenseFile), `${platform} ${path.basename(skillRoot)} ${licenseFile}`);
    verifiedFiles += 1;
  }
}

const actualAgentFiles = (await readdir(claudeAgentsRoot)).sort();
const workflowAgentFiles = (await readdir(workflowAgentsSource)).filter((file) => file.endsWith(".md")).sort();
const expectedAgentFiles = workflowAgentFiles;
if (JSON.stringify(actualAgentFiles) !== JSON.stringify(expectedAgentFiles)) {
  throw new Error("Claude Code agents have a stale file inventory");
}
for (const file of workflowAgentFiles) {
  await assertFileEqual(path.join(workflowAgentsSource, file), path.join(claudeAgentsRoot, file), `Claude Code workflow agent ${file}`);
  verifiedFiles += 1;
}

process.stdout.write(`Verified ${verifiedFiles} synchronized files across Codex and Claude Code.\n`);
