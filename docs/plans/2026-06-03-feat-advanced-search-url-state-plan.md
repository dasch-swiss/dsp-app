# feat: Advanced Search URL State

**Date:** 2026-06-03
**Type:** Enhancement
**PRD:** `docs/prd/2026-06-03-advanced-search-url-state.md`

---

## Motivation

The advanced search holds all filter state in memory. Refreshing the page or sharing a URL loses the entire search configuration — a critical friction point in research workflows where filter combinations are complex and reproducible. Encoding state in Angular Router query params gives users shareable URLs and free browser back/forward navigation.

---

## Acceptance Criteria

- [ ] Confirming a filter writes updated query params to the URL (new history entry)
- [ ] The fulltext input value is reflected in the `q` query param
- [ ] The selected resource class IRI is reflected in the `class` query param
- [ ] Confirmed property filters are reflected in the `filters` query param (pipe format)
- [ ] The selected order-by property is reflected in the `orderBy` query param
- [ ] Loading a URL with params restores the search state (best-effort, silently skip unresolvable)
- [ ] Browser back/forward restores the corresponding search state
- [ ] Resetting the search clears all query params
- [ ] Editing a filter in the popover does NOT update the URL until "Add filter" is confirmed
- [ ] Changing the ontology (data model) atomically clears class, filters, and orderBy params

---

## Technical Approach

### URL Query Param Schema

| Param | Example value | Notes |
|---|---|---|
| `q` | `hello world` | Fulltext string, may be empty |
| `ontology` | `http://0.0.0.0/ontology/0803/biblio/v2` | Selected ontology IRI |
| `class` | `http://0.0.0.0/ontology/0803/biblio/v2#Book` | Resource class IRI; absent or empty = all classes |
| `filters` | `http://.../hasTitleIri\|equals\|foo,http://.../hasDate\|exists\|` | Comma-separated pipe-encoded filters |
| `orderBy` | `http://.../hasTitleIri` | Predicate IRI of the active order-by (not the UUID) |

### Filter Pipe Format

Each confirmed filter is encoded as `predicateIri|operator|value`:
- **Exists / NotExists:** `predicateIri|exists|` or `predicateIri|does not exist|` — empty third segment
- **Values containing `|` or `,`:** the value segment is `encodeURIComponent`-encoded
- **`NodeValue` (link/resource):** value segment is the IRI of the selected resource
- **Nested (child) filters:** prefixed with parent index, e.g. `0:predicateIri|operator|value` where `0` is the index of the parent filter in the array

### Key Structural Decisions

**`orderBy` keyed on predicate IRI, not UUID:**
`OrderByService` currently keys `OrderByItem.id` on `StatementElement.id` (a session UUID). This must be changed to use `selectedPredicate.iri` instead. This also requires updating `GravsearchService` wherever it resolves order-by items by statement index.

**URL sync ownership — new `SearchUrlSyncService`:**
A new injectable service (added to `provideAdvancedSearch()`) owns all URL read/write. It:
- Injects `ActivatedRoute` and `Router`
- Exposes `writeState(state: SearchUrlState)` calling `Router.navigate([], { queryParams, queryParamsHandling: 'merge' })`
- Exposes `readParams(): SearchUrlParams` from `ActivatedRoute.snapshot.queryParams`
- Keeps URL logic out of presentation components

**`confirmedStatements` restore:**
`FilterChipBarComponent.confirmedStatements` is a local signal. The restore logic runs inside `FilterChipBarComponent.ngOnInit()`, after `ontologyLoading$` emits `false` (first time), setting `confirmedStatements` from the reconstructed `StatementElement[]`.

**Restore sequence (critical ordering):**
1. `AdvancedSearchComponent.ngOnInit()` calls `OntologyDataService.init(projectIri)`
2. `FilterChipBarComponent.ngOnInit()` reads params from `SearchUrlSyncService.readParams()`
3. Subscribe to `ontologyLoading$.pipe(filter(v => !v), take(1))` — after ontology ready:
   - Restore ontology (already done by step 1 via `ontology` param if passed to `init`)
   - Restore resource class via `PropertyFormManager.setMainResource`
   - Restore filters: build `StatementElement[]` from pipe-encoded params, resolve `Predicate` from `OntologyDataService`, call `confirmedStatements.set(...)`
   - Restore order-by: find matching `OrderByItem` by predicate IRI, set `orderBy = true`
   - Restore fulltext: `fulltextControl.setValue(q, { emitEvent: false })`
4. Emit initial search

**Block first search emission during restore:**
The current `ngOnInit` merge-stream fires immediately. A `restored` signal (starts `false`, set to `true` after restore completes) gates the stream: `filter(() => this.restored())`.

---

## Implementation Steps

### Step 1 — Refactor `OrderByItem.id` to use predicate IRI

**Files:** `model.ts`, `order-by.service.ts`, `gravsearch.service.ts`

- Change `OrderByItem` constructor first param to accept predicate IRI
- Update `OrderByService._computeNextOrderBy` to use `stmt.selectedPredicate!.iri` as the key
- Update `GravsearchService` order-by resolution to match on predicate IRI instead of `statementElements.findIndex`

### Step 2 — Add `SearchUrlSyncService`

**File:** `service/search-url-sync.service.ts` (new)

```typescript
@Injectable()
export class SearchUrlSyncService {
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  readParams(): SearchUrlParams {
    return this.route.snapshot.queryParams;
  }

  writeState(state: Partial<SearchUrlState>): void {
    this.router.navigate([], {
      queryParams: this._toQueryParams(state),
      queryParamsHandling: 'merge',
    });
  }

  clearAll(): void {
    this.router.navigate([], {
      queryParams: { q: null, ontology: null, class: null, filters: null, orderBy: null },
    });
  }
}
```

