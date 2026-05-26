# feat: Advanced Search — Chip-Bar Filter UI

**Date:** 2026-05-26  
**Type:** Enhancement  
**PRD:** `docs/prd/2026-05-26-advanced-search-chip-bar.md`  
**Status:** Ready for implementation

---

## Summary

Replace the stacked vertical Advanced Search form with a Linear-style single-row chip-bar. Every active filter (data model, resource class, property statements, order-by) becomes a clickable pill. Clicking a pill opens a CDK overlay popover to edit it. A `+ Add filter` button appends new property chips. Search and Reset actions live at the right end of the bar. The service layer (`SearchStateService`, `PropertyFormManager`, `OntologyDataService`, `GravsearchService`) is **not modified**.

---

## Motivation

The current UI occupies significant vertical space even for simple searches and makes it hard to see what filters are active at a glance. The chip-bar surfaces all active criteria inline, matches the mental model researchers already use in modern tools, and makes the form dramatically more compact.

---

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Replace or toggle | Full replacement | Simpler, no legacy toggle |
| Ontology switch | Clear all property chips | Same as current behaviour |
| Popover cancel | Revert to pre-open state | Local snapshot before edit |
| Sub-criteria overflow | Wrap to next line | Natural CSS flex-wrap |
| "Use previous search" | Keep as standalone button below chip bar | Preserves feature without polluting chip bar |
| `isVerticalDirection` / `toggleDirection` API | Remove | Only consumer is `AdvancedSearchPageComponent` |
| Blank statement filtering | Filter `isPristine` statements from chip render | Prevents spurious empty chips |
| Multiple open popovers | Opening a new popover closes any open one | Track a single `openChipId` signal |

---

## Architecture Overview

### New Component Tree

```
AdvancedSearchComponent (refactored root)
│
├── FilterChipBarComponent            ← NEW: the full toolbar row
│   ├── DataModelChipComponent        ← NEW: ontology chip + CDK overlay popover
│   ├── ResourceClassChipComponent    ← NEW: resource class chip + CDK overlay popover
│   ├── FilterChipComponent           ← NEW: one chip per non-pristine StatementElement
│   │   └── FilterEditorPopoverComponent  ← NEW: property / operator / value editor
│   │       ├── PredicateSelectComponent   (existing, reused)
│   │       ├── ComparisonOperatorComponent (existing, reused)
│   │       └── [StringValue | LinkValue | ListValue | ResourceValue] (existing, reused)
│   ├── AddFilterButtonComponent      ← NEW: "＋ Add filter" → PropertyPickerPopoverComponent
│   │   └── PropertyPickerPopoverComponent ← NEW: searchable property list
│   └── OrderByComponent              (existing, reused as-is)
│
└── [separate "Use previous search" button below the bar]
```

### File Layout (all new files inside `libs/vre/pages/search/advanced-search/src/lib/`)

```
ui/chip-bar/
  filter-chip-bar.component.ts
  filter-chip-bar.component.scss
  data-model-chip.component.ts
  resource-class-chip.component.ts
  filter-chip.component.ts
  filter-chip.component.scss
  filter-editor-popover.component.ts
  add-filter-button.component.ts
  property-picker-popover.component.ts
  chip-label.pipe.ts                  ← pure pipe: StatementElement → display string
  chip-bar.helpers.ts                 ← shared types / constants for chip bar
```

---

## Implementation Phases

### Phase 1 — ChipLabelPipe + chip-bar.helpers.ts (no UI, pure logic)

**Goal:** establish how a `StatementElement` is rendered as a label string, and the open-popover tracking mechanism.

**Files:**
- `ui/chip-bar/chip-label.pipe.ts` — pure `PipeTransform`
- `ui/chip-bar/chip-bar.helpers.ts`

**`chip-label.pipe.ts` — label format table:**

| Operator | Value type | Chip label |
|---|---|---|
| exists | any | `{Property} exists` |
| does not exist | any | `{Property} does not exist` |
| equals / does not equal / > / >= / < / <= | text, number, date, URI | `{Property} {operator} {value}` (truncate value at 20 chars) |
| is like | text | `{Property} is like "{value}"` |
| matches | text | `{Property} matches "{value}"` |
| equals / does not equal | link value | `{Property} equals {linked-resource label}` |
| equals / does not equal | list node | `{Property} equals {list node label}` |
| matches | resource object | `{Property} matches {resource class label}` |

