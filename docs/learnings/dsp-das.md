# DSP-DAS — Learnings

Accumulated debugging insights, architectural gotchas, and patterns discovered while working on [DSP-DAS](https://github.com/dasch-swiss/dsp-das).

---

## Boolean `false` Fails Truthiness Validation (DEV-5866)

**Context:** The save button in the property editor was disabled when the boolean value was `false`.

**Root cause:** The validity check used JavaScript truthiness:

```typescript
// BUG: !!false === false, so this treats false as "no value"
!!this.group.controls.item.value
```

**Fix:** Use explicit null-checking instead:

```typescript
// CORRECT: false is a valid value, only null means "no value"
this.group.controls.item.value !== null
```

**Rule of thumb:** Never use `!!value` or truthiness checks to validate form controls that can legitimately hold falsy values (`false`, `0`, `""`). Always use explicit null/undefined checks.

**Affected file:** `property-value-edit.component.ts` (line 134)

---

## RxJS `valueChanges` Doesn't Emit Initial State (DEV-5866)

**Context:** After fixing the truthiness bug above, the save button was *still* disabled when first adding a new boolean value. The user had to toggle the value before the button would enable.

**Root cause:** `hasValidValue$` was built from `this.group.valueChanges`, which only emits on *changes* — not the initial value. When adding a new boolean (initial value `false`), no change event fires, so the observable never evaluates.

```typescript
// BUG: no emission until user interacts with the form
this.hasValidValue$ = this.group.valueChanges.pipe(
  switchMap(() => of(this.group.controls.item.valid && this.group.controls.item.value !== null))
);
```

**Fix:** Add `startWith(null)` to trigger an immediate evaluation:

```typescript
// CORRECT: evaluates initial form state immediately
this.hasValidValue$ = this.group.valueChanges.pipe(
  startWith(null),
  switchMap(() => of(this.group.controls.item.valid && this.group.controls.item.value !== null))
);
```

**Existing pattern in codebase:**

- `property-value-creator.component.ts:91` — uses `startWith(this.formGroup.controls.item.getRawValue())`
- `_watchAndSetupCommentStatus()` in the same file — uses `startWith(null)` on `statusChanges`
- `iiif-control.component.ts`, `interval-value.component.ts`, `list-value.component.ts` — all use `startWith`

**Rule of thumb:** When deriving state from `valueChanges` or `statusChanges`, always ask: "Does the initial state need to be evaluated?" If yes, add `startWith(null)` (or `startWith(initialValue)`). The `switchMap` reads from the form controls directly, so the emitted value doesn't matter — it just needs a "kick" to trigger the first evaluation.

---

## Reuse Existing CDK Drag-and-Drop Patterns (DEV-5870)

**Context:** Needed to add drag-and-drop reordering for values within a property.

**Decision:** Used Angular CDK `cdkDropList` + `cdkDrag` + `cdkDragHandle` with `drag_indicator` icon, matching existing patterns already in the codebase:

- `resource-class-info.component.ts` — ontology property reorder
- Search order-by components

**Rule of thumb:** Before implementing drag-and-drop, search the codebase for existing CDK drag-drop patterns. Consistency reduces review friction and ensures tested behavior. The `cdkDragHandle` pattern (drag only via a handle icon, not the whole row) is the established convention in this codebase.

**Affected file:** `draggable-value-list.component.ts`

---

## Use `cdkDragPlaceholder` for Clean Drop Zones (DEV-5870)

**Context:** Value components contain complex sub-components (CKEditor instances, file previews, IIIF viewers). CDK's default placeholder can look messy when the dragged item's DOM is heavy.

**Decision:** Use `cdkDragPlaceholder` to render a clean, minimal drop zone while dragging, instead of building a custom drag preview:

```html
<div cdkDragPlaceholder></div>
```

No custom `*cdkDragPreview` or summary helper was needed — the default drag preview (which clones the element) worked fine, and the placeholder keeps the drop target area clean.

**Rule of thumb:** Use `cdkDragPlaceholder` to show a clean drop zone when reordering complex components. A custom `*cdkDragPreview` is only needed if the default clone causes performance or visual issues — start without one and add it only if necessary.

**Affected file:** `draggable-value-list.component.ts`

---

## Prefer the OpenAPI-Generated Client Over Direct `HttpClient` (DEV-5870)

**Context:** The new `PUT /v2/values/order` endpoint wasn't available in `@dasch-swiss/dsp-js` yet, but the frontend needed to call it.

**Decision:** Used the OpenAPI-generated `APIV2ApiService` (auto-generated from `dsp-api_spec.yaml` via openapitools) instead of manual `HttpClient` calls:

```typescript
private readonly apiService = inject(APIV2ApiService);

this.apiService.putV2ValuesOrder({
  resourceIri,
  propertyIri,
  orderedValueIris,
});
```

No manual URL construction, no `DspApiConfigToken` injection — the generated client handles base URL configuration and serialization.

**Rule of thumb:** When `dsp-js` lacks an endpoint, prefer the OpenAPI-generated client (`APIV2ApiService`) if the endpoint is defined in `dsp-api_spec.yaml`. Fall back to direct `HttpClient` only when no generated client is available.

**Affected file:** `draggable-value-list.component.ts`
