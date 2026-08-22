# Lens contract

A lens is a focused adversarial investigation of one explicit property. It is not a general reviewer persona and it does not decide the final disposition of its allegations.

## Directory shape

```text
lenses/<lens-id>/
└── LENS.md
```

The packaging script discovers these directories and copies the canonical files into both platform skills. A fork can add a lens without changing collector or platform registry code.

## Platform adapter

- On both Codex and Claude Code hosts, the Friendly Adversary CLI invokes the installed local Codex CLI once per selected lens.
- Every PR lens uses the pinned Luna model, reasoning effort, service tier, sandbox, and isolation settings defined by the runtime.
- Run `npm run sync:plugins` and `npm run validate` after adding or changing a lens.
- Generated platform references are not hand-edited. The calling host model performs final adjudication only.

## Required metadata

Every lens starts with YAML frontmatter containing:

- `id`: stable lowercase identifier matching the directory
- `title`: human-readable name
- `version`: positive contract version
- `languages`: supported language identifiers
- `applies_to`: change-surface tags
- `evidence`: evidence classes to inspect
- `evaluation_tags`: case-grouping labels

## Required sections

The body sections appear in this order:

1. Property
2. Failure classes
3. Applicability
4. Evidence to inspect
5. Investigation procedure
6. Abstain when
7. Finding contract
8. Valid finding example
9. Invalid finding example

## Output states

A lens returns supported findings using the shared Markdown fields, `# No supported findings` with inspected evidence, or `# Abstained` with the missing evidence or applicability condition.

Each finding states its failure class, violated property, location, evidence, reachable failure path, impact, attempted disproof, and remaining uncertainty. The lens does not assign final priority or numeric confidence.

## Independence test

A lens is correctly isolated when it can run from the common review packet, emits the common finding contract, can be removed without changing another lens, and has positive and negative evaluation cases.

See [lens-authoring.md](lens-authoring.md) for authoring guidance.
