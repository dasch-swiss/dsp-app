import { Component, Input, OnChanges } from '@angular/core';
import { ReadFileValue } from '@dasch-swiss/dsp-js';
import { getFileValue, RepresentationConstants } from '@dasch-swiss/vre/resource-editor/representations';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';

@Component({
  selector: 'app-resource-representation',
  template: ` <div class="representation-container center" [ngSwitch]="fileValue.type">
    <app-still-image
      #stillImage
      class="dsp-representation stillimage"
      [compoundMode]="false"
      *ngSwitchCase="representationConstants.stillImage"
      [resource]="resource.res" />
    <app-still-image
      #stillImage
      [compoundMode]="false"
      class="dsp-representation stillimage"
      *ngSwitchCase="representationConstants.externalStillImage"
      [resource]="resource.res" />

    <app-document
      #document
      class="dsp-representation document"
      [class.pdf]="fileValue.filename.split('.').pop() === 'pdf'"
      *ngSwitchCase="representationConstants.document"
      [src]="fileValue"
      [parentResource]="resource.res" />

    <app-audio
      #audio
      class="dsp-representation audio"
      *ngSwitchCase="representationConstants.audio"
      [src]="fileValue"
      [parentResource]="resource.res" />

    <app-video
      #video
      class="dsp-representation video"
      *ngSwitchCase="representationConstants.movingImage"
      [src]="fileValue"
      [parentResource]="resource.res" />

    <app-archive
      #archive
      class="dsp-representation archive"
      *ngSwitchCase="representationConstants.archive"
      [src]="fileValue"
      [parentResource]="resource.res" />

    <app-text
      #text
      class="dsp-representation text"
      *ngSwitchCase="representationConstants.text"
      [src]="fileValue"
      [parentResource]="resource.res" />
  </div>`,
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
