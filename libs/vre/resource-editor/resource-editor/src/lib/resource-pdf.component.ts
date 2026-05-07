import { Component, Input } from '@angular/core';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { PdfDocumentComponent } from './representations/document/pdf-document.component';
import { getFileValue } from './representations/get-file-value';
import { ResourceDefaultTabsComponent } from './resource-default-tabs.component';
import { ResourceHeaderComponent } from './resource-header.component';
import { ResourceLegalComponent } from './resource-legal.component';
import { PropertiesDisplayService } from './resource-properties/properties-display.service';
import { ResourceRepresentationContainerComponent } from './resource-representation-container.component';
import { ResourceRestrictionComponent } from './meta/resource-restriction.component';

@Component({
  selector: 'app-resource-pdf',
  template: `
    @if (resource.res.userHasPermission === 'RV') {
      <app-resource-restriction />
    }
    <app-resource-header [resource]="resource" />
    <app-resource-legal [fileValue]="fileValue" />
    <app-resource-representation-container>
      <app-pdf-document [src]="fileValue" [parentResource]="resource.res" />
    </app-resource-representation-container>
    <app-resource-default-tabs [resource]="resource" style="display: block; margin-top: 50px" />
  `,
  providers: [PropertiesDisplayService],
  imports: [
    ResourceRestrictionComponent,
    ResourceHeaderComponent,
    ResourceLegalComponent,
    PdfDocumentComponent,
    ResourceRepresentationContainerComponent,
    ResourceDefaultTabsComponent,
  ],
})
export class ResourcePdfComponent {
  @Input({ required: true }) resource!: DspResource;

  get fileValue() {
    return getFileValue(this.resource.res)!;
  }
}
