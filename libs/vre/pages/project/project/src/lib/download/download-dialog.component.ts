import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { DialogHeaderComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslateModule } from '@ngx-translate/core';
import { DownloadDialogResourcesTabComponent } from './download-dialog-resources-tab.component';

export interface DownloadDialogData {
  resClass: ResourceClassDefinitionWithAllLanguages;
  resourceCount: number;
  properties: PropertyInfoValues[];
}

@Component({
  selector: 'app-download-dialog',
  template: `
    <app-dialog-header
      [title]="'pages.dataBrowser.downloadDialog.title' | translate"
      [subtitle]="'pages.dataBrowser.downloadDialog.resourcesAvailable' | translate: { count: data.resourceCount }" />
    <div mat-dialog-content style="max-height: 90vh">
      <app-download-dialog-properties-tab
        [properties]="data.properties"
        [resourceClassIri]="data.resClass.id"
        style="display: block; height: 100%" />
    </div>
  `,
  standalone: true,
  imports: [DialogHeaderComponent, TranslateModule, MatDialogContent, DownloadDialogResourcesTabComponent],
})
export class DownloadDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DownloadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DownloadDialogData
  ) {}
}