```typescript
// ui/chip-bar/chip-label.pipe.ts
import { Pipe, PipeTransform } from '@angular/core';
import { StatementElement } from '../../model';
import { Operator } from '../../operators.config';

@Pipe({ name: 'chipLabel', standalone: true, pure: true })
export class ChipLabelPipe implements PipeTransform {
  private readonly MAX_VALUE_LENGTH = 20;

  transform(statement: StatementElement): string {
    const prop = statement.selectedPredicate?.label ?? '';
    const op = statement.selectedOperator;
    if (!op) return prop;

    if (op === Operator.Exists) return `${prop} exists`;
    if (op === Operator.NotExists) return `${prop} does not exist`;

    const rawValue = this._resolveValueLabel(statement);
    const value = rawValue ? this._truncate(rawValue) : '…';
    return `${prop} ${op} ${value}`;
  }

  private _resolveValueLabel(statement: StatementElement): string | undefined {
    const v = statement.selectedObjectValue;
    if (typeof v === 'string') return v;
    if (v && typeof v === 'object') return (v as { label?: string }).label;
    return undefined;
  }

  private _truncate(value: string): string {
    return value.length > this.MAX_VALUE_LENGTH
      ? `${value.slice(0, this.MAX_VALUE_LENGTH)}…`
      : value;
  }
}
```

**`chip-bar.helpers.ts`:**
```typescript
export const OPEN_CHIP_NONE = null;
export type OpenChipId = string | typeof OPEN_CHIP_NONE;
```

**Storybook story:** `chip-label.pipe.spec.ts` (unit test — pipe is pure, no story needed).

---

### Phase 2 — FilterChipBarComponent scaffold (layout only, no popovers)

**Goal:** establish the horizontal flex container with the correct chip ordering, wired to `SearchStateService` streams. No popovers yet — chips are plain buttons.

**Key reactive bindings:**
```typescript
// filter-chip-bar.component.ts
readonly ontologyLabel$ = this._ontologyDataService.selectedOntology$.pipe(
  map(o => o?.label ?? '…')
);
readonly resourceClassLabel$ = this._searchStateService.selectedResourceClass$.pipe(
  map(rc => rc?.label || 'All resource classes')
);
readonly visibleStatements$ = this._searchStateService.statementElements$.pipe(
  map(stmts => stmts.filter(s => !s.isPristine))   // exclude blank trailing statement
);
readonly orderByEnabled$ = this._searchStateService.orderByItems$.pipe(
  map(items => items.length > 0)
);
readonly searchEnabled$ = this._searchStateService.isFormStateValidAndComplete$;
```

**Template structure (simplified):**
```html
<div class="chip-bar">
  <app-data-model-chip />
  <app-resource-class-chip />

  @for (stmt of visibleStatements$ | async; track stmt.id) {
    <app-filter-chip
      [statement]="stmt"
      [isOpen]="openChipId() === stmt.id"
      (openChange)="onChipOpenChange(stmt.id, $event)"
      (remove)="formManager.deleteStatement(stmt)" />
    @for (child of getChildStatements(stmt.id); track child.id) {
      <app-filter-chip
        class="chip--indented"
        [statement]="child"
        [isOpen]="openChipId() === child.id"
        (openChange)="onChipOpenChange(child.id, $event)"
        (remove)="formManager.deleteStatement(child)" />
    }
  }

  <app-add-filter-button (propertySelected)="onPropertySelected($event)" />
  <app-order-by />

  <span class="chip-bar__spacer"></span>

  <button mat-button (click)="onReset()">Reset</button>
  <button mat-raised-button color="primary"
    [disabled]="(searchEnabled$ | async) === false"
    appLoadingButton [isLoading]="queryExecutionService.queryIsExecuting()"
    (click)="onSearch()">
    Search
  </button>
</div>
```

**Open-chip tracking:**
```typescript
readonly openChipId = signal<OpenChipId>(OPEN_CHIP_NONE);

onChipOpenChange(chipId: string, isOpen: boolean): void {
  this.openChipId.set(isOpen ? chipId : OPEN_CHIP_NONE);
}
```

**SCSS (chip-bar layout):**
```scss
.chip-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px 0;

  &__spacer { flex: 1; }
}

.chip--indented {
  margin-left: 24px;
}
```

