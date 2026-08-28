# Friendly Adversary

Friendly Adversary is a local adversarial review system for TypeScript, JavaScript, and Python repositories. It combines bundled WebAssembly analyzers, independent Luna lens reviews through the local Codex CLI, and final evidence-based adjudication by the model running Claude Code or Codex.

It provides three explicitly invoked skills:

- `pr-review` challenges a proposed change before a pull request is opened or merged.
- `audit-codebase` examines a complete existing repository without running repository-owned code.
- `design-new-codebase` interviews the user, researches authorized references, challenges the proposed architecture, and produces a signed-off design pack without scaffolding.

Friendly Adversary does not fix, stage, commit, push, or deploy application code.

## Requirements

- Windows 11, macOS, Linux, or WSL2
- Git for PR review and codebase audit
- Node.js 22.22.0 or newer
- Claude Code or Codex with plugin support
- Codex CLI installed, authenticated, and able to use `gpt-5.6-luna`

Friendly Adversary bundles Semgrep CE, Ruff, an Oxlint-compatible engine, and ripgrep as WebAssembly. It does not require Python, Docker, Rust, native analyzer executables, runtime downloads, or network access.

PR review also runs applicable checks already configured in the trusted target repository. Its dependencies must already be installed. Codebase audit deliberately does not run repository scripts, binaries, package managers, executable configuration, or installed project tools.

On Codex, PR review requests an escalated collector launch because the collector must start authenticated nested Codex CLI processes. This moves the collector and repository-owned checks outside the outer shell sandbox. Approve it only for a repository you trust. Every Luna lens still runs in its own read-only Codex sandbox. If escalation is denied or unavailable, the review stops incomplete.

## Install in Claude Code

```bash
claude plugin marketplace add https://github.com/mattlgroff/friendly-adversary.git
claude plugin install friendly-adversary@friendly-adversary
```

Confirm the installation:

```bash
claude plugin marketplace list
claude plugin list
```

## Install in Codex

```bash
codex plugin marketplace add https://github.com/mattlgroff/friendly-adversary.git --ref master
codex plugin add friendly-adversary@friendly-adversary
```

Confirm the installation:

```bash
codex plugin marketplace list
codex plugin list
```

See [the installation guide](docs/install.md) for local-clone installation, updates, Windows, and WSL notes.

## Use it

Start Claude Code or Codex in the repository or directory you want to examine.

### Review a pull request or local change

Claude Code:

```text
/friendly-adversary:pr-review main
```

Codex:

```text
$friendly-adversary:pr-review main
```

Replace `main` with the correct base branch or commit. You may explicitly name an existing branch, remote branch, PR head, or commit as the review target. The skill may fetch and navigate to that exact target only when the checkout is clean.

### Audit an existing codebase

Claude Code:

```text
/friendly-adversary:audit-codebase .
```

Codex:

```text
$friendly-adversary:audit-codebase .
```

An unqualified audit covers the complete Git repository, including tracked files, dirty state, and non-ignored untracked files. It runs only the bundled analyzers. Subsystem agents review the pinned snapshot in parallel, then the calling model checks coverage and cross-subsystem behavior while adjudicating the result.

### Design a new codebase

Claude Code:

```text
/friendly-adversary:design-new-codebase ./intended-project
```

Codex:

```text
$friendly-adversary:design-new-codebase ./intended-project
```

The directory must already exist. The skill records decisions as append-only revisions, researches only authorized references, runs independent challenges, and requires explicit user signoff. It never initializes a repository or generates application code.

## Artifacts

Every sealed run is published under `.friendly-adversary/`:

```text
.friendly-adversary/
├── pr-reviews/<run-id>/
├── audits/<run-id>/
└── designs/<run-id>/
```

Lens-authored artifacts are Markdown. Every PR lens runs concurrently in a fresh ephemeral `codex exec` process with `gpt-5.6-luna`, high reasoning, Fast mode, ignored user configuration, and a read-only sandbox. The Claude or Codex model that invoked the skill reads the persisted lens reports and performs final adjudication. Final reports also receive deterministic offline HTML companions. Native analyzer output is preserved without translation. A sealed run includes `artifacts.sha256` for integrity verification.

The final orchestrator and non-PR workflows use one local MCP tool named `record_artifact`. The PR lens runner publishes validated Luna responses through the same internal capability enforcement without routing report text through the calling model. A capability limits each publication to one run and an exact path or path prefix. The server uses stdio and opens no network listener.

PR review collects evidence and agent reports in private user-scoped state outside the repository. The runtime verifies the pinned Git snapshot after every repository-controlled command, and the checkout must not be edited concurrently. The target repository receives no Friendly Adversary files until sealing. Sealing freezes agent writes, verifies the pinned Git snapshot, builds and verifies a complete staging directory beside the final destination, and publishes it with one atomic rename. A crash before that rename leaves no final run; a crash after it leaves a complete run. Friendly Adversary confines agent capabilities, but it is not an operating-system sandbox against a deliberately malicious process running as the same user.

Runs are bound to the runtime contract that created them. Start a new run after updating Friendly Adversary rather than resuming or verifying a run created by another version.

Adding `.friendly-adversary/` to `.gitignore` is optional human setup. The skills never edit or require `.gitignore`.

## Update

Claude Code:

```bash
claude plugin marketplace update friendly-adversary
claude plugin update friendly-adversary@friendly-adversary
```

Codex:

```bash
codex plugin marketplace upgrade friendly-adversary
codex plugin remove friendly-adversary@friendly-adversary
codex plugin add friendly-adversary@friendly-adversary
```

Start a new Codex task after installation or update. In Claude Code, start a new session or run `/reload-plugins`.

## Safety boundaries

Run PR review only in repositories you trust. Repository checks can execute repository-owned code, create background processes that outlive the review, and have side effects outside Git. Friendly Adversary monitors the pinned repository snapshot but is not a process sandbox.

On a Codex host, the required escalated collector launch includes those repository checks. The escalation does not weaken the read-only sandbox used by each nested Luna lens.

Codebase audit is the safer inspection mode for an unfamiliar repository because it runs only bundled analyzers and read-only Git inspection. Reviewed source and analyzer output are still treated as untrusted evidence by agent prompts.

## Documentation

- [Installation and troubleshooting](docs/install.md)
- [Architecture](docs/architecture.md)
- [Product requirements](prd.md)
- [PR review contract](docs/plans/pr-review-skill.md)
- [Codebase audit contract](docs/plans/audit-codebase-skill.md)
- [New codebase design contract](docs/plans/design-new-codebase-skill.md)
- [Writing custom lenses](docs/lens-authoring.md)
- [Licensing and third-party components](LICENSING.md)

## License

Friendly Adversary is GPL-3.0-only. Bundled third-party components retain their original licenses and notices. The complete Semgrep corresponding source is attached to every GitHub release that distributes the runtime. See [LICENSING.md](LICENSING.md).
