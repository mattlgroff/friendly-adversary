# `audit-codebase` skill contract

Status: implemented in 3.0.0

`audit-codebase` reviews a complete existing repository rather than a pull request diff.

## Contract

- Explicit invocation only.
- Full repository is the default and only initial scope.
- Snapshot includes HEAD, index, working tree, tracked files, and non-ignored untracked files.
- Only bundled WebAssembly analyzers and read-only Git inspection run.
- Repository scripts, tests, builds, binaries, executable configuration, package managers, and installed tools never run.
- The orchestrator creates a semantic subsystem inventory and immutable lane plan.
- Subsystems run concurrently, followed by calling-model adjudication.
- Every lane writes through `record_artifact` under `.friendly-adversary/audits/<run-id>/`.
- Final adjudication distinguishes findings, structural risks, rejected candidates, and gaps.
- It does not create a remediation roadmap.
- Resume is allowed only for missing lanes against the exact unchanged snapshot.

The calling model checks inventory coverage and cross-subsystem properties during adjudication. Those checks do not need separate agents or artifacts.

## Acceptance

- Complete inventory is independently knowable on a small fixture.
- Dirty and untracked state is pinned.
- Analyzer batches remain bounded on large repositories.
- Parallel lane publication does not contend on shared artifacts.
- Snapshot mutation prevents resume and sealing.
- Deterministic offline HTML and integrity verification succeed.
