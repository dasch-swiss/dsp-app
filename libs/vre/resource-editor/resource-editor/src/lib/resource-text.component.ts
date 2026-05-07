import { Component, Input } from '@angular/core';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { getFileValue } from './representation/get-file-value';
import { TextComponent } from './representation/text/text.component';
import { ResourceDefaultTabsComponent } from './resource-default-tabs.component';
import { ResourceHeaderComponent } from './header/resource-header.component';
import { ResourceLegalComponent } from './representation/resource-legal.component';
import { PropertiesDisplayService } from './resource-properties/properties-display.service';
import { ResourceRepresentationContainerComponent } from './representation/resource-representation-container.component';
import { ResourceRestrictionComponent } from './meta/resource-restriction.component';

@Component({
  selector: 'app-resource-text',
  template: `
    @if (resource.res.userHasPermission === 'RV') {
      <app-resource-restriction />
    }
    <app-resource-header [resource]="resource" />
    <app-resource-legal [fileValue]="fileValue" />
    <app-resource-representation-container height="small">
      <app-text [src]="fileValue" [parentResource]="resource.res" />
    </app-resource-representation-container>
    <app-resource-default-tabs [resource]="resource" style="display: block; margin-top: 50px" />
  `,
  providers: [PropertiesDisplayService],
  imports: [
    ResourceRestrictionComponent,
    ResourceHeaderComponent,
    ResourceLegalComponent,
    TextComponent,
    ResourceRepresentationContainerComponent,
    ResourceDefaultTabsComponent,
  ],
})
export class ResourceTextComponent {
  @Input({ required: true }) resource!: DspResource;

  get fileValue() {
    return getFileValue(this.resource.res)!;
  }
}
