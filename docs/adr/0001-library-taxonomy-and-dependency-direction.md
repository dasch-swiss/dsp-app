# ADR-0001: Library taxonomy and enforced dependency direction

- **Status:** Accepted (2026-09-13)
- **Relates to:** ADR-0002 (the barrel is the public interface), ADR-0004 (cross-feature access), ADR-0005 (what `shared/` means), ADR-0006 (the e2e suite is its own project)

## Context

The repository is an Nx monorepo with 29 projects. The folder names (`core/`, `ui/`, `shared/`, `pages/`, `resource-editor/`) suggest a layered architecture. Nothing enforces it.

The decision was started and then abandoned. All twenty-eight library `project.json` files carry a `"tags"` key. Twenty-four of them are `[]`. Four carry real tags using the canonical Nx `type:`/`scope:` convention: `libs/dsp-js` (`scope:shared`, `type:data-access`), `libs/vre/ui/ui`, `libs/vre/ui/nested-menu` and `libs/vre/ui/string-literal` (all `type:ui`). The twenty-ninth project, `apps/dsp-app`, has no `tags` key at all. The rule in `eslint.config.mjs:99` is configured with a single permissive constraint:

```js
depConstraints: [{ sourceTag: '*', onlyDependOnLibsWithTags: ['*'] }]
```

This permits every dependency. Consequently the folder names carry no weight and layering has drifted. Measured on the current tree:

- Eight page libraries form twelve dependency edges among themselves, covering seventeen distinct symbols. The two most-imported are `ProjectPageService` (six importers) and `AllProjectsService` (four).
- `core/error-handler` depends on `ui/notification`.
- `ui/*` reaches into `shared/app-common`, `shared/app-helper-services` and `3rd-party-services/open-api` in four files, and into `dsp-js` in eight more.

The composition root that makes page-to-page imports unnecessary already exists and is already used: `apps/dsp-app/src/app/app.routes.ts` imports all eight page libraries directly and contains zero `loadComponent` and zero `loadChildren` calls. Pages are already assembled by the application. They simply also import each other, which is the part that has no justification.

## Decision

1. **Every project carries one `type:` tag and one `scope:` tag.** (**structure**)

   Types: `app`, `feature`, `ui`, `data-access`, `util`, `e2e`. This is the Nx taxonomy and it is adopted unchanged so that external documentation applies without translation.

   `e2e` has nothing to apply it to at the time of writing. The Cypress suite is not an Nx project: it lives inside the application at `apps/dsp-app/cypress/` as a directory plus an `e2e` target on `apps/dsp-app`, and `eslint.config.mjs:173` excludes that directory from linting entirely, boundary rule included. **ADR-0006 creates `dsp-app-e2e` as a project and gives `e2e` something to tag**, along with the constraint in decision 2. Until that lands, the tag is declared and unused.

   Scopes: `shared` for anything reusable across domains, one scope per page domain (`project`, `ontology`, `search`, `user`, `system`, `data-browser`), and `app` for the application itself.

2. **The type constraint fixes the tier.** (**static-analysis**)

   ```text
   type:app          ->  type:feature, type:ui, type:data-access, type:util
   type:feature      ->  type:feature, type:ui, type:data-access, type:util
   type:ui           ->  type:ui, type:util
   type:data-access  ->  type:data-access, type:util
   type:util         ->  type:util
   type:e2e          ->  type:data-access, type:util
   ```

   `type:ui -> type:ui, type:util` is the strict reading. It comes from the Nrwl "Enterprise Angular Monorepo Patterns" taxonomy. Nx's own more recent blog material sometimes shows `ui -> data-access`. The sources genuinely disagree. We take the strict reading deliberately; see Alternatives rejected.

