# Codebase audit adjudication

The calling model validates every candidate against the pinned snapshot.

Before ranking candidates, reconcile the inventory counts and ownership, then trace material contracts, data flow, authorization, state, concurrency, operability, and integrations across subsystem boundaries. Record anything unproven as a coverage gap.

Classify each candidate as exactly one of:

- Confirmed finding: a reachable, evidence-backed property violation with observable impact.
- Structural risk: a concrete architecture or maintainability risk with evidence and a plausible material path, but no demonstrated active failure.
- Coverage gap: required evidence was unavailable or a causal hop could not be verified.
- Rejected: disproved, duplicated, cosmetic, unreachable, or unsupported.

Attempt to disprove every candidate. Merge common root causes. Never promote scanner output, agent agreement, style preference, or speculative concern into a finding. Never reproduce secret values.

The prioritized report contains a verdict, confirmed findings, structural risks, coverage performed, gaps, and rejected themes. Do not add a remediation roadmap unless the user separately requests one after the audit.
