import { Component, Input, OnChanges } from '@angular/core';
import { ReadFileValue } from '@dasch-swiss/dsp-js';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { ArchiveComponent } from './representations/archive/archive.component';
import { AudioComponent } from './representations/audio/audio.component';
import { DocumentComponent } from './representations/document/document.component';
import { getFileValue } from './representations/get-file-value';
import { RepresentationConstants } from './representations/representation-constants';
import { StillImageComponent } from './representations/still-image/still-image.component';
import { TextComponent } from './representations/text/text.component';
import { VideoComponent } from './representations/video/video.component';

@Component({
  selector: 'app-resource-representation',
  template: ` <div class="representation-container center">
    @switch (fileValue.type) {
      @case (representationConstants.stillImage) {
        <app-still-image
          #stillImage
          class="dsp-representation stillimage"
          [compoundMode]="false"
          [resource]="resource.res" />
      }
      @case (representationConstants.externalStillImage) {
        <app-still-image
          #stillImage
          [compoundMode]="false"
          class="dsp-representation stillimage"
          [resource]="resource.res" />
      }
      @case (representationConstants.document) {
        <app-document
          #document
          class="dsp-representation document"
          [class.pdf]="fileValue.filename.split('.').pop() === 'pdf'"
          [src]="fileValue"
          [parentResource]="resource.res" />
      }
      @case (representationConstants.audio) {
        <app-audio #audio class="dsp-representation audio" [src]="fileValue" [parentResource]="resource.res" />
      }
      @case (representationConstants.movingImage) {
        <app-video #video class="dsp-representation video" [src]="fileValue" [parentResource]="resource.res" />
      }
      @case (representationConstants.archive) {
        <app-archive #archive class="dsp-representation archive" [src]="fileValue" [parentResource]="resource.res" />
      }
      @case (representationConstants.text) {
        <app-text #text class="dsp-representation text" [src]="fileValue" [parentResource]="resource.res" />
      }
    }
  </div>`,
  standalone: true,
  imports: [ArchiveComponent, AudioComponent, DocumentComponent, StillImageComponent, TextComponent, VideoComponent],
})
export class ResourceRepresentationComponent implements OnChanges {
  @Input({ required: true }) resource!: DspResource;

  fileValue!: ReadFileValue | null;
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