3. **The scope constraint fixes the domain, and is what forbids feature-to-feature coupling.** (**static-analysis**)

   ```text
   scope:shared      ->  scope:shared
   scope:<domain>    ->  scope:<domain>, scope:shared
   scope:app         ->  *
   ```

   Nx evaluates every matching constraint, so a library tagged `scope:project, type:feature` must satisfy both blocks. A page library therefore cannot import another page library, because their scopes differ, even though the type rule would permit `feature -> feature`.

   This placement is deliberate. Expressing the ban at scope level rather than type level means a feature that genuinely serves more than one domain has a legal home: it moves to `scope:shared`. `resource-editor` is already exactly that. It is imported by `apps/dsp-app` and by `pages/data-browser`, and it imports no page library at all. It becomes `scope:shared, type:feature` and the existing edge stays legal.

4. **The tag is the truth. The folder is a hint.** (**review**)

   `libs/vre/ui/notification` contains one implementation file, `app-notification.service.ts`, a service wrapping `MatSnackBar`. It is `type:util`, not `type:ui`. Once tagged honestly, the `core/error-handler -> ui/notification` edge is legal and was never the real problem; the folder name was. Folders are renamed to match tags opportunistically, never urgently, because a rename touches every importer and buys nothing the tag does not already buy.

5. **`*.stories.ts` is exempt from `@nx/enforce-module-boundaries`.** (**structure**)

   `eslint.config.mjs` already switches the rule off for `**/environment*.ts` (line 118) and `**/*.spec.ts` (line 125). It says nothing about stories, so stories are currently boundary-checked. Several stories import across tiers that the runtime code beneath them does not touch: `ui/nested-menu` stories reach `core/config` and `shared/app-helper-services`, and `ui/string-literal` stories reach `core/session`. Stories are test fixtures and receive the same exemption as specs. Without this, the constraint block below fails on libraries whose shipped code is clean.

6. **Rollout order is forced by the tool, not chosen by us.** (**structure**)

   The Nx rule states: "A project without tags matching at least one constraint cannot depend on any libraries." The moment one real constraint replaces the `*` constraint, every project matching none of the constraints loses the ability to depend on anything. The order is therefore:

   a. Tag all twenty-nine projects and add the stories exemption, while `{ sourceTag: '*', onlyDependOnLibsWithTags: ['*'] }` is still in place. No lint behaviour changes.
   b. Clear the blocking imports listed in decision 7.
   c. Replace the constraint block in a single commit.

   Steps (a) and (c) must not be combined into one change.

