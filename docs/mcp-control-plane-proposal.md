# MCP artifact control plane

Status: implemented

## Decision

Friendly Adversary exposes one local stdio MCP tool named `record_artifact`. It replaces workflow-specific write tools with one capability-scoped artifact interface.

This does not grant arbitrary repository write access. The runtime creates an external authority record and gives each agent a capability for only its assigned run path. The allowed roots are:

- `.friendly-adversary/pr-reviews/<run-id>/`
- `.friendly-adversary/audits/<run-id>/`
- `.friendly-adversary/designs/<run-id>/`

## Operations

- `preflight` proves that an authority, capability, workflow, and path match before expensive analysis.
- `establish` publishes the audit inventory or design brief and creates capabilities for the first workflow phase.
- `publish` writes one assigned Markdown artifact.
- `complete` publishes the fixed final artifact set for a workflow.

## Guarantees

- stdio only, with no HTTP server or port;
- no network listener or client access;
- exact run and snapshot binding;
- exact flat run-root filename, including an explicitly reserved next decision revision;
- artifact count and byte limits;
- safe portable relative Markdown paths only;
- no-clobber publication;
- authenticated reserved-slot publication, interrupted-write recovery, and byte-identical publish retry;
- no source, configuration, Git, or external-system writes;
- compact receipts instead of copying full reports through the parent model.

The process exits when stdio closes. A missing MCP tool makes the workflow incomplete. There is no filesystem or shell fallback.

The combined tool is not globally annotated idempotent because plan establishment changes authority state. Interrupted workflows recover explicitly through `resume-audit` or `resume-design`.
