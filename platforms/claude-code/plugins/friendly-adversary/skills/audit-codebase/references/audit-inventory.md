# Codebase audit inventory

Define subsystems by responsibility and runtime boundaries, not by folder count.

Inspect source only through the run's `snapshot-files/` materialization. Use bounded queries against `snapshot.json` only to account for regular files, symlinks, gitlinks, and deleted paths; it is not authorization to read the live checkout. A tracked symlink is represented by its path and target string but is never dereferenced or sent to analyzers, so record it as an explicit coverage limitation. Publish subsystem reports as flat `subsystem-<id>.md` files.

For each subsystem record:

- stable lowercase hyphenated ID and title;
- owned canonical paths and explicitly related generated or vendored paths;
- runtime entry points and public interfaces;
- inbound and outbound dependencies;
- data, state, integration, and side-effect ownership;
- test and operational evidence boundaries;
- applicable Friendly Adversary dimensions;
- explicit exclusions with reasons.

Any subsystem that owns tests, test fixtures, test helpers, test configuration, or behavior whose claimed proof depends on those assets must include the `verification` dimension. Keep tests with the subsystem behavior they claim to prove rather than creating an unowned test catch-all. The verification review must trace representative tests to their production path and independently sourced oracle, not infer confidence from test names, file counts, coverage percentages, or green status.

Classify a path as generated only when the repository declares its canonical source or generator mapping. For every generated path group, name that source or mapping in the inventory. If no mapping can be named, count the path as canonical. Platform location alone is not provenance. Host-specific manifests, MCP launch configuration, skill entry points, and invocation metadata are canonical production contracts unless such a mapping exists, so assign each one exactly one authoritative subsystem owner.

Treat each pinned Git submodule as an external gitlink boundary. Record its pinned object, local dirty status, ownership, reachability, and coverage limits. Do not silently claim that the parent audit inspected code inside the submodule.

Subsystem lanes must cover every owned canonical path exactly once. Shared contracts may be referenced by multiple lanes, but assign one authoritative owner. Final adjudication checks inventory completeness and cross-subsystem behavior, then owns proof quality, duplicate merging, unsupported claims, and coverage gaps.

Do not create one lane per directory and do not multiply every subsystem by every dimension.
