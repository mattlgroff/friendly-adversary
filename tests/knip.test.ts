import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { knipApplicable, knipPrRelevant, knipProjectRoots, validateKnipOutput } from '../src/knip.js';
import { collectTools } from '../src/tools.js';

const assets = path.resolve('.');
const launcher = path.join(assets, 'engines/knip/runtime/launch.mjs');
async function fixture(action: (repo: string, artifacts: string) => Promise<void>) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'friendly-knip-'));
  const repo = path.join(root, 'source');
  const artifacts = path.join(root, 'artifacts');
  await mkdir(repo); await mkdir(artifacts);
  await writeFile(path.join(repo, 'package.json'), JSON.stringify({ name: 'fixture', private: true }));
  try { await action(repo, artifacts); } finally { await rm(root, { recursive: true, force: true }); }
}
function run(repo: string, artifacts: string, mode = 'audit') {
  return spawnSync(process.execPath, [launcher, mode, path.join(artifacts, 'coverage.json')], {
    cwd: repo, encoding: 'utf8', timeout: 20_000,
    env: { ...process.env, PATH: '', NODE_OPTIONS: '', FA_KNIP_PROJECT_CODE: '0' },
  });
}

test('Knip PR scope includes graph changes, not ordinary implementation edits', () => {
  for (const file of ['package.json', 'apps/web/package.json', 'pnpm-lock.yaml', 'nx.json', 'tsconfig.base.json', 'vite.config.ts']) assert.equal(knipPrRelevant([file], ''), true, file);
  for (const diff of ['--- /dev/null', '+++ /dev/null', '-import { old } from "./old";', '+export { thing } from "./thing";', '-const helper = require("./helper");']) assert.equal(knipPrRelevant(['index.ts'], diff), true, diff);
  assert.equal(knipPrRelevant(['index.ts'], '-  return 1;\n+  return 2;'), false);
  assert.equal(knipPrRelevant(['README.md'], '+export all the things'), false);
  assert.equal(knipPrRelevant(['index.ts'], ' import {\n   kept,\n-  lastConsumer,\n } from "./helpers";'), true);
  assert.equal(knipPrRelevant(['index.ts'], ' import { kept } from "./helpers";\n function run() {\n-  return 1;\n+  return 2;\n }'), false);
});

test('Knip audit always applies to package roots and not Python-only roots', async () => fixture(async repo => {
  assert.equal(await knipApplicable(repo, [], '', true), true);
  await rm(path.join(repo, 'package.json'));
  assert.equal(await knipApplicable(repo, ['app.py'], '', true), false);
}));

test('mixed Python/JS audits discover frontend packages without a root manifest', async () => fixture(async repo => {
  await rm(path.join(repo, 'package.json'));
  await mkdir(path.join(repo, 'frontend'));
  await writeFile(path.join(repo, 'frontend/package.json'), '{"private":true}');
  assert.deepEqual(await knipProjectRoots(repo, ['backend/app.py', 'frontend/package.json', 'frontend/index.ts'], '', true), [path.join(repo, 'frontend')]);
}));

