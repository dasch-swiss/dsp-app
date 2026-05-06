import { ChangeDetectorRef, Component, Inject, Input, OnChanges, OnDestroy } from '@angular/core';
import { CountQueryResponse, KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { catchError, EMPTY, Subject, take, takeUntil } from 'rxjs';
import { getResourceType } from './get-resource-type';
import { ResourceAnnotationComponent } from './resource-annotation.component';
import { ResourceArchiveComponent } from './resource-archive.component';
import { ResourceAudioSegmentComponent } from './resource-audio-segment.component';
import { ResourceAudioComponent } from './resource-audio.component';
import { ResourceCompoundComponent } from './resource-compound.component';
import { ResourceDocumentComponent } from './resource-document.component';
import { ResourceImageComponent } from './resource-image.component';
import { ResourcePdfComponent } from './resource-pdf.component';
import { ResourcePlainComponent } from './resource-plain.component';
import { ResourceTextComponent } from './resource-text.component';
import { ResourceType } from './resource-type';
import { ResourceVideoSegmentComponent } from './resource-video-segment.component';
import { ResourceVideoComponent } from './resource-video.component';

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
        @case (ResourceType.VideoSegment) {
          <app-resource-video-segment [resource]="resource" />
        }
        @case (ResourceType.AudioSegment) {
          <app-resource-audio-segment [resource]="resource" />
        }
        @case (ResourceType.Plain) {
          <app-resource-plain [resource]="resource" />
        }
      }
    }
  `,
  imports: [
    AppProgressIndicatorComponent,
    ResourceAnnotationComponent,
    ResourceArchiveComponent,
    ResourceAudioComponent,
    ResourceCompoundComponent,
    ResourceDocumentComponent,
    ResourceImageComponent,
    ResourcePdfComponent,
    ResourcePlainComponent,
    ResourceAudioSegmentComponent,
    ResourceVideoSegmentComponent,
    ResourceTextComponent,
    ResourceVideoComponent,
  ],
})
export class ResourceDispatcherComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) resource!: DspResource;
  @Input() annotationIri: string | null = null;

  resourceType: ResourceType | null = null;
  compoundCount = 0;
  readonly ResourceType = ResourceType;

  private readonly _destroy$ = new Subject<void>();

  constructor(
    private readonly _cdr: ChangeDetectorRef,
    @Inject(DspApiConnectionToken) private readonly _dspApi: KnoraApiConnection
  ) {}

  ngOnChanges() {
    this._destroy$.next();
    this.resourceType = null;
    this.compoundCount = 0;

    const type = getResourceType(this.resource.res);
    if (type !== null) {
      this.resourceType = type;
      return;
    }

    // null result: needs async compound check to distinguish plain from compound
    // annotationIri is forwarded only to ResourceType.Image; silently ignored for all other types
    this._dspApi.v2.search
      .doSearchStillImageRepresentationsCount(this.resource.res.id)
      .pipe(
        take(1),
        takeUntil(this._destroy$),
        catchError(() => {
          this.resourceType = ResourceType.Plain;
          this._cdr.detectChanges();
          return EMPTY;
        })
      )
      .subscribe((result: CountQueryResponse) => {
        this.compoundCount = result.numberOfResults;
        this.resourceType = result.numberOfResults > 0 ? ResourceType.Compound : ResourceType.Plain;
        this._cdr.detectChanges();
      });
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
