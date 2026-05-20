import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { DialogHeaderComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { DownloadDialogResourcesTabComponent } from './download-dialog-resources-tab.component';

export const CSV_EXPORT_LARGE_THRESHOLD = 1_000;

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
    @if (data.resourceCount > largeThreshold) {
      <div class="large-export-warning" data-cy="large-export-warning" role="alert">
        <mat-icon>warning</mat-icon>
        <span>{{
          'pages.dataBrowser.downloadDialog.largeExportWarning' | translate: { count: data.resourceCount }
        }}</span>
      </div>
    }
    <div mat-dialog-content style="max-height: 90vh">
      <app-download-dialog-properties-tab
        [properties]="data.properties"
        [resourceClassIri]="data.resClass.id"
        (afterClosed)="dialogRef.close()"
        style="display: block; height: 100%" />
    </div>
  `,
  styles: [
    `
      .large-export-warning {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 12px 24px;
        background: #fff3e0;
        color: #e65100;
      }

      .large-export-warning mat-icon {
        flex-shrink: 0;
      }
    `,
  ],
  standalone: true,
  imports: [DialogHeaderComponent, MatIcon, TranslatePipe, MatDialogContent, DownloadDialogResourcesTabComponent],
})
export class DownloadDialogComponent {
  readonly largeThreshold = CSV_EXPORT_LARGE_THRESHOLD;

  constructor(
    public dialogRef: MatDialogRef<DownloadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DownloadDialogData
  ) {}
}
