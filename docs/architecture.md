# Friendly Adversary architecture

## Product surfaces

The repository packages one plugin for Claude Code and one for Codex. Each exposes the same three explicitly invoked skills:

- `pr-review`
- `audit-codebase`
- `design-new-codebase`

The PR skill contains the shared runtime and bundled analyzers. Audit and design are lean orchestration skills that call the sibling runtime and load only their workflow references.

## Runtime layers

```text
host skill
  -> local Node CLI
     -> pinned snapshot and deterministic collectors
     -> external authority and scoped capabilities
     -> concurrent read-only ephemeral codex exec processes
        -> gpt-5.6-luna with high reasoning and Fast mode
        -> validated direct lens publication
  -> exclusive calling-model adjudication
     -> one stdio MCP tool: record_artifact
  -> seal and verify
```

### CLI

The Node CLI owns snapshotting, deterministic collection, required concurrent Luna lens execution for PR review, authority creation, resume, workflow abort, sealing, status, and verification.

Commands:

- `review`
- `audit`
- `design`
- `resume-audit`
- `resume-design`
- `recover-lock`
- `abort` for audit and design workflows
- `seal`
- `verify`
- `status`
- `validate`

Workflow lock ownership combines the process ID with the operating system's reported process start identity. Darwin exposes that start time with one-second resolution. If macOS were to recycle the same PID within that same second, recovery would conservatively refuse the stale lock until the unrelated process exits. This is an availability-only, fail-closed limitation and cannot replace or corrupt the lock owner’s artifacts.

### Deterministic analyzers

Semgrep CE, Ruff, an Oxlint-compatible engine, and ripgrep are bundled as WebAssembly. Their runtime identities, licenses, source evidence, and hashes are validated before packaging. Audit batches analyzer input by file count and source bytes so full repositories do not exceed fixed engine limits.

PR review may also run repository-owned checks from an existing trusted installation. Audit never runs those checks. Design runs no analyzer or repository code.

Do not start two PR review collectors against the same checkout concurrently. Repository-owned build, test, and typecheck commands are not assumed to be safe when overlapped. Luna lenses within one completed collection remain fully concurrent because they write only to distinct capability-scoped artifacts.

### Agent orchestration

PR review fans out one fresh local `codex exec` process per selected lens before waiting. Every process uses `gpt-5.6-luna`, high reasoning, Fast mode, ignored user configuration, an ephemeral session, a read-only sandbox, core-only shell environment inheritance, and automatic secret-name exclusions. The CLI validates the final Markdown and publishes it directly, so the calling model never copies lens responses into files. Audit fans out semantic subsystem agents once. Design maintains decision revisions and runs independent architecture challenges.

The calling model alone adjudicates agent output. Agent agreement or consensus never replaces independent disproof, evidence validation, duplicate merging, and final classification.

The host may not replace the required Codex CLI lens runtime with its own agent primitives, parent model, serial review, or alternate model. Missing Codex CLI access, Luna access, or any valid lens result makes the run incomplete. There is no fallback.

## One artifact tool

The plugin bundles one MCP server and exposes exactly one tool:

```text
record_artifact
```

The operation and workflow fields select artifact publication, plan establishment, or final completion. Audit and design may preflight a planned lane. PR review does not need a preflight step. This is one capability boundary, not a general filesystem API.

Every call includes:

- workflow kind;
- external authority ID;
- unguessable scoped capability;
- exact relative artifact path;
- Markdown only when publishing.

The authority binds the capability to one run, one pinned snapshot, an expiry, and exact artifact scope. Decision revisions are reserved explicitly and receive a capability for exactly the next revision. PR artifacts use atomic no-replace publication in a private run directory and byte-identical retries are idempotent. The adjudication records the exact report hash, so a retry cannot combine documents from different outcomes. Temporary publication candidates live in the run's disposable private scratch directory, outside the sealable packet. Cancellation is honored before the publication commit point; after that point the atomic publication finishes and reports its actual result. Traversal, absolute paths, backslashes, static symlink redirection, cross-run use, and cross-scope use fail closed.

Friendly Adversary assumes a trusted local operating-system account. A malicious same-user process can rename or delete files that the account owns and can interfere with initial run creation. The runtime detects changed snapshots and authenticated publication identities; it is not an operating-system sandbox against the repository owner.

The MCP transport is stdio. The process opens no TCP or UDP listener, performs no network access, and exits when the host closes stdio.

## Workflow artifacts

### PR review

During collection this packet lives in a private operating-system temporary directory. The runtime verifies the pinned Git snapshot after every repository-controlled command. Concurrent checkout edits are unsupported, and repository commands are trusted not to mutate source transiently and restore it before exit. Sealing verifies the packet, copies it to a unique same-filesystem staging directory, and atomically renames that complete directory into the repository output tree. The seal decision atomically records the exact verified staging directory immediately before rename, so retries finish the same committed publication and concurrent seal calls converge without sharing mutable staging state.

```text
.friendly-adversary/pr-reviews/<run-id>/
├── receipt.json
├── git/
├── deterministic/
├── lens-definitions/
├── finding-contract.md
├── lens-runtime.json
├── lenses/
├── adjudication.md
├── report.md
├── report.html
└── artifacts.sha256
```

### Codebase audit

```text
.friendly-adversary/audits/<run-id>/
├── snapshot.json
├── receipt.json
├── .receipt-alternate.json
├── workflow-plan.json
├── inventory.md
├── snapshot-files/
├── deterministic/
├── dimension-definitions/
├── subsystem-<id>.md
├── adjudication.md
├── report.md
├── report.html
└── artifacts.sha256
```

### New codebase design

```text
.friendly-adversary/designs/<run-id>/
├── snapshot.json
├── receipt.json
├── .receipt-alternate.json
├── workflow-plan.json
├── brief.md
├── decision-<id>-<revision>.md
├── research-<id>.md
├── challenge-<id>.md
├── architecture.md
├── diagrams.md
├── test-strategy.md
├── implementation-plan.md
├── open-questions.md
├── design-pack.md
├── design.html
└── artifacts.sha256
```

## Snapshot semantics

Audit and design state uses two authenticated receipt generations. Each transition writes only the inactive generation, so an interrupted write leaves the previous complete generation available for deterministic recovery.

PR review pins its base, head, merge base, diff, and working tree state. Audit hashes HEAD, every index stage with object and mode, working-tree bytes and modes, deletions, Git submodules, and non-ignored untracked files. It materializes regular-file bytes into `snapshot-files/`; bundled analyzers and agents inspect that immutable copy instead of live repository paths. Design binds the session to the identity of an existing directory without examining or changing product source.

Every final seal recomputes the relevant snapshot. A mismatch blocks a clean seal. Audit publication also revalidates materialized bytes. Resume issues capabilities only for the next eligible phase: audit subsystems then final outcome, or design decision/research lanes then challenges then final outcome.

## Generated platform copies

Canonical TypeScript builds to `dist/`. The sync script copies the compiled runtime, analyzers, licenses, and references into Claude Code and Codex plugin layouts. The asset checker compares exact inventories and bytes, rejects retired skill directories, and ensures all skill license copies match the root.

## Trust model

Reviewed content and analyzer output are untrusted evidence for agents. The local repository itself must be trusted before PR review runs repository-owned checks. Audit reduces execution risk by using bundled analyzers only, but it is not a proof that parsed source is harmless.

Friendly Adversary confines its own writes and verifies its artifacts. It does not sandbox arbitrary application processes, manage credentials, or undo external side effects.
