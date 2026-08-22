# Lens authoring

A lens is a focused adversarial review unit. It searches for a bounded family of failures and tests one explicit property of the proposed change.

## Directory contract

```text
lenses/<lens-id>/
└── LENS.md
```

Copy an existing lens directory to create a new one. Change the directory name, frontmatter `id`, frontmatter `title`, and first `# <title>` heading together. The identifier and directory must match, and the heading must match the title.

## Required frontmatter

```yaml
---
id: repository-fit
title: Repository fit
version: 1
languages: [typescript, javascript, python]
applies_to: [all]
evidence: [git-diff, changed-files, repository-guidance]
evaluation_tags: [architecture, conventions, duplication]
---
```

Fields:

- `id`: stable lowercase identifier with hyphens
- `title`: human-facing title
- `version`: positive integer contract version
- `languages`: supported language identifiers
- `applies_to`: change-surface tags used by the orchestrator
- `evidence`: required or preferred artifact classes
- `evaluation_tags`: labels used to group evaluation cases

## Required body sections

Every `LENS.md` must use these headings in this order:

1. `# <title>`
2. `## Property`
3. `## Failure classes`
4. `## Applicability`
5. `## Audit mode`
6. `## Evidence to inspect`
7. `## Investigation procedure`
8. `## Abstain when`
9. `## Finding contract`
10. `## Valid finding example`
11. `## Invalid finding example`

## Authoring rules

- Define one property, not a general persona.
- Name observable failure classes.
- Require a concrete failure path.
- Prefer evidence that can disprove the claim.
- Tell the lens when to abstain.
- Define how the same property is evaluated against one complete codebase snapshot without change-only evidence.
- Do not assign final severity or confidence.
- Do not recommend broad refactors without a demonstrated defect.
- Do not repeat another lens's primary scope.
- Keep the file under 250 lines.

## Finding contract

Each finding is Markdown:

```markdown
### <short factual title>

- Failure class: <one class from this lens>
- Property violated: <the lens property>
- Location: `<path>:<line>`
- Evidence: <artifact or code path>
- Failure path: <inputs and steps that reach the behavior>
- Impact: <observable result>
- Disproof attempted: <what was checked that could have invalidated the claim>
- Uncertainty: <remaining proof gap, or none>
```

The lens may return:

```markdown
# No supported findings

State what was inspected and why no claim met the evidence bar.
```

Abstention is distinct from no findings:

```markdown
# Abstained

State which required evidence or applicability condition was missing.
```

## Extension test

A new lens is correctly isolated when:

1. It can run using only the common review packet and named evidence.
2. It produces the standard finding contract.
3. Removing it does not require changing any other lens.
4. The collector discovers it from directory metadata without application-code changes.

Before a new lens is promoted into a future benchmark-backed release or receives a non-`inherit` model override, add at least one positive and one negative executable evaluation case.

Run `npm run sync:plugins` after adding a lens. The command copies its canonical reference into both platform skills. The review CLI discovers installed lens assets at runtime and dispatches every selected lens through the required local Codex CLI runtime, so a separate default list or named-agent adapter is not required.
