# refactor: Resource Editor — Dispatcher Architecture

**Date:** 2026-04-10
**Type:** Refactor
**PRD:** `docs/2026-04-10-resource-editor-dispatcher-refactor.md`
**Status:** Ready for implementation

---

## Motivation

`ResourceComponent` is a monolithic orchestrator that handles every resource type through scattered conditionals in `ngOnChanges`, its template, and multiple co-provided services. This makes it hard to reason about, test, and extend. The refactor introduces a `ResourceDispatcherComponent` that resolves resource type immediately after fetch and mounts exactly one self-contained typed component — eliminating cross-type concerns from a single class.

---

## Technical Context

### Current component chain

```
ResourceFetcherComponent           [provides: ResourceFetcherService]
  └── ResourceComponent            [provides: CompoundService, PropertiesDisplayService, RegionService, SegmentsService]
        ├── ResourceRestrictionComponent
        ├── ResourceHeaderComponent         (injects ResourceFetcherService directly)
        ├── ResourceLegalComponent          (injects ResourceFetcherService directly)
        ├── ResourceRepresentationComponent (@switch on file type)
        │     └── StillImage | VectorImage | Audio | Video | Document | PdfDocument | Archive | Text
        ├── CompoundViewerComponent         (injects CompoundService)
        └── ResourceTabsComponent           (injects RegionService, CompoundService, SegmentsService)
```

### Key constraints from codebase research

- `ResourceComponent` is **not exported** — zero external API risk from deleting it
- All 4 services are provided on `ResourceComponent.providers[]` — they must move to typed component providers
- `CompoundService` has a hard dependency on `RegionService` (same injector) — they must be co-provided
- `SegmentsService.onInit()` is called by leaf `AudioComponent`/`VideoComponent` — they inject it from ancestor chain
- `ChangeDetectorRef` injected into `CompoundService` and `SegmentsService` binds to the providing component's CDR
- `ResourceFetcherService` is scoped to `ResourceFetcherComponent` — all descendants can inject it freely
- `annotationIri` is derived from `ActivatedRoute` — this logic moves to `ResourceFetcherComponent`
- External consumers only use `ResourceFetcherComponent` — the chain above it is unchanged

---

## Target Architecture

```
ResourceFetcherComponent           [provides: ResourceFetcherService]
  └── ResourceDispatcherComponent  [@switch on ResourceType enum]
        ├── ResourceImageComponent          [provides: RegionService, PropertiesDisplayService]
        ├── ResourceVideoComponent          [provides: SegmentsService, PropertiesDisplayService]
        ├── ResourceAudioComponent          [provides: SegmentsService, PropertiesDisplayService]
        ├── ResourceCompoundComponent       [provides: CompoundService, RegionService, PropertiesDisplayService]
        ├── ResourceDocumentComponent       [provides: PropertiesDisplayService]  (non-PDF)
        ├── ResourcePdfComponent            [provides: PropertiesDisplayService]
        ├── ResourceArchiveComponent        [provides: PropertiesDisplayService]
        ├── ResourceTextComponent           [provides: PropertiesDisplayService]
        ├── ResourceAnnotationComponent     [provides: PropertiesDisplayService]
        ├── ResourceSegmentComponent        [provides: PropertiesDisplayService]
        └── ResourcePlainComponent          [provides: PropertiesDisplayService]
```

Each typed component is **fully self-contained**: header, legal, restriction banner, representation, and its own tab component.

---

## Implementation Approach

### Step 1 — Introduce `ResourceType` discriminant and move `annotationIri` to fetcher

**New file:** `libs/vre/resource-editor/resource-editor/src/lib/resource-type.ts`

```typescript
export enum ResourceType {
  Image = 'image',
  Video = 'video',
  Audio = 'audio',
  Document = 'document',
  Pdf = 'pdf',
  Archive = 'archive',
  Text = 'text',
  Compound = 'compound',   // resolved async
  Annotation = 'annotation',
  Segment = 'segment',
  Plain = 'plain',
}
```

**New file:** `libs/vre/resource-editor/resource-editor/src/lib/get-resource-type.ts`

```typescript
export function getResourceType(resource: ReadResource): ResourceType | null {
  // null = compound check still needed (async)
  const fileValue = getFileValue(resource);
  if (fileValue) {
    if (resource.properties[Constants.HasStillImageFileValue]) return ResourceType.Image;
    if (resource.properties[Constants.HasMovingImageFileValue]) return ResourceType.Video;
    if (resource.properties[Constants.HasAudioFileValue]) return ResourceType.Audio;
    // document branch: pdf vs non-pdf determined by fileValue.filename extension
    if (resource.properties[Constants.HasDocumentFileValue]) {
      return fileValue.filename?.endsWith('.pdf') ? ResourceType.Pdf : ResourceType.Document;
    }
    if (resource.properties[Constants.HasArchiveFileValue]) return ResourceType.Archive;
    if (resource.properties[Constants.HasTextFileValue]) return ResourceType.Text;
  }
  // no file value — inspect resource type IRI
  if (resource.type === Constants.Region) return ResourceType.Annotation;
  if (resource.type === Constants.AudioSegment || resource.type === Constants.VideoSegment) {
    return ResourceType.Segment;
  }
  return null; // needs async compound check
}
```

