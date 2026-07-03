# vre-advanced-search

The advanced-search chip-bar UI for DSP-APP (DEV-6576).

## Architecture: URL is the single source of truth

The Angular Router `queryParams` are the **only writable source of truth** for a search. State, the
Gravsearch query, and results are pure derivations of the URL. First load, browser back/forward, and
user actions all flow through **one** reactive pipeline — there is no parallel state subject to keep in
sync.

```
user action (commit only) → SearchUrlSyncService.writeState(partial) → router.navigate   ← the ONLY mutation point
route.queryParams → SearchUrlSyncService.params$ (decode, distinctUntilChanged)
                  → SearchDerivationService:
                      • [side effect] setOntology when the `ontology` param changes
                      • searchState$   { resourceClass, statements, orderByItems }  (gated on readiness)
                      • gravsearchQuery$  (pure fn of searchState$ + fulltext param) → string | null
                      • orderByItems$    (pure, from confirmed statements + orderBy param)
                      • loading$         (ontology + classes + predicates readiness)
page: query = toSignal(gravsearchQuery$) → @if(query()) → <app-advanced-search-results [query]>
```

### Key pieces

- **`SearchUrlSyncService`** — the read side (`params$`) and the single write API (`writeState` /
  `clearAll`). URL param schema: `q`, `ontology`, `class`, `filters` (URI-encoded JSON), `orderBy`.
- **`SearchDerivationService`** — all derivations above. No committed form state lives anywhere else.
- **`PropertyFormManager`** — owns the *ephemeral* editing tree (blank rows, in-progress children,
  auto-grow) in its own store, seeded from `searchState$` on every URL change. Never written to the URL
  until a filter is **committed**.
- **`GravsearchService.generateGravSearchQuery(...)`** — pure; takes statements/fulltext/class/orderBy
  as explicit arguments (ontology IRI still sourced from `OntologyDataService`, which is itself
  URL-driven).

### Committed vs ephemeral (the boundary)

- **Committed** = filters the user confirmed → encoded in the `filters` URL param → drive the query.
- **Ephemeral** = pristine/incomplete rows and in-progress children → live only in
  `PropertyFormManager`'s store, never in the URL. A valid-but-*unconfirmed* row does **not** affect
  results (it must be confirmed first).

### Adding a new search control

Only two things are needed — no restore path: (a) encode/decode it in the URL param schema, and (b) a
commit `writeState({ … })`. The derivation and restore come for free.

## Running unit tests

Run `nx test vre-pages-search-advanced-search` to execute the unit tests.
