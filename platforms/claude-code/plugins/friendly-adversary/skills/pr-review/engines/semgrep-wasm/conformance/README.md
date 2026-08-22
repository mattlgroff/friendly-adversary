# Conformance evidence

`scoreboard.json` is generated from the exact verified Semgrep v1.172.0 source tree by `scripts/run-semgrep-conformance.mjs`. Discovery is denominator-preserving: every JavaScript, TypeScript, and Python target in the pinned upstream single-pattern corpus is paired with its local or POLYGLOT `.sgrep` fixture, classified once, and retained even when it fails.

Run:

```bash
node --max-old-space-size=2048 scripts/run-semgrep-conformance.mjs \
  --upstream /absolute/path/to/pristine/semgrep-v1.172.0 \
  --output engines/semgrep-wasm/conformance/scoreboard.json
```

An `adapted-pass` means the upstream `.sgrep` pattern was placed unchanged into the `pattern` field of a one-rule JSON document. This adapts Semgrep's internal pattern-test interface to the product engine's rule-document interface without changing the target, pattern, or expected match lines.

The upstream pattern corpus is one layer of the gate. Product rule composition, runtime security, malformed inputs, deterministic output, packaging, and platform evidence are separate suites and cannot be inferred from this score alone.