**Modify `ResourceFetcherComponent`:** extract `annotationIri` from `ActivatedRoute` after resource loads and pass it as `@Input()` to `ResourceDispatcherComponent`.

```typescript
// In ResourceFetcherComponent:
annotationIri: string | null = null;

// after resource loads:
this.annotationIri = this._route.snapshot.queryParamMap.get(RouteConstants.annotationQueryParam) ?? null;
```

Template change:
```html
<app-resource-dispatcher [resource]="resource" [annotationIri]="annotationIri" />
```

---

### Step 2 — Create `ResourceDispatcherComponent`

**File:** `libs/vre/resource-editor/resource-editor/src/lib/resource-dispatcher.component.ts`

Responsibilities:
- Receives `resource: DspResource` and `annotationIri: string | null`
- Calls `getResourceType(resource.res)`
- For `null` result (potential compound): fires `doSearchStillImageRepresentationsCount`, shows spinner, then sets `resourceType` to either `ResourceType.Compound` or `ResourceType.Plain`
- Renders the correct typed component via `@switch`
- Handles same-resource-type navigation: `ngOnChanges` resets state and re-resolves type

```typescript
@Component({
  selector: 'app-resource-dispatcher',
  template: `
    @if (resourceType === null) {
      <app-progress-indicator />
    } @else {
      @switch (resourceType) {
        @case (ResourceType.Image) {
          <app-resource-image [resource]="resource" [annotationIri]="annotationIri" />
        }
        @case (ResourceType.Video) {
          <app-resource-video [resource]="resource" />
        }
        @case (ResourceType.Audio) {
          <app-resource-audio [resource]="resource" />
        }
        @case (ResourceType.Compound) {
          <app-resource-compound [resource]="resource" [compoundCount]="compoundCount" />
        }
        @case (ResourceType.Document) {
          <app-resource-document [resource]="resource" />
        }
        @case (ResourceType.Pdf) {
          <app-resource-pdf [resource]="resource" />
        }
        @case (ResourceType.Archive) {
          <app-resource-archive [resource]="resource" />
        }
        @case (ResourceType.Text) {
          <app-resource-text [resource]="resource" />
        }
        @case (ResourceType.Annotation) {
          <app-resource-annotation [resource]="resource" />
        }
        @case (ResourceType.Segment) {
          <app-resource-segment [resource]="resource" />
        }
        @case (ResourceType.Plain) {
          <app-resource-plain [resource]="resource" />
        }
      }
    }
  `,
  imports: [...all typed components, AppProgressIndicatorComponent],
})
export class ResourceDispatcherComponent implements OnChanges {
  @Input({ required: true }) resource!: DspResource;
  @Input() annotationIri: string | null = null;
  resourceType: ResourceType | null = null;
  compoundCount = 0;
  readonly ResourceType = ResourceType;

  ngOnChanges() {
    this.resourceType = null;
    const type = getResourceType(this.resource.res);
    if (type !== null) {
      this.resourceType = type;
      return;
    }
    // async compound check
    this._dspApi.v2.search
      .doSearchStillImageRepresentationsCount(this.resource.res.id)
      .pipe(take(1))
      .subscribe(result => {
        const count = (result as CountQueryResponse).numberOfResults;
        this.compoundCount = count;
        this.resourceType = count > 0 ? ResourceType.Compound : ResourceType.Plain;
        this._cdr.detectChanges();
      });
  }
}
```

---

### Step 3 — Create typed components (one at a time, starting simple)

Each typed component follows this template:

```typescript
@Component({
  selector: 'app-resource-image',
  template: `
    @if (resource.res.userHasPermission === 'RV') {
      <app-resource-restriction />
    }
    <app-resource-header [resource]="resource" />
    <app-resource-legal [fileValue]="fileValue" />
    <app-resource-representation [resource]="resource" />
    <app-resource-image-tabs [resource]="resource" [annotationIri]="annotationIri" />
  `,
  providers: [RegionService, PropertiesDisplayService],
  imports: [...],
})
export class ResourceImageComponent implements OnChanges {
  @Input({ required: true }) resource!: DspResource;
  @Input() annotationIri: string | null = null;

  get fileValue() { return getFileValue(this.resource.res)!; }

  ngOnChanges() {
    this._regionService.initialize(this.resource.res.id);
    if (this.annotationIri) {
      this._regionService.showRegions(true);
      this._regionService.selectRegion(this.annotationIri);
      // pairwise true→false subscription (moved from ResourceComponent)
    }
  }
}
```

**Recommended creation order** (simplest first to validate the pattern):

1. `ResourcePlainComponent` — no services, properties only
2. `ResourceDocumentComponent` — no services, simple representation
3. `ResourcePdfComponent` — no services, simple representation
4. `ResourceArchiveComponent` — no services
5. `ResourceTextComponent` — no services
6. `ResourceAnnotationComponent` — no services (annotation rendered as plain object)
7. `ResourceSegmentComponent` — no services (segment rendered as plain object)
8. `ResourceImageComponent` — RegionService, annotation URI handling
9. `ResourceAudioComponent` — SegmentsService
10. `ResourceVideoComponent` — SegmentsService
11. `ResourceCompoundComponent` — CompoundService + RegionService, compoundCount input

