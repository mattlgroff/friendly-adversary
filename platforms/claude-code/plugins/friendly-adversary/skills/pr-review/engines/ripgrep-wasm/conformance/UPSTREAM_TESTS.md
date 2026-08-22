# Upstream ripgrep conformance

The production module was built from the unmodified signed 15.2.0 source tag. A second clean build was byte-identical.

## Complete native denominator

- Passed: 1,174
- Failed: 0
- Upstream ignored: 3

The native workspace suite proves the full upstream implementation, including the 323 root integration tests whose harness launches an `rg` subprocess.

## Product relevance denominator

- Upstream inventory: 1,189
- Applicable passed: 722
- Applicable failed: 0
- Applicable upstream ignored: 1
- Explicitly non-applicable: 466
- Unclassified: 0

The complete row-level inventory is `upstream-tests-classified.tsv`. Its generated source inventory is `upstream-tests-research.tsv`. The 722 applicable passed cases comprise 705 test cases executed under Node WASI and 17 documentation tests executed by the pinned native Rust toolchain. One additional applicable upstream test remains ignored upstream. The complete direct WASI run recorded 819 passed and three ignored tests across all 822 WASI-inventoried cases. The complete native documentation run recorded 22 passed and two upstream-ignored cases. Per-case results and test-module hashes are committed in `wasi-results.json` and `native-doc-results.json`; validation joins those results to every applicable inventory row instead of trusting summary counters.

The exact test-only portability adaptation is in `test-harness-wasi.patch`. It does not alter production code.

The adaptations classify WASI as slash-based, use a preopened temporary directory, exercise the serial walker selected by the required `--threads 1` runtime argument, and ignore the hostname test because WASI Preview 1 has no hostname API.

## Harness exclusions

- The cross-platform union contains 332 root CLI integration tests. Their harness spawns subprocesses and exercises the general-purpose CLI surface, so they are explicitly outside the fixed Friendly invocation rather than counted as unit tests. All host-applicable cases passed unchanged in the native suite. Nine product runtime behavior cases execute the shipped module during every validation and cover native JSON output, Unicode, ignores, hidden files, Git metadata exclusion, glob filters, type filters, file listing, path confinement, and deterministic ordering. The non-ASCII ignored-path behavior from upstream regression `r131` is included.
- The `test_path_should_be_under_root` should-panic case is explicitly non-applicable to the WASI test harness because `wasm32-wasip1` uses aborting panics and cannot prove a successful unwind. Path rejection is covered by the product runtime and wrapper tests; this row is not counted as passed.
- The optional PCRE2 workspace crate requires a C sysroot and is not linked into the production module. The runtime reports `features:-pcre2`, and Friendly Adversary does not claim PCRE2 support.
- The parallel walker is unsupported by WASI Preview 1. Friendly Adversary always supplies `--threads 1`, rejects caller-supplied thread flags, and never retries with another implementation.

Exit-code behavior is executed during every validation for match `0`, no match `1`, and invalid expression `2`. The read-only fixture must retain identical hashes before and after the product runtime cases.