7. **The known blocking imports, and the shape of each fix.** (**review**)

   The constraint block was simulated against the current runtime graph, with all twenty-nine projects tagged as in the table below, applying Nx's own evaluation rules: every constraint whose `sourceTag` appears in the source's tags must pass, and within one `onlyDependOnLibsWithTags` the target needs one matching tag. `*.spec.ts` and `*.stories.ts` were excluded as exempt.

   The result is **twenty-one violating edges across forty-five distinct files**, distributed very unevenly:

   | Constraint | Violating edges | Distinct files |
   | --- | --- | --- |
   | `type:data-access` | 0 | 0 |
   | `type:util` | 0 | 0 |
   | `type:feature`, `type:app` | 0 | 0 |
   | `type:ui` | 4 | 6 |
   | `scope:*` | 17 | 39 |

   The type tier is almost clean. Tagging `dsp-js` per decision 8 and `ui/notification` per decision 4 removes every violation in the `data-access` and `util` tiers, and `type:feature` is unconstrained enough to pass as-is. Essentially all the work is in the scope tier, which is the feature-to-feature coupling ADR-0004 addresses.

   **`type:ui`: six files, one design question and one named compromise.**

   - **`AvailableLanguage` and `AvailableLanguageKeys`** are imported from `core/config` by five files in `ui/string-literal`. They are a language list, not configuration. Extract them into a `type:util` library. This is the whole of the `ui -> core/config` dependency, and removing it lets `core/config` be tagged `type:data-access` honestly, since it also vends `KnoraApiConnection` through `dsp-api-tokens.ts`.
   - **`joinPlaceholderLegalValues`** from `shared/app-common`, used by `ui/ui/src/lib/resource-rights-statement.component.ts:7`. A pure function. Same util library.
   - **`pickPreferredLanguageString`** from `shared/app-helper-services`, used by `ui/string-literal/src/lib/stringify-string-literal.pipe.ts:5`. A pure function. Same util library.
   - **`LanguageStringDto` and `StringLiteralWithLanguage`** from `3rd-party-services/open-api`, used type-only by two files in `ui/string-literal`. Declare the shape locally in the UI library. Share concepts, never shapes (ADR-0004, decision 6).

     This is a collapse, not an addition. `ui/string-literal` currently holds **four** types for the single concept "a string in several languages": `StringLiteral` and `StringLiteralV2` from `dsp-js`, and `LanguageStringDto` and `StringLiteralWithLanguage` from the generated client. `CONTEXT.md` flags the first pair under its own ambiguity and resolves it with "pick by which client you are on, not by preference". That guidance is right for code that is on a client. A presentational library is on neither, which is why the answer here is a local declaration instead, and why this ADR settles that flagged ambiguity for the `type:ui` tier specifically. One local type replaces four imported ones; it does not become a fifth.
   - **`LocalizationService`** from `shared/app-helper-services`, injected by two files in `ui/string-literal`. This is the one genuine `ui -> data-access` dependency and the only one requiring a design decision. Two candidates: pass the active language in as a component input, or read `LOCALE_ID` from `@angular/core`, which is a framework token rather than a workspace dependency. Resolved in the implementing issue, not here.
   - **`dsp-js` value types in `ui/*`** (eight files: `KnoraDate`, `KnoraPeriod`, `Precision`, `Constants`, `StringLiteral`, `StringLiteralV2`, `ListNodeV2WithAllLanguages`). These are runtime values, not type-only imports, so they cannot be carved out with a type-only exemption. See decision 8, which removes them from the violation list.

   **`scope:*`: thirty-nine files, of which the largest single cause is one library.**

   Seventeen edges, listed in full in ADR-0004. Two facts from the simulation shape the work:

   - **`shared/app-common-to-move` is a hub, not a leaf.** Five different page scopes import it across nine files. It cannot simply be retagged, because any tag makes some of those edges illegal: `scope:app` breaks all nine, and `scope:shared` is a lie about a library whose fan-out exceeds its fan-in (ADR-0005). It has to be split before the constraint block is swapped, so it is on the critical path. What the pages actually take from it is four user-form components (`UserForm`, `UserFormComponent`, `PasswordConfirmFormComponent`, `PasswordFormFieldComponent`, used by `system` and `user`), `SearchTipsComponent` (both search libraries), `SplitPipe` (ontology), and three header components.
   - **Two page libraries import the application header.** `pages/search/search` imports `HeaderComponent` and `pages/project/project` imports `HeaderLogoComponent` and `HeaderUserActionsComponent`. The application shell does not own its own header exclusively; two pages render pieces of it. That is a genuine design question rather than a mechanical move, and it is the one part of the split that is not obvious.

   The remaining scope violations are the cross-page symbols triaged in ADR-0004, and `ontology -> project` alone accounts for twelve files, all importing `ProjectPageService`.

8. **`dsp-js` is tagged both `type:data-access` and `type:util`, as a named and expiring compromise.** (**static-analysis**)

   `dsp-js` is two libraries wearing one name: domain value types with no transport (`KnoraDate`, `KnoraPeriod`, `Precision`, `StringLiteral`, `Constants`) and an HTTP client (`KnoraApiConnection` and the v2 endpoints). Tagged only `type:data-access`, the eight `ui -> dsp-js` imports are illegal under decision 2, even though every one of them takes a value type.

   The mechanism available is the tag list, not an exception list. `@nx/enforce-module-boundaries` in Nx 23 accepts only `sourceTag` or `allSourceTags`, `onlyDependOnLibsWithTags`, `notDependOnLibsWithTags`, `allowedExternalImports` and `bannedExternalImports` on a constraint. There is no per-constraint `allow`, and the two `*ExternalImports` keys govern npm packages rather than workspace libraries, so neither applies to an internal library. The top-level `allow` option does exist, but it exempts an import specifier from boundary checking everywhere, which is broader than intended.

   So `dsp-js` carries both tags. `type:ui -> [type:ui, type:util]` is then satisfied, because a target needs only one of the listed tags. As a source, `dsp-js` must satisfy the `type:data-access`, `type:util` and `scope:shared` constraints simultaneously, which it does vacuously: it imports no workspace library at all, so its fan-out is zero.

   **The cost, stated plainly.** The dual tag makes `dsp-js` importable from `type:util` libraries as well, which means nothing would stop a utility library from importing `KnoraApiConnection`. That is a real hole and it is accepted, because the alternative is either a global exemption or splitting a published package.

   The compromise expires when the value types are separated from the transport layer into their own `type:util` library. That split is a breaking change for external NPM consumers of `@dasch-swiss/dsp-js` (ADR-0002, decision 5) and is therefore not scheduled by this ADR.

