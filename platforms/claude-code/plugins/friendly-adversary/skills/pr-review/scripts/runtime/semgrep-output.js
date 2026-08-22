import path from "node:path";
function portablePath(value) {
    return value.split(path.sep).join("/");
}
function describeError(value) {
    if (value === null || typeof value !== "object")
        return "<unknown>: unknown error";
    const error = value;
    const target = typeof error.location?.path === "string" ? portablePath(error.location.path) : "<unknown>";
    const message = error.message === "Stack_overflow"
        ? "engine stack limit exceeded; target not covered"
        : typeof error.message === "string" && error.message.length > 0
            ? error.message
            : "unknown error";
    return `${target}: ${message}`;
}
export function validateSemgrepRunOutput(raw, expectedFiles) {
    let parsed;
    try {
        parsed = JSON.parse(raw);
    }
    catch (error) {
        return `Semgrep emitted invalid JSON: ${error instanceof Error ? error.message : String(error)}`;
    }
    if (parsed === null || typeof parsed !== "object")
        return "Semgrep emitted an invalid result shape";
    const output = parsed;
    if (!Array.isArray(output.errors) || !output.paths || !Array.isArray(output.paths.scanned)
        || !output.paths.scanned.every((entry) => typeof entry === "string")) {
        return "Semgrep emitted an invalid result shape";
    }
    if (output.errors.length > 0) {
        const details = output.errors.map(describeError).sort().join("; ");
        return `Semgrep reported ${output.errors.length} scan error${output.errors.length === 1 ? "" : "s"} (${details})`;
    }
    const scanned = new Set(output.paths.scanned.map(portablePath));
    const missing = [...new Set(expectedFiles.map(portablePath))].filter((file) => !scanned.has(file)).sort();
    if (missing.length > 0) {
        return `Semgrep did not report ${missing.length} target${missing.length === 1 ? "" : "s"} as scanned: ${missing.join(", ")}`;
    }
    return undefined;
}
//# sourceMappingURL=semgrep-output.js.map