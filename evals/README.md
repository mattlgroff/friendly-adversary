# Evaluations

This directory defines the v1 evaluation scaffold for model and effort experiments. It includes focused source fixtures but does not claim benchmark results.

- `evals.json` describes representative review behaviors.
- `model-matrix.yaml` lists platform configurations to compare.
- fixture directories contain pinned source, contracts, or proposed states plus expected review behavior.

Run every case in a fresh session. Compare one-shot review with Friendly Adversary, then compare per-lens model and effort assignments.

Do not treat finding count as quality. Grade material recall, precision, evidence, abstention, and adjudicator rejection accuracy.

Model names in `model-matrix.yaml` are experiment labels. Resolve them to an identifier exposed by the installed host at run time, and record that exact identifier in the benchmark result.

The Codex `luna` candidate is pinned to high effort with `fast_mode: true` for the current resource-quality experiment. `fast_mode` is a host-run setting recorded for the evaluation; it is not a runtime switch exposed by the plugin itself.
