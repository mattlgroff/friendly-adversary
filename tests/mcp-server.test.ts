import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile, realpath } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import test from "node:test";
import { Client } from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { retryableToolError } from "../src/lens-report-mcp.js";
import { authorityRoot } from "../src/authority.js";

const bundle = path.resolve("dist", "mcp", "friendly-adversary-mcp.cjs");
const permissionArgs = ["--permission", "--allow-fs-read=*", "--allow-fs-write=*", "--no-addons", bundle];

test("only bounded transient tool failures are advertised as retryable", () => {
  assert.equal(retryableToolError("FA_RUN_BUSY"), true);
  assert.equal(retryableToolError("FA_AUTHORITY_NOT_FOUND"), false);
});

test("default authority state is sandbox-writable and independent of the user home", async () => {
  const previous = process.env.FRIENDLY_ADVERSARY_STATE_DIR;
  delete process.env.FRIENDLY_ADVERSARY_STATE_DIR;
  try {
    const root = authorityRoot();
    const temporaryRoot = await realpath(os.tmpdir());
    assert.equal(path.relative(temporaryRoot, root).startsWith(".."), false);
    assert.match(path.relative(temporaryRoot, root), /^friendly-adversary-[a-f0-9]{16}[\\/]authorities$/u);
  } finally {
    if (previous === undefined) delete process.env.FRIENDLY_ADVERSARY_STATE_DIR;
    else process.env.FRIENDLY_ADVERSARY_STATE_DIR = previous;
  }
});

test("official MCP client negotiates stdio and sees exactly one strict artifact tool", async () => {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: permissionArgs,
    env: { PATH: process.env.PATH ?? "", NODE_OPTIONS: "", NODE_PATH: "" },
    stderr: "pipe",
  });
  const client = new Client({ name: "friendly-adversary-acceptance", version: "1" });
  try {
    await client.connect(transport);
    const listed = await client.listTools();
    assert.deepEqual(listed.tools.map(({ name }) => name).sort(), ["record_artifact"]);
    for (const tool of listed.tools) {
      assert.equal(tool.annotations?.openWorldHint, false);
      assert.equal(tool.annotations?.idempotentHint, false);
      assert.match(JSON.stringify(tool.inputSchema), /"additionalProperties":false/);
    }
    const completionSchema = JSON.stringify(listed.tools[0]?.inputSchema);
    assert.match(completionSchema, /"maxItems":5/u);
    assert.match(completionSchema, /"maxLength":65536/u);
    const invalid = await client.callTool({
      name: "record_artifact",
      arguments: { operation: "preflight", workflow: "pr-review", authority_id: "0".repeat(32), relative_path: "lenses/correctness.md", write_capability: "A".repeat(43) },
    });
    assert.equal(invalid.isError, true);
    assert.doesNotMatch(JSON.stringify(invalid), /\.friendly-adversary|Users|home/);
  } finally {
    await client.close();
  }
});

test("both host manifests launch the declared MCP server", async () => {
  for (const platform of ["claude-code", "codex"] as const) {
    const pluginRoot = path.resolve("platforms", platform, "plugins", "friendly-adversary");
    const manifest = JSON.parse(await readFile(path.join(pluginRoot, ".mcp.json"), "utf8"));
    const declared = platform === "claude-code"
      ? manifest.mcpServers["friendly-adversary-reports"]
      : manifest["friendly-adversary-reports"];
    const args = declared.args.map((argument: string) => argument.replace("${CLAUDE_PLUGIN_ROOT}", pluginRoot));
    const transport = new StdioClientTransport({
      command: declared.command,
      args,
      ...(platform === "codex" ? { cwd: pluginRoot } : {}),
      env: { PATH: process.env.PATH ?? "", ...declared.env },
      stderr: "pipe",
    });
    const client = new Client({ name: `friendly-adversary-${platform}-manifest`, version: "1" });
    try {
      await client.connect(transport);
      assert.deepEqual((await client.listTools()).tools.map(({ name }) => name), ["record_artifact"]);
    } finally {
      await client.close();
    }
  }
});

