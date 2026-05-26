import { HttpClient, HttpDownloadProgressEvent, HttpEventType } from '@angular/common/http';
import { ChangeDetectorRef, Component, EventEmitter, Inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialogActions } from '@angular/material/dialog';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BASE_PATH } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { LoadingButtonDirective } from '@dasch-swiss/vre/ui/progress-indicator';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { RowScannerState, advanceRowScanner, initRowScanner } from './csv-row-scanner';
import { DownloadPropertyListComponent } from './download-property-list.component';

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
    LoadingButtonDirective,
    MatProgressBarModule,
  ],
  template: `
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
      <div class="csv-export-progress" role="status" aria-live="polite">
        <mat-progress-bar mode="determinate" [value]="progressPercent"></mat-progress-bar>
        <span>{{
          'pages.dataBrowser.downloadDialog.progressXofN' | translate: { x: rowsReceived, n: resourceCount }
        }}</span>
      </div>
    }

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
  @Input({ required: true }) resourceCount!: number;
  @Output() afterClosed = new EventEmitter<void>();
  readonly largeThreshold = 1_000;
  includeArkUrls = false;
  includeResourceIris = false;
  isDownloading = false;
  rowsReceived = 0;

  selectedPropertyIds: string[] = [];

  private _scannerState: RowScannerState = initRowScanner();

  // Hand-rolled HttpClient call (not APIV3ApiService) because the generated client
  // does not expose `reportProgress: true` / `observe: 'events'`, which are required
  // to derive real X-of-N progress from the streamed CSV body. See DEV-6462 / DEV-6336.
  constructor(
    private readonly _http: HttpClient,
    @Inject(BASE_PATH) private readonly _basePath: string,
    private _localizationService: LocalizationService,
    private _notificationService: NotificationService,
    private _translateService: TranslateService,
    private _cdr: ChangeDetectorRef
  ) {}

  get progressPercent(): number {
    if (!this.resourceCount) return 0;
    return Math.min(100, Math.round((this.rowsReceived / this.resourceCount) * 100));
  }

  downloadCsv(): void {
    this.isDownloading = true;
    this.rowsReceived = 0;
    this._scannerState = initRowScanner();

    const body = {
      resourceClass: this.resourceClassIri,
      selectedProperties: this.selectedPropertyIds,
      language: this._localizationService.getCurrentLanguage(),
      includeIris: this.includeResourceIris,
      includeArkUrls: this.includeArkUrls,
    };

    this._http
      .post(`${this._basePath}/v3/export/resources`, body, {
        reportProgress: true,
        observe: 'events' as const,
        responseType: 'text' as const,
        headers: { Accept: 'text/csv' },
      })
      .pipe(
        finalize(() => {
          this.isDownloading = false;
          this.rowsReceived = 0;
          this._cdr.markForCheck();
        })
      )
      .subscribe({
        next: event => {
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
