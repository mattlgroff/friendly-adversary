import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const runtimeSource = path.join(root, "dist", "src");
export const mcpBundleSource = path.join(root, "dist", "mcp");
export const lensesSource = path.join(root, "lenses");
export const skillNames = ["pr-review", "audit-codebase", "design-new-codebase"];
export const skillRoots = [
  path.join(root, "platforms", "codex", "plugins", "friendly-adversary", "skills", "pr-review"),
  path.join(root, "platforms", "claude-code", "plugins", "friendly-adversary", "skills", "pr-review"),
];
export const allSkillRoots = ["codex", "claude-code"].flatMap((platform) => skillNames.map((skill) => (
  path.join(root, "platforms", platform, "plugins", "friendly-adversary", "skills", skill)
)));
export const retiredSkillRoots = ["codex", "claude-code"].map((platform) => (
  path.join(root, "platforms", platform, "plugins", "friendly-adversary", "skills", "friendly-adversary")
));
export const auditSkillRoots = ["codex", "claude-code"].map((platform) => (
  path.join(root, "platforms", platform, "plugins", "friendly-adversary", "skills", "audit-codebase")
));
export const designSkillRoots = ["codex", "claude-code"].map((platform) => (
  path.join(root, "platforms", platform, "plugins", "friendly-adversary", "skills", "design-new-codebase")
));
export const claudeAgentsRoot = path.join(root, "platforms", "claude-code", "plugins", "friendly-adversary", "agents");
export const workflowAgentsSource = path.join(root, "agents", "claude-code");
export const skillRuntimePackage = `${JSON.stringify({
  name: "friendly-adversary-skill-runtime",
  private: true,
  type: "module",
}, null, 2)}\n`;

export const copiedTrees = [
  { source: path.join(root, "wasm", "oxlint"), target: path.join("scripts", "runtime", "wasm", "oxlint") },
  { source: path.join(root, "third-party"), target: "third-party" },
  { source: path.join(root, "rules"), target: "rules" },
  { source: path.join(root, "engines", "semgrep-wasm"), target: path.join("engines", "semgrep-wasm") },
  { source: path.join(root, "engines", "ruff-wasm"), target: path.join("engines", "ruff-wasm") },
  { source: path.join(root, "engines", "ripgrep-wasm"), target: path.join("engines", "ripgrep-wasm") },
];

export const sharedSkillFiles = [
  { source: path.join(root, "references", "finding-contract.md"), target: path.join("references", "finding-contract.md") },
  { source: path.join(root, "references", "tooling.md"), target: path.join("references", "tooling.md") },
  { source: path.join(root, "references", "adjudication.md"), target: path.join("references", "adjudication.md") },
];
export const auditReferenceFiles = [
  { source: path.join(root, "references", "finding-contract.md"), target: path.join("references", "finding-contract.md") },
  { source: path.join(root, "references", "audit-inventory.md"), target: path.join("references", "audit-inventory.md") },
  { source: path.join(root, "references", "audit-adjudication.md"), target: path.join("references", "audit-adjudication.md") },
];
export const designReferenceFiles = [
  { source: path.join(root, "references", "design-interview.md"), target: path.join("references", "design-interview.md") },
  { source: path.join(root, "references", "design-challenges.md"), target: path.join("references", "design-challenges.md") },
];
