# Architecture Decision Records

An ADR records a decision that was actually made, the context that forced it, and the alternatives that were rejected. It is not a style guide and not a plan. If a rule here is wrong, the fix is a new ADR that supersedes this one, not an edit that quietly changes history.

Every rule in these records carries an **enforcement level**, using the same vocabulary as `ARCH-MAP.md` and the `dasch-ops-platform` ADRs:

| Level | Meaning |
| --- | --- |
| `structure` | The layout of the repository makes the wrong thing impossible or obvious. |
| `static-analysis` | A linter, compiler or build step rejects the wrong thing. |
| `review` | A human is expected to catch it. |
| `docs-only` | Written down, checked by nothing. |

A rule recorded as `review` or `docs-only` is not a weaker rule. It is an honest one. Where a rule could be promoted to a stronger level, the ADR says which configuration change would do it.

## Records

| ADR | Title | Status |
| --- | --- | --- |
| [0001](0001-library-taxonomy-and-dependency-direction.md) | Library taxonomy and enforced dependency direction | Accepted |
| [0002](0002-the-barrel-is-the-public-interface.md) | The barrel is the only public interface | Accepted |
| [0003](0003-feature-state-is-component-provided.md) | Feature state is component-provided, with one writer per value | Accepted |
| [0004](0004-cross-feature-access.md) | Cross-feature access | Accepted |
| [0005](0005-what-shared-means.md) | What `shared/` means, and what it does not | Accepted |
| [0006](0006-the-e2e-suite-is-its-own-project.md) | The end-to-end suite is its own project | Accepted |

## How these six relate

ADR-0001 is the anchor: it defines the tags, the dependency direction, and the order in which they can be switched on without breaking the build. The others each take one part of it further.

- **0002** covers what a library exposes once the direction is enforced.
- **0003** covers what lives inside a feature and who is allowed to write it.
- **0004** covers what a feature does when it needs something another feature has.
- **0005** defines the destination that 0004 relies on.
- **0006** gives the `e2e` tag in 0001 something to apply to.

0004 and 0005 are on the critical path for 0001: the constraint block in 0001 cannot be switched on until the cross-feature symbols they describe have moved. 0006 is the exception. It depends on nothing and can land on its own.

## Related documents

- `ARCH-MAP.md` at the repository root records the current topology: every component, its files, and its edges. It describes what is, where these records describe what should be.
- `CONTEXT.md` at the repository root records the domain vocabulary. dsp-api's `CONTEXT.md` and its per-context files own the domain terms; the root file here defers to them and adds the client-side notes.
- `CLAUDE.md` records operating rules and conventions that are not architectural decisions.
- The `dasch-ops-platform` repository keeps its own ADRs. ADR-0004 here adapts its ADR-0013. Records in the two repositories are numbered independently, so always cite the repository by name.
