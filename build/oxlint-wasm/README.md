# Oxlint WebAssembly build boundary

This build-only crate links the upstream Oxc linter core at the exact Git commit represented by the immutable `oxlint_v1.76.0` tag. It exports a narrow JSON ABI for the portable WebAssembly artifact shipped by Friendly Adversary.

The crate is not part of the Node runtime. Friendly Adversary ships only its compiled WebAssembly module and TypeScript/JavaScript host code. It never installs, invokes, or falls back to the native Oxlint executable or bindings.
