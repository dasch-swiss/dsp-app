---
title: "Resource Editor Folder Structure Alignment"
date: 2026-05-07
author: "Julien Schneider"
status: draft
---

# Resource Editor Folder Structure Alignment PRD

## Context

The `libs/vre/resource-editor/` NX library contains ~391 files. Its current folder structure
reflects historical code organisation: a flat root level with ~35 loose `resource-*.component.ts`
files, supplemented by a set of subfolders (`compound/`, `properties-display/`,
`representations/`, `resource-properties/`, `template-switcher/`, etc.) that were created
organically over time.

The library's Storybook stories have been maintained separately and carry a more intentional,
UX-driven hierarchy that mirrors the visual structure of the resource editor itself:

```
Resource Editor / [section] / [sub-area] / [component]
```

The sections are: Meta Information, Header (including More Menu), Representation (including
Segments, Legal, File), Properties (including Property Value, Footnotes, Template Switcher).

There is also a distinct `Resource Creator` story tree covering the resource creation form.

The mismatch between the folder layout and the story structure creates friction when navigating
the codebase: contributors must mentally translate between two different taxonomies. Aligning
the folders to the story structure (without the numeric prefixes) would make both trees
consistent.

The current branch `julien/resource-editor-folder-refactor` was already started with this
intent.

## Goals

- Align the `libs/vre/resource-editor/src/lib/` folder structure to the Storybook story
  hierarchy (without numeric prefixes).
- Eliminate the ~35 loose files at the `src/lib/` root by placing every component in a
  meaningful subfolder.
- Keep folder names clean: no `1.`, `2.` prefixes; use lowercase kebab-case directory names.
- All existing imports, barrel exports (`index.ts`), and story `title:` fields remain correct
  after the move.
- No functional behaviour changes — this is a pure structural refactor.

## Core Features

### Feature 1: New Folder Hierarchy

Introduce the following top-level subdirectories under `src/lib/`, reflecting the story
sections (numbers stripped):

| New folder | Maps to story section | Contains (examples) |
|---|---|---|
| `meta/` | Meta Information | `resource-restriction`, `resource-version-warning` |
| `header/` | Header | `resource-toolbar`, `resource-header`, `alert-info`, `closing-dialog`, `permission-info/`, `resource-actions`, `incoming-resource-header/toolbar` |
| `header/more-menu/` | Header / More Menu | `resource-edit-more-menu/` contents + dialogs currently in `resource-properties/` and `properties-display/` that belong to the more-menu flow (`delete-resource-dialog`, `edit-resource-label-dialog`, `erase-resource-dialog`) |
| `representation/` | Representation | `resource-representation-container`, `file-representation.*`, `replace-file-dialog/`, `representation-error-message`, `resource-legal`, `resource-legal-license` |
| `representation/segments/` | Representation / Segments | `segment-support/` contents |
| `properties/` | Properties | `resource-default-tabs`, `resource-media-tabs`, `segment-tab`, `resource-explorer-button`, `incoming-resource-header` |
| `properties/properties-display/` | Properties / Properties Display | `properties-display/` contents (minus dialogs moved to more-menu) |
| `properties/properties-display/property-value/` | … / Property Value | `resource-properties/` contents (minus dialogs moved to more-menu) |
| `properties/properties-display/footnotes/` | … / Footnotes | `resource-properties/footnotes/` contents |
| `properties/properties-display/template-switcher/` | … / Template Switcher | `template-switcher/` contents (value-components + viewer-components sub-dirs preserved) |
| `resource/` | Resource | `resource-*.component.ts` top-level files grouped by media type |
| `resource/audio/` | Resource / Audio | `resource-audio`, `resource-audio-segment` + existing `representations/audio/` |
| `resource/archive/` | Resource / Archive | `resource-archive` + existing `representations/archive/` |
| `resource/compound/` | Resource / Compound | `resource-compound`, `resource-compound-tabs` + existing `compound/` |
| `resource/document/` | Resource / Document | `resource-document` + existing `representations/document/` |
| `resource/still-image/` | Resource / Still Image | `resource-image` + existing `representations/still-image/` |
| `resource/text/` | Resource / Text | `resource-text` + existing `representations/text/` |
| `resource/vector-image/` | Resource / Vector Image | existing `representations/vector-image/` |
| `resource/video/` | Resource / Video | `resource-video`, `resource-video-segment` + existing `representations/video/` |
| `resource/plain/` | Resource / Plain | `resource-plain` |
| `resource-creator/` | Resource Creator | keep as-is (already well organised) |
| `resource-fetcher/` | (root) | `resource-fetcher`, `resource-fetcher-dialog`, `resource-dispatcher` |

Files without a story (`representations/upload/`, `representations/third-party-iiif/`,
`representations/replace-file-dialog/`, services, utils, interfaces) follow the nearest
matching folder based on domain.

### Feature 2: Import Path Updates

Every TypeScript import that references a moved file must be updated. This covers:
- Relative imports within the library
- Any barrel `index.ts` re-exports
- The `src/index.ts` public API exports

Story `title:` fields are **not** changed (they already match the target structure).

### Feature 3: Barrel Export Consolidation

Each new folder should have its own `index.ts` (or barrel file) if it contains public-facing
symbols, consistent with the existing pattern in the library.

## User Stories

### US-1: Navigate by UI section

**As a** developer working on the resource editor
**I want** the source folder I open to match the section of the UI I'm looking at
**So that** I can find the right file without cross-referencing the story tree

