---
id: verification
title: Verification
version: 1
languages: [typescript, javascript, python]
applies_to: [all]
evidence: [git-diff, tests, typecheck, lint, build, coverage]
evaluation_tags: [tests, proof, regression]
---

# Verification

## Property

Material reviewed behavior has focused proof that would fail for the relevant regression.

## Failure classes

- missing regression proof for risky behavior
- test that cannot reach the reviewed path
- assertion that cannot detect the defect
- mocked boundary that hides the integration risk
- skipped, flaky, or silently filtered test
- typecheck, lint, build, or test failure
- unverified negative or permission path

## Applicability

Run for every PR change and codebase-audit subsystem. Focus effort on material behavior, protected actions, data transitions, and error paths.

## Audit mode

For `audit-codebase`, map material current behaviors and invariants to tests, static evidence, and operational proof. Do not require a changed behavior or changed test. Identify current high-risk paths that lack meaningful proof, but classify missing evidence as a coverage gap unless a concrete false-confidence mechanism or regression path is established.

## Evidence to inspect

- changed and nearby tests for PR review or owned current tests for codebase audit
- test, lint, typecheck, and build artifacts
- coverage when already configured
- production entry points and test seams
- assertions, fixtures, mocks, and failure-path tests

## Investigation procedure

1. Map every material behavior change for PR review or material current behavior for codebase audit to its proof.
2. Verify each test reaches the reviewed production path.
3. Check that the assertion fails for the old or broken behavior.
4. Inspect negative, boundary, denied-access, and dependency-failure cases.
5. Distinguish a proven defect from missing confidence.
6. Record missing proof as a coverage gap unless it creates a concrete product failure.

## Abstain when

The relevant behavior cannot be exercised locally and no repository-level proof contract is available.

## Finding contract

Use the shared finding contract. A missing test alone is normally a coverage gap, not a defect.

## Valid finding example

A claimed authorization fix has a test that mocks the authorizer to always allow, so the denied-access regression remains completely unexercised.

## Invalid finding example

Line coverage decreases slightly in unchanged glue code with no material behavior or regression risk.
