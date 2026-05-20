# refactor: Resource Editor Folder Structure Alignment

**Date:** 2026-05-07  
**Author:** Julien Schneider  
**Type:** Refactor  
**Branch:** `julien/resource-editor-folder-refactor`  
**PRD:** `docs/prds/2026-05-07-resource-editor-folder-structure.md`

---

## Problem Statement

`libs/vre/resource-editor/src/lib/` has ~35 component files dumped at its root and subfolders
that don't reflect the visual/UX structure of the resource editor. The Storybook story
hierarchy is intentional and domain-driven — the folders should match it (minus numeric
ordering prefixes).

## Acceptance Criteria

- [ ] Zero `*.component.ts` files remain at `src/lib/` root (except the explicit root-keepers listed below)
- [ ] All new folders are lowercase kebab-case; no numeric prefixes
- [ ] `src/index.ts` exports the same 5 symbols with updated paths
- [ ] `nx run dsp-app:build` passes
- [ ] `nx run-many --all --target=test` passes
- [ ] `nx run-many --all --target=lint` passes
- [ ] `tsc --noEmit` on `tsconfig.lib.json` passes
- [ ] `tsc --noEmit` on `tsconfig.spec.json` passes
- [ ] No `*.ts` file in `src/lib/` contains import path segments for old folder names (`representations/`, `segment-support/`, `resource-edit-more-menu/`, `template-switcher/`, `resource-properties/`, `properties-display/`, `compound/`, `permission-info/`)
- [ ] Story `title:` strings are **not** modified (out of scope)

## Explicit Root-Keepers (Do Not Move)

These files intentionally stay at `src/lib/` root:

- `resource-fetcher.component.ts` + `.stories.ts`
- `resource-fetcher-dialog.component.ts` + `.stories.ts`
- `resource-dispatcher.component.ts` + `.spec.ts`
- `single-resource-page.component.ts` + `.stories.ts`
- `resource-type.ts`
- `get-resource-type.ts`
- `stories.helpers.ts`
- `resource-stories.helper.ts`
- `licenses-logo-mapping.ts`
- `resource-image-tabs.component.ts` (no story; tightly coupled to root orchestration)

---

## Target Folder Structure

