import { Component, Input, OnChanges } from '@angular/core';
import { DspCompoundPosition, DspResource } from '@dasch-swiss/vre/shared/app-common';
import { CompoundViewerComponent } from './compound/compound-viewer.component';
import { CompoundService } from './compound/compound.service';
import { RegionService } from './representations/region.service';
import { ResourceCompoundTabsComponent } from './resource-compound-tabs.component';
import { ResourceHeaderComponent } from './header/resource-header.component';
import { PropertiesDisplayService } from './resource-properties/properties-display.service';
import { ResourceRestrictionComponent } from './meta/resource-restriction.component';

@Component({
  selector: 'app-resource-compound',
  template: `
    @if (resource.res.userHasPermission === 'RV') {
      <app-resource-restriction />
    }
    <app-resource-header [resource]="resource" />
    <app-compound-viewer />
    <app-resource-compound-tabs [resource]="resource" style="display: block; margin-top: 50px" />
  `,
  providers: [CompoundService, RegionService, PropertiesDisplayService],
  imports: [
    ResourceRestrictionComponent,
    ResourceHeaderComponent,
    CompoundViewerComponent,
    ResourceCompoundTabsComponent,
  ],
})
export class ResourceCompoundComponent implements OnChanges {
  @Input({ required: true }) resource!: DspResource;
  @Input({ required: true }) compoundCount!: number;

  constructor(private readonly _compoundService: CompoundService) {}

  ngOnChanges() {
    this._compoundService.reset();
    this._compoundService.onInit(new DspCompoundPosition(this.compoundCount), this.resource);
  }
}
