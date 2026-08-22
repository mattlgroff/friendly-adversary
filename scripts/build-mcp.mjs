import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = path.join(root, "dist", "mcp");
const outputFile = path.join(outputRoot, "friendly-adversary-mcp.cjs");
const restrictedBuiltins = new Set([
  "node:net",
  "node:dgram",
  "node:dns",
  "node:dns/promises",
  "node:http",
  "node:https",
  "node:http2",
  "node:tls",
  "node:inspector",
]);

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });
const result = await build({
  absWorkingDir: root,
  entryPoints: ["src/lens-report-mcp-bootstrap.ts"],
  outfile: outputFile,
  bundle: true,
  platform: "node",
  // Keep the emitted syntax within Semgrep CE's fully supported JavaScript
  // grammar while retaining Node 22.22 as the required runtime contract.
  target: "es2021",
  format: "cjs",
  metafile: true,
  sourcemap: false,
  legalComments: "none",
  treeShaking: true,
  logLevel: "silent",
});

const restrictedImports = [];
for (const [input, details] of Object.entries(result.metafile.inputs)) {
  for (const imported of details.imports) {
    if (!restrictedBuiltins.has(imported.path)) continue;
    restrictedImports.push({ input, builtin: imported.path });
    if (input !== "src/mcp-network-guard.ts") {
      throw new Error(`Restricted network or inspector import ${imported.path} escaped the bootstrap guard in ${input}`);
    }
  }
}
const guardSource = await readFile(path.join(root, "src", "mcp-network-guard.ts"), "utf8");
for (const builtin of restrictedBuiltins) {
  if (!guardSource.includes(JSON.stringify(builtin))) throw new Error(`MCP network guard does not cover ${builtin}`);
  if (!restrictedImports.some((entry) => entry.builtin === builtin)) {
    restrictedImports.push({ input: "src/mcp-network-guard.ts", builtin });
  }
}

const emittedBundle = await readFile(outputFile);
const text = emittedBundle.toString("utf8").replace(/[\t ]+$/gmu, "");
if (text !== emittedBundle.toString("utf8")) await writeFile(outputFile, text);
const bundle = Buffer.from(text, "utf8");
if (!text.includes("disableNetworkAccess();")) throw new Error("MCP bundle lost its network bootstrap guard");
const guardOffset = text.indexOf("disableNetworkAccess();");
const serverInitializationOffset = text.indexOf("init_lens_report_mcp()", guardOffset);
if (guardOffset < 0 || serverInitializationOffset < 0 || guardOffset >= serverInitializationOffset) {
  throw new Error("MCP bundle no longer defers SDK-backed server initialization until after the guard");
}
if (/\b(?:npm|npx|pnpm|yarn)\s+(?:install|exec)\b/u.test(text)) throw new Error("MCP bundle contains a runtime package-manager command");
const packageVersion = async (name) => JSON.parse(await readFile(path.join(root, "node_modules", name, "package.json"), "utf8")).version;
const manifest = {
  schemaVersion: "1",
  entrypoint: "friendly-adversary-mcp.cjs",
  bytes: bundle.byteLength,
  sha256: createHash("sha256").update(bundle).digest("hex"),
  nodeTarget: "22.22",
  syntaxTarget: "es2021",
  transport: "stdio",
  sdk: {
    server: await packageVersion("@modelcontextprotocol/server"),
    core: await packageVersion("@modelcontextprotocol/core"),
    zod: await packageVersion("zod"),
  },
  restrictedImports,
};
await writeFile(path.join(outputRoot, "bundle-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
