import { Component, Input } from '@angular/core';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { getFileValue } from './representations/get-file-value';
import { ResourceHeaderComponent } from './resource-header.component';
import { ResourceLegalComponent } from './resource-legal.component';
import { ResourceMediaTabsComponent } from './resource-media-tabs.component';
import { PropertiesDisplayService } from './resource-properties/properties-display.service';
import { ResourceRepresentationComponent } from './resource-representation.component';
import { ResourceRestrictionComponent } from './resource-restriction.component';
import { SegmentsService } from './segment-support/segments.service';

@Component({
  selector: 'app-resource-audio',
  template: `
    @if (resource.res.userHasPermission === 'RV') {
      <app-resource-restriction />
    }
    <app-resource-header [resource]="resource" />
    <app-resource-legal [fileValue]="fileValue" />
    <app-resource-representation [resource]="resource" />
    <app-resource-media-tabs [resource]="resource" style="display: block; margin-top: 50px" />
  `,
  providers: [SegmentsService, PropertiesDisplayService],
  imports: [
    ResourceRestrictionComponent,
    ResourceHeaderComponent,
    ResourceLegalComponent,
    ResourceRepresentationComponent,
    ResourceMediaTabsComponent,
  ],
})
export class ResourceAudioComponent {
  @Input({ required: true }) resource!: DspResource;

  get fileValue() {
    return getFileValue(this.resource.res)!;
  }
}
