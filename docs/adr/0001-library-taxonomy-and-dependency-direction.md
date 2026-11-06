# ADR-0001: Library taxonomy and enforced dependency direction

- **Status:** Accepted (2026-09-13); mechanism revised (2026-11-06) when Bazel replaced Nx ([ADR-0007](0007-bazel-builds-the-repository.md))
- **Relates to:** ADR-0002 (the barrel is the public interface), ADR-0004 (cross-feature access), ADR-0005 (what `shared/` means), ADR-0006 (the e2e suite is its own project), ADR-0007 (Bazel builds the repository)

## Context

When this ADR was written the repository was an Nx monorepo with 28 projects; the measurements in this section and in decision 7 are from that time. The folder names (`core/`, `ui/`, `shared/`, `pages/`, `resource-editor/`) suggest a layered architecture. Nothing enforces it.

The decision was started and then abandoned. All twenty-seven library `project.json` files carry a `"tags"` key. Twenty-three of them are `[]`. Four carry real tags using the canonical Nx `type:`/`scope:` convention: `libs/dsp-js` (`scope:shared`, `type:data-access`), `libs/vre/ui/ui`, `libs/vre/ui/nested-menu` and `libs/vre/ui/string-literal` (all `type:ui`). The twenty-eighth project, `apps/dsp-app`, has no `tags` key at all. The rule in `eslint.config.mjs:99` is configured with a single permissive constraint:

```js
depConstraints: [{ sourceTag: '*', onlyDependOnLibsWithTags: ['*'] }]
```

This permits every dependency. Consequently the folder names carry no weight and layering has drifted. Measured against `main` at `238000ec2`, counting runtime code only (`*.spec.ts`, `*.stories.ts` and `stories.helpers.ts` excluded, since decision 5 exempts them):

- The eight libraries under `libs/vre/pages/` form eleven dependency edges among themselves, covering seventeen distinct symbols. Seven of the eight are routed pages; `pages/data-browser` is a component library that `pages/project` routes to. The two most-imported symbols are `ProjectPageService` (three other page libraries, sixteen files) and `AllProjectsService` (two, three files).
- `core/error-handler` depends on `ui/notification`.
- `ui/*` reaches into `shared/app-common`, `shared/app-helper-services` and `3rd-party-services/open-api` in four files, and into `dsp-js` in seven more.

The composition root that makes page-to-page imports unnecessary already exists and is already used: `apps/dsp-app/src/app/app.routes.ts` imports all seven routed page libraries directly (the eighth library under `pages/`, `data-browser`, is reached through `DataBrowserPageComponent` in `pages/project`) and contains zero `loadComponent` and zero `loadChildren` calls. Pages are already assembled by the application. They simply also import each other, which is the part that has no justification.

## Decision

1. **Every library carries one type and one scope, written once, in `LIBRARIES` in `tools/angular/visibility.bzl`.** (**structure**)

   Types: `app`, `feature`, `ui`, `data-access`, `util`. This is the Nx taxonomy and it is adopted unchanged so that external documentation applies without translation. The application's type and scope live beside it in `APPLICATIONS`. A library package that `LIBRARIES` does not list fails to load, so a new library cannot be added without a type and a scope.

   An `e2e` type existed while the Cypress suite was an Nx project (ADR-0006). The suite is no Bazel target: its binary, browser and Docker stack are not hermetic. Its separation from the application is held by its own tsconfig and `just typecheck-e2e`, so it has no type here.

   Scopes: `shared` for anything reusable across domains, one scope per page domain (`project`, `ontology`, `search`, `user`, `system`), and `app` for the application itself.

2. **The type constraint fixes the tier.** (**structure**)

   ```text
   type:app          ->  type:feature, type:ui, type:data-access, type:util
   type:feature      ->  type:feature, type:ui, type:data-access, type:util
   type:ui           ->  type:ui, type:util
   type:data-access  ->  type:data-access, type:util
   type:util         ->  type:util
   ```

   `TYPE_MAY_DEPEND_ON` in `tools/angular/visibility.bzl` is this table.

   `type:ui -> type:ui, type:util` is the strict reading. It comes from the Nrwl "Enterprise Angular Monorepo Patterns" taxonomy. Nx's own more recent blog material sometimes shows `ui -> data-access`. The sources genuinely disagree. We take the strict reading deliberately; see Alternatives rejected.