test('WASM-only Knip reports unused files and exports without a package manager or mutation', async () => fixture(async (repo, artifacts) => {
  const files = {
    'index.ts': 'import { used } from "./helper"; console.log(used);\n',
    'helper.ts': 'export const used = 1; export const unused = 2;\n',
    'orphan.ts': 'export const orphan = 3;\n',
  };
  for (const [file, text] of Object.entries(files)) await writeFile(path.join(repo, file), text);
  const result = run(repo, artifacts);
  assert.equal(result.status, 1, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.ok(report.issues.some((row: { file: string }) => row.file === 'orphan.ts'));
  assert.match(result.stdout, /"name":"unused"/);
  await writeFile(path.join(artifacts, 'stdout.json'), result.stdout);
  assert.equal(await validateKnipOutput(artifacts), undefined);
  for (const [file, text] of Object.entries(files)) assert.equal(await readFile(path.join(repo, file), 'utf8'), text);
  assert.deepEqual((await readdir(repo)).sort(), ['helper.ts', 'index.ts', 'orphan.ts', 'package.json']);
}));

test('Knip audit refuses executable snapshot configuration rather than executing it', async () => fixture(async (repo, artifacts) => {
  await writeFile(path.join(repo, 'knip.ts'), 'import {writeFileSync} from "node:fs"; writeFileSync("MUTATED", "bad"); export default {};');
  const result = run(repo, artifacts);
  assert.equal(result.status, 2, result.stderr);
  assert.match(result.stderr, /cannot execute project configuration/);
  assert.equal((await readdir(repo)).includes('MUTATED'), false);
}));

test('Knip malformed configuration is an error, not an empty successful report', async () => fixture(async (repo, artifacts) => {
  await writeFile(path.join(repo, 'knip.json'), '{ invalid');
  const result = run(repo, artifacts);
  assert.equal(result.status, 2);
  await writeFile(path.join(artifacts, 'stdout.json'), result.stdout);
  assert.notEqual(await validateKnipOutput(artifacts), undefined);
}));

test('Knip coverage hints make analysis incomplete while preserving the native report', async () => fixture(async (repo, artifacts) => {
  await writeFile(path.join(repo, 'index.js'), 'console.log(1);');
  await writeFile(path.join(repo, 'knip.json'), JSON.stringify({ ignoreDependencies: ['does-not-exist'] }));
  const result = run(repo, artifacts);
  await writeFile(path.join(artifacts, 'stdout.json'), result.stdout);
  assert.match((await validateKnipOutput(artifacts)) ?? '', /configuration hints/);
}));

test('audit collector persists Knip artifacts and required status', async () => fixture(async (repo, artifacts) => {
  await writeFile(path.join(repo, 'index.js'), 'console.log(1);');
  const records = await collectTools({ repo, runDirectory: artifacts, changedFiles: [], mergeBaseSha: '', assetsRoot: assets, options: { timeoutMs: 20_000 }, includeRepositoryTools: false, audit: true });
  const knip = records.find(record => record.name === 'knip');
  assert.equal(knip?.required, true);
  assert.equal(knip?.status, 'completed', knip?.reason);
  assert.equal(await validateKnipOutput(path.join(artifacts, 'deterministic/knip')), undefined);
}));

test('Knip bundled assets match the manifest and have no native analyzer binaries', async () => {
  const root = path.dirname(launcher);
  const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
  assert.equal(manifest.version, '6.34.0');
  for (const [file, hash] of Object.entries(manifest.sha256)) {
    assert.doesNotMatch(file, /\.(?:node|exe|dll|dylib|so)$/);
    assert.equal(createHash('sha256').update(await readFile(path.join(root, file))).digest('hex'), hash, file);
  }
});

test('Knip distribution preserves npm and Rust notices with provenance', async () => {
  const root = path.dirname(launcher);
  const manifest = JSON.parse(await readFile(path.join(root, 'manifest.json'), 'utf8'));
  for (const pkg of manifest.packages) {
    assert.ok(pkg.license, pkg.name);
    assert.ok(pkg.licenseFiles.length, pkg.name);
    for (const file of pkg.licenseFiles) {
      assert.ok(manifest.sha256[file], file);
      assert.ok((await readFile(path.join(root, file), 'utf8')).trim(), file);
    }
  }
  const provenance = JSON.parse(await readFile(path.join(root, 'notices/provenance.json'), 'utf8'));
  assert.deepEqual(provenance.rust.map((row: {component: string}) => row.component), ['parser', 'resolver']);
  for (const row of [...provenance.upstream, ...provenance.rust.flatMap((engine: {packages: {notices: unknown[]}[]}) => engine.packages.flatMap(pkg => pkg.notices))]) {
    const bytes = await readFile(path.join(root, 'notices', row.file));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), row.sha256, row.file);
  }
});
