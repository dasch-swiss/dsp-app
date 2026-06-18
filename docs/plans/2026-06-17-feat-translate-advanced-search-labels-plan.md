---
title: "feat: Translate advanced-search displayed classes and properties"
date: 2026-06-17
linear: DEV-6645
type: feat
status: reviewed
repositories:
  - name: dsp-app
    path: /Users/dominiquesteinbach/Documents/GitHub/dasch-swiss/dsp-app
---

# feat: Translate advanced-search displayed classes and properties

> Linear: [DEV-6645](https://linear.app/dasch/issue/DEV-6645/translate-advanced-search-displayed-classes-and-properties)
> Predecessor: DEV-6627 (commit `1dae05a37`)

## Problem Statement

Five display sites in the advanced-search feature still render single-language
`.label` strings even though upstream DSP-JS types
(`ResourceClassDefinitionWithAllLanguages`,
`ResourcePropertyDefinitionWithAllLanguages`) already carry multi-language
`labels: StringLiteralV2[]` and `comments: StringLiteralV2[]` arrays.

DEV-6627 deferred these sites because fixing them requires touching the local
DTOs (`IriLabelPair`, `Predicate`, `OrderByItem`) and the conversion pipes in
`OntologyDataService` — beyond the "one- or two-line swap" gate of DEV-6627.

The root cause is local: `OntologyDataService` collapses multi-language data
into single-language DTOs at conversion time. The reactive streams
(`_resourceClassDefinitions$`, `_propertyDefinitions$`) already wire
`LocalizationService.currentLanguage$` and sort by preferred language — but the
next `map` step throws the array away.

## Motivation

* The UI language switcher already exists and works on the other label sites
  migrated in DEV-6627. Users see a mix of translated and untranslated labels
  in the same page, which is jarring and undermines the language switcher.
* The fix is bounded: 5 user-visible sites, one root-cause file, and a clearly
  established pattern. No API change required.
* This work clears the "advanced-search" follow-up bucket from DEV-6627 and
  leaves only the legitimately-deferred sites (single-language wire format).

## Constraints

* **No DSP-API wire-format changes.** Sites whose root cause is
  single-language-only API responses stay deferred.
* **Keep changes inside** `libs/vre/pages/search/advanced-search/**`. The
  existing DSP-JS widening from DEV-6627 already gives us
  `ResourceClassDefinitionWithAllLanguages` /
  `ResourcePropertyDefinitionWithAllLanguages`.
* **Storage layer stays passive.** `SearchStateStorageService` is responsible
  for structural reconstruction (class instances) only. It must not depend on
  `LocalizationService` and must not normalize, synthesize, or fall back on
  label data.
* **DTO shape is unified.** The `IriLabelPair` interface drops `.label` in
  favor of `labels: StringLiteralV2[]`. Sites whose **data source** is
  single-language on the API wire (link/list value pickers, ontology
  metadata) keep their single-language display, but adopt the unified DTO
  shape (one-entry `labels` array). This keeps the type system consistent
  and prevents compilation breakage at deferred sites.
* **All translation strings live in i18n JSON.** No inline multi-language
  arrays in TypeScript. Synthetic items (`ResourceLabelPropertyData`,
  `SEARCH_ALL_RESOURCE_CLASSES_OPTION`) build their `labels` arrays at
  runtime by reading the locale files through `TranslateService`.

## Decisions

| # | Decision | Rationale |
|---|----------|-----------|
| 1 | `IriLabelPair` stays as an interface; keep the name. Drop `label: string`; the only label-related field is `labels: StringLiteralV2[]`. | Smaller blast radius than a rename. No class machinery / no service injection. A single source of truth for the label. |
| 2 | `Predicate`, `OrderByItem`, and the synthetic `SEARCH_ALL_RESOURCE_CLASSES_OPTION` / `ResourceLabelPropertyData` follow the same shape (`labels: StringLiteralV2[]`, no `label` field). | Consistency. No half-migrated types. |
| 3 | All translation/normalization happens at the **display boundary** via `appStringifyStringLiteral` (templates) or `pickPreferredLanguageString` (TS). DTOs and storage stay passive data carriers. | Single responsibility. Reactive language switch falls out for free because the pipe is impure. |
| 4 | Storage (`SearchStateStorageService`) stores `iri` + `labels` only — no `label`, no defensive normalization, no `LocalizationService` dependency. Legacy snapshots are tolerated structurally; the UI re-hydrates labels from the live ontology where useful. | Storage is for shape, not semantics. |
| 5 | Include the three hard-coded English strings (`'Property of {class}'`, `'Resource Class'` mat-label, `'Resource Label'` synthetic predicate) in scope. | Aligns with the issue intent ("display in selected language"). Avoids leaving obvious English strings next to translated ones. |
| 6 | Add a shared test factory at `libs/vre/pages/search/advanced-search/src/lib/testing/builders.ts` with `buildIriLabelPair`, `buildPredicate`, `buildOrderByItem`. | Bounds the spec churn (~7 spec files to touch). |
| 7 | Synthetic items (`ResourceLabelPropertyData`, `SEARCH_ALL_RESOURCE_CLASSES_OPTION`) source their `labels` arrays at runtime from i18n JSON via `TranslateService.translations` (one entry per supported UI language). No inline TS arrays of translation strings — keeps translations centralized in `assets/i18n/*.json` for the localization workflow. | Single source of truth for translations; consistent with the rest of the libs; avoids drift between TS literals and locale files. |
| 8 | Deferred sites (link-value, list-value, dynamic-forms-data search results) adopt the unified DTO shape (`labels: StringLiteralV2[]` with a single English entry from the API). Their **display remains single-language** until a DSP-API change widens the wire format. | Prevents compilation breakage from the `.label` drop. Keeps the codebase type-consistent. Zero UX change at the deferred sites. |

## Out of Scope (deferred)

These sites share the UX symptom but have a different root cause
(single-language-only on the API wire) and their **visible display remains
single-language** in this issue:

* Ontology dropdown — `advanced-search-ontology-select.component.ts:21` —
  `OntologyMetadata.label`.
* Link-object search results — `link-value.component.ts` — `doSearchByLabel`
  returns single-language `res.label`.
* List-value selection — `list-value.component.ts` — `ListNodeV2.label` is
  single-language by DSP-JS type contract.
* `OntologyDataService.init()` (line 42-55) — uses `o.label` from
  `OntologiesMetadata`. Same single-language wire issue.
* `OntologyDataService.selectedOntology` getter (line 188-192) — same.

**Note on DTO shape.** Because `IriLabelPair` drops its `.label` field, the
deferred sites that **produce or consume `IriLabelPair`** must still be
migrated to the unified `labels: StringLiteralV2[]` shape (with a single
English entry from the API response). See Step 5b. This is a mechanical DTO
shape change, **not** a UX change — the deferred sites continue to render
single-language until a DSP-API change widens their wire format.

The non-`IriLabelPair` deferred sites (ontology dropdown, `init()`,
`selectedOntology` getter, `ListNodeV2.label` reads inside list-value
internals) stay completely untouched.

These are called out so a reviewer can confirm none accidentally drifted into
visible scope during implementation.

## Technical Approach

### Pattern recap (from DEV-6627)

* **Pattern A — templates:** `{{ labels | appStringifyStringLiteral }}`
  (`libs/vre/ui/string-literal/src/lib/stringify-string-literal.pipe.ts` —
  impure, memoized, reads from `LocalizationService.currentLanguage`).
* **Pattern B — TS:**
  `pickPreferredLanguageString(labels, this._localizationService.currentLanguage)`
  (`libs/vre/shared/app-helper-services/src/lib/pick-preferred-language-string.ts`).

Both helpers tolerate `undefined | null | []` and fall back to the first
non-empty value across any language.

### Step 1 — Reshape the local DTOs

File: `libs/vre/pages/search/advanced-search/src/lib/model.ts`

```ts
import { StringLiteralV2 } from '@dasch-swiss/dsp-js';

export interface IriLabelPair {
  iri: string;
  labels: StringLiteralV2[];
  comments: StringLiteralV2[];
}

export class Predicate implements IriLabelPair {
  constructor(
    public iri: string,
    public labels: StringLiteralV2[],
    public objectValueType: string,
    public isLinkProperty: boolean,
    public listObjectIri?: string,
    public comments: StringLiteralV2[] = [],
  ) {}
}

export class OrderByItem {
  orderBy = false;
  constructor(
    public id: string,
    public labels: StringLiteralV2[] = [],
    public disabled?: boolean,
  ) {}
}
```

`NodeValue.label` (model.ts:61): drop the getter. Callers that need a display
string read the inner `value.labels` through the pipe at the template, or via
`pickPreferredLanguageString` in TS. (Grep confirms no remaining `.label`
read on `NodeValue` after the display sites are migrated — verify in the
test pass.)

### Step 2 — Test factory

New file: `libs/vre/pages/search/advanced-search/src/lib/testing/builders.ts`

```ts
import { StringLiteralV2 } from '@dasch-swiss/dsp-js';
import { IriLabelPair, OrderByItem, Predicate } from '../model';

export const buildLabels = (
  en: string,
  more: Partial<Record<'de' | 'fr' | 'it' | 'rm', string>> = {},
): StringLiteralV2[] => [
  { language: 'en', value: en },
  ...Object.entries(more).map(([language, value]) => ({ language, value: value! })),
];

export const buildIriLabelPair = (
  iri: string,
  en: string,
  more?: Partial<Record<'de' | 'fr' | 'it' | 'rm', string>>,
): IriLabelPair => ({ iri, labels: buildLabels(en, more) });

export const buildPredicate = (
  iri: string,
  en: string,
  objectValueType: string,
  opts: {
    isLinkProperty?: boolean;
    listObjectIri?: string;
    more?: Partial<Record<'de' | 'fr' | 'it' | 'rm', string>>;
  } = {},
): Predicate =>
  new Predicate(
    iri,
    buildLabels(en, opts.more),
    objectValueType,
    opts.isLinkProperty ?? false,
    opts.listObjectIri,
  );

export const buildOrderByItem = (id: string, en: string): OrderByItem =>
  new OrderByItem(id, buildLabels(en));
```

### Step 3 — Update `OntologyDataService`

File: `libs/vre/pages/search/advanced-search/src/lib/service/ontology-data.service.ts`

`resourceClasses$` (line 90-97): no language collapse — pass through the
multi-language array.

```ts
resourceClasses$: Observable<IriLabelPair[]> = this._resourceClassDefinitions$.pipe(
  startWith([]),
  map(resClasses =>
    resClasses.map((resClassDef: ResourceClassDefinitionWithAllLanguages) => ({
      iri: resClassDef.id,
      labels: resClassDef.labels ?? [],
      comments: resClassDef.comments ?? [],
    })),
  ),
);
```

`getSubclassesOfResourceClass$` (line 129): same shape.

`_toPredicate` (line 176-186): accept the `WithAllLanguages` variant; thread
`labels` and `comments`. Keep its existing method form (no conversion to an
arrow-bound field — `this` is already correctly captured at the call site
`map(this._toPredicate)`).

```ts
private _toPredicate(propDef: ResourcePropertyDefinitionWithAllLanguages): Predicate {
  const predicate = new Predicate(
    propDef.id,
    propDef.labels ?? [],
    propDef.objectType || '',
    propDef.isLinkProperty,
    undefined,
    propDef.comments ?? [],
  );
  if (
    propDef.objectType === Constants.ListValue &&
    propDef.guiAttributes.length === 1 &&
    propDef.guiAttributes[0].startsWith('hlist=')
  ) {
    predicate.listObjectIri = propDef.guiAttributes[0].substring(7, propDef.guiAttributes[0].length - 1);
  }
  return predicate;
}
```

**Synthetic items source `labels` from i18n JSON** (decision 7). No inline TS
translation arrays — the locale files in `apps/dsp-app/src/assets/i18n/`
remain the single source of truth.

Add a tiny helper (colocated; new file
`libs/vre/pages/search/advanced-search/src/lib/service/labels-from-i18n.ts`):

```ts
import { TranslateService } from '@ngx-translate/core';
import { StringLiteralV2 } from '@dasch-swiss/dsp-js';
import { AVAILABLE_LANGUAGES } from '@dasch-swiss/vre/core/config';

/**
 * Builds a multi-language `labels` array for a synthetic item by reading
 * the same i18n key out of every supported locale. Translations are owned
 * by the locale JSON files — no TS literals.
 */
export const labelsFromI18n = (
  translate: TranslateService,
  key: string,
  params?: Record<string, unknown>,
): StringLiteralV2[] =>
  AVAILABLE_LANGUAGES.map(language => ({
    language,
    value: translate.getParsedResult(
      translate.translations[language] ?? {},
      key,
      params,
    ) as string,
  }));
```

Then turn `ResourceLabelPropertyData` and the search-all option into
ordinary class fields built in the constructor:

```ts
// ontology-data.service.ts
private readonly ResourceLabelPropertyData: Predicate;
readonly searchAllResourceClassesOption: IriLabelPair;

constructor(
  @Inject(DspApiConnectionToken) private readonly _dspApiConnection: KnoraApiConnection,
  private readonly _destroyRef: DestroyRef,
  private readonly _localizationService: LocalizationService,
  private readonly _translate: TranslateService,
) {
  this.ResourceLabelPropertyData = new Predicate(
    RDFS_LABEL,
    labelsFromI18n(this._translate, 'pages.search.advancedSearch.resourceLabel'),
    ResourceLabel,
    false,
  );
  this.searchAllResourceClassesOption = {
    iri: '',
    labels: labelsFromI18n(this._translate, 'pages.search.advancedSearch.allResourceClasses'),
  };
}
```

The `SEARCH_ALL_RESOURCE_CLASSES_OPTION` module-level constant in
`constants.ts:11` is replaced by the instance field
`searchAllResourceClassesOption` on `OntologyDataService` (or, if a
module-level constant is preferred, gated behind a small initialiser
function that takes `TranslateService` — but the field form is simpler).
Update every reader of the constant accordingly.

i18n keys live in `apps/dsp-app/src/assets/i18n/{en,de,fr,it,rm}.json`
under `pages.search.advancedSearch.resourceLabel` and
`pages.search.advancedSearch.allResourceClasses` (see Step 7).

### Step 4 — `OrderByService`

File: `libs/vre/pages/search/advanced-search/src/lib/service/order-by.service.ts`

Propagate `labels` (not `label`) end-to-end:

```ts
availablePredicates$ = this._searchStateService.completeStatements$.pipe(
  map(elements =>
    new Map(elements.map(stmt => [
      stmt.id,
      { labels: stmt.selectedPredicate!.labels, isLinkProperty: stmt.selectedPredicate!.isLinkProperty },
    ])),
  ),
  distinctUntilChanged(),
);

private _computeNextOrderBy(
  availablePredicates: Map<string, { labels: StringLiteralV2[]; isLinkProperty: boolean }>,
): OrderByItem[] {
  const toKeep = this.currentOrderBy.filter(item => availablePredicates.has(item.id));
  const toAdd = [...availablePredicates]
    .filter(([id]) => !toKeep.some(i => i.id === id))
    .map(([id, info]) => new OrderByItem(id, info.labels, info.isLinkProperty));
  return [...toKeep, ...toAdd];
}
```

### Step 5 — Swap the 4 in-scope display sites

| # | File | Change |
|---|------|--------|
| 1 | `ui/statement-builder/assertions/predicate-select.component.ts:32` | `{{ prop.label }}` → `{{ prop.labels \| appStringifyStringLiteral }}`. Add `StringifyStringLiteralPipe` (from `@dasch-swiss/vre/ui/string-literal`) to the component's `imports` array (standalone component). For `[attr.data-cy]`, derive a stable test id via `prop.iri` (the IRI is language-invariant and unique). |
| 2 | Same file, `label` getter (line 60-62) | Replace the TS getter with a template-pipe expression: `{{ 'pages.search.advancedSearch.propertyOfClass' \| translate: { class: subjectClass?.labels \| appStringifyStringLiteral } }}`. No `TranslateService` injection needed in TS. If the value must remain in TS for non-template reasons, the fallback is `this._translate.instant('pages.search.advancedSearch.propertyOfClass', { class: pickPreferredLanguageString(this.subjectClass?.labels, this._localizationService.currentLanguage) })`. |
| 3 | `ui/statement-builder/object-values/resource-value/resource-value.component.ts:25,33,37` | Template `mat-label` `"Resource Class"` → `{{ 'pages.search.advancedSearch.resourceClass' \| translate }}`. Line 37 `{{ resClass.label }}` → `{{ resClass.labels \| appStringifyStringLiteral }}`. For `[attr.data-cy]` derive from `resClass.iri`. |
| 4 | `ui/order-by/order-by.component.html:43` | `{{ item.label }}` → `{{ item.labels \| appStringifyStringLiteral }}`. Add the pipe to the component's `imports`. |

The "search all resource classes" option is now an instance field on
`OntologyDataService` (per Step 3, sourced from i18n JSON). Any consumer
that previously imported the `SEARCH_ALL_RESOURCE_CLASSES_OPTION` module
constant must be migrated to read it from the service. The existing
`if (resClass.iri === '')` branch in `resource-value.component.ts:34` can
either stay (renders the translation key) or be removed in favor of the
pipe-based path now that `labels` is populated. Choose the simpler one;
default to keeping the explicit branch for clarity.

### Step 5b — Migrate deferred-site DTO shape

The `.label` drop on `IriLabelPair` (Decision 1) breaks compilation at the
deferred sites that produce or consume the DTO. The fix is mechanical and
preserves their single-language UX (decision 8).

| # | File | Change |
|---|------|--------|
| 1 | `service/dynamic-forms-data.service.ts:45` | `{ iri: res.id, label: res.label }` → `{ iri: res.id, labels: [{ language: 'en', value: res.label }] }`. The wire response is single-language; we wrap it as a one-entry array. (If a language tag is available from the API response, use it; otherwise `'en'` is the historical default — confirm and document.) |
| 2 | `ui/.../list-value/list-value.component.ts:88` | `{ iri: node.id, label: node.label }` → `{ iri: node.id, labels: [{ language: 'en', value: node.label }] }`. Same rationale. |
| 3 | `ui/.../link-value/link-value.component.ts:87` (template) | `{{ obj?.label }}` → `{{ obj?.labels \| appStringifyStringLiteral }}`. Display stays effectively single-language because the API only delivers one value, but the read path is uniform. |
| 4 | `ui/.../link-value/link-value.component.ts:154,161,167` (TS) | `this.selectedResource.label` / `data.label` → `pickPreferredLanguageString(this.selectedResource.labels, this._localizationService.currentLanguage)` (lines 154, 161) and `pickPreferredLanguageString(data.labels, this._localizationService.currentLanguage)` (line 167). Inject `LocalizationService`. |
| 5 | `ui/.../list-value/list-value.component.ts:28` (template, `ListNodeV2` not `IriLabelPair`) | `selectedListNode?.label` is a `ListNodeV2` field (single-language by DSP-JS type contract). **Leave untouched** — this is not an `IriLabelPair` and is fully deferred. |

This is a DTO shape migration, not a UX migration. Acceptance check: the
link-value autocomplete and the list-value picker continue to look and
behave exactly as they do today; only the underlying object shape has
changed.

### Step 6 — Storage stays passive

File: `libs/vre/pages/search/advanced-search/src/lib/service/search-state-storage.service.ts`

**No changes to logic** beyond updating type imports. The reconstruction
functions (`_reconstructStatement`, `reconstructObjectNode`) continue to
re-instantiate class instances from the raw JSON shape. They do **not**
inject `LocalizationService`, do **not** normalize labels, do **not**
synthesize `labels` from `label`.

Legacy snapshots that contain `label` but no `labels`: the field is simply
ignored on restore (no migration). The user will see an empty label for the
restored predicate selection until they re-pick it or until the
re-hydration step (next paragraph) catches up.

**Legacy snapshot behaviour (accepted fallback):** restored snapshots
that pre-date this change carry `label` but no `labels`. After the DTO
shape change they will deserialize with an empty `labels` array. The
visible effect is that a restored predicate/resource-class shows an empty
label until the user re-picks it. This is acceptable — legacy snapshots
are rare and the fallback is non-destructive (the IRI is preserved, the
query still submits).

**Optional follow-up (NOT in scope for this issue):** a component-layer
re-hydration step could patch `labels` from the live ontology after it
loads — `combineLatest` the restored statement element with
`selectedOntology$`, look up by IRI, and patch `labels` in place. This is
deliberately deferred to keep this issue focused. Open a follow-up issue
if the empty-label-on-restore behaviour becomes a user-visible problem.

### Step 7 — i18n keys

Add to all five locale files (`en.json`, `de.json`, `fr.json`, `it.json`,
`rm.json`) under `pages.search.advancedSearch`:

```json
"advancedSearch": {
  "allResourceClasses": "All resource classes",
  "propertyOfClass": "Property of {{class}}",
  "resourceClass": "Resource Class",
  "resourceLabel": "Resource Label"
}
```

Key usage:
* `propertyOfClass` — `predicate-select.component.ts` template (Step 5 row 2).
* `resourceClass` — `resource-value.component.ts` template `mat-label` (Step 5 row 3).
* `allResourceClasses` — synthetic `searchAllResourceClassesOption` field on
  `OntologyDataService` (Step 3), read via `labelsFromI18n`.
* `resourceLabel` — synthetic `ResourceLabelPropertyData` predicate on
  `OntologyDataService` (Step 3), read via `labelsFromI18n`.

Translations are the single source of truth. **No multi-language string
literals in TypeScript.** Coordinate translation values with the
localization owner.

### Step 8 — Update existing specs

Files (verify each by grep before touching):

* `libs/vre/pages/search/advanced-search/src/lib/service/spec/gravsearch.service.spec.ts`
  (~20 `IriLabelPair` literals)
* `libs/vre/pages/search/advanced-search/src/lib/service/spec/property-form.manager.spec.ts`
  (~3 `IriLabelPair` literals)
* Any other `*.spec.ts` under `advanced-search/` that constructs
  `IriLabelPair`, `Predicate`, or `OrderByItem`.

Use the factory from step 2. Wire `createMockLocalizationService` from
`libs/vre/shared/app-helper-services/src/lib/localization.service.testing.ts`
in providers for any spec that exercises label display.

### Step 9 — New acceptance specs

* `ontology-data.service.spec.ts` — verify `resourceClasses$`,
  `getSubclassesOfResourceClass$`, and `_toPredicate` propagate
  `labels: StringLiteralV2[]` unchanged from the source.
* `ontology-data.service.spec.ts` — `ResourceLabelPropertyData` and
  `searchAllResourceClassesOption` are built from i18n JSON via
  `labelsFromI18n`. Stub `TranslateService` and verify each synthetic
  item exposes a `labels` entry per supported language sourced from the
  stubbed translations (no hard-coded fallback strings).
* `predicate-select.component.spec.ts` — the dropdown renders the
  pipe-resolved label and updates on language switch.
* `order-by.component.spec.ts` — items render via pipe and update on
  language switch.
* `order-by.service.spec.ts` — `availablePredicates$` carries `labels`
  (not `label`) end-to-end; `_computeNextOrderBy` constructs new
  `OrderByItem`s with the propagated `labels` array.
* `search-state-storage.service.spec.ts` — restoring a legacy snapshot
  (with `label` but no `labels`) does NOT crash; the restored shape simply
  lacks `labels`. Document the behavior explicitly.
* `search-state-storage.service.spec.ts` — assert (e.g. via a regex over
  the service's source file or a static-analysis test) that
  `SearchStateStorageService` does NOT import `LocalizationService` or
  any label-normalization helper. This locks in decision 4.
* `gravsearch.service.spec.ts` — confirm that label removal does not affect
  query construction (the writer uses `iri` / `writeValue` only).

## Implementation Steps

```
[ ] 1.  Reshape model.ts (IriLabelPair, Predicate, OrderByItem) — drop label, add labels. Make comments defaulted to [] on both interface and Predicate for consistency.
[ ] 2.  Add testing/builders.ts factory.
[x] 3.  Add labels-from-i18n.ts helper (TranslateService-backed builder).
[ ] 4.  Update OntologyDataService:
        - resourceClasses$, getSubclassesOfResourceClass$ pass labels through.
        - _toPredicate (keep as method) threads labels + comments from the WithAllLanguages variant.
        - ResourceLabelPropertyData becomes an instance field built from labelsFromI18n('pages.search.advancedSearch.resourceLabel').
        - searchAllResourceClassesOption instance field built from labelsFromI18n('pages.search.advancedSearch.allResourceClasses').
        - Inject TranslateService.
[ ] 5.  Remove (or refactor) the module-level SEARCH_ALL_RESOURCE_CLASSES_OPTION constant in constants.ts. Migrate consumers to read searchAllResourceClassesOption from OntologyDataService.
[ ] 6.  Update OrderByService: availablePredicates$ and _computeNextOrderBy thread labels (not label).
[ ] 7.  Swap the 4 in-scope display sites to pipe / translate (step 5 table).
[ ] 8.  Migrate deferred-site DTO shape (step 5b table) — link-value.component.ts, list-value.component.ts:88, dynamic-forms-data.service.ts:45.
[ ] 9.  Type-only changes in SearchStateStorageService; no logic changes (verify no LocalizationService import sneaks in).
[x] 10. Add i18n keys to en.json / de.json / fr.json / it.json / rm.json (propertyOfClass, resourceClass, resourceLabel, allResourceClasses).
[ ] 11. Migrate existing specs to the factory.
[ ] 12. Add new acceptance specs (per step 9).
[ ] 13. nx run vre-pages-search-advanced-search:lint and nx run vre-pages-search-advanced-search:test.
[ ] 14. Manual smoke test: switch UI language while advanced-search dropdowns are open; verify all 4 in-scope sites translate. Verify the deferred sites (link-value autocomplete, list-value picker) still look and behave identically. Restore an old snapshot — verify it doesn't crash.

Optional follow-up (NOT in this issue):
[ ] Re-hydration of legacy snapshot labels from the live ontology after it loads.
```

## Dependencies

* **Internal:** `@dasch-swiss/vre/ui/string-literal` (pipe),
  `@dasch-swiss/vre/shared/app-helper-services` (`pickPreferredLanguageString`,
  `LocalizationService`, `createMockLocalizationService`),
  `@dasch-swiss/dsp-js` (`StringLiteralV2`,
  `ResourceClassDefinitionWithAllLanguages`,
  `ResourcePropertyDefinitionWithAllLanguages`).
* **External:** None.
* **Predecessor work:** DEV-6627 (commit `1dae05a37`) — already merged.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| `mat-select` trigger label doesn't refresh on language switch (Material caches the projected `mat-option` content for the closed-trigger display) | Medium | Medium — user sees stale language in the selected value when the dropdown is closed | Verify with a manual test. If broken, drive `properties` / `availableResources$` from a `combineLatest` with `currentLanguage$` so the array reference changes and Material re-runs the trigger projection. |
| Removing `.label` breaks an unforeseen reader (e.g. `NodeValue.label`, third-party logging, a Storybook story) | Medium | Low — caught by compiler | TypeScript will surface every callsite. Grep `\.label` inside `advanced-search/` before claiming done. |
| Spec churn larger than estimated | Medium | Low — caught by CI | Factory (step 2) absorbs most churn. |
| Synthetic items drift from the locale files | Very Low | Low | Eliminated by design: synthetic `labels` arrays are built from i18n JSON at runtime via `labelsFromI18n` (decision 7). The locale files are the single source of truth. No snapshot test needed. Add a short comment near the synthetic field definitions pointing at the i18n keys. |
| Gravsearch query writer relies on `.label` somewhere we missed | Low | High — would break search submission | Already verified: `GravsearchWriterScoped` uses `iri` and `writeValue` only (`model.ts:280-282`). Acceptance test on `gravsearch.service.spec.ts` will catch any regression. |
| Deferred-site DTO migration (Step 5b) accidentally changes their visible display | Low | Low — caught by manual smoke test | Display path uses `pickPreferredLanguageString` with a single-entry `labels` array; the function returns the only entry. Net effect at the UI is unchanged. |
| Legacy snapshot restore shows empty label until user re-picks | Medium | Low — non-destructive (IRI preserved, query still submits) | Accepted fallback. Re-hydration deferred to follow-up. |

## Acceptance Criteria

From the Linear issue:

* [ ] The five sites listed in the issue display the resolved UI-language
      label/comment.
* [ ] Re-rendering happens on UI language switch without a re-fetch
      (achieved via the impure pipe at the display boundary).
* [ ] No change to DSP-API wire format.
* [ ] No regression in existing advanced-search behaviour (sorting, search
      submission, link/list/ontology dropdowns still work even if the
      deferred sites remain single-language).

Added:

* [ ] Hard-coded English strings `"Property of {class}"`, `"Resource Class"`,
      `"Resource Label"`, `"All resource classes"` are translated via i18n
      keys (decision 5).
* [ ] No multi-language string literals in TypeScript. Synthetic items
      source `labels` from i18n JSON via `labelsFromI18n` (decision 7).
* [ ] Deferred sites (link-value, list-value, dynamic-forms search results)
      adopt the unified `labels` DTO shape but their visible display is
      unchanged (decision 8).
* [ ] Pre-migration localStorage snapshots load without crash. Display of
      restored label is empty until the user re-picks (re-hydration is a
      deferred follow-up).
* [ ] `SearchStateStorageService` does not import `LocalizationService` and
      does not normalize label data (decision 4). Enforced by a spec.
* [ ] All existing specs pass; new acceptance specs cover the
      language-switch re-render path and the i18n-sourced synthetic items.

## Success Metrics

* All advanced-search dropdowns and the order-by display show labels in the
  user's selected language.
* Switching the UI language while advanced-search is open re-renders all
  affected sites within one change-detection cycle.
* CI green: lint and unit tests for `vre-pages-search-advanced-search` and
  any spec touched by the DTO reshape.

## Notes for Reviewers

* Pay attention to `Predicate`'s and `OrderByItem`'s constructor parameter
  order — they change. Grep for `new Predicate(` and `new OrderByItem(` to
  catch call-site updates.
* `IriLabelPair` lost its `.label` field. The compiler will flag every
  remaining reader, including the **deferred sites** (link-value,
  list-value, dynamic-forms-data) — these adopt the unified DTO shape but
  keep their single-language display (Step 5b, Decision 8).
* **No multi-language string literals in TypeScript.** Synthetic items
  (`ResourceLabelPropertyData`, `searchAllResourceClassesOption`) build
  their `labels` arrays from i18n JSON at runtime via `labelsFromI18n`.
  If a reviewer sees a `StringLiteralV2[]` with embedded translations
  inline in TS, push back.
* `SearchStateStorageService` must stay free of `LocalizationService` and
  free of label-normalization logic. Enforced by a spec; if reviewers see
  either appearing, push back.
* The `SEARCH_ALL_RESOURCE_CLASSES_OPTION` module constant goes away in
  favor of `OntologyDataService.searchAllResourceClassesOption`. Update
  every consumer.
* If the `mat-select` trigger-label refresh issue (risk #1) materializes,
  the cleanest fix is to drive `properties` from a `combineLatest` with
  `currentLanguage$` and consume via `| async`. Don't reach for
  `markForCheck` workarounds.
* The deferred sites (ontology dropdown, link-object autocomplete display,
  list-value picker display) intentionally remain single-language at the
  UI even though their DTOs are now unified. Resist the temptation to
  widen their UI here — that needs a DSP-API change first.