```
src/lib/
├── meta/
│   ├── resource-restriction.component.ts/.stories.ts
│   └── resource-version-warning.component.ts/.stories.ts
│
├── header/
│   ├── permission-info/                         ← from lib/permission-info/
│   │   ├── permission-info.component.ts/.html/.scss/.stories.ts
│   │   └── resource-permission.ts
│   ├── more-menu/                               ← from lib/resource-edit-more-menu/ + dialogs
│   │   ├── resource-more-menu.component.ts/.stories.ts
│   │   ├── delete-button.component.ts/.stories.ts
│   │   ├── delete-menu-items.component.ts/.stories.ts
│   │   ├── edit-label-menu-item.component.ts/.stories.ts
│   │   ├── erase-button.component.ts/.stories.ts
│   │   ├── incoming-resource-more-menu.component.ts/.stories.ts
│   │   ├── loading-menu-item.component.ts/.stories.ts
│   │   ├── delete-resource-dialog.component.ts/.stories.ts  ← from properties-display/
│   │   ├── edit-resource-label-dialog.component.ts/.stories.ts  ← from resource-properties/
│   │   └── erase-resource-dialog.component.ts/.stories.ts   ← from resource-properties/
│   ├── alert-info.component.ts/.scss/.stories.ts
│   ├── closing-dialog.component.ts/.stories.ts               ← public export; index.ts updated
│   ├── incoming-resource-header.component.ts/.stories.ts
│   ├── incoming-resource-toolbar.component.ts/.stories.ts
│   ├── resource-actions.component.ts/.spec.ts/.stories.ts
│   ├── resource-header.component.ts/.stories.ts
│   ├── resource-info-bar.component.ts/.stories.ts
│   └── resource-toolbar.component.ts/.stories.ts
│
├── representation/
│   ├── segments/                                ← from lib/segment-support/
│   │   ├── segments.service.ts/.spec.ts
│   │   ├── segment.ts
│   │   ├── segment-api.service.ts
│   │   ├── media-control.service.ts
│   │   ├── segment-ordering.ts
│   │   ├── custom-tooltip.directive.ts
│   │   ├── segment.component.ts/.scss/.stories.ts
│   │   ├── segment-tooltip.component.ts/.stories.ts
│   │   ├── segments-display.component.ts/.stories.ts
│   │   └── create-segment-dialog.component.ts/.stories.ts
│   ├── media-slider.component.ts/.stories.ts    ← from representations/audio/
│   ├── file-representation.component.ts/.spec.ts/.stories.ts  ← from representations/ root
│   ├── download-menu-item.component.ts/.spec.ts/.stories.ts
│   ├── replace-file-menu-item.component.ts/.spec.ts/.stories.ts
│   ├── representation-error-message.component.ts/.spec.ts/.stories.ts
│   ├── replace-file-dialog/                     ← from representations/replace-file-dialog/
│   │   └── replace-file-dialog.component.ts/.scss/.stories.ts
│   ├── resource-legal.component.ts/.stories.ts
│   ├── resource-legal-license.component.ts/.stories.ts
│   ├── resource-representation-container.component.ts/.spec.ts/.stories.ts
│   ├── add-region-form-dialog.component.ts/.stories.ts  ← from representations/
│   └── (shared utils from representations/ root)
│       ├── representation.service.ts
│       ├── resource-fetcher.service.ts
│       ├── representation-constants.ts
│       ├── file-form.type.ts
│       ├── file-representation.type.ts
│       ├── representation-inputs.ts
│       ├── resource.util.ts
│       ├── moving-image-sidecar.ts
│       ├── region.ts
│       ├── get-file-value.ts
│       └── upload/                              ← from representations/upload/
│
├── properties/
│   ├── properties-display/                      ← from lib/properties-display/
│   │   ├── annotation-toolbar.component.ts/.spec.ts/.stories.ts
│   │   ├── incoming-links-property.component.ts/.stories.ts
│   │   ├── incoming-resource-pager.component.ts/.scss/.stories.ts
│   │   ├── incoming-standoff-link-value.component.ts/.stories.ts
│   │   ├── properties-display.component.ts/.stories.ts
│   │   ├── properties-toggle.component.ts/.stories.ts
│   │   ├── standoff-links-property.component.ts/.stories.ts
│   │   ├── incoming-link.interface.ts
│   │   ├── property-value/                      ← from lib/resource-properties/
│   │   │   ├── property-row.component.ts/.scss/.stories.ts
│   │   │   ├── property-value.component.ts/.stories.ts
│   │   │   ├── property-value-add.component.ts/.stories.ts
│   │   │   ├── property-value-edit.component.ts/.stories.ts
│   │   │   ├── property-value-update.component.ts/.stories.ts
│   │   │   ├── property-value-display.component.ts/.scss/.stories.ts
│   │   │   ├── property-value-display-comment.component.ts/.scss/.stories.ts
│   │   │   ├── property-value-basic-comment.component.ts/.stories.ts
│   │   │   ├── property-value-action-bubble.component.ts/.scss/.spec.ts/.stories.ts
│   │   │   ├── property-values.component.ts/.spec.ts/.stories.ts
│   │   │   ├── property-values-with-footnotes.component.ts/.stories.ts
│   │   │   ├── draggable-value-list.component.ts/.spec.ts/.stories.ts
│   │   │   ├── delete-value-dialog.component.ts/.stories.ts
│   │   │   ├── property-value.service.ts
│   │   │   ├── properties-display.service.ts
│   │   │   ├── populate-value-method.ts
│   │   │   ├── form-value-array.type.ts
│   │   │   ├── JsLibPotentialError.ts
│   │   │   ├── date-time.ts
│   │   │   ├── date-time-timestamp.ts
│   │   │   ├── resource-payloads-mapping.ts
│   │   │   ├── sortByKeys.ts
│   │   │   └── with-breaks.pipe.ts
│   │   ├── footnotes/                           ← from lib/resource-properties/footnotes/
│   │   │   ├── footnotes.component.ts/.stories.ts
│   │   │   ├── footnote-tooltip.component.ts/.stories.ts
│   │   │   ├── footnote-parser.pipe.ts/.spec.ts
│   │   │   ├── footnote.service.ts/.spec.ts
│   │   │   └── footnote.directive.ts
│   │   └── template-switcher/                   ← from lib/template-switcher/
│   │       ├── create-resource-dialog.component.ts/.spec.ts/.stories.ts  ← public export
│   │       ├── template-editor-switcher.component.ts/.stories.ts
│   │       ├── template-viewer-switcher.component.ts/.stories.ts
│   │       ├── nullable-editor.component.ts/.stories.ts
│   │       ├── geoname.service.ts
│   │       ├── mathjax/
│   │       ├── value-components/
│   │       └── viewer-components/
│   ├── resource-default-tabs.component.ts/.stories.ts
│   ├── resource-media-tabs.component.ts/.stories.ts
│   ├── segment-tab.component.ts/.spec.ts/.stories.ts
│   └── resource-explorer-button.component.ts/.stories.ts
│
├── resource/
│   ├── annotation/
│   │   ├── annotation-tab.component.ts/.spec.ts/.stories.ts
│   │   └── resource-annotation.component.ts/.stories.ts
│   ├── archive/                                 ← merge resource-archive.component + representations/archive/
│   │   ├── archive.component.ts/.stories.ts
│   │   └── resource-archive.component.ts/.stories.ts
│   ├── audio/                                   ← merge resource-audio* + representations/audio/ (minus media-slider)
│   │   ├── audio.component.ts/.html/.spec.ts/.stories.ts
│   │   ├── audio-toolbar.component.ts/.stories.ts
│   │   ├── audio-more-button.component.ts/.spec.ts/.stories.ts
│   │   ├── resource-audio.component.ts/.stories.ts
│   │   └── resource-audio-segment.component.ts/.stories.ts
│   ├── compound/                                ← merge resource-compound* + lib/compound/
│   │   ├── compound-arrow-navigation.component.ts/.stories.ts
│   │   ├── compound-navigation.component.ts/.stories.ts
│   │   ├── compound-slider.component.ts/.stories.ts
│   │   ├── compound-viewer.component.ts/.stories.ts
│   │   ├── compound.service.ts
│   │   ├── resource-compound.component.ts/.stories.ts
│   │   └── resource-compound-tabs.component.ts/.stories.ts
│   ├── document/                                ← merge resource-document + resource-pdf + representations/document/
│   │   ├── document.component.ts/.stories.ts
│   │   ├── pdf-document.component.ts/.spec.ts/.stories.ts
│   │   ├── pdf-toolbar.component.ts/.spec.ts/.stories.ts
│   │   ├── resource-document.component.ts/.stories.ts
│   │   └── resource-pdf.component.ts/.stories.ts
│   ├── plain/
│   │   └── resource-plain.component.ts/.stories.ts
│   ├── still-image/                             ← merge resource-image + representations/still-image/
│   │   ├── still-image.component.ts/.spec.ts/.scss/.stories.ts
│   │   ├── still-image-toolbar.component.ts/.html/.scss/.stories.ts
│   │   ├── still-image-helper.ts
│   │   ├── geometry-for-region.ts
│   │   ├── osd-drawer.service.ts
│   │   ├── open-sea-dragon.service.ts
│   │   ├── osd-viewer.config.ts
│   │   ├── polygons-for-region.interface.ts
│   │   └── resource-image.component.ts/.spec.ts/.stories.ts
│   ├── text/                                    ← merge resource-text + representations/text/
│   │   ├── text.component.ts/.stories.ts
│   │   └── resource-text.component.ts/.stories.ts
│   ├── vector-image/                            ← from representations/vector-image/
│   │   ├── vector-image.component.ts/.spec.ts/.scss/.stories.ts
│   │   ├── vector-image-toolbar.component.ts/.html/.spec.ts/.scss/.stories.ts
│   │   └── vector-viewer.service.ts/.spec.ts
│   └── video/                                   ← merge resource-video* + representations/video/
│       ├── video.component.ts/.html/.spec.ts/.stories.ts
│       ├── video-toolbar.component.ts/.stories.ts
│       ├── video-overlay.component.ts/.stories.ts
│       ├── video-more-button.component.ts/.spec.ts/.stories.ts
│       ├── media-player.service.ts
│       ├── disable-context-menu.directive.ts
│       ├── resource-video.component.ts/.stories.ts
│       └── resource-video-segment.component.ts/.stories.ts
│
├── resource-creator/                            ← unchanged
│
└── (root-keepers — not moved)
    ├── resource-fetcher.component.ts
    ├── resource-fetcher-dialog.component.ts
    ├── resource-dispatcher.component.ts
    ├── single-resource-page.component.ts
    ├── resource-type.ts
    ├── get-resource-type.ts
    ├── resource-image-tabs.component.ts
    ├── stories.helpers.ts
    ├── resource-stories.helper.ts
    └── licenses-logo-mapping.ts
```

