# ripgrep 15.2.0 WebAssembly licensing and distribution audit

Date: 2026-08-09

Scope: the default-feature `rg` binary compiled for `wasm32-wasip1` from the exact upstream ripgrep 15.2.0 tag. This is an engineering inventory of upstream evidence, not legal advice.

## Result

The audited ripgrep WebAssembly dependency closure is permissively licensed. The target-specific normal and build graph contains 33 Cargo packages, including ripgrep itself. It contains no GPL, LGPL, MPL, `NOASSERTION`, or missing-license package. There are no Cargo build-dependency packages in this build. The statically linked Rust and WASI sysroot components are separately inventoried in `sysroot-components.tsv` because Cargo does not report them.

The only mandatory conjunctive dependency is `encoding_rs 0.8.35`, whose expression is `(Apache-2.0 OR MIT) AND BSD-3-Clause`. Select MIT for the first branch and preserve its `LICENSE-WHATWG` BSD-3-Clause notice in every binary distribution. The complete package inventory is in `runtime-dependencies.tsv`.

The Rust standard library and WASI SDK 33.0+m sysroot are statically linked into the WebAssembly artifact but are not represented by `Cargo.lock`. Preserve the exact Rust 1.97.1 notices, WASI SDK license, wasi-libc notices, and LLVM libunwind license alongside the artifact.

This component introduces no source-offer requirement. MIT, BSD-3-Clause, Unlicense, and the other selected permissive terms require notice retention, not a corresponding-source offer. Any GPL source obligation for a future public Friendly Adversary distribution comes from Friendly Adversary's own distribution terms and other bundled engines, not from this ripgrep closure.

## Exact upstream identity

- Project: <https://github.com/BurntSushi/ripgrep>
- Official release: <https://github.com/BurntSushi/ripgrep/releases/tag/15.2.0>
- Signed tag object: `6ec72defacfb042f203ca0b4bf2513a0a5505a7e`
- Commit: `e89fff89ac9af12e8d4ce9d5fd07beb408ca730f`
- Git tree: `c743701524f65f036cf174d6551918be7dfc0d40`
- Upstream manifest: <https://github.com/BurntSushi/ripgrep/blob/e89fff89ac9af12e8d4ce9d5fd07beb408ca730f/Cargo.toml>
- Locked dependency metadata: <https://github.com/BurntSushi/ripgrep/blob/e89fff89ac9af12e8d4ce9d5fd07beb408ca730f/Cargo.lock>
- Root licensing statement: <https://github.com/BurntSushi/ripgrep/blob/e89fff89ac9af12e8d4ce9d5fd07beb408ca730f/COPYING>
- MIT text: <https://github.com/BurntSushi/ripgrep/blob/e89fff89ac9af12e8d4ce9d5fd07beb408ca730f/LICENSE-MIT>
- Unlicense text: <https://github.com/BurntSushi/ripgrep/blob/e89fff89ac9af12e8d4ce9d5fd07beb408ca730f/UNLICENSE>
- Upstream licensing explanation: <https://github.com/BurntSushi/ripgrep/blob/e89fff89ac9af12e8d4ce9d5fd07beb408ca730f/FAQ.md#how-is-ripgrep-licensed>

The tag was published on 2026-07-15 and GitHub identifies 15.2.0 as the latest release at the time of this audit.

## Build identity and artifact

- Rust: `rustc 1.97.1 (8bab26f4f 2026-07-14)`
- Rust commit: `8bab26f4f68e0e26f0bb7960be334d5b520ea452`
- Host toolchain: `aarch64-apple-darwin`
- Target: `wasm32-wasip1`
- Cargo features: default, with PCRE2 disabled
- Artifact: `runtime/rg.wasm`
- Artifact bytes: `2990679`
- Artifact SHA-256: `cb7a661e78f55ea0e82567867fc7ad5f09e3b352e3424eecd8fed8ebe1e37416`
- Build profile: `release-lto`
- Independent rebuild: byte-identical
- Runtime version output: `ripgrep 15.2.0 (rev e89fff89ac)`, `features:-pcre2`

The clean artifact was built at 2026-08-09T21:22:43-0400, before later test-only working-tree edits. The pinned source and build recipe are recorded in this directory without relying on the original local build path.

## Target-specific Cargo closure

The 33-package target-specific graph groups as follows:

| Upstream expression | Selected term | Packages |
| --- | --- | --- |
| `Unlicense OR MIT` or legacy `Unlicense/MIT` | MIT | ripgrep, globset, grep, grep-cli, grep-matcher, grep-printer, grep-regex, grep-searcher, ignore, aho-corasick, memchr, same-file, termcolor, walkdir |
| `MIT OR Apache-2.0` | MIT | anyhow, bstr, cfg-if, crossbeam-deque, crossbeam-epoch, crossbeam-utils, encoding_rs_io, itoa, log, memmap2, regex-automata, regex-syntax, serde, serde_core, serde_json |
| `MIT` | MIT | lexopt, textwrap, zmij |
| `(Apache-2.0 OR MIT) AND BSD-3-Clause` | `MIT AND BSD-3-Clause` | encoding_rs |

