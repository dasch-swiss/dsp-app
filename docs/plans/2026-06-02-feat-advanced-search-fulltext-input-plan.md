# feat: Add Fulltext Input to Advanced Search

**Date:** 2026-06-02
**Type:** Enhancement
**Status:** Ready for implementation
**PRD:** `docs/prd/2026-06-02-advanced-search-fulltext-input.md`

---

## Problem Statement

The advanced search builds a gravsearch query from visual filter chips (property + operator + value). Users have no way to add a free-text fulltext constraint alongside structured chip filters — they must either use the fulltext search page (losing the structured filters) or add individual chip filters per text property (complex and incomplete).

## Motivation

Users need to combine "find resources of type X with property Y = Z **that also contain the word 'foo'**" in a single query. This bridges the fulltext and advanced search UX into a unified, more powerful workflow.

## Acceptance Criteria

- [ ] A `MatFormField` text input appears above the filter chip bar in the advanced search page
- [ ] Placeholder text: `Search in all text fields`
- [ ] When Search is clicked with a non-empty (and non-whitespace) input, the generated gravsearch WHERE clause includes `?mainRes knora-api:matchesText "term" .`
- [ ] When the input is empty or whitespace-only, no `matchesText` triple is added (query unchanged)
- [ ] The term is trimmed before the empty check and before injection
- [ ] The term is escaped using the gravsearch string literal escape logic before injection
- [ ] Pressing Enter in the fulltext input triggers search (same as clicking Search button)
- [ ] Clicking Reset clears the fulltext input alongside all chips
- [ ] The fulltext input can be used alone (no chips required) — search is valid with only a fulltext term
- [ ] `escapeForGravsearchStringLiteral` is exported from `model.ts` so `GravsearchService` can import it

> **Note on predicate:** `knora-api:matchesText` is the Knora gravsearch resource-level fulltext predicate per the DSP-API spec. Verify against `api.dev.dasch.swiss` before or during implementation — if the correct predicate is different (e.g. `knora-api:matchText` on a virtual property), update the service and this plan accordingly.

---

## Technical Approach

### 1. Export `escapeForGravsearchStringLiteral` from `model.ts`

**File:** `libs/vre/pages/search/advanced-search/src/lib/model.ts:27`

Add `export` keyword to the existing private function:

```diff
-function escapeForGravsearchStringLiteral(value: string): string {
+export function escapeForGravsearchStringLiteral(value: string): string {
```

This function already handles double-backslash and double-quote escaping for SPARQL string literals. It is suitable for `matchesText` string arguments.

> **Note:** The function comment documents it was written for `IsLike` regex patterns (two string-escape layers). Verify that `matchesText` also passes through two escape layers in DSP-API. If `matchesText` only has one escape layer, the escaping must be adjusted or a separate escape function created. If Lucene special characters (`+`, `-`, `*`, `?`, `~`, `^`, `[`, `]`, `{`, `}`, `:`, `!`) need escaping for matchesText, a separate helper should be written.

---

### 2. Update `GravsearchService.generateGravSearchQuery()`

**File:** `libs/vre/pages/search/advanced-search/src/lib/service/gravsearch.service.ts:26`

Add an optional `fulltextTerm?: string` parameter. When provided and non-empty after trimming, inject the triple into the WHERE clause **after** `_restrictToResourceClassStatement()` and **before** the chip `whereClause`. This ordering matches Knora gravsearch best practice (resource-level constraints before property-level ones).

