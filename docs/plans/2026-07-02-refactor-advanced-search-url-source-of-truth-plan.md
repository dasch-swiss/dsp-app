---
title: "refactor: Advanced Search — URL as Single Source of Truth"
type: refactor
date: 2026-07-02
status: in-progress (Phase 0 ✅, Phase 1 ✅, Phase 2 ✅, P2.5 ✅, Phase 3a ✅, 3a.1 ✅ — Phase 3b next)
repository: /Users/julien/WebstormProjects/dsp-das
---

# refactor: Advanced Search — URL as Single Source of Truth (DEV-6576)

## Overview

Migrate the advanced-search feature so that **Angular Router `queryParams` is the single writable
source of truth**. State, the Gravsearch query, and results become pure derivations of the URL.
The three current restore paths (first load, popstate, user action) collapse into one reactive
pipeline, and the parallel `SearchStateService` `BehaviorSubject` (committed state) is retired to
ephemeral edit-state only.

This plan implements **Phases 1–5** of the PRD (`docs/prds/2026-07-02-advanced-search-url-source-of-truth.md`).
**Phase 0 is already done**: `search-url-sync.service.spec.ts` (11 tests) locks the URL param
contract (encode/decode round-trip, readParams/writeState/clearAll).

> **The plan deviates from the PRD's phase list in two ways, both forced by code facts uncovered
> during research and specification review.** These are the most important decisions here — read
> §"Key Decisions" before the phases.

## Problem Statement

Today `SearchStateService` (a `BehaviorSubject<SearchFormsState>`) is the source of truth and the
URL is written as a side effect from **5+ write sites across 3 components**. Restore-from-URL is a
separate imperative path (`_applyParams`) with a duplicated ontology-switch helper and a `_restoring`
guard flag. Two sources of truth are reconciled by hand. This is fragile: the recent order-by
desync bug (multiple fix rounds) was a direct symptom.

Concrete current-state facts (verified, with `file:line`), all under
`libs/vre/pages/search/advanced-search/src/lib/`:

- **Write sites** (not one-per-param): `data-model-chip.component.ts:86` (`ontology` + nulls
  `class`/`filters`/`orderBy`), `resource-class-chip.component.ts:108` (`class` + nulls
  `filters`/`orderBy`), `filter-chip-bar.component.ts:162` (`q`), `:179` (`orderBy` write-back),
  `:261` (`filters` via `_writeFiltersToUrl`), and `search-url-sync.service.ts:59` (`clearAll`).
- **Query reads ambient state** (the crux): `GravsearchService.generateGravSearchQuery`
  (`gravsearch.service.ts:25`) takes `statements`+`fulltext` as args, but
  `_restrictToResourceClassStatement` (`:56`) reads `currentState.selectedResourceClass?.iri` and
  `_getOrderByString` (`:67`) reads `currentState.orderBy` — **directly from the service, not from
  arguments**. Plus `ontoIri`/`ontoShortCode` from `OntologyDataService.selectedOntology`.
- **`OrderByService` auto-syncs** `orderBy` to confirmed statements via a side-effecting
  constructor subscription (`order-by.service.ts:36-48`, `skip(1)` to avoid a circular update) that
  `patchState`s committed state. **The PRD never mentions this.**
- **`PropertyFormManager` grows the statement tree** (blank rows, child statements) by mutating the
  `SearchStateService` subject (`property-form.manager.ts:44-132`) — ephemeral edit-state mixed into
  the same list as committed statements.
- **Restore = 3 paths**: first-load ontology gate (`filter-chip-bar.component.ts:145-153`),
  popstate (`:184-192`), user-action (each handler → `_emitSearch`). Two duplicate ontology-switch
  helpers (`:265-276` obs, `:279-293` imperative).
- **Query→results is a push chain**: `@Output() gravsearchQuery` string → page `query.set()` signal
  → `@if(query())` → `<app-advanced-search-results [query]>` → `ngOnChanges` → internal
  `querySubject` → `resources$` (`advanced-search-page.component.ts:15`, `advanced-search-results.component.ts:92-111`).
- **Readiness is multi-source**: `ontologyLoading$` is `BehaviorSubject(true)`; `resourceClasses$`
  emits `[]` first (`startWith([])`, `ontology-data.service.ts:141`); `_applyParams` explicitly
  waits on `resourceClasses$.pipe(filter(len>0))` and `getProperties$().pipe(take(1))`
  (`filter-chip-bar.component.ts:298-309`).

## Key Decisions

These resolve contradictions the specification review found between the PRD's own constraints.

### D1 — "Gravsearch generation stays as-is" means *output-identical*, not *signature-frozen*

The PRD says query generation is unchanged **and** that no committed state lives in a
`BehaviorSubject`. But `GravsearchService` reads `class` + `orderBy` from `currentState`. These are
irreconcilable as literally written. **Decision:** reinterpret the constraint as *the emitted
Gravsearch string is byte-identical for a fixed input*. We **change `generateGravSearchQuery`'s
signature** to take `resourceClass` and `orderBy` as explicit arguments (and stop reading
`currentState`). The query-building logic and output are untouched. **Guarded by an acceptance
criterion: byte-identical query string before/after, for a fixed URL.**

### D2 — This signature change moves to Phase 1, before the parallel comparison

The PRD's P2 builds new selectors "in parallel" and asserts identical output vs. the old path. But
while `GravsearchService` reads `currentState` (mutated by the old path), the "new" pure selector
would accidentally match the old one — a false positive. **Decision:** make the query function
genuinely pure **first** (Phase 1), so Phase 2's parallel assertion is meaningful.

### D3 — `OrderByService` retirement is an explicit step (missing from the PRD)

The statements→orderBy auto-sync write-back is a *second source of truth* for `orderBy`. **Decision:**
replace it with a pure `orderByItems$` derivation (`combineLatest(confirmed-statements-from-URL,
orderBy-param)`), and delete the constructor subscription. The stale-orderBy cleanup (US-3 AC:
"removing the active-sort filter clears `orderBy` from the URL") becomes an **explicit commit write**
in the filter-removal handler, not an emergent side effect.

### D4 — Ephemeral edit-state gets its own phase (PRD Open Question #1)

Relocating `PropertyFormManager`'s in-progress tree out of the committed source is the largest
un-scoped refactor and it's injected into many deep children via DI. **Decision:** carve it into its
own phase (Phase 3.5) between "flip source of truth" and "retire the subject," so no big-bang step
violates "shippable throughout." The committed/ephemeral boundary is defined as: **committed =
`confirmedStatements` (valid + confirmed, encoded in `filters`); ephemeral = pristine/incomplete
rows and in-progress children (never written to the URL).**

