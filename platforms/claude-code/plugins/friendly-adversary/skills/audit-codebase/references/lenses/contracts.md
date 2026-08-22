---
id: contracts
title: Contracts
version: 1
languages: [typescript, javascript, python]
applies_to: [api, schema, serialization, public-interface]
evidence: [git-diff, schemas, typecheck, call-sites, tests]
evaluation_tags: [compatibility, interfaces, serialization]
---

# Contracts

## Property

Reachable producers and consumers agree on requests, responses, public functions, events, and durable identifiers.

## Failure classes

- breaking request or response change
- incompatible public function signature
- durable identifier change
- incompatible serialization
- frontend and backend type drift
- webhook or event payload regression
- pagination contract regression

## Applicability

For PR review, run when routes, payloads, schemas, public functions, durable identifiers, serialized data, events, or pagination behavior change. For codebase audit, run wherever a subsystem owns or consumes those contracts.

## Audit mode

For `audit-codebase`, inventory the current public and durable contracts, find their reachable producers and consumers, and test whether those parties agree now. Do not require a changed interface or infer a historical break. Report only a current incompatibility, ambiguity, or migration gap with a concrete consumer path.

## Evidence to inspect

- API and schema definitions
- frontend and backend call sites
- typecheck and contract-test output
- serialization and parsing code
- public documentation and versioning behavior

## Investigation procedure

1. List every changed interface and durable identifier for PR review, or every owned and consumed interface in the audited subsystem.
2. Compare old and new accepted inputs and emitted outputs.
3. Search all in-repository consumers and producers.
4. Trace serialization, defaults, nullability, pagination, and errors.
5. Check whether the transition is additive, versioned, redirected, or otherwise compatible.
6. Record unavailable external consumers as uncertainty rather than a confirmed defect.

## Abstain when

The claim depends on an external consumer whose behavior is unavailable locally and no published contract establishes the incompatibility.

## Finding contract

Use the shared finding contract. Name the exact producer, consumer, and incompatible value or behavior.

## Valid finding example

A response field is renamed while an existing frontend call site still reads the old field, causing the page to render an empty state.

## Invalid finding example

An additive optional response field is introduced and no existing consumer behavior changes.
