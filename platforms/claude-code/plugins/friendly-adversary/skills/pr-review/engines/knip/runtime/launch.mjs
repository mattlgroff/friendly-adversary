import path from 'node:path';
const [mode, coverage] = process.argv.slice(2);
if (mode === '--version') {
  process.argv = [process.argv[0], process.argv[1], '--version'];
} else {
  if (!['audit', 'pr'].includes(mode) || !coverage || !path.isAbsolute(coverage)) throw new Error('Expected audit|pr and an absolute coverage artifact path');
  process.env.FA_KNIP_PROJECT_CODE = mode === 'pr' ? '1' : '0';
  process.env.FA_KNIP_COVERAGE = coverage;
  process.env.KNIP_DISABLE_RAW_TRANSFER = '1';
  process.env.NX_DAEMON = 'false';
  process.env.JITI_FS_CACHE = '0';
  process.argv = [process.argv[0], process.argv[1], '--reporter', 'json', '--no-progress', '--preprocessor', path.join(import.meta.dirname, 'coverage.mjs')];
}
await import('./knip.mjs');