### D5 — "One writer per param" = one *owning* location, atomic multi-param commits allowed

A single user action may still write several params in one `writeState` merge navigate (preserving
one history entry). "One writer" means one code location owns *deciding* a param's value.

### D6 — Two diverging "committed" definitions exist today; the flip unifies them on `confirmedStatements` (behavior change — must be verified)

Research (2026-07-03) uncovered that "committed" is **already duplicated across two owners that can
disagree**, which the PRD/plan did not previously acknowledge:

- The **Gravsearch query** is built from `SearchStateService.validStatementElements`
  (`search-state.service.ts:56`) — *every* `isValidAndComplete` row, **including rows the user has
  filled in but not yet clicked "confirm."** Reached via `_emitSearch` → `filter-chip-bar.component.ts:353`.
- The **URL `filters` param** is built from the component-local `confirmedStatements` signal
  (`filter-chip-bar.component.ts:108`, encoded at `:250-263`) — **only** rows that passed the explicit
  confirm gate (`isValidAndComplete` checked at `filter-editor-popover.component.ts:101`).

So today a valid-but-unconfirmed row can affect the *results* without appearing in the *URL* — a
latent inconsistency (arguably a bug) independent of this refactor.

**Decision:** When Phase 3 makes the query URL-derived, the query's source of truth becomes the
`filters` param, i.e. **`confirmedStatements` semantics win** and the `validStatementElements` path is
retired. This is the correct target (URL = single source of truth), but it is a **behavior change**:
a valid-but-unconfirmed row will no longer alter results until confirmed. This must be:
1. **Called out** as intended (it is — this decision), not discovered as a regression, and
2. **Guarded by a test** (T-D6 below) asserting an unconfirmed-but-valid row does *not* appear in the
   query after the flip — the same test doubles as the ephemeral-exclusion proof (G5/T3.5).

If product wants the old "live preview" behavior (unconfirmed rows affect results), that is a
*separate* feature and out of scope — flag it, don't preserve it by accident.

## Proposed Solution

Target data flow:

```
user action (commit only) → writeState(partial) → router.navigate   ← the ONLY mutation point
route.queryParams → rawParams$ (decode, distinctUntilChanged)
                  → [side effect: setOntology if ontology param changed & not loaded]
                  → searchState$  (gated on readiness: ontologyLoading$ false
                                   + resourceClasses$ non-empty + predicates hydrated)
                  → { resourceClass, statements, orderByItems }
gravsearchQuery$ = pure fn(searchState$, fulltext-param) → string | null
loading$ = derived (ontology + classes + predicates readiness)
page binds [query]="gravsearchQuery$ | async" → results (unchanged internals)
```

Ephemeral editing (blank rows, in-progress children, unconfirmed edits) lives in component-local /
trimmed-service state and is promoted to the URL only on **commit**.

## Technical Approach

### Architecture

- **`SearchUrlSyncService`** gains `params$` (decoded, `distinctUntilChanged` on the decoded shape)
  as the single read stream; keeps `writeState`/`clearAll` as the single write API. `readParams()`
  and `popstate$` become internal/unused once `params$` is the entry point.
- **A new derivation** (either in a `SearchDerivationService` or as observables on the existing
  `SearchStateService` reduced to a facade) exposes `searchState$`, `gravsearchQuery$`, `loading$`.
- **`GravsearchService.generateGravSearchQuery(statements, fulltext, resourceClass, orderBy)`** —
  pure; no `currentState` reads. `ontoIri`/`ontoShortCode` still sourced from `OntologyDataService`
  (ontology is itself URL-driven, acceptable — it is not committed *form* state).
- **`OrderByService`** loses its constructor write-back; exposes a pure `orderByItems$` derivation.
- **`PropertyFormManager`** operates on an ephemeral editing store, seeded from `searchState$` and
  flushed to the URL on commit.
- **Results component** stays as-is (its internal `querySubject` is derived query string, explicitly
  Out of Scope per the PRD — "results component internals").

### Implementation Phases

#### Phase 1: Pure query function + single write API (Foundation) — ✅ DONE (2026-07-02)

**Completion notes:**
- `generateGravSearchQuery(statements, fulltext, resourceClassIri = '', orderBy = [])` — now pure
  w.r.t. form state; removed the `SearchStateService` dependency + `currentState` reads at old
  `gravsearch.service.ts:56,67`. Ontology IRI/short-code still from `OntologyDataService` (by design).
- Sole production caller updated: `filter-chip-bar.component.ts:_emitSearch` passes class iri + orderBy
  explicitly.
- Characterization oracle: existing 26 gravsearch specs stay **byte-identical** (proves D1); added 2
  specs exercising the previously-untested active-orderBy path (`ORDER BY ?resN` + label fallback).
- `clearAll` folded into `writeState` (D5); Phase-0 `clearAll` assertion updated for merge semantics.
- Result: `vre-pages-search-advanced-search` — 132 tests green, lint clean.

**Tasks**
- Change `generateGravSearchQuery(statements, fulltext)` →
  `generateGravSearchQuery(statements, fulltext, resourceClass, orderBy)`; remove
  `currentState` reads at `gravsearch.service.ts:56,67`. Callers pass values explicitly.
- Add a characterization test capturing the **current** query string for a set of fixtures
  (class-only, filters, nested filters, orderBy, fulltext, combinations) — the byte-identity oracle
  for all later phases.
- Route **all** URL writes through `SearchUrlSyncService.writeState`; **fold `clearAll` into a
  `writeState` call** (all params → null, `replaceUrl:true`) — remove the separate `router.navigate`
  at `search-url-sync.service.ts:59-66`. Assign one owning location per param (D5). Keep multi-param
  atomic writes (e.g., ontology-select still clears `class`/`filters`/`orderBy` in one navigate).

**Deliverables**: pure `GravsearchService`; query-string characterization spec; single write API.
**Success criteria**: query string byte-identical vs. characterization oracle; all writes go through
`writeState`; existing tests + Storybook green.
**Effort**: S–M. Low risk (behavior-preserving).

#### Phase 2: Extract pure selectors, run in parallel (Core) — ✅ DONE (2026-07-02)

**Completion notes:**
- `SearchUrlSyncService.params$` — continuous decoded query-param stream, `distinctUntilChanged` on
  the decoded shape (Q9 no-op guard).
- Extracted pure `buildStatementsFromFilterParams` (util) + 8 restore-baseline tests (committed
  separately, `0a26e3a`).
