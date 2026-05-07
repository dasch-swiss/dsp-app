import { Component, Input } from '@angular/core';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { ResourceDefaultTabsComponent } from '../../properties/resource-default-tabs.component';
import { ResourceHeaderComponent } from '../../header/resource-header.component';
import { PropertiesDisplayService } from '../../properties/properties-display/property-value/properties-display.service';
import { ResourceRestrictionComponent } from '../../meta/resource-restriction.component';

@Component({
  selector: 'app-resource-plain',
  template: `
    @if (resource.res.userHasPermission === 'RV') {
      <app-resource-restriction />
    }
    <app-resource-header [resource]="resource" />
    <app-resource-default-tabs [resource]="resource" style="display: block; margin-top: 50px" />
  `,
  providers: [PropertiesDisplayService],
  imports: [ResourceRestrictionComponent, ResourceHeaderComponent, ResourceDefaultTabsComponent],
})
export class ResourcePlainComponent {
  @Input({ required: true }) resource!: DspResource;
}
