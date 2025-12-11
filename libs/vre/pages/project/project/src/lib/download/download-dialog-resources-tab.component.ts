import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialogActions } from '@angular/material/dialog';
import { APIV3ApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { LoadingButtonDirective } from '@dasch-swiss/vre/ui/progress-indicator';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { DownloadPropertyListComponent } from './download-property-list.component';

@Component({
  selector: 'app-download-dialog-properties-tab',
  standalone: true,
  imports: [
    DownloadPropertyListComponent,
    MatCheckbox,
    FormsModule,
    TranslateModule,
    MatDialogActions,
    MatButton,
    LoadingButtonDirective,
  ],
  template: `
    <app-download-property-list [propertyDefinitions]="properties" (propertiesChange)="selectedPropertyIds = $event" />

    <div style="margin-top: 16px; padding: 16px; background: #f5f5f5; border-radius: 4px">
      <mat-checkbox [(ngModel)]="includeResourceIris">
        <span style="font-weight: 500">{{ 'pages.dataBrowser.downloadDialog.includeIrisLabel' | translate }}</span>
      </mat-checkbox>
      <p style="margin: 8px 0 0 32px; color: #666; font-size: 13px">
        {{ 'pages.dataBrowser.downloadDialog.includeIrisExplanation' | translate }}
      </p>
    </div>

    <div mat-dialog-actions align="end">
      <button mat-button (click)="afterClosed.emit()" style="margin-right: 16px" [disabled]="isDownloading">
        {{ 'ui.common.actions.cancel' | translate }}
      </button>
      <button
        mat-raised-button
        color="primary"
        appLoadingButton
        [isLoading]="isDownloading"
        (click)="downloadCsv()"
        [disabled]="isDownloading">
        {{ 'pages.dataBrowser.downloadDialog.downloadCsv' | translate }}
      </button>
    </div>
  `,
})
export class DownloadDialogResourcesTabComponent {
  @Input({ required: true }) properties!: PropertyInfoValues[];
  @Input({ required: true }) resourceClassIri!: string;
  @Output() afterClosed = new EventEmitter<void>();
  includeResourceIris = false;
  isDownloading = false;

  selectedPropertyIds: string[] = [];

  constructor(
    private _v3: APIV3ApiService,
    private _notificationService: NotificationService,
    private _localizationService: LocalizationService,
    private _translateService: TranslateService
  ) {}

  downloadCsv(): void {
    this.isDownloading = true;

    this._v3
      .postV3ExportResources(
        {
          resourceClass: this.resourceClassIri,
          selectedProperties: this.selectedPropertyIds,
          language: this._localizationService.getCurrentLanguage(),
          includeIris: this.includeResourceIris,
        },
        undefined,
        undefined,
        { httpHeaderAccept: 'text/csv' }
      )
      .pipe(
        finalize(() => {
          this.isDownloading = false;
        })
      )
      .subscribe({
        next: csvText => {
          this._createBlob(csvText);
          this._notificationService.openSnackBar(
            this._translateService.instant('pages.dataBrowser.downloadDialog.downloadSuccess')
          );
          this.afterClosed.emit();
        },
        error: e => {
          this._notificationService.openSnackBar(
            this._translateService.instant('pages.dataBrowser.downloadDialog.downloadError')
          );
        },
      });
  }

  private _createBlob(csvText: string) {
    const blob = new Blob([csvText], { type: 'text/csv' });
    const filename = `resources_export_${new Date().toISOString().split('T')[0]}.csv`;

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
}
