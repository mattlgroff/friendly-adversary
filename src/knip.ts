import { execFileSync } from 'node:child_process';
import { lstat, readFile } from 'node:fs/promises';
import path from 'node:path';

export function knipPrRelevant(files: string[], diff: string): boolean {
  if (files.some(file => /(?:^|\/)(?:package\.json|(?:pnpm-workspace|pnpm-lock)\.yaml|(?:package-lock|npm-shrinkwrap)\.json|yarn\.lock|bun\.lockb?|(?:tsconfig|jsconfig)[^/]*\.json|(?:knip|vite|next|webpack|rollup|astro|nuxt|svelte|vitest|jest|nx)[^/]*\.(?:jsonc?|[cm]?[jt]s))$/i.test(file))) return true;
  if (!files.some(file => /\.[cm]?[jt]sx?$/i.test(file))) return false;
  // Import/export lists often change on lines that do not repeat the keyword.
  // Context from the complete file keeps those edits visible without treating
  // a function-body edit in a module containing imports as a graph change.
  let moduleList = false;
  for (const line of diff.split('\n')) {
    if (line.startsWith('diff --git') || line.startsWith('@@')) moduleList = false;
    if (!/^[ +\-]/.test(line) || /^(---|\+\+\+)/.test(line)) continue;
    const text = line.slice(1);
    if (/^\s*(?:import|export)\s+(?:type\s+)?\{/.test(text)) moduleList = true;
    if (moduleList && /^[+-]/.test(line)) return true;
    if (moduleList && /\}/.test(text)) moduleList = false;
  }
  // Include additions/deletions and module-edge edits. A last-consumer removal
  // can orphan a file outside the diff, so Knip itself must scan the full graph.
  return /^(?:---|\+\+\+) \/dev\/null$/m.test(diff)
    || /^[+-](?![+-]).*\b(?:import|export|require|module\.exports)\b/m.test(diff);
}

export async function knipApplicable(repo: string, files: string[], base: string, audit: boolean): Promise<boolean> {
  // A package manifest is Knip's project boundary. Python-only repositories
  // without one are not JavaScript projects and do not get a skipped tool.
  try { if (!(await lstat(path.join(repo, 'package.json'))).isFile()) return false; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false; throw error; }
  if (audit || knipPrRelevant(files, '')) return true;
  const sourceFiles = files.filter(file => /\.[cm]?[jt]sx?$/i.test(file));
  if (!sourceFiles.length) return false;
  // Invalid/unavailable diff means we cannot safely conclude inapplicability.
  try {
    const untracked = execFileSync('git', ['ls-files', '--others', '--exclude-standard', '-z', '--', ...sourceFiles], { cwd: repo, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
    if (untracked.length) return true;
    const diff = execFileSync('git', ['diff', '--no-ext-diff', '--no-textconv', '--unified=1000000', base, '--', ...sourceFiles], { cwd: repo, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
    return knipPrRelevant(files, diff);
  } catch { return true; }
}

export async function knipProjectRoots(repo: string, files: string[], base: string, audit: boolean): Promise<string[]> {
  if (await knipApplicable(repo, files, base, audit)) return [repo];
  // A mixed Python/JS repository can have only frontend/package.json. Select
  // the highest package boundary, preserving workspace consumers below it.
  const candidates = new Set<string>();
  for (const file of files) {
    if (!/\.[cm]?[jt]sx?$|(?:^|\/)package\.json$/i.test(file)) continue;
    let directory = path.dirname(path.join(repo, file));
    let boundary: string | undefined;
    while (directory !== repo && directory.startsWith(repo + path.sep)) {
      try { if ((await lstat(path.join(directory, 'package.json'))).isFile()) boundary = directory; } catch (error) { if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error; }
      directory = path.dirname(directory);
    }
    if (boundary) candidates.add(boundary);
  }
  const roots = [];
  for (const candidate of [...candidates].sort()) {
    const prefix = path.relative(repo, candidate).split(path.sep).join('/') + '/';
    const scoped = files.filter(file => file.startsWith(prefix)).map(file => file.slice(prefix.length));
    if (await knipApplicable(candidate, scoped, base, audit)) roots.push(candidate);
  }
  return roots;
}

export async function validateKnipOutput(directory: string): Promise<string | undefined> {
  try {
    const report = JSON.parse(await readFile(path.join(directory, 'stdout.json'), 'utf8'));
    if (!Array.isArray(report.issues)) return 'Knip did not produce its expected JSON issue report';
    const coverage = JSON.parse(await readFile(path.join(directory, 'coverage.json'), 'utf8'));
    if (!Array.isArray(coverage.configurationHints)) return 'Knip coverage metadata is missing configuration hints';
    if (coverage.configurationHints.length) return 'Knip reported configuration hints; inspect coverage.json before trusting unused-code findings';
  } catch { return 'Knip report or coverage metadata is missing or invalid'; }
  return undefined;
}
