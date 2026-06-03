# PRD: Advanced Search URL State

**Date:** 2026-06-03
**Status:** Draft

---

## Context

The advanced search currently holds all filter state in memory via `SearchStateService`. When the user refreshes, navigates away, or wants to share a search, the state is lost. This is a friction point for research workflows where search configurations are complex and reproducible.

---

## Goals

1. Every confirmed search state (fulltext, resource class, filters, order-by) is reflected as Angular query params in the URL.
2. Navigating to a URL with params restores the search state (best-effort).
3. Browser back/forward naturally steps through search history.
4. URL updates only on user confirmation — not during popover editing.

---

## Approach

Angular Router query params. On each confirmed state change, navigate with merged query params. On init, read `ActivatedRoute.snapshot.queryParams` and hydrate state after ontology is loaded.

---

## Core Features

### 1. Serialize to URL
On each confirmed state change, `FilterChipBarComponent` calls `Router.navigate` with `{ queryParamsHandling: 'merge' }`.

Query params:
- `q` — fulltext search value
- `class` — selected resource class IRI
- `filters` — JSON-encoded array of `{ predicateIri, operator, value }`
- `orderBy` — selected predicate IRI

### 2. Hydrate from URL on Init
On component init, read `ActivatedRoute.snapshot.queryParams`. Wait for ontology data to be available, then restore:
- `class` → `PropertyFormManager.setMainResource`
- `filters` → rebuild `StatementElement`s and add to confirmed statements
- `orderBy` → set `orderBy` flag on the matching `OrderByItem`
- `q` → set fulltext form control value

### 3. Browser History
Because state lives in query params, Angular router history gives back/forward for free. No extra work needed.

### 4. Best-Effort Restore
If a filter references an IRI that no longer exists in the ontology (deleted property, changed class, etc.), it is silently skipped. No error is shown to the user.

### 5. Reset Clears URL
When the user resets the search, all query params are cleared via `Router.navigate` with `queryParams: {}`.

---

## Constraints

- URL param serialization must remain practical — IRIs are long, so a compact encoding strategy may be needed.
- Hydration must happen after `OntologyDataService` has loaded for the project, since predicate/class IRIs can only be resolved once the ontology is available.
- Must not break the existing draft/confirm flow in the filter popover — the URL updates only on confirm, not during editing.

---

## Out of Scope

- Saved searches (named, persisted server-side)
- Pagination state in URL
- Sharing searches across different projects (IRIs are project-specific)

---

## Decisions

- **Filter encoding:** compact pipe format — `predicateIri|operator|value` per filter, comma-separated. e.g. `?filters=http://example.org/prop|=|foo,http://example.org/prop2|exists|`
- **History strategy:** new history entry on each confirmed change — back/forward steps through individual search states.