3. **The scope constraint fixes the domain, and is what forbids feature-to-feature coupling.** (**structure**)

   ```text
   scope:shared      ->  scope:shared
   scope:<domain>    ->  scope:<domain>, scope:shared
   scope:app         ->  *
   ```

   A dependent must satisfy both rules. `declare_package_groups()` declares one `package_group` per type and scope, listing the packages both rules allow to depend on a library of that type and scope, and a library's `visibility` is that group. A page library therefore cannot import another page library, because their scopes differ, even though the type rule would permit `feature -> feature`.

   This placement is deliberate. Expressing the ban at scope level rather than type level means a feature that genuinely serves more than one domain has a legal home: it moves to `scope:shared`. `resource-editor` is already exactly that. It is imported by `apps/dsp-app`, by `pages/data-browser` and, through a dynamic `import()` in `data-class-panel.component.ts`, by `pages/project`, and it imports no page library at all. It becomes `scope:shared, type:feature` and all three edges stay legal. `pages/data-browser` is the second case: nothing routes to it directly and three libraries render it inside themselves (ADR-0004, decision 7), so it carries the same tags despite its folder.

4. **The type and scope are the truth. The folder is a hint.** (**review**)

   `libs/vre/ui/notification` contains one implementation file, `app-notification.service.ts`, a service wrapping `MatSnackBar`. It is `type:util`, not `type:ui`. Once tagged honestly, the `core/error-handler -> ui/notification` edge is legal and was never the real problem; the folder name was. Folders are renamed to match tags opportunistically, never urgently, because a rename touches every importer and buys nothing the tag does not already buy.

5. **Stories are outside the boundary graph.** (**structure**)

   A library's compile excludes `*.stories.ts`, `*.spec.ts`, `test-setup.ts` and `stories.helpers.ts`, so an edge only a story or a spec uses never becomes an edge of the library. Several stories import across tiers that the runtime code beneath them does not touch: `ui/nested-menu` stories reach `core/config` and `shared/app-helper-services`, and `ui/string-literal` stories reach `core/session`. Stories are test fixtures: only the Storybook build compiles them, and it is no library, so visibility does not apply to it. Without this, the rules fail on libraries whose shipped code is clean.

6. **Enforced, with explicit exceptions.** (**structure**)

   The rules are enforced now, not after the blocking imports of decision 7 are cleared. Each forbidden edge the code still has is an `extra_visibility` entry on the target library's `vre_library`, with a comment naming the ADR and the Linear issue that tracks the move. A forbidden edge that is not listed fails `bazel build`; `just visibility-check`, part of `just ci`, seeds one forbidden edge per tier rule in a scratch copy and asserts that the build rejects it.

   There are eleven exceptions:

   | Library | Visible beyond its rules to | Reason | Issue |
   | --- | --- | --- | --- |
   | `core/config` | `ui/string-literal` | decision 7: `AvailableLanguage` | DEV-7552 |
   | `shared/app-common` | `ui/ui` | decision 7: `joinPlaceholderLegalValues` | DEV-7552 |
   | `shared/app-helper-services` | `ui/string-literal` | decision 7: `pickPreferredLanguageString`, `LocalizationService` | DEV-7552 |
   | `3rd-party-services/open-api` | `ui/string-literal` | decision 7: the language-string shape | DEV-7552 |
   | `pages/project/project` | `pages/ontology/list`, `pages/ontology/ontology`, `pages/search/advanced-search` | ADR-0004: `ProjectPageService` | DEV-7555 |
   | `pages/user-settings/user` | `pages/ontology/ontology`, `pages/project/project`, `pages/system/system` | ADR-0004: `AllProjectsService`, the user dialogs, `ProjectImageCoverComponent`, `MenuItem`, `existingNamesAsyncValidator` | DEV-7555 |
   | `pages/system/system` | `pages/project/project` | ADR-0004: `CreateUserDialogComponent`, `UserDescriptionComponent` | DEV-7555 |

   An exception is removed in the change that moves its code, and the build then holds the edge closed.