- New `SearchDerivationService` (registered in `providers.ts`, not yet consumed as source of truth):
  `searchState$` (readiness-gated: ontology + classes + predicates), `orderByItems$` (pure, from
  confirmed statements + orderBy param; sortable-aware; stale ids → no active item), `gravsearchQuery$`
  (pure Phase-1 query fn), `loading$` (combined readiness).
- Parallel-comparison satisfied at **test level**: `search-derivation.service.spec` asserts the derived
  query is byte-identical to the pure `GravsearchService` oracle. Chose this over a runtime dev-flagged
  logger — Phase 1's pure query makes the deterministic test oracle stronger, and avoids throwaway code
  in `filter-chip-bar` that Phase 3 deletes.
- Result: `vre-pages-search-advanced-search` — 153 tests green, lint clean.
- **Phase 3 entry point:** the page can bind `[query]="derivation.gravsearchQuery$ | async"` and delete
  the imperative restore paths; `OntologyDataService.setOntology` must be triggered from an
  ontology-param change (co-land with deleting `_applyParamsWithOntologySwitch*`).

**Tasks**
- `rawParams$` = `route.queryParams` → decode → `distinctUntilChanged` on decoded shape (guards Q9:
  no re-execute on identical URL).
- `searchState$` = `rawParams$` **gated on readiness**: `switchMap` through
  `ontologyLoading$ === false` **and** `resourceClasses$` non-empty **and** `getProperties$()`
  hydrated; hydrate IRIs → `{ resourceClass, statements, orderByItems }`. Reuse the existing
  filter-decode→`StatementElement` logic (currently inline in `_applyParams:307-345`) — extract it
  to a pure helper so it is unit-testable (this is the deferred Phase-0 restore baseline).
- `orderByItems$` = pure derivation from `(confirmed statements, orderBy param)` (D3) — build the
  selector but do **not** yet delete `OrderByService`'s subscription.
- `gravsearchQuery$` = pure fn of `searchState$` + fulltext param (uses the Phase-1 pure query fn).
- `loading$` = combined readiness (define explicitly: ontology + classes + predicates).
- **Parallel assertion**: subscribe the new `gravsearchQuery$` alongside the old `@Output` path;
  compare **settled** outputs (after `NavigationEnd`) against the characterization oracle. Log
  divergences behind a dev flag; do not yet flip.

**Deliverables**: `rawParams$`/`searchState$`/`orderByItems$`/`gravsearchQuery$`/`loading$`; extracted
pure decode helper + its unit tests; parallel-comparison harness.
**Success criteria**: derived query matches oracle for all fixtures and settled live navigations; new
selectors have no `currentState` dependency for committed values.
**Effort**: L. Medium risk (readiness gate correctness).

#### Phase 3: Flip the source of truth (Core)

> **Highest-risk phase — it deletes the most code and removes the safety of the parallel path.**
> Research (2026-07-03) confirmed two facts that reshape this phase and are reflected in the
> sub-steps below:
> 1. **`setOntology`-from-param is NOT wired in `SearchDerivationService`.** The service reads
>    `_urlSync.params$` but never reacts to `params.ontology`; the ontology-switch-on-param behavior
>    lives *only* in the imperative `_applyParamsWithOntologySwitch(+Obs)` helpers
>    (`filter-chip-bar.component.ts:266-294`, calling `setOntology` at `:269`/`:283`). If those are
>    deleted before the reaction is added to the derivation, **`loading$` never settles** for any URL
>    that names a non-default ontology. This is the single biggest landmine.
> 2. **`OrderByComponent` still writes through the old service**, not the URL. It reads
>    `orderByService.currentOrderBy` (`order-by.component.ts:36,43`) and calls
>    `orderByService.updateOrderBy(next)` (`:39,:44`). Retiring `OrderByService`'s write-back
>    subscription (`order-by.service.ts:36-49`) is not enough — the component's *own* write path must
>    be redirected to `writeState({ orderBy })`, or the sort control goes read-only.

**Rationale for sub-stepping:** Phase 3 as originally written is one big-bang flip. The sub-steps
below keep the feature shippable after each, and — critically — order the ontology-reaction *before*
the deletion so `loading$` can never hang. Each sub-step is independently mergeable; each has an
explicit **revert = one commit** rollback (the parallel path from Phase 2 stays live until 3d).

**Phase 3a — Add the ontology-param reaction to the derivation (additive, no deletion) — ✅ DONE (2026-07-03, commit `980f7caed`)**
- Added a constructor side effect on `params$` in `SearchDerivationService._reactToOntologyParam`:
  `params.ontology` → `map` → `distinctUntilChanged` → `filter(differs from selectedOntology.iri)` →
  `setOntology`. De-dup verified by T3a. Mirrors the imperative `_applyParamsWithOntologySwitch(+Obs)`
  diff logic (`filter-chip-bar.component.ts:267-268`).
- Nothing deleted; reaction is dormant until the page consumes the derivation (3c/3d).
- **Phase 3a.1 — ✅ DONE (2026-07-03, commit `de12fcb48`):** the deferred `setOntology`-failure case.
  Added the `error` branch to `setOntology` (settle loading + `ontologyError$`), covered by 3 specs in
  `ontology-data.service.spec.ts`. T3a case (c) is satisfied by composition: T3a proves the reaction
  calls `setOntology`; the `ontology-data` specs prove `setOntology` settles loading on failure — no
  redundant wired-together test in the derivation spec (which stubs `OntologyDataService`).

**Phase 3b — Redirect `OrderByComponent` writes to the URL**
- Change `OrderByComponent.onSelectionChange`/`removeOrderBy` (`order-by.component.ts:36-44`) to
  build the next `orderBy` id and call `_urlSync.writeState({ orderBy })` (discrete action ⇒
  `replaceUrl:false`) instead of `orderByService.updateOrderBy`. Read the active item from the pure
  `SearchDerivationService.orderByItems$`, not `currentOrderBy`.
- Add the **explicit stale-orderBy commit write** in the filter-removal handler: when the removed
  filter is the active sort, `writeState({ orderBy: null })` (D3 / US-3 AC).
- Leave `OrderByService`'s constructor write-back (`:36-49`) in place *for now* — it's harmless while
  the old committed subject still exists, and deleting it here would couple 3b to 3d. It's removed in
  3e.
- **Rollback:** revert; component points back at `updateOrderBy`.

