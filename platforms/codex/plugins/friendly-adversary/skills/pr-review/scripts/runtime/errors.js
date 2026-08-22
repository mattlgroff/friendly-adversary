export class FriendlyAdversaryError extends Error {
    exitCode;
    constructor(message, exitCode = 1) {
        super(message);
        this.name = "FriendlyAdversaryError";
        this.exitCode = exitCode;
    }
}
export function formatFailureDetail(error) {
    if (error instanceof AggregateError) {
        const children = [...error.errors].map((child) => formatFailureDetail(child));
        return `${error.message}${children.length ? `\n${children.map((child) => `- ${child}`).join("\n")}` : ""}`;
    }
    return error instanceof Error ? error.message : String(error);
}
//# sourceMappingURL=errors.js.map