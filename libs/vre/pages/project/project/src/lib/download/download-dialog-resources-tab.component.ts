import { HttpDownloadProgressEvent, HttpEvent, HttpEventType } from '@angular/common/http';
import { ChangeDetectorRef, Component, DestroyRef, EventEmitter, Input, Output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialogActions } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { APIV3ApiService, ExportRequest } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { RowScannerState, advanceRowScanner, initRowScanner } from './csv-row-scanner';
import { DownloadPropertyListComponent } from './download-property-list.component';

// Threshold above which an export counts as "large": the dialog shows a warning and this tab
// shows a real X-of-N progress bar. Defined here (the leaf the dialog already imports) rather
// than in download-dialog.component.ts so the dialog can reuse it without a circular import.
export const CSV_EXPORT_LARGE_THRESHOLD = 1_000;

@Component({
  selector: 'app-download-dialog-properties-tab',
  standalone: true,
  imports: [
    DownloadPropertyListComponent,
    MatCheckbox,
    FormsModule,
    TranslatePipe,
    MatDialogActions,
    MatButton,
    MatIcon,
    MatProgressBarModule,
  ],
  styles: [
    `
      .csv-export-info {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-bottom: 16px;
        padding: 12px;
        background: #e3f2fd;
        color: #0d47a1;
        border-radius: 4px;
        font-size: 13px;
        line-height: 20px;
      }

      .csv-export-info mat-icon {
        flex-shrink: 0;
        color: #1565c0;
      }

      .csv-export-progress {
        display: flex;
        flex-direction: column;
        gap: 6px;
        margin-top: 16px;
      }

      .csv-export-progress-meta {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        font-size: 12px;
        color: #666;
      }

      .csv-export-progress-meta strong {
        color: rgba(0, 0, 0, 0.87);
        font-weight: 500;
        font-variant-numeric: tabular-nums;
      }

      .csv-export-preparing {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .csv-export-spin {
        font-size: 18px;
        width: 18px;
        height: 18px;
        animation: csv-export-spin 1.2s linear infinite;
      }

      @keyframes csv-export-spin {
        from {
          transform: rotate(0);
        }
        to {
          transform: rotate(360deg);
        }
      }
    `,
  ],
  template: `
    @if (isDownloading) {
      <div class="csv-export-info" role="status" aria-live="polite">
        <mat-icon>file_download</mat-icon>
        <span>{{ 'pages.dataBrowser.downloadDialog.buildingCsv' | translate }}</span>
      </div>
    }

    <app-download-property-list [propertyDefinitions]="properties" (propertiesChange)="selectedPropertyIds = $event" />

    <div style="margin-top: 16px; padding: 16px; background: #f5f5f5; border-radius: 4px">
      <mat-checkbox [(ngModel)]="includeArkUrls">
        <span style="font-weight: 500">{{ 'pages.dataBrowser.downloadDialog.includeArkUrlsLabel' | translate }}</span>
      </mat-checkbox>
      <p style="margin: 8px 0 0 32px; color: #666; font-size: 13px">
        {{ 'pages.dataBrowser.downloadDialog.includeArkUrlsExplanation' | translate }}
      </p>
    </div>

    <div style="margin-top: 16px; padding: 16px; background: #f5f5f5; border-radius: 4px">
      <mat-checkbox [(ngModel)]="includeResourceIris">
        <span style="font-weight: 500">{{ 'pages.dataBrowser.downloadDialog.includeIrisLabel' | translate }}</span>
      </mat-checkbox>
      <p style="margin: 8px 0 0 32px; color: #666; font-size: 13px">
        {{ 'pages.dataBrowser.downloadDialog.includeIrisExplanation' | translate }}
      </p>
    </div>

    @if (isDownloading && resourceCount > largeThreshold) {
      <div class="csv-export-progress">
        <div class="csv-export-progress-meta">
          <span id="csvExportProgressLabel">{{
            'pages.dataBrowser.downloadDialog.progressXofN' | translate: { x: rowsReceived, n: resourceCount }
          }}</span>
          <strong>{{ progressPercent }}%</strong>
        </div>
        <mat-progress-bar
          mode="determinate"
          [value]="progressPercent"
          aria-labelledby="csvExportProgressLabel"></mat-progress-bar>
      </div>
    }

    <div mat-dialog-actions align="end">
      <button mat-button (click)="afterClosed.emit()" style="margin-right: 16px" [disabled]="isDownloading">
        {{ 'ui.common.actions.cancel' | translate }}
      </button>
      <button mat-raised-button color="primary" (click)="downloadCsv()" [disabled]="isDownloading">
        @if (isDownloading) {
          <span class="csv-export-preparing">
            <mat-icon class="csv-export-spin">autorenew</mat-icon>
            {{ 'pages.dataBrowser.downloadDialog.preparing' | translate }}
          </span>
        } @else {
          {{ 'pages.dataBrowser.downloadDialog.downloadCsv' | translate }}
        }
      </button>
    </div>
  `,
})
export class DownloadDialogResourcesTabComponent {
  @Input({ required: true }) properties!: PropertyInfoValues[];
  @Input({ required: true }) resourceClassIri!: string;
  @Input({ required: true }) resourceCount!: number;
  @Output() afterClosed = new EventEmitter<void>();
  // Lets the parent dialog swap its idle "large export" warning for the in-progress info callout.
  @Output() downloadStateChange = new EventEmitter<boolean>();
  readonly largeThreshold = CSV_EXPORT_LARGE_THRESHOLD;
  includeArkUrls = false;
  includeResourceIris = false;
  isDownloading = false;
  rowsReceived = 0;