`same-file` and `walkdir` use the old Cargo string `Unlicense/MIT`, which is not current SPDX syntax. This is not an unresolved license in the pinned packages: both contain `COPYING`, `UNLICENSE`, and `LICENSE-MIT`, and `COPYING` explicitly says the project is dual licensed. Record the normalized expression as `Unlicense OR MIT` while preserving the upstream text verbatim.

PCRE2 crates, `cc`, proc-macro packages, and development-only packages can appear in unfiltered workspace metadata. They are not in the default `wasm32-wasip1` normal/build graph and are not part of the audited artifact. Enabling `pcre2`, changing the target, or changing default features requires a new closure and notice audit.

## Rust standard library and WASI material

The WebAssembly binary statically links target libraries from Rust 1.97.1. Cargo metadata does not inventory sysroot crates. The installed release provides `share/doc/rust/COPYRIGHT-library.html`, which states that the Rust standard library is principally `Apache-2.0 OR MIT` and includes the release's in-tree and out-of-tree notices, including Unicode and WASI material.

That generated notice covers the entire Rust standard-library release across targets, not only the code retained in this WASI binary. It therefore names target-specific material such as the MPL-2.0 Fortanix SGX ABI that is not linked into `wasm32-wasip1`. Preserve the complete release notice, but do not misclassify every entry in it as an artifact dependency.

Preserve these exact files:

- Rust MIT text: <https://github.com/rust-lang/rust/blob/8bab26f4f68e0e26f0bb7960be334d5b520ea452/LICENSE-MIT>
- Rust Apache 2.0 text: <https://github.com/rust-lang/rust/blob/8bab26f4f68e0e26f0bb7960be334d5b520ea452/LICENSE-APACHE>
- The installed Rust 1.97.1 `COPYRIGHT-library.html`, SHA-256 `0a65bb747c49c7bb816cbc7188319bd6e4e8d08091c1190b8a3c0971c47968ed`

The Rust license text hashes at this commit are:

- `LICENSE-MIT`: `b71bd43a069ca0641a9ecfe585ca7b3c53b5cc1608f8b68321168698e28b5ea1`
- `LICENSE-APACHE`: `62c7a1e35f56406896d7aa7ca52d0cc0d272ac022b5d2796e7d6905db8a3636a`

The Rust target also ships self-contained C runtime and unwind archives. Object debug paths identify `wasi-sdk 33.0+m` and LLVM commit `4434dabb69916856b824f68a64b029c67175e532`. Official WASI SDK tag 33 resolves to commit `c10c0507deb3e5aad506f1f9f32084e49a21834b`; its submodules pin the same LLVM commit and wasi-libc commit `161b3195fc2558d2b1ba3eb9ffae3b2b47407623`.

The official `wasi-sysroot-33.0+m.tar.gz`, SHA-256 `063bc1b56582b9923e08ac9b89e58789618d851763f01530b3ff20b9e5df0ca3`, is byte-identical to the Rust 1.97.1 target material used here:

| File | SHA-256 | Official sysroot comparison |
| --- | --- | --- |
| `libc.a` | `5d8ba34d8c6fd0ac59e0efe37241143887f8f232864bbeacc4181ae739f63371` | identical |
| `crt1-command.o` | `d97a7840560d165783422a81fb2620d6dc821ac58b74f0da20dc1a9465788ea5` | identical |
| `crt1-reactor.o` | `c0ce69c600d2bf8cd170da94e95e1755236541d596b3471e15a798f24afebe25` | identical |
| `libunwind.a` | `6351f2983b7dd2972eceb538ac2acbe23894e31799f0ac286930e4f20a4ca647` | identical |

Official source evidence:

- WASI SDK 33 release: <https://github.com/WebAssembly/wasi-sdk/releases/tag/wasi-sdk-33>
- WASI SDK commit: <https://github.com/WebAssembly/wasi-sdk/tree/c10c0507deb3e5aad506f1f9f32084e49a21834b>
- wasi-libc commit: <https://github.com/WebAssembly/wasi-libc/tree/161b3195fc2558d2b1ba3eb9ffae3b2b47407623>
- LLVM libunwind commit: <https://github.com/llvm/llvm-project/tree/4434dabb69916856b824f68a64b029c67175e532/libunwind>