7. **The known blocking imports, and the shape of each fix.** (**review**)

   The constraint block was simulated against the runtime graph of the time, with all twenty-eight projects tagged as in the table below, applying Nx's own evaluation rules: every constraint whose `sourceTag` appears in the source's tags must pass, and within one `onlyDependOnLibsWithTags` the target needs one matching tag. `*.spec.ts` and `*.stories.ts` were excluded as exempt.

   The result is **seventeen violating edges across thirty-nine distinct files**, distributed very unevenly:

   | Constraint | Violating edges | Distinct files |
   | --- | --- | --- |
   | `type:data-access` | 0 | 0 |
   | `type:util` | 0 | 0 |
   | `type:feature`, `type:app` | 0 | 0 |
   | `type:ui` | 4 | 6 |
   | `scope:*` | 13 | 33 |

   The type tier is almost clean. Tagging `dsp-js` per decision 8 and `ui/notification` per decision 4 removes every violation in the `data-access` and `util` tiers, and `type:feature` is unconstrained enough to pass as-is. Essentially all the work is in the scope tier, which is the feature-to-feature coupling ADR-0004 addresses.

   **`type:ui`: six files, one design question and one named compromise.**

   - **`AvailableLanguage` and `AvailableLanguageKeys`** are imported from `core/config` by five files in `ui/string-literal`. They are a language list, not configuration. Extract them into a `type:util` library. This is the whole of the `ui -> core/config` dependency, and removing it lets `core/config` be tagged `type:data-access` honestly, since it also vends `KnoraApiConnection` through `dsp-api-tokens.ts`.
   - **`joinPlaceholderLegalValues`** from `shared/app-common`, used by `ui/ui/src/lib/resource-rights-statement.component.ts:7`. A pure function. Same util library.
   - **`pickPreferredLanguageString`** from `shared/app-helper-services`, used by `ui/string-literal/src/lib/stringify-string-literal.pipe.ts:5`. A pure function. Same util library.
   - **`LanguageStringDto` and `StringLiteralWithLanguage`** from `3rd-party-services/open-api`, used type-only by two files in `ui/string-literal`. Declare the shape locally in the UI library. Share concepts, never shapes (ADR-0004, decision 6).

     This is a collapse, not an addition. `ui/string-literal` currently holds **four** types for the single concept "a string in several languages": `StringLiteral` and `StringLiteralV2` from `dsp-js`, and `LanguageStringDto` and `StringLiteralWithLanguage` from the generated client. `CONTEXT.md` flags the first pair under its own ambiguity and resolves it with "pick by which client you are on, not by preference". That guidance is right for code that is on a client. A presentational library is on neither, which is why the answer here is a local declaration instead, and why this ADR settles that flagged ambiguity for the `type:ui` tier specifically. One local type replaces four imported ones; it does not become a fifth.
   - **`LocalizationService`** from `shared/app-helper-services`, injected by two files in `ui/string-literal`. This is the one genuine `ui -> data-access` dependency and the only one requiring a design decision. Two candidates: pass the active language in as a component input, or read `LOCALE_ID` from `@angular/core`, which is a framework token rather than a workspace dependency. Resolved in the implementing issue, not here.
   - **`dsp-js` value types in `ui/*`** (seven files, one import each: `KnoraDate`, `KnoraPeriod`, `Precision`, `Constants`, `StringLiteral`, `StringLiteralV2`, `ListNodeV2WithAllLanguages`). These are runtime values, not type-only imports, so they cannot be carved out with a type-only exemption. See decision 8, which removes them from the violation list.

   **`scope:*`: thirty-three files, of which the largest single cause is one library.**

   Thirteen edges, listed in full in ADR-0004. Two facts from the simulation shape the work:

   - **`shared/app-common-to-move` is a hub, not a leaf.** Five different page scopes import it across eight files. It cannot simply be retagged, because any tag makes some of those edges illegal: `scope:app` breaks all eight, and `scope:shared` is a lie about a library whose fan-out exceeds its fan-in (ADR-0005). It has to be split before the rules can hold without an allowance for it. What the pages actually take from it is four user-form components (`UserForm`, `UserFormComponent`, `PasswordConfirmFormComponent`, `PasswordFormFieldComponent`, used by `system` and `user`), `SearchTipsComponent` (`advanced-search`), `SplitPipe` (ontology), and three header components.
   - **Two page libraries import the application header.** `pages/search/search` imports `HeaderComponent` and `pages/project/project` imports `HeaderLogoComponent` and `HeaderUserActionsComponent`. The application shell does not own its own header exclusively; two pages render pieces of it. That is a genuine design question rather than a mechanical move, and it is the one part of the split that is not obvious.

   The remaining scope violations are the cross-page symbols triaged in ADR-0004, and `ontology -> project` alone accounts for fourteen files (twelve in `pages/ontology/ontology`, two in `pages/ontology/list`), all importing `ProjectPageService`.

   **As enforced.** The four `type:ui` edges are four of decision 6's exceptions. Of the thirteen scope edges, seven remain as exceptions. The others no longer need one: `pages/search/search-filters` and `shared/app-common-to-move` carry `feature` and `shared`, which makes the edges into them legal. For `app-common-to-move` that is the provisional assignment the tag table below describes, not the split this decision asks for.