---

## Updated `src/index.ts`

After the refactor, `src/index.ts` must read:

```typescript
export * from './lib/resource-fetcher.component';
export * from './lib/resource-fetcher-dialog.component';
export * from './lib/header/closing-dialog.component';
export * from './lib/single-resource-page.component';
export * from './lib/properties/properties-display/template-switcher/create-resource-dialog.component';
```

_(Same 5 symbols, two paths updated.)_

---

## Implementation Phases

Execute one phase at a time. After each phase: run `nx run dsp-app:build` and `nx run-many --all --target=test`. Fix any broken imports before moving to the next phase.

### Phase 1 — `meta/` (2 files, lowest risk)

Move:
- `resource-restriction.component.ts` → `meta/`
- `resource-version-warning.component.ts` → `meta/`

No consumers outside this lib use these files. Internal consumers import them from root — update those imports.

**Gate:** Build + tests green.

---

### Phase 2 — `header/` (12 files + sub-folder moves)

**Step 2a — `permission-info/` folder:**  
Move entire `lib/permission-info/` → `lib/header/permission-info/`.  
Update `resource-permission.ts` import in `permission-info.component.ts` (stays relative, no depth change).  
Update callers that imported from `permission-info/` (search: `from '.*permission-info'`).

**Step 2b — `more-menu/` from `resource-edit-more-menu/`:**  
Move entire `lib/resource-edit-more-menu/` → `lib/header/more-menu/`.  
Move from `lib/properties-display/`: `delete-resource-dialog.component.ts` → `header/more-menu/`.  
Move from `lib/resource-properties/`: `edit-resource-label-dialog.component.ts`, `erase-resource-dialog.component.ts` → `header/more-menu/`.  
Update all callers of these moved dialogs (search: `delete-resource-dialog`, `edit-resource-label-dialog`, `erase-resource-dialog`).

