---
id: data-integrity
title: Data integrity
version: 1
languages: [typescript, javascript, python]
applies_to: [database, schema, migration, query, transaction]
evidence: [git-diff, schemas, migrations, queries, tests]
evaluation_tags: [migrations, transactions, null-semantics]
---

# Data integrity

## Property

Reads, writes, and migrations preserve declared invariants for existing and newly persisted data.

## Failure classes

- unsafe or irreversible migration
- invalid default or nullability transition
- partial multi-write operation
- transaction boundary defect
- incorrect query predicate or join
- duplicate or orphaned record
- unstable ordering or pagination
- precision, rounding, or encoding loss

## Applicability

For PR review, run when migrations, schemas, models, queries, transactions, persistence logic, or data transformations change. For codebase audit, run on subsystems that own or cross persistent data boundaries.

## Audit mode

For `audit-codebase`, derive current data invariants from schemas, migration history, models, queries, and transaction boundaries. Trace current reads, writes, retries, and recovery paths without requiring a changed migration or prior schema. Report only a reachable invariant violation or an evidence-backed structural risk.

## Evidence to inspect

- migration files and ordering
- schema and model definitions
- query and transaction boundaries
- seed and fixture assumptions
- focused persistence tests
- data-shape evidence already available locally

## Investigation procedure

1. State the governing data invariant. For PR review, explain how it behaves before and after the change. For codebase audit, establish its current representation and enforcement.
2. Trace every changed read and write for PR review or every material owned read and write for codebase audit across its transaction boundary.
3. Check existing rows against new defaults, constraints, and nullability.
4. Inspect migration ordering, backfill safety, rollback behavior, and partial failure.
5. Test duplicate, missing, concurrent, and boundary values.
6. Separate production-data uncertainty from defects proven by the repository contract.

## Abstain when

The claimed failure requires a production-only data distribution or database behavior that is unavailable and not established by the code or schema.

## Finding contract

Use the shared finding contract. Name the persisted invariant and show the read, write, or migration sequence that violates it.

## Valid finding example

A new non-null column is added without a default or backfill before the constraint, so the migration fails on every existing row.

## Invalid finding example

A transaction is short and could be reorganized, but all declared writes remain atomic and consistent.