WASI SDK and LLVM libunwind use Apache 2.0 with the LLVM exception. wasi-libc is offered under Apache 2.0 with LLVM exception, Apache 2.0, or MIT, with retained original terms for derived material: dlmalloc CC0, Cloudlibc BSD-2-Clause, musl MIT, and musl-fts BSD-3-Clause. All exact texts and attribution files are present under `licenses/`. No incompatible sysroot component was found.

If a Rust or Cargo executable or complete toolchain is itself distributed, audit and ship the toolchain notices separately. This audit covers the statically linked standard-library material in the WebAssembly artifact, not redistribution of the build tools.

## Required distribution materials

For the ripgrep component, include:

1. ripgrep `COPYING`, `LICENSE-MIT`, and `UNLICENSE`.
2. An exact per-package inventory with original expressions and the compatible license choice. `runtime-dependencies.tsv` is the audited inventory.
3. The original license files for every registry package in the runtime closure. Do not replace attribution-bearing MIT files with one generic MIT text.
4. `encoding_rs-0.8.35/LICENSE-WHATWG` in addition to its MIT text.
5. Rust 1.97.1 `COPYRIGHT-library.html`, `LICENSE-MIT`, and `LICENSE-APACHE`.
6. WASI SDK 33.0+m, wasi-libc, LLVM libunwind, dlmalloc, Cloudlibc, musl, and musl-fts notices from the audited `licenses/` bundle.
7. The artifact, upstream source, lockfile, build identity, target sysroot identity, and SHA-256 manifest.
8. A `MODIFICATIONS.md` and patch file if the shipped artifact or conformance source differs from tag 15.2.0. MIT does not require a change log, but recording modifications prevents provenance ambiguity and matches Friendly Adversary's existing evidence conventions.

No package in this exact closure contains an upstream `NOTICE` file. Preserve any notices added by a later version.

## Recommended Friendly Adversary placement

Use the existing engine and third-party evidence conventions:

```text
engines/ripgrep-wasm/
  runtime/rg.wasm
  runtime-manifest.json
  upstream-lock.json
  source/ripgrep-15.2.0-source.tar.gz
  source/Cargo.lock
  source/MODIFICATIONS.md
  source/patches/
  evidence/checksums.sha256
  conformance/

third-party/ripgrep-wasm/
  NOTICE.md
  runtime-dependencies.tsv
  licenses/ripgrep-15.2.0/{COPYING,LICENSE-MIT,UNLICENSE}
  licenses/<crate>-<version>/<upstream-license-files>
  licenses/rust-1.97.1/{COPYRIGHT-library.html,LICENSE-MIT,LICENSE-APACHE}
  licenses/wasi-sdk-33.0+m/
  licenses/wasi-libc-161b3195fc2558d2b1ba3eb9ffae3b2b47407623/
  licenses/llvm-4434dabb69916856b824f68a64b029c67175e532/
```

The root `LICENSING.md` should name this directory and say that ripgrep and its dependencies retain their original terms. Do not describe the ripgrep code itself as relicensed under GPL-3.0-only.

`runtime-manifest.json` or an equivalent Markdown manifest should record the tag object, commit, tree, Rust version and commit, target, profile, feature set, artifact size and hash, source archive hash, Cargo.lock hash, and the third-party notice inventory hash.

## Hashes

| Material | SHA-256 |
| --- | --- |
| Clean optimized `runtime/rg.wasm` | `cb7a661e78f55ea0e82567867fc7ad5f09e3b352e3424eecd8fed8ebe1e37416` |
| Deterministic pristine source archive | `1bbc690deaac5b5d68168574b0ced021dc2cdf65db436329fc20a9aae36d8406` |
| Upstream `Cargo.lock` | `7a7d39cda8a03930e578f1dbb724e055771901842eca239e03b01e19da946a64` |
| Upstream `Cargo.toml` | `c7918574de41825502c6e6e923cd26c88e3f5a07bf42106406af8f5277c939ab` |
| ripgrep `COPYING` | `01c266bced4a434da0051174d6bee16a4c82cf634e2679b6155d40d75012390f` |
| ripgrep `LICENSE-MIT` | `0f96a83840e146e43c0ec96a22ec1f392e0680e6c1226e6f3ba87e0740af850f` |
| ripgrep `UNLICENSE` | `7e12e5df4bae12cb21581ba157ced20e1986a0508dd10d0e8a4ab9a4cf94e85c` |
| Rust 1.97.1 standard-library notices | `0a65bb747c49c7bb816cbc7188319bd6e4e8d08091c1190b8a3c0971c47968ed` |
| WASI SDK 33.0+m sysroot archive | `063bc1b56582b9923e08ac9b89e58789618d851763f01530b3ff20b9e5df0ca3` |
| Deterministic WASI SDK 33 source archive without submodules | `0dc0720037db69c9e946f4d8f164fd00acbc1c7c56aea6841a07136a83078396` |
| Deterministic wasi-libc source archive | `7ec13e62d1b5fa01144dc52825daad0783827f762c589f80adf894cd971ec041` |
| Complete audited license-file manifest | `b1def776dbe99e9a20108641575e3a83627e48c998e1e92e96bd2385197c4498` |

