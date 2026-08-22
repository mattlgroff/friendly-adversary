#!/usr/bin/env node
import { disableNetworkAccess } from "./mcp-network-guard.js";

disableNetworkAccess();

async function main(): Promise<void> {
  const { runMcpServer } = await import("./lens-report-mcp.js");
  await runMcpServer();
}

void main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "MCP server startup failed safely";
  process.stderr.write(`friendly-adversary MCP: ${message}\n`);
  process.exitCode = 1;
});
