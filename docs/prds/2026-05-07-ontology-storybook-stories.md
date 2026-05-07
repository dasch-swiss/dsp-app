---
title: "Storybook Stories for Ontology Library"
date: 2026-05-07
author: "Julien Schneider"
status: draft
---

# Storybook Stories for Ontology Library PRD

## Context

The `libs/vre/pages/ontology/ontology` NX library contains 22 components covering the full
ontology editor experience: the data models list page, the ontology editor header and sidenav,
resource class cards, property info rows, cardinality controls, and six form/dialog components.

Currently **zero** `.stories.ts` files exist for this library. This creates a gap in the
project's Storybook coverage and means:

- There are no acceptance criteria expressed in code for the ontology editor UI.
- Developers working on these components have no isolated sandbox to verify their work.
- Regressions in the ontology editor go undetected until E2E tests run.

The global `.storybook/main.ts` already picks up all `libs/**/*.stories.ts` files, so no
NX project reconfiguration is needed — story files can be added alongside the component files
and they will be picked up automatically.

## Goals

- Write one or more `.stories.ts` files for each of the 22 components.
- Every story must have at least one `play()` function asserting a user-visible outcome
  (CLAUDE.md convention).
- Use the story title hierarchy `Ontology / <Section> / <Component>` to match the
  feature area.
- Provide `argTypes` with `description` for every `@Input()` and `@Output()`.
- Stories must render in the global Storybook (`nx run dsp-app:storybook`) without errors.

## Core Features

### Feature 1: Presentational Component Stories (8 components)

These components take plain `@Input()` objects and have minimal service dependencies.
Stories can be written with inline stub providers and fixture data objects.

| Component | Key Inputs | Story scenarios |
|---|---|---|
| `ontology-form` | `mode`, `data?` | Create mode (empty), Edit mode (pre-filled) |
| `resource-class-form` | `formData` | Empty form, Pre-filled with labels/comments |
| `property-form` | `propertyData` | TextValue property, ListValue property |
| `gui-attr-link` | `control` (FormControl) | Empty selection, Resource class pre-selected |
| `gui-attr-list` | `control` (FormControl) | Empty selection, List pre-selected |
| `cardinality` | `classProp`, `disabled` | Optional, Required, Disabled |
| `property-item` | `classProp` | Admin view (edit/remove visible), Read-only view |
| `property-info` | `property` | Admin view (edit/delete visible), Read-only view |

### Feature 2: Container / Card Stories (5 components)

These components are service-driven (no `@Input()`s or minimal ones) and render
observable data from `OntologyEditService`, `OntologyPageService`, and `ProjectPageService`.
Stories use `applicationConfig` with mock provider factories that return controlled
`BehaviorSubject`-backed stubs.

| Component | Story scenarios |
|---|---|
| `resource-class-info` | Expanded with 3 properties, Collapsed, Admin view (action buttons) |
| `add-property-menu` | Resource class with available project properties, Empty |
| `ontology-editor-page` | Multiple classes loaded, Empty ontology |
| `ontology-properties` | Properties list, Empty list |
| `ontology-sidenav` | Admin view (create buttons), Read-only view |

### Feature 3: Dialog Component Stories (6 components)

Dialog components (`MAT_DIALOG_DATA`-injected) are wrapped in a launcher component
that opens the dialog on render, following the pattern used in resource-editor dialogs.

| Component | Story scenarios |
|---|---|
| `create-ontology-form-dialog` | Open/ready state |
| `edit-ontology-form-dialog` | Pre-filled with ontology label/comment |
| `edit-property-form-dialog` | Create mode, Edit mode (existing property) |
| `create-resource-class-dialog` | Open with default class type |
| `edit-resource-class-dialog` | Pre-filled with class labels/comments |
| `cardinality-change-dialog` | Can-change state, Blocked state (data conflict) |

### Feature 4: Page-Level Container Stories (3 components)

Page-level containers that require router and full service stacks. Stories provide
`provideRouter([])` and mock all service dependencies. Assertions focus on structural
elements (toolbar present, sidenav present) rather than data content.

| Component | Story scenarios |
|---|---|
| `ontology-editor-header` | Ontology loaded, Admin view |
| `ontology-page` | Layout renders with sidenav and content area |
| `data-models-page` | Ontologies listed, Empty project |

### Feature 5: Shared Mock Factories

A `ontology-stories.helper.ts` file at the lib root providing:

- `makePropertyInfo(overrides?)` → `PropertyInfo` fixture
- `makeClassPropertyInfo(overrides?)` → `ClassPropertyInfo` fixture
- `makeResourceClassInfo(overrides?)` → `ResourceClassInfo` fixture
- `makeOntologyEditServiceStub(overrides?)` → stub with BehaviorSubject-backed observables
- `makeProjectPageServiceStub(overrides?)` → stub with hasProjectAdminRights$, currentProject$
- `makeOntologyPageServiceStub()` → stub with expandClasses$

## User Stories

### US-1: Isolated component development

**As a** developer modifying ontology editor components
**I want** a Storybook story for the component I'm changing
**So that** I can verify visual and behavioural correctness in isolation without running the full app

