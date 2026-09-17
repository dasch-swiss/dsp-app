# ADR-0002: The barrel is the only public interface

- **Status:** Accepted (2026-09-13)
- **Relates to:** ADR-0001 (library taxonomy), ADR-0005 (what `shared/` means)

## Context

Every library in the workspace exposes a `src/index.ts` barrel, and consumers import through the `@dasch-swiss/*` path aliases declared in `tsconfig.base.json`. `@nx/enforce-module-boundaries` rejects imports that reach past a barrel into a library's internal files.

Unusually for a codebase of this age, the rule holds. There are zero deep-path reach-ins in any linted file, and exactly one suppression of the boundary rule in the entire repository, at `libs/vre/shared/app-help-page/src/lib/help-page/help-page.component.ts:6`, where it is commented and reads the root `package.json` for a version string. The one un-linted subtree is the exception: `apps/dsp-app/cypress/` holds four relative cross-project imports of `libs/dsp-js/src`, which ADR-0006 covers. This is the single strongest boundary the codebase currently has, and it holds by habit rather than by decision. Writing it down costs nothing and protects it against the first contributor who does not share the habit.

What does not hold is the narrowness of the barrels themselves. Of twenty-seven library barrels, twenty-four re-export with `export *` (one of them, `pages/data-browser`, mixes both styles in five statements) and three are hand-curated named-export lists:

| Library | Barrel style |
| --- | --- |
| `libs/vre/shared/calendar` | 7 named exports, zero `export *` |
| `libs/vre/core/session` | 7 named exports, zero `export *` |
| `libs/dsp-js` | 194 named exports, zero `export *` |
| the other 24 | `export *`, from 1 to 46 statements |

`export *` means the public surface is whatever happens to be exported from the files listed, so a symbol becomes public the moment somebody adds `export` to it, with no review step and no diff in the barrel. `libs/vre/ui/ui` has 46 such statements. That is not a public interface, it is the absence of one.

The counter-example already in the tree is instructive. `resource-editor` contains 403 files and its barrel lists four, each naming a specific component file rather than a folder index:

```ts
export * from './lib/single-resource-page.component';
export * from './lib/resource-fetcher.component';
export * from './lib/resource-fetcher-dialog.component';
export * from './lib/properties/properties-display/template-switcher/create-resource-dialog.component';
```

Four files out of 403 are reachable. The surface is genuinely narrow even though the mechanism is `export *`, because the targets are leaf files rather than indexes.

## Decision

1. **A library's `src/index.ts` is its entire public interface.** Nothing else in a library may be imported from outside it. (**static-analysis**, via `@nx/enforce-module-boundaries`)

2. **A suppression of the boundary rule requires a comment giving the reason.** There is one today and it has one. This is a review expectation, not a lint setting, because a lint rule cannot judge whether a reason is good. (**review**)

3. **New libraries use curated named exports.** `export { A, B } from './lib/x'`, not `export * from './lib/x'`. Adding a symbol to the public surface then requires editing the barrel, which puts it in the diff and in front of a reviewer. `shared/calendar` is the reference shape (ADR-0005). (**review**)

4. **Existing `export *` barrels are not converted wholesale.** Converting twenty-four barrels at once produces a very large diff with no behavioural change and no way to review it meaningfully. A barrel is converted when its library is otherwise being worked on. If `export *` is kept, it targets leaf files rather than folder indexes, as `resource-editor` does. (**review**)

5. **`libs/dsp-js` is a published package and its barrel is a contract.** Anything exported from `libs/dsp-js/src/index.ts` is part of the published `@dasch-swiss/dsp-js` surface. A symbol being unused inside this repository is not evidence that it is unused; removing it is a breaking change for external consumers, not cleanup. This is why the dead-code work explicitly excludes `dsp-js`. (**review**)

## The gap this does not close

Nx does not reliably block an aliased deep import into a file a library does not export. The behaviour has been reported (Nx issue #29258) and closed as "not planned". In practice the rule catches relative reach-ins and the common alias forms, which is why the workspace is clean today, but it should not be described as airtight.

**Sheriff** (SoftArc) closes this gap. It enforces module boundaries at folder level, independently of Nx's project graph, and its `noTag` default means it can be adopted incrementally without tagging everything first.

Sheriff is **not adopted now**, deliberately. The workspace currently has zero deep-import violations, so Sheriff would be protecting against a problem that has not occurred, and ADR-0001 is already changing how boundary failures are reported. Introducing a second boundary tool in the same period would make a failing build ambiguous about which tool rejected it and why. Sheriff is recorded here as the known answer, to be revisited if a deep-import violation ever lands on `main`.

## Consequences

**Positive.** The strongest existing boundary becomes a stated rule rather than a shared habit, and survives contributor turnover. New libraries get a reviewable public surface from the start. The refactoring freedom that a narrow barrel buys, changing anything not exported without touching a consumer, becomes real rather than accidental.

**Negative and costs.** Curated barrels are more work per change than `export *`: adding a component means editing two files. Twenty-four libraries keep a wide surface indefinitely under decision 4, so the benefit arrives slowly and unevenly. The Nx deep-import gap stays open, accepted knowingly.

## Alternatives rejected

- **Convert all twenty-four barrels now.** Mechanical, reviewable only in aggregate, and produces a diff nobody can meaningfully check. The value of a curated barrel comes from the review step at the moment a symbol is added, which a bulk conversion does not provide retroactively.
- **Adopt Sheriff alongside Nx tags immediately.** Correct in the long run and rejected only on timing, as set out above.
- **Drop barrels and import by deep path with a lint rule listing permitted paths.** Some workspaces do this to improve tree-shaking. It replaces one reviewable file per library with a central allowlist that every team edits, which is a worse place to put the decision, and the bundler already handles what it would buy.