test("bundle manifest proves stdio-only packaging and complete network guard coverage", async () => {
  const manifest = JSON.parse(await readFile(path.resolve("dist", "mcp", "bundle-manifest.json"), "utf8")) as {
    transport: string;
    nodeTarget: string;
    syntaxTarget: string;
    restrictedImports: Array<{ builtin: string }>;
  };
  assert.equal(manifest.transport, "stdio");
  assert.equal(manifest.nodeTarget, "22.22");
  assert.equal(manifest.syntaxTarget, "es2021");
  assert.deepEqual(
    new Set(manifest.restrictedImports.map(({ builtin }) => builtin)),
    new Set(["node:net", "node:dgram", "node:dns", "node:dns/promises", "node:http", "node:https", "node:http2", "node:tls", "node:inspector"]),
  );
});

test("MCP network guard behaviorally denies every protected network family", () => {
  const guard = pathToFileURL(path.resolve("dist", "src", "mcp-network-guard.js")).href;
  const script = `
    import { disableNetworkAccess } from ${JSON.stringify(guard)};
    import * as dgram from "node:dgram";
    import * as dns from "node:dns";
    import * as dnsPromises from "node:dns/promises";
    import * as http from "node:http";
    import * as http2 from "node:http2";
    import * as https from "node:https";
    import * as net from "node:net";
    import * as tls from "node:tls";
    import * as inspector from "node:inspector";
    disableNetworkAccess();
    const attempts = [
      ["net.createServer", () => net.createServer()],
      ["net.connect", () => net.connect(9)],
      ["tls.connect", () => tls.connect(443, "127.0.0.1")],
      ["tls.createServer", () => tls.createServer()],
      ["http.get", () => http.get("http://127.0.0.1")],
      ["http.request", () => http.request("http://127.0.0.1")],
      ["http.createServer", () => http.createServer()],
      ["https.get", () => https.get("https://127.0.0.1")],
      ["https.request", () => https.request("https://127.0.0.1")],
      ["https.createServer", () => https.createServer()],
      ["http2.connect", () => http2.connect("https://127.0.0.1")],
      ["http2.createServer", () => http2.createServer()],
      ["http2.createSecureServer", () => http2.createSecureServer()],
      ["dgram.createSocket", () => dgram.createSocket("udp4")],
      ...[
        "getDefaultResultOrder", "getServers", "lookup", "lookupService", "resolve", "resolve4", "resolve6",
        "resolveAny", "resolveCaa", "resolveCname", "resolveMx", "resolveNaptr", "resolveNs", "resolvePtr",
        "resolveSoa", "resolveSrv", "resolveTlsa", "resolveTxt", "reverse", "setDefaultResultOrder", "setServers",
      ].map((name) => ["dns." + name, () => dns[name]()]),
      ...[
        "getDefaultResultOrder", "getServers", "lookup", "lookupService", "resolve", "resolve4", "resolve6",
        "resolveAny", "resolveCaa", "resolveCname", "resolveMx", "resolveNaptr", "resolveNs", "resolvePtr",
        "resolveSoa", "resolveSrv", "resolveTlsa", "resolveTxt", "reverse", "setDefaultResultOrder", "setServers",
      ].flatMap((name) => [
        ["dns.promises." + name, () => dns.promises[name]()],
        ["node:dns/promises." + name, () => dnsPromises[name]()],
      ]),
      ["dns.Resolver.resolve", () => new dns.Resolver().resolve("example.com", () => {})],
      ["dns.promises.Resolver.resolve", () => new dns.promises.Resolver().resolve("example.com")],
      ["node:dns/promises.Resolver.resolve", () => new dnsPromises.Resolver().resolve("example.com")],
      ["fetch", () => fetch("http://127.0.0.1")],
      ["inspector.open", () => inspector.open()],
    ];
    const results = [];
    for (const [name, attempt] of attempts) {
      try { await attempt(); results.push([name, "NOT DENIED"]); }
      catch (error) { results.push([name, error.message]); }
    }
    process.stdout.write(JSON.stringify(results));
  `;
  const output = execFileSync(process.execPath, ["--input-type=module", "--eval", script], { encoding: "utf8" });
  const attempts = JSON.parse(output) as Array<[string, string]>;
  assert.ok(attempts.length >= 78);
  assert.ok(attempts.every(([, message]) => message === "Friendly Adversary local MCP does not permit network access"));
});

test("the supported Node permission profile starts and exits cleanly on EOF", () => {
  const output = execFileSync(process.execPath, permissionArgs, { input: "", timeout: 5_000, encoding: "utf8" });
  assert.equal(output, "");
});