**Storybook story:** `filter-chip-bar.component.stories.ts`
- `ShowsDataModelAndClassChipsWithNoFilters`
- `ShowsPropertyChipForEachCompleteStatement`
- `ShowsIndentedChildChip`
- `DisablesSearchWhenFormIsInvalid`
- `ShowsSpinnerOnSearchButton`

---

### Phase 3 — DataModelChipComponent + ResourceClassChipComponent (with CDK overlay popovers)

**Goal:** the first two chips — ontology picker and class picker — with editable popovers.

**CDK overlay pattern** (from `order-by.component.html` — already in this lib):
```html
<button mat-stroked-button cdkOverlayOrigin #trigger="cdkOverlayOrigin"
  (click)="isOpen = !isOpen">
  {{ label }}
  <mat-icon>arrow_drop_down</mat-icon>
</button>

<ng-template cdkConnectedOverlay
  [cdkConnectedOverlayOrigin]="trigger"
  [cdkConnectedOverlayOpen]="isOpen"
  [cdkConnectedOverlayPositions]="CHIP_POPOVER_POSITIONS"
  [cdkConnectedOverlayHasBackdrop]="true"
  [cdkConnectedOverlayBackdropClass]="'cdk-overlay-transparent-backdrop'"
  (backdropClick)="isOpen = false">
  <!-- popover content -->
</ng-template>
```

**Shared position constant (chip-bar.helpers.ts):**
```typescript
import { ConnectionPositionPair } from '@angular/cdk/overlay';

export const CHIP_POPOVER_POSITIONS: ConnectionPositionPair[] = [
  new ConnectionPositionPair(
    { originX: 'start', originY: 'bottom' },
    { overlayX: 'start', overlayY: 'top' },
    0, 4
  ),
];
```

**DataModelChipComponent behaviour:**
- Displays `ontologyDataService.selectedOntology$.label`
- Popover: `mat-selection-list` (single-select) of `ontologyDataService.ontologies$`
- On select: calls `ontologyDataService.setOntology(iri)` then `searchStateService.clearAllSelections()` (matching existing `AdvancedSearchOntologySelectComponent`)
- No × (always present)

**ResourceClassChipComponent behaviour:**
- Displays `searchStateService.selectedResourceClass$.label || 'All resource classes'`
- Popover: `mat-selection-list` of `ontologyDataService.resourceClasses$` (prepend "All resource classes" entry)
- On select: calls `formManager.setMainResource(selection)` (or clears if "All" selected)
- No × (always present)

**Storybook stories:**
- `data-model-chip.component.stories.ts`: `ShowsOntologyLabel`, `ShowsLoadingState`
- `resource-class-chip.component.stories.ts`: `ShowsAllResourceClassesByDefault`, `ShowsSelectedClassName`

---

### Phase 4 — FilterChipComponent + FilterEditorPopoverComponent

**Goal:** property filter chips with editing popovers that reuse the existing predicate/operator/value sub-components. Implements the revert-on-cancel contract.

**Revert-on-cancel contract:**
```typescript
// filter-chip.component.ts
private _snapshotBeforeEdit?: StatementElement;  // shallow clone

onOpen(): void {
  // Take a snapshot of the statement's current selections before opening
  this._snapshotBeforeEdit = cloneStatementElement(this.statement);
  this.openChange.emit(true);
}

onBackdropClick(): void {
  if (this._snapshotBeforeEdit) {
    // Restore previous state via service
    this.formManager.restoreStatement(this._snapshotBeforeEdit, this.statement);
  }
  this.openChange.emit(false);
}
```

> **Note:** `PropertyFormManager.restoreStatement()` is a **new method** added to `PropertyFormManager`. It calls `searchStateService.updateStatement(restored)` without triggering the auto-insert logic. This is the only permitted addition to the service layer — it is purely a write helper with no logic change to the state model.

**`cloneStatementElement` helper (chip-bar.helpers.ts):**

`StatementElement` uses private fields with getters/setters. A shallow clone can be constructed by reading the public getters and constructing a new instance:
```typescript
export function cloneStatementElement(source: StatementElement): StatementElement {
  const clone = new StatementElement(source.subjectNode, source.statementLevel);
  if (source.selectedPredicate) clone.selectedPredicate = source.selectedPredicate;
  if (source.selectedOperator) clone.selectedOperator = source.selectedOperator;
  if (source.selectedObjectValue !== undefined) {
    clone.selectedObjectValue = source.selectedObjectValue;
  }
  return clone;
}
```

