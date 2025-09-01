import { HttpResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExportFormat, V2MetadataApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { AccessTokenService } from '@dasch-swiss/vre/core/session';
import { BehaviorSubject, finalize, Subject, switchMap, takeUntil } from 'rxjs';
import { ProjectPageService } from '../../project-page.service';

@Component({
  selector: 'app-resource-metadata',
  templateUrl: './resource-metadata.component.html',
  styleUrl: './resource-metadata.component.scss',
})
export class ResourceMetadataComponent implements OnDestroy {
  private readonly _reloadSubject = new BehaviorSubject<void>(undefined);
  private readonly _destroy$ = new Subject<void>();

  readonly project$ = this._reloadSubject.asObservable().pipe(
    switchMap(() => this._projectPageService.currentProject$),
    takeUntil(this._destroy$)
  );

  isDownloadingFile = false;

  constructor(
    private _ats: AccessTokenService,
    private _cdr: ChangeDetectorRef,
    private _ms: V2MetadataApiService,
    private _snackBar: MatSnackBar,
    private _projectPageService: ProjectPageService
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

    const mimeType = this._getMimeType(format);
    const classIris: string[] | undefined = undefined;
    const authToken = this._ats.getAccessToken() ?? undefined;

    this._ms
      .getV2MetadataProjectsProjectshortcodeResources(shortcode, authToken, format, classIris, 'response', false, {
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
        (response: HttpResponse<string>) => {
          if (response.status === 200) {
            this._showSuccess(`Metadata for project ${shortcode} downloaded successfully.`);
            setTimeout(() => {
              this._handleDownload(response, shortcode, mimeType);
            }, 1000);
          } else {
            this._showError(`Failed to download metadata for project ${shortcode}.`);
          }
        },
        error => {
          this._showError(`Error downloading metadata for project ${shortcode}: ${error.message}`);
        }
      );
  }

  private _handleDownload(response: HttpResponse<string>, shortcode: string, mimeType: string): void {
    const blob = new Blob([response.body], { type: mimeType });
    const filename = `project_${shortcode}_metadata`;

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }

  private _getMimeType(format: string): string {
    switch (format.toLowerCase()) {
      case 'csv':
        return 'text/csv';
      case 'tsv':
        return 'text/tab-separated-values';
      case 'json':
        return 'application/json';
      default:
        return 'text/plain';
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