  selectedPropertyIds: string[] = [];

  private _scannerState: RowScannerState = initRowScanner();

  constructor(
    private readonly _v3: APIV3ApiService,
    private readonly _localizationService: LocalizationService,
    private readonly _notificationService: NotificationService,
    private readonly _translateService: TranslateService,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _destroyRef: DestroyRef
  ) {}

  get progressPercent(): number {
    if (!this.resourceCount) return 0;
    return Math.min(100, Math.round((this.rowsReceived / this.resourceCount) * 100));
  }

  downloadCsv(): void {
    this.isDownloading = true;
    this.downloadStateChange.emit(true);
    this.rowsReceived = 0;
    this._scannerState = initRowScanner();

    const body: ExportRequest = {
      resourceClass: this.resourceClassIri,
      selectedProperties: this.selectedPropertyIds,
      language: this._localizationService.getCurrentLanguage(),
      includeIris: this.includeResourceIris,
      includeArkUrls: this.includeArkUrls,
    };

    // observe:'events' + reportProgress stream HttpDownloadProgressEvents; the text/csv Accept header
    // makes the generated client select responseType:'text', which populates `partialText` for the
    // row counter. This is the only reason the endpoint uses the events overload. See DEV-6462 / DEV-6336.
    this._v3
      .postV3ExportResources(body, 'events', true, { httpHeaderAccept: 'text/csv' })
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => {
          this.isDownloading = false;
          this.downloadStateChange.emit(false);
          this.rowsReceived = 0;
          this._cdr.markForCheck();
        })
      )
      .subscribe({
        next: (event: HttpEvent<string>) => {
          if (event.type === HttpEventType.DownloadProgress) {
            const partialText = (event as HttpDownloadProgressEvent).partialText ?? '';
            this._scannerState = advanceRowScanner(this._scannerState, partialText);
            this.rowsReceived = Math.max(0, this._scannerState.rows - 1);
            this._cdr.markForCheck();
          } else if (event.type === HttpEventType.Response) {
            this._createBlob(event.body as string);
            this._notificationService.openSnackBar(
              this._translateService.instant('pages.dataBrowser.downloadDialog.downloadSuccess')
            );
            this.afterClosed.emit();
          }
        },
        error: () => {
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
