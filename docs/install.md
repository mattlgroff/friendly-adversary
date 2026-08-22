# Install Friendly Adversary

## Prerequisites

- Node.js 22.22.0 or newer
- Git
- Claude Code or Codex with plugin support
- Codex CLI installed, authenticated, and able to use `gpt-5.6-luna`

No Python, Rust, Docker, native analyzer, or analyzer download is required.

Check Node:

```bash
node --version
codex --version
```

## Claude Code

Install from GitHub:

```bash
claude plugin marketplace add https://github.com/mattlgroff/friendly-adversary.git
claude plugin install friendly-adversary@friendly-adversary
```

Verify:

```bash
claude plugin marketplace list
claude plugin list
```

Update:

```bash
claude plugin marketplace update friendly-adversary
claude plugin update friendly-adversary@friendly-adversary
```

Start a new session or run `/reload-plugins` after installation or update.

## Codex

Install from GitHub:

```bash
codex plugin marketplace add https://github.com/mattlgroff/friendly-adversary.git --ref master
codex plugin add friendly-adversary@friendly-adversary
```

Verify:

```bash
codex plugin marketplace list
codex plugin list
```

Update:

```bash
codex plugin marketplace upgrade friendly-adversary
codex plugin remove friendly-adversary@friendly-adversary
codex plugin add friendly-adversary@friendly-adversary
```

Start a new Codex task after installation or update. Existing conversations may retain an older plugin snapshot.

## Install from a local clone

Clone and validate:

```bash
git clone https://github.com/mattlgroff/friendly-adversary.git
cd friendly-adversary
npm ci
npm run validate
```

Register the local directory as a marketplace using the host's local marketplace command, then install `friendly-adversary@friendly-adversary`. A directory-backed marketplace may execute the live checkout, so update it with `git pull --ff-only` only when clean and start a fresh host session afterward.

## Windows and WSL

Native Windows and WSL are separate environments. Install Node, Codex CLI, the host CLI, Git credentials, and the plugin in each environment where you intend to use it. Claude Code PR review still requires Codex CLI because every lens executes through Luna locally.

Use a native Windows clone for native Windows testing and a Linux filesystem path such as `/home/<user>/working/...` for WSL. Avoid reviewing a WSL repository through `/mnt/c` when a Linux filesystem clone is available.

Node's Windows WASI directory behavior is bridged inside the bundled ripgrep runtime. No native `rg.exe` is installed or invoked.

## Skills

Claude Code:

```text
/friendly-adversary:pr-review main
/friendly-adversary:audit-codebase .
/friendly-adversary:design-new-codebase ./intended-project
```

Codex:

```text
$friendly-adversary:pr-review main
$friendly-adversary:audit-codebase .
$friendly-adversary:design-new-codebase ./intended-project
```

All skills require explicit invocation. The former `friendly-adversary` skill name was retired in 3.0.0 and is not an alias.

## Output and ignore setup

Runs write beneath `.friendly-adversary/`. Adding this directory to `.gitignore` is optional human setup. The plugin does not add, modify, recommend, or require an ignore entry while a skill is running.

## Troubleshooting

### Plugin appears installed but no skill is visible

- Confirm the plugin is enabled.
- Confirm the installed version matches the expected release.
- Start a fresh Codex task or reload Claude Code plugins.
- If using a local marketplace, confirm it points to the intended checkout.
- Validate the checkout with `npm run validate`.

### GitHub installation fails

Confirm that ordinary `git clone https://github.com/mattlgroff/friendly-adversary.git` succeeds in the same environment. Friendly Adversary does not collect or manage GitHub credentials.

### PR review reports missing repository tools

Install the target repository's own dependencies using its documented setup. Friendly Adversary never installs them. Use `audit-codebase` when you need a repository-wide inspection that does not execute project-owned tools.

### PR review reports that Codex or Luna is unavailable

Run `codex --version`, confirm that Codex is authenticated in the same native Windows, WSL, macOS, or Linux environment as the host, and confirm that `gpt-5.6-luna` is available. PR lenses have no Claude-agent, inherited-model, serial, or alternate-model fallback.

### MCP tool is unavailable

The run must stop incomplete. There is no shell-write fallback. The bundled server exposes exactly one stdio tool, `record_artifact`, and does not use an HTTP port.

### A run says the snapshot changed

Start a new run for the new state. Audit resume and final sealing intentionally reject changed source, HEAD, index, or relevant untracked files.
