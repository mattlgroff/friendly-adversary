# Semgrep engine third-party inventory

This inventory supports the public GPL-3.0-only combined distribution. It preserves each component's original license and records the conservative GPL-3.0 classification used for generated parser material. The three slim generated-parser repositories still have no authoritative root license, so that fact remains `NOASSERTION` rather than being hidden or guessed.

## Runtime and generated-code components

| Component | Exact source | License evidence | Runtime role | Status |
| --- | --- | --- | --- | --- |
| Semgrep Community Edition | `semgrep/semgrep@651f37efa397bf066e1cf627414eeabe40b07e27` | `source/licenses/SEMGREP-LGPL-2.1.txt` | Matching engine and rule semantics | Pinned and noticed |
| ocaml-tree-sitter-core | `returntocorp/ocaml-tree-sitter-core@2dc9e0c738086df1ce4de93723302d9560d5b76c` | `source/licenses/OCAML-TREE-SITTER-LGPL.txt` | Parser bindings | Pinned and noticed |
| Generated Python parser | `returntocorp/semgrep-python@647a20f8207740b0a76541bb27e1eaaf111dca7e` | Exact GPL-3.0 grammar-extension blob plus MIT upstream grammar, recorded in `source/generated-parser-license-evidence.json` | Python target and pattern parsing | Conservatively GPL-3.0-only in the combined public distribution; upstream root remains `NOASSERTION` |
| Generated TypeScript parser | `returntocorp/semgrep-typescript@50fe6a5c46d3dee74d1d176b9767ffc520a1003e` | Pinned GPL-3.0 generator commit and exact grammar-extension blob plus MIT upstream grammars | JavaScript and TypeScript parsing | Conservatively GPL-3.0-only in the combined public distribution; upstream root remains `NOASSERTION` |
| Generated TSX parser | `returntocorp/semgrep-tsx@6005de74ed9e2fb891785a3df8582dbb91e272bc` | Pinned GPL-3.0 generator commit and exact grammar-extension blob plus MIT upstream grammars | JSX and TSX parsing | Conservatively GPL-3.0-only in the combined public distribution; upstream root remains `NOASSERTION` |
| PCRE2 | `10.43`, archive SHA-256 in `upstream-lock.json` | `source/licenses/PCRE2-BSD.txt` | Regular-expression semantics | Pinned and noticed |
| tree-sitter | `0.22.6`, archive SHA-256 in `upstream-lock.json` | `source/licenses/TREE-SITTER-MIT.txt` and `TREE-SITTER-UNICODE.txt` | Parser runtime | Pinned and noticed |
| libyaml | `yaml/libyaml@2c891fc7a770e8ba2fec34fc6b545c672beb37e6` | `source/licenses/LIBYAML-MIT.txt` | Rule parsing | Pinned and noticed |
| Emscripten and musl | `6.0.6-git` toolchain | `source/licenses/EMSCRIPTEN-LICENSE.txt` and `MUSL-COPYRIGHT.txt` | WebAssembly glue, allocator, and C runtime | Version locked and noticed |
| esbuild | `0.17.18` | `source/licenses/ESBUILD-MIT.txt` | JavaScript bundle generation | Version locked and noticed |
| Python grammar | Provenance recorded by the generated parser | `source/licenses/TREE-SITTER-PYTHON-MIT.txt` | Python grammar input | Pinned and noticed |
| JavaScript grammar | Provenance recorded by the generated parser | `source/licenses/TREE-SITTER-JAVASCRIPT-MIT.txt` | JavaScript grammar input | Pinned and noticed |
| TypeScript grammar | Provenance recorded by the generated parser | `source/licenses/TREE-SITTER-TYPESCRIPT-MIT.txt` | TypeScript and TSX grammar input | Pinned and noticed |

## Actual OCaml release link closure

`source/linked-components.json` is generated from Dune's three release link rules and `opam list --owns-file`. It records 104 linked libraries, 104 exact installed OPAM packages, declared licenses, upstream repositories, and the packaged license file SHA-256 for every package. The corresponding 104 license files are under `source/licenses/opam-linked/`.

Regenerate it only inside the exact pinned OPAM switch:

```bash
node scripts/generate-semgrep-linked-inventory.mjs --source /absolute/path/to/patched-semgrep
```

## LGPL source and modification materials

- Exact upstream and submodule pins are in `upstream-lock.json`.
- Conspicuous changes and patch hashes are in `MODIFICATIONS.md`.
- Relinkable build instructions are in `scripts/build-semgrep-wasm.sh`.
- The complete modified Semgrep tree, required submodules, PCRE2 and tree-sitter archives, linked OPAM sources, build scripts, patches, and notices can be packaged with `scripts/package-semgrep-corresponding-source.sh`.
- A corresponding-source archive must be published and offered with any runtime distribution. A local archive is build evidence, not a public source offer.

The `tests/semgrep-rules` submodule is intentionally prohibited. It is a separately licensed community rule pack and is not required to build the engine. Friendly Adversary bundles only product-owned rules under `rules/semgrep/`.

## Generated parser decision

The generated parser repositories do not contain a root license file at the pinned commits. Friendly Adversary therefore does not claim that those repositories independently declare GPL-3.0. Instead, `source/generated-parser-license-evidence.json` proves exact input blobs from `semgrep/ocaml-tree-sitter-semgrep@d68c1d87318808ec1b36ce89570ef6c0bc763f77`, whose root and grammar-generator license texts are GPL version 3, together with the MIT upstream grammar licenses. The generated linked output is conservatively included under GPL-3.0-only rather than assigned unsupported permissive terms.

The combined Friendly Adversary distribution is GPL-3.0-only. Semgrep remains LGPL-2.1-only, and all MIT, BSD, ISC, Apache, LGPL, GPL, Unicode, NCSA, and exception notices remain attached to their components.

## Publication boundary

Public distribution proceeds under this conservative classification with the complete Corresponding Source archive attached to each GitHub release. The missing upstream root licenses remain explicit as `NOASSERTION`. `package.json` is private because npm is not a distribution target, and its publication hook fails unconditionally. Run `npm run verify:public-release` to verify that boundary.