9. **`dsp-js` and `3rd-party-services/open-api` are the two `type:data-access` roots**, and `3rd-party-services/api` wraps them. Which of the two clients carries which domain is already recorded in `CLAUDE.md` and is not restated here.

## Resulting constraint block

```js
'@nx/enforce-module-boundaries': [
  'error',
  {
    enforceBuildableLibDependency: true,
    allow: [],
    depConstraints: [
      { sourceTag: 'type:app',         onlyDependOnLibsWithTags: ['type:feature', 'type:ui', 'type:data-access', 'type:util'] },
      { sourceTag: 'type:feature',     onlyDependOnLibsWithTags: ['type:feature', 'type:ui', 'type:data-access', 'type:util'] },
      { sourceTag: 'type:ui',          onlyDependOnLibsWithTags: ['type:ui', 'type:util'] },
      { sourceTag: 'type:data-access', onlyDependOnLibsWithTags: ['type:data-access', 'type:util'] },
      { sourceTag: 'type:util',        onlyDependOnLibsWithTags: ['type:util'] },
      { sourceTag: 'type:e2e',         onlyDependOnLibsWithTags: ['type:data-access', 'type:util'] },

      { sourceTag: 'scope:app',          onlyDependOnLibsWithTags: ['*'] },
      { sourceTag: 'scope:shared',       onlyDependOnLibsWithTags: ['scope:shared'] },
      { sourceTag: 'scope:project',      onlyDependOnLibsWithTags: ['scope:project', 'scope:shared'] },
      { sourceTag: 'scope:ontology',     onlyDependOnLibsWithTags: ['scope:ontology', 'scope:shared'] },
      { sourceTag: 'scope:search',       onlyDependOnLibsWithTags: ['scope:search', 'scope:shared'] },
      { sourceTag: 'scope:user',         onlyDependOnLibsWithTags: ['scope:user', 'scope:shared'] },
      { sourceTag: 'scope:system',       onlyDependOnLibsWithTags: ['scope:system', 'scope:shared'] },
      { sourceTag: 'scope:data-browser', onlyDependOnLibsWithTags: ['scope:data-browser', 'scope:shared'] },
    ],
  },
],
```

## Tag assignment

This is the table step 6(a) applies. It is the assignment the simulation in decision 7 was run against, so the violation counts there are only valid for these tags.

| Project | Tags |
| --- | --- |
| `apps/dsp-app` | `scope:app`, `type:app` |
| `libs/dsp-js` | `scope:shared`, `type:data-access`, `type:util` |
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
| `libs/vre/shared/assets/status-msg` | `scope:shared`, `type:util` |
| `libs/vre/resource-editor/resource-editor` | `scope:shared`, `type:feature` |
| `libs/vre/shared/app-help-page` | `scope:shared`, `type:feature` |
| `libs/vre/shared/app-common-to-move` | none yet, see below |
| `libs/vre/pages/project/project` | `scope:project`, `type:feature` |
| `libs/vre/pages/ontology/ontology` | `scope:ontology`, `type:feature` |
| `libs/vre/pages/ontology/list` | `scope:ontology`, `type:feature` |
| `libs/vre/pages/search/search` | `scope:search`, `type:feature` |
| `libs/vre/pages/search/advanced-search` | `scope:search`, `type:feature` |
| `libs/vre/pages/user-settings/user` | `scope:user`, `type:feature` |
| `libs/vre/pages/system/system` | `scope:system`, `type:feature` |
| `libs/vre/pages/data-browser` | `scope:data-browser`, `type:feature` |

