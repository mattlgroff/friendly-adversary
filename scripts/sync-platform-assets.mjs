import { chmod, copyFile, cp, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  allSkillRoots,
  auditReferenceFiles,
  auditSkillRoots,
  claudeAgentsRoot,
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

for (const retired of retiredSkillRoots) await rm(retired, { recursive: true, force: true });
for (const skillRoot of allSkillRoots) await mkdir(skillRoot, { recursive: true });

for (const skillRoot of skillRoots) {
  const pluginRoot = path.resolve(skillRoot, "..", "..");
  const runtimeTarget = path.join(skillRoot, "scripts", "runtime");
  const lensesTarget = path.join(skillRoot, "references", "lenses");
  await rm(runtimeTarget, { recursive: true, force: true });
  await rm(lensesTarget, { recursive: true, force: true });
  for (const tree of copiedTrees) await rm(path.join(skillRoot, tree.target), { recursive: true, force: true });
  await mkdir(runtimeTarget, { recursive: true });
  for (const file of await readdir(runtimeSource)) {
    if (!file.endsWith(".js")) continue;
    if (file.startsWith("lens-report-mcp")) continue;
    await copyFile(path.join(runtimeSource, file), path.join(runtimeTarget, file));
  }
  for (const file of ["friendly-adversary-mcp.cjs", "bundle-manifest.json"]) {
    await copyFile(path.join(mcpBundleSource, file), path.join(runtimeTarget, file));
  }
  for (const tree of copiedTrees) await cp(tree.source, path.join(skillRoot, tree.target), { recursive: true });
  for (const file of sharedSkillFiles) {
    await mkdir(path.dirname(path.join(skillRoot, file.target)), { recursive: true });
    await copyFile(file.source, path.join(skillRoot, file.target));
  }
  for (const licenseFile of ["LICENSE", "LICENSING.md"]) {
    await copyFile(path.join(root, licenseFile), path.join(pluginRoot, licenseFile));
    await copyFile(path.join(root, licenseFile), path.join(skillRoot, licenseFile));
  }
  await writeFile(path.join(skillRoot, "package.json"), skillRuntimePackage);
  await mkdir(lensesTarget, { recursive: true });
  for (const lensId of await readdir(lensesSource)) {
    await copyFile(
      path.join(lensesSource, lensId, "LENS.md"),
      path.join(lensesTarget, `${lensId}.md`),
    );
  }
  await chmod(path.join(runtimeTarget, "cli.js"), 0o755);
  await chmod(path.join(runtimeTarget, "friendly-adversary-mcp.cjs"), 0o755);
}

for (const skillRoot of auditSkillRoots) {
  const referencesTarget = path.join(skillRoot, "references");
  const lensesTarget = path.join(skillRoot, "references", "lenses");
  await rm(referencesTarget, { recursive: true, force: true });
  await mkdir(lensesTarget, { recursive: true });
  for (const file of auditReferenceFiles) {
    await mkdir(path.dirname(path.join(skillRoot, file.target)), { recursive: true });
    await copyFile(file.source, path.join(skillRoot, file.target));
  }
  for (const lensId of await readdir(lensesSource)) await copyFile(path.join(lensesSource, lensId, "LENS.md"), path.join(lensesTarget, `${lensId}.md`));
}
for (const skillRoot of designSkillRoots) {
  const referencesTarget = path.join(skillRoot, "references");
  await rm(referencesTarget, { recursive: true, force: true });
  await mkdir(referencesTarget, { recursive: true });
  for (const file of designReferenceFiles) {
    await mkdir(path.dirname(path.join(skillRoot, file.target)), { recursive: true });
    await copyFile(file.source, path.join(skillRoot, file.target));
  }
}
for (const skillRoot of allSkillRoots) {
  const pluginRoot = path.resolve(skillRoot, "..", "..");
  for (const licenseFile of ["LICENSE", "LICENSING.md"]) {
    await copyFile(path.join(root, licenseFile), path.join(pluginRoot, licenseFile));
    await copyFile(path.join(root, licenseFile), path.join(skillRoot, licenseFile));
  }
}

await rm(claudeAgentsRoot, { recursive: true, force: true });
await mkdir(claudeAgentsRoot, { recursive: true });
for (const file of await readdir(workflowAgentsSource)) {
  if (file.endsWith(".md")) await copyFile(path.join(workflowAgentsSource, file), path.join(claudeAgentsRoot, file));
}