8. **`dsp-js` is visible to every library, as a named and expiring compromise.** (**structure**)

   `dsp-js` is two libraries wearing one name: domain value types with no transport (`KnoraDate`, `KnoraPeriod`, `Precision`, `StringLiteral`, `Constants`) and an HTTP client (`KnoraApiConnection` and the v2 endpoints). Tagged only `type:data-access`, the eight `ui -> dsp-js` imports are illegal under decision 2, even though every one of them takes a value type.

   Under Nx this was a dual tag, `type:data-access` and `type:util`. Under Bazel `dsp-js` is a plain `ts_project`, not a `vre_library`, it is not in `LIBRARIES`, and its `visibility` is `//visibility:public`, which amounts to the same. It imports no workspace library at all, so its own fan-out is zero.

   **The cost, stated plainly.** Public visibility makes `dsp-js` importable from `type:util` libraries as well, which means nothing would stop a utility library from importing `KnoraApiConnection`. That is a real hole and it is accepted, because the alternative is either a global exemption or splitting a published package.

   The compromise expires when the value types are separated from the transport layer into their own `type:util` library. That split is a breaking change for external NPM consumers of `@dasch-swiss/dsp-js` (ADR-0002, decision 5) and is therefore not scheduled by this ADR.

9. **`dsp-js` and `3rd-party-services/open-api` are the two `type:data-access` roots**, and `3rd-party-services/api` wraps them. Which of the two clients carries which domain is already recorded in `CLAUDE.md` and is not restated here.

## Resulting rules

`tools/angular/visibility.bzl` holds them: decision 2's table as `TYPE_MAY_DEPEND_ON`, decision 3 as `scope_may_depend_on()`, and every library's type and scope in `LIBRARIES`. `tools/angular/BUILD.bazel` declares the package groups from them, and `vre_library` sets a library's `visibility` to the group of its type and scope, plus its `extra_visibility` entries.

```python
TYPE_MAY_DEPEND_ON = {
    "app": ["feature", "ui", "data-access", "util"],
    "feature": ["feature", "ui", "data-access", "util"],
    "ui": ["ui", "util"],
    "data-access": ["data-access", "util"],
    "util": ["util"],
}

def scope_may_depend_on(src_scope, dst_scope):
    return src_scope == "app" or dst_scope == "shared" or src_scope == dst_scope
```

## Tag assignment

This is the assignment the simulation in decision 7 was run against, so the violation counts there are only valid for these tags. `LIBRARIES` holds it today, with the two differences noted below.

