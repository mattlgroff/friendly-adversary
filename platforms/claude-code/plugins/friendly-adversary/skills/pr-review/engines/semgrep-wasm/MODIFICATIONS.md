# Semgrep modification notices

Semgrep Community Edition is licensed under LGPL-2.1-only. The upstream-derived portability source, compiled engine, and compiled parser bundles in this directory remain subject to their applicable upstream licenses. Friendly Adversary's original work and the combined public distribution are GPL-3.0-only. Third-party components retain their own licenses, exceptions, copyrights, and notices.

## 2026-08-08 portability build

- Pinned source: `semgrep/semgrep@651f37efa397bf066e1cf627414eeabe40b07e27`, tag `v1.172.0`.
- Main patch: `source/patches/semgrep-1.172.0-wasm-port.patch`, SHA-256 `acf4b3bf3781fc7e00b3a9f68743c466a333525bf0f7da150c2c8d4df04f186e`.
- Tree-sitter binding patch: `source/patches/ocaml-tree-sitter-core-wasm-port.patch`, SHA-256 `380868aa5cbb37797e3caa57fc2426269afbb4e6b6379d944a4b9ae7743ce02d`.
- Historical source basis: the last OSS JavaScript tree before upstream removal commit `b04f3e74141c8841c57bdbbdf8c4e01ca121d8e7`, plus the portability implementations removed by `f175a031606311b98beec65433b6b3de902d8774`.

Functional changes:

- Restores the removed js_of_ocaml engine and tree-sitter parser build for JavaScript, JSX, TypeScript, TSX, and Python only.
- Restores the Emscripten YAML, PCRE2, and tree-sitter bridge used by that build.
- Adds JavaScript portability implementations for file access, telemetry, tracing, metrics, process limits, parsing entry points, and other core dependencies that otherwise require native Unix facilities.
- Requires an explicit parser WebAssembly path. This removes the bundled `cross-dirname` runtime and fixes parser loading when the installation path contains spaces.
- Builds js_of_ocaml with Dune's `release` profile and no source maps so output bytes do not depend on the absolute source path.
- Caps each Emscripten WebAssembly memory at 256 MiB. The Friendly Adversary Node child caps the V8 old-space heap at 8 GiB and loads only the parsers required by the selected targets.
- Scans one target per engine call and replaces the engine and parser after any reported scan error so a failed target cannot contaminate later targets.

Interface and semantic impact:

- There is no public Semgrep CLI compatibility claim. Friendly Adversary exposes one internal `scan --metrics=off --config BUNDLED_RULES --json -- TARGETS` surface.
- Remote configuration, metrics, registry rules, supply-chain analysis, interfile analysis, autofix, taint mode, and arbitrary external rules are unavailable.
- The selected parsing and search-mode matching path is upstream Semgrep logic. It is not a regular-expression approximation.
- Recoverable malformed syntax follows the pinned parser's recovery behavior and can produce a successful empty finding set rather than a parse diagnostic.
- Any reported scan error or target missing from `paths.scanned` makes the Friendly Adversary review incomplete while preserving the emitted JSON artifact.
- Nondeterministic timing and explanation fields are rejected and removed from the product output contract.

Verification coverage:

- `conformance/scoreboard.json` discovers and classifies all 439 pinned upstream single-pattern JavaScript, TypeScript, and Python cases, with 439 adapted passes and zero failures or unclassified cases.
- Product tests cover JavaScript, JSX, TypeScript, TSX, Python, rule composition, exact Unicode and CRLF locations, malformed input, traversal, symbolic links, unsupported extensions, ignore-file behavior, cancellation, inherited-secret removal, network denial, and deterministic target ordering.
- `scripts/smoke-pack.mjs` installs the npm tarball offline under a path containing a space and executes the bundled scanner for TypeScript and Python.
- `scripts/build-semgrep-wasm.sh` reproduced the six committed artifacts from a separate pristine source copy on 2026-08-08. Artifact hashes are in `runtime-manifest.json`.

The complete modified source and linked dependency sources can be assembled with `scripts/package-semgrep-corresponding-source.sh`. Exact generated-parser provenance is in `source/generated-parser-license-evidence.json`. Public distribution is cleared under the conservative GPL-3.0-only combined-distribution decision when the exact corresponding-source archive and notices accompany the release.
