# ADR-0005: What `shared/` means, and what it does not

- **Status:** Accepted (2026-09-13)
- **Relates to:** ADR-0001 (library taxonomy), ADR-0002 (the barrel is the public interface), ADR-0004 (cross-feature access)

## Context

ADR-0004 makes relocation to `scope:shared` the default answer when two features need the same code. That is only safe if `scope:shared` has a definition. Without one, it becomes the place code goes when nobody wants to decide where it belongs, and a shared tier that accumulates by default is the ball of mud the tag system was adopted to prevent.

The repository already contains both the answer and the failure.

**The answer is `libs/vre/shared/calendar`.** It imports nothing from `@dasch-swiss`. It has no Angular dependency injection. It is pure functions and immutable value objects: a `CalendarOperations` strategy interface, one implementation per calendar, a factory, and a Julian Day Number pivot for conversion. Its barrel is seven hand-written named exports with a `@packageDocumentation` block, one of only three curated barrels in the workspace. It has its own `package.json` and a real `@nx/js:tsc` build target emitting to `dist/libs/vre/shared/calendar`. Test coverage is one spec file per implementation file, seven and seven. It has exactly one consumer, `ui/date-picker`, across fourteen files.

That last fact is worth stating plainly rather than hiding: the best library in the repository is used by one other library. Being a good library is not the same as being widely used, and the criteria below measure the former.

**The failures are three libraries whose names describe their location rather than their contents.**

`libs/vre/shared/app-common-to-move` says so in its own name. It contains `header/`, `user-form/`, `split.pipe.ts` and `search-params.interface.ts`. The header is the application shell. Measured across libraries, it has a fan-in of six and a fan-out of nine: it consumes from more libraries than consume it. That is the shape of a feature, not of shared infrastructure.

`libs/vre/shared/app-helper-services` is imported by sixty-nine files and contains eight unrelated things: a localization service, an ontology service, a project service, a per-project rights cache, a result-state service, a sorting helper, a pure language-picking function, and a `default-data` folder. The ontology property-type registry lives here rather than in the ontology library.

`libs/vre/shared/app-common` is imported by eighty-two files and contains animations, regular expressions, directives, a download helper, a resource model, form validators, two generators, XML handling, legal helpers, list GUI attributes, an interface, a service that calls the API, RxJS operators and permission logic.

The last two are instructive because a fan-in-versus-fan-out test passes both of them. `app-common` has a fan-in of twelve libraries against a fan-out of two. By direction alone it looks like an excellent shared library. It is not, because it has no single reason to change. One test is not enough.

## Decision

A library qualifies for `scope:shared` only if it passes both tests.

1. **The direction test: fan-in exceeds fan-out.** (**review**)

   A shared library is consumed more than it consumes. A library that reaches into more libraries than reach into it is a consumer wearing a provider's name, and belongs in a feature scope.

   This test fails `app-common-to-move` today, at six in against nine out. `resource-editor` also has a fan-out of fourteen against a fan-in of three (`apps/dsp-app`, `pages/data-browser`, and `pages/project` through a dynamic `import()`), and is nonetheless correctly `scope:shared` under ADR-0001 decision 3, because it is `type:feature`. **The direction test applies to `type:ui`, `type:util` and `type:data-access` libraries.** A shared feature is shared because more than one domain routes to it, not because it is a leaf.

2. **The cohesion test: the library is describable in one sentence without the word "and".** (**review**)

   "Converts between historical calendars" passes. "Localization, ontology lookups, project lookups, rights caching, result state, sorting and language selection" does not. If the sentence needs a list, the library is a folder.

   This test fails `app-helper-services` and `app-common`, both of which pass the direction test comfortably. It is the test that matters for them.

3. **`scope:shared` is not a destination for code that has no other home.** (**review**)

   When neither test passes and the code is genuinely needed by two features, the answer is a new, small, named library, not an addition to an existing grab bag. ADR-0001 already requires one for the four `ui` blockers; that library is named for what it holds, and not `app-common`.

4. **Naming.** A library is named for what it contains, not for where it sits or who uses it. `calendar` is a good name. `app-common`, `app-helper-services` and `app-common-to-move` are not names, they are the absence of a decision. New libraries get real names; existing ones are renamed when they are split, not before, because a rename touches every importer and buys nothing on its own. (**review**)

5. **`shared/calendar` is the reference shape for a new `type:util` library.** (**review**)

   No workspace imports, no dependency injection, pure functions and value objects, a curated named-export barrel, and a spec file per implementation file. Not every utility library will reach this, and none is required to have its own `package.json` or build target, which `calendar` has because it is independently publishable. The parts worth copying are the zero workspace imports, the curated barrel and the test ratio.

