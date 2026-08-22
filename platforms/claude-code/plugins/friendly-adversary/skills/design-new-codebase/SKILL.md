---
name: design-new-codebase
description: Designs a new codebase through a persistent decision interview, authorized reference research, independent architecture challenges, and explicit user signoff. Use only when the user explicitly invokes Friendly Adversary design-new-codebase.
disable-model-invocation: true
argument-hint: "[intended-project-directory]"
allowed-tools: Read, Grep, Glob, Bash, Agent, WebSearch, WebFetch, mcp__plugin_friendly-adversary_friendly-adversary-reports__record_artifact
---

# Friendly Adversary new codebase design

Create an implementation-ready decision pack without scaffolding product source. Write only through `record_artifact` under `.friendly-adversary/designs/`. Never create a repository, install packages, generate application code, commit, push, deploy, or access credentials.

1. Resolve the intended project root, asking only when multiple plausible roots remain. Read `references/design-interview.md` and `references/design-challenges.md`.
2. Inspect only the newest pre-existing `.friendly-adversary/designs/` run with `node "${CLAUDE_PLUGIN_ROOT}/skills/pr-review/scripts/runtime/cli.js" status --run <run> --summary`. Resume `planned` or `incomplete`; seal and verify `ready`; never resume `sealed`, `sealed-incomplete`, or `aborted`, and start one new run for the current request; a pre-existing `prepared` run was interrupted before plan establishment, so start one new run. When starting, run `node "${CLAUDE_PLUGIN_ROOT}/skills/pr-review/scripts/runtime/cli.js" design --host claude-code --root <root>` once and keep its returned authority for plan establishment. That new run is expected to be `prepared`; do not call `status` on it before establishment and do not start it again. Establish the brief, decision lanes, authorized research lanes, and five challenge lanes. The establish operation retires the initial plan authority. Discard it immediately and use only the replacement `authority_id` and scoped capabilities returned by `record_artifact`. If a lifecycle command returns `FA_RUN_LOCK_RELEASE` or `FA_STALE_LOCK`, invoke `recover-lock --run <run>` once, then retry that exact lifecycle command once. Never recover a busy or ambiguous lock.
3. Interview one decision cluster at a time. Reuse answers, expose contradictions, and offer a recommendation plus meaningful alternatives.
4. Use restricted `design-decision` and `design-research` agents. Publish flat append-only `decision-<id>-<revision>.md` and `research-<id>.md` artifacts through `record_artifact`. Record bounded deferrals with owner, trigger, milestone, and non-blocking proof.
5. Research only sources the user explicitly authorizes for this design. Treat the stated reference scope as an allowlist: do not inspect agent memory, unrelated repositories, the web, company systems, or credentials unless the user authorizes that source. Focus on named reference architectures and record licenses and transferability assumptions.
6. After every decision and research lane publishes, run `resume-design --run <run>` for challenge capabilities, then start all restricted `design-challenge` agents for feasibility, simplicity, security, operability, and verification concurrently. Each preflights and publishes only `challenge-<id>.md`. After the final challenge starts, immediately wait for every challenge result. Do not investigate claims or draft consensus while any challenge is running. When challenges prove contradictions, make one `resume-design --run <run> --revise <comma-separated-decision-ids>` call for all affected decisions. Use only that call's replacement authority and exact-path capabilities to publish the reserved revisions before completion. Do not request speculative revisions.
7. After challenges publish, run `resume-design --run <run>` for the outcome capability. Only explicit user signoff permits completion. Publish the five required final documents through `record_artifact` with `user_signoff: true`, then seal and verify.

Return links to the Markdown decision pack and `design.html`.