**Acceptance Criteria:**
- [ ] Opening `header/` lists all components visible in the resource editor header area
- [ ] Opening `representation/` lists all representation-related components
- [ ] Opening `properties/` lists all property-tab components

### US-2: Onboard a new contributor

**As a** new contributor to the DSP frontend
**I want** the folder names in `resource-editor` to be self-descriptive
**So that** I can understand the library layout without reading the Storybook tree separately

**Acceptance Criteria:**
- [ ] No component files remain at the `src/lib/` root level (except helpers/utils)
- [ ] Folder names are lowercase kebab-case with no numeric prefixes
- [ ] Storybook still compiles and all stories render correctly

### US-3: Zero regression

**As a** maintainer
**I want** all tests, builds, and lints to pass after the refactor
**So that** the structural change introduces no functional regressions

**Acceptance Criteria:**
- [ ] `nx run dsp-app:build` passes
- [ ] `nx run-many --all --target=test` passes
- [ ] `nx run-many --all --target=lint` passes
- [ ] Storybook interaction tests pass

## Constraints

- **Technical:** Pure file-move + import-update refactor; no logic changes.
- **Technical:** TypeScript path aliases in `tsconfig.base.json` must remain valid.
- **Technical:** The public `src/index.ts` API surface must not change (same exports, different source paths).
- **Dependencies:** No changes to DSP-API integration, no component behaviour changes.
- **Out-of-story files:** Services, utils, interfaces, and directives without stories should be co-located with the components that own them, not forced into an artificial category.

## Success Criteria

| Metric | Current | Target | Measurement Method |
|--------|---------|--------|-------------------|
| Files at `src/lib/` root | ~35 component files | 0 component files | `find src/lib -maxdepth 1 -name '*.component.ts'` |
| Folders matching story sections | 0 | 8 top-level story sections covered | Manual audit |
| Build passing | ✅ | ✅ | `nx run dsp-app:build` |
| Tests passing | ✅ | ✅ | `nx run-many --all --target=test` |
| Lint passing | ✅ | ✅ | `nx run-many --all --target=lint` |

## Out of Scope

- Renaming or restructuring Storybook `title:` fields (they already match the target).
- Renaming component classes, selectors, or public APIs.
- Splitting or merging NX libraries.
- Moving `resource-creator/` (already well-structured).
- Changing the `template-switcher/value-components/` and `template-switcher/viewer-components/` split (folder split is valid even if stories flatten them).
- Numeric prefixes in folder names (intentionally omitted for clean filesystem paths).

## Open Questions

All resolved:

- [x] `resource-fetcher` and `resource-fetcher-dialog` stay at `src/lib/` root — they don't fit a section and are outliers.
- [x] `single-resource-page` stays at `src/lib/` root — moving it is out of scope.
- [x] `media-slider` moves to `representation/` root to match its story title (`Resource Editor / Representation / Media Slider`), not kept under audio.

## Next Steps

- [ ] Approve this PRD
- [ ] Create implementation plan mapping every file to its new path
- [ ] Execute moves in batches by story section, verifying build after each batch
- [ ] Update all import paths
- [ ] Run full test suite and lint
- [ ] Open PR against `main`

---

## Appendix

### Story → Folder Mapping Reference

Full mapping derived from the 138 `.stories.ts` files analysed on 2026-05-07:

| Story path prefix | Target folder |
|---|---|
| Resource Editor / Meta information | `meta/` |
| Resource Editor / Header | `header/` |
| Resource Editor / Header / More Menu | `header/more-menu/` |
| Resource Editor / Representation | `representation/` |
| Resource Editor / Representation / Legal | `representation/` (no sub-folder needed) |
| Resource Editor / Representation / Segments | `representation/segments/` |
| Resource Editor / Representation / File Representation | `representation/` |
| Resource Editor / Properties | `properties/` |
| Resource Editor / Properties / … / Properties Display | `properties/properties-display/` |
| Resource Editor / Properties / … / Property Value | `properties/properties-display/property-value/` |
| Resource Editor / Properties / … / Footnotes | `properties/properties-display/footnotes/` |
| Resource Editor / Properties / … / Template Switcher | `properties/properties-display/template-switcher/` |
| Resource Editor / Resource / Audio | `resource/audio/` |
| Resource Editor / Resource / Archive | `resource/archive/` |
| Resource Editor / Resource / Compound | `resource/compound/` |
| Resource Editor / Resource / Document | `resource/document/` |
| Resource Editor / Resource / Still Image | `resource/still-image/` |
| Resource Editor / Resource / Text | `resource/text/` |
| Resource Editor / Resource / Vector Image | `resource/vector-image/` |
| Resource Editor / Resource / Video | `resource/video/` |
| Resource Editor / Resource / Plain | `resource/plain/` |
| Resource Creator / … | `resource-creator/` (unchanged) |
| Pages / Single Resource Page | TBD — see open questions |

### Technical Notes

- The NX library uses `@dasch-swiss/vre/resource-editor` path alias; only the internal
  relative imports need updating (the alias points to `src/index.ts` which stays in place).
- Component filenames should not be changed — only their directory location.
- `ng-mocks` and Jest module maps should not require changes as they reference component
  classes, not file paths.

---

## Revision History

| Date | Author | Changes |
|------|--------|---------|
| 2026-05-07 | Julien Schneider | Initial draft |
