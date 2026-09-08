import { fileURLToPath, pathToFileURL } from 'node:url';
import { createJiti as upstream } from 'knip-jiti';
export function createJiti(...args) {
  const loader = upstream(...args);
  if (process.env.FA_KNIP_PROJECT_CODE === '1') return loader;
  const refuse = () => { throw new Error('Knip audit cannot execute project configuration from the source snapshot. Configuration must be data-only for this analysis.'); };
  const coverage = fileURLToPath(new URL('./coverage.mjs', import.meta.url));
  return Object.assign(refuse, { import: file => file === coverage ? import(pathToFileURL(file).href).then(m => m.default) : refuse() });
}
