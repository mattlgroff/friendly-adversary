import { createRequire, syncBuiltinESMExports } from "node:module";
const require = createRequire(import.meta.url);
const DNS_METHODS = [
    "getDefaultResultOrder",
    "getServers",
    "lookup",
    "lookupService",
    "resolve",
    "resolve4",
    "resolve6",
    "resolveAny",
    "resolveCaa",
    "resolveCname",
    "resolveMx",
    "resolveNaptr",
    "resolveNs",
    "resolvePtr",
    "resolveSoa",
    "resolveSrv",
    "resolveTlsa",
    "resolveTxt",
    "reverse",
    "setDefaultResultOrder",
    "setServers",
];
const DNS_RESOLVER_METHODS = DNS_METHODS.filter((name) => name === "reverse" || name.startsWith("resolve"));
function denyNetwork() {
    throw new Error("Network access is disabled for the bundled Semgrep engine");
}
function replace(moduleName, names) {
    const module = require(moduleName);
    for (const name of names) {
        if (name in module)
            module[name] = denyNetwork;
    }
}
function replaceResolver(moduleName) {
    const module = require(moduleName);
    if (!module.Resolver?.prototype)
        return;
    for (const name of DNS_RESOLVER_METHODS)
        if (name in module.Resolver.prototype)
            module.Resolver.prototype[name] = denyNetwork;
}
export function disableNetworkAccess() {
    const net = require("node:net");
    replace("node:net", ["connect", "createConnection"]);
    if (net.Socket?.prototype) {
        net.Socket.prototype.connect = denyNetwork;
        net.Socket.prototype.open = denyNetwork;
    }
    const tls = require("node:tls");
    replace("node:tls", ["connect"]);
    if (tls.TLSSocket?.prototype)
        tls.TLSSocket.prototype.connect = denyNetwork;
    replace("node:http", ["get", "request"]);
    replace("node:https", ["get", "request"]);
    replace("node:http2", ["connect"]);
    const dgram = require("node:dgram");
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
    syncBuiltinESMExports();
    Object.defineProperty(globalThis, "fetch", { configurable: false, value: denyNetwork, writable: false });
    if ("WebSocket" in globalThis) {
        Object.defineProperty(globalThis, "WebSocket", { configurable: false, value: denyNetwork, writable: false });
    }
}
//# sourceMappingURL=network-guard.js.map