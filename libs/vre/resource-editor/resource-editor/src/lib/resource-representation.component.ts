import { Component, Input, OnChanges } from '@angular/core';
import { ReadFileValue } from '@dasch-swiss/dsp-js';
import { getFileValue, RepresentationConstants } from '@dasch-swiss/vre/resource-editor/representations';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';

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
  standalone: false,
})
export class ResourceRepresentationComponent implements OnChanges {
  @Input({ required: true }) resource!: DspResource;

  fileValue!: ReadFileValue;
  loading = false;
  protected readonly representationConstants = RepresentationConstants;

  ngOnChanges() {
    this.fileValue = getFileValue(this.resource.res);
  }
}