---

### Step 4 — Create per-typed-component tab components

Each typed component gets its own tab component with only the services it needs:

| Typed Component | Tab Component | Services needed |
|---|---|---|
| `ResourceImageComponent` | `ResourceImageTabsComponent` | `RegionService` |
| `ResourceVideoComponent` | `ResourceVideoTabsComponent` | `SegmentsService` |
| `ResourceAudioComponent` | `ResourceAudioTabsComponent` | `SegmentsService` |
| `ResourceCompoundComponent` | `ResourceCompoundTabsComponent` | `CompoundService`, `RegionService` |
| All others | `ResourceDefaultTabsComponent` | None (properties tab only) |

Each tab component injects only its needed services from its typed component provider.

---

### Step 5 — Wire `ResourceFetcherComponent` to use dispatcher

Replace `<app-resource [resource]="resource" />` with `<app-resource-dispatcher [resource]="resource" [annotationIri]="annotationIri" />` and add `annotationIri` extraction from `ActivatedRoute`.

Remove `ResourceComponent` from `ResourceFetcherComponent.imports[]`.

---

### Step 6 — Delete `ResourceComponent`

Once all typed components are in place and verified:
- Delete `resource.component.ts` and `resource.component.spec.ts`
- Remove `ResourceRepresentationComponent` usage from `ResourceComponent` (it is now used directly inside typed components)
- Update `ResourceTabsComponent` removal from old import chains

---

## Service Provider Map

| Service | New Provider | Reason |
|---|---|---|
| `RegionService` | `ResourceImageComponent`, `ResourceCompoundComponent`, `ResourceAnnotationComponent` | Still-image annotation loading |
| `SegmentsService` | `ResourceVideoComponent`, `ResourceAudioComponent` | Media segment loading |
| `CompoundService` | `ResourceCompoundComponent` | Must be co-provided with `RegionService` |
| `PropertiesDisplayService` | All typed components | localStorage-backed toggle; component-scoped to match current behavior |
| `ResourceFetcherService` | `ResourceFetcherComponent` (unchanged) | Fetching + auth stream |

---

## Dependencies and Risks

### Dependencies
- `ResourceRepresentationComponent` must remain stable — all typed components reuse it unchanged
- `ResourceTabsComponent` is replaced by per-type tab components — existing `ResourceTabsComponent` can be deleted after all typed components are complete
- `AnnotationTabComponent` and `SegmentTabComponent` are reused inside their respective per-type tab components

### Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| `ChangeDetectorRef` in `CompoundService`/`SegmentsService` binding to wrong host | Low | CDR will bind to typed component — which is the new rendering host. Same leaf components render the affected DOM. |
| `RegionService` instance mismatch between `CompoundService` and `AnnotationTabComponent` | Medium | Both must be provided at `ResourceCompoundComponent` root level — verified by DI sub-tree |
| Regression in comparison view (`comparison.component.ts`) | Low | Each `ResourceFetcherComponent` instance gets its own `ResourceDispatcherComponent` subtree — service isolation preserved |
| `ActivatedRoute` not available in dialog context for `annotationIri` | Low | `annotationIri` extracted in `ResourceFetcherComponent` which already uses `ActivatedRoute` |
| `::ng-deep` in `ResourceTabsComponent` (pre-existing convention violation) | Existing | Address in per-type tab components — do not copy the `::ng-deep` rule |

---

## Success Metrics

- `ResourceComponent` deleted (or reduced to empty shell)
- `ResourceDispatcherComponent` is the only place where resource type determines which component mounts
- No `@if`/`@switch` on resource type outside the dispatcher
- Each typed component file can be read and understood independently
- Unit tests for `ResourceDispatcherComponent` cover all `ResourceType` branches including async compound resolution
- No visual regression across any resource type

---

## Out of Scope

- Rewriting representation components (StillImage, VideoComponent, AudioComponent, etc.)
- Changing the fetch/API layer or `ResourceFetcherService`
- Signal inputs (`input()`) migration — stay on `@Input()` decorator
- Changing `PropertiesDisplayService` to `providedIn: 'root'`
- E2E test coverage — unit tests only
- `::ng-deep` cleanup beyond the new tab components

---

## Open Questions Resolved

| Question | Decision |
|---|---|
| Annotation/segment detection | Use `res.type` IRI check in `getResourceType()` alongside `getFileValue()` |
| Async compound check location | Dispatcher shows spinner until count resolves |
| Tab strategy | Split per typed component — each typed component owns its tab component |
| `annotationIri` location | Extracted in `ResourceFetcherComponent`, passed as `@Input()` |
| Same-type navigation | Typed component handles via `ngOnChanges` (no forced recreation) |
| PDF vs document | Two separate typed components: `ResourcePdfComponent` and `ResourceDocumentComponent` |
