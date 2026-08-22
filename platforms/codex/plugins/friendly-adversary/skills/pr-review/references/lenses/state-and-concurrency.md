---
id: state-and-concurrency
title: State and concurrency
version: 1
languages: [typescript, javascript, python]
applies_to: [async, queue, cache, transaction, retry, cancellation, state]
evidence: [git-diff, tests, call-sites, runtime-invariants]
evaluation_tags: [races, idempotency, retries, cancellation]
---

# State and concurrency

## Property

Retries, cancellation, reordering, duplication, and concurrent execution preserve externally visible invariants.

## Failure classes

- non-idempotent retry
- stale callback or response
- lost update
- double write or double charge
- leaked permit or resource
- cancellation resurrection
- cache invalidation race
- unsafe check-then-act sequence

## Applicability

For PR review, run when the change includes asynchronous work, queues, retries, cancellation, caches, transactions, locks, effects, or shared mutable state. For codebase audit, run wherever those mechanisms currently exist.

## Audit mode

For `audit-codebase`, reconstruct current state machines, ownership, locks, retries, cancellation, idempotency, and recovery across subsystem boundaries. Evaluate current interleavings and failure paths without requiring a diff. Report only a reachable race, stale-state path, resurrection, partial commit, or concrete structural risk.

## Evidence to inspect

- async control flow
- retry and timeout configuration
- cancellation cleanup
- transaction boundaries
- cache keys and invalidation
- tests for ordering, duplication, and interruption

## Investigation procedure

1. Identify state transitions and their externally visible invariants.
2. Consider duplicate delivery, retry after partial success, and out-of-order completion.
3. Trace cancellation at every await or blocking boundary.
4. Test stale responses against newer state.
5. Check cleanup on success, failure, and cancellation.
6. Report a finding only with a plausible interleaving or retry sequence.

## Abstain when

The code is purely synchronous and stateless, or the required runtime ordering contract is unavailable.

## Finding contract

Use the shared finding contract. Show the event sequence that violates the property.

## Valid finding example

A retried payment request generates a new idempotency key, so a timeout after a successful charge can create a second charge.

## Invalid finding example

An async function uses several awaits but operates only on immutable local values and has no ordering-sensitive side effects.
