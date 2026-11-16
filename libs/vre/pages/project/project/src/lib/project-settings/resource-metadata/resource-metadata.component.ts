import { ChangeDetectorRef, Component, inject, OnDestroy } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { APIV2ApiService, ExportFormat } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { AccessTokenService } from '@dasch-swiss/vre/core/session';
import { triggerBlobDownload } from '@dasch-swiss/vre/shared/app-common';
import { AppProgressIndicatorComponent } from '@dasch-swiss/vre/ui/progress-indicator';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, finalize, Subject, switchMap, takeUntil } from 'rxjs';
import { ProjectPageService } from '../../project-page.service';

// U+FEFF, encoded by Blob as the three-byte UTF-8 BOM (ef bb bf).
const UTF8_BOM = '\uFEFF';

@Component({
  selector: 'app-resource-metadata',
  templateUrl: './resource-metadata.component.html',
  styleUrl: './resource-metadata.component.scss',
  imports: [MatButton, AppProgressIndicatorComponent, TranslatePipe],
})
export class ResourceMetadataComponent implements OnDestroy {
  private readonly _reloadSubject = new BehaviorSubject<void>(undefined);
  private readonly _destroy$ = new Subject<void>();
  private _translateService = inject(TranslateService);

  readonly project$ = this._reloadSubject.asObservable().pipe(
    switchMap(() => this._projectPageService.currentProject$),
    takeUntil(this._destroy$)
  );

  isDownloadingFile = false;

  constructor(
    private readonly _ats: AccessTokenService,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _projectPageService: ProjectPageService,
    private readonly _snackBar: MatSnackBar,
    private readonly _v2ApiService: APIV2ApiService
  ) {}

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }

  exportMetadata() {
    this.project$.subscribe(project => {
      const shortcode = project.shortcode;
      if (!shortcode) throw new AppError('Project shortcode is not available.');

      this._getResourceMetadata(shortcode, ExportFormat.Csv);
    });
  }

  private _getResourceMetadata(shortcode: string, format: ExportFormat) {
    this.isDownloadingFile = true;

    const classIris: string[] | undefined = undefined;

    this._v2ApiService
      .getV2MetadataProjectsProjectshortcodeResources(shortcode, format, classIris, undefined, false, {
        httpHeaderAccept: 'text/plain',
      })
      .pipe(
        takeUntil(this._destroy$),
        finalize(() => {
          this.isDownloadingFile = false;
          this._cdr.detectChanges();
        })
      )
      .subscribe(
        response => {
          this._showSuccess(
            this._translateService.instant('pages.project.resourceMetadata.downloadSuccess', { shortcode })
          );
          setTimeout(() => {
            this._handleDownload(response, shortcode, format);
          }, 1000);
        },
        error => {
          this._showError(
            this._translateService.instant('pages.project.resourceMetadata.downloadErrorWithMessage', {
              shortcode,
              errorMessage: error.message,
            })
          );
        }
      );
  }

  private _handleDownload(response: string, shortcode: string, format: ExportFormat): void {
    // Excel and Numbers on macOS do not auto-detect UTF-8 without a byte-order mark and fall back
    // to Mac OS Roman, rendering "für" as "f√ºr". JSON is excluded: a BOM breaks strict parsers.
    const isJson = format.toLowerCase() === 'json';
    const body = isJson ? response : UTF8_BOM + response;
    const blob = new Blob([body], { type: this._getMimeType(format) });
    const filename = `project_${shortcode}_metadata.${this._getFileExtension(format)}`;

    triggerBlobDownload(blob, filename);
  }

  private _getMimeType(format: string): string {
    switch (format.toLowerCase()) {
      case 'csv':
        return 'text/csv;charset=utf-8';
      case 'tsv':
        return 'text/tab-separated-values;charset=utf-8';
      case 'json':
        return 'application/json';
      default:
        return 'text/plain;charset=utf-8';
    }
  }

  private _getFileExtension(format: string): string {
    const extension = format.toLocaleLowerCase();
    switch (extension) {
      case 'csv':
      case 'tsv':
      case 'json':
        return extension;
      default:
        return 'txt';
    }
  }

  private _showSuccess(message: string): void {
    this._snackBar.open(message, 'x', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  private _showError(message: string): void {
    this._snackBar.open(message, 'x', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar'],
    });
  }
}