**Phase 3c — Consume the derivation on the page (behind the existing `@if` gate)**
- `advanced-search-page.component.ts`: replace the `query` signal fed by `(gravsearchQuery)="query.set($event)"` (`:15,:38`)
  with `query = toSignal(derivation.gravsearchQuery$)`. Keep the `@if(query())` gate (`:20`) and the
  `<app-search-tips>` else branch (`:24-28`); the results binding (`:22`) is unchanged.
- At this point **both paths produce the query**: the old `@Output` still fires but the page ignores
  it. This is the moment the derivation is proven live against real navigation. Keep it here long
  enough to smoke-test (see E2E checklist) — this is the safe checkpoint.
- **Rollback:** revert the page component only; the `@Output` path is still intact.

**Phase 3d — Delete the imperative restore machinery**
- Now that the page reads the derivation, delete from `filter-chip-bar.component.ts`:
  `_applyParams` (`:296-340`), `_applyParamsWithOntologySwitch` (`:280-294`) and its Obs variant
  (`:266-277`), the first-load restore (`:146-154`), the popstate subscription (`:185-193`), the
  `_restoring` guard (`:119` + writes `:242,:247,:316,:337` + read `:175`) and its `skip(1)`
  companion (`:172`), the orderBy write-back subscription (`:170-182`), `_emitSearch` (`:342-360`),
  and the `@Output() gravsearchQuery` (`:96`). `_resetState`/`clearAll` behavior is preserved via
  `writeState` (Phase 1).
- The ontology switch now flows exclusively through Phase 3a's reaction. **This deletion and 3a must
  be verified together** before merge (grep: no remaining `setOntology` call in the component).
- **Rollback:** this is the point of no easy return for the component; keep 3a–3c on `main` for a
  release cycle before merging 3d if you want a safety margin.

**Phase 3e — Retire `OrderByService`'s write-back**
- Delete the constructor subscription (`order-by.service.ts:36-49`) and the `patchState({ orderBy })`
  auto-sync. `orderByItems$` now comes purely from `SearchDerivationService`. `OrderByService` keeps
  only i18n label helpers / `availablePredicates$` if still needed, else is deleted.
- **Rollback:** revert; the (now-orphaned) write-back returns.

**Deliverables**: page consumes derivation; one reactive path; imperative restore + `_restoring`
gone; ontology switch flows through the derivation; `OrderByComponent` writes to the URL;
`OrderByService` pure.
**Success criteria**: first load, popstate, and user actions all run the one pipeline; `loading$`
settles for a non-default-ontology URL; all US-1/2/3 acceptance criteria pass; query byte-identical
vs. the Phase-1 oracle. See Test Plan §Phase 3 and the E2E checklist.
**Effort**: L. High risk — mitigated by the 3a→3e ordering (reaction before deletion) and the 3c
checkpoint where both paths coexist.

#### Phase 3.5: Relocate ephemeral edit-state (Enabler for Phase 4)

> **Research note (2026-07-03):** `PropertyFormManager` holds **no local state today** — it is a pure
> command layer that mutates `SearchStateService` via `patchState`/`updateStatement` (writes at
> `property-form.manager.ts:12,24,31,36,46,59,68,75,107,125`; reads `currentState` at
> `:20,47,76,91,100,121,135,143`). "Give it its own store" therefore means *adding* a store, not
> moving one — smaller than it sounds. The auto-grow logic (`_updateStatementAndUpdateForms:67`,
> `_addEmptyStatementIfNecessary:82`, `_addChildIfNecessary:88`, `_insertChildStatement:99`, cascade
> `_removeChildrenOfStatement:74`) is ~120 lines and stays intact — it just operates on the new store.

**Exact DI consumers (verified — 5, not "4-ish")**, each keeps calling `formManager.*` unchanged:
| Consumer | Calls | Line |
|----------|-------|------|
| `resource-class-chip.component.ts` | `setMainResource` | :104 |
| `filter-chip.component.ts` | `restoreStatement` (commit draft) | :99 |
| `filter-chip-bar.component.ts` | `deleteStatement`, `setMainResource` | :201,:227,:304 (+template :80) |
| `filter-editor-popover.component.ts` | `setSelectedPredicate`/`setSelectedOperator`/`setObjectValue` | :29,:34,:41,:48,:54,:61 |
| `add-filter-button.component.ts` | `addBlankStatement`, `deleteStatement` | :56,:69 |

**Tasks**
- Give `PropertyFormManager` its **own ephemeral store** (a private `BehaviorSubject<StatementElement[]>`
  or signal) for the in-progress statement tree (blank rows, in-progress children, unconfirmed edits).
  It stops reading/writing `SearchStateService`. Seed it from `searchState$` on URL change; the store
  is **never** written to the URL directly.
- **Wire the commit path to the URL, not the store:** the confirm action
  (`filter-chip.component.ts:99` `restoreStatement` → bar `onFilterConfirmed`) is what flushes a valid
  statement to `filters` via `writeState` (this already exists in the bar; keep it as the *only* URL
  write for filters). Per **D6**, the query now reads from `filters`, so confirming is what makes a
  filter affect results.
- **Enforce the D4 boundary + D6 semantics with tests:** pristine/incomplete rows and in-progress
  children **never** appear in `filters` (T3.5/G5, encode-side); a valid-but-*unconfirmed* row does
  **not** appear in the query (T-D6). Committed nested filters still round-trip (extend Phase-0 nested
  test).
- **Reconcile the seed:** `INITIAL_FORMS_STATE` (`search-state.service.ts:8-12`) and the ad-hoc reseed
  in `setMainResource` (`property-form.manager.ts:11-16`) both create a single blank root row — move
  this seeding into the ephemeral store so there's one owner of "the starting blank row."
- **Dead-code cleanup (found in research):** `clearStatementElement` (`property-form.manager.ts:29`)
  has **no caller** in the lib — delete it as part of this phase.

**Deliverables**: ephemeral editing store in `PropertyFormManager`; D4 boundary + D6 semantics tests;
`clearStatementElement` removed.
**Success criteria**: editing UX unchanged across all 5 consumers; ephemeral exclusion enforced by
test; valid-but-unconfirmed rows excluded from the query (D6); committed nested filters round-trip.
**Effort**: M–L. Medium risk — mitigated by: manager has no state to *migrate* (only to add); the 5
consumers' call signatures are unchanged; churn is isolated to the manager internals.

#### Phase 4: Retire the committed BehaviorSubject (Core)

**Tasks**
- Remove committed state (`selectedResourceClass`, committed `statementElements`, `orderBy`) from the
  `SearchStateService` subject. What remains is either nothing (deleted) or an ephemeral editing
  facade from Phase 3.5.
