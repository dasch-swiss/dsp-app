import { Component, Input, OnChanges } from '@angular/core';
import { ReadFileValue } from '@dasch-swiss/dsp-js';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { ArchiveComponent } from './representations/archive/archive.component';
import { AudioComponent } from './representations/audio/audio.component';
import { DocumentComponent } from './representations/document/document.component';
import { PdfDocumentComponent } from './representations/document/pdf-document.component';
import { getFileValue } from './representations/get-file-value';
import { RepresentationConstants } from './representations/representation-constants';
import { StillImageComponent } from './representations/still-image/still-image.component';
import { TextComponent } from './representations/text/text.component';
import { VideoComponent } from './representations/video/video.component';
import { ResourceRepresentationContainerComponent } from './resource-representation-container.component';

@Component({
  selector: 'app-resource-representation',
  template: `
    @switch (fileValue.type) {
      @case (representationConstants.stillImage) {
        <app-resource-representation-container>
          <app-still-image #stillImage [compoundMode]="false" [resource]="resource.res" />
        </app-resource-representation-container>
      }
      @case (representationConstants.externalStillImage) {
        <app-resource-representation-container>
          <app-still-image #stillImage [compoundMode]="false" [resource]="resource.res" />
        </app-resource-representation-container>
      }
      @case (representationConstants.document) {
        @if (isPdf) {
          <app-resource-representation-container>
            <app-pdf-document #document [src]="fileValue" [parentResource]="resource.res" />
          </app-resource-representation-container>
        } @else {
          <app-resource-representation-container height="small">
            <app-document #document [src]="fileValue" [parentResource]="resource.res" />
          </app-resource-representation-container>
        }
      }
      @case (representationConstants.audio) {
        <app-resource-representation-container height="small">
          <app-audio #audio [src]="fileValue" [parentResource]="resource.res" />
        </app-resource-representation-container>
      }
      @case (representationConstants.movingImage) {
        <app-resource-representation-container height="auto">
          <app-video #video [src]="fileValue" [parentResource]="resource.res" />
        </app-resource-representation-container>
      }
      @case (representationConstants.archive) {
        <app-resource-representation-container height="small">
          <app-archive #archive [src]="fileValue" [parentResource]="resource.res" />
        </app-resource-representation-container>
      }
      @case (representationConstants.text) {
        <app-resource-representation-container height="small">
          <app-text #text [src]="fileValue" [parentResource]="resource.res" />
        </app-resource-representation-container>
      }
    }
  `,
  imports: [
    ArchiveComponent,
    AudioComponent,
    DocumentComponent,
    PdfDocumentComponent,
    StillImageComponent,
    TextComponent,
    VideoComponent,
    ResourceRepresentationContainerComponent,
  ],
})
export class ResourceRepresentationComponent implements OnChanges {
  @Input({ required: true }) resource!: DspResource;

  fileValue!: ReadFileValue | null;

  get fileExtension() {
    return this.fileValue?.filename.split('.').pop();
  }

  get isPdf() {
    return this.fileExtension === 'pdf';
  }

  loading = false;
  protected readonly representationConstants = RepresentationConstants;

  ngOnChanges() {
    const fileValue = getFileValue(this.resource.res);
    if (fileValue === null) {
      throw new AppError('FileValue should not be null');
    }
    this.fileValue = fileValue;
  }
}
