---
title: "Resource Editor — Full Storybook Coverage"
date: 2026-04-17
author: "Julien Schneider"
status: draft
---

# Resource Editor — Full Storybook Coverage

## Context

The resource editor library (`libs/vre/resource-editor/resource-editor/`) contains 98 components,
of which only 12 (~12%) currently have Storybook stories. The global Storybook instance is already
configured to auto-discover all `*.stories.ts` files across the monorepo — no registration is
needed when adding new story files. The goal is to close this gap systematically so developers,
designers, and product owners can validate UI behaviour for every component without running the
full application.

The first story in this effort (`video-toolbar.component.stories.ts`) has already been written
as a reference implementation.

## Goals

- Every component in `libs/vre/resource-editor/resource-editor/` has at least one Storybook story
- Every story has at least one `play()` assertion on a user-visible outcome
- Stories follow the established pattern: `applicationConfig()` + stub services + `data-cy` selectors
- Story titles follow the convention: `Devs / Resource Editor / {Area} / {Component Name}`
- No production code is modified — stories only (except adding `data-cy` selectors where missing)

## Core Features

Components are grouped into 8 areas and should be delivered in this order (simplest/most isolated first):

### Area 1 — Representations / Toolbars (9 components)
| Component | Status |
|---|---|
| `video-toolbar.component.ts` | ✅ Done |
| `audio-toolbar.component.ts` | ⬜ |
| `still-image-toolbar.component.ts` | ⬜ |
| `vector-image-toolbar.component.ts` | ⬜ |
| `pdf-toolbar.component.ts` | ⬜ |
| `video-overlay.component.ts` | ⬜ |
| `iiif-control.component.ts` | ⬜ |
| `representation-error-message.component.ts` | ⬜ |
| `add-region-form-dialog.component.ts` | ⬜ |

### Area 2 — Template Switcher / Viewers (11 components)
`color-viewer`, `date-viewer`, `geoname-viewer`, `interval-viewer`, `link-viewer`, `list-viewer`,
`paragraph-viewer`, `rich-text-viewer`, `text-html-viewer`, `time-viewer`, `uri-viewer`

### Area 3 — Template Switcher / Editors (7 components)
`boolean-value`, `color-value`, `geoname-value`, `interval-value`, `link-value`, `list-value`,
`time-value`, `nullable-editor`

### Area 4 — Template Switcher / Orchestrators (3 components)
`template-editor-switcher`, `template-viewer-switcher`, `nested-menu`

### Area 5 — Resource Properties (14 components)
`property-row`, `property-value`, `property-value-display`, `property-value-edit`,
`property-value-update`, `property-value-add`, `property-value-action-bubble`,
`property-value-basic-comment`, `property-value-display-comment`, `property-values`,
`property-values-with-footnotes`, `footnote-tooltip`, `footnotes`, `delete-value-dialog`

### Area 6 — Resource Header / Info / Actions (11 components)
`resource-header`, `resource-toolbar`, `resource-info-bar`, `resource-actions`, `resource-legal`,
`resource-legal-license`, `resource-version-warning`, `resource-restriction`,
`resource-explorer-button`, `alert-info`, `annotation-tab`

### Area 7 — More Menu & Dialogs (10 components)
`resource-more-menu`, `delete-button`, `erase-button`, `edit-label-menu-item`,
`delete-menu-items`, `loading-menu-item`, `delete-resource-dialog`, `erase-resource-dialog`,
`edit-resource-label-dialog`, `closing-dialog`

### Area 8 — Compound, Creator, Segments, Page-level (24 components)
`compound-viewer`, `compound-navigation`, `compound-slider`, `compound-arrow-navigation`,
`incoming-resource-header`, `incoming-resource-toolbar`, `incoming-resource-more-menu`,
`create-resource-form`, `create-resource-form-row`, `create-resource-form-properties`,
`create-resource-form-legal`, `create-resource-form-file`, `create-resource-form-image`,
`create-resource-form-representation`, `property-value-creator`, `property-values-creator`,
`authorship-form-field`, `upload`, `upload-control`, `uploaded-file`, `create-resource-dialog`,
`segment`, `segment-tooltip`, `single-resource-page`, `resource-fetcher-dialog`,
`resource-representation-container`

## Constraints

- Stories must **not** modify any production component file (`.component.ts`, `.html`, `.scss`)
  — exception: adding `data-cy` attributes to templates where selectors are missing
- Mock services must be minimal stubs — no full re-implementations
- No new external `npm` dependencies may be added for stories
- `data-cy` selectors are preferred; fall back to ARIA role or element selectors where absent
- Each story file lives alongside its component (e.g. `foo.component.stories.ts`)

## Out of Scope

- Page-level integration tests (those belong in Cypress E2E)
- Visual regression snapshots (Chromatic / Lost Pixel — separate initiative)
- Writing stories for components **outside** `resource-editor/resource-editor/`
- Modifying or extending existing stories
- Achieving 100% branch/line coverage via stories (that is a unit-test concern)

## Next Steps

- [ ] Area 1: Write stories for the 8 remaining toolbar/representations components
- [ ] Area 2: Write stories for 11 viewer components
- [ ] Area 3: Write stories for 7 editor/value components
- [ ] Area 4: Write stories for 3 orchestrator components
- [ ] Area 5: Write stories for 14 resource-property components
- [ ] Area 6: Write stories for 11 header/info/actions components
- [ ] Area 7: Write stories for 10 more-menu/dialog components
- [ ] Area 8: Write stories for compound, creator, segment, and page-level components
- [ ] Run `nx run dsp-app:test-storybook` in CI to validate all `play()` assertions pass
