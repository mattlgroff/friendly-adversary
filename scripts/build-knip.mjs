import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, copyFile, readdir, cp, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

// Build-time only. Install engines/knip/build/package-lock.json with npm ci
// --ignore-scripts --omit=optional --force. WASM packages declare cpu=wasm32;
// --force permits packaging them on the build host, not a native fallback.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.resolve(process.argv[2] ?? path.join(root, 'engines/knip/build'));
const modules = path.join(source, 'node_modules');
const output = path.join(root, 'engines/knip/runtime');
await mkdir(output, { recursive: true });
const inputs = new Set();
const esmBanner = 'import { createRequire as __createRequire } from "node:module"; const require = __createRequire(import.meta.url);';
const common = { bundle: true, platform: 'node', target: 'node22.22', metafile: true, minifyWhitespace: true, legalComments: 'eof', logLevel: 'silent' };
async function compile(entry, outfile, extra = {}) {
  const result = await build({ ...common, absWorkingDir: source, entryPoints: [entry], outfile, ...extra });
  for (const file of Object.keys(result.metafile.inputs)) inputs.add(path.resolve(source, file));
}
// Keep filesystem-relative WASM and worker paths intact by giving each binding
// its own directory. No native binding loader is included in these bundles.
for (const [name, version] of [['parser', '0.147.0'], ['resolver', '11.24.2']]) {
  const dir = path.join(modules, `@oxc-${name}/binding-wasm32-wasi`);
  const manifest = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'));
  if (manifest.version !== version) throw new Error(`Unexpected ${name} WASM version`);
  const target = path.join(output, name);
  await mkdir(target, { recursive: true });
  await compile(path.join(dir, `${name}.wasi.cjs`), path.join(target, 'binding.cjs'), { format: 'cjs' });
  await compile(path.join(dir, 'wasi-worker.mjs'), path.join(target, 'wasi-worker.mjs'), { format: 'esm', banner: { js: esmBanner } });
  await copyFile(path.join(dir, `${name}.wasm32-wasi.wasm`), path.join(target, `${name}.wasm32-wasi.wasm`));
}
const adapter = path.join(root, 'engines/knip/parser-adapter.mjs');
await compile(path.join(modules, 'knip/dist/cli.js'), path.join(output, 'knip.mjs'), {
  format: 'esm', banner: { js: esmBanner },
  plugins: [{ name: 'wasm-only', setup(builder) {
    builder.onLoad({ filter: /oxc-parser\/src-js\/visit\/index\.js$/ }, async ({ path: file }) => {
      const sourceText = await readFile(file, 'utf8');
      const localRequire = 'const require = createRequire(import.meta.url);';
      if (!sourceText.includes(localRequire)) throw new Error('Oxc visitor loader changed');
      return { contents: sourceText.replace(localRequire, ''), loader: 'js' };
    });
    builder.onResolve({ filter: /^jiti$/ }, () => ({ path: path.join(root, 'engines/knip/jiti-adapter.mjs') }));
    builder.onResolve({ filter: /^knip-jiti$/ }, () => ({ path: './jiti/lib/jiti.mjs', external: true }));
    builder.onResolve({ filter: /^oxc-parser$/ }, () => ({ path: adapter }));
    builder.onResolve({ filter: /^oxc-resolver$/ }, () => ({ path: './resolver/binding.cjs', external: true }));
    builder.onResolve({ filter: /^knip-parser-wasm$/ }, () => ({ path: './parser/binding.cjs', external: true }));
    builder.onResolve({ filter: /^knip-parser-wrapper$/ }, () => ({ path: path.join(modules, 'oxc-parser/src-js/wrap.js') }));
    builder.onResolve({ filter: /^knip-parser-visitor$/ }, () => ({ path: path.join(modules, 'oxc-parser/src-js/visit/index.js') }));
    builder.onResolve({ filter: /^knip-parser-keys$/ }, () => ({ path: path.join(modules, 'oxc-parser/src-js/generated/visit/keys.js') }));
  } }],
});
// Jiti loads its transformer relative to its own filename. Preserve those
// upstream runtime files rather than changing its configuration loader.
await mkdir(path.join(output, 'jiti'), { recursive: true });
for (const file of ['lib/jiti.mjs', 'dist/jiti.cjs', 'dist/babel.cjs']) {
  const target = path.join(output, 'jiti', file);
  await mkdir(path.dirname(target), { recursive: true });
  await copyFile(path.join(modules, 'jiti', file), target);
}
// The loader's empty compatibility module must remain next to the bundle.
await writeFile(path.join(output, 'empty.js'), 'export {};\n');
for (const file of ['launch.mjs', 'coverage.mjs']) await copyFile(path.join(root, 'engines/knip', file), path.join(output, file));
// Record every bundled package and preserve its license files.
const packages = new Map();
for (const input of [...inputs, path.join(modules, 'jiti/lib/jiti.mjs')]) {
  let dir = path.dirname(input);
  while (dir.startsWith(modules)) {
    try {
      const pkg = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'));
      if (pkg.name && pkg.version) { packages.set(`${pkg.name}@${pkg.version}`, { dir, pkg }); break; }
    } catch {}
    dir = path.dirname(dir);
  }
}
const licenses = path.join(output, 'licenses');
await mkdir(licenses, { recursive: true });
await rm(path.join(output, 'notices'), { recursive: true, force: true });
await cp(path.join(root, 'engines/knip/notices'), path.join(output, 'notices'), { recursive: true });
await copyFile(path.join(root, 'engines/knip/NOTICE.md'), path.join(output, 'NOTICE.md'));
const inventory = [];
for (const [identity, { dir, pkg }] of [...packages].sort()) {
  const files = (await readdir(dir)).filter(file => /^(license|copying|notice)/i.test(file));
  for (const file of files) await copyFile(path.join(dir, file), path.join(licenses, `${identity.replaceAll('/', '+')}-${file}`));
  const licenseFiles = files.map(file => `licenses/${identity.replaceAll('/', '+')}-${file}`);
  if (!licenseFiles.length) {
    const supplement = identity === '@tybys/wasm-util@0.10.3'
      ? ['notices/npm/@tybys+wasm-util@0.10.3-package.json', 'notices/npm/MIT.txt', 'notices/npm/node-LICENSE']
      : [`notices/npm/${identity.replaceAll('/', '+')}-LICENSE`];
    for (const file of supplement) {
      if (!(await readFile(path.join(output, file))).length) throw new Error(`Empty license: ${file}`);
      licenseFiles.push(file);
    }
  }
  inventory.push({ name: pkg.name, version: pkg.version, license: pkg.license, licenseFiles });
}
async function hashes(dir, prefix = '') {
  const result = {};
  for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name))) {
    const relative = prefix + entry.name;
    if (entry.isDirectory()) Object.assign(result, await hashes(path.join(dir, entry.name), relative + '/'));
    else if (entry.name !== 'manifest.json') result[relative] = createHash('sha256').update(await readFile(path.join(dir, entry.name))).digest('hex');
  }
  return result;
}
await writeFile(path.join(output, 'manifest.json'), JSON.stringify({ version: '6.34.0', packages: inventory, sha256: await hashes(output) }, null, 2) + '\n');