**Step 2c — root-level header components:**  
Move to `header/`:
- `alert-info.component.ts` (+ `.scss`)
- `closing-dialog.component.ts` → update `src/index.ts` path
- `incoming-resource-header.component.ts`
- `incoming-resource-toolbar.component.ts`
- `resource-actions.component.ts`
- `resource-header.component.ts`
- `resource-info-bar.component.ts`
- `resource-toolbar.component.ts`

Update all internal callers.

**Gate:** Build + tests green.

---

### Phase 3 — `representation/` (shared utils + root-level components)

This is the highest-risk phase because `representations/` root files are imported by 6+ sub-domains from varying depths. **Rename the folder from `representations/` to `representation/` (singular) at the same time as the moves.**

**Step 3a — Move `segment-support/` → `representation/segments/`:**  
Update all callers (search: `segment-support`). Key depth changes:
- Files in `representations/audio/` had `'../../segment-support/...'` → becomes `'../segments/...'` (after audio moves to `resource/audio/`)
- But since audio hasn't moved yet (Phase 5), temporarily they need `'../../representation/segments/...'`

> **Approach:** Do segment-support move in this phase at new path. Audio/video files will be updated when they move in Phase 5.

**Step 3b — Move `media-slider.component.ts` from `representations/audio/` → `representation/`:**  
Update `video.component.ts` import (currently `'../audio/media-slider.component'`) to `'../../representation/media-slider.component'` (temporary; will shorten when video moves in Phase 5).

**Step 3c — Move shared root utilities from `representations/` to `representation/`:**  
Files to move (keep at new `representation/` root):
- `representation.service.ts`
- `resource-fetcher.service.ts`
- `representation-constants.ts`
- `file-form.type.ts`, `file-representation.type.ts`, `representation-inputs.ts`
- `resource.util.ts`, `moving-image-sidecar.ts`, `region.ts`, `get-file-value.ts`
- `upload/` sub-folder

**Step 3d — Move root-level representation components:**  
Move from `lib/`:
- `file-representation.component.ts` → `representation/`
- `download-menu-item.component.ts` → `representation/`
- `replace-file-menu-item.component.ts` → `representation/`
- `representation-error-message.component.ts` → `representation/`
- `resource-legal.component.ts` → `representation/`
- `resource-legal-license.component.ts` → `representation/`
- `resource-representation-container.component.ts` → `representation/`
- `add-region-form-dialog.component.ts` → `representation/`

Move `representations/replace-file-dialog/` → `representation/replace-file-dialog/`.

**Step 3e — Rename `representations/` to `representation/`:**  
At this point `representations/` still contains the sub-folders for audio, archive, document, still-image, text, vector-image, video. Rename the folder. Update all imports that referenced `representations/` directly (the sub-folders' internal relative imports don't reference their own parent name, so this mainly affects cross-domain imports like `'../representations/representation.service'`).

**Gate:** Build + tests green.

