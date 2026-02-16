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
