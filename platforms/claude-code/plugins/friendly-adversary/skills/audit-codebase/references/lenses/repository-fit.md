---
id: repository-fit
title: Repository fit
version: 1
languages: [typescript, javascript, python]
applies_to: [all]
evidence: [git-diff, changed-files, repository-guidance, code-search, dependency-graph]
evaluation_tags: [architecture, conventions, duplication]
---

# Repository fit

## Property

The reviewed code fits the repository's intentional structure, dependency direction, and reuse conventions unless a PR explicitly and safely changes them.

## Failure classes

- duplicated existing behavior
- misplaced code or ownership
- invalid dependency direction
- bypassed repository abstraction
- inconsistent naming or file organization that changes discoverability
- unnecessary new dependency

## Applicability

Run for every PR change and every codebase-audit subsystem. Spend more effort on new or boundary-defining files, modules, dependencies, and cross-package imports.

## Audit mode

For `audit-codebase`, map current canonical owners, public boundaries, dependency directions, and reuse conventions across the complete snapshot. Do not require changed files or a base revision. This lens owns cross-package placement, dependency direction, bypassed shared abstractions, and duplicated behavior across owners; anti-slop owns needless complexity inside one owner.

## Evidence to inspect

- repository guidance from the pinned review packet
- changed files and nearby siblings for PR review or owned current files for codebase audit
- symbol and text searches for equivalent behavior
- package and workspace boundaries
- import and dependency graph evidence
- existing tests for similar code

## Investigation procedure

1. Map each changed file for PR review or each owned canonical file for codebase audit to its package and responsibility.
2. Find the nearest existing implementations with similar names, inputs, outputs, or side effects.
3. Trace new imports for PR review or material current imports for codebase audit across package boundaries.
4. Compare placement and naming with neighboring features.
5. Determine whether deviation is intentional and documented.
6. Report only deviations that create duplicated behavior, broken ownership, unsafe coupling, or material maintenance risk.

## Abstain when

Repository boundaries cannot be inferred from guidance, package metadata, or nearby code.

## Finding contract

Use the shared finding contract. Cite the proposed location and the existing convention or implementation it conflicts with.

## Valid finding example

A new authorization helper duplicates an existing shared helper but omits one tenant check, causing two security behaviors to drift.

## Invalid finding example

A file name differs from a common pattern but remains discoverable and has no behavioral or ownership consequence.
