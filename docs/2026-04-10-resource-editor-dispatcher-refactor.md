# PRD: Resource Editor — Dispatcher Refactor

**Date:** 2026-04-10  
**Author:** Julien Schneider  
**Scope:** Significant initiative  
**Status:** Approved for planning

---

## Context

The resource editor currently loads all resources through a single `ResourceComponent` that acts as a universal orchestrator. After fetching a resource, it initializes conditionally — checking for file values, compound navigation, annotations, segments — spreading type-specific logic across `ngOnChanges`, template `@switch` blocks, and multiple services.

This makes the component hard to reason about, test, and extend, because every resource type's concerns are interleaved. The goal is to resolve the resource type **first**, then mount the appropriate self-contained component — eliminating scattered conditionals and giving each resource type a clean, focused boundary.

---

## Goals

1. Resolve resource type immediately after fetch, before any rendering
2. Introduce a `ResourceDispatcherComponent` that receives a loaded resource and mounts the correct typed component
3. Each typed component is fully self-contained: owns its representation, header, legal, actions, and type-specific tabs
4. Eliminate scattered `@if`/`@switch` type-checks from the current `ResourceComponent`

---

## Core Components

### `ResourceDispatcherComponent`
Sits between `ResourceFetcherComponent` and content. Receives a `ReadResource`, determines its type using the existing `getFileValue()` logic, and renders exactly one typed component via `@switch`.

### Typed Resource Components (each fully self-contained)

| Component | Resource Type | Owns |
|---|---|---|
| `ResourceImageComponent` | Still image | Image representation + annotations |
| `ResourceVideoComponent` | Moving image | Video player + segments |
| `ResourceAudioComponent` | Audio | Audio player + segments |
| `ResourceCompoundComponent` | Compound | Compound viewer + navigation |
| `ResourceDocumentComponent` | Document / archive / text | File representation |
| `ResourceAnnotationComponent` | Annotation | Image representation + annotation tab |
| `ResourceSegmentComponent` | Segment | Media player + segment tab |
| `ResourcePlainComponent` | No file representation | Properties only |

Each typed component owns: **header, legal, actions, representation area, and its specific tabs.**

---

## User Stories & Acceptance Criteria

**US1 — Type dispatch**  
As a developer, when a `resourceIri` is loaded, the system determines the resource type and mounts exactly one typed component, so no conditional logic lives outside the dispatcher.

*AC:* `ResourceDispatcherComponent` receives a `ReadResource` and renders exactly one typed component based on type detection. No `@if`/`@switch` on resource type exists outside this component.

---

**US2 — Self-contained typed components**  
As a developer, each typed component is independently understandable and testable, owning all UI concerns for its resource type.

*AC:* Each typed component renders header, legal, actions, its representation, and its type-specific tabs without relying on a parent shell component.

---

**US3 — Annotation resource**  
As a user, viewing an annotation resource shows the annotation-specific UI without loading irrelevant panels.

*AC:* `ResourceAnnotationComponent` is mounted for annotation resources, showing annotation tab and image representation.

---

**US4 — Segment resource**  
As a user, viewing a segment resource shows segment-specific UI.

*AC:* `ResourceSegmentComponent` is mounted, showing segment tab alongside the relevant media player.

---

## Constraints

- `ResourceFetcherComponent` and `ResourceFetcherService` are unchanged — fetch logic stays as-is
- Type detection reuses existing `getFileValue()` function — no new detection logic introduced
- Existing child components (`StillImageComponent`, `VideoComponent`, `AudioComponent`, etc.) are reused inside typed components — not rewritten
- Existing services (`RegionService`, `SegmentsService`, `CompoundService`) are moved into the scope of the typed component that owns them
- No routing changes — `ResourceDispatcherComponent` works as a structural component, not a router outlet

---

## Out of Scope

- Rewriting representation components (StillImage, Video, Audio, etc.)
- Changing the fetch/API layer
- Changing how properties are displayed (`PropertiesDisplayService`, `properties-display.component.ts`)
- Adding new resource types not already supported
- E2E test coverage (unit tests only, scoped to dispatcher and typed components)

---

## Success Criteria

- `ResourceComponent` is deleted or reduced to a thin wrapper with no type-specific logic
- `ResourceDispatcherComponent` is the single place where resource type determines which component is mounted
- Each typed component can be opened and understood without reading sibling components
- Unit tests cover the dispatcher's type-routing logic
- No regression in existing behavior for any resource type

---

## Open Questions

- Should `ResourceAnnotationComponent` and `ResourceSegmentComponent` extend their parent type component (image/media) or compose it?
- Are there edge cases where a resource matches multiple type criteria (e.g. a still image that is also an annotation)?
