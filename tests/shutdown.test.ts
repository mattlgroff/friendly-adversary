import assert from "node:assert/strict";
import test from "node:test";
import { ShutdownGuard } from "../src/shutdown.js";

test("shutdown requests remain observable after an internal worker has settled", async () => {
  const guard = new ShutdownGuard("Fixture analyzer");
  try {
    await Promise.resolve("worker response");
    process.emit("SIGTERM", "SIGTERM");
    assert.equal(guard.controller.signal.aborted, true);
    assert.equal(guard.requestedSignal, "SIGTERM");
    assert.throws(
      () => guard.throwIfRequested(),
      (error: unknown) => error instanceof Error
        && error.message === "Fixture analyzer was cancelled by SIGTERM"
        && (error as Error & { exitCode?: number }).exitCode === 143,
    );
  } finally {
    guard.close();
  }
});

test("closing a shutdown guard removes every installed signal listener", () => {
  const before = new Map(["SIGINT", "SIGTERM", "SIGHUP"].map((signal) => [signal, process.listenerCount(signal)]));
  const guard = new ShutdownGuard("Fixture analyzer");
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
    assert.equal(process.listenerCount(signal), (before.get(signal) ?? 0) + 1);
  }
  guard.close();
  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"] as const) {
    assert.equal(process.listenerCount(signal), before.get(signal));
  }
});