| Project | Tags |
| --- | --- |
| `apps/dsp-app` | `scope:app`, `type:app` |
| `libs/dsp-js` | `scope:shared`, `type:data-access`, `type:util`; `//visibility:public`, not in `LIBRARIES` |
| `libs/vre/3rd-party-services/open-api` | `scope:shared`, `type:data-access` |
| `libs/vre/3rd-party-services/api` | `scope:shared`, `type:data-access` |
| `libs/vre/3rd-party-services/analytics` | `scope:shared`, `type:data-access` |
| `libs/vre/core/config` | `scope:shared`, `type:data-access` |
| `libs/vre/core/session` | `scope:shared`, `type:data-access` |
| `libs/vre/core/error-handler` | `scope:shared`, `type:data-access` |
| `libs/vre/shared/app-common` | `scope:shared`, `type:data-access` |
| `libs/vre/shared/app-helper-services` | `scope:shared`, `type:data-access` |
| `libs/vre/ui/ui` | `scope:shared`, `type:ui` |
| `libs/vre/ui/nested-menu` | `scope:shared`, `type:ui` |
| `libs/vre/ui/string-literal` | `scope:shared`, `type:ui` |
| `libs/vre/ui/date-picker` | `scope:shared`, `type:ui` |
| `libs/vre/ui/progress-indicator` | `scope:shared`, `type:ui` |
| `libs/vre/ui/notification` | `scope:shared`, `type:util` |
| `libs/vre/shared/calendar` | `scope:shared`, `type:util` |
| `libs/vre/resource-editor/resource-editor` | `scope:shared`, `type:feature` |
| `libs/vre/pages/data-browser` | `scope:shared`, `type:feature` |
| `libs/vre/shared/app-help-page` | `scope:shared`, `type:feature` |
| `libs/vre/shared/app-common-to-move` | none yet, see below; `feature`, `shared` in `LIBRARIES` |
| `libs/vre/pages/search/search-filters` | `scope:shared`, `type:feature` (added after the simulation) |
| `libs/vre/pages/project/project` | `scope:project`, `type:feature` |
| `libs/vre/pages/ontology/ontology` | `scope:ontology`, `type:feature` |
| `libs/vre/pages/ontology/list` | `scope:ontology`, `type:feature` |
| `libs/vre/pages/search/search` | `scope:search`, `type:feature` |
| `libs/vre/pages/search/advanced-search` | `scope:search`, `type:feature` |
| `libs/vre/pages/user-settings/user` | `scope:user`, `type:feature` |
| `libs/vre/pages/system/system` | `scope:system`, `type:feature` |

Three entries need their reasoning stated, because none of them follows from the folder name.

`core/config`, `shared/app-common` and `shared/app-helper-services` are `type:data-access`, not `type:util`. Each vends stateful services or reaches the API: `core/config` provides `KnoraApiConnection` through `dsp-api-tokens.ts`, and `app-common` contains `resource.service.ts`. Tagging them `util` would be the convenient choice and would silence the `type:ui` violations, at the cost of letting any utility library import the API connection. The strict reading in decision 2 is worth nothing if the tags are bent to fit it.

`shared/app-common-to-move` is deliberately left unassigned. Decision 7 explains why: every available tag makes some of its eight importing files illegal, so it is split rather than tagged. `LIBRARIES` cannot leave a library out, so it lists it as `feature` and `shared`, which keeps its importers legal until the split; that is the "lie about fan-out" ADR-0005 warns about, accepted for as long as the library exists.

`pages/data-browser` is `scope:shared` although it sits under `pages/`. It is a component library, not a routed page: `apps/dsp-app/src/app/app.routes.ts` never imports it, `pages/project` routes to it through `DataBrowserPageComponent`, and three page libraries embed its internals. ADR-0004 decision 7 records the reasoning. Tagging it honestly makes six cross-page imports across six files legal without any code moving.

Every library carries exactly one type and one scope. `libs/dsp-js` is outside `LIBRARIES`, per decision 8.

## Consequences

