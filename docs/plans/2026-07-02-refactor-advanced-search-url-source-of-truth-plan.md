---
title: "refactor: Advanced Search — URL as Single Source of Truth"
type: refactor
date: 2026-07-02
status: ready
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

#### Phase 1: Pure query function + single write API (Foundation)

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

#### Phase 2: Extract pure selectors, run in parallel (Core)

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

**Tasks**
- Page binds `[query]="gravsearchQuery$ | async"` (keep `@if(query())` gate + `<app-search-tips>`
  fallback). Remove the `@Output() gravsearchQuery` push chain from `filter-chip-bar`.
- Move the **ontology-param-change → `setOntology`** trigger into the derivation (side effect on
  `rawParams$` when `ontology` changes and differs from loaded), with de-dup (don't reload if
  already loaded). This must land **together with** deleting the imperative ontology-switch helpers
  (Q5 ordering risk).
- Delete `_applyParams`, `_applyParamsWithOntologySwitch(+Obs)`, the popstate handler, the first-load
  restore, and the `_restoring` guard + its `skip(1)` companion. Restore ≡ live use now.
- Delete `OrderByService`'s constructor write-back subscription; switch `OrderByComponent` to the
  pure `orderByItems$`. Add the **explicit commit write** that removes `orderBy` from the URL when
  the active-sort filter is removed (D3 / US-3 AC).

**Deliverables**: page consumes derivation; one reactive path; imperative restore + `_restoring`
gone; `OrderByService` pure.
**Success criteria**: first load, popstate, and user actions all run the one pipeline; all US-1/2/3
acceptance criteria pass; query still byte-identical.
**Effort**: L. High risk (deletes the most code; ontology-switch + orderBy cleanup must co-land).

#### Phase 3.5: Relocate ephemeral edit-state (Enabler for Phase 4)

**Tasks**
- Trim `PropertyFormManager` to own its **own ephemeral store** (decided) for the in-progress
  statement tree (blank rows, in-progress children, unconfirmed edits) — it stops mutating
  `SearchStateService`. Seed it from `searchState$` on URL change; flush valid statements to the URL
  on commit. The 4 DI consumers keep calling `formManager.*` unchanged.
- Define + test the boundary (D4): pristine/incomplete rows and in-progress children **never** appear
  in `filters`. Committed nested filters round-trip (extends Phase-0 nested test).
- Reconcile the initial seed blank row (`SearchStateService.INITIAL_FORMS_STATE`, `:10`) into the
  editing store.

**Deliverables**: ephemeral editing store; committed/ephemeral boundary tests.
**Success criteria**: editing UX unchanged; ephemeral exclusion enforced by test; committed nested
filters round-trip.
**Effort**: M–L. Medium risk (deep DI consumers of `PropertyFormManager`).

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
| Ephemeral edit-state relocation becomes big-bang | M | H | D4: dedicated Phase 3.5; boundary defined + tested |
| Deleting imperative ontology helper breaks ontology switch | M | H | Co-land load trigger + deletion in Phase 3 |
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
- Ephemeral tree growth (D4): `.../service/property-form.manager.ts:44-132`
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
