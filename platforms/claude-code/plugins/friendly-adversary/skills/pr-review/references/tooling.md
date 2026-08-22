# Deterministic tooling

## Collection order

1. Git scope and changed files.
2. Bundled static language checks.
3. Required repository-native lint, typecheck, test, build, and validation commands.
4. Bundled language and SAST engines.
5. Focused symbol, import, route, schema, and utility searches.

Run only commands relevant to the changed packages. An applicable check may not be skipped.

Bundled language lint, Semgrep, and applicable repository checks are required evidence. An unavailable required check, timeout, or operational failure makes the run incomplete.

Repository-native commands, repository-local binaries, and executable configurations are trusted review inputs and can execute reviewed code. Analyzer installation, package downloads, updates, and network-backed vulnerability queries never run during a review. Do not rerun tools ad hoc outside the bundled collector.

## TypeScript and JavaScript

Detect `package.json`, workspaces, lockfiles, project references, and configured scripts. Use the repository's declared npm, pnpm, Yarn, or Bun package manager and existing commands. Do not install dependencies during review.

Potential evidence:

- the bundled pinned Oxlint-compatible WebAssembly engine using its certified fixed profile, which runs without a native Oxlint executable or binding
- configured lint, typecheck, test, build, and validation scripts from the repository root and every nearest changed package, each executed from its package directory
- configured ESLint or Biome repository commands
- the nearest applicable TypeScript project configuration for each changed file
- Semgrep Community Edition
- AST or text search for equivalent symbols and dependency boundaries

Do not run two format or style linters merely to create more findings. Choose tools that add independent evidence.

When a root or nearest changed package defines `typecheck` or `type-check`, use those repository scripts as the compiler contract and do not invoke `tsc` directly. Direct project-aware `tsc` is required only when no applicable configured typecheck exists. Resolve that compiler separately for each changed TypeScript project by searching from the project's configuration directory toward the repository root. Do not require a root-level compiler when the project owns a package-local installation.

When a configured JavaScript test script starts with Bun test, Vitest, Jest, or Node's test runner and the package contains changed test files, pass those package-relative test paths through the configured script. If no changed test file exists or the runner is not recognized, preserve the repository's configured test command exactly.

Repository-controlled checks run from their repository or package directory while the review packet and captured evidence remain in private user-scoped state outside the repository. The runtime rechecks the pinned Git snapshot after every command and before atomic publication. Do not edit the checkout or run another modifying process during review. Repository-owned commands are trusted inputs; a command that changes source and restores it before exiting is outside the supported trust boundary. No Friendly Adversary output appears in the repository before sealing. This is not an operating-system sandbox against a deliberately malicious process running as the same user. Never replace this boundary with an ignore-file edit or an instruction to the user.

## Python

Detect `pyproject.toml`, `uv.lock`, `poetry.lock`, `requirements*.txt`, `setup.cfg`, `tox.ini`, and configured commands. When pytest or mypy is configured, require its repository-virtual-environment executable and run it without installing dependencies.

Potential evidence:

- the bundled pinned Ruff WebAssembly engine, which runs without Python or a native Ruff executable or binding
- configured repository lint, typecheck, and test commands
- Semgrep Community Edition
- Python AST or text search for equivalent functions, models, routes, and utilities

## Artifact layout

For each tool create `deterministic/<tool>/` and preserve:

- `command.txt`
- `version.txt`
- `exit-code.txt`
- `stdout.txt`
- `stderr.txt`
- any native JSON, SARIF, XML, coverage, or text file emitted by the tool

Do not translate native output into a Friendly Adversary schema.
