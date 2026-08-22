import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rulesIndex = process.argv.indexOf("--rules");
const rulesRoot = path.resolve(rulesIndex >= 0 ? process.argv[rulesIndex + 1] ?? "" : path.join(root, "rules", "semgrep"));
const allowedKeys = new Set([
  "rules",
  "id",
  "message",
  "severity",
  "languages",
  "patterns",
  "pattern-either",
  "pattern",
  "pattern-inside",
  "metavariable-pattern",
  "metavariable",
  "pattern-not",
]);
const allowedLanguages = new Set(["javascript", "typescript", "python"]);
const containerKeys = new Set(["rules", "patterns", "pattern-either", "metavariable-pattern"]);
const errors = [];
const ids = new Set();
const entries = (await readdir(rulesRoot, { withFileTypes: true }).catch(() => []))
  .filter((entry) => entry.isFile() && entry.name.endsWith(".yml"))
  .map((entry) => entry.name)
  .sort();

if (entries.length === 0) errors.push("No Semgrep YAML rule files were found");
for (const name of entries) {
  const content = await readFile(path.join(rulesRoot, name), "utf8");
  if (/\t/u.test(content)) errors.push(`${name}: tabs are prohibited`);
  if (/^\s*(?:---|\.\.\.)\s*$/mu.test(content)) errors.push(`${name}: multiple YAML documents are prohibited`);
  if (/(?:^|\s)[&*!][A-Za-z_]/mu.test(content)) errors.push(`${name}: YAML anchors, aliases, and tags are prohibited`);
  for (const [index, line] of content.split("\n").entries()) {
    if (!line.trim() || /^\s*#/u.test(line)) continue;
    const mapping = /^\s*(?:-\s+)?([a-z][a-z0-9_-]*):(.*)$/u.exec(line);
    if (!mapping) {
      errors.push(`${name}:${index + 1}: unsupported YAML syntax; only unquoted block mapping keys are supported`);
      continue;
    }
    const key = mapping[1];
    const value = mapping[2]?.trim() ?? "";
    if (key && !allowedKeys.has(key)) errors.push(`${name}:${index + 1}: unsupported rule key ${key}`);
    if (key && containerKeys.has(key) && value) errors.push(`${name}:${index + 1}: ${key} must use block mapping syntax`);
    const id = /^\s*-\s+id:\s*(\S+)\s*$/u.exec(line)?.[1];
    if (id) {
      if (!/^friendly-adversary\.[a-z]+\.[a-z0-9-]+$/u.test(id)) errors.push(`${name}:${index + 1}: invalid rule id ${id}`);
      if (ids.has(id)) errors.push(`${name}:${index + 1}: duplicate rule id ${id}`);
      ids.add(id);
    }
    const languages = /^\s*languages:\s*\[([^\]]+)\]\s*$/u.exec(line)?.[1];
    if (languages) {
      for (const language of languages.split(",").map((value) => value.trim())) {
        if (!allowedLanguages.has(language)) errors.push(`${name}:${index + 1}: unsupported language ${language}`);
      }
    }
    const severity = /^\s*severity:\s*(\S+)\s*$/u.exec(line)?.[1];
    if (severity && severity !== "WARNING") errors.push(`${name}:${index + 1}: severity must be WARNING`);
  }
}

if (errors.length) {
  process.stderr.write(`Semgrep rule validation failed:\n${errors.map((error) => `- ${error}`).join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`${JSON.stringify({ schemaVersion: 1, files: entries.length, rules: ids.size, supportedKeys: [...allowedKeys].sort(), status: "verified" }, null, 2)}\n`);
}
