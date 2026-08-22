---
id: security
title: Security
version: 1
languages: [typescript, javascript, python]
applies_to: [api, auth, input, dependency, filesystem, network, secret, serialization]
evidence: [git-diff, semgrep, secret-scan, dependency-scan, call-sites, tests]
evaluation_tags: [authorization, injection, secrets, trust-boundaries]
---

# Security

## Property

Untrusted input cannot cross a protected boundary or trigger a protected side effect without the required validation and authorization.

## Failure classes

- missing backend authorization
- injection
- path traversal
- unsafe deserialization
- secret exposure
- insecure token handling
- permission or tenant boundary bypass
- vulnerable dependency on a reachable path
- server-side request forgery

## Applicability

For PR review, run when the change touches routes, authentication, authorization, user input, file or network access, tokens, secrets, dependencies, or serialization. For codebase audit, run on every subsystem with a trust boundary or protected side effect.

## Audit mode

For `audit-codebase`, map the current attack surface, trust boundaries, protected side effects, credential paths, parsers, file and network access, and dependency exposure. Trace current reachable paths without requiring changed code. Scanner output remains a lead and becomes a finding only after current reachability and impact are proven.

## Evidence to inspect

- Semgrep and other SAST output
- secret and dependency scan output
- entry points and side-effect boundaries
- validation and authorization middleware
- token purpose, scope, and expiry checks
- tests that exercise denied access

## Investigation procedure

1. Identify untrusted inputs and protected effects.
2. Trace enforcement at the backend effect boundary.
3. Distinguish frontend gating from backend authorization.
4. Follow encoded, parsed, and serialized values across boundaries.
5. Verify that scanner findings are reachable in the changed PR surface or current audited system.
6. Attempt to disprove the claim using guards, sanitizers, or unreachable paths.

## Abstain when

Reachability or enforcement depends on infrastructure or identity configuration unavailable to the local review. Record the gap.

## Finding contract

Use the shared finding contract. State the attacker-controlled input, missing control, protected effect, and impact.

## Valid finding example

A new backend mutation relies only on a hidden frontend button and performs the side effect without checking the caller's tenant permission.

## Invalid finding example

Semgrep flags a string concatenation in test-only code that never reaches a command, query, template, or other interpreter.