Three entries need their reasoning stated, because none of them follows from the folder name.

`core/config`, `shared/app-common` and `shared/app-helper-services` are `type:data-access`, not `type:util`. Each vends stateful services or reaches the API: `core/config` provides `KnoraApiConnection` through `dsp-api-tokens.ts`, and `app-common` contains `resource.service.ts`. Tagging them `util` would be the convenient choice and would silence the `type:ui` violations, at the cost of letting any utility library import the API connection. The strict reading in decision 2 is worth nothing if the tags are bent to fit it.

`shared/app-common-to-move` is deliberately left unassigned. Decision 7 explains why: every available tag makes some of its nine importing files illegal, so it is split rather than tagged, and the split is a precondition for step (c).

`pages/data-browser` is tagged as its own scope provisionally. Four of its internals are embedded in `pages/project`, which may mean it is shared infrastructure rather than a page. ADR-0004 records this as an open question; if it resolves to shared, its tags become `scope:shared, type:feature` and four violations disappear without any code moving.

Every project carries exactly one `type:` and one `scope:` tag, except `libs/dsp-js`, which carries two `type:` tags per decision 8.

Nx evaluates every constraint whose `sourceTag` appears in the source project's tags, and all of them must pass. Within a single `onlyDependOnLibsWithTags` list, the target needs only one matching tag. Those two facts are what make decisions 3 and 8 work: the scope and type blocks compose, and a dual-tagged target satisfies either.

## Consequences

**Positive.** A contributor can read a library's tags and know what it may import, without reading its history. `nx affected` becomes sharper as the graph loses its false edges. Once page libraries stop importing each other, route-level lazy loading becomes possible for the first time; today it is blocked because every page is reachable from every other, so nothing can be split out of the main bundle. The seventeen cross-page symbols get triaged rather than accumulating (ADR-0004).

**Negative and costs.** Forty-five files must change before the constraint block can be swapped: six in the `ui` tier, thirty-nine across page scopes. `shared/app-common-to-move` must be split first, and splitting it surfaces a design question about who owns the application header. The `LocalizationService` question is likewise unresolved, and both block step (c). `dsp-js` keeps a dual tag that will outlive this ADR, with the hole decision 8 describes. Tagging twenty-nine projects is mechanical but touches every `project.json`.

That cost is concentrated, not spread: the type tier is already clean under these tags, and essentially all of it is the feature-to-feature coupling ADR-0004 exists to remove. This ADR is therefore not independently landable. Step (c) depends on ADR-0004 and ADR-0005 being carried out first.

**What this does not catch.** Stating the limits is the point of recording an enforcement level.