---

### Phase 4 — `properties/` (4 component moves + 3 big sub-folder moves)

**Step 4a — Top-level `properties/` components from root:**  
Move to `properties/`:
- `resource-default-tabs.component.ts`
- `resource-media-tabs.component.ts`
- `segment-tab.component.ts`
- `resource-explorer-button.component.ts`

**Step 4b — `properties-display/` folder:**  
Move `lib/properties-display/` (minus already-moved dialogs) → `lib/properties/properties-display/`.

**Step 4c — `resource-properties/` → `properties/properties-display/property-value/`:**  
Move `lib/resource-properties/` (minus already-moved dialogs) → `lib/properties/properties-display/property-value/`.  
Key: the `footnotes/` sub-folder moves with it to `properties/properties-display/footnotes/`.

**Step 4d — `template-switcher/` → `properties/properties-display/template-switcher/`:**  
Move entire `lib/template-switcher/` → `lib/properties/properties-display/template-switcher/`.  
Update `src/index.ts` path for `create-resource-dialog` (see updated index above).  
Internal sub-dirs `value-components/` and `viewer-components/` stay intact inside the new location.

**Gate:** Build + tests green.

---

### Phase 5 — `resource/` (merging root files + existing sub-folders)

Each sub-phase creates one `resource/<type>/` folder by merging the root-level `resource-<type>.component.ts` file with its `representation/<type>/` counterpart.

**Step 5a — `resource/annotation/`:**  
Move from root: `annotation-tab.component.ts`, `resource-annotation.component.ts` → `resource/annotation/`.

**Step 5b — `resource/compound/`:**  
Move `lib/compound/` → `lib/resource/compound/`.  
Move from root: `resource-compound.component.ts`, `resource-compound-tabs.component.ts` → `resource/compound/`.  
Key importer: `still-image.component.ts` imports `'../../compound/...'` → update to `'../compound/...'` (after still-image moves here too).

**Step 5c — `resource/archive/`:**  
Move `representation/archive/` → `resource/archive/`.  
Move from root: `resource-archive.component.ts` → `resource/archive/`.

**Step 5d — `resource/audio/`:**  
Move `representation/audio/` (minus `media-slider`, already moved) → `resource/audio/`.  
Move from root: `resource-audio.component.ts`, `resource-audio-segment.component.ts` → `resource/audio/`.  
Update segment-support import: `'../segments/...'` (was `'../../representation/segments/...'` temporarily).  
Update media-slider import if any remain: now `'../representation/media-slider.component'` → `'../../representation/media-slider.component'`.

**Step 5e — `resource/document/`:**  
Move `representation/document/` → `resource/document/`.  
Move from root: `resource-document.component.ts`, `resource-pdf.component.ts` → `resource/document/`.

**Step 5f — `resource/still-image/`:**  
Move `representation/still-image/` → `resource/still-image/`.  
Move from root: `resource-image.component.ts` → `resource/still-image/`.  
Update `resource-image-tabs.component.ts` (stays at root) import for `still-image.component`.

**Step 5g — `resource/text/`:**  
Move `representation/text/` → `resource/text/`.  
Move from root: `resource-text.component.ts` → `resource/text/`.

**Step 5h — `resource/vector-image/`:**  
Move `representation/vector-image/` → `resource/vector-image/`.

**Step 5i — `resource/video/`:**  
Move `representation/video/` → `resource/video/`.  
Move from root: `resource-video.component.ts`, `resource-video-segment.component.ts` → `resource/video/`.  
Update `media-slider` import: now `'../../representation/media-slider.component'`.

**Step 5j — `resource/plain/`:**  
Move from root: `resource-plain.component.ts` → `resource/plain/`.

**Gate:** Build + tests green.

---

### Phase 6 — Final Verification

1. Confirm no `*.component.ts` files at root (except root-keepers):
   ```bash
   find libs/vre/resource-editor/resource-editor/src/lib -maxdepth 1 -name '*.component.ts'
   ```
   Expected: only root-keepers.

2. Confirm no old folder name in any import:
   ```bash
   grep -r "from '.*representations/" libs/vre/resource-editor/resource-editor/src/lib
   grep -r "from '.*segment-support/" libs/vre/resource-editor/resource-editor/src/lib
   grep -r "from '.*resource-edit-more-menu/" libs/vre/resource-editor/resource-editor/src/lib
   grep -r "from '.*template-switcher/" libs/vre/resource-editor/resource-editor/src/lib
   grep -r "from '.*resource-properties/" libs/vre/resource-editor/resource-editor/src/lib
   grep -r "from '.*properties-display/" libs/vre/resource-editor/resource-editor/src/lib
   grep -r "from '.*\/compound/" libs/vre/resource-editor/resource-editor/src/lib
   grep -r "from '.*permission-info/" libs/vre/resource-editor/resource-editor/src/lib
   ```
   Expected: zero results.

