# Oxlint WebAssembly third-party notices

This inventory is generated from the locked normal-dependency closure of `build/oxlint-wasm/Cargo.toml` for `wasm32-wasip1`. Development-only and explicitly build-only edges are excluded. The inventory conservatively retains proc-macro packages reached through normal dependency edges even though those macros execute while compiling rather than at runtime.

The recorded closure contains 164 third-party Rust packages. Exact license and notice files are preserved under `licenses/<package>-<version>/`. SPDX expressions containing `OR` describe upstream alternative licensing choices. Friendly Adversary does not relicense those components.

## GPL-3.0 compatibility selections

Every upstream expression in the locked closure has an explicit GPL-3.0-compatible choice. The original expression and all component notices remain in force.

| Upstream license expression | Selected compatible license |
| --- | --- |
| `(MIT OR Apache-2.0) AND Unicode-3.0` | `MIT AND Unicode-3.0` |
| `0BSD OR MIT OR Apache-2.0` | `MIT` |
| `Apache-2.0` | `Apache-2.0` |
| `Apache-2.0 OR BSL-1.0` | `Apache-2.0` |
| `Apache-2.0 OR GPL-2.0-only` | `Apache-2.0` |
| `Apache-2.0 OR MIT` | `MIT` |
| `Apache-2.0 WITH LLVM-exception OR BSL-1.0` | `Apache-2.0 WITH LLVM-exception` |
| `Apache-2.0/MIT` | `MIT` |
| `MIT` | `MIT` |
| `MIT OR Apache-2.0` | `MIT` |
| `MIT OR Zlib OR Apache-2.0` | `MIT` |
| `MIT/Apache-2.0` | `MIT` |
| `Unicode-3.0` | `Unicode-3.0` |
| `Unlicense OR MIT` | `MIT` |
| `Unlicense/MIT` | `MIT` |
| `Zlib` | `Zlib` |

