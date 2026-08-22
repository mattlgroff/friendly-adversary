---
id: correctness
title: Correctness
version: 1
languages: [typescript, javascript, python]
applies_to: [logic, api, ui, worker, cli]
evidence: [git-diff, tests, typecheck, code-search]
evaluation_tags: [logic, edge-cases, error-handling]
---

# Correctness

## Property

For reachable inputs, the reviewed behavior produces the intended result or an explicit safe failure without corrupting state.

## Failure classes

- incorrect branch or condition
- missing edge case
- unsafe null or empty handling
- swallowed or misclassified error
- partial side effect
- incorrect parsing, formatting, or transformation
- behavior that contradicts tests or public intent

## Applicability

For PR review, run when the change alters executable behavior, transformations, validation, error handling, or user-visible output. For codebase audit, run on owned executable behavior and public outcomes.

## Audit mode

For `audit-codebase`, trace current reachable behavior from entry points to outcomes and compare it with current tests, schemas, documentation, and caller expectations. Enumerate boundary inputs and dependency failures without requiring before-and-after evidence. Report only a concrete current counterexample or explicit unsafe failure path.

## Evidence to inspect

- changed execution paths for PR review or owned current paths for codebase audit
- callers and callees
- focused tests and failures
- typecheck and lint artifacts
- input schemas and validation
- nearby behavior with equivalent inputs

## Investigation procedure

1. Trace each changed branch for PR review or each material owned branch for codebase audit from a realistic entry point to its outcome.
2. Enumerate boundary inputs, empty inputs, invalid inputs, and failures from dependencies.
3. Compare the result with declared intent, caller expectations, tests, and schemas. For PR review, also compare before and after when that evidence is available.
4. Check whether errors leave partial state or misleading success.
5. Attempt to construct a concrete counterexample.
6. Reject observations that cannot be reached through an actual call path.

## Abstain when

The intended behavior cannot be established from requirements, tests, interfaces, or surrounding code.

## Finding contract

Use the shared finding contract. Include exact inputs and steps that reach the incorrect result.

## Valid finding example

An empty collection passes validation, then the code reads the first element and returns a success response with an undefined identifier.

## Invalid finding example

A variable could be renamed for clarity but the current name does not cause incorrect behavior.
