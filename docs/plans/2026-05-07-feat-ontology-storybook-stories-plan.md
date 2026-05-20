---
title: "feat: Storybook stories for the ontology library"
type: feat
date: 2026-05-07
status: draft
repository: dasch-swiss/dsp-das
---

# feat: Storybook stories for the ontology library

## Overview

Write `.stories.ts` files for all 22 components in
`libs/vre/pages/ontology/ontology/src/lib/`. Every story must render without
errors, have at least one `play()` assertion, and expose `argTypes` with
`description` for every `@Input()` / `@Output()`. The work is split into 5
phases: shared helpers → presentational → containers/cards → dialogs →
page-level containers.

## Problem Statement

Zero Storybook stories exist for the ontology editor. Developers cannot verify
component behaviour in isolation, there are no in-code acceptance criteria, and
regressions go undetected until E2E tests run.

## Proposed Solution

Add one `.stories.ts` file per component, co-located alongside the component
file. All stories share a central `stories.helpers.ts` fixture/stub library at
the lib root. The global `.storybook/main.ts` already picks up
`libs/**/*.stories.ts`, so no NX target reconfiguration is needed.

---

## Technical Approach

### Architecture

**Story title hierarchy:** `Ontology / <Section> / <ComponentName>`

**Decorator pattern:** `applicationConfig({ providers: [...] })` on the `meta`
object. Never use `moduleMetadata` (the codebase uses standalone components
exclusively).

**TranslateService:** No story-level stub needed — `preview.ts` already
provides `provideTranslateService` and loads `en.json` from static assets.

**Dialog components:** Wrapped in an inline `@Component` Launcher (see
Phase 4). All `play()` assertions on dialog content must use
`document.querySelector(...)` — never `within(canvasElement)` — because
MatDialog renders into the CDK overlay outside the canvas.

**OnPush components:** Observable stubs must be `BehaviorSubject` (not
`Subject` or `of(...)`) so they emit synchronously on subscription. Nine of
22 components use `OnPush`.

**Drag-and-drop:** Do NOT attempt drag simulation in `play()` for
`ResourceClassInfoComponent` and `PropertyItemComponent`. Scope assertions to
initial render state only.

**`GuiAttrLinkComponent` / `GuiAttrListComponent`:** No standalone stories.
Covered implicitly via `PropertyFormComponent` scenarios.

---

### Shared Stub Rules (Critical — applies to every phase)

These rules were surfaced by the spec review and must be followed precisely.

#### Rule 1 — `OntologyEditService` stub must be a plain object with these exact shapes:

```typescript
import { BehaviorSubject } from 'rxjs';
import { of } from 'rxjs';

export const makeOntologyEditServiceStub = (partial: Partial<{
  currentOntologyClasses$: any;
  currentOntologyProperties$: any;
  currentProjectsProperties$: any;
  currentOntologyCanBeDeleted$: any;
  isTransacting$: any;
  isTransacting: boolean;     // ← synchronous getter, NOT an observable
  ontologyId: string;         // ← synchronous getter, NOT an observable
  latestChangedItem: BehaviorSubject<string | undefined>;  // ← must be BehaviorSubject
}> = {}) => ({
  currentOntology$: of(null),
  currentOntologyInfo$: of(null),
  currentOntologyClasses$: of([]),
  currentOntologyProperties$: of([]),
  currentProjectsProperties$: of([]),
  currentOntologyEntityNames$: of([]),   // ← must be of([]) so async validators complete
  currentOntologyCanBeDeleted$: of(false),
  isTransacting$: of(false),
  isTransacting: false,                   // ← synchronous boolean
  latestChangedItem: new BehaviorSubject<string | undefined>(undefined),  // ← must be BehaviorSubject
  ontologyId: 'http://0.0.0.0:3333/ontology/0001/test/v2',  // ← synchronous string
  initOntologyByLabel: () => of(null),
  canDeleteResourceProperty$: () => of({ canDo: true }),
  canDeleteResourceClass$: () => of({ canDo: true }),
  deleteProperty$: () => of({}),
  deleteResourceClass$: () => of({}),
  deleteOntology$: () => of({}),
  updateGuiOrderOfClassProperties: () => {},
  removePropertyFromClass: () => of({}),
  assignPropertyToClass: () => of({}),
  ...partial,
});
```

#### Rule 2 — `ResourceClassInfo` must be constructed via `new`, not object literal:

