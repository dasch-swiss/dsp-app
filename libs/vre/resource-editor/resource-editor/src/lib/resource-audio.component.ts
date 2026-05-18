import { Component, Input } from '@angular/core';
import { DspResource, isPlaceholderAsset } from '@dasch-swiss/vre/shared/app-common';
import { AudioComponent } from './representations/audio/audio.component';
import { getFileValue } from './representations/get-file-value';
import { PlaceholderRepresentationComponent } from './representations/placeholder-representation.component';
import { ResourceHeaderComponent } from './resource-header.component';
import { ResourceLegalComponent } from './resource-legal.component';
import { ResourceMediaTabsComponent } from './resource-media-tabs.component';
import { PropertiesDisplayService } from './resource-properties/properties-display.service';
import { ResourceRepresentationContainerComponent } from './resource-representation-container.component';
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
    <app-resource-representation-container height="small">
      @if (isPlaceholderAsset(fileValue)) {
        <app-placeholder-representation />
      } @else {
        <app-audio [src]="fileValue" [parentResource]="resource.res" />
      }
    </app-resource-representation-container>
    <app-resource-media-tabs [resource]="resource" style="display: block; margin-top: 50px" />
  `,
  providers: [SegmentsService, PropertiesDisplayService],
  imports: [
    ResourceRestrictionComponent,
    ResourceHeaderComponent,
    ResourceLegalComponent,
    AudioComponent,
    PlaceholderRepresentationComponent,
    ResourceRepresentationContainerComponent,
    ResourceMediaTabsComponent,
  ],
})
export class ResourceAudioComponent {
  @Input({ required: true }) resource!: DspResource;

  protected readonly isPlaceholderAsset = isPlaceholderAsset;

  get fileValue() {
    return getFileValue(this.resource.res)!;
  }
}
