# Evaluation strategy

## Objective

Find the lowest-resource model and reasoning configuration that preserves useful review quality for each lens and for final adjudication.

Do not optimize for the number of findings. Optimize for confirmed material findings and correct rejection of noise.

## Evaluation unit

Each evaluation case contains:

- a base repository state
- a proposed change
- applicable lenses
- known material findings
- known tempting false positives
- allowed abstentions
- expected deterministic checks

Run each case in a fresh session to prevent authoring context from leaking into the result.

## Experiment matrix

Vary one or more of:

- platform: Claude Code or Codex
- lens model
- lens reasoning or effort level
- orchestrator model
- orchestrator reasoning or effort level
- serial or parallel execution
- deterministic tool availability

The initial baseline compares:

1. One-shot review with the main model.
2. Friendly Adversary with all lens agents inheriting the main model.
3. Friendly Adversary with cheaper lens agents and the same main-model adjudicator.

## Metrics

### Quality

- material finding recall
- finding precision
- false-positive rate
- evidence citation validity
- failure-path reproducibility
- severity calibration
- abstention correctness
- adjudicator acceptance accuracy
- adjudicator rejection accuracy

### Resource use

- input and output tokens when exposed
- turns or tool calls
- wall-clock duration
- deterministic tool duration
- API cost when directly reported
- subscription usage units when directly reported

Never derive a dollar cost for subscription runs when the platform does not expose one.

## Scoring principle

Use a constrained optimization rather than one blended vanity score:

1. Reject configurations below the minimum quality bar.
2. Among passing configurations, minimize resource use.
3. Prefer simpler routing when two configurations are statistically indistinguishable.

Material false positives count more heavily than harmless omissions because they erode trust in the final report. A repeated false positive accepted by the orchestrator is a critical evaluation failure.

## Per-lens recommendation artifact

Write recommendations in Markdown:

```markdown
## security

- Recommended model: <model or inherit>
- Recommended effort: <level>
- Quality bar: passed or failed
- Cases: <count>
- Material recall: <value>
- Precision: <value>
- Median duration: <value>
- Resource notes: <reported values only>
- Rationale: <short evidence-based explanation>
```

Machine-native run traces may remain JSON when emitted by the host or evaluation tool.

## Planned seed cases

The repository ships a versioned evaluation schema, model matrix, and initial case catalog. The planned dataset must include at least:

1. A real bug that needs cross-file repository context.
2. A repository-fit issue involving an existing utility or misplaced dependency.
3. A security or authorization defect with a reachable side effect.
4. A tempting false positive repeated by more than one lens agent.
5. A change where an applicable lens should return no findings.
6. A change where a lens must abstain because required runtime evidence is unavailable.

## Promotion rule

Do not change a default lens model from `inherit` until:

- at least five relevant cases have run on the candidate model
- the candidate meets the lens quality bar
- the confidence interval does not show a material precision regression
- the lower-resource benefit is actually observable
