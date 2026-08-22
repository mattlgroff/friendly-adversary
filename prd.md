# Friendly Adversary product requirements

Status: production contract

Owner: Matthew Groff

Repository: `mattlgroff/friendly-adversary`

License: GPL-3.0-only with retained third-party notices and corresponding source attached to GitHub releases

## Product

Friendly Adversary is a local review and design plugin for Claude Code and Codex. It increases investigative breadth through independent agents and protects precision through final adjudication by the strongest model in the calling session.

The product supports TypeScript, JavaScript, and Python and exposes three explicit skills:

1. `pr-review` reviews a proposed change against a pinned base.
2. `audit-codebase` audits a complete pinned brownfield repository.
3. `design-new-codebase` produces an implementation-ready, user-approved architecture decision pack before code is generated.

## Product principles

- No analyzer fallback. Required analyzers are bundled.
- No analyzer installation, runtime download, or network query.
- One capability-scoped `record_artifact` MCP tool for all agent-authored output.
- No source edits by any Friendly Adversary skill.
- Deterministic evidence is a lead, not a final finding.
- Independent agents maximize investigative breadth. The calling model validates and adjudicates.
- Missing required coverage makes a run incomplete, never clean.
- Every completed run is pinned, sealed, and verifiable.
- Human-readable Markdown is canonical. Offline HTML is a deterministic companion.

## Shared runtime requirements

The runtime must:

- run on Node.js 22.22.0 or newer on Windows, macOS, Linux, and WSL2;
- bundle Semgrep CE, Ruff, an Oxlint-compatible analyzer, and ripgrep as WebAssembly;
- open no network listener and perform no runtime network access;
- preserve native analyzer output without translation;
- publish every sealed run under `.friendly-adversary/<workflow>/<run-id>/`; PR review keeps its pre-seal packet in private user-scoped state outside the repository;
- issue unguessable, expiring capabilities bound to one run and allowed artifact paths;
- reject traversal, symlinks, clobbering, cross-run use, and non-identical retries;
- support safe concurrent publication by independent lanes;
- detect snapshot mutation before sealing;
- produce an integrity manifest and verify every sealed artifact.

## PR review

### Scope

Review committed, staged, unstaged, and intended untracked changes against an explicit or safely resolved base. Pin the base, head, merge base, diff, and working tree state.

An explicitly requested existing branch, remote branch, PR head, or commit may be fetched and checked out only when the target tree is clean. This is review navigation, not an application-code edit.

### Deterministic evidence

Run:

- Git scope and changed-line collection;
- bundled Oxlint, Ruff, Semgrep, and ripgrep as applicable;
- applicable repository lint, typecheck, test, build, and validation commands;
- focused repository symbol and convention searches.

Repository checks are trusted execution inputs. They may run repository-owned code, so PR review is only for trusted checkouts with dependencies already installed.

### Lenses

Run nine lenses independently and concurrently when applicable:

- repository fit
- correctness
- contracts
- state and concurrency
- security
- data integrity
- verification
- operability
- anti-slop

Each lens receives only its pinned packet, definition, exact output path, and capability. It publishes once and returns a compact receipt. Full findings do not flow back through the parent conversation for copying.

### Completion

The calling model reopens the cited code, attempts to disprove every claim, merges duplicates, assigns material priority, records rejected claims and gaps, and publishes `adjudication.md` and `report.md`. The run seals only if every required lens and deterministic check completed against the unchanged snapshot.

## Codebase audit

### Scope

An unqualified audit covers the complete Git repository: HEAD, index, working tree, tracked files, and non-ignored untracked files. Generated and vendored material remains in the inventory but is treated according to provenance and ownership.

The audit never executes repository-owned scripts, tests, builds, binaries, package managers, executable configuration, or installed project tools. It runs only bundled analyzers and read-only Git inspection.

### Inventory and lanes

The orchestrator creates a semantic subsystem inventory rather than dividing work by arbitrary path count. It establishes an immutable lane plan with:

- at least one non-overlapping subsystem lane;
- `coverage-boundaries` validation;
- `cross-boundary-properties` validation.

Subsystem lanes run concurrently. Validators begin only after all subsystem reports persist. A critical finding does not stop remaining safe coverage.

### Completion

The report separates proven findings, evidence-backed structural risks, rejected candidates, and coverage gaps. It does not become a remediation roadmap. Interrupted audits may resume only against the exact unchanged snapshot and issue capabilities only for missing lanes.

## New codebase design

### Scope

The skill designs a codebase before scaffolding. It may write only its design artifacts. It must not create a repository, install packages, generate application code, commit, push, deploy, or access credentials.

### Decision process

Interview one coherent decision cluster at a time. Explain why a choice matters, reuse prior answers, expose contradictions, and offer one recommendation with meaningful alternatives. The user may approve, delegate, defer, reject, or mark a decision out of scope.

Every decision is append-only as `decision-<decision-id>-<revision>.md` in the run root. A deferral must name an owner, trigger, milestone, and why it does not block the first implementation slice.

Research is limited to user-authorized local repositories, organization repositories available through existing authentication, public repositories, and official documentation. Record license and transferability assumptions.

### Challenges and signoff

The immutable plan includes decision lanes and independent challenges for feasibility, simplicity, security, operability, and verification. A proven contradiction reopens the affected decision.

Completion requires explicit user signoff and exactly:

- `architecture.md`
- `diagrams.md`
- `test-strategy.md`
- `implementation-plan.md`
- `open-questions.md`

The sealed pack also includes combined Markdown and offline HTML.

## Sealed artifact roots

```text
.friendly-adversary/
├── pr-reviews/<run-id>/
├── audits/<run-id>/
└── designs/<run-id>/
```

The output root is optional to ignore and must never be added to `.gitignore` by a skill.

PR review does not create this repository output before sealing. Its in-progress packet remains in private user-scoped state and is published to the root above only after snapshot and artifact verification succeed.

## Non-goals

- CI or GitHub pull request automation
- DAST, browser scanning, or production probing
- automatic fixes or source modification
- organization-wide convention learning or embeddings
- support for languages beyond TypeScript, JavaScript, and Python
- perfect bug detection or formal correctness proof
- confidence by agent vote count
- scaffolding from the design skill

## Acceptance gates

A release is acceptable only after:

- typecheck, validation, unit, integration, public-release, and offline packed-smoke gates pass;
- generated Claude Code and Codex copies are byte-identical to canonical runtime assets;
- the MCP bundle exposes exactly one tool and proves stdio-only, no-network operation;
- PR review dogfood completes on representative TypeScript and Python changes;
- audit dogfood covers a complete dirty repository and rejects a changed snapshot;
- design dogfood completes decisions, challenges, explicit signoff, HTML generation, sealing, and verification;
- Windows, macOS, Linux, and WSL-supported paths remain portable;
- publication remains blocked until licensing evidence authorizes the intended distribution.
