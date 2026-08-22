#!/usr/bin/env bash
set -euo pipefail

SCRIPT_PATH="${BASH_SOURCE[0]}"
SCRIPT_DIRECTORY=$(cd "$(dirname "$SCRIPT_PATH")" && pwd)
PUBLICATION_CLI="$SCRIPT_DIRECTORY/corresponding-source-publication.mjs"

lock_owner_metadata() {
  local operation=$1
  shift
  node "$PUBLICATION_CLI" lock "$operation" "$@"
}

publish_no_clobber() {
  node "$PUBLICATION_CLI" publication publish "$1" "$2"
}

remove_owned_publication() {
  node "$PUBLICATION_CLI" publication remove-owned "$1" "$2"
}

publication_transaction() {
  local operation=$1
  shift
  node "$PUBLICATION_CLI" transaction "$operation" "$@"
}

run_with_output_guard() {
  local guard=$1
  shift
  local token
  token=$(node -e 'process.stdout.write(require("node:crypto").randomUUID())')
  if ! node "$PUBLICATION_CLI" guard acquire "$guard" "$$" "$token" >/dev/null; then
    return 2
  fi
  local result=0
  "$@" || result=$?
  if ! node "$PUBLICATION_CLI" guard release "$guard" "$$" "$token" >/dev/null; then
    echo "Output guard cleanup failed closed: $guard" >&2
    return 2
  fi
  return "$result"
}

