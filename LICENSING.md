# Friendly Adversary licensing

Copyright 2026 Matthew Groff.

Friendly Adversary's original code, documentation, product-owned rules, and the combined distribution are licensed under GPL-3.0-only. The complete license text is in `LICENSE`.

Third-party components retain their own copyrights, licenses, exceptions, and notices. They are not relicensed by this project. Their exact notices are stored next to the relevant component:

- Oxlint-compatible WebAssembly engine: `third-party/oxlint-wasm/`
- Ruff WebAssembly engine: `engines/ruff-wasm/`
- ripgrep WebAssembly engine: `engines/ripgrep-wasm/`
- Semgrep WebAssembly engine: `engines/semgrep-wasm/`
- Bundled Model Context Protocol server runtime and Zod: `third-party/mcp-runtime/`
- anti-slop rule adaptation: `third-party/anti-slop/`
- Cursor Team Kit review-prompt adaptation: `third-party/cursor-team-kit/`

The combined package uses GPL-3.0-only as its conservative distribution license because it embeds a Semgrep-derived WebAssembly engine and generated parser material. Semgrep Community Edition remains LGPL-2.1-only. Permissively licensed components retain their original terms. The generated parser classification and exact pinned provenance are recorded in `engines/semgrep-wasm/source/generated-parser-license-evidence.json`.

## Distribution boundary

The source repository and GitHub release archives are distributed under GPL-3.0-only. Every GitHub release that distributes the Semgrep-derived runtime must attach the exact complete Corresponding Source archive named in `engines/semgrep-wasm/evidence/corresponding-source.json`. The archive includes the modified Semgrep source, required submodules, generated-parser provenance, linked dependency sources, build scripts, patches, licenses, and notices.

The npm tarball is only a local installation and package-integrity artifact. It is not an npm registry release. `package.json` sets `private: true`, `prepublishOnly` fails unconditionally, and `npm run verify:public-release` checks the license and GitHub release boundary.

Every distributed artifact must preserve:

1. Exact license selection for the full linked dependency closure.
2. Blob-level generated-parser provenance.
3. Complete, reproducible Corresponding Source for the exact binary.
4. License notices and equivalent source access on every distribution surface.

Forks and modified distributions must comply with GPL-3.0-only and all retained third-party terms. If a modified distribution includes the Semgrep-derived runtime, it must provide corresponding source for that exact runtime, including any modifications.

This document is engineering compliance evidence, not legal advice.
