import * as bindings from 'knip-parser-wasm';
import { wrap } from 'knip-parser-wrapper';
export { Visitor } from 'knip-parser-visitor';
export { default as visitorKeys } from 'knip-parser-keys';
export const rawTransferSupported = () => false;
export function parseSync(filename, source, options) {
  return wrap(bindings.parseSync(filename, source, options));
}