```typescript
import { ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { ResourceClassInfo } from './ontology.types';

export const makeResourceClassInfo = (): ResourceClassInfo => {
  const def = new ResourceClassDefinitionWithAllLanguages();
  def.id = 'http://0.0.0.0:3333/ontology/0001/test/v2#TestClass';
  def.label = 'Test Class';
  def.labels = [{ language: 'en', value: 'Test Class' }];
  def.comments = [];
  def.propertiesList = [];
  def.subClassOf = ['http://api.knora.org/ontology/knora-api/v2#Resource'];
  return new ResourceClassInfo(def, []);
};
```

#### Rule 3 — `ProjectPageService` stub minimum surface:

```typescript
export const makeProjectPageServiceStub = (partial = {}) => ({
  currentProject$: of(makeProject()),
  hasProjectAdminRights$: of(true),
  ontologies$: of([]),
  ontologiesMetadata$: of([]),
  currentProjectUuid: '0001',
  currentProject: makeProject(),
  reloadProject: () => {},
  ...partial,
});

export const makeProject = () => ({
  id: 'http://rdfh.ch/projects/0001',
  shortcode: '0001',
  shortname: 'test',
  longname: 'Test Project',
  keywords: [],
  status: true,
});
```

#### Rule 4 — Router must be provided for any component using `RouterLink` or `ActivatedRoute`:

```typescript
import { provideRouter } from '@angular/router';
provideRouter([{ path: '**', redirectTo: '' }])
```

Always use `{ path: '**', redirectTo: '' }` so that `ActivatedRoute.paramMap`
emits with an empty params map (graceful null input to services).

#### Rule 5 — Dialog play() assertions:

```typescript
// In every dialog story's play():
const dialog = document.querySelector('mat-dialog-container');
await expect(dialog).not.toBeNull();
// Then query within dialog:
const submitBtn = dialog!.querySelector('[data-cy="submit-button"]');
```

---

### Implementation Phases

---

#### Phase 0: Shared helpers file

**File:** `libs/vre/pages/ontology/ontology/src/lib/stories.helpers.ts`

- [ ] Export `makeProject()` fixture
- [ ] Export `makeProjectPageServiceStub(partial?)` factory (Rule 3)
- [ ] Export `makeOntologyEditServiceStub(partial?)` factory (Rule 1)
- [ ] Export `makeOntologyPageServiceStub()` → `{ expandClasses$: new BehaviorSubject(true), toggleExpandClasses: () => {} }`
- [ ] Export `makeResourceClassInfo()` factory (Rule 2)
- [ ] Export `makePropertyInfo(overrides?)` factory
- [ ] Export `makeClassPropertyInfo(overrides?)` factory
- [ ] Export `makeNotificationServiceStub()` → `{ openSnackBar: () => {} }`
- [ ] Export `makeDialogServiceStub()` → `{ afterConfirmation: () => of(true), openDialog: () => {} }`
- [ ] Export `makeDspApiStub()` for `DspApiConnectionToken` → minimal `v2.onto` stub
- [ ] Export `makeListApiServiceStub()` → `{ listInProject: () => of([]), get: () => of({ list: { listinfo: {}, children: [] } }) }`

**Fixtures for `PropertyInfo`:**
```typescript
export const makePropertyInfo = (overrides = {}): PropertyInfo => ({
  propDef: makePropDef(),
  propType: { label: 'Text', objectType: Constants.TextValue, icon: 'text_fields', group: 'Text' } as DefaultProperty,
  baseOntologyId: 'http://api.knora.org/ontology/knora-api/v2',
  baseOntologyLabel: 'knora-api',
  usedByClasses: [],
  objectLabels: [],
  objectComments: [],
  ...overrides,
});

export const makeClassPropertyInfo = (overrides = {}): ClassPropertyInfo => ({
  ...makePropertyInfo(),
  iHasProperty: { propertyIndex: 'http://...#testProp', cardinality: Cardinality._0_n, guiOrder: 0, isInherited: false },
  classId: 'http://0.0.0.0:3333/ontology/0001/test/v2#TestClass',
  ...overrides,
});
```

**Verification:** Import helpers in a dummy test to confirm no circular deps.

---

#### Phase 1: Presentational components (6 components)

These components take `@Input()` bindings and have minimal service dependencies.

---

##### 1.1 `ontology-form.component.stories.ts`

