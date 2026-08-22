# ripgrep WebAssembly third-party licensing

The production module contains ripgrep 15.2.0, its normal Cargo dependency closure, and the Rust 1.97.1 standard library linked for `wasm32-wasip1`. It contains no PCRE2 code.

Friendly Adversary selects the MIT alternative for packages offering MIT or another license. `encoding_rs` also requires its BSD-3-Clause WHATWG notice. Exact upstream license and copyright files are preserved under `licenses/<package-version>/`. Rust, WASI SDK, wasi-libc, and LLVM libunwind notices are preserved in the same directory. The exact inventory is `conformance/runtime-dependencies.tsv` and `conformance/sysroot-components.tsv`; `conformance/licenses.sha256` authenticates all 71 notice files.

| Package | Version | Upstream expression | Selected terms |
| --- | ---: | --- | --- |
| aho-corasick | 1.1.4 | Unlicense OR MIT | MIT |
| anyhow | 1.0.103 | MIT OR Apache-2.0 | MIT |
| bstr | 1.13.0 | MIT OR Apache-2.0 | MIT |
| cfg-if | 1.0.4 | MIT OR Apache-2.0 | MIT |
| crossbeam-deque | 0.8.7 | MIT OR Apache-2.0 | MIT |
| crossbeam-epoch | 0.9.20 | MIT OR Apache-2.0 | MIT |
| crossbeam-utils | 0.8.22 | MIT OR Apache-2.0 | MIT |
| encoding_rs | 0.8.35 | (Apache-2.0 OR MIT) AND BSD-3-Clause | MIT AND BSD-3-Clause |
| encoding_rs_io | 0.1.7 | MIT OR Apache-2.0 | MIT |
| globset | 0.4.19 | Unlicense OR MIT | MIT |
| grep | 0.4.1 | Unlicense OR MIT | MIT |
| grep-cli | 0.1.12 | Unlicense OR MIT | MIT |
| grep-matcher | 0.1.9 | Unlicense OR MIT | MIT |
| grep-printer | 0.3.1 | Unlicense OR MIT | MIT |
| grep-regex | 0.1.14 | Unlicense OR MIT | MIT |
| grep-searcher | 0.1.17 | Unlicense OR MIT | MIT |
| ignore | 0.4.29 | Unlicense OR MIT | MIT |
| itoa | 1.0.18 | MIT OR Apache-2.0 | MIT |
| lexopt | 0.3.2 | MIT | MIT |
| log | 0.4.33 | MIT OR Apache-2.0 | MIT |
| memchr | 2.8.3 | Unlicense OR MIT | MIT |
| memmap2 | 0.9.11 | MIT OR Apache-2.0 | MIT |
| regex-automata | 0.4.15 | MIT OR Apache-2.0 | MIT |
| regex-syntax | 0.8.11 | MIT OR Apache-2.0 | MIT |
| ripgrep | 15.2.0 | Unlicense OR MIT | MIT |
| same-file | 1.0.6 | Unlicense/MIT | MIT |
| serde | 1.0.228 | MIT OR Apache-2.0 | MIT |
| serde_core | 1.0.228 | MIT OR Apache-2.0 | MIT |
| serde_json | 1.0.150 | MIT OR Apache-2.0 | MIT |
| termcolor | 1.4.1 | Unlicense OR MIT | MIT |
| textwrap | 0.16.2 | MIT | MIT |
| walkdir | 2.5.0 | Unlicense/MIT | MIT |
| zmij | 1.0.23 | MIT | MIT |
| Rust standard library | 1.97.1 | MIT OR Apache-2.0 | MIT |

This inventory is engineering compliance information, not legal advice.
