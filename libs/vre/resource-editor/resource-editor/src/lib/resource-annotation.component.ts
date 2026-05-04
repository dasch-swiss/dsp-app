import { Component, Input } from '@angular/core';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { ResourceDefaultTabsComponent } from './resource-default-tabs.component';
import { ResourceHeaderComponent } from './resource-header.component';
import { PropertiesDisplayService } from './resource-properties/properties-display.service';
import { StillImageComponent } from './representations/still-image/still-image.component';
import { ResourceRepresentationContainerComponent } from './resource-representation-container.component';
import { ResourceRestrictionComponent } from './resource-restriction.component';

@Component({
  selector: 'app-resource-annotation',
  template: `
    @if (resource.res.userHasPermission === 'RV') {
      <app-resource-restriction />
    }
    <app-resource-header [resource]="resource" />
    <app-resource-representation-container>
      <app-still-image [resource]="resource.res" [compoundMode]="false" />
    </app-resource-representation-container>
    <app-resource-default-tabs [resource]="resource" style="display: block; margin-top: 50px" />
  `,
  providers: [PropertiesDisplayService],
  imports: [
    ResourceRestrictionComponent,
    ResourceHeaderComponent,
    ResourceRepresentationContainerComponent,
    StillImageComponent,
    ResourceDefaultTabsComponent,
  ],
})
export class ResourceAnnotationComponent {
  @Input({ required: true }) resource!: DspResource;
}