Add to `provideAdvancedSearch()` in `providers.ts`.

### Step 3 — Filter serializer / deserializer

**File:** `service/search-url-sync.service.ts` (or co-located `filter-url-codec.ts`)

```typescript
// Serialize
function encodeFilters(statements: StatementElement[]): string {
  return statements
    .map((stmt, i) => {
      const prefix = stmt.parentId ? `${parentIndex(stmt, statements)}:` : '';
      const value = encodeURIComponent(stmt.selectedObjectWriteValue ?? '');
      return `${prefix}${stmt.selectedPredicate!.iri}|${stmt.selectedOperator}|${value}`;
    })
    .join(',');
}

// Deserialize
function decodeFilters(raw: string): FilterParam[] {
  return raw.split(',').map(segment => {
    const parentMatch = segment.match(/^(\d+):/);
    const body = parentMatch ? segment.slice(parentMatch[0].length) : segment;
    const [predicateIri, operator, encodedValue] = body.split('|');
    return {
      parentIndex: parentMatch ? +parentMatch[1] : null,
      predicateIri,
      operator: operator as Operator,
      value: decodeURIComponent(encodedValue ?? ''),
    };
  });
}
```

### Step 4 — Wire URL writes in `FilterChipBarComponent`

**File:** `ui/chip-bar/filter-chip-bar.component.ts`

Inject `SearchUrlSyncService`. Call `writeState(...)` after each confirmed state change:

- After `onConfirmNewFilter` — write filters + orderBy
- After `fulltextControl.valueChanges` debounce — write `q`
- After `onRemoveStatement` — write filters
- In `onReset` — call `clearAll()`

For ontology change (handled in `DataModelChipComponent`): call `writeState({ ontology, class: null, filters: null, orderBy: null })` atomically.

### Step 5 — Restore from URL on init

**File:** `ui/chip-bar/filter-chip-bar.component.ts`

```typescript
readonly restored = signal(false);

ngOnInit(): void {
  // gate search emission until restore is done
  merge(...)
    .pipe(filter(() => this.restored()), debounceTime(300), ...)
    .subscribe(() => this._emitSearch());

  // restore after ontology loads
  this._ontologyDataService.ontologyLoading$
    .pipe(filter(loading => !loading), take(1), takeUntilDestroyed(this._destroyRef))
    .subscribe(() => this._restoreFromUrl());
}

private _restoreFromUrl(): void {
  const params = this._urlSyncService.readParams();
  if (params.class) {
    // resolve class from OntologyDataService and call setMainResource
  }
  if (params.filters) {
    const filterParams = decodeFilters(params.filters);
    const statements = this._buildStatementsFromParams(filterParams);
    this.confirmedStatements.set(statements);
  }
  if (params.orderBy) {
    // find OrderByItem by predicateIri and set orderBy = true
  }
  if (params.q) {
    this.fulltextControl.setValue(params.q, { emitEvent: false });
  }
  this.restored.set(true);
}
```

### Step 6 — Add `RouteConstants` entries

**File:** `apps/dsp-app/src/app/app-constants.ts`

```typescript
static readonly advancedSearchQ = 'q';
static readonly advancedSearchOntology = 'ontology';
static readonly advancedSearchClass = 'class';
static readonly advancedSearchFilters = 'filters';
static readonly advancedSearchOrderBy = 'orderBy';
```

---

## Dependencies & Risks

### Dependencies
- `OntologyDataService` must expose a way to resolve a `Predicate` by IRI (check `getProperties$` or add `getPredicateByIri(iri)`)
- `OntologyDataService` must expose a way to resolve a resource class by IRI (check `resourceClasses$` or add lookup)
- `ActivatedRoute` must be available in the component tree — `SearchUrlSyncService` needs to be injected at a level that has access to the route (e.g., `FilterChipBarComponent` or `AdvancedSearchPageComponent`)

### Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `ontologyLoading$` emits `false` before ontology data is usable | Medium | High | Use `filter(v => !v)` + `take(1)` and verify `OntologyDataService.getProperties$` returns data synchronously after load |
| `NodeValue` labels missing on restore | High | Low | Use IRI tail segment as fallback label; full label shown once user opens chip |
| Pipe format breaks on special chars | Medium | Medium | `encodeURIComponent` the value segment; add codec unit tests |
| `confirmedStatements` double-init (restore fires twice) | Low | Medium | Guard with `restored` signal + `take(1)` on ontologyLoading |
| Stale params in URL when ontology switch partially writes | Medium | Medium | Atomic `navigate` on ontology switch, null-out all other params |
| `GravsearchService` breaks after `OrderByItem.id` → predicate IRI change | High | High | Step 1 must be done and tested before any other step |

---

## Out of Scope

- Saved searches (named, server-persisted)
- Pagination state in URL
- Cross-project URL sharing
- Encoding multiple active order-by items (UI enforces single selection)

---

## Open Questions

- Should `class` be omitted from URL when "All resource classes" is selected, or written as empty string? (Recommendation: omit, cleaner URL)
- Should the `q` param update on every debounced keystroke (matching search emission), or only on Enter? (Recommendation: debounced, consistent with search behaviour)
- Does `OntologyDataService` need a new `getPredicateByIri(iri): Predicate | undefined` method, or can restore scan `getProperties$(classIri)` synchronously after load?
