import { Component, Input } from '@angular/core';
import { DspResource, isPlaceholderAsset } from '@dasch-swiss/vre/shared/app-common';
import { PdfDocumentComponent } from './representations/document/pdf-document.component';
import { getFileValue } from './representations/get-file-value';
import { PlaceholderRepresentationComponent } from './representations/placeholder-representation.component';
import { ResourceDefaultTabsComponent } from './resource-default-tabs.component';
import { ResourceHeaderComponent } from './resource-header.component';
import { ResourceLegalComponent } from './resource-legal.component';
import { PropertiesDisplayService } from './resource-properties/properties-display.service';
import { ResourceRepresentationContainerComponent } from './resource-representation-container.component';
import { ResourceRestrictionComponent } from './resource-restriction.component';

@Component({
  selector: 'app-resource-pdf',
  template: `
    @if (resource.res.userHasPermission === 'RV') {
      <app-resource-restriction />
    }
    <app-resource-header [resource]="resource" />
    <app-resource-legal [fileValue]="fileValue" />
    <app-resource-representation-container>
      @if (isPlaceholderAsset(fileValue)) {
        <app-placeholder-representation />
      } @else {
        <app-pdf-document [src]="fileValue" [parentResource]="resource.res" />
      }
    </app-resource-representation-container>
    <app-resource-default-tabs [resource]="resource" style="display: block; margin-top: 50px" />
  `,
  providers: [PropertiesDisplayService],
  imports: [
    ResourceRestrictionComponent,
    ResourceHeaderComponent,
    ResourceLegalComponent,
    PdfDocumentComponent,
    PlaceholderRepresentationComponent,
    ResourceRepresentationContainerComponent,
    ResourceDefaultTabsComponent,
  ],
})
export class ResourcePdfComponent {
  @Input({ required: true }) resource!: DspResource;

  protected readonly isPlaceholderAsset = isPlaceholderAsset;

  get fileValue() {
    return getFileValue(this.resource.res)!;
  }
}