- Confirm no code reads committed state except via the derivation (grep for `currentState`).

**Deliverables**: no committed-state `BehaviorSubject`.
**Success criteria**: Success-metric row 1 met; query byte-identical; all tests green.
**Effort**: M. Medium risk (last consumers).

#### Phase 5: Cleanup (Polish)

**Tasks**
- Update/rewrite Storybook stories to the new data flow; `filter-chip-bar.component.stories.ts`
  (and any exercising `_applyParams`/`_restoring`/popstate) get reworked; stories that no longer make
  sense may be dropped (PRD allows). Enumerate impacted stories (see Documentation Plan).
- Collapse `SearchFlowLogger` to the single pipeline; drop per-concern logging now redundant.
- Lint, tests, a short doc note in the lib README/CLAUDE-adjacent notes.

**Deliverables**: green Storybook (adapted); trimmed logger.
**Success criteria**: lint + unit + interaction tests pass; no dead code.
**Effort**: M. Low risk.

## Test Plan

Concrete, named test cases per phase. Existing coverage (verified 2026-07-03): `search-url-sync`
13, `search-derivation` 11, `gravsearch` ~35, `build-statements` 9, `order-by.service` 7,
`search-state.order-by` 3. The gaps below are the router-facing behaviors and the readiness-gate
*blocking* branches — the weakest area today.

### Gaps to close before Phase 3 lands (highest priority)

| ID | Test | File | Why it matters |
|----|------|------|----------------|
| G1 ✅ | **Readiness gate blocks a premature query.** With a filter-bearing URL, `searchState$`/`gravsearchQuery$` emit **nothing** until ontology loaded + `resourceClasses$` non-empty + predicates hydrated (> synthetic seed). Uses `BehaviorSubject` stubs flipped ready after subscribe; asserts nothing carries the hydrated filter before readiness. | `search-derivation.service.spec.ts` ("readiness gate blocks premature emission (G1)") | The entire point of the gate; previously only the already-ready case was tested. |
| G2 ✅ | **`loading$` blocking branches.** Three cases each → `loading$ === true`: (a) `ontologyLoading` true; (b) `classes.length === 0`; (c) `params.filters` present AND `predicates.length <= 1`. | `search-derivation.service.spec.ts` ("loading$ blocking branches (G2)") | Only the `false`/ready case existed. |
| G3 ✅ | **Byte-identity oracle across the value-type matrix.** Derived query vs. `generateGravSearchQuery(...)` for: nested/child filters, list/int/link value types, orderBy-active, class-less fulltext-only UNION, escaping (quote/backslash/regex metachar). | `search-derivation.service.spec.ts` ("byte-identity oracle matrix (G3)") | Oracle previously covered ~one shape; the rich matrix lived only in the pure gravsearch spec, never through the URL path. |
| G4 ✅ | **End-to-end real-service round-trip.** `encodeFilters` (real) → `queryParams` → `params$` (real) → `searchState$` → `gravsearchQuery$` = oracle. Uses the real `SearchUrlSyncService` (real `Router`/`ActivatedRoute`/`SearchFlowLogger` stubs), not the ad-hoc `decodeFilters` stub. | `search-derivation.service.spec.ts` ("real-service round-trip (G4)") | The two halves of "single source of truth" were only tested in isolation. |

### Phase 3 test cases

- **T3a (Phase 3a):** ontology-param change → `setOntology` called once with the new IRI; unchanged
  ontology param → `setOntology` NOT called (de-dup); `setOntology` failure → `loading$` still
  settles (no permanent hang).
- **T3b (Phase 3b):** selecting a sort → `writeState({ orderBy })` with `replaceUrl:false`; removing
  the active-sort filter → `writeState({ orderBy: null })` (stale cleanup, US-3 AC); `OrderByComponent`
  active item derives from `orderByItems$`, not `currentOrderBy`.
- **T3c (Phase 3c):** page `query` signal reflects `gravsearchQuery$`; `@if(query())` false → tips
  shown; query non-null → results bound. (Component/host test.)
- **T3d (Phase 3d):** first load, popstate, and a user action all produce identical query for the
  same resulting URL (one pipeline). **popstate coverage (G-popstate):** back/forward triggers
  `params$` re-emit and re-derivation — currently untested because the router stub hard-codes
  `events`/`lastSuccessfulNavigation`; add a stub that emits a `NavigationEnd` with
  `trigger === 'popstate'` and assert the pipeline re-runs. Grep-clean: no `_restoring`, no
  `_applyParams`, no `_emitSearch`, no component `setOntology` call.
- **T3e (Phase 3e):** removing the active predicate no longer auto-mutates `orderBy` via the service;
  `orderByItems$` is purely URL-derived; no `patchState({ orderBy })` remains (grep).

### Phase 3.5 / 4 test cases

- **T3.5 (ephemeral exclusion, G5):** an incomplete/in-progress statement (no operator, empty value,
  pristine seed row) is **omitted** from `encodeFilters` and never written to `filters`. Committed
  nested filters still round-trip (extends the Phase-0 nested test). This is an **encode-side**
  exclusion test — today only decode-side skipping and query-time `isValidAndComplete` are covered.
- **T-D6 (unconfirmed-valid exclusion — behavior-change guard):** a row that is `isValidAndComplete`
  but has **not** passed the confirm gate does **not** appear in the query after the flip. Pins D6:
  the query moves from `validStatementElements` (old) to `confirmedStatements`/`filters` (new)
  semantics. Without this test the change is a silent regression to anyone relying on the old
  live-preview-ish behavior.
- **T4:** grep proves no committed-state read (`currentState.selectedResourceClass`,
  `currentState.orderBy`, committed `statementElements`) survives outside the derivation.

### Non-functional assertions (map to Acceptance Criteria)

- **No-op navigation dedup:** `params$` suppression is tested (G-covered). Decide + test the
  **write side**: does `writeState` skip a redundant `navigate` when target == current URL? If yes,
  add the dedup + a test; if no (accepted), pin "writeState always navigates" so the decision is
  explicit (see Open Question below).
- **History semantics:** tie specific actions to push-vs-replace — discrete action (sort, add/remove
  filter, class change) ⇒ `replaceUrl:false` (one history entry); debounced fulltext pause ⇒
  `replaceUrl:false` per pause (resolved decision); continuous typing coalesced by `debounceTime`.

## E2E / Manual Verification Checklist

