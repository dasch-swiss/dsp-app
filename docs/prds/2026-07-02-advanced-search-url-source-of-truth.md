---
title: "Advanced Search — URL as Single Source of Truth"
date: 2026-07-02
author: "Julien Schneider"
status: draft
---

# Advanced Search — URL as Single Source of Truth PRD

## Context

The advanced search (DEV-6576, "new design of advanced search in row") replaces the old
stacked-form UI with a compact chip-bar: a data-model chip, a resource-class chip, filter
chips (with nested child statements), an order-by menu, and a fulltext field. It already
syncs search state to URL query params (`q`, `ontology`, `class`, `filters`, `orderBy`) so
searches are bookmarkable and shareable.

However, the **current architecture treats `SearchStateService` (a `BehaviorSubject`) as the
source of truth and writes the URL as a side effect** of component events. Restore-from-URL is
a separate imperative path (`_applyParams`). There are effectively *two* sources of truth kept
in manual sync, with per-concern write paths (filters, fulltext, order-by each have their own).

This design is fragile. A recent bug had the order-by button drift out of sync with the URL and
fail to re-run the query, requiring multiple rounds of fixes — precisely because state and URL
were reconciled by hand. This PRD defines a target architecture where **the URL query params are
the single writable source of truth** and everything else (state, query, results) is a pure
derivation, plus an incremental migration path to get there.

## Goals

- Make **URL query params the single writable source of truth**. Derived state, the Gravsearch
  query, and results become pure functions of the URL.
- Collapse the three code paths (first load, popstate, user action) into **one unified reactive
  derivation**.
- Eliminate the class of "out-of-sync" bugs by removing the parallel `BehaviorSubject` source and
  the manual reconciliation between state and URL.
- Migrate **incrementally, staying shippable**, preserving the URL param format and the current
  tech stack (RxJS + Angular Router, no new state library).

## Core Features

### Feature 1: `queryParams$` as the sole writable source

The Angular Router's `queryParams` observable becomes the single source of truth. The only place
anything *writes* state is a `router.navigate([], { queryParams, queryParamsHandling: 'merge' })`
call. There is no `SearchStateService` `BehaviorSubject` holding a parallel copy of committed
state. "Restore," "popstate," and "user action" stop being distinct concepts — they are all just
*the URL changed*, and one pipeline reacts to it.

### Feature 2: Pure derivation pipeline (`params → state → query → results`)

A chain of pure selectors, each a function of the previous:

- `rawParams$` = decode `queryParams` (`q`, `ontology`, `class`, `filters`, `orderBy`) —
  synchronous, no ontology needed.
- `searchState$` = `rawParams$` **gated on ontology load** (`switchMap` through `ontologyLoading$`):
  hydrates IRIs into `StatementElement[]`, resource class, and `OrderByItem[]`. The same path runs
  for first load, popstate, and user actions.
- `gravsearchQuery$` = pure function of `searchState$` (+ fulltext). Emits `null` when empty.
- Results flow from `gravsearchQuery$`.
- `loading$` is itself derived (ontology not ready ⇒ show progress).

### Feature 3: Commit-only writes + ephemeral edit state

User actions write to the URL only on **commit** (confirm filter, pick class, choose order-by,
debounced fulltext). In-progress UI — a filter chip being edited, keystrokes before the debounce —
lives in **local component state** and never touches the URL until committed. This is the one
deliberate exception to pure derivation, scoped tightly to transient editing.

### Feature 4: Single write API

One `writeState(partial)` helper owns all URL writes (merge semantics; `replaceUrl` policy:
`true` for continuous changes like typing, `false` for discrete actions to build history). Each
param has exactly one writer — no more `_writeFiltersToUrl` also writing `orderBy`.

## User Stories

### US-1: Shareable, reload-safe searches

**As a** researcher
**I want** my full search (fulltext, class, filters, order) to live in the URL
**So that** I can bookmark it, share it, and reload without losing state

