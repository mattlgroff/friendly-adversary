// Build-time attribution only. Never invoked by an installed review.
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'engines/knip/notices');
const sources = [
  { name: 'parser', package: 'oxc_parser_napi', repo: 'oxc-project/oxc', commit: '4e258430cdb290598d9f2aeb2d13be598ec9e8e9', dir: process.argv[2] },
  { name: 'resolver', package: 'oxc_resolver_napi', repo: 'oxc-project/oxc-resolver', commit: '7ba4ae692c1f55d5b20bcb0e06ad1f13ad338950', dir: process.argv[3] },
];
if (sources.some(s => !s.dir)) throw new Error('Usage: node scripts/generate-knip-notices.mjs PARSER_SOURCE RESOLVER_SOURCE');
const digest = data => createHash('sha256').update(data).digest('hex');
await mkdir(output, { recursive: true });
const provenance = [];
async function fetchNotice(repo, ref, file, target) {
  const url = `https://raw.githubusercontent.com/${repo}/${ref}/${file}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  await mkdir(path.dirname(path.join(output, target)), { recursive: true });
  await writeFile(path.join(output, target), bytes);
  provenance.push({ file: target, url, sha256: digest(bytes) });
  return bytes;
}
for (const [version, commit] of [['1.1.6', 'b77119e711704cc453949e056b45a4996ea0386c'], ['1.2.3', '70c149321ca4e361f6726349cf9b2258467fb24f']]) {
  await fetchNotice('napi-rs/napi-rs', commit, 'LICENSE', `npm/@napi-rs+wasm-runtime@${version}-LICENSE`);
}
for (const source of sources) {
  const version = source.name === 'parser' ? '0.147.0' : '11.24.2';
  await fetchNotice(source.repo, source.commit, 'LICENSE', `npm/@oxc-${source.name}+binding-wasm32-wasi@${version}-LICENSE`);
  // Refuse a different lockfile rather than generating notices for another graph.
  const lock = await fetchNotice(source.repo, source.commit, 'Cargo.lock', `${source.name}-Cargo.lock`);
  if (!lock.equals(await readFile(path.join(source.dir, 'Cargo.lock')))) throw new Error(`${source.name}: wrong Cargo.lock`);
}
// Upstream declares MIT and an author but supplies no standalone license text.
// Preserve that exact declaration; do not invent a copyright year or notice.
await fetchNotice('toyobayashi/wasm-util', 'efb17cc128a30fb16b58127738f09c8871a3f7d1', 'package.json', 'npm/@tybys+wasm-util@0.10.3-package.json');
// wasm-util contains code adapted from Node's path implementation.
await fetchNotice('nodejs/node', 'v22.23.2', 'LICENSE', 'npm/node-LICENSE');
await fetchNotice('spdx/license-list-data', 'v3.28.0', 'text/MIT.txt', 'npm/MIT.txt');
// Preserve toolchain notices as a conservative superset for the prebuilt WASM.
// These are attribution sources, not a claim that we reproduced upstream builds.
for (const version of ['1.97.0', '1.98.0']) {
  for (const file of ['COPYRIGHT', 'LICENSE-MIT', 'LICENSE-APACHE']) {
    await fetchNotice('rust-lang/rust', version, file, `toolchain/rust-${version}-${file}`);
  }
  for (const file of ['Apache-2.0', 'BSD-2-Clause', 'CC-BY-SA-4.0', 'GCC-exception-3.1', 'GPL-2.0-only', 'GPL-3.0-or-later', 'ISC', 'LLVM-exception', 'MIT', 'NCSA', 'OFL-1.1', 'Unicode-3.0']) {
    await fetchNotice('rust-lang/rust', version, `LICENSES/${file}.txt`, `toolchain/rust-${version}/LICENSES/${file}.txt`);
  }
}
for (const file of ['LICENSE', 'LICENSE-APACHE-LLVM', 'LICENSE-APACHE', 'LICENSE-MIT', 'libc-bottom-half/cloudlibc/LICENSE', 'libc-top-half/musl/COPYRIGHT', 'fts/musl-fts/COPYING', 'dlmalloc/src/malloc.c', 'emmalloc/emmalloc.c']) {
  await fetchNotice('WebAssembly/wasi-libc', '06513b9ae0c1b14ca3010924939c007ed27628a1', file, `toolchain/wasi-libc/${file}`);
}

function cargo(args, cwd) {
  const result = spawnSync(process.env.CARGO ?? 'cargo', args, { cwd, env: { ...process.env, RUSTUP_TOOLCHAIN: process.env.RUSTUP_TOOLCHAIN ?? 'stable' }, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(result.stderr || result.error?.message);
  return result.stdout;
}
const inventory = [];
for (const source of sources) {
  const args = ['--locked', '--target', 'wasm32-wasip1-threads', '-p', source.package];
  const tree = cargo(['tree', ...args, '--edges', 'normal,build', '--prefix', 'none', '--format', '{p}'], source.dir);
  const identities = new Set([...tree.matchAll(/^(\S+) v(\S+)/gm)].map(m => `${m[1]}@${m[2]}`));
  const metadata = JSON.parse(cargo(['metadata', '--locked', '--filter-platform', 'wasm32-wasip1-threads', '--format-version', '1'], source.dir));
  const packages = [];
  for (const identity of [...identities].sort()) {
    const pkg = metadata.packages.find(p => `${p.name}@${p.version}` === identity);
    if (!pkg?.license) throw new Error(`Missing license declaration: ${identity}`);
    let dir = path.dirname(pkg.manifest_path);
    let files = [];
    for (let depth = 0; depth < 12; depth++) {
      files = (await readdir(dir, { withFileTypes: true })).filter(e => e.isFile() && /^(license|copying|notice)/i.test(e.name)).map(e => path.join(dir, e.name));
      if (files.length || dir === path.dirname(dir)) break;
      dir = path.dirname(dir);
    }
    if (!files.length) {
      // Existing exact-version upstream evidence used by the Oxlint engine.
      const override = path.join(root, 'build/oxlint-wasm/license-overrides', `${pkg.name}-${pkg.version}`);
      try { files = (await readdir(override)).filter(f => /^(license|copying|notice)/i.test(f)).map(f => path.join(override, f)); } catch {}
    }
    if (!files.length) {
      const vcs = JSON.parse(await readFile(path.join(path.dirname(pkg.manifest_path), '.cargo_vcs_info.json'), 'utf8'));
      const repo = pkg.repository?.match(/^https:\/\/github.com\/([^/]+\/[^/#]+)/)?.[1]?.replace(/\.git$/, '');
      if (!repo || !/^[a-f0-9]{40}$/.test(vcs.git?.sha1 ?? '')) throw new Error(`Missing license text: ${identity}`);
      const relative = `rust/${identity}/LICENSE`;
      await fetchNotice(repo, vcs.git.sha1, 'LICENSE', relative);
      files = [path.join(output, relative)];
    }
    const notices = [];
    for (const file of files) {
      const relative = `rust/${identity}/${path.basename(file)}`;
      await mkdir(path.dirname(path.join(output, relative)), { recursive: true });
      if (path.resolve(file) !== path.join(output, relative)) await copyFile(file, path.join(output, relative));
      notices.push({ file: relative, sha256: digest(await readFile(file)) });
    }
    packages.push({ name: pkg.name, version: pkg.version, license: pkg.license, source: pkg.source ?? `https://github.com/${source.repo}/tree/${source.commit}`, notices });
  }
  inventory.push({ component: source.name, source: `https://github.com/${source.repo}/tree/${source.commit}`, target: 'wasm32-wasip1-threads', scope: 'Conservative normal and build dependency graph from the pinned upstream lockfile, not a binary symbol-level bill of materials.', packages });
}
await writeFile(path.join(output, 'provenance.json'), JSON.stringify({ upstream: provenance, rust: inventory }, null, 2) + '\n');
console.log(`Preserved notices for ${inventory.map(i => `${i.packages.length} ${i.component} dependencies`).join(', ')}`);
