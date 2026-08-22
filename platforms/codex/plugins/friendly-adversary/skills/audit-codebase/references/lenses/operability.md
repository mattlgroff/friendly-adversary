---
id: operability
title: Operability
version: 1
languages: [typescript, javascript, python]
applies_to: [service, worker, queue, deployment, configuration, error-handling]
evidence: [git-diff, logs, errors, configuration, build, recovery]
evaluation_tags: [observability, recovery, configuration]
---

# Operability

## Property

Failures are bounded, attributable, observable, and recoverable without misleading operators or users.

## Failure classes

- swallowed or misleading failure signal
- unbounded retry, timeout, or resource use
- unrecoverable partial operation
- missing cleanup or rollback
- unsafe configuration default
- broken packaging or deployment path
- health signal that reports success during failure
- loss of diagnostic context

## Applicability

For PR review, run when the change affects services, workers, queues, retries, configuration, deployment, logging, metrics, health checks, or error handling. For codebase audit, run on every operational runtime boundary.

## Audit mode

For `audit-codebase`, inspect current services, workers, queues, configuration, failure handling, recovery, and observability. Use current runtime entry points and operational contracts rather than a diff. Report only a failure mode that is reachable or a concrete structural risk that operators cannot safely detect or recover from.

## Evidence to inspect

- emitted logs, metrics, status, and errors
- retry, timeout, fallback, and circuit-breaking behavior
- cleanup and rollback paths
- configuration defaults and validation
- build, packaging, and deployment artifacts
- nearby operational conventions

## Investigation procedure

1. Enumerate likely failure modes for the changed path in PR review or the owned runtime path in codebase audit.
2. Trace what the caller, user, and operator observe for each failure.
3. Check retry and timeout bounds plus resource cleanup.
4. Check recovery, rollback, and safe restart behavior.
5. Verify configuration errors fail clearly and safely.
6. Report only defects with an operational consequence, not requests for more logging in general.

## Abstain when

The relevant runtime environment is unavailable and no repository contract establishes the expected operational behavior.

## Finding contract

Use the shared finding contract. State the failure, emitted signal, operator-visible consequence, and recovery limitation.

## Valid finding example

A background job catches every exception and returns success, preventing retries and making failed work invisible to operators.

## Invalid finding example

A log message could include another field, but the existing error remains attributable and actionable.
