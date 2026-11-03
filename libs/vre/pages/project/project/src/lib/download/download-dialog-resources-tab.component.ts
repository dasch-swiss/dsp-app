import { DecimalPipe } from '@angular/common';
import { HttpClient, HttpDownloadProgressEvent, HttpEvent, HttpEventType } from '@angular/common/http';
import { ChangeDetectorRef, Component, DestroyRef, EventEmitter, Inject, Input, Output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { BASE_PATH, ExportRequest } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { PropertyInfoValues, triggerBlobDownload } from '@dasch-swiss/vre/shared/app-common';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { RowScannerState, advanceRowScanner, initRowScanner } from './csv-row-scanner';
import { DownloadPropertyListComponent } from './download-property-list.component';

// Threshold above which an export counts as "large": this tab shows a warning before the export
// and a real X-of-N progress bar while it runs.
export const CSV_EXPORT_LARGE_THRESHOLD = 1_000;

// U+FEFF, encoded by Blob as the three-byte UTF-8 BOM (ef bb bf).
const UTF8_BOM = '﻿';

@Component({
  selector: 'app-download-dialog-properties-tab',
  standalone: true,
  imports: [
    DecimalPipe,
    DownloadPropertyListComponent,
    FormsModule,
    TranslatePipe,
    MatButton,
    MatIcon,
    MatProgressBarModule,
    MatSlideToggle,
  ],
  styles: [
    `
      /* Single column: only the property list scrolls; the footer stays pinned at the bottom. */
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
      }

      app-download-property-list {
        flex: 1;
        padding-top: 8px;
      }

      .footer {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
        padding: 12px 16px 16px;
        border-top: 1px solid #e5e7eb;
        background: #f9fafb;
      }

      .summary {
        margin: 0;
        font-size: 12px;
        line-height: 18px;
        color: #666;
      }

      .options {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      /* Label left, switch right, so the hint lines up with the label it explains. */
      .option-toggle {
        display: block;
      }

      .option-toggle ::ng-deep .mdc-form-field {
        width: 100%;
        justify-content: space-between;
        gap: 12px;
      }

      .option-toggle ::ng-deep label {
        flex: 1;
        padding: 0;
        text-align: left;
        font-size: 14px;
      }

      .option-hint {
        margin: 2px 48px 0 0;
        font-size: 12px;
        line-height: 16px;
        color: #666;
      }

      .callout {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        line-height: 18px;
      }

      .callout mat-icon {
        flex-shrink: 0;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .callout.info {
        background: #e3f2fd;
        color: #0d47a1;
      }

      .callout.warning {
        background: #fff3e0;
        color: #e65100;
      }

      .csv-export-progress {
        display: flex;
        flex-direction: column;
        gap: 6px;
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

      .actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .csv-summary {
        flex: 1;
        font-size: 13px;
        color: #666;
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
    <app-download-property-list [propertyDefinitions]="properties" (propertiesChange)="selectedPropertyIds = $event" />

    <footer class="footer">
      <!-- The export ignores the row selection and the Data tab's search and filters; say so before the click. -->
      <p class="summary" data-cy="download-scope-note">
        {{
          (selectedCount
            ? 'pages.dataBrowser.downloadDialog.scopeAllWithSelection'
            : 'pages.dataBrowser.downloadDialog.scopeAll'
          ) | translate: { count: selectedCount }
        }}
      </p>

      <div class="options">
        <div>
          <mat-slide-toggle class="option-toggle" labelPosition="before" [(ngModel)]="includeArkUrls">
            {{ 'pages.dataBrowser.downloadDialog.includeArkUrlsLabel' | translate }}
          </mat-slide-toggle>
          <p class="option-hint">{{ 'pages.dataBrowser.downloadDialog.includeArkUrlsExplanation' | translate }}</p>
        </div>
        <div>
          <mat-slide-toggle class="option-toggle" labelPosition="before" [(ngModel)]="includeResourceIris">
            {{ 'pages.dataBrowser.downloadDialog.includeIrisLabel' | translate }}
          </mat-slide-toggle>
          <p class="option-hint">{{ 'pages.dataBrowser.downloadDialog.includeIrisExplanation' | translate }}</p>
        </div>
      </div>

      @if (isDownloading) {
        <div class="callout info" role="status" aria-live="polite">
          <mat-icon>file_download</mat-icon>
          <span>{{ 'pages.dataBrowser.downloadDialog.buildingCsv' | translate }}</span>
        </div>
      } @else if (resourceCount > largeThreshold) {
        <div class="callout warning" data-cy="large-export-warning" role="alert">
          <mat-icon>warning</mat-icon>
          <span>{{ 'pages.dataBrowser.downloadDialog.largeExportWarning' | translate: { count: resourceCount } }}</span>
        </div>
      }

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

      <div class="actions">
        <span class="csv-summary" data-cy="download-csv-summary">{{
          'pages.dataBrowser.downloadDialog.csvSummary'
            | translate: { rows: resourceCount | number, columns: columnCount }
        }}</span>
        <button mat-button (click)="afterClosed.emit()" [disabled]="isDownloading">
          {{ 'ui.common.actions.cancel' | translate }}
        </button>
        <button
          mat-flat-button
          color="primary"
          data-cy="download-csv-button"
          (click)="downloadCsv()"
          [disabled]="isDownloading || selectedPropertyIds.length === 0">
          @if (isDownloading) {
            <span class="csv-export-preparing">
              <mat-icon class="csv-export-spin">autorenew</mat-icon>
              {{ 'pages.dataBrowser.downloadDialog.preparing' | translate }}
            </span>
          } @else {
            {{
              (resourceCount === 1
                ? 'pages.dataBrowser.downloadDialog.downloadOneResource'
                : 'pages.dataBrowser.downloadDialog.downloadResources'
              ) | translate: { count: resourceCount | number }
            }}
          }
        </button>
      </div>
    </footer>
  `,
})
export class DownloadDialogResourcesTabComponent {
  @Input({ required: true }) properties!: PropertyInfoValues[];
  @Input({ required: true }) resourceClassIri!: string;
  @Input({ required: true }) resourceCount!: number;
  // Checkbox-selected rows in the Data tab; the scope note says they are not what gets exported.
  @Input() selectedCount = 0;
  @Output() afterClosed = new EventEmitter<void>();
  readonly largeThreshold = CSV_EXPORT_LARGE_THRESHOLD;
  includeArkUrls = false;
  includeResourceIris = false;
  isDownloading = false;
  rowsReceived = 0;

  selectedPropertyIds: string[] = [];

  private _scannerState: RowScannerState = initRowScanner();

  constructor(
    private readonly _http: HttpClient,
    @Inject(BASE_PATH) private readonly _basePath: string,
    private readonly _localizationService: LocalizationService,
    private readonly _notificationService: NotificationService,
    private readonly _translateService: TranslateService,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _destroyRef: DestroyRef
  ) {}

  // Selected properties, plus the ARK column when it is included.
  get columnCount(): number {
    return this.selectedPropertyIds.length + (this.includeArkUrls ? 1 : 0);
  }

  get progressPercent(): number {
    if (!this.resourceCount) return 0;
    return Math.min(100, Math.round((this.rowsReceived / this.resourceCount) * 100));
  }

  downloadCsv(): void {
    this.isDownloading = true;
    this.rowsReceived = 0;
    this._scannerState = initRowScanner();

    const body: ExportRequest = {
      resourceClass: this.resourceClassIri,
      selectedProperties: this.selectedPropertyIds,
      language: this._localizationService.currentLanguage,
      includeIris: this.includeResourceIris,
      includeArkUrls: this.includeArkUrls,
    };

    // Call HttpClient directly instead of the generated APIV3ApiService: now that dsp-api streams the
    // CSV as a chunked binary body (format: binary), the generated client hardcodes responseType:'blob',
    // which would drop `partialText` and break the row counter. responseType:'text' + observe:'events' +
    // reportProgress give HttpDownloadProgressEvents whose `partialText` feeds the counter. The Bearer
    // token is added by authInterceptorFn (matches the API base path). See DEV-6462 / DEV-6336.
    this._http
      .post(`${this._basePath}/v3/export/resources`, body, {
        observe: 'events',
        reportProgress: true,
        responseType: 'text',
        headers: { Accept: 'text/csv' },
      })
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        finalize(() => {
          this.isDownloading = false;
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
    // Excel and Numbers on macOS do not auto-detect UTF-8 without a byte-order mark and fall back
    // to Mac OS Roman, rendering "für" as "f√ºr". The BOM is what tells them how to read the file.
    const blob = new Blob([UTF8_BOM + csvText], { type: 'text/csv;charset=utf-8' });
    const filename = `resources_export_${new Date().toISOString().split('T')[0]}.csv`;

    triggerBlobDownload(blob, filename);
  }
}
