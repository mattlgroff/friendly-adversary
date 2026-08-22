#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 /absolute/path/to/disposable-pristine-semgrep /absolute/output-directory" >&2
  exit 2
fi

SOURCE=$1
OUTPUT=$2
SCRIPT_DIRECTORY=$(cd "$(dirname "$0")" && pwd)
FRIENDLY_ADVERSARY_ROOT=$(cd "$SCRIPT_DIRECTORY/.." && pwd)
LOCK_FILE="$FRIENDLY_ADVERSARY_ROOT/engines/semgrep-wasm/upstream-lock.json"
MAIN_PATCH="$FRIENDLY_ADVERSARY_ROOT/engines/semgrep-wasm/source/patches/semgrep-1.172.0-wasm-port.patch"
TREE_PATCH="$FRIENDLY_ADVERSARY_ROOT/engines/semgrep-wasm/source/patches/ocaml-tree-sitter-core-wasm-port.patch"

if [[ "$SOURCE" != /* || "$OUTPUT" != /* ]]; then
  echo "Source and output paths must be absolute" >&2
  exit 2
fi
if [[ -e "$OUTPUT" ]]; then
  echo "Output already exists: $OUTPUT" >&2
  exit 2
fi

node "$FRIENDLY_ADVERSARY_ROOT/scripts/verify-semgrep-source.mjs" --source "$SOURCE"

require_version() {
  local label=$1
  local actual=$2
  local expected=$3
  if [[ "$actual" != "$expected" ]]; then
    echo "$label is $actual, expected $expected" >&2
    exit 1
  fi
}

require_version "Node" "$(node --version)" "v22.22.0"
require_version "npm" "$(npm --version)" "10.9.4"
require_version "opam" "$(opam --version)" "2.5.2"
require_version "Dune" "$(dune --version)" "3.23.1"
require_version "js_of_ocaml" "$(js_of_ocaml --version)" "6.3.2"
require_version "Emscripten" "$(emcc --version | sed -n '1s/.* //p')" "6.0.6-git"

git -C "$SOURCE" apply --check "$MAIN_PATCH"
git -C "$SOURCE/libs/ocaml-tree-sitter-core" apply --check "$TREE_PATCH"
git -C "$SOURCE" apply "$MAIN_PATCH"
git -C "$SOURCE/libs/ocaml-tree-sitter-core" apply "$TREE_PATCH"

TREE_CORE="$SOURCE/libs/ocaml-tree-sitter-core"
(
  cd "$TREE_CORE"
  ./configure
  ./scripts/download-tree-sitter --lazy
  ./scripts/install-tree-sitter-lib
)

PCRE2_ARCHIVE="$SOURCE/js/libpcre2/downloads/pcre2-10.43.tar.gz"
mkdir -p "$(dirname "$PCRE2_ARCHIVE")"
if [[ ! -f "$PCRE2_ARCHIVE" ]]; then
  curl --fail --location --output "$PCRE2_ARCHIVE" "https://github.com/PCRE2Project/pcre2/releases/download/pcre2-10.43/pcre2-10.43.tar.gz"
fi
node - "$PCRE2_ARCHIVE" <<'NODE'
const { createHash } = require("node:crypto");
const { readFileSync } = require("node:fs");
const file = process.argv[2];
const expected = "889d16be5abb8d05400b33c25e151638b8d4bac0e2d9c76e9d6923118ae8a34e";
const actual = createHash("sha256").update(readFileSync(file)).digest("hex");
if (actual !== expected) throw new Error(`PCRE2 archive SHA-256 is ${actual}, expected ${expected}`);
NODE

(
  cd "$SOURCE"
  dune build --profile release js/engine/Main.bc.js js/languages/python/Parser.bc.js js/languages/typescript/Parser.bc.js
  make -C js/libyaml dist/libyaml.o
  make -C js/libpcre2 dist/libpcre2-8.a
  make -C js/engine build
  make -C js/languages/python build
  make -C js/languages/typescript build
)

mkdir -p "$OUTPUT/engine" "$OUTPUT/python" "$OUTPUT/typescript"
install -m 0644 "$SOURCE/js/engine/dist/index.cjs" "$OUTPUT/engine/index.cjs"
install -m 0644 "$SOURCE/js/engine/dist/semgrep-engine.wasm" "$OUTPUT/engine/semgrep-engine.wasm"
install -m 0644 "$SOURCE/js/languages/python/dist/index.cjs" "$OUTPUT/python/index.cjs"
install -m 0644 "$SOURCE/js/languages/python/dist/semgrep-parser.wasm" "$OUTPUT/python/semgrep-parser.wasm"
install -m 0644 "$SOURCE/js/languages/typescript/dist/index.cjs" "$OUTPUT/typescript/index.cjs"
install -m 0644 "$SOURCE/js/languages/typescript/dist/semgrep-parser.wasm" "$OUTPUT/typescript/semgrep-parser.wasm"

node - "$LOCK_FILE" "$FRIENDLY_ADVERSARY_ROOT/engines/semgrep-wasm/runtime-manifest.json" "$OUTPUT" <<'NODE'
const { createHash } = require("node:crypto");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const manifest = JSON.parse(readFileSync(process.argv[3], "utf8"));
const output = process.argv[4];
for (const entry of manifest.files) {
  const relative = entry.path.replace(/^runtime\//, "");
  const content = readFileSync(path.join(output, relative));
  const actual = createHash("sha256").update(content).digest("hex");
  if (actual !== entry.sha256 || content.byteLength !== entry.bytes) {
    throw new Error(`${relative} differs from the committed reproducible artifact`);
  }
}
NODE

echo "Verified reproducible Semgrep runtime at $OUTPUT"
