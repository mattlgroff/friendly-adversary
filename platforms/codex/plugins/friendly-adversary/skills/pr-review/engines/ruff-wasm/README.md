# Vendored Ruff WebAssembly engine

Friendly Adversary vendors the official Node.js WebAssembly build of Ruff 0.16.2. Review-time execution uses only the committed JavaScript glue and WebAssembly bytes in `runtime/`. It does not install Ruff, invoke a native Ruff executable, contact a package registry, or require Python.

The exact upstream repository, tag, package integrity, downloaded tarball hash, and committed file hashes are recorded in `upstream-lock.json`. `LICENSE` is the complete license and derived-work notice file shipped in the official package. `UPSTREAM_README.md` and `UPSTREAM_PACKAGE.json` are preserved from that package and document the experimental upstream API and dependency-free package metadata.

The package is pinned because the upstream WebAssembly API is explicitly experimental. Upgrades require an intentional source and license review, refreshed hashes, runner compatibility tests, plugin synchronization, and full native Windows, WSL2 Linux, and macOS recertification.

Ruff emits `<filename>` inside its native document diagnostics. Friendly Adversary preserves those diagnostics unchanged and records the repository-relative path beside them in each wrapper file record.