```typescript
import { escapeForGravsearchStringLiteral } from '../model';

generateGravSearchQuery(statements: StatementElement[], fulltextTerm?: string): string {
  const constructStatements = this._buildConstructStatements(statements);
  const whereClause = this._buildWhereClause(statements);
  const trimmedTerm = fulltextTerm?.trim() ?? '';
  const fulltextTriple = trimmedTerm
    ? `?mainRes knora-api:matchesText "${escapeForGravsearchStringLiteral(trimmedTerm)}" .\n`
    : '';

  const gravSearch =
    'PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>\n' +
    `PREFIX ${this.ontoShortCode}: <${this.ontoIri}#>\n` +
    'CONSTRUCT {\n' +
    '?mainRes knora-api:isMainResource true .\n' +
    `${constructStatements}\n` +
    '} WHERE {\n' +
    '?mainRes a knora-api:Resource .\n' +
    `${this._restrictToResourceClassStatement()}\n` +
    `${fulltextTriple}` +
    `${whereClause}\n` +
    '}\n' +
    `${this._getOrderByString(statements)}\n` +
    'OFFSET 0';

  return gravSearch;
}
```

The `matchesText` triple is **not** added to the CONSTRUCT block — it is a WHERE-clause-only filter constraint, not a projected value.

---

### 3. Update `FilterChipBarComponent`

**File:** `libs/vre/pages/search/advanced-search/src/lib/ui/chip-bar/filter-chip-bar.component.ts`

**3a. Add `FormControl` class field:**

```typescript
readonly fulltextControl = new FormControl<string>('');
```

No `FormBuilder` or `FormGroup` needed — consistent with the existing standalone `FormControl` pattern used elsewhere in this library.

**3b. Add imports to component `imports[]` array:**

```typescript
ReactiveFormsModule,
MatFormFieldModule,  // or individual: MatFormField, MatLabel, MatInput
MatIconModule,       // or individual: MatIcon — already imported if MatButtonModule is present
```

Check the existing imports: `MatButtonModule` is already imported. `MatIcon` is likely available. Add `ReactiveFormsModule`, `MatFormField`, `MatLabel`, `MatInput`, `MatIcon` (if not already present).

**3c. Add the fulltext input above the chip bar in the template:**

Insert a new `<mat-form-field>` block **before** the `<div class="chip-bar">` but **inside** the `@else` block (so it doesn't render during ontology loading):

```html
<mat-form-field appearance="outline" style="width: 100%">
  <mat-label>Search in all text fields</mat-label>
  <input
    matInput
    type="text"
    [formControl]="fulltextControl"
    placeholder="Search in all text fields"
    (keydown.enter)="onSearch()" />
  <mat-icon matSuffix>search</mat-icon>
</mat-form-field>
<div class="chip-bar">
  ...