Unit tests prove the pipeline in isolation; these prove it in a real browser. Run after **Phase 3c**
(safe checkpoint, both paths live) and again after **Phase 3d** (imperative path gone). The order-by
desync bug that motivated this PRD is a browser-level symptom — it must be verified in the browser.

Start the app: `npm run start-local`, open the advanced search.

1. **Share / new tab (US-1):** build a full search (fulltext + class + a filter + a nested child
   filter + order-by). Copy the URL, open in a fresh tab → identical search *and* results, no flash
   of empty results before the ontology loads.
2. **Reload (US-1):** hard-reload the loaded search → all of fulltext, class, filters (incl. nested),
   and order-by restored; results identical.
3. **Non-default ontology in URL (the 3a landmine):** paste a URL naming a *different* data model
   than the default → it loads, `loading$` settles (spinner clears), results render. (This is the
   case that hangs if 3a is missing.)
4. **Back / forward (US-2):** do several discrete steps (change class, add filter, change sort).
   Browser **Back** steps through each prior state and re-runs the query; **Forward** replays them.
   Continuous typing in fulltext does **not** create one history entry per keystroke.
5. **Order-by round-trip (US-3 — the original bug):** change the sort → URL updates, the button label
   updates, results re-order, **all together**. Reload → label reflects the URL. Remove the filter
   that is the active sort → `orderBy` disappears from the URL and the button resets.
6. **No-op guard:** re-selecting the already-active class / re-applying the same sort does not spam
   the network tab with duplicate search requests.
7. **Ephemeral state (US-4 / Phase 3.5):** open a filter editor, start editing but **don't confirm**,
   then reload → the in-progress row is gone (not persisted); previously-confirmed filters remain.

## Sequencing & PR Breakdown

The plan claims "each step independently mergeable" — this makes that concrete. One PR per row;
each merges to the feature branch green and shippable. The **byte-identity oracle (G3) is the gate**
on every PR from Phase 1 onward: no PR merges if the derived query diverges from the oracle.

| PR | Scope | Merge gate (in addition to lint+unit green) | Reversible by |
|----|-------|---------------------------------------------|---------------|
| ~~P0~~ | URL contract tests | done ✅ | — |
| ~~P1~~ | pure query fn + single write API | done ✅ (26 gravsearch specs byte-identical) | — |
| ~~P2~~ | pure selectors, parallel path | done ✅ (oracle at test level) | — |
| ~~P2.5~~ | **Close test gaps G1–G4** (readiness gate, `loading$` branches, oracle matrix, real-service round-trip) | done ✅ (2026-07-03) — 11 new specs, 166 lib tests green, lint clean | revert specs (no prod code) |
| ~~P3a~~ | ontology-param reaction in derivation | done ✅ (2026-07-03) — T3a (4 cases); derivation still not consumed → zero behavior change; 170 tests green | revert 1 commit |
| **P3b** | OrderByComponent writes → URL | T3b; sort still works via old subject too | revert 1 commit |
| **P3c** | page consumes derivation (both paths live) | E2E checklist 1–7 pass; oracle holds on live nav | revert page only |
| **P3d** | delete imperative restore machinery | grep-clean (`_restoring`/`_applyParams`/`_emitSearch`/component `setOntology`); E2E re-run | keep P3a–c a release cycle first |
| **P3e** | retire OrderByService write-back | T3e; grep no `patchState({ orderBy })` | revert 1 commit |
| **P3.5** | relocate ephemeral edit-state | T3.5 (encode-side exclusion); editing UX unchanged | revert (isolated to manager) |
| **P4** | remove committed BehaviorSubject fields | grep no committed `currentState` read; oracle holds | last consumers |
| **P5** | Storybook + logger cleanup | interaction tests green (or documented drops) | revert |

**P2.5 is a new insertion** and the recommended immediate next PR: land the G1–G4 tests *before* any
Phase-3 prod change, so the readiness gate and oracle matrix are locked as a safety net for the flip.
Rationale: these tests are pure additions with zero risk, and they convert the E2E checklist's most
error-prone items (readiness, byte-identity) into fast automated guards.

## Observability During Migration

While the old and new paths coexist (P3c window), you need to *see* divergence, not just assert it
in unit tests. Options, cheapest first:

