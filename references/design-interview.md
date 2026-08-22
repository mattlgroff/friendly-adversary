# New codebase decision interview

Resolve one coherent cluster at a time and retain prior answers. Surface contradictions instead of asking the same question again. For each unresolved decision provide one recommended choice, meaningful alternatives, consequences, and the evidence needed to decide.

Cover at least:

- product outcomes and first implementation slice;
- language, framework, runtime, and supported platforms;
- repository topology, module boundaries, and dependency direction;
- data model, migrations, ownership, retention, and consistency;
- identity, authorization, tenancy, secrets, and trust boundaries;
- APIs, durable contracts, integrations, queues, retries, and idempotency;
- frontend state, accessibility, and error handling when applicable;
- observability, recovery, deployment, configuration, release, performance, and cost;
- tests, fixtures, quality gates, package management, local development, generated code, documentation, and ownership.

Accepted decisions are append-only flat `decision-<id>-<four-digit-revision>.md` artifacts. A new revision cites the superseded revision and explains why it changed. Research uses `research-<id>.md`. Silence is never acceptance. A deferral requires an owner, trigger, milestone, and proof that it does not block the first implementation slice.