6. **A library with no consumers is reviewed, not kept by default.** (**review**)

   Zero consumers is not by itself proof of death, since a service can be reached through a route or a provider list, but it is the trigger for checking. `libs/dsp-js` is explicitly exempt: it is published to NPM, so unused inside this repository says nothing about its external consumers (ADR-0002, decision 5).

   The same review catches the opposite failure: a path alias in `tsconfig.base.json` with no library behind it. Nothing imports it, so nothing fails, and it is stale configuration to remove on sight.

   Both halves have a precedent that has already been executed. When this record was written, `shared/assets/status-msg` had zero runtime importers and `@dasch-swiss/vre/ontology/ontology-properties` pointed at a directory that did not exist. #3437 deleted the library and the alias.

## The known work

Stating it so that the ADR is falsifiable rather than aspirational.

| Library | Fails | Resolution |
| --- | --- | --- |
| `shared/app-common-to-move` | direction | Split, see below. It cannot be retagged, and it blocks ADR-0001 step (c). |
| `shared/app-helper-services` | cohesion | Split. `LocalizationService` per ADR-0001 decision 7; the ontology property-type registry into the ontology domain; `pickPreferredLanguageString` and `sorting.helper` to `type:util`; the project and rights services to `type:data-access`; `ResourceResultService` reviewed against ADR-0003. |
| `shared/app-common` | cohesion | Split by kind: directives and animations to `type:ui`, validators, regexes and operators to `type:util`, `resource.service.ts` to `type:data-access`. Eighty-two importing files, so this is the largest of the three and should be done in slices. |
| `ui/notification` | naming | One service file wrapping `MatSnackBar`. Tagged `type:util` per ADR-0001 decision 4. Folder renamed opportunistically. |

### `app-common-to-move` in detail

This one is different from the other three, because it cannot be resolved by tagging it honestly and deferring the move. Its name promised a relocation that never happened, and in the meantime five different page scopes came to depend on it across eight files. Every available tag breaks something: `scope:app` makes all eight importing files illegal, and `scope:shared` is a claim the direction test refuses, at a fan-in of six against a fan-out of nine.

So it is split rather than tagged, and that split is a precondition for ADR-0001 step (c). What is actually inside it, by consumer:

| Contents | Taken by | Destination |
| --- | --- | --- |
| `UserForm`, `UserFormComponent`, `PasswordConfirmFormComponent`, `PasswordFormFieldComponent` | `pages/system`, `pages/user-settings` | `scope:shared`, `type:ui` |
| `SearchTipsComponent` | `pages/search/advanced-search` | `scope:shared`, `type:ui` |
| `SplitPipe` | `pages/ontology` | `scope:shared`, `type:util` |
| `search-params.interface.ts` | (type only) | `scope:shared`, `type:util` |
| `HeaderComponent`, `HeaderLogoComponent`, `HeaderUserActionsComponent` | `pages/search/search`, `pages/project/project` | see below |

The first four rows are mechanical. The header is not.

**The application shell does not exclusively own its own header.** `pages/search/search` imports `HeaderComponent`, and `pages/project/project` imports `HeaderLogoComponent` and `HeaderUserActionsComponent`. Two pages render pieces of the application chrome themselves. Either that is correct, in which case the header components are genuinely `scope:shared, type:ui` and should be named as such, or the shell should own the chrome and the pages should stop importing it. That is a design decision about the application's layout, not a tagging decision, and it is the one part of this split that cannot be made mechanically.

The other three libraries in the table above do not block anything. Their tags can be honest before their folders are.

## Consequences

**Positive.** `scope:shared` has a definition, so ADR-0004's relocation rule has somewhere safe to relocate to. Two grab bags with one hundred and fifty-one importing files between them get a stated resolution rather than continuing to absorb whatever arrives. New libraries have a reference shape to copy.

**Negative and costs.** Both tests are judgment, enforced at review, and nothing in the toolchain checks either. The direction test is computable from the Nx project graph and could be scripted later; the cohesion test cannot. Splitting `app-common` touches eighty-two files, and ADR-0002 decision 4 means the barrels involved keep their `export *` form through the move, so the surface does not narrow at the same time. Three libraries keep misleading names for as long as they keep working.

**Honest limit.** These criteria describe a good shared library. They do not, on their own, stop a well-named cohesive library from being created for something that should not have been shared at all. That judgment stays with ADR-0004 decision 2.

## Alternatives rejected

- **Ban a shared tier entirely and duplicate instead.** Duplication is a real and underused option, and for small pure functions it is often correct. As a blanket rule it fails here, because the genuinely shared things in this workspace, the API clients, the design-system components, the calendar conversions, are exactly the things that must not diverge between features.
- **One criterion, fan-in versus fan-out.** Computable and therefore promotable from `review` to `static-analysis`, which is attractive. Rejected because it passes `app-common` and `app-helper-services`, the two libraries this ADR most needs to catch. A mechanical test that misses the main cases is worse than a judgment call, because it looks like coverage.
- **Rename the three libraries now.** Cheap to describe, and it would make the names honest immediately. Rejected because a rename touches every importer without changing any boundary, producing a large diff that makes the subsequent split harder to review. Names follow the split.
