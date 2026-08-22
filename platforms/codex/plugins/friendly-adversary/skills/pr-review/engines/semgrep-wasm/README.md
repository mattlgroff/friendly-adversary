# Semgrep CE WebAssembly engine

This directory is the build and compliance boundary for the Friendly Adversary Semgrep engine. Runtime and offline packaging have been verified on native Windows 11, WSL2 Ubuntu, and Apple silicon macOS. The public combined distribution uses GPL-3.0-only and keeps every third-party license and notice. Every GitHub release that distributes the runtime attaches its complete Corresponding Source archive.

## Exact upstream pin

The only accepted Semgrep source is tag `v1.172.0` at commit `651f37efa397bf066e1cf627414eeabe40b07e27`. The exact parser and tree-sitter support commits are recorded in `upstream-lock.json`.

Run the source gate before applying Friendly Adversary portability changes:

```bash
npm run semgrep:verify-source -- --source /absolute/path/to/semgrep-source
```

The gate rejects a different main commit, a moved tag, a missing or mismatched required submodule, an incorrect upstream license, a dirty checkout, and an initialized Semgrep community rules submodule.

## v1 product subset

The intended v1 surface is limited to the behavior used by the product-owned rules in `rules/semgrep/`:

- Target languages: JavaScript, JSX, TypeScript, TSX, and Python.
- Rule documents with `rules`, `id`, `message`, `severity`, and `languages`.
- Search-mode composition with `pattern-either`, `patterns`, `pattern-inside`, `metavariable-pattern`, and `pattern-not`.
- Syntax-aware call, constructor, literal, metavariable, and ellipsis matching needed by the four owned rules.
- Semgrep-compatible source locations and JSON for that supported surface.

Taint mode, interfile analysis, supply-chain analysis, autofix, remote configuration, registry rules, and arbitrary Semgrep rule features are not enabled by Friendly Adversary v1. Unsupported features must fail rule validation. They must never be approximated with regular expressions or silently ignored.

## Upstream architecture evidence

The pinned upstream tree does not contain a maintained WebAssembly distribution target.

- `libs/lwt_platform/dune` says the `js_of_ocaml` distribution was killed and retains only the Unix implementation.
- `flake.nix` carries a `semgrep-js` marker that says a newer Emscripten toolchain and a special WASM pass are needed.
- Upstream commit `b04f3e74141c8841c57bdbbdf8c4e01ca121d8e7` removed the OSS `js/` engine, parser packages, tests, and build workflow.
- Upstream commit `f175a031606311b98beec65433b6b3de902d8774` removed the remaining JavaScript portability implementations.
- The parent of the 2024 removal documents the former design in `js/README.md`: OCaml core compiled to JavaScript, with tree-sitter, YAML, PCRE, and PCRE2 compiled to WebAssembly.

Friendly Adversary must therefore carry conspicuous LGPL-licensed portability modifications or establish another reproducible upstream-derived build. A standalone regular-expression matcher is not an acceptable fallback.

## Production gates

All gates fail closed until their artifacts exist and validate:

1. Source and license: exact upstream and submodule pins, full corresponding source, upstream notices, modification notices, complete third-party inventory, relinkable LGPL form, and no bundled community rules.
2. Reproducible build: documented build-only compiler inputs and deterministic TypeScript, JavaScript, and WebAssembly outputs.
3. Conformance: denominator-preserving discovery and classification with zero unclassified cases and no enabled behavior below 100 percent pass or adapted-pass.
4. Runtime security: preopened repository paths only, no network, no inherited secrets, no project code execution, traversal and symlink rejection, deterministic ordering, cancellation, timeout, and bounded memory.
5. Packaging: one Node 22 package for Windows, macOS, and Linux, with no native executable, native binding, Python, OCaml runtime, container, downloader, or fallback path.
6. Integration: identical engine and owned rules in the Codex and Claude Code plugin packages, with byte-for-byte preservation of deterministic JSON.
7. Evidence: offline installed-package tests on all three operating systems plus public conformance, runtime, memory-bound, and determinism evidence.

Compiling a sample or passing a partial test suite does not satisfy these gates.

## Current gate status, 2026-08-09

| Gate | Evidence | Status |
| --- | --- | --- |
| Source pin | `semgrep:verify-source`, exact main and four submodule commits, community rules prohibited | Pass |
| License inventory | 104 linked OPAM packages with 104 notices, direct runtime notices, an explicit compatible-license allowlist, and exact generated-parser provenance | Pass for public GPL-3.0-only distribution; upstream parser roots remain `NOASSERTION` |
| Corresponding source | `package-semgrep-corresponding-source.sh` assembles the modified tree, submodules, external archives, linked OPAM sources, patches, build scripts, and notices | Published with the GitHub release |
| Reproducible build | Two independent absolute source paths reproduced all six `runtime-manifest.json` hashes using the release profile | Pass on macOS |
| Conformance | 439 discovered, 439 classified, 439 adapted-pass, zero failures, zero unclassified | Pass for the upstream single-pattern corpus |
| Runtime security | Node filesystem permission boundary, explicit target validation, per-target scans with parser replacement after errors, fail-closed coverage accounting, network guard, secret stripping, no project binary execution, deterministic JSON, timeout and output limits, 8 GiB V8 and 256 MiB per-WASM caps | Pass on native Windows, WSL2 Ubuntu, and macOS for the tested boundary |
| Packaging | Offline tarball install and real TypeScript/Python scans under paths containing spaces where applicable, no native artifacts, no fallback, no community rules | Pass on native Windows, WSL2 Ubuntu, and macOS |
| Integration | Canonical engine, source materials, notices, rules, and runtime copied byte-for-byte into Codex and Claude Code packages | Pass locally |
| Product dogfood | Private application-specific evidence is retained outside the public repository. Public release claims rely on the conformance, fixture, and cross-platform test evidence in this repository. | Pass for the documented public evidence boundary |
| Publication boundary | `package.json` is private because npm is not a distribution target, `prepublishOnly` fails unconditionally, and `verify:public-release` checks every package and plugin manifest | Pass for GitHub distribution |

## Exact build environment

The build script expects the exact versions in `upstream-lock.json` to already be active, including the pinned OPAM switch and Emscripten. It fails closed on any version mismatch. Run from a disposable pristine source tree and a nonexistent output path:

```bash
npm run semgrep:verify-source -- --source /absolute/pristine/semgrep
bash scripts/build-semgrep-wasm.sh /absolute/pristine/semgrep /absolute/new-output
```

The build downloads only the two checksummed C source archives recorded in the lock. Runtime scanning never downloads and does not use Python, OCaml, a container, a native binding, or a native executable.
