import { DecimalPipe } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { TranslatePipe } from '@ngx-translate/core';
import { DownloadDialogResourcesTabComponent } from './download-dialog-resources-tab.component';

export interface DownloadDialogData {
  resClass: ResourceClassDefinitionWithAllLanguages;
  resourceCount: number;
  /** Shown in the dialog title. */
  classLabel: string;
  properties: PropertyInfoValues[];
  /** Checkbox-selected rows; named in the scope note so nobody expects a selection export. */
  selectedCount: number;
}

@Component({
  selector: 'app-download-dialog',
  template: `
    <header class="header">
      <div class="heading">
        <h2 class="mat-headline-6 title" data-cy="download-dialog-title">
          {{ 'pages.dataBrowser.downloadDialog.heading' | translate: { className: data.classLabel } }}
        </h2>
        <p class="subtitle">
          {{ 'pages.dataBrowser.downloadDialog.resourceCount' | translate: { count: data.resourceCount | number } }}
        </p>
      </div>
      <button mat-icon-button [attr.aria-label]="'ui.common.actions.close' | translate" (click)="dialogRef.close()">
        <mat-icon>close</mat-icon>
      </button>
    </header>
    <app-download-dialog-properties-tab
      class="body"
      [properties]="data.properties"
      [resourceClassIri]="data.resClass.id"
      [resourceCount]="data.resourceCount"
      [selectedCount]="data.selectedCount"
      (afterClosed)="dialogRef.close()" />
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .header {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 16px 8px 12px 16px;
        border-bottom: 1px solid #e5e7eb;
      }

      .heading {
        flex: 1;
        min-width: 0;
      }

      .title {
        margin: 0;
      }

      .subtitle {
        margin: 2px 0 0;
        font-size: 13px;
        color: #666;
      }

      /* Only the property list scrolls; the header and the footer stay put. */
      .body {
        flex: 1;
        min-height: 0;
      }
    `,
  ],
  standalone: true,
  imports: [DecimalPipe, MatIcon, MatIconButton, TranslatePipe, DownloadDialogResourcesTabComponent],
})
export class DownloadDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DownloadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DownloadDialogData
  ) {}
}
