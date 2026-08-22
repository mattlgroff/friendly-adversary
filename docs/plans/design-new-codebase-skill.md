# `design-new-codebase` skill contract

Status: implemented in 3.0.0

`design-new-codebase` turns an incomplete greenfield idea into an explicit, challenged, user-approved architecture decision pack before scaffolding.

## Contract

- Explicit invocation only.
- The intended project directory must already exist.
- Interview one coherent decision cluster at a time.
- Reuse answers, expose contradictions, and never infer consensus from silence.
- Record decisions as append-only four-digit revisions.
- Research only user-authorized local, organization, public, and official sources.
- Record license and transferability assumptions for reference implementations.
- Run independent feasibility, simplicity, security, operability, and verification challenges.
- Explicit user signoff is required for completion.
- Never initialize a repository, install packages, generate application code, commit, push, deploy, or access credentials.
- Write only through `record_artifact` under `.friendly-adversary/designs/<run-id>/`.

## Required final pack

- `architecture.md`
- `diagrams.md`
- `test-strategy.md`
- `implementation-plan.md`
- `open-questions.md`
- combined `design-pack.md`
- deterministic offline `design.html`

## Acceptance

- Invalid decision revision paths are rejected.
- Challenges must finish before final publication.
- A missing signoff blocks completion.
- A changed or substituted design root invalidates the authority.
- Sealing and verification cover every persisted decision, challenge, reference, and final document.