**FilterEditorPopoverComponent template (simplified):**
```html
<div class="filter-editor-popover mat-elevation-z4">
  <app-predicate-select
    [subjectClass]="statement.subjectNode?.value"
    [selectedPredicate]="statement.selectedPredicate"
    (selectedPredicateChange)="formManager.setSelectedPredicate(statement, $event)" />

  @if (statement.selectedPredicate) {
    <app-comparison-operator
      [operators]="statement.operators"
      [selectedOperator]="statement.selectedOperator"
      (operatorChange)="formManager.setSelectedOperator(statement, $event)" />
  }

  @switch (statement.objectType) {
    @case (PropertyObjectType.ResourceObject) { <app-resource-value ... /> }
    @case (PropertyObjectType.ValueObject)    { <app-string-value ... /> }
    @case (PropertyObjectType.ListValueObject){ <app-list-value ... /> }
    @case (PropertyObjectType.LinkValueObject){ <app-link-value ... /> }
  }
</div>
```

**Chip visual states:**

| State | Appearance |
|---|---|
| Complete | Primary-coloured chip, `× remove` button visible, label = `chipLabel` pipe output |
| Loading/partial (popover open) | Outlined chip, no × |
| Exists / Not exists | Chip label = `{Property} exists`, no value field in popover |

**Storybook stories (`filter-chip.component.stories.ts`):**
- `ShowsCompletedChipWithLabel`
- `ShowsChipWithExistsOperatorAndNoValue`
- `RevertsStateWhenPopoverIsDismissed`
- `RemovesChipWhenXIsClicked`
- `ShowsIndentedChildChip`

---

### Phase 5 — AddFilterButtonComponent + PropertyPickerPopoverComponent

**Goal:** `+ Add filter` button that opens a searchable property picker popover. Selecting a property creates a blank `StatementElement` and immediately opens its edit popover.

**Blank-statement management:**
The current `StatementBuilderComponent` always has one trailing blank statement in `statementElements$`. The chip bar **does not render** it (filtered by `isPristine`). When the user adds a filter:

1. `formManager.addBlankStatement()` — **new method** on `PropertyFormManager` that inserts a fresh `StatementElement` at the end of the current array (same as the auto-insert logic but triggered explicitly).
2. The chip bar immediately opens the edit popover for this new chip.
3. If the popover is dismissed (backdrop click / Escape) without selecting a predicate, `formManager.deleteStatement(statement)` removes it — so no orphan chip remains.

**PropertyPickerPopoverComponent:**
```typescript
// Driven by OntologyDataService.getProperties$(currentResourceClassIri)
// Renders a searchable mat-selection-list (single select)
// On select: emit (propertySelected) to parent → parent inserts blank statement
```

**`PropertyFormManager` additions (complete list):**
```typescript
// Method 1: restore a statement from a snapshot (used by revert-on-cancel)
restoreStatement(snapshot: StatementElement, target: StatementElement): void {
  target.clearSelections();
  if (snapshot.selectedPredicate) target.selectedPredicate = snapshot.selectedPredicate;
  if (snapshot.selectedOperator)  target.selectedOperator  = snapshot.selectedOperator;
  if (snapshot.selectedObjectValue !== undefined) {
    target.selectedObjectValue = snapshot.selectedObjectValue;
  }
  this.searchStateService.updateStatement(target);
}

// Method 2: explicit blank statement insert (for + Add filter)
addBlankStatement(): StatementElement {
  const blank = new StatementElement();
  this.searchStateService.patchState({
    statementElements: [...this.searchStateService.currentState.statementElements, blank],
  });
  return blank;
}
```

**Storybook stories (`add-filter-button.component.stories.ts`):**
- `ShowsAddFilterButton`
- `OpensPropertyPickerOnClick`

---

### Phase 6 — Refactor AdvancedSearchComponent (wire chip bar, remove old UI)

**Goal:** replace the existing template with `FilterChipBarComponent`. Remove old sub-components from template and from providers list if unused.

**API changes to `AdvancedSearchComponent`:**
- Remove `@Input() isVerticalDirection`
- Remove `@Output() toggleDirection`
- Update `AdvancedSearchPageComponent` template (only consumer) to remove those bindings

