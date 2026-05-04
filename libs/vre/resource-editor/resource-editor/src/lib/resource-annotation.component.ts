import { Component, Input, OnInit } from '@angular/core';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { RegionService } from './representations/region.service';
import { StillImageComponent } from './representations/still-image/still-image.component';
import { ResourceDefaultTabsComponent } from './resource-default-tabs.component';
import { ResourceHeaderComponent } from './resource-header.component';
import { PropertiesDisplayService } from './resource-properties/properties-display.service';
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
  providers: [PropertiesDisplayService, RegionService],
  imports: [
    ResourceRestrictionComponent,
    ResourceHeaderComponent,
    ResourceRepresentationContainerComponent,
    StillImageComponent,
    ResourceDefaultTabsComponent,
  ],
})
export class ResourceAnnotationComponent implements OnInit {
  @Input({ required: true }) resource!: DspResource;

  constructor(private readonly _regionService: RegionService) {}

  ngOnInit() {
    this._regionService.initializeWithRegions([this.resource]);
  }
}