**Location:** `forms/ontology-form/ontology-form.component.stories.ts`

Stories:
- `[ ]` `CreateModeEmpty` — `name: 'Shows empty form in create mode'` — assert label input is present
- `[ ]` `EditModeWithData` — `name: 'Shows pre-filled label and comment in edit mode'` — assert values in inputs

```typescript
// argTypes:
mode: { description: 'Controls whether the form is used for creating or editing an ontology.' }
data: { description: 'Pre-fill data for edit mode. Omit for create mode.' }
afterFormInit: { description: 'Emitted once the reactive form instance is initialised.' }
```

Providers needed: none (FormBuilder is tree-shakeable, no DI).

---

##### 1.2 `resource-class-form.component.stories.ts`

**Location:** `forms/resource-class-form/resource-class-form.component.stories.ts`

Stories:
- `[ ]` `EmptyForm` — assert name field is present and enabled
- `[ ]` `PreFilledLabels` — `formData` with existing labels array — assert first label value rendered

Providers:
- `{ provide: OntologyEditService, useValue: makeOntologyEditServiceStub() }` — needed for async name validator (`currentOntologyEntityNames$`)

**Note:** `currentOntologyEntityNames$` must return `of([])` (already in stub default) so the async validator resolves and the form exits PENDING state.

---

##### 1.3 `property-form.component.stories.ts`

**Location:** `forms/property-form/property-form.component.stories.ts`

Stories:
- `[ ]` `TextValueProperty` — `propertyData` with `propType.objectType = Constants.TextValue` — assert label field present
- `[ ]` `LinkValueProperty` — `propertyData` with `propType.objectType = Constants.LinkValue` — assert GUI attr link dropdown renders
- `[ ]` `ListValueProperty` — `propertyData` with `propType.objectType = Constants.ListValue` — assert GUI attr list dropdown renders

Providers:
- `OntologyEditService` stub
- `ProjectPageService` stub (for `gui-attr-link` and `gui-attr-list` sub-components)
- `{ provide: ListApiService, useValue: makeListApiServiceStub() }` (for `gui-attr-list`)

**Note:** `GuiAttrLinkComponent` and `GuiAttrListComponent` get coverage here via integration — no separate stories needed.

---

##### 1.4 `cardinality.component.stories.ts`

**Location:** `resource-classes/resource-class-info/cardinality-component/cardinality.component.stories.ts`

Stories:
- `[ ]` `OptionalUnique` — cardinality `_0_1` — both checkboxes unchecked
- `[ ]` `RequiredUnique` — cardinality `_1` — "required" checked, "multiple" unchecked
- `[ ]` `OptionalMultiple` — cardinality `_0_n` — "multiple" checked, "required" unchecked
- `[ ]` `DisabledState` — `disabled: true` — checkboxes not interactive

`argTypes`:
```typescript
classProp: { description: 'The class property info including the current cardinality value.' }
disabled: { description: 'When true, the cardinality checkboxes are not interactive (e.g. inherited properties).' }
cardinalityChange: { description: 'Emitted when the user confirms a cardinality change via the confirmation dialog.' }
```

Providers: `MatDialog` stub → `{ provide: MatDialog, useValue: { open: () => ({ afterClosed: () => of(true) }) } }`

---

##### 1.5 `property-item.component.stories.ts`

**Location:** `resource-classes/resource-class-info/property-item.component.stories.ts`

Stories:
- `[ ]` `AdminView` — `hasProjectAdminRights$: of(true)` — assert edit/remove buttons accessible on hover
- `[ ]` `ReadOnlyView` — `hasProjectAdminRights$: of(false)` — assert no edit/remove buttons

**OnPush note:** `ProjectPageService.hasProjectAdminRights$` must be `BehaviorSubject`.

Providers:
- `OntologyEditService` stub (with `latestChangedItem: new BehaviorSubject(undefined)`)
- `ProjectPageService` stub (with `hasProjectAdminRights$: new BehaviorSubject(true)`)
- `NotificationService` stub
- `MatDialog` stub
- `DspApiConnectionToken` → `makeDspApiStub()`

---

##### 1.6 `property-info.component.stories.ts`

**Location:** `properties/property-info/property-info.component.stories.ts`

Stories:
- `[ ]` `AdminView` — `hasProjectAdminRights$: of(true)` — assert edit button visible on hover (use `userEvent.hover`)
- `[ ]` `ReadOnlyView` — `hasProjectAdminRights$: of(false)` — assert no action buttons visible

