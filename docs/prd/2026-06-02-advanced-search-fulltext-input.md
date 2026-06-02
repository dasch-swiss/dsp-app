# PRD: Fulltext Input in Advanced Search

**Date:** 2026-06-02
**Template:** prd-lite
**Status:** Approved

## Context

The advanced search builds a gravsearch query from visual filter chips (property + operator + value). Users currently have no way to add a free-text fulltext constraint unless they manually add a text property filter. The fulltext search page has a simple text input for this purpose. This feature bridges both by adding the same style of input to the advanced search form.

## Goals

- Let users combine structured (chip-based) filters with a free-text fulltext term in a single gravsearch query.
- Reuse the existing `mat-form-field` + `mat-input` input style from the fulltext search page.

## Core Feature

Add a `MatFormField` text input **above** the filter chip bar in `FilterChipBarComponent`. When the user clicks Search:

- If the input is non-empty, inject `?mainRes knora-api:matchesText "term" .` into the WHERE clause of the generated gravsearch query (via `GravsearchService.generateGravSearchQuery()`).
- If empty, the query is unchanged (same behavior as today).

The input is reset alongside the chip bar when the user clicks Reset.

## Constraints

- Must use `knora-api:matchesText` (resource-level fulltext) — not `matchText` (property-scoped) or `matchLabel`.
- The term value must be escaped using the existing `escapeForGravsearchStringLiteral` helper.
- No new component files — changes confined to `FilterChipBarComponent` and `GravsearchService`.

## Out of Scope

- Search tips overlay (from fulltext search page)
- Keyboard submit / auto-search on type
- Persisting the search term in URL params

## Next Steps

1. Modify `GravsearchService.generateGravSearchQuery()` to accept an optional `fulltextTerm` parameter.
2. Update `FilterChipBarComponent` to add the input above the chip row and pass the term to `onSearch()`.
3. Add/update a unit test in `gravsearch.service.spec.ts` for the new clause.

## Key Files

| File | Change |
|------|--------|
| `libs/vre/pages/search/advanced-search/src/lib/service/gravsearch.service.ts` | Add optional `fulltextTerm` param; inject `matchesText` into WHERE clause |
| `libs/vre/pages/search/advanced-search/src/lib/ui/chip-bar/filter-chip-bar.component.ts` | Add text input above chip bar; wire to `onSearch()` and `onReset()` |
| `libs/vre/pages/search/advanced-search/src/lib/service/spec/gravsearch.service.spec.ts` | Add test case for `matchesText` injection |