- **Sass is invisible.** Twenty SCSS files `@use` relative paths into `apps/dsp-app/src/styles/`, which inverts the app-to-library arrow. The Nx rule parses TypeScript imports only. This violation remains `docs-only` after this ADR lands and is not fixed by it.
- `templateUrl`, `styleUrls` and `assets` entries are strings and are not analysed.
- Aliased deep imports into files a library does not export are not reliably blocked (Nx issue #29258, closed as "not planned"). ADR-0002 covers this and names the tool that would close it.
- Dynamic `import()` **is** analysed by the rule. There is no gap there, and no need to treat lazy loading as an escape hatch.
- Applications cannot be imported by anything, regardless of tags; Nx enforces this independently of `depConstraints`. So "nothing depends on the app" is free rather than earned, and `type:app` should not be credited for it.
- Nx 20 and later, in TypeScript-monorepo mode, restrict project names to a single `/`. Names such as `@dasch-swiss/vre/pages/project/project` carry three. This is a forward-compatibility risk on a future Nx migration, not a current problem.

### Inherited configuration: `useInferencePlugins: false`

Recorded here because it looks like a decision and is not one, and because the next person to read `nx.json` will otherwise assume somebody weighed it.

`nx.json` sets `"useInferencePlugins": false`. That was written by an automated Nx codemod named `update-18-0-0/disable-crystal-for-existing-workspaces`, whose entire body is `nxJson.useInferencePlugins = false;`. It arrived in commit `1718fb0a7` on 2024-12-09, in a pull request titled "chore: update nx to v18.2.0 and angular to v17.3.0". The same diff carries the other codemods from that migration: `npmScope` removed, `affected.defaultBase` hoisted to `defaultBase`, `cacheableOperations` replaced by per-target `"cache": true`. Nx's intent was that upgrading should not silently change behaviour. The effect is that the pre-18 default has been carried forward through every migration since, and the workspace now runs Nx 23 on it.

The flag is narrower than its name suggests. It gates whether `nx init` and `nx add` **register** inference plugins in future. It does not switch off plugins already listed in `plugins[]`, so `@nx/eslint/plugin` and `@nx/jest/plugin` both run.

The result is that target definition is split three ways, and the split follows no rule:

| Target | Declared in `project.json` | Actually comes from |
| --- | --- | --- |
| `lint` | 1 of 29 projects | inferred by `@nx/eslint/plugin` |
| `test` | 29 of 29, but with no `executor` | inferred by `@nx/jest/plugin`; `project.json` only overlays `options` and `configurations` |
| `build`, `serve`, `e2e`, `storybook` | explicit, with executors | declared outright, pre-inference style |

**Why this is worth fixing rather than tolerating.** Reading a project's `project.json` does not tell you what targets that project has. A `test` entry with no executor is not a target definition, it is a patch applied to one declared somewhere else, and nothing in the file says so. Anyone reasoning about the workspace from its files, a new contributor or an agent working from the repository alone, has to already know which plugins are registered before the configuration means anything. That is the same failure mode as the empty `"tags": []` arrays this ADR exists to fix: configuration that reads as a decision but is an artefact.

The cleanup is to register the remaining inference plugins (`@nx/angular` for `build` and `serve`, `@nx/cypress/plugin`, `@nx/storybook/plugin`) so that every target is inferred and `project.json` holds only genuine per-project overrides. That is deliberately **not** decided here. It is unrelated to boundaries, it touches every `project.json`, and doing it alongside the tag migration would make a broken build ambiguous about which change caused it. It is recorded as known technical debt with a known shape.

One interaction worth noting for ADR-0006: `@nx/cypress/plugin` infers an `e2e` target from any `cypress.config.ts`. If it were registered, the new `dsp-app-e2e` project would receive its target rather than declaring one. That changes the mechanics of ADR-0006, not its decision.

## Alternatives rejected

- **Leave `* -> *` in place.** Costs nothing today. It is what produced the twelve cross-page edges, the `core -> ui` edge and twenty-four empty `tags` arrays, and there is no reason to expect a different result from the same configuration.
- **Loose `type:ui` (`ui -> ui, util, data-access`).** Legitimises the `LocalizationService` dependency and removes the need for the `dsp-js` dual tag, so it is cheaper by roughly four files. Rejected because it also legitimises every future service injection into a presentational component, which is the drift this ADR exists to stop. The measured cost of strictness is six files, against thirty-nine for the scope tier that must be paid regardless. Strictness in the `ui` tier is the cheap part of this ADR, not the expensive one.
- **Express the feature-to-feature ban as a type constraint.** Simpler to read, but it leaves a genuinely shared feature such as `resource-editor` with no legal home, forcing either an exception or an artificial split. Scope-level expression handles it without a special case.
- **Sheriff (SoftArc) instead of Nx tags.** Sheriff enforces at folder level and closes the deep-import gap that Nx leaves open. It is not rejected on merit; it is deferred to ADR-0002, where the gap it closes is actually discussed. Adopting two boundary tools in one change would make a failing build ambiguous.
- **Feature-Sliced Design.** A real and well-documented methodology, but its tooling, documentation and community are React-centric and it has effectively no Angular presence. Adopting it would mean translating every rule ourselves, with no external material to point a new contributor at.