```typescript
property: { description: 'The property definition along with type metadata and usage information.' }
```

Providers: same as `property-item` minus `DspApiConnectionToken`.

---

#### Phase 2: Containers and cards (5 components)

---

##### 2.1 `resource-class-info.component.stories.ts`

**Location:** `resource-classes/resource-class-info/resource-class-info.component.stories.ts`

Stories:
- `[ ]` `ExpandedWithProperties` — `resourceClass` with 3 `ClassPropertyInfo` entries — assert property labels visible
- `[ ]` `CollapsedCard` — `expandClasses$: new BehaviorSubject(false)` — assert property list hidden
- `[ ]` `AdminView` — `hasProjectAdminRights$: of(true)` — assert edit/delete buttons present

**OnPush note:** `expandClasses$` must be `BehaviorSubject`.

**Drag-and-drop:** Explicitly excluded from `play()`. Add comment: `// Drag-to-reorder is covered by E2E tests only.`

```typescript
resourceClass: { description: 'The resource class definition including its assigned properties.' }
```

Providers:
- `OntologyEditService` stub (with `BehaviorSubject` for `latestChangedItem`)
- `ProjectPageService` stub
- `OntologyPageService` stub (with `expandClasses$: new BehaviorSubject(true)`)
- `DspApiConnectionToken` → `makeDspApiStub()`
- `NotificationService` stub, `MatDialog` stub, `DialogService` stub

---

##### 2.2 `add-property-menu.component.stories.ts`

**Location:** `resource-classes/resource-class-info/add-property-menu.component.stories.ts`

Stories:
- `[ ]` `WithAvailableProperties` — stub `currentProjectsProperties$` with 2 `PropToAdd` entries — assert menu trigger button rendered
- `[ ]` `EmptyProjectProperties` — stub returns `[]` — assert menu trigger still renders (add new property option always present)

```typescript
resourceClass: { description: 'The resource class to which a property will be added or assigned.' }
```

Providers:
- `OntologyEditService` stub
- `MatDialog` stub

---

##### 2.3 `ontology-editor-page.component.stories.ts`

**Location:** `resource-classes/ontology-editor-page.component.stories.ts`

Stories:
- `[ ]` `WithClasses` — `currentOntologyClasses$: of([makeResourceClassInfo()])` — assert one class card rendered
- `[ ]` `EmptyOntology` — `currentOntologyClasses$: of([])` — assert empty state message

Providers:
- `OntologyEditService` stub

---

##### 2.4 `ontology-properties.component.stories.ts`

**Location:** `properties/ontology-properties.component.stories.ts`

Stories:
- `[ ]` `WithProperties` — `currentOntologyProperties$: of([makePropertyInfo()])` — assert property label visible
- `[ ]` `EmptyProperties` — `currentOntologyProperties$: of([])` — assert empty state

Providers:
- `OntologyEditService` stub
- `ProjectPageService` stub
- `MatDialog` stub, `DialogService` stub, `NotificationService` stub, `DspApiConnectionToken`

---

##### 2.5 `ontology-sidenav.component.stories.ts`

**Location:** `ontology-sidenav.component.stories.ts`

Stories:
- `[ ]` `AdminView` — `hasProjectAdminRights$: of(true)` — assert "Add class" and "Add property" buttons visible
- `[ ]` `ReadOnlyView` — `hasProjectAdminRights$: of(false)` — assert create buttons absent
- `[ ]` `ExpandedClasses` — `expandClasses$: of(true)` — assert "Collapse all" toggle shows

Providers:
- `OntologyPageService` stub
- `ProjectPageService` stub
- `MatDialog` stub
- `provideRouter([{ path: '**', redirectTo: '' }])`

---

#### Phase 3: Dialog components (6 components)

All dialogs follow the Launcher pattern. All `play()` assertions use
`document.querySelector`, not `within(canvasElement)`.

**Launcher template (reuse for every dialog):**
```typescript
@Component({
  selector: 'app-story-launcher',
  template: ``,
  standalone: true,
})
class StoryLauncherComponent implements OnInit {
  private _dialog = inject(MatDialog);
  ngOnInit() {
    this._dialog.open(TargetDialogComponent, {
      ...DspDialogConfig.dialogDrawerConfig(dialogData),
    });
  }
}
// meta.component = StoryLauncherComponent
```

