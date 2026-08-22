# `pr-review` skill contract

Status: implemented in 3.0.0

`pr-review` is the Friendly Adversary skill for reviewing a proposed change against a pinned base. The internal CLI command remains `review`.

## Contract

- Explicit invocation only.
- Existing TypeScript, JavaScript, or Python repository with a meaningful base.
- Clean-tree navigation to an explicitly requested branch, remote branch, PR head, or commit is allowed.
- Bundled analyzers and applicable repository checks are required evidence.
- Nine lenses run independently and concurrently.
- Every agent publishes directly through the single `record_artifact` tool.
- The calling model performs final adjudication.
- The pre-seal packet remains in private user-scoped state outside the repository. A verified sealed run is published to `.friendly-adversary/pr-reviews/<run-id>/`.
- Source, configuration, ignore files, dependencies, commits, and remotes are not modified.
- Completion requires sealing and verification against the unchanged snapshot.

## Layout

```text
skills/pr-review/
├── SKILL.md
├── agents/openai.yaml
├── references/
│   ├── adjudication.md
│   ├── finding-contract.md
│   ├── tooling.md
│   └── lenses/
└── scripts/runtime/
```

The former `friendly-adversary` skill is not retained as an alias. Duplicate entry points would create prompt drift and violate the no-fallback product philosophy.

## Acceptance

- Both hosts expose `pr-review` and do not expose the retired skill.
- The runtime preserves the existing review, mutation, concurrency, publication, and seal guarantees.
- The old invocation fails rather than silently selecting a compatibility path.