</div>
```

**3d. Update `onSearch()` to pass the fulltext term:**

```typescript
onSearch(): void {
  const query = this._gravsearchService.generateGravSearchQuery(
    this._searchStateService.validStatementElements,
    this.fulltextControl.value ?? ''
  );
  this.gravsearchQuery.emit(query);
}
```

**3e. Update `onReset()` to clear the fulltext input:**

```typescript
onReset(): void {
  this.fulltextControl.reset('');
  this._searchStateService.clearAllSelections();
  this._ontologyDataService.init(this.projectIri);
}
```

---

### 4. SCSS — no changes needed

The new `mat-form-field` is placed **outside** the `.chip-bar` flex container as a sibling block element, so it naturally occupies its own row above the chips. No SCSS changes are required.

---

### 5. Tests — `gravsearch.service.spec.ts`

**File:** `libs/vre/pages/search/advanced-search/src/lib/service/spec/gravsearch.service.spec.ts`

Add a new `describe` block (or extend an existing one) with these cases:

```typescript
describe('generateGravSearchQuery — fulltextTerm', () => {
  it('injects matchesText triple when term is provided', () => {
    const query = gravsearchService.generateGravSearchQuery([], 'hello');
    expect(query).toContain('?mainRes knora-api:matchesText "hello" .');
  });

  it('does not inject matchesText triple when term is empty string', () => {
    const query = gravsearchService.generateGravSearchQuery([], '');
    expect(query).not.toContain('matchesText');
  });

  it('does not inject matchesText triple when term is undefined', () => {
    const query = gravsearchService.generateGravSearchQuery([]);
    expect(query).not.toContain('matchesText');
  });

  it('does not inject matchesText triple when term is whitespace only', () => {
    const query = gravsearchService.generateGravSearchQuery([], '   ');
    expect(query).not.toContain('matchesText');
  });

  it('trims the term before injecting', () => {
    const query = gravsearchService.generateGravSearchQuery([], '  hello  ');
    expect(query).toContain('?mainRes knora-api:matchesText "hello" .');
  });

  it('escapes double quotes in the term', () => {
    const query = gravsearchService.generateGravSearchQuery([], 'say "hi"');
    expect(query).toContain('matchesText');
    expect(query).not.toContain('"say "hi""'); // raw unescaped form must not appear
  });

  it('places matchesText triple after class restriction and before chip statements', () => {
    // set up a statement and check ordering in the WHERE clause
    const query = gravsearchService.generateGravSearchQuery(validStatements, 'foo');
    const matchesIdx = query.indexOf('matchesText');
    const chipIdx = query.indexOf('?mainRes0'); // first chip placeholder
    expect(matchesIdx).toBeLessThan(chipIdx);
  });
});
```

---

## Implementation Phases

### Phase 1 — Service layer (no UI changes)
1. Export `escapeForGravsearchStringLiteral` from `model.ts`
2. Update `GravsearchService.generateGravSearchQuery()` with optional `fulltextTerm` param
3. Add unit tests in `gravsearch.service.spec.ts`
4. Run `nx run vre-pages-search-advanced-search:test` — all tests green

### Phase 2 — UI layer
5. Add `fulltextControl`, update `onSearch()` and `onReset()` in `FilterChipBarComponent`
6. Add the `mat-form-field` input to the template above `.chip-bar`
7. Add required imports to the component `imports[]` array
8. Run `nx run dsp-app:test` — all tests green
9. Manual smoke test: open advanced search, type a term, click Search, verify query contains `matchesText`

---

## Alternative Approaches Considered

| Approach | Verdict |
|---|---|
| New wrapper component for the fulltext input | Rejected — YAGNI; adds component overhead for a single input |
| Add fulltext as a special chip type (like other filters) | Rejected — different UX semantics; chip filters have property+operator+value, fulltext is a free-text box |
| Pass fulltext term through `AdvancedSearchComponent` via `@Input` | Rejected — over-engineering; `FilterChipBarComponent` already owns search execution and has direct access to `GravsearchService` |
| Use `knora-api:matchText` on a virtual `rdfs:label` property | Deferred — verify API behavior; `matchesText` is the documented resource-level predicate |

---

## Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `knora-api:matchesText` predicate is wrong / unsupported | Medium | High | Verify against `api.dev.dasch.swiss` in Phase 2 smoke test before merging |
| `escapeForGravsearchStringLiteral` wrong for matchesText (Lucene chars) | Low-Medium | Medium | Add a test with Lucene special chars; adjust escape if API returns error |
| Two escape layers vs one for `matchesText` | Low | High | Empirically test `\` and `"` in the search term against the API |
| Breaking change to `generateGravSearchQuery` callers | Low | Low | Parameter is optional (`fulltextTerm?`); all existing call sites unaffected |
| `mat-form-field` layout disruption in chip bar | Low | Low | Input is outside `.chip-bar` div; it's a block-level sibling row |

---

## Open Questions

1. **Escape layers for `matchesText`:** Does DSP-API pass the `matchesText` string through two string-escape layers (like `IsLike` regex) or one? Answer determines whether `escapeForGravsearchStringLiteral` is reused or a new escape function is needed.
2. **Lucene special chars:** Should `+`, `-`, `*`, `?`, etc. be escaped for `matchesText`? Or does DSP-API's Lucene integration handle them transparently?
3. **Reset clears results:** After Reset, stale results from the previous query remain visible. This is pre-existing behavior (unrelated to this feature) — flagged as a known follow-up, not a blocker.

---

## Files Changed

| File | Change |
|---|---|
| `libs/vre/pages/search/advanced-search/src/lib/model.ts` | Add `export` to `escapeForGravsearchStringLiteral` (1-char change) |
| `libs/vre/pages/search/advanced-search/src/lib/service/gravsearch.service.ts` | Add `fulltextTerm?` param; inject `matchesText` triple; import escape fn |
| `libs/vre/pages/search/advanced-search/src/lib/ui/chip-bar/filter-chip-bar.component.ts` | Add `FormControl`, update template, update `onSearch()` and `onReset()` |
| `libs/vre/pages/search/advanced-search/src/lib/service/spec/gravsearch.service.spec.ts` | Add 7 new test cases for `fulltextTerm` behavior |