---

##### 3.1 `create-ontology-form-dialog.component.stories.ts`

Stories:
- `[ ]` `OpenDialog` — assert `mat-dialog-container` present, form title visible

Providers:
- `ProjectPageService` stub
- `DspApiConnectionToken` → `makeDspApiStub()`
- `{ provide: MatDialogRef, useValue: { close: () => {} } }`

---

##### 3.2 `edit-ontology-form-dialog.component.stories.ts`

Stories:
- `[ ]` `PreFilledDialog` — inject `data: { id: '...', label: 'My Ontology', comment: 'A test ontology' }` — assert label input shows 'My Ontology'

Providers:
- `OntologyEditService` stub

---

##### 3.3 `create-resource-class-dialog.component.stories.ts`

Stories:
- `[ ]` `OpenDialog` — inject `data: { label: 'Thing', iri: '...', icon: 'schema' }` — assert dialog and form visible

Providers:
- `OntologyEditService` stub
- `ProjectPageService` stub

---

##### 3.4 `edit-resource-class-dialog.component.stories.ts`

Stories:
- `[ ]` `PreFilledDialog` — inject class data with labels/comments — assert label input pre-filled

Providers:
- `OntologyEditService` stub

---

##### 3.5 `edit-property-form-dialog.component.stories.ts`

Stories:
- `[ ]` `EditMode` — inject existing property data — assert dialog title contains property name
- `[ ]` `CreateMode` — inject `CreatePropertyDialogData` — assert empty form

Providers:
- `OntologyEditService` stub
- `ProjectPageService` stub
- `ListApiService` stub

---

##### 3.6 `cardinality-change-dialog.component.stories.ts`

Stories:
- `[ ]` `LoadingState` — stub `v2.onto.canReplaceCardinalityOfResourceClassWith` returns `NEVER` — assert spinner visible
- `[ ]` `BlockedState` — stub returns `of({ canDo: false, cannotDoReason: 'Data conflict' })` — assert warning message
- `[ ]` `ConfirmableState` — stub returns `of({ canDo: true })` — assert confirmation message and confirm button

This component makes an API call in `ngOnInit` via `DspApiConnectionToken`. The three states are controlled by what the `v2.onto.canReplaceCardinalityOfResourceClassWith` method returns.

---

#### Phase 4: Page-level containers (3 components)

**Important:** `OntologyPageComponent` declares `providers: [OntologyPageService, OntologyEditService]` in its `@Component` decorator. Story-level `applicationConfig` stubs for these two services will be **overridden** by the component's own injector. Strategy: provide all real dependencies at the story level so the component's injector resolves them from the stub chain. This requires providing every dependency of `OntologyEditService` and `OntologyPageService` in `applicationConfig`.

---

##### 4.1 `ontology-editor-header.component.stories.ts`

Stories:
- `[ ]` `OntologyLoaded` — assert ontology label in toolbar
- `[ ]` `AdminView` — `hasProjectAdminRights$: of(true)` — assert edit and delete buttons present

Providers:
- `OntologyEditService` stub
- `ProjectPageService` stub
- `MatDialog` stub, `DialogService` stub
- `provideRouter([{ path: '**', redirectTo: '' }])`

---

##### 4.2 `ontology-page.component.stories.ts`

**Strategy:** Because `OntologyPageComponent` has local `providers`, supply all transitive
dependencies of `OntologyEditService` and `OntologyPageService` in story-level providers. The
real service classes will instantiate but their network calls will be short-circuited by
stubbing `DspApiConnectionToken`, `ListApiService`, and `ProjectPageService`.

Stories:
- `[ ]` `LayoutRenders` — assert sidenav and main content area present
- `[ ]` `LoadingState` — `isTransacting$: of(true)` — assert progress overlay visible

Providers (comprehensive list):
- `ProjectPageService` stub
- `DspApiConnectionToken` → `makeDspApiStub()`
- `{ provide: ListApiService, useValue: makeListApiServiceStub() }`
- `{ provide: NotificationService, useValue: makeNotificationServiceStub() }`
- `provideRouter([{ path: '**', redirectTo: '' }])`

---

##### 4.3 `data-models-page.component.stories.ts`

Stories:
- `[ ]` `WithOntologies` — `ontologiesMetadata$: of([makeOntologyMetadata()])` — assert ontology card/row visible
- `[ ]` `EmptyProject` — `ontologiesMetadata$: of([])` — assert empty state message