- **Preferred — test-level oracle only** (already the Phase-2 choice): the G3 matrix in
  `search-derivation.service.spec.ts` is the byte-identity proof. No runtime code. This is sufficient
  if the G3 matrix is comprehensive (that's why P2.5 exists).
- **Optional dev-flagged runtime diff** (only if E2E surfaces a mismatch the matrix missed): in P3c,
  temporarily subscribe both the old `@Output` query and `gravsearchQuery$`, and
  `console.warn` when settled outputs differ (after `NavigationEnd`), behind an
  `if (!environment.production)` flag. This is **throwaway code deleted in P3d** — only add it if the
  automated oracle proves insufficient, to avoid the churn the Phase-2 notes already flagged.
- **`SearchFlowLogger`**: keep it logging both paths through the P3c window so a manual repro shows
  which path produced a given query; collapse to the single pipeline in P5.

**Rollback trigger (explicit):** if E2E item #3 (non-default ontology) or #5 (order-by round-trip)
fails after P3c, do **not** proceed to P3d. Revert the page-consumption commit (P3c is page-only),
fix the derivation, re-verify. The imperative path is still intact until P3d, so this is a clean
one-commit rollback.

## Alternative Approaches Considered

- **Keep `SearchStateService` as a derived write-through cache** (populate it from `searchState$` so
  `GravsearchService` keeps reading `currentState`). Rejected: it keeps a committed-state subject
  (violates Success Criteria #1) and preserves the exact dual-source fragility we are removing.
- **Inject `searchState$` into `GravsearchService` and read latest synchronously.** Rejected:
  reintroduces an ambient read; harder to test than explicit arguments (D1).
- **Adopt NgRx Component Store / Router-Store.** Rejected: PRD constraint (no new state library);
  RxJS + Router suffice.
- **Big-bang rewrite.** Rejected: violates "shippable throughout"; the phased flip keeps each step
  mergeable.

## Acceptance Criteria

### Functional Requirements
- [ ] Opening a copied URL in a new tab reproduces the exact search + results (US-1)
- [ ] Reload preserves fulltext, class, filters (incl. nested), order-by (US-1)
- [ ] URL param format unchanged; existing bookmarks work (US-1) — guarded by Phase-0 contract tests
- [ ] Each discrete action pushes one history entry; back/forward restores via the same pipeline (US-2)
- [ ] Continuous typing coalesces via debounce; each debounced pause = one history entry (US-2)
- [ ] Changing order-by updates URL + history + re-runs query; label reflects URL on load (US-3)
- [ ] Removing the active-sort filter clears `orderBy` from the URL via an explicit commit write (US-3)
- [ ] Adding a new control needs only encode/decode + a commit write — no new restore path (US-4)

### Non-Functional Requirements
- [ ] **Query byte-identity**: emitted Gravsearch string identical before/after each phase for a fixed URL
- [ ] **No re-execution on no-op navigation**: identical URL params do not re-run the search
- [ ] **Readiness gate**: no query emitted before resource classes + predicates are hydrated on a filter-bearing URL
- [ ] **Ephemeral exclusion**: pristine/incomplete/in-progress statements never appear in `filters`
- [ ] OnPush + `AsyncPipe`/`toSignal` throughout; `takeUntilDestroyed` for any imperative subscriptions
- [ ] `@angular/material` only; no `::ng-deep`; control-flow syntax; self-closing selectors

### Quality Gates
- [ ] `nx run vre-pages-search-advanced-search:test` green (incl. new pure-selector + boundary specs)
- [ ] `nx run vre-pages-search-advanced-search:lint` clean
- [ ] Storybook interaction tests updated and passing (or documented removals)
- [ ] No `currentState` committed-state reads remain (grep clean)

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Committed-state sources of truth | 2 (subject + URL) | 1 (URL) | grep: no committed-state `BehaviorSubject` |
| Restore code paths | 3 | 1 | code review |
| Owning writers per param | many/overlapping | 1 each (atomic multi-writes OK) | code review |
| Order-by desync regressions | recurring | 0 | interaction + URL round-trip tests |
| Query round-trip fidelity | partial | 100% (byte-identical) | characterization oracle |

## Dependencies & Prerequisites

- Phase 0 done (URL-contract tests) ✅
- D1 signature change (Phase 1) is a prerequisite for a meaningful Phase 2 parallel assertion (D2)
- Ontology-switch load trigger must co-land with deletion of imperative helpers (Phase 3)
- Phase 3.5 (ephemeral relocation) gates Phase 4

## Risk Analysis & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Phase 2 parallel comparison gives false positives (both read `currentState`) | H (if D2 ignored) | H | D2: make query fn pure in Phase 1 first |
| `OrderByService` second source of truth survives migration | M | H | D3: explicit retirement step + pure `orderByItems$` |
| Ephemeral edit-state relocation becomes big-bang | L (revised) | H | D4: dedicated Phase 3.5; research shows manager has no state to migrate (only to add); 5 consumers' signatures unchanged |
| **Silent behavior change**: query moves from `validStatementElements` (valid rows incl. unconfirmed) to `confirmedStatements`/`filters` (confirmed only) | H (certain, if unguarded) | M | **D6**: called out as intended + guarded by T-D6; if product wants live-preview, that's a separate scoped feature |
| Deleting imperative ontology helper breaks ontology switch (`loading$` hangs on non-default-ontology URL) | H | H | **3a before 3d**: add the `params.ontology → setOntology` reaction to the derivation (currently absent) and verify (T3a) *before* deleting `_applyParamsWithOntologySwitch(+Obs)`. E2E item #3. |
| ~~`setOntology` failure leaves `loading$` stuck true~~ | — | — | **Resolved (3a.1):** `error` branch settles loading + `ontologyError$`; 3 specs |
| `OrderByComponent` write path left pointing at retired service (sort goes read-only) | M | H | Phase 3b explicitly redirects component writes to `writeState` before 3e retires the service |
| Readiness gate emits empty/partial query (classes/predicates not hydrated) | M | M | `loading$` combines ontology + classes + predicates; AC guards |
| No-op navigations re-hit the API | M | M | `distinctUntilChanged` on decoded `rawParams$` |
| Stale `orderBy` param lingers after filter removal | M | M | Explicit commit write in removal handler (D3) |
| Storybook stories break (write/restore paths deleted) | H | L | PRD allows adaptation/failure; enumerate + rewrite in Phase 5 |
| Fulltext `replaceUrl` spec/code mismatch | M | L | Resolve Open Question before Phase 3 |

## Resource Requirements

Single engineer; RxJS + Angular Router + `@angular/material` only. No infra changes. Each phase is
independently mergeable and shippable.

## Future Considerations

- The pure-derivation pattern generalizes: any new search control = encode/decode + one commit write.
- Once `docs/learnings/` exists, capture the "ambient reads defeat parallel-comparison safety nets"
  and "reference-equality streams + in-place mutation" gotchas (the order-by bug) via `eng:compounding`.

## Documentation Plan

- Lib-level note describing the URL-first data flow and the committed/ephemeral boundary.
- Update Storybook stories under `.../advanced-search/src/lib/` — impacted set to enumerate at Phase 5:
  `filter-chip-bar.component.stories.ts` (write/restore), `order-by.component.stories.ts`,
  `advanced-search.component.stories.ts`, and `stories.helpers.ts` (`searchUrlSyncServiceStub`,
  `makeSearchStateServiceStub` — the mocks that encode the old model).
- Update PRD Open Questions as they resolve.

## Open Questions (must resolve before the phase noted)

These are the genuinely-undecided items, tightened with the 2026-07-03 research. The four already-
settled ones are under "Resolved Decisions" below.

- [x] **`setOntology` has no error branch** — *resolved (Phase 3a.1, commit `de12fcb48`).* Added an
  `error` branch to `setOntology` that settles `ontologyLoading` to `false` and exposes the failure via
  a new `ontologyError$` stream (`null` = no error, cleared on the next load). Chosen over a silent
  settle so a future error-state UI has a hook, without forcing a visual change now. `ontologyError$`
  is currently unconsumed — **wiring it to a UI error state (instead of a blank tips fallback) is a
  follow-up**, tracked alongside the empty-results-flash question below and E2E item #3.
- [ ] **Write-side no-op dedup (Phase 3, non-functional AC).** `params$` already suppresses re-derivation
  on identical decoded params, so a redundant `router.navigate` is *mostly* harmless (it self-absorbs).
  Decide whether to also guard `writeState` against navigating to the current URL, or rely solely on the
  read-side guard. **Recommendation:** rely on the read-side guard (simpler; already tested); pin the
  decision with a "writeState always navigates" test so it's explicit, not accidental.
- [ ] **Empty-results flash on first paint (PRD OQ#3).** Does gating `searchState$` on readiness cause a
  visible flash of the `<app-search-tips>` else-branch before the query resolves? The `@if(query())`
  gate shows tips while `query()` is null — during the readiness window that's the tips fallback, not a
  spinner. Decide whether `loading$` should suppress the tips branch (show a spinner instead) while a
  filter-bearing URL is hydrating. **Verify in E2E checklist item #1/#3.** Cheap fix if needed: gate the
  tips branch on `!(loading$ | async)`.
- [ ] **`OrderByService` survival after 3e.** Research shows `OrderByComponent` also uses the service for
  i18n label threading and `availablePredicates$`, not just the write-back. Confirm whether, after
  deleting the write-back (3e), the service still owns label/predicate helpers (keep, trimmed) or those
  move to the derivation (delete entirely). Affects the Phase-4 "delete `OrderByService`" line.

## Resolved Decisions (formerly Open Questions)

- [x] **Fulltext `replaceUrl` policy** (Phase 3): **one history entry per debounced pause** — keep the
  current `replaceUrl:false` after `debounceTime(300)`. The debounce coalesces the keystroke burst
  (satisfies US-2 "continuous typing coalesces"); each pause is a commit that back/forward steps
  through (satisfies US-2 "debounced fulltext pushes one entry"). The PRD's Feature 4 wording
  (`replaceUrl:true` for typing) is corrected — it conflated keystroke-coalescing with
  session-coalescing. No code change to the fulltext write.
- [x] **Where ephemeral edit-state lives** (Phase 3.5): **trimmed `PropertyFormManager`**. It keeps
  ownership of the editing tree + auto-grow logic (`_insertChildStatement`,
  `_addEmptyStatementIfNecessary`, cascade cleanup) but mutates its **own** ephemeral store instead of
  `SearchStateService`. Seeded from `searchState$` on URL change; valid statements flushed to the URL
  on commit. The 4 DI consumers (`filter-chip-bar`, `filter-chip`, `filter-editor-popover`,
  `resource-class-chip`, `add-filter-button`) keep calling `formManager.*` unchanged — churn is
  isolated to the manager. Satisfies "no committed-state `BehaviorSubject`" (its store is ephemeral,
  which the PRD allows). Rejected component-local signals: ~150 lines of shared auto-grow logic would
  duplicate or thread through `@Input`s, risking the nested-filter UX and "shippable throughout."
- [x] **`loading$` composition** (Phase 2): `loading$` is true when `ontologyLoading$` is true **OR**
  `resourceClasses$` is empty **OR** (the URL has `filters` **AND** predicates are not yet hydrated).
  Covers first load, ontology *switch* (loading flips back to true via `setOntology`), and the
  `startWith([])` window. Mirrors what `_applyParams` waits on today
  (`filter-chip-bar.component.ts:298-309`).
- [x] **`clearAll` routing** (Phase 1): **fold into `writeState`** — reset writes all params to null
  with `replaceUrl:true` through the single write API. Removes the separate `router.navigate` in
  `clearAll` (`search-url-sync.service.ts:59-66`); one write path, consistent with D5.

## References & Research

### Internal References
- PRD: `docs/prds/2026-07-02-advanced-search-url-source-of-truth.md`
- Phase-0 contract tests: `libs/vre/pages/search/advanced-search/src/lib/service/spec/search-url-sync.service.spec.ts`
- Orchestrator: `.../ui/chip-bar/filter-chip-bar.component.ts` (`_applyParams`, `_restoring`, `_writeFiltersToUrl`, `_emitSearch`, popstate)
- Query (ambient reads — D1 crux): `.../service/gravsearch.service.ts:25,56,67`
- OrderBy auto-sync (D3): `.../service/order-by.service.ts:36-48`
- Ephemeral tree growth (D4): `.../service/property-form.manager.ts` — command layer, no local state;
  writes `SearchStateService` at `:12,24,31,36,46,59,68,75,107,125`; auto-grow `:67,74,82,88,99,120`;
  dead method `clearStatementElement:29` (no caller)
- **Two "committed" definitions (D6)**: query uses `SearchStateService.validStatementElements`
  (`search-state.service.ts:56`, via `_emitSearch`→`filter-chip-bar.component.ts:353`); URL `filters`
  uses component `confirmedStatements` signal (`:108`, encoded `:250-263`) — these can diverge
- `PropertyFormManager` DI consumers (5): `resource-class-chip:104`, `filter-chip:99`,
  `filter-chip-bar:201,227,304`, `filter-editor-popover:29,34,41,48,54,61`, `add-filter-button:56,69`
- Confirm gate: `filter-editor-popover.component.ts:101` (`isValidAndComplete`), applied on restore at
  `filter-chip-bar.component.ts:324`
- Subject to retire: `.../service/search-state.service.ts`
- Readiness sources (Q6): `.../service/ontology-data.service.ts:31,109,117,140-141,206`
- Multi-param writers: `.../ui/chip-bar/data-model-chip.component.ts:86`, `resource-class-chip.component.ts:108`
- Push chain: `.../advanced-search-page.component.ts:15`, `advanced-search-results.component.ts:92-111`
- Storybook mocks: `.../stories.helpers.ts:15-25,88-108`
- URL sync API: `.../service/search-url-sync.service.ts:50-66`

### External References
- Angular Router `queryParams` observable + `queryParamsHandling: 'merge'` (Angular docs)
- RxJS `switchMap` for dependent async, `distinctUntilChanged`, `combineLatest` (project convention: declarative streams, `AsyncPipe`, `takeUntilDestroyed`)

### Institutional Learnings
- None — `docs/learnings/` does not exist in this repo (confirmed). Consider seeding it post-migration.

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-07-02 | Julien Schneider | Initial draft (research + spec review folded in; D1–D5 decisions, Phase 3.5 added) |
| 2026-07-03 | Julien Schneider | Phase 3 sub-stepped (3a–3e) with rollback per step, ordered so the ontology reaction lands before the imperative deletion; added Test Plan (named cases + gap table G1–G5) and E2E/manual checklist; surfaced 4 open questions (`setOntology` no error branch, write-side dedup, empty-results flash, `OrderByService` survival) from code research (`setOntology`-from-param not yet wired; `OrderByComponent` still writes via the old service). |
| 2026-07-03 | Julien Schneider | Added Sequencing & PR breakdown (incl. new P2.5 = land G1–G4 tests first) and Observability-during-migration section. Rewrote Phase 3.5 with verified 5-consumer map + dead-code removal (`clearStatementElement`). **Added D6**: research found two diverging "committed" definitions (query uses `validStatementElements`; URL uses `confirmedStatements`) — the flip unifies on `confirmedStatements`, a behavior change now called out + guarded by T-D6. |
