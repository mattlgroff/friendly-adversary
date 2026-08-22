# Adjudication and report

## Validate claims

For each lens claim:

1. Re-open the cited code and artifact.
2. Confirm the location exists in the pinned change.
3. Trace a realistic entry point to the claimed outcome.
4. Search for guards, sanitizers, callers, tests, or configuration that disprove it.
5. Do not state a causal chain until every hop has been traced in the reviewed code. Name any unverified hop as a coverage gap.
6. Check whether tests intentionally pin the disputed behavior. If they do, report that fact and evaluate the behavior itself instead of claiming the branch is untested or accidental.
7. Reject style preferences, broad refactors, duplicates, stale claims, and unreachable scanner output.
8. Merge claims with the same underlying cause.
9. Never copy a credential, token, private key, or secret value into Markdown. Report only the secret class and location, and replace any necessary excerpt with `[REDACTED]`.

Do not present an inference, concern, or coverage gap as a confirmed finding. The report summary must not be stronger or less qualified than the supporting adjudication. Before writing the summary, compare every headline claim to its detailed evidence and preserve all material caveats.

## Priority

- critical: direct severe security, data-loss, or irreversible business impact on a reachable path
- high: likely correctness, authorization, compatibility, or integrity failure that should block the PR
- medium: material but bounded defect that may be nonblocking with an explicit decision
- low: proven limited defect worth fixing, never a style preference

Do not use numeric confidence. State remaining uncertainty in prose.

## `adjudication.md`

Provide only the adjudication body to `record_artifact`. Do not include `- Model:`, `- Effort:`, or `- Host:` lines because the tool adds the immutable run-plan metadata. Record accepted findings with independent validation and priority, rejected claims with disproving evidence, and coverage gaps.

## `report.md`

Report the verdict, confirmed findings, coverage, gaps, base, head, working tree state, and artifact directory.

Before completion, search both Markdown files for secret values surfaced by agents or tools and redact them. Do not reproduce a scanner match value even when the raw local artifact contains it.