Providers:
- `ProjectPageService` stub
- `{ provide: ListApiService, useValue: makeListApiServiceStub() }`
- `provideRouter([{ path: '**', redirectTo: '' }])`

---

## Alternative Approaches Considered

**Stub `OntologyEditService` with a class (extends the real one):** Rejected — the real constructor has 8 dependencies and non-trivial side-effect chains. A plain object stub with `useValue` is simpler and does not pull in the real class's dependencies.

**Standalone stories for `GuiAttrLinkComponent` / `GuiAttrListComponent`:** Rejected — these take typed `FormControl` references that only exist inside a fully-initialised `PropertyForm`. Constructing that form outside `PropertyFormComponent` would duplicate the form factory logic. Coverage via `PropertyFormComponent` scenarios is sufficient.

**Per-library storybook target in `project.json`:** Not needed — the global `.storybook/main.ts` globs `libs/**/*.stories.ts`.

---

## Acceptance Criteria

### Functional Requirements

- [ ] 22 components each have a co-located `.stories.ts` file
- [ ] Every story renders in `nx run dsp-app:storybook` with zero browser console errors
- [ ] Every story has at least one `play()` function with at least one `expect()` assertion
- [ ] All `@Input()` and `@Output()` on each component are listed in `argTypes` with a `description`
- [ ] All story titles follow `Ontology / <Section> / <ComponentName>`
- [ ] Story export names (or `name` fields) are plain-English acceptance criteria sentences

### Non-Functional Requirements

- [ ] `nx run dsp-app:test-storybook` passes for all new stories
- [ ] No story uses real HTTP calls (all service dependencies stubbed)
- [ ] `nx run vre-pages-ontology-ontology:lint` passes (import order, no unused vars)
- [ ] `nx run vre-pages-ontology-ontology:test` still passes (no regressions)

### Quality Gates

- [ ] `stories.helpers.ts` exports verified importable (no circular dependencies)
- [ ] Each phase committed separately (one commit per phase batch)

---

## Risk Analysis & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| `OntologyPageComponent` local providers override stubs | H | H | Provide all transitive deps; document strategy in plan |
| `latestChangedItem.value` throws if not a `BehaviorSubject` | H | H | Rule 1 in helpers: always use `new BehaviorSubject(undefined)` |
| Async validators leave form in PENDING state | M | M | `currentOntologyEntityNames$` always returns `of([])` in stub |
| Dialog `play()` fails with `within(canvasElement)` | H | M | Rule 5: always use `document.querySelector` for overlay content |
| `OnPush` + `Subject` causes missed update in story | M | M | Rule 4: all stubs use `BehaviorSubject`, never `Subject` |
| `ResourceClassInfo` constructed as plain object | M | H | Rule 2: always use `new ResourceClassInfo(def, [])` |
| Drag-and-drop simulation in jsdom is unreliable | H | L | Excluded from `play()` scope; comment in story file |
| `CardinalityChangeDialogComponent` API call on init | H | M | Three separate stories with `NEVER`, `of({canDo:false})`, `of({canDo:true})` |

---

## Dependencies & Prerequisites

- No NX `project.json` changes required
- `.storybook/main.ts` already globs `libs/**/*.stories.ts`
- `preview.ts` already provides `TranslateService` globally — no story-level stub needed
- `provideAnimations()` already in `preview.ts` — `MatRipple` works without extra setup
- All dependencies (`@storybook/angular`, `storybook/test`) already installed

---

## References & Research

### Internal References

- Story conventions: `libs/vre/resource-editor/resource-editor/src/lib/stories.helpers.ts`
- Dialog Launcher pattern: `libs/vre/resource-editor/resource-editor/src/lib/header/more-menu/erase-resource-dialog.component.stories.ts`
- `applicationConfig` pattern: `libs/vre/resource-editor/resource-editor/src/lib/single-resource-page.component.stories.ts`
- Global Storybook config: `.storybook/main.ts`, `.storybook/preview.ts`
- Ontology types: `libs/vre/pages/ontology/ontology/src/lib/ontology.types.ts`
- OntologyEditService: `libs/vre/pages/ontology/ontology/src/lib/services/ontology-edit.service.ts`
- OntologyPageService: `libs/vre/pages/ontology/ontology/src/lib/ontology-page.service.ts`