3. TypeScript compile check:
   ```bash
   npx tsc --noEmit -p libs/vre/resource-editor/resource-editor/tsconfig.lib.json
   npx tsc --noEmit -p libs/vre/resource-editor/resource-editor/tsconfig.spec.json
   ```

4. Full suite:
   ```bash
   nx run dsp-app:build
   nx run-many --all --target=test
   nx run-many --all --target=lint
   ```

---

## Key Import Depth Changes Reference

The most cross-referenced files and how their import paths change for their top consumers:

### Shared `representation/` utilities (formerly `representations/` root)

| Importer (new location) | Old import | New import |
|---|---|---|
| `resource/audio/audio.component` | `../../representations/representation-inputs` | `../../representation/representation-inputs` |
| `resource/video/video.component` | `../../representations/representation-inputs` | `../../representation/representation-inputs` |
| `resource/still-image/still-image.component` | `../../representations/resource.util` | `../../representation/resource.util` |
| `properties/properties-display/property-value/property-value.service` | `../../representations/resource-fetcher.service` | `../../../representation/resource-fetcher.service` |
| `header/more-menu/delete-resource-dialog.component` | `../representations/resource-fetcher.service` | `../../representation/resource-fetcher.service` |

### `segment-support/` → `representation/segments/`

| Importer (new location) | Old import | New import |
|---|---|---|
| `resource/audio/audio.component` | `../../segment-support/media-control.service` | `../../representation/segments/media-control.service` |
| `resource/video/video.component` | `../../segment-support/media-control.service` | `../../representation/segments/media-control.service` |
| `properties/segment-tab.component` | `./segment-support/...` | `./properties-display/../../../representation/segments/...` → simplifies to `../representation/segments/...` |

### `media-slider` (moves from `representations/audio/` → `representation/`)

| Importer (new location) | Old import | New import |
|---|---|---|
| `resource/audio/audio.component` | `./media-slider.component` (co-located) | `../../representation/media-slider.component` |
| `resource/video/video.component` | `../audio/media-slider.component` | `../../representation/media-slider.component` |

### `compound/` → `resource/compound/`

| Importer (new location) | Old import | New import |
|---|---|---|
| `resource/still-image/still-image.component` | `../../compound/compound-arrow-navigation.component` | `../compound/compound-arrow-navigation.component` |
| `resource/vector-image/vector-image.component` | `../../compound/compound-arrow-navigation.component` | `../compound/compound-arrow-navigation.component` |

---

## Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Missed relative import in deep file | High | Build break (caught immediately) | Phase-by-phase build verification; grep scan in Phase 6 |
| `src/index.ts` path wrong after move | Medium | Public API breaks silently | Explicit target content provided above; verify with external consumer test |
| Story file import broken | Medium | Storybook fails (not caught by build) | Run `nx run vre-resource-editor-resource-editor:storybook` after Phase 5 |
| `tsc --noEmit` diverges from `nx build` | Low | False green in CI | Run both explicitly in Phase 6 |
| Spec file import missed | Medium | Test silently passes wrong path | `tsconfig.spec.json` noEmit check in Phase 6 |

---

## Dependencies

- No changes to external libraries or DSP-API
- No Angular version changes
- `resource-creator/` is untouched
- Story `title:` strings are not changed (out of scope)
- No new `index.ts` barrel files introduced (consistent with existing library pattern)

---

## Success Metrics

| Metric | Target |
|---|---|
| Component files at `src/lib/` root | Only the 10 explicit root-keepers |
| New top-level folders | `meta/`, `header/`, `representation/`, `properties/`, `resource/` |
| Build status | Green |
| Test status | Green |
| Lint status | Green |
| tsc --noEmit lib | Green |
| tsc --noEmit spec | Green |
| Old folder names in imports | 0 occurrences |

---

## Out of Scope

- Story `title:` string changes (no numeric prefix removal)
- Renaming component classes or selectors
- Splitting or merging NX libraries
- Changes to `resource-creator/`
- New barrel `index.ts` files inside subfolders
- Any functional/behaviour changes

---

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-05-07 | Julien Schneider | Initial plan |
