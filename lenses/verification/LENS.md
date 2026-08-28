---
id: verification
title: Verification
version: 1
languages: [typescript, javascript, python]
applies_to: [all]
evidence: [git-diff, tests, typecheck, lint, build, coverage]
evaluation_tags: [tests, proof, regression, oracle-independence, tautology]
---

# Verification

## Property

Material reviewed behavior has focused, independent proof whose oracle can disagree with the implementation and fail for the relevant regression.

## Failure classes

- missing regression proof for risky behavior
- test that cannot reach the reviewed path
- assertion that cannot detect the defect
- tautological oracle derived from the same implementation, algorithm, constant, fixture builder, or source text as the result under test
- source-presence assertion presented as behavioral proof when the text is not itself an externally observable contract
- snapshot or golden output generated or accepted from the current implementation without an independent contract
- shared test helper or mock that reproduces the production defect and makes actual and expected results agree
- no-op, no-throw, existence-only, or overly broad assertion that stays green when the claimed behavior is wrong
- implementation-detail assertion that breaks on safe refactors but survives a material behavior defect
- mocked boundary that hides the integration risk
- skipped, flaky, or silently filtered test
- test removed, weakened, skipped, or re-recorded without equivalent replacement proof
- test file that is not collected by the intended local runner or CI group
- typecheck, lint, build, or test failure
- unverified negative or permission path

## Applicability

Run for every PR change and codebase-audit subsystem. Focus effort on material behavior, protected actions, data transitions, and error paths.

## Audit mode

For `audit-codebase`, map material current behaviors and invariants to tests, static evidence, and operational proof. Do not require a changed behavior or changed test. Inspect representative tests for each high-risk behavior rather than mechanically listing every test. Identify current high-risk paths that lack meaningful proof, but classify missing evidence as a coverage gap unless a concrete false-confidence mechanism or regression path is established. A tautological or disconnected test is a finding only when it creates false confidence about a concrete behavior or regression path.

## Evidence to inspect

- changed and nearby tests for PR review or owned current tests for codebase audit
- test, lint, typecheck, and build artifacts
- coverage when already configured
- production entry points and test seams
- assertion or oracle provenance, including expected-value helpers and imported production constants
- fixtures, builders, mocks, fakes, snapshots, golden files, and failure-path tests
- test discovery configuration and intended local or CI runner groups
- relevant requirements, public contracts, bug reports, and independently known examples

## Investigation procedure

1. Map every material behavior change for PR review or material current behavior for codebase audit to its claimed proof.
2. Trace each representative test from setup through the real production path to an observable assertion. Do not infer coverage from its name, location, or passing status.
3. Trace the expected value or oracle to an independent requirement, invariant, trusted implementation, known example, or externally observable contract. Determine whether actual and expected results can be wrong in the same way because they share logic or data.
4. Perform a defect-sensitivity thought experiment. Name one plausible changed branch, operator, literal, ordering rule, authorization outcome, or side effect. Establish whether the assertion would turn red without editing the repository.
5. For source-text and generated-artifact assertions, determine whether the exact text is the public output being promised. Literal or snapshot assertions are valid when an independent contract requires that artifact; they are weak when used as a substitute for exercising behavior.
6. Inspect mocks, fakes, fixtures, builders, snapshots, and helpers for common-mode failure with the implementation. A helper is not suspect merely because both test and production code use it; prove that the shared dependency can conceal the claimed defect.
7. Inspect negative, boundary, denied-access, dependency-failure, retry, and state-transition cases when applicable.
8. Verify changed tests do not remove, loosen, skip, or blindly re-record earlier proof, and verify the intended runner or CI group actually collects them.
9. Distinguish a proven false-confidence defect from missing confidence. Record missing proof as a coverage gap unless it creates a concrete product failure.

## Abstain when

The relevant behavior cannot be exercised locally and no repository-level proof contract is available.

## Finding contract

Use the shared finding contract. A missing test alone is normally a coverage gap, not a defect. Report a tautological test only when you can identify the shared oracle or duplicated reasoning, the concrete behavior it claims to prove, and a plausible defect that leaves the assertion green. Do not demand literal expected values for complex outputs when an independent reference implementation, property, invariant, or approved golden artifact is the stronger oracle.

## Valid finding example

A changed invoice implementation rounds every line before summing, and its only test computes the expected total with the identical per-line rounding loop. The documented contract requires summing before rounding, so the test remains green while three small line items produce the wrong charged total.

## Invalid finding example

A generated stylesheet test asserts exact theme tokens that the repository documents as its shipped public artifact. The literals come from that independent contract, so checking their presence is behaviorally meaningful rather than tautological.
