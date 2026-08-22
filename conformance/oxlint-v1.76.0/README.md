# Oxlint v1.76.0 conformance

This directory pins the Friendly Adversary conformance corpus to upstream tag `oxlint_v1.76.0` and commit `65fe65d8429e1d1bdf86c517ff08bd119ee87660`.

The production engine certifies 96 portable correctness rules. The allowlist is derived from upstream rule metadata using all of these conditions:

1. The plugin is `eslint`, `unicorn`, `typescript`, or `oxc`.
2. The category is `correctness`.
3. The rule is not backed by tsgolint.

The upstream library test binary contains 1,175 tests. `wasi-test-harness.patch` changes only its WASI portability and result ordering. Snapshot assertions are not part of the gate because several upstream snapshots encode native hash iteration order. The snapshot files remain inventory-only evidence, while semantic pass, fail, configuration, and fix cases execute.

The immutable ledger also contains all 825 linter snapshots, 306 CLI fixture entries, and 186 CLI snapshots from the pinned commit. Thirteen production-ABI adapters replay the 34 applicable fixture entries and 15 applicable CLI snapshots. The native JSON diagnostic adapter compares complete upstream diagnostic objects, including messages, codes, severities, filenames, byte spans, line and column locations, help, URLs, causes, and related diagnostics.

No conformance patch is applied to the production engine source. The runtime artifact is built from the separate crate in `build/oxlint-wasm`.

The semantic rule and production ABI gate requires every executable applicable case to pass. Every upstream test, snapshot, CLI fixture, and CLI snapshot must still appear in the generated inventory with its exact classification and reason. Inventory-only snapshots are not claimed as executed. An upstream ignored case cannot count as a pass.

Build and run the audited corpus with Rust 1.97.1 and Node 22:

```bash
git clone https://github.com/oxc-project/oxc.git /absolute/path/to/oxc
git -C /absolute/path/to/oxc checkout 65fe65d8429e1d1bdf86c517ff08bd119ee87660
git -C /absolute/path/to/oxc apply --unidiff-zero /absolute/path/to/friendly-adversary/conformance/oxlint-v1.76.0/wasi-test-harness.patch
rustup target add wasm32-wasip1 --toolchain 1.97.1
cargo +1.97.1 test --manifest-path /absolute/path/to/oxc/Cargo.toml -p oxc_linter --lib --target wasm32-wasip1 --no-run
cd /absolute/path/to/friendly-adversary
npm run conformance:oxlint -- --upstream-root /absolute/path/to/oxc --run true
```

The runner rejects the checkout unless its commit and complete tracked diff exactly match the audited patch.
