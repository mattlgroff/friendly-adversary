import { createRequire, syncBuiltinESMExports } from "node:module";

const require = createRequire(process.argv[1] ?? process.execPath);
type MutableModule = Record<string, unknown>;
const DNS_METHODS = [
  "getDefaultResultOrder", "getServers", "lookup", "lookupService", "resolve", "resolve4", "resolve6",
  "resolveAny", "resolveCaa", "resolveCname", "resolveMx", "resolveNaptr", "resolveNs", "resolvePtr",
  "resolveSoa", "resolveSrv", "resolveTlsa", "resolveTxt", "reverse", "setDefaultResultOrder", "setServers",
];
const DNS_RESOLVER_METHODS = DNS_METHODS.filter((name) => name === "reverse" || name.startsWith("resolve"));

function denyNetwork(): never {
  throw new Error("Friendly Adversary local MCP does not permit network access");
}

function replace(moduleName: string, names: string[]): void {
  const module = require(moduleName) as MutableModule;
  for (const name of names) if (name in module) module[name] = denyNetwork;
}

function replaceResolver(moduleName: string): void {
  const module = require(moduleName) as MutableModule & { Resolver?: { prototype?: MutableModule } };
  if (!module.Resolver?.prototype) return;
  for (const name of DNS_RESOLVER_METHODS) if (name in module.Resolver.prototype) module.Resolver.prototype[name] = denyNetwork;
}

export function disableNetworkAccess(): void {
  const net = require("node:net") as MutableModule & { Server?: { prototype?: MutableModule }; Socket?: { prototype?: MutableModule } };
  replace("node:net", ["connect", "createConnection", "createServer"]);
  if (net.Server?.prototype) net.Server.prototype.listen = denyNetwork;
  if (net.Socket?.prototype) {
    net.Socket.prototype.connect = denyNetwork;
    net.Socket.prototype.open = denyNetwork;
  }
  const tls = require("node:tls") as MutableModule & { Server?: { prototype?: MutableModule }; TLSSocket?: { prototype?: MutableModule } };
  replace("node:tls", ["connect", "createServer"]);
  if (tls.Server?.prototype) tls.Server.prototype.listen = denyNetwork;
  if (tls.TLSSocket?.prototype) tls.TLSSocket.prototype.connect = denyNetwork;
  replace("node:http", ["get", "request", "createServer"]);
  replace("node:https", ["get", "request", "createServer"]);
  replace("node:http2", ["connect", "createServer", "createSecureServer"]);
  const dgram = require("node:dgram") as MutableModule & { Socket?: { prototype?: MutableModule } };
  replace("node:dgram", ["createSocket"]);
  if (dgram.Socket?.prototype) {
    dgram.Socket.prototype.bind = denyNetwork;
    dgram.Socket.prototype.connect = denyNetwork;
    dgram.Socket.prototype.send = denyNetwork;
  }
  replace("node:dns", DNS_METHODS);
  replace("node:dns/promises", DNS_METHODS);
  replaceResolver("node:dns");
  replaceResolver("node:dns/promises");
  replace("node:inspector", ["open"]);
  syncBuiltinESMExports();
  Object.defineProperty(globalThis, "fetch", { configurable: false, value: denyNetwork, writable: false });
  if ("WebSocket" in globalThis) Object.defineProperty(globalThis, "WebSocket", { configurable: false, value: denyNetwork, writable: false });
}