**Acceptance Criteria:**
- [ ] Copying the URL and opening it in a new tab reproduces the exact same search and results
- [ ] Reloading the page preserves fulltext, class, filters (including nested), and order-by
- [ ] The URL param format (`q`, `ontology`, `class`, `filters`, `orderBy`) is unchanged from today
      (existing bookmarks still work)

### US-2: Back/forward navigates search history

**As a** researcher
**I want** browser back/forward to step through my searches
**So that** I can undo/redo exploratory steps naturally

**Acceptance Criteria:**
- [ ] Each discrete action (confirm/remove filter, change class, change order-by, debounced
      fulltext) pushes one history entry
- [ ] Back/forward restores the corresponding state and re-runs the query via the *same* derivation
      path as first load
- [ ] Continuous typing coalesces into a single history entry (no per-keystroke entries)

### US-3: Order-by (and every control) stays in sync

**As a** researcher
**I want** changing the sort to update the URL, the button label, and the results together
**So that** the UI never lies about the active search

**Acceptance Criteria:**
- [ ] Changing order-by updates the URL, pushes history, and re-runs the query
- [ ] The order-by label reflects the URL on first load
- [ ] Removing a filter that was the active sort clears `orderBy` from the URL automatically

### US-4: One derivation path (developer story)

**As a** developer
**I want** state, query, and results derived purely from the URL
**So that** I can't introduce out-of-sync bugs by adding a control

**Acceptance Criteria:**
- [ ] No `BehaviorSubject` holds a parallel source of truth for committed search state
- [ ] Adding a new search control requires only: (a) encode/decode in the URL, (b) a commit write —
      no new restore path
- [ ] First load, popstate, and user action share one reactive pipeline

## Constraints

- **Technical:** RxJS + Angular Router only — no NgRx/Component Store/new state library. Derivation
  gated on async ontology load (`ontologyCache`). Gravsearch generation stays as-is
  (`GravsearchService`/`GravsearchWriter`).
- **URL format:** The existing param schema (`q`, `ontology`, `class`, `filters`, `orderBy`) and
  encoding (URI-encoded JSON for `filters`) must stay stable — bookmarked/shared URLs keep working.
- **Storybook:** The existing `*.stories.ts` are a helpful safety net, **not a hard gate**. Stories
  should be updated to match the new data flow; stories that conflict with the correct architecture
  may be reworked or allowed to fail and rewritten. The architecture is the priority.
- **Shippable throughout:** Incremental migration; the feature stays working after each step (no
  long-lived broken branch).

## Success Criteria

| Metric | Current | Target | Measurement Method |
|--------|---------|--------|--------------------|
| Sources of truth for search state | 2 (BehaviorSubject + URL) | 1 (URL) | Code review — no committed-state `BehaviorSubject` |
| Restore code paths | 3 (init, popstate, action) | 1 shared derivation | Code review |
| Per-control URL writers | many (per-concern) | 1 (`writeState`) | Code review |
| Out-of-sync regressions | recurring (order-by) | 0 | URL round-trip + interaction tests |
| URL round-trip fidelity | partial | 100% of committed state | Test: encode→decode→re-encode is identity |

## Out of Scope

- Changing the URL param schema or encoding (keep compatibility)
- Introducing a state-management library
- Redesigning the visual chip UI (already built)
- Persisting *in-progress* edit state to the URL (stays ephemeral by design)
- Server-side rendering / SSR of search state
- Changes to Gravsearch query semantics or the results component internals

## Open Questions

- [ ] Where exactly does ephemeral edit-state live after Phase 4 — a trimmed `SearchStateService`,
      or purely local component signals?
- [ ] Fulltext debounce + `replaceUrl: true`: confirm history coalescing still behaves under the
      derivation model
- [ ] Does gating `searchState$` on ontology load introduce a flash of empty results before the
      ontology is ready, and is `loading$` enough to mask it?

## Next Steps