package_corresponding_source() (
  SOURCE=$1
  OUTPUT=$2
  ROOT=$(cd "$SCRIPT_DIRECTORY/.." && pwd)
  ENGINE_ROOT="$ROOT/engines/semgrep-wasm"
  OUTPUT_DIRECTORY=$(dirname "$OUTPUT")
  OUTPUT_BASENAME=$(basename "$OUTPUT")
  LOCK_FILE="$OUTPUT.lock"
  LOCK_TOKEN=$(node -e 'process.stdout.write(require("node:crypto").randomUUID())')
  SIDECAR="$OUTPUT.evidence.json"
  COMPLETION="$OUTPUT.complete.json"
  if ! lock_owner_metadata acquire "$LOCK_FILE" "$$" "$LOCK_TOKEN" >/dev/null; then
    return 2
  fi
  LOCK_ACQUIRED=1
  STAGING=""
  TRANSACTION_SOURCE=""
  TRANSACTION="$OUTPUT.transaction.json"
  TRANSACTION_PUBLISHED=0
  PUBLICATION_COMMITTED=0
  cleanup() {
    local original_status=$?
    local cleanup_failed=0
    trap - EXIT
    if [[ "$PUBLICATION_COMMITTED" -ne 1 ]]; then
      if [[ "$TRANSACTION_PUBLISHED" -eq 1 ]]; then
        if publication_transaction recover "$OUTPUT"; then STAGING=""; else cleanup_failed=1; fi
      elif [[ -n "$TRANSACTION_SOURCE" ]] && [[ -n "$STAGING" ]]; then
        if publication_transaction abort-unpublished "$OUTPUT" "$STAGING" "$LOCK_TOKEN" "$TRANSACTION_SOURCE"; then STAGING=""; else cleanup_failed=1; fi
      fi
    fi
    if [[ "$LOCK_ACQUIRED" -eq 1 ]] && ! lock_owner_metadata release "$LOCK_FILE" "$$" "$LOCK_TOKEN"; then
      cleanup_failed=1
    fi
    if [[ "$cleanup_failed" -eq 1 ]]; then original_status=2; fi
    exit "$original_status"
  }
  trap cleanup EXIT
  trap 'exit 129' HUP
  trap 'exit 130' INT
  trap 'exit 143' TERM

  publication_transaction recover "$OUTPUT"

  if [[ -e "$OUTPUT" ]]; then
    echo "Output already exists: $OUTPUT" >&2
    exit 2
  fi
  if [[ -e "$SIDECAR" ]]; then
    echo "Evidence sidecar already exists: $SIDECAR" >&2
    exit 2
  fi
  if [[ -e "$COMPLETION" ]]; then
    echo "Completion marker already exists: $COMPLETION" >&2
    exit 2
  fi

  node "$ROOT/scripts/enforce-public-release.mjs" verify
  node "$ROOT/scripts/verify-semgrep-source.mjs" --source "$SOURCE"

  STAGING=$(mktemp -d "$OUTPUT_DIRECTORY/.${OUTPUT_BASENAME}.staging.XXXXXX")
  TRANSACTION_SOURCE=$(publication_transaction begin "$OUTPUT" "$STAGING" "$LOCK_TOKEN")
  publish_no_clobber "$TRANSACTION_SOURCE" "$TRANSACTION"
  TRANSACTION_PUBLISHED=1
  BUNDLE="$STAGING/semgrep-1.172.0-friendly-adversary-source"
  mkdir -p "$BUNDLE/semgrep" "$BUNDLE/external-sources" "$BUNDLE/opam-sources" "$BUNDLE/friendly-adversary"

  git -C "$SOURCE" archive 651f37efa397bf066e1cf627414eeabe40b07e27 | tar -xf - -C "$BUNDLE/semgrep"

  node - "$ENGINE_ROOT/upstream-lock.json" <<'NODE' | while IFS=$'\t' read -r relative commit; do
const lock = require(process.argv[2]);
for (const entry of lock.requiredSubmodules) process.stdout.write(`${entry.path}\t${entry.commit}\n`);
NODE
    mkdir -p "$BUNDLE/semgrep/$relative"
    git -C "$SOURCE/$relative" archive "$commit" | tar -xf - -C "$BUNDLE/semgrep/$relative"
  done

  (
    cd "$BUNDLE/semgrep"
    git apply "$ENGINE_ROOT/source/patches/semgrep-1.172.0-wasm-port.patch"
    cd libs/ocaml-tree-sitter-core
    git apply "$ENGINE_ROOT/source/patches/ocaml-tree-sitter-core-wasm-port.patch"
  )

  curl --fail --location --output "$BUNDLE/external-sources/pcre2-10.43.tar.gz" \
    "https://github.com/PCRE2Project/pcre2/releases/download/pcre2-10.43/pcre2-10.43.tar.gz"
  curl --fail --location --output "$BUNDLE/external-sources/tree-sitter-0.22.6.tar.gz" \
    "https://github.com/tree-sitter/tree-sitter/archive/refs/tags/v0.22.6.tar.gz"
  curl --fail --location --output "$BUNDLE/external-sources/ocaml-tree-sitter-semgrep-d68c1d87318808ec1b36ce89570ef6c0bc763f77.tar.gz" \
    "https://github.com/semgrep/ocaml-tree-sitter-semgrep/archive/d68c1d87318808ec1b36ce89570ef6c0bc763f77.tar.gz"

  node - "$BUNDLE/external-sources" <<'NODE'
const { createHash } = require("node:crypto");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const root = process.argv[2];
const expected = {
  "pcre2-10.43.tar.gz": "889d16be5abb8d05400b33c25e151638b8d4bac0e2d9c76e9d6923118ae8a34e",
  "tree-sitter-0.22.6.tar.gz": "e2b687f74358ab6404730b7fb1a1ced7ddb3780202d37595ecd7b20a8f41861f",
  "ocaml-tree-sitter-semgrep-d68c1d87318808ec1b36ce89570ef6c0bc763f77.tar.gz": "85d1cede25cdf613f200e1df10d17e25cd83d42b4d08b079b7af15b965b21924",
};
for (const [name, wanted] of Object.entries(expected)) {
  const actual = createHash("sha256").update(readFileSync(path.join(root, name))).digest("hex");
  if (actual !== wanted) throw new Error(`${name}: ${actual}, expected ${wanted}`);
}
NODE

  OPAM_PREFIX=$(opam var prefix)
  OPAM_SOURCES="$OPAM_PREFIX/.opam-switch/sources"
  node - "$ENGINE_ROOT/source/linked-components.json" <<'NODE' | while IFS=$'\t' read -r name version; do
const inventory = require(process.argv[2]);
for (const entry of inventory.linkedOcamlPackages) process.stdout.write(`${entry.name}\t${entry.version}\n`);
NODE
    source_directory="$OPAM_SOURCES/$name.$version"
    if [[ ! -d "$source_directory" ]]; then source_directory="$OPAM_SOURCES/$name"; fi
    if [[ ! -d "$source_directory" ]]; then
      echo "Missing OPAM source for $name $version" >&2
      exit 1
    fi
    mkdir -p "$BUNDLE/opam-sources/$name-$version"
    rsync -a --exclude .git/ --exclude _build/ "$source_directory/" "$BUNDLE/opam-sources/$name-$version/"
  done

  cp "$ROOT/scripts/build-semgrep-wasm.sh" "$BUNDLE/friendly-adversary/"
  cp "$ROOT/scripts/generate-semgrep-linked-inventory.mjs" "$BUNDLE/friendly-adversary/"
  cp "$ROOT/LICENSE" "$BUNDLE/friendly-adversary/GPL-3.0-only.txt"
  cp "$ROOT/LICENSING.md" "$BUNDLE/friendly-adversary/"
  cp "$ENGINE_ROOT/upstream-lock.json" "$BUNDLE/friendly-adversary/"
  cp "$ENGINE_ROOT/runtime-manifest.json" "$BUNDLE/friendly-adversary/"
  cp "$ENGINE_ROOT/source/linked-components.json" "$BUNDLE/friendly-adversary/"
  cp "$ENGINE_ROOT/source/generated-parser-license-evidence.json" "$BUNDLE/friendly-adversary/"
  cp "$ENGINE_ROOT/source/corresponding-source-manifest.json" "$BUNDLE/friendly-adversary/"
  cp -R "$ENGINE_ROOT/source/licenses" "$BUNDLE/friendly-adversary/licenses"
  cp -R "$ENGINE_ROOT/source/patches" "$BUNDLE/friendly-adversary/patches"

  node - "$BUNDLE/SOURCE-BUNDLE.json" <<'NODE'
const { createHash } = require("node:crypto");
const { readFileSync, writeFileSync } = require("node:fs");
const path = require("node:path");
const output = process.argv[2];
const root = path.dirname(output);
const hash = (file) => createHash("sha256").update(readFileSync(path.join(root, file))).digest("hex");
writeFileSync(output, `${JSON.stringify({
  schemaVersion: 1,
  semgrepVersion: "1.172.0",
  semgrepCommit: "651f37efa397bf066e1cf627414eeabe40b07e27",
  sourceDateEpoch: 1786147200,
  patches: {
    "semgrep-1.172.0-wasm-port.patch": hash("friendly-adversary/patches/semgrep-1.172.0-wasm-port.patch"),
    "ocaml-tree-sitter-core-wasm-port.patch": hash("friendly-adversary/patches/ocaml-tree-sitter-core-wasm-port.patch"),
  },
  distributionLicense: "GPL-3.0-only",
  releaseScope: "public",
  publicSourceOffer: "https://github.com/mattlgroff/friendly-adversary/releases/download/v3.0.4/semgrep-1.172.0-friendly-adversary-corresponding-source.tar.gz",
  publicPublicationBlocked: false,
  contents: ["modified Semgrep source", "required parser submodules", "generated parser provenance and pinned GPL generator source", "PCRE2 and tree-sitter source archives", "linked OPAM package sources", "build scripts, locks, notices, and patch files"],
}, null, 2)}\n`);
NODE

  find "$BUNDLE" -exec touch -h -t 202608080000 {} +
  ARCHIVE="$STAGING/source.tar"
  COPYFILE_DISABLE=1 tar -cf "$ARCHIVE" -C "$STAGING" "$(basename "$BUNDLE")"
  gzip -n "$ARCHIVE"
  node "$ROOT/scripts/verify-semgrep-corresponding-source-evidence.mjs" record \
    --archive "$ARCHIVE.gz" \
    --output "$STAGING/corresponding-source.evidence.json" >/dev/null
  node - "$ARCHIVE.gz" "$STAGING/corresponding-source.evidence.json" "$STAGING/corresponding-source.complete.json" "$OUTPUT" "$SIDECAR" <<'NODE'
const { createHash } = require("node:crypto");
const { readFileSync, statSync, writeFileSync } = require("node:fs");
const path = require("node:path");
const [archive, evidence, completion, publishedArchive, publishedEvidence] = process.argv.slice(2);
const record = (file, published) => ({
  filename: path.basename(published),
  bytes: statSync(file).size,
  sha256: createHash("sha256").update(readFileSync(file)).digest("hex"),
});
writeFileSync(completion, `${JSON.stringify({
  schemaVersion: 1,
  status: "complete",
  archive: record(archive, publishedArchive),
  evidence: record(evidence, publishedEvidence),
}, null, 2)}\n`);
NODE
  publication_transaction prepare "$OUTPUT" "$STAGING" "$LOCK_TOKEN"
  publish_no_clobber "$STAGING/corresponding-source.evidence.json" "$SIDECAR"
  publish_no_clobber "$ARCHIVE.gz" "$OUTPUT"
  publish_no_clobber "$STAGING/corresponding-source.complete.json" "$COMPLETION"
  publication_transaction recover "$OUTPUT"
  STAGING=""
  PUBLICATION_COMMITTED=1
  shasum -a 256 "$OUTPUT"
  echo "Evidence: $SIDECAR"
  echo "Completion: $COMPLETION"
)

main() {
  if [[ $# -ne 2 ]]; then
    echo "Usage: $0 /absolute/path/to/pristine-semgrep /absolute/output.tar.gz" >&2
    exit 2
  fi
  local source=$1
  local output=$2
  if [[ "$source" != /* || "$output" != /* || "$output" != *.tar.gz ]]; then
    echo "Source and output must be absolute POSIX paths, and output must end in .tar.gz" >&2
    exit 2
  fi
  local output_directory
  output_directory=$(dirname "$output")
  if [[ ! -d "$output_directory" ]]; then
    echo "Output directory does not exist: $output_directory" >&2
    exit 2
  fi
  local guard="$output.lock.guard"
  run_with_output_guard "$guard" bash -c 'source "$1"; package_corresponding_source "$2" "$3"' _ "$SCRIPT_PATH" "$source" "$output"
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi
