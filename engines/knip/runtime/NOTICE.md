# Knip third-party attribution

Knip 6.34.0 and its dependencies retain their upstream licenses. Friendly
Adversary's GPL-3.0-only license does not replace these terms. The packaged
`manifest.json` identifies the JavaScript packages, their license texts, and
SHA-256 hashes of the distributed files. `licenses/` preserves notices from
the installed npm packages. `notices/` supplements omissions in those archives.

- Knip: ISC, Copyright Lars Kappert. See `licenses/knip@6.34.0-LICENSE`.
- Oxc parser 0.147.0 and resolver 11.24.2: MIT, Copyright VoidZero Inc. &
  Contributors and Boshen. See `notices/npm/` for the original texts.
- NAPI-RS WASM runtime: MIT. Both upstream copyright notices are preserved.
- wasm-util 0.10.3: upstream package metadata declares MIT and names
  toyobayashi as author, but supplies no standalone copyright/license file.
  Its exact declaration and the standard MIT text are included. No copyright
  year has been invented. Node's notices are also included for adapted code.

The Rust inventory in `notices/provenance.json` is a conservative normal and
build dependency graph for the upstream parser and resolver release sources,
using their pinned Cargo lockfiles and the wasm32-wasip1-threads target.
It includes build-only packages, not only linked code. Original notices are
preserved without altering their copyrights. For alternative MIT OR Apache
licenses, this distribution selects MIT; additional conjunctive terms remain
applicable. Apache-2.0 is selected for Apache-2.0 OR GPL-2.0-only and
Apache-2.0 OR BSL-1.0; BSL-1.0 is selected for Apache-2.0 WITH LLVM-exception
OR BSL-1.0. Other permissive licenses retain their own terms.

Toolchain notices are included as a conservative attribution superset. This
is not a claim of a byte-reproducible upstream build or binary-symbol-level
dependency certification. The npm WASM binaries are distributed unchanged;
their exact bytes and npm integrity records are pinned in the runtime manifest
and build lockfile. Upstream source links and notice hashes are recorded in
`notices/provenance.json`.

Friendly Adversary bundles the JavaScript, redirects parser/resolver loading
to WASM, disables raw transfer and persistent Jiti caching, and adapts the Oxc
visitor loader for static bundling. Its source adapters and pinned build
lockfile are in `engines/knip/`; `scripts/build-knip.mjs` regenerates the engine.
`scripts/generate-knip-notices.mjs` regenerates supplemental attribution from
the pinned upstream source directories. These are maintainer build tools,
not runtime downloads or user installation requirements.
