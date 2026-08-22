import { FriendlyAdversaryError } from "./errors.js";

const SIGNALS = ["SIGINT", "SIGTERM", "SIGHUP"] as const;

export function shutdownExitCode(signal: NodeJS.Signals): number {
  return signal === "SIGINT" ? 130 : signal === "SIGTERM" ? 143 : 129;
}

export class ShutdownGuard {
  readonly controller = new AbortController();
  requestedSignal: NodeJS.Signals | undefined;
  readonly #handlers = new Map<NodeJS.Signals, () => void>();

  constructor(readonly operation: string) {
    for (const signal of SIGNALS) {
      const handler = (): void => {
        this.requestedSignal ??= signal;
        this.controller.abort();
      };
      this.#handlers.set(signal, handler);
      process.once(signal, handler);
    }
  }

  get exitCode(): number {
    return this.requestedSignal ? shutdownExitCode(this.requestedSignal) : 130;
  }

  get reason(): string {
    return this.requestedSignal
      ? `${this.operation} was cancelled by ${this.requestedSignal}`
      : `${this.operation} was cancelled`;
  }

  throwIfRequested(): void {
    if (this.requestedSignal) throw new FriendlyAdversaryError(this.reason, this.exitCode);
  }

  close(): void {
    for (const [signal, handler] of this.#handlers) process.removeListener(signal, handler);
    this.#handlers.clear();
  }
}
