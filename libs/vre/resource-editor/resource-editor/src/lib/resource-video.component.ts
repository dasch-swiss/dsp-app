import { Component, Input } from '@angular/core';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { getFileValue } from './representations/get-file-value';
import { VideoComponent } from './representations/video/video.component';
import { ResourceHeaderComponent } from './resource-header.component';
import { ResourceLegalComponent } from './resource-legal.component';
import { ResourceMediaTabsComponent } from './resource-media-tabs.component';
import { PropertiesDisplayService } from './resource-properties/properties-display.service';
import { ResourceRestrictionComponent } from './meta/resource-restriction.component';
import { SegmentsService } from './segment-support/segments.service';

@Component({
  selector: 'app-resource-video',
  template: `
    @if (resource.res.userHasPermission === 'RV') {
      <app-resource-restriction />
    }
    <app-resource-header [resource]="resource" />
    <app-resource-legal [fileValue]="fileValue" />
    <app-video [src]="fileValue" [parentResource]="resource.res" />
    <app-resource-media-tabs [resource]="resource" style="display: block; margin-top: 50px" />
  `,
  providers: [SegmentsService, PropertiesDisplayService],
  imports: [
    ResourceRestrictionComponent,
    ResourceHeaderComponent,
    ResourceLegalComponent,
    VideoComponent,
    ResourceMediaTabsComponent,
  ],
})
export class ResourceVideoComponent {
  @Input({ required: true }) resource!: DspResource;

  get fileValue() {
    return getFileValue(this.resource.res)!;
  }
}
