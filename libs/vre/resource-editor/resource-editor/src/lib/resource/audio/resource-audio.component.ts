import { Component, Input } from '@angular/core';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { ResourceHeaderComponent } from '../../header/resource-header.component';
import { ResourceRestrictionComponent } from '../../meta/resource-restriction.component';
import { PropertiesDisplayService } from '../../properties/properties-display/property-value/properties-display.service';
import { ResourceMediaTabsComponent } from '../../properties/resource-media-tabs.component';
import { getFileValue } from '../../representation/get-file-value';
import { ResourceLegalComponent } from '../../representation/resource-legal.component';
import { ResourceRepresentationContainerComponent } from '../../representation/resource-representation-container.component';
import { SegmentsService } from '../../representation/segments/segments.service';
import { AudioComponent } from './audio.component';

@Component({
  selector: 'app-resource-audio',
  template: `
    @if (resource.res.userHasPermission === 'RV') {
      <app-resource-restriction />
    }
    <app-resource-header [resource]="resource" />
    <app-resource-legal [fileValue]="fileValue" />
    <app-resource-representation-container height="small">
      <app-audio [src]="fileValue" [parentResource]="resource.res" />
    </app-resource-representation-container>
    <app-resource-media-tabs [resource]="resource" style="display: block; margin-top: 50px" />
  `,
  providers: [SegmentsService, PropertiesDisplayService],
  imports: [
    ResourceRestrictionComponent,
    ResourceHeaderComponent,
    ResourceLegalComponent,
    AudioComponent,
    ResourceRepresentationContainerComponent,
    ResourceMediaTabsComponent,
  ],
})
export class ResourceAudioComponent {
  @Input({ required: true }) resource!: DspResource;

  get fileValue() {
    return getFileValue(this.resource.res)!;
  }
}
