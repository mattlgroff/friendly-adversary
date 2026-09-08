import { writeFileSync } from 'node:fs';
export default function coverage(data) {
  writeFileSync(process.env.FA_KNIP_COVERAGE, JSON.stringify({ configurationHints: data.configurationHints, tagHints: [...data.tagHints], enabledPlugins: data.enabledPlugins, includedWorkspaceDirs: data.includedWorkspaceDirs }, null, 2) + '\n');
  return data;
}