**New `AdvancedSearchComponent` template:**
```html
<app-filter-chip-bar
  [projectUuid]="projectUuid"
  (gravsearchQuery)="gravsearchQuery.emit($event)" />

<button mat-button (click)="restoreSearchFromSnapshot()">
  Use previous search
</button>
```

**Components and files to delete:**
- `ui/advanced-search-header.component.ts` (and its story)
- `ui/advanced-search-footer.component.ts` (and its story)
- `ui/advanced-search-ontology-select.component.ts` (and its story)
- `ui/statement-builder/statement-builder.component.ts` (and its story) — its logic is inlined into `FilterEditorPopoverComponent`
- `advanced-search.component.scss` scroll through usage — keep only styles still needed

**Files to keep (internal sub-components reused by `FilterEditorPopoverComponent`):**
- `ui/statement-builder/assertions/predicate-select.component.ts`
- `ui/statement-builder/assertions/comparison-operator.component.ts`
- `ui/statement-builder/object-values/*` (all four)
- `ui/order-by/order-by.component.ts` (reused as-is)

---

### Phase 7 — Storybook & tests

**New stories** (alongside each new component):
- `filter-chip-bar.component.stories.ts`
- `data-model-chip.component.stories.ts`
- `resource-class-chip.component.stories.ts`
- `filter-chip.component.stories.ts`
- `filter-editor-popover.component.stories.ts`
- `add-filter-button.component.stories.ts`
- `property-picker-popover.component.stories.ts`

**Stories that must be deleted** (components being removed):
- `ui/advanced-search-header.component.stories.ts`
- `ui/advanced-search-footer.component.stories.ts`
- `ui/advanced-search-ontology-select.component.stories.ts`

**Stories to update** (components kept but context changed):
- `advanced-search.component.stories.ts` — update to reflect chip-bar interface, remove `isVerticalDirection` arg
- `advanced-search-results.component.stories.ts` — no changes needed

**Unit tests:**
- `chip-label.pipe.spec.ts` — table-driven test covering all operator/value-type combinations
- `chip-bar.helpers.spec.ts` — `cloneStatementElement` correctness

---

## Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| `StatementElement` private field clone breaks serialization | Medium | High | `cloneStatementElement` only reads public getters; verify with `SearchStateStorageService` round-trip test |
| `PropertyFormManager` auto-insert creates spurious chips | High | Medium | `visibleStatements$` filters `isPristine` — covered by unit test |
| CDK overlay z-index conflict with host page chrome | Low | Medium | Test in the actual page context (sticky header, modal) in Phase 6 |
| Revert-on-cancel clears child statements (cascade from `setSelectedPredicate`) | Medium | Medium | `restoreStatement` bypasses `_updateStatementAndUpdateForms`; only calls `updateStatement` directly |
| `OrderByService` fires on every text keypress in a chip | Low | Low | `debounceTime(300)` already in `StringValueComponent`; orderby recompute is cheap |
| Removing `isVerticalDirection` breaks an unknown consumer | Low | Low | Grep confirms only one consumer (`AdvancedSearchPageComponent`) |

---

## Success Criteria

- All existing Storybook stories pass (no regressions).
- New chip-bar stories all have `play()` functions with passing assertions.
- TypeScript compilation clean — no `any` escapes introduced.
- A search with Data Model + Resource Class + 3 property filters fits in one row at 1280 px.
- Sub-criteria chips wrap visually connected to their parent.
- Reverting a popover dismissal leaves state identical to before it was opened (covered by story `RevertsStateWhenPopoverIsDismissed`).
- Gravsearch output from the chip-bar is byte-identical to the output from the old form for the same search state (covered by a `GravsearchService` integration test).

---

## Out of Scope

- Chip overflow → "N more" collapse
- Drag-to-reorder chips
- Responsive breakpoints below 1280 px
- Any changes to search results UI
- Fulltext search UI

---

## Open Questions (resolved)

| Question | Decision |
|---|---|
| Sub-criteria overflow | Wrap to next line |
| Ontology switch | Clear all property chips |
| Popover cancel | Revert to pre-open state |
| "Use previous search" | Keep as standalone button below chip bar |
| Layout toggle API | Remove `isVerticalDirection` / `toggleDirection` |
| Multiple open popovers | Only one open at a time via `openChipId` signal |
| Order-by chip when no properties | Show disabled (matches current behaviour) |
| Resource Class chip × | No × — always present, changeable only via popover |
| Data Model chip × | No × — always present, changeable only via popover |
