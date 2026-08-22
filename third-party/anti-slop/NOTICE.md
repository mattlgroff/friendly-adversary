# anti-slop notice

Friendly Adversary includes a Rust/OXC WebAssembly adaptation of the 15 rules from [`dmmulroy/anti-slop`](https://github.com/dmmulroy/anti-slop).

- Upstream commit: `9b80d9a5c317d3af94d88a577bdbde4d9a45f7be`
- License: MIT
- Upstream canonical source: `src/rules/` and `src/shared/`
- Friendly Adversary adaptation: `build/oxlint-wasm/src/anti_slop/`
- Modifications: ported from the upstream Oxlint JavaScript-plugin API to the pinned OXC Rust AST and compiled into the capability-free Friendly Adversary Oxlint WebAssembly engine; diagnostics remain under the `anti-slop(...)` rule namespace.

The upstream project is intentionally opinionated and intended to be vendored and adapted. Friendly Adversary treats its diagnostics as deterministic review evidence. The dedicated anti-slop lens and final adjudicator decide whether a diagnostic is supported in repository context.

The full upstream MIT text is in `LICENSE.txt`.
