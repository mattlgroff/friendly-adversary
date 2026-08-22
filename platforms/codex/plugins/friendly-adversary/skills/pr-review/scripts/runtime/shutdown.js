import { FriendlyAdversaryError } from "./errors.js";
const SIGNALS = ["SIGINT", "SIGTERM", "SIGHUP"];
export function shutdownExitCode(signal) {
    return signal === "SIGINT" ? 130 : signal === "SIGTERM" ? 143 : 129;
}
export class ShutdownGuard {
    operation;
    controller = new AbortController();
    requestedSignal;
    #handlers = new Map();
    constructor(operation) {
        this.operation = operation;
        for (const signal of SIGNALS) {
            const handler = () => {
                this.requestedSignal ??= signal;
                this.controller.abort();
            };
            this.#handlers.set(signal, handler);
            process.once(signal, handler);
        }
    }
    get exitCode() {
        return this.requestedSignal ? shutdownExitCode(this.requestedSignal) : 130;
    }
    get reason() {
        return this.requestedSignal
            ? `${this.operation} was cancelled by ${this.requestedSignal}`
            : `${this.operation} was cancelled`;
    }
    throwIfRequested() {
        if (this.requestedSignal)
            throw new FriendlyAdversaryError(this.reason, this.exitCode);
    }
    close() {
        for (const [signal, handler] of this.#handlers)
            process.removeListener(signal, handler);
        this.#handlers.clear();
    }
}
//# sourceMappingURL=shutdown.js.map