# Vendored ripgrep WebAssembly engine

Friendly Adversary vendors the complete upstream ripgrep 15.2.0 command-line program compiled unchanged for `wasm32-wasip1`. The runtime is one architecture-neutral WebAssembly module. It does not locate or invoke a host `rg` executable, install packages, download assets, or select another search implementation.

The Node host verifies the committed SHA-256 before compilation and accepts only `wasi_snapshot_preview1` imports. The target repository is preopened as the guest working directory. The collector fixes `--no-config --threads 1` on every invocation. Disabling configuration prevents ambient behavior drift. One thread is required because WASI Preview 1 cannot create worker threads.

Node's bundled `uvwasi` returns `ENOSYS` for `fd_readdir` on native Windows. On that platform, the JavaScript host supplies only the missing Preview 1 directory-read syscall through Node's filesystem API. It tracks directories that Node successfully opens beneath the repository preopen, preserves their WASI rights, rejects replaced or escaped directory identities, serializes standard WASI directory entries into guest memory, and leaves every other syscall with Node WASI. The ripgrep program remains the same checksummed WebAssembly module on every platform.

Review-time use is limited to Friendly Adversary's file-index and symbol-search invocations. Process-backed ripgrep flags are rejected. Native JSON Lines and file-list output are stored without transformation.

Exact provenance, build inputs, runtime constraints, and artifact hashes are in `upstream-lock.json`. The exact source archive is in `source/`. Test-denominator evidence is summarized in `conformance/UPSTREAM_TESTS.md`. Third-party licensing is in `THIRD_PARTY_LICENSES.md` and `licenses/`.