Sequenced so the feature stays shippable after each step. Each step is independently mergeable.

**Phase 0 — Lock behavior (safety net)**
- [ ] Add URL round-trip tests: encode→decode→re-encode is identity for `q`, `class`, `filters`
      (incl. nested), `orderBy`
- [ ] Add a characterization test/story asserting current restore behavior on first load + popstate
      (baseline to protect)

**Phase 1 — Single write API**
- [ ] Route *all* URL writes through one `writeState(partial)` (merge + `replaceUrl` policy); one
      writer per param
- [ ] Verify one owner per param (e.g. `orderBy` removed from `_writeFiltersToUrl` — already done)

**Phase 2 — Extract pure selectors (no behavior change yet)**
- [ ] `rawParams$` = decode `queryParams` (sync)
- [ ] `searchState$` = `rawParams$` gated on `ontologyLoading$` via `switchMap` → hydrated
      `StatementElement[]` + class + `OrderByItem[]`
- [ ] `gravsearchQuery$` = pure fn of `searchState$` (+ fulltext); `loading$` derived
- [ ] Keep the old path running in parallel; assert the new selectors produce identical output

**Phase 3 — Flip source of truth**
- [ ] Page consumes `gravsearchQuery$`/`loading$` from the derivation, not the component's emitted
      signal
- [ ] Delete the imperative restore paths (`_applyParams`, popstate handler, first-load restore) —
      the derivation replaces all three
- [ ] Remove the `_restoring` guard flag (no longer needed once writes are commit-only and there is
      one path)

**Phase 4 — Retire the parallel source**
- [ ] Reduce `SearchStateService` `BehaviorSubject` to ephemeral edit-state only (in-progress filter
      edits, pre-debounce input), or remove entirely if edit-state can live in components
- [ ] Confirm no code reads committed state from anywhere but the derivation

**Phase 5 — Cleanup**
- [ ] Update/rewrite Storybook stories to match the new data flow; drop or rework stories that no
      longer make sense
- [ ] Update `SearchFlowLogger` to log the single pipeline; remove per-concern logging that is now
      redundant
- [ ] Lint, tests, and a doc note in the lib

---

## Appendix

### Related Documents

- Linear: DEV-6576 — "new design of advanced search in row"
- Branch: `feature/dev-6576-new-design-of-advanced-search-in-row`

### Technical Notes

**Current data flow (state-first, URL as side effect):**

```
user event → SearchStateService (BehaviorSubject = source of truth)
           → component writes URL as a side effect (writeState)
           → component emits gravsearchQuery → page → results
restore:   URL → imperative _applyParams → patches SearchStateService
```

Two sources of truth (state subject + URL), manually kept in sync. Order-by, fulltext, and
filters each have their own write path and restore path.

**Target data flow (URL-first, everything derived):**

```
user event (commit only) → writeState(partial) → router.navigate (only mutation point)
queryParams$ → rawParams$ → [gated on ontology] → searchState$ → gravsearchQuery$ → results
                                                                 ↘ loading$ (derived)
```

The URL is the single writable source; state, query, and results are pure functions of it.
Restore and live use are the same code path. In-progress edit state is the only ephemeral,
component-local exception, promoted to the URL on commit.

**Key existing files:**

- `advanced-search-page.component.ts` — hosts chip bar + results; holds the `query` signal today
- `ui/chip-bar/filter-chip-bar.component.ts` — orchestrates writes/restores today (`_applyParams`,
  `_writeFiltersToUrl`, `_restoring` guard)
- `service/search-url-sync.service.ts` — `readParams`/`writeState`/`popstate$`/encode/decode
- `service/search-state.service.ts` — the `BehaviorSubject` to be retired/reduced
- `service/ontology-data.service.ts` — `ontologyLoading$`, resource classes, predicates
- `service/gravsearch.service.ts` + `gravsearch-writer.ts` — query generation (unchanged)

---

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-07-02 | Julien Schneider | Initial draft |
