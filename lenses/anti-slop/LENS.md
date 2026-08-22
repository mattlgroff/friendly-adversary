---
id: anti-slop
title: Anti-slop maintainability
version: 1
languages: [typescript, javascript, python]
applies_to: [logic, api, ui, worker, cli, architecture]
evidence: [git-diff, changed-files, deterministic-analysis, repository-guidance, code-search, dependency-graph]
evaluation_tags: [maintainability, structural-simplicity, anti-slop, abstraction-quality]
---

# Anti-slop maintainability

## Property

The reviewed code preserves structural clarity: it uses the repository's canonical ownership boundaries, keeps necessary concepts explicit, and avoids unnecessary branches, indirection, weak type boundaries, and orchestration complexity.

## Failure classes

- avoidable structural complexity with a concrete simpler design
- ad hoc branching or mode growth in an existing flow
- abstraction that adds indirection without reducing concepts or duplication
- feature logic placed outside its canonical owner
- duplicated canonical helper or behavior
- weak type boundary that forces casts, unknown, any, optionality, or runtime probing downstream
- oversized or incohesive module with a natural decomposition
- unnecessarily sequential independent work
- non-atomic related updates that can expose partial state
- supported anti-slop deterministic diagnostic that represents material maintenance risk in context

## Applicability

Run for changes that add or restructure executable code. For documentation-only, generated-only, dependency-lock-only, or mechanical formatting changes, inspect applicability and abstain if there is no maintainability claim to test.

This lens is intentionally demanding, but its rules are evidence prompts rather than universal truths. A deterministic anti-slop diagnostic is not a finding until repository context and a reviewed execution path support it.

## Audit mode

For `audit-codebase`, evaluate the current snapshot without requiring a diff, changed lines, or a prior implementation. Map current concepts, branches, state transitions, fallbacks, wrappers, and ownership boundaries, then prove a concrete maintenance or failure burden and a simpler behavior-preserving structure. Inspect deterministic diagnostics across owned canonical files, group generated copies with their owner, and reject diagnostics that are merely stylistic or cannot be tied to material risk. Repository-fit owns cross-package placement, dependency direction, and reuse conventions; this lens owns needless complexity inside the selected owner.

## Evidence to inspect

- for PR review, the full diff and changed-file line counts against the base revision
- bundled Oxlint `anti-slop(...)` diagnostics for the reviewed PR lines or audit-owned canonical files
- repository guidance and neighboring implementations
- searches for canonical helpers, models, and ownership boundaries
- branch, mode, option, fallback, and wrapper additions
- async orchestration and multi-step state updates
- existing abstractions the reviewed code extends or bypasses
- tests that reveal the intended boundary and behavior

## Investigation procedure

1. State the concepts, branches, state transitions, and ownership boundaries introduced by the PR or present in the audited subsystem.
2. Inspect every distinct bundled `anti-slop(...)` diagnostic in the reviewed scope. For PR review, require changed-line intersection or proof that the PR makes it reachable or materially worse. For codebase audit, inspect owned canonical files without a changed-line requirement. Group byte-identical generated distribution copies with their canonical source and analyze that source once.
3. Search for an existing canonical helper, model, service, or package before claiming duplication or wrong placement.
4. Look for a code-judo alternative: a behavior-preserving restructuring that removes concepts, branches, modes, wrappers, or duplicated paths rather than merely relocating them.
5. Treat an unusually large file as investigation evidence, not an automatic finding. In PR review, note whether the PR crosses an existing size threshold. In audit, assess current cohesion. In both modes, prove material navigability or ownership harm and a natural decomposition.
6. Trace added conditionals and optional modes through the surrounding flow. Report only when they create a concrete reasoning, extension, or failure burden.
7. Test whether type assertions, broad types, runtime probing, or silent fallbacks conceal an invariant that can be expressed at the boundary.
8. Check whether independent operations are serialized and whether related writes can expose half-applied state. Require a clear simpler or safer structure before reporting.
9. Attempt to disprove each candidate using repository conventions, performance constraints, generated-code boundaries, compatibility needs, and tests.
10. Prefer a small set of high-conviction structural findings over cosmetic or taste-based feedback.

Do not copy the native analyzer output into the lens report. Cite only the minimal diagnostic and source evidence needed to support or disprove a candidate.

## Abstain when

The change has no meaningful executable or architectural surface, or the repository lacks enough surrounding context to distinguish intentional design from accidental complexity.

## Finding contract

Use the shared finding contract. Every finding must identify the reviewed structure, the concrete maintenance or failure burden it creates, the repository evidence supporting a cleaner alternative, and the attempted disproof. Do not report a deterministic diagnostic by itself. Do not assign final severity or demand a broad rewrite without a specific behavior-preserving path.

## Valid finding example

The change adds three feature-specific conditionals to a shared request dispatcher even though the repository's existing policy objects own the same decision. The new branches duplicate authorization ordering in two paths, and moving the decision into the existing policy removes the duplication without changing behavior.

## Invalid finding example

A changed file is now 1007 lines, so it must be split, even though the added section is cohesive, generated, and no natural ownership boundary or concrete maintenance burden was established.
