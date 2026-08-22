import { spawnSync } from "node:child_process";
import path from "node:path";
export function terminateProcessTree(child) {
    if (!child.pid)
        return;
    try {
        if (process.platform === "win32") {
            const taskkill = path.join(process.env.SystemRoot ?? process.env.WINDIR ?? "C:\\Windows", "System32", "taskkill.exe");
            const result = spawnSync(taskkill, ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
            if (result.status !== 0)
                child.kill("SIGTERM");
        }
        else {
            process.kill(-child.pid, "SIGTERM");
        }
    }
    catch {
        child.kill("SIGTERM");
    }
}
export function forceKillProcessTree(child) {
    if (!child.pid)
        return;
    try {
        if (process.platform === "win32") {
            if (child.exitCode === null && child.signalCode === null)
                child.kill("SIGKILL");
        }
        else
            process.kill(-child.pid, "SIGKILL");
    }
    catch {
        if (child.exitCode === null && child.signalCode === null)
            child.kill("SIGKILL");
    }
}
//# sourceMappingURL=process-tree.js.map