The source archive in this directory is a deterministic `git archive` of pristine tag 15.2.0. It contains the ripgrep workspace and `Cargo.lock`, but not crates.io package source tarballs or the Rust toolchain. It is sufficient as exact upstream source evidence, not as a complete offline build bundle.

The directory also contains deterministic wasi-libc and WASI SDK source archives. The WASI SDK archive records the superproject but cannot contain Git submodule trees; `sysroot-components.tsv` records the exact wasi-libc and LLVM submodule commits. The official 33.0+m sysroot release archive is retained as byte-level provenance for the C runtime actually shipped by Rust 1.97.1.

`licenses/` contains the 71 exact notice and attribution files identified by this audit. `licenses.sha256`, SHA-256 `b1def776dbe99e9a20108641575e3a83627e48c998e1e92e96bd2385197c4498`, fingerprints every file using its intended repository-relative path.

## Reproduction and audit commands

```bash
git clone --branch 15.2.0 --depth 1 https://github.com/BurntSushi/ripgrep.git
cd ripgrep
test "$(git rev-parse HEAD)" = e89fff89ac9af12e8d4ce9d5fd07beb408ca730f
test "$(git rev-parse 'HEAD^{tree}')" = c743701524f65f036cf174d6551918be7dfc0d40

rustc -vV
cargo tree \
  --manifest-path Cargo.toml \
  --target wasm32-wasip1 \
  --edges normal,build \
  --locked \
  -p ripgrep

cargo metadata \
  --manifest-path Cargo.toml \
  --locked \
  --filter-platform wasm32-wasip1 \
  --format-version 1

cargo build \
  --manifest-path Cargo.toml \
  --profile release-lto \
  --locked \
  --target wasm32-wasip1 \
  --bin rg

git archive --format=tar --prefix=ripgrep-15.2.0/ 15.2.0 \
  | gzip -n > ripgrep-15.2.0-source.tar.gz

shasum -a 256 \
  target/wasm32-wasip1/release/rg.wasm \
  ripgrep-15.2.0-source.tar.gz \
  Cargo.lock Cargo.toml COPYING LICENSE-MIT UNLICENSE

curl -fL \
  'https://github.com/WebAssembly/wasi-sdk/releases/download/wasi-sdk-33/wasi-sysroot-33.0%2Bm.tar.gz' \
  -o wasi-sysroot-33.0+m.tar.gz
test "$(shasum -a 256 wasi-sysroot-33.0+m.tar.gz | cut -d' ' -f1)" = \
  063bc1b56582b9923e08ac9b89e58789618d851763f01530b3ff20b9e5df0ca3

tar -xzf wasi-sysroot-33.0+m.tar.gz \
  wasi-sysroot-33.0+m/lib/wasm32-wasip1/libc.a \
  wasi-sysroot-33.0+m/lib/wasm32-wasip1/crt1-command.o \
  wasi-sysroot-33.0+m/lib/wasm32-wasip1/crt1-reactor.o \
  wasi-sysroot-33.0+m/lib/wasm32-wasip1/eh/libunwind.a

RUST_SYSROOT="$(rustc --print sysroot)"
cmp wasi-sysroot-33.0+m/lib/wasm32-wasip1/libc.a \
  "$RUST_SYSROOT/lib/rustlib/wasm32-wasip1/lib/self-contained/libc.a"
cmp wasi-sysroot-33.0+m/lib/wasm32-wasip1/eh/libunwind.a \
  "$RUST_SYSROOT/lib/rustlib/wasm32-wasip1/lib/self-contained/libunwind.a"
```

`cargo metadata` includes packages that are not in the selected binary graph. Use the target-specific `cargo tree --edges normal,build` result as the runtime/build denominator, then map those package identities to metadata and `Cargo.lock` checksums.

## Open issues and release boundary

- No ripgrep dependency is incompatible or license-ambiguous in this pinned default build.
- `encoding_rs` requires its BSD-3-Clause notice in addition to MIT.
- Rust standard-library notices must not be omitted merely because they are absent from Cargo metadata.
- Any future PCRE2-enabled build, feature change, target change, Rust toolchain change, or ripgrep upgrade requires a fresh locked-graph audit.
- The current shared WASI test checkout acquired test-only `cfg(target_os = "wasi")` edits after the pristine artifact was built. If those edits are kept in distributed source or used for a later artifact, record and hash a patch. The clean checkout and pristine source archive identified above are unaffected.
- This audit clears only the ripgrep component. Friendly Adversary's broader private/public release boundary still depends on its Semgrep source offer and all other engine evidence.
