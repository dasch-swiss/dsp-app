# PRD: Advanced Search — Chip-Bar Filter UX

**Date:** 2026-05-26  
**Status:** Draft  
**Author:** Julien Schneider

---

## Context

The current Advanced Search UI presents filters as a stacked vertical form: a Data Model dropdown, a Resource Class dropdown, and one or more statement rows each containing a Property select, Operator select, and Value input. While functionally complete, the form is visually heavy and requires significant vertical space even for simple searches.

The goal is to replace this with a compact, inline chip-bar interaction model inspired by Linear's filter bar — every filter lives on a single horizontal row as a dismissible pill, editing happens via popovers, and the whole search state is always visible at a glance.

---

## Goals

- Replace the stacked advanced search form with a single-row chip-bar that fits in a toolbar.
- Make it immediately obvious to users what filters are active, and trivial to add, edit, or remove them.
- Preserve all existing search capabilities: ontology selection, resource class, property statements (with nesting for linked resources), operator selection, value input, order-by, and Gravsearch query generation.
- Ship as a full replacement of the current form — no legacy toggle.

---

## Core Features

### 1. Filter Chip Bar

A single horizontal row containing:

- **Data model chip** — first chip, always present. Displays the selected ontology label. Clicking opens a popover to switch ontology.
- **Resource class chip** — second chip, always present. Displays the selected resource class (defaults to "All"). Clicking opens a popover to switch class.
- **Property filter chips** — one chip per active statement, ordered left to right. Each chip displays `Property › Operator › Value` (e.g. `Title › equals › "Hamlet"`). Clicking reopens the editing popover. A × button on the chip removes it.
- **Sub-criteria chips** — child statements (linked resource filters) are shown as indented or grouped chips directly after their parent chip, visually connected (e.g. slightly indented or prefixed with a connector line/icon).
- **+ Add filter button** — after all chips. Clicking opens a property picker popover listing available properties for the current resource class.
- **Order by chip** — at the end of the chip row, before the action buttons. Clicking opens the existing order-by panel as a popover.
- **Search button** — right side of the toolbar.
- **Reset / Clear all link** — right side, next to Search. Removes all property chips and resets class to "All".

### 2. Property Picker Popover (Add filter)

When "＋ Add filter" is clicked:

1. A popover opens listing all properties available for the selected resource class, grouped or searchable.
2. Selecting a property creates a new chip and immediately opens the filter-editing popover.

### 3. Filter Editing Popover (per chip)

When a property chip is clicked (new or existing):

1. Property is shown at the top (read-only or changeable via a select).
2. Operator is selected (dropdown of valid operators for that property type).
3. Value input appears based on property type:
   - **Text / Number / URI / Boolean** → inline text/number input.
   - **Date** → date-picker.
   - **List** → nested menu.
   - **Linked resource** → autocomplete resource search.
   - **Exists / Does not exist** → no value input needed.
4. Confirming (clicking outside or pressing Enter) closes the popover and commits the chip.

### 4. Sub-criteria (Nested filters)

When a property with type "linked resource" is configured and the operator allows sub-criteria (e.g. `matches`), an indented sub-group appears below/after the parent chip. Sub-criteria follow the same chip pattern but are visually nested (indentation + connecting element). "＋ Add sub-filter" appears within the group.

### 5. Order-by Popover

The existing `OrderByComponent` drag-and-drop behaviour is preserved, rendered inside a popover triggered by the "Order by" chip. The chip label updates to reflect how many properties are ordered (e.g. "Order by 2").

### 6. Gravsearch Generation

No changes to the underlying `GravsearchService`, `SearchStateService`, or `PropertyFormManager`. The chip bar is a pure UI layer over the existing state and service model.

---

## User Stories

| # | As a… | I want to… | So that… |
|---|---|---|---|
| U1 | researcher | see all active filters at a glance in one row | I can quickly understand what search is running |
| U2 | researcher | click a chip to edit its value | I don't have to reset and rebuild a filter |
| U3 | researcher | click × on a chip to remove a filter | I can narrow or broaden the search without starting over |
| U4 | researcher | click "+ Add filter" and pick a property | I can add a new filter criterion quickly |
| U5 | researcher | switch the data model or resource class via chips | I can scope my search to a different ontology without losing other filters |
| U6 | researcher | see sub-criteria for linked-resource filters grouped under their parent | I can understand the relationship between hierarchical filters |
| U7 | researcher | click "Order by" to configure sort order | I can control the result ordering |
| U8 | researcher | click "Reset" to clear all filters | I can start fresh quickly |

---

## Acceptance Criteria

| Story | Criteria |
|---|---|
| U1 | All active filters (data model, class, properties, order-by) are visible on one horizontal row without vertical overflow for ≤ 5 filters |
| U2 | Clicking a chip opens its editing popover pre-populated with current values; saving updates the chip label |
| U3 | Clicking × on a property chip removes it and any child chips; chip row updates immediately |
| U4 | "+ Add filter" popover lists only properties valid for the current resource class; selecting one opens the edit popover |
| U5 | Data model chip popover lists all project ontologies; switching resets resource class and property chips |
| U6 | Child chips appear immediately after their parent chip with visual indentation; removing parent removes all children |
| U7 | Order-by popover renders the drag-and-drop list; changes are reflected in the Gravsearch query |
| U8 | Reset clears all property chips, resets class to "All", and resets order-by; data model chip is retained |

---

## Constraints

- **Angular Material only** — all new UI components must use MUI (Angular Material) primitives: `MatChipsModule`, `MatMenuModule` or `CdkOverlay` for popovers, existing form controls.
- **No service layer changes** — `SearchStateService`, `PropertyFormManager`, `GravsearchService`, and `OntologyDataService` must not be modified. The chip bar consumes them as-is.
- **Preserve Storybook stories** — existing stories for sub-components remain valid; new chip-bar component(s) get their own stories.
- **No router changes** — URL query param handling (`?q=`) remains unchanged.
- **State persistence** — `SearchStateStorageService` (snapshot/restore) must continue to work.

---

## Success Criteria

- The new chip-bar renders all existing search capabilities without regression.
- A search with 3+ active filters fits in a single toolbar row on a 1280 px viewport.
- All existing Storybook stories pass; new stories cover the chip-bar component.
- TypeScript compilation is clean; no `any` typed escapes introduced.
- User-visible labels in chips accurately reflect current filter state at all times.

---

## Out of Scope

- Saving / naming search presets.
- Drag-to-reorder filter chips.
- Responsive collapse (chip overflow → "N more" badge) — can be added as a follow-up.
- Any changes to the fulltext search UI.
- Any changes to the search results panel.

---

## Open Questions

1. **Sub-criteria overflow** — If a linked-resource filter has many sub-criteria, how should the chip bar handle overflow? Wrap to a second line, or collapse into a "N sub-filters" summary chip?
2. **Chip truncation** — Long property labels or values will overflow. Should chips truncate with a tooltip, or is a max-width + ellipsis sufficient?
3. **Popover placement** — Should filter popovers anchor to the chip (preferred) or open as a centered dialog on mobile-sized viewports?
4. **Ontology switching and filter retention** — When the user switches data model, should any property chips that still exist in the new ontology be retained, or should all property chips always be cleared?
