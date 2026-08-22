# Competitive landscape

Friendly Adversary combines ideas that exist separately in current review tools. Its distinction is the local chain from native evidence to independent lenses to main-model rejection.

| Project | What to learn | Friendly Adversary distinction |
| --- | --- | --- |
| [PR-Agent](https://github.com/qodo-ai/pr-agent) | Broad pull request workflows, repository instructions, incremental review | Local pre-PR workflow with a durable evidence and rejection trail |
| [OpenReview](https://github.com/vercel-labs/openreview) | Agent exploration, isolated checkout, tests, and linters | Explicit separation between recall lenses and skeptical adjudication |
| [PR-AF](https://github.com/Agent-Field/pr-af) | Parallel review perspectives, coverage, scoring, and deduplication | Native tool artifacts and no confidence by vote |
| [Reviewdog](https://github.com/reviewdog/reviewdog) | Analyzer and publisher separation, diff filtering, structured findings | Semantic investigation and host-model adjudication before publishing |
| [Danger JS](https://danger.systems/js/) | Deterministic repository policy | Extensible reasoning for failures that do not have authored rules yet |
| [Semgrep](https://semgrep.dev/docs/) | Fast, explainable static analysis and custom rules | One evidence source inside a larger review workflow |

## Positioning

Friendly Adversary is not another bot that posts comments. It is a local review system that gathers evidence, challenges a proposed change from multiple narrow angles, and records why the strongest model accepted or rejected each allegation.

## Competitive risks

- Existing agentic reviewers may add stronger adjudication.
- Platform-native code review skills may improve quickly.
- Static analyzers may cover more semantic patterns.
- Users may prefer a zero-configuration hosted service over a deliberate local run.

The defensible product value must come from trusted findings, transparent evidence, extensible lenses, and measurable model routing rather than from the number of agents involved.