**Acceptance Criteria:**
- [ ] Each component has at least one story that renders without console errors
- [ ] Each story has a `play()` assertion on at least one user-visible element
- [ ] Stories render in `nx run dsp-app:storybook`

### US-2: Acceptance criteria as code

**As a** maintainer reviewing a PR touching the ontology editor
**I want** storybook interaction tests to run in CI
**So that** I can catch regressions automatically

**Acceptance Criteria:**
- [ ] All stories pass `nx run dsp-app:test-storybook`
- [ ] No story relies on `setTimeout` or un-awaited async side-effects in `play()`

### US-3: New contributor orientation

**As a** new contributor exploring the ontology editor code
**I want** story titles that match the feature area hierarchy
**So that** I can navigate from the Storybook tree to the source file intuitively

**Acceptance Criteria:**
- [ ] All story `title:` fields follow `Ontology / <Section> / <ComponentName>` format
- [ ] Story export names describe user-visible outcomes (e.g. `ShowsClassWithThreeProperties`)

## Constraints

- **Technical:** Stories must be self-contained — no story may depend on a running API or real NgRx store.
- **Technical:** Dialog stories open the dialog component directly using `applicationConfig` + `MatDialog`; do not use `RouterOutlet` for dialog hosting.
- **Technical:** The global `.storybook/main.ts` picks up all `libs/**/*.stories.ts` — no project.json changes needed.
- **Convention:** Every `@Input()` and `@Output()` must have an `argTypes` entry with a `description` string (CLAUDE.md).
- **Convention:** Every story must have at least one `play()` function (CLAUDE.md).
- **Out of scope:** Adding a dedicated storybook NX target to `project.json` (handled by global config).

## Success Criteria

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Components with stories | 0 / 22 | 22 / 22 | `find src/lib -name "*.stories.ts" \| wc -l` |
| Stories with `play()` | 0 | ≥ 1 per component | Storybook index |
| `nx run dsp-app:test-storybook` | N/A | Passes | CI |
| Console errors in stories | N/A | 0 | Storybook browser console |

## Out of Scope

- Adding a dedicated NX `storybook` target to `vre-pages-ontology-ontology/project.json`.
- Writing stories for components outside this library (e.g. `shared/`, `core/`).
- Rewriting component logic or template structure.
- Internationalisation of story fixture strings (English only).

## Open Questions

All resolved:

- [x] Storybook target: uses global `.storybook/main.ts` — no per-lib config needed.
- [x] Dialog stories: wrap in launcher component (same pattern as resource-editor dialogs).
- [x] Scope: all 22 components.

## Next Steps

- [ ] Approve this PRD
- [ ] Create implementation plan mapping each component to its story file and mock strategy
- [ ] Implement stories in batches: presentational → cards/containers → dialogs → pages
- [ ] Verify each batch with `nx run dsp-app:storybook` before committing
- [ ] Run `nx run dsp-app:test-storybook` on full set

---

## Appendix

### Story Title Hierarchy

```
Ontology / Data Models / Data Models Page
Ontology / Editor / Header
Ontology / Editor / Sidenav
Ontology / Editor / Page
Ontology / Resource Classes / Editor Page
Ontology / Resource Classes / Resource Class Info
Ontology / Resource Classes / Add Property Menu
Ontology / Resource Classes / Property Item
Ontology / Resource Classes / Cardinality
Ontology / Properties / Properties List
Ontology / Properties / Property Info
Ontology / Forms / Ontology Form
Ontology / Forms / Create Ontology Dialog
Ontology / Forms / Edit Ontology Dialog
Ontology / Forms / Resource Class Form
Ontology / Forms / Create Resource Class Dialog
Ontology / Forms / Edit Resource Class Dialog
Ontology / Forms / Property Form
Ontology / Forms / Edit Property Dialog
Ontology / Forms / GUI Attr Link
Ontology / Forms / GUI Attr List
Ontology / Forms / Cardinality Change Dialog
```

### Provider Mock Strategy

**Minimal viable mock for most components:**

```typescript
// ontology-stories.helper.ts
export const makeOntologyEditServiceStub = (overrides = {}) => ({
  currentOntologyInfo$: of(makeOntologyInfo()),
  currentOntologyClasses$: of([]),
  currentOntologyProperties$: of([]),
  currentProjectsProperties$: of([]),
  isTransacting$: of(false),
  canDeleteResourceProperty$: () => of({ canDo: true }),
  ...overrides,
});

export const makeProjectPageServiceStub = (overrides = {}) => ({
  currentProject$: of(makeProject()),
  hasProjectAdminRights$: of(true),
  ontologies$: of([]),
  ontologiesMetadata$: of([]),
  ...overrides,
});
```

### Technical Notes

- `OntologyEditService` and `OntologyPageService` are `Injectable()` with no `providedIn`
  — they must be provided explicitly in each story's `applicationConfig`.
- `DspApiConnectionToken` is an injection token; stories that need it should provide
  `{ provide: DspApiConnectionToken, useValue: makeDspApiStub() }`.
- `LocalizationService` is used in `gui-attr-link` and `property-form` for language selection;
  mock with `{ currentLanguage$: of('en'), getCurrentLanguage: () => 'en' }`.

---

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-05-07 | Julien Schneider | Initial draft |
