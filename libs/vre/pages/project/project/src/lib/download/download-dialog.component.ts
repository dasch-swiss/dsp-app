import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogContent, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { DialogHeaderComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import {
  CSV_EXPORT_LARGE_THRESHOLD,
  DownloadDialogResourcesTabComponent,
} from './download-dialog-resources-tab.component';

export interface DownloadDialogData {
  resClass: ResourceClassDefinitionWithAllLanguages;
  resourceCount: number;
  /** Shown as the dialog subtitle. */
  classLabel: string;
  properties: PropertyInfoValues[];
  /** Checkbox-selected rows; named in the scope banner so nobody expects a selection export. */
  selectedCount: number;
}

@Component({
  selector: 'app-download-dialog',
  template: `
    <app-dialog-header
      [title]="
        (data.resourceCount === 1
          ? 'pages.dataBrowser.downloadDialog.titleOne'
          : 'pages.dataBrowser.downloadDialog.titleAll'
        ) | translate: { count: data.resourceCount }
      "
      [subtitle]="data.classLabel" />
    @if (data.resourceCount > largeThreshold && !isDownloading) {
      <div class="large-export-warning" data-cy="large-export-warning" role="alert">
        <mat-icon>warning</mat-icon>
        <span>{{
          'pages.dataBrowser.downloadDialog.largeExportWarning' | translate: { count: data.resourceCount }
        }}</span>
      </div>
    }
    <!-- The export ignores the row selection and the Data tab's search and filters; say so before the click. -->
    <div class="scope-banner" data-cy="download-scope-note">
      <mat-icon>info</mat-icon>
      <span>{{
        (data.selectedCount
          ? 'pages.dataBrowser.downloadDialog.scopeAllWithSelection'
          : 'pages.dataBrowser.downloadDialog.scopeAll'
        ) | translate: { count: data.selectedCount }
      }}</span>
    </div>
    <div mat-dialog-content style="max-height: 90vh">
      <app-download-dialog-properties-tab
        [properties]="data.properties"
        [resourceClassIri]="data.resClass.id"
        [resourceCount]="data.resourceCount"
        (downloadStateChange)="isDownloading = $event"
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

      .scope-banner {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin: 12px 24px 0;
        padding: 10px 12px;
        border-radius: 4px;
        background: #e8f0f7;
        color: #20425e;
        font-size: 13px;
      }

      .scope-banner mat-icon {
        flex-shrink: 0;
        color: #336790;
      }
    `,
  ],
  standalone: true,
  imports: [DialogHeaderComponent, MatIcon, TranslatePipe, MatDialogContent, DownloadDialogResourcesTabComponent],
})
export class DownloadDialogComponent {
  readonly largeThreshold = CSV_EXPORT_LARGE_THRESHOLD;
  isDownloading = false;

  constructor(
    public dialogRef: MatDialogRef<DownloadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DownloadDialogData
  ) {}
}
