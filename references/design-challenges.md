# New codebase design challenges

Run these independent passes after the relevant decisions exist:

- Feasibility: prove the design can be built with the chosen platforms, permissions, dependencies, skills, and operating constraints.
- Simplicity: find avoidable systems, abstractions, dependencies, configuration, and premature flexibility. Require a simpler behavior-preserving alternative.
- Security: trace identity, authorization, secrets, isolation, input boundaries, dependency risk, and abuse paths.
- Operability: challenge deployment, configuration, observability, recovery, migrations, support, and ownership.
- Verification: determine whether tests and acceptance evidence can prove the product, contracts, failure behavior, and deployment path.

Each challenge must cite the affected decision, attempt a disproof, and distinguish a blocker from a non-blocking risk. The main model adjudicates challenges and reopens any decision with a proven contradiction.
Publish each result as `challenge-<id>.md` only after the runtime issues the challenge phase capabilities.