**Positive.** A contributor can read a library's `LIBRARIES` entry and know what it may import, without reading its history. A forbidden edge fails the build, so neither a contributor nor an agent can add one by accident. Bazel rebuilds less as the graph loses its false edges. Once page libraries stop importing each other, route-level lazy loading becomes possible for the first time; today it is blocked because every page is reachable from every other, so nothing can be split out of the main bundle. The seventeen cross-page symbols get triaged rather than accumulating (ADR-0004).

**Negative and costs.** Thirty-nine files had to change before the rules could hold without exceptions: six in the `ui` tier, thirty-three across page scopes. Decision 6's eleven exceptions are what remains of them. `shared/app-common-to-move` must be split first, and splitting it surfaces a design question about who owns the application header. The `LocalizationService` question is likewise unresolved. `dsp-js` keeps public visibility that will outlive this ADR, with the hole decision 8 describes.

That cost is concentrated, not spread: the type tier is already clean under these tags, and essentially all of it is the feature-to-feature coupling ADR-0004 exists to remove. Enforcement does not wait for ADR-0004 and ADR-0005 to be carried out: each of their moves removes an exception.

**What this does not catch.** Stating the limits is the point of recording an enforcement level.

- **Sass is not tier-checked.** The shared partials (`_config.scss`, `_mixins.scss`, `_responsive.scss`, `_material-icons.scss`) moved from `apps/dsp-app/src/styles/` into `libs/vre/ui/styles`, a `sass_library` a stylesheet's library declares in its `sass_deps`, so no library reaches into the application any more, and an undeclared `@use` fails the compile. The `styles` target is visible to every library: it carries no code, so a tier for it would add nothing.
- `templateUrl`, `styleUrls` and `assets` entries are strings; visibility sees declared dependencies, not strings.
- Deep imports into files a library does not export are ADR-0002's: an ESLint rule rejects them, not visibility.
- Dynamic `import()` is no escape hatch. A library it reaches must be a declared dependency, or the compile fails with TS2307, and a declared dependency is checked by visibility.
- Nothing depends on the application: no library is in a group that may depend on `app`, and `apps/dsp-app` makes no target visible to a library except the translation files `shared/app-help-page`'s specs read. So "nothing depends on the app" is free rather than earned, and `type:app` should not be credited for it.

## Alternatives rejected

- **Leave `* -> *` in place.** Costs nothing today. It is what produced the eleven cross-page edges, the `core -> ui` edge and twenty-three empty `tags` arrays, and there is no reason to expect a different result from the same configuration.
- **Loose `type:ui` (`ui -> ui, util, data-access`).** Legitimises the `LocalizationService` dependency and removes the need for the `dsp-js` dual tag, so it is cheaper by roughly four files. Rejected because it also legitimises every future service injection into a presentational component, which is the drift this ADR exists to stop. The measured cost of strictness is six files, against thirty-three for the scope tier that must be paid regardless. Strictness in the `ui` tier is the cheap part of this ADR, not the expensive one.
- **Express the feature-to-feature ban as a type constraint.** Simpler to read, but it leaves a genuinely shared feature such as `resource-editor` with no legal home, forcing either an exception or an artificial split. Scope-level expression handles it without a special case.
- **Nx tags under `@nx/enforce-module-boundaries`.** This ADR's mechanism from 2026-09 until Bazel replaced Nx (ADR-0007). The rules are unchanged; visibility enforces them in the build itself, which the repository has anyway, where the lint rule needed a separate run and a matching constraint for every project.
- **Sheriff (SoftArc) instead of the build's visibility.** Sheriff enforces at folder level and closes the deep-import gap that package-level visibility leaves open. It is not rejected on merit; it is deferred to ADR-0002, where the gap it closes is actually discussed. Adopting two boundary tools in one change would make a failing build ambiguous.
- **Feature-Sliced Design.** A real and well-documented methodology, but its tooling, documentation and community are React-centric and it has effectively no Angular presence. Adopting it would mean translating every rule ourselves, with no external material to point a new contributor at.