| Package | Version | Upstream license expression | Source |
| --- | --- | --- | --- |
| adler2 | 2.0.1 | 0BSD OR MIT OR Apache-2.0 | https://github.com/oyvindln/adler2 |
| aho-corasick | 1.1.5 | Unlicense OR MIT | https://github.com/BurntSushi/aho-corasick |
| allocator-api2 | 0.2.21 | MIT OR Apache-2.0 | https://github.com/zakarumych/allocator-api2 |
| arrayvec | 0.7.8 | MIT OR Apache-2.0 | https://github.com/bluss/arrayvec |
| bitflags | 2.13.1 | MIT OR Apache-2.0 | https://github.com/bitflags/bitflags |
| bstr | 1.13.0 | MIT OR Apache-2.0 | https://github.com/BurntSushi/bstr |
| castaway | 0.2.4 | MIT | https://github.com/sagebind/castaway |
| cfg-if | 1.0.4 | MIT OR Apache-2.0 | https://github.com/rust-lang/cfg-if |
| cobs | 0.3.0 | MIT OR Apache-2.0 | https://github.com/jamesmunns/cobs.rs |
| compact_str | 0.10.0 | MIT | https://github.com/ParkMyCar/compact_str |
| compact_str | 0.9.1 | MIT | https://github.com/ParkMyCar/compact_str |
| constcat | 0.6.1 | MIT OR Apache-2.0 | https://github.com/rossmacarthur/constcat |
| convert_case | 0.11.0 | MIT | https://github.com/rutrum/convert-case |
| cow-utils | 0.1.3 | MIT | https://github.com/RReverser/cow-utils-rs |
| crossbeam-deque | 0.8.7 | MIT OR Apache-2.0 | https://github.com/crossbeam-rs/crossbeam |
| crossbeam-epoch | 0.9.20 | MIT OR Apache-2.0 | https://github.com/crossbeam-rs/crossbeam |
| crossbeam-utils | 0.8.22 | MIT OR Apache-2.0 | https://github.com/crossbeam-rs/crossbeam |
| dashmap | 6.2.1 | MIT | https://github.com/xacrimon/dashmap |
| displaydoc | 0.2.7 | MIT OR Apache-2.0 | https://github.com/yaahc/displaydoc |
| dragonbox_ecma | 0.1.12 | Apache-2.0 WITH LLVM-exception OR BSL-1.0 | https://github.com/magic-akari/dragonbox |
| dyn-clone | 1.0.20 | MIT OR Apache-2.0 | https://github.com/dtolnay/dyn-clone |
| either | 1.17.0 | MIT OR Apache-2.0 | https://github.com/rayon-rs/either |
| equivalent | 1.0.2 | Apache-2.0 OR MIT | https://github.com/indexmap-rs/equivalent |
| fast-glob | 1.1.0 | MIT | https://github.com/oxc-project/fast-glob.git |
| fastrand | 2.5.0 | Apache-2.0 OR MIT | https://github.com/smol-rs/fastrand |
| fixedbitset | 0.5.7 | MIT OR Apache-2.0 | https://github.com/petgraph/fixedbitset |
| float-cmp | 0.10.0 | MIT | https://github.com/mikedilger/float-cmp |
| foldhash | 0.1.5 | Zlib | https://github.com/orlp/foldhash |
| foldhash | 0.2.0 | Zlib | https://github.com/orlp/foldhash |
| form_urlencoded | 1.2.2 | MIT OR Apache-2.0 | https://github.com/servo/rust-url |
| globset | 0.4.20 | Unlicense OR MIT | https://github.com/BurntSushi/ripgrep/tree/master/crates/globset |
| halfbrown | 0.4.0 | Apache-2.0/MIT | https://github.com/Licenser/halfbrown |
| hashbrown | 0.14.5 | MIT OR Apache-2.0 | https://github.com/rust-lang/hashbrown |
| hashbrown | 0.15.5 | MIT OR Apache-2.0 | https://github.com/rust-lang/hashbrown |
| hashbrown | 0.16.1 | MIT OR Apache-2.0 | https://github.com/rust-lang/hashbrown |
| hashbrown | 0.17.1 | MIT OR Apache-2.0 | https://github.com/rust-lang/hashbrown |
| icu_collections | 2.2.0 | Unicode-3.0 | https://github.com/unicode-org/icu4x |
| icu_locale_core | 2.2.0 | Unicode-3.0 | https://github.com/unicode-org/icu4x |
| icu_normalizer | 2.2.0 | Unicode-3.0 | https://github.com/unicode-org/icu4x |
| icu_normalizer_data | 2.2.0 | Unicode-3.0 | https://github.com/unicode-org/icu4x |
| icu_properties | 2.2.0 | Unicode-3.0 | https://github.com/unicode-org/icu4x |
| icu_properties_data | 2.2.0 | Unicode-3.0 | https://github.com/unicode-org/icu4x |
| icu_provider | 2.2.0 | Unicode-3.0 | https://github.com/unicode-org/icu4x |
| idna | 1.1.0 | MIT OR Apache-2.0 | https://github.com/servo/rust-url/ |
| idna_adapter | 1.2.2 | Apache-2.0 OR MIT | https://github.com/hsivonen/idna_adapter |
| ignore | 0.4.33 | Unlicense OR MIT | https://github.com/BurntSushi/ripgrep/tree/master/crates/ignore |
| indexmap | 2.14.0 | Apache-2.0 OR MIT | https://github.com/indexmap-rs/indexmap |
| itertools | 0.15.0 | MIT OR Apache-2.0 | https://github.com/rust-itertools/itertools |
| itoa | 1.0.18 | MIT OR Apache-2.0 | https://github.com/dtolnay/itoa |
| javascript-globals | 1.5.1 | MIT | https://github.com/oxc-project/javascript-globals |
| json-strip-comments | 3.1.2 | Apache-2.0 | https://github.com/oxc-project/json-strip-comments |
| language-tags | 0.3.2 | MIT/Apache-2.0 | https://github.com/pyfisch/rust-language-tags |
| lazy-regex | 3.6.1 | MIT | https://github.com/Canop/lazy-regex |
| lazy-regex-proc_macros | 3.6.1 | MIT | https://github.com/Canop/lazy-regex/tree/main/src/proc_macros |
| libc | 0.2.189 | MIT OR Apache-2.0 | https://github.com/rust-lang/libc |
| litemap | 0.8.2 | Unicode-3.0 | https://github.com/unicode-org/icu4x |
| lock_api | 0.4.14 | MIT OR Apache-2.0 | https://github.com/Amanieu/parking_lot |
| log | 0.4.33 | MIT OR Apache-2.0 | https://github.com/rust-lang/log |
| memchr | 2.8.3 | Unlicense OR MIT | https://github.com/BurntSushi/memchr |
| miniz_oxide | 0.9.1 | MIT OR Zlib OR Apache-2.0 | https://github.com/Frommi/miniz_oxide/tree/master/miniz_oxide |
| nodejs-built-in-modules | 1.0.0 | MIT | https://github.com/oxc-project/nodejs-built-in-modules |
| nonmax | 0.5.5 | MIT OR Apache-2.0 | https://github.com/LPGhatguy/nonmax |
| num-bigint | 0.5.1 | MIT OR Apache-2.0 | https://github.com/rust-num/num-bigint |
| num-integer | 0.1.46 | MIT OR Apache-2.0 | https://github.com/rust-num/num-integer |
| num-traits | 0.2.19 | MIT OR Apache-2.0 | https://github.com/rust-num/num-traits |
| once_cell | 1.21.4 | MIT OR Apache-2.0 | https://github.com/matklad/once_cell |
| owo-colors | 4.3.0 | MIT | https://github.com/owo-colors/owo-colors |
| oxc_allocator | 0.142.0 | MIT | https://github.com/oxc-project/oxc |
| oxc_ast | 0.142.0 | MIT | https://github.com/oxc-project/oxc |
| oxc_ast_macros | 0.142.0 | MIT | https://github.com/oxc-project/oxc |
| oxc_ast_visit | 0.142.0 | MIT | https://github.com/oxc-project/oxc |
| oxc_cfg | 0.142.0 | MIT | https://github.com/oxc-project/oxc |
| oxc_codegen | 0.142.0 | MIT | https://github.com/oxc-project/oxc |
| oxc_compat | 0.142.0 | MIT | https://github.com/oxc-project/oxc |
| oxc_config | 0.0.0 | MIT | https://github.com/oxc-project/oxc |
| oxc_data_structures | 0.142.0 | MIT | https://github.com/oxc-project/oxc |
| oxc_diagnostics | 0.142.0 | MIT | https://github.com/oxc-project/oxc |
| oxc_ecmascript | 0.142.0 | MIT | https://github.com/oxc-project/oxc |
| oxc_estree | 0.142.0 | MIT | https://github.com/oxc-project/oxc |
| oxc_estree_tokens | 0.142.0 | MIT | https://github.com/oxc-project/oxc |
| oxc_index | 5.0.0 | MIT | https://github.com/oxc-project/oxc-index-vec |
| oxc_jsdoc | 0.142.0 | MIT | https://github.com/oxc-project/oxc |
| oxc_linter | 1.76.0 | MIT | https://github.com/oxc-project/oxc |
| oxc_macros | 0.0.0 | MIT | https://github.com/oxc-project/oxc |
| oxc_parser | 0.142.0 | MIT | https://github.com/oxc-project/oxc |
| oxc_react_compiler | 0.142.0 | MIT | https://github.com/oxc-project/oxc |
| oxc_regular_expression | 0.142.0 | MIT | https://github.com/oxc-project/oxc |
| oxc_resolver | 11.24.2 | MIT | https://github.com/oxc-project/oxc-resolver |
| oxc_schemars_derive | 0.8.26 | MIT | https://github.com/oxc-project/schemars |
| oxc_semantic | 0.142.0 | MIT | https://github.com/oxc-project/oxc |
| oxc_span | 0.142.0 | MIT | https://github.com/oxc-project/oxc |
| oxc_str | 0.142.0 | MIT | https://github.com/oxc-project/oxc |
| oxc_syntax | 0.142.0 | MIT | https://github.com/oxc-project/oxc |
| oxc-browserslist | 3.0.13 | MIT | https://github.com/oxc-project/oxc-browserslist |
| oxc-miette | 3.0.1 | Apache-2.0 | https://github.com/oxc-project/oxc-miette |
| oxc-miette-derive | 3.0.1 | Apache-2.0 | https://github.com/oxc-project/oxc-miette |
| oxc-schemars | 0.9.1 | MIT | https://github.com/oxc-project/schemars |
| papaya | 0.2.4 | MIT | https://github.com/ibraheemdev/papaya |
| parking_lot_core | 0.9.12 | MIT OR Apache-2.0 | https://github.com/Amanieu/parking_lot |
| percent-encoding | 2.3.2 | MIT OR Apache-2.0 | https://github.com/servo/rust-url/ |
| petgraph | 0.8.3 | MIT OR Apache-2.0 | https://github.com/petgraph/petgraph |
| phf | 0.14.0 | MIT | https://github.com/rust-phf/rust-phf |
| phf_generator | 0.14.0 | MIT | https://github.com/rust-phf/rust-phf |
| phf_macros | 0.14.0 | MIT | https://github.com/rust-phf/rust-phf |
| phf_shared | 0.14.0 | MIT | https://github.com/rust-phf/rust-phf |
| pin-project-lite | 0.2.17 | Apache-2.0 OR MIT | https://github.com/taiki-e/pin-project-lite |
| postcard | 1.1.3 | MIT OR Apache-2.0 | https://github.com/jamesmunns/postcard |
| potential_utf | 0.1.5 | Unicode-3.0 | https://github.com/unicode-org/icu4x |
| proc-macro2 | 1.0.107 | MIT OR Apache-2.0 | https://github.com/dtolnay/proc-macro2 |
| quote | 1.0.47 | MIT OR Apache-2.0 | https://github.com/dtolnay/quote |
| rayon | 1.12.0 | MIT OR Apache-2.0 | https://github.com/rayon-rs/rayon |
| rayon-core | 1.13.0 | MIT OR Apache-2.0 | https://github.com/rayon-rs/rayon |
| regex | 1.13.1 | MIT OR Apache-2.0 | https://github.com/rust-lang/regex |
| regex-automata | 0.4.18 | MIT OR Apache-2.0 | https://github.com/rust-lang/regex |
| regex-syntax | 0.8.11 | MIT OR Apache-2.0 | https://github.com/rust-lang/regex |
| rust-lapper | 1.3.0 | MIT | https://github.com/sstadick/rust-lapper |
| rustc-hash | 2.1.3 | Apache-2.0 OR MIT | https://github.com/rust-lang/rustc-hash |
| rustversion | 1.0.23 | MIT OR Apache-2.0 | https://github.com/dtolnay/rustversion |
| ryu | 1.0.23 | Apache-2.0 OR BSL-1.0 | https://github.com/dtolnay/ryu |
| same-file | 1.0.6 | Unlicense/MIT | https://github.com/BurntSushi/same-file |
| scopeguard | 1.2.0 | MIT OR Apache-2.0 | https://github.com/bluss/scopeguard |
| seize | 0.5.1 | MIT | https://github.com/ibraheemdev/seize |
| self_cell | 1.3.0 | Apache-2.0 OR GPL-2.0-only | https://github.com/Voultapher/self_cell |
| seq-macro | 0.3.6 | MIT OR Apache-2.0 | https://github.com/dtolnay/seq-macro |
| serde | 1.0.229 | MIT OR Apache-2.0 | https://github.com/serde-rs/serde |
| serde_core | 1.0.229 | MIT OR Apache-2.0 | https://github.com/serde-rs/serde |
| serde_derive | 1.0.229 | MIT OR Apache-2.0 | https://github.com/serde-rs/serde |
| serde_derive_internals | 0.29.1 | MIT OR Apache-2.0 | https://github.com/serde-rs/serde |
| serde_json | 1.0.151 | MIT OR Apache-2.0 | https://github.com/serde-rs/json |
| simd-json | 0.17.3 | Apache-2.0 OR MIT | https://github.com/simd-lite/simd-json |
| simdutf8 | 0.1.5 | MIT OR Apache-2.0 | https://github.com/rusticstuff/simdutf8 |
| siphasher | 1.0.3 | MIT/Apache-2.0 | https://github.com/jedisct1/rust-siphash |
| smallvec | 1.15.2 | MIT OR Apache-2.0 | https://github.com/servo/rust-smallvec |
| smawk | 0.3.3 | MIT | https://github.com/mgeisler/smawk |
| stable_deref_trait | 1.2.1 | MIT OR Apache-2.0 | https://github.com/storyyeller/stable_deref_trait |
| static_assertions | 1.1.0 | MIT OR Apache-2.0 | https://github.com/nvzqz/static-assertions-rs |
| syn | 2.0.119 | MIT OR Apache-2.0 | https://github.com/dtolnay/syn |
| syn | 3.0.3 | MIT OR Apache-2.0 | https://github.com/dtolnay/syn |
| synstructure | 0.13.2 | MIT | https://github.com/mystor/synstructure |
| textwrap | 0.16.2 | MIT | https://github.com/mgeisler/textwrap |
| thiserror | 2.0.20 | MIT OR Apache-2.0 | https://github.com/dtolnay/thiserror |
| thiserror-impl | 2.0.20 | MIT OR Apache-2.0 | https://github.com/dtolnay/thiserror |
| tinystr | 0.8.3 | Unicode-3.0 | https://github.com/unicode-org/icu4x |
| tracing | 0.1.44 | MIT | https://github.com/tokio-rs/tracing |
| tracing-attributes | 0.1.31 | MIT | https://github.com/tokio-rs/tracing |
| tracing-core | 0.1.36 | MIT | https://github.com/tokio-rs/tracing |
| unicode-id-start | 1.4.0 | (MIT OR Apache-2.0) AND Unicode-3.0 | https://github.com/Boshen/unicode-id-start |
| unicode-ident | 1.0.24 | (MIT OR Apache-2.0) AND Unicode-3.0 | https://github.com/dtolnay/unicode-ident |
| unicode-linebreak | 0.1.5 | Apache-2.0 | https://github.com/axelf4/unicode-linebreak |
| unicode-segmentation | 1.13.3 | MIT OR Apache-2.0 | https://github.com/unicode-rs/unicode-segmentation |
| unicode-width | 0.2.2 | MIT OR Apache-2.0 | https://github.com/unicode-rs/unicode-width |
| url | 2.5.8 | MIT OR Apache-2.0 | https://github.com/servo/rust-url |
| utf8_iter | 1.0.4 | Apache-2.0 OR MIT | https://github.com/hsivonen/utf8_iter |
| value-trait | 0.12.2 | Apache-2.0/MIT | https://github.com/simd-lite/value-trait |
| walkdir | 2.5.0 | Unlicense/MIT | https://github.com/BurntSushi/walkdir |
| writeable | 0.6.3 | Unicode-3.0 | https://github.com/unicode-org/icu4x |
| yoke | 0.8.3 | Unicode-3.0 | https://github.com/unicode-org/icu4x |
| yoke-derive | 0.8.2 | Unicode-3.0 | https://github.com/unicode-org/icu4x |
| zerofrom | 0.1.8 | Unicode-3.0 | https://github.com/unicode-org/icu4x |
| zerofrom-derive | 0.1.7 | Unicode-3.0 | https://github.com/unicode-org/icu4x |
| zerotrie | 0.2.4 | Unicode-3.0 | https://github.com/unicode-org/icu4x |
| zerovec | 0.11.6 | Unicode-3.0 | https://github.com/unicode-org/icu4x |
| zerovec-derive | 0.11.3 | Unicode-3.0 | https://github.com/unicode-org/icu4x |
| zmij | 1.0.23 | MIT | https://github.com/dtolnay/zmij |
