# Oxlint WASM license overrides

Cargo packages normally include their license files in the registry archive. The seven packages below declare MIT in Cargo metadata but omit the license file from that archive. These copies preserve the license text from each package's exact source commit recorded by `.cargo_vcs_info.json`.

| Package | Source commit |
| --- | --- |
| `fast-glob-1.1.0` | `oxc-project/fast-glob@dfe3fed64313d4f11ce6ec4cdbdad2d0498dad2e` |
| `javascript-globals-1.5.1` | `oxc-project/javascript-globals@ca934314ec6145131580ec76a1cafad355a29837` |
| `lazy-regex-proc_macros-3.6.1` | `Canop/lazy-regex@39a459c01e1ba2488075be50a821e2d72e466241` |
| `nodejs-built-in-modules-1.0.0` | `oxc-project/nodejs-built-in-modules@9117efa38fe088325e8a1036a8ddea7f3546c1ac` |
| `oxc-browserslist-3.0.13` | `oxc-project/oxc-browserslist@681aa3c4b40e0957c8f87cc02a07719ee1c2e1cc` |
| `oxc_index-5.0.0` | `oxc-project/oxc-index-vec@8e09fe324eb6df02f56e4eacdfac958930300380` |
| `oxc_resolver-11.24.2` | `oxc-project/oxc-resolver@7ba4ae692c1f55d5b20bcb0e06ad1f13ad338950` |

