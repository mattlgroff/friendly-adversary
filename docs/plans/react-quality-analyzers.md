# React Doctor and Shadscan analyzers

Status: future release, not part of 3.0.3

This plan authorizes no current dependency, packaging, analyzer, or runtime change.

Friendly Adversary should evaluate two additional deterministic inputs for React repositories:

- React Doctor for source-level React correctness, performance, security, accessibility, and maintainability diagnostics.
- Shadscan for its default static React and shadcn UI audit. Its rendered-browser mode remains out of scope because Friendly Adversary audit does not start or navigate applications.

These are analyzers, not lenses. They should feed native output into the existing collector and existing lenses. They do not need another MCP tool, agent type, workflow, service, or fallback.

## Smallest implementation

1. Pin one upstream package version, source commit, license, and dependency tree for each candidate.
2. Prove the package API can scan an explicit immutable snapshot path without installing anything in the reviewed repository.
3. Disable telemetry, prompts, self-installation, hooks, CI changes, agent launching, browser checks, and network access.
4. Bundle the accepted package into the existing Node.js runtime. Do not add a process, service, MCP tool, skill, lens, or fallback.
5. Add one applicability check to the existing collector. React Doctor applies to detected React source. Shadscan applies only when its supported React application signals are present.
6. Save each analyzer's native machine-readable output unchanged beside the existing deterministic outputs.
7. Let existing lenses inspect those outputs. React Doctor primarily informs correctness, verification, security, and anti-slop. Shadscan primarily informs correctness and verification, with security or operability used only when a diagnostic reaches those properties.
8. Add fixtures for a clean project, each representative diagnostic class, a monorepo, malformed source, cancellation, and hostile paths.
9. Pass the existing offline package, Windows, macOS, Linux, and WSL2 gates, then dogfood both PR review and codebase audit.

An applicable bundled analyzer is required. If it cannot run, the review is incomplete. There is no alternate analyzer.

## Current licensing decision

Shadscan 0.17.0 declares MIT, supports Node.js 18 or newer, and says its default audit is deterministic and read-only. It can proceed to dependency and portability review. Its `--apply`, MCP, and rendered UI modes are not part of this integration.

React Doctor 0.9.12 carries additional restrictions affecting some model-evaluation and hosted uses. Do not vendor, redistribute, or evaluate it until counsel or written upstream permission confirms compatibility with Friendly Adversary's GPL-3.0-only distribution and evaluation work.

Recheck versions and terms when implementation begins.

## Acceptance decision

Adopt an analyzer only if it adds supported findings or useful disproofs beyond Semgrep and Oxlint at acceptable runtime cost. Reject it if it requires repository mutation, project execution, network access, a native binary, a second orchestration path, or legal terms incompatible with local AI-assisted evaluation.

## Upstream references

- React Doctor: https://github.com/millionco/react-doctor/tree/main/packages/react-doctor
- Shadscan CLI: https://github.com/TheOrcDev/shadscan/tree/main/packages/cli
