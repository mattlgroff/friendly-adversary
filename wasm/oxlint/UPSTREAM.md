# Oxlint WebAssembly provenance

- Project: Oxc / Oxlint
- Repository: `https://github.com/oxc-project/oxc.git`
- Immutable tag: `oxlint_v1.76.0`
- Commit: `65fe65d8429e1d1bdf86c517ff08bd119ee87660`
- Oxlint version: `1.76.0`
- Oxc crate version: `0.142.0`
- Upstream license: MIT, preserved in `LICENSE-OXC-MIT.txt`
- Dependency notices: `third-party/oxlint-wasm/NOTICE.md` and its adjacent `licenses/` tree
- Adapted anti-slop rules: `dmmulroy/anti-slop` commit `9b80d9a5c317d3af94d88a577bdbde4d9a45f7be`, MIT license and notice in `third-party/anti-slop/`
- WebAssembly ABI: `2`
- Artifact SHA-256: `8893c7e1a230eea648ca646a578afbd62c1712f9f8d36a4ab2e8589c73b6a5bb`
- Initial WebAssembly memory: 32 MiB
- Maximum WebAssembly memory: 4 GiB
- Reproducible builder: Rust `1.97.1` Linux ARM64 image `rust@sha256:14bc9c5966e7b3a385794b3d5389a8765668342025fbcc7b2e3d2866ac4bd8c3`

`engine.wasm` is compiled from the build-only crate in `build/oxlint-wasm`. The Cargo lockfile pins the complete build dependency graph. The shipped runtime contains only TypeScript-compiled JavaScript and this WebAssembly module. It contains no native binding, executable, installer, downloader, or native fallback path.

The engine exposes 847 pinned upstream Oxlint rules plus 15 Rust/OXC adaptations of anti-slop rules. The imported anti-slop corpus contains 80 upstream valid cases, 91 upstream invalid cases, and six upstream README violations. Product tests also cover a non-finding example for each README-only rule. Friendly Adversary preserves the `anti-slop(...)` diagnostic namespace and treats these diagnostics as review evidence for the dedicated anti-slop lens, not as automatically adjudicated findings.

Run `npm run check:oxlint-wasm-build` to rebuild the artifact in the pinned Linux ARM64 container and require an exact digest match. This build-only command requires Docker and network access for an uncached image, Rust target, or Cargo dependency. The application runtime does not require Docker, Rust, Cargo, a native analyzer, or network access. Linux ARM64 is pinned because Rust `1.97.1` produced different WebAssembly code generation on Linux x64. The resulting checked artifact is one platform-neutral WebAssembly module used unchanged on Windows, macOS, and Linux.

Run `npm run licenses:oxlint-wasm` to regenerate the dependency notice tree from Cargo's locked, offline metadata. That maintainer-only command requires Rust `1.97.1`, a populated Cargo source cache, and optionally accepts an exact Cargo executable through the `CARGO` environment variable.
