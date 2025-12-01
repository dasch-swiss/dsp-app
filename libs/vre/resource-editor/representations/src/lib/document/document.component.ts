import {
  ChangeDetectorRef,
  Component,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Constants, ReadDocumentFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { DspDialogConfig } from '@dasch-swiss/vre/core/config';
import { AccessTokenService } from '@dasch-swiss/vre/core/session';
import { TranslateService } from '@ngx-translate/core';
import { PdfViewerComponent } from 'ng2-pdf-viewer';
import {
  ReplaceFileDialogComponent,
  ReplaceFileDialogProps,
} from '../replace-file-dialog/replace-file-dialog.component';
import { RepresentationService } from '../representation.service';
import { ResourceFetcherService } from '../resource-fetcher.service';

@Component({
  selector: 'app-document',
  templateUrl: './document.component.html',
  styleUrls: ['./document.component.scss'],
  standalone: false,
})
export class DocumentComponent implements OnChanges {
  @Input({ required: true }) src!: ReadDocumentFileValue;
  @Input({ required: true }) parentResource!: ReadResource;

  @ViewChild(PdfViewerComponent) private _pdfComponent!: PdfViewerComponent;

  originalFilename = '';

  zoomFactor = 1.0;

  pdfQuery = '';

  failedToLoad = false;

  pdfSrc: { url: string; httpHeaders?: { Authorization: string }; withCredentials: boolean } | null = null;

  private readonly _translateService = inject(TranslateService);

  get isPdf(): boolean {
    return this.src.filename.split('.').pop() === 'pdf';
  }

  constructor(
    private readonly _accessTokenService: AccessTokenService,
    private readonly _cd: ChangeDetectorRef,
    private readonly _dialog: MatDialog,
    private readonly _rs: RepresentationService,
    private readonly _viewContainerRef: ViewContainerRef,
    public resourceFetcherService: ResourceFetcherService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src'] && changes['src'].currentValue) {
      this._setOriginalFilename();
      this._setPdfSrc();
    }
  }

  onInputChange(event: Event) {
    this.searchQueryChanged((event.target as HTMLInputElement).value);
  }

  searchQueryChanged(newQuery: string) {
    const eventName = newQuery !== this.pdfQuery ? 'find' : 'findagain';
    this.pdfQuery = newQuery;
    this._pdfComponent.eventBus.dispatch(eventName, {
      query: this.pdfQuery,
      highlightAll: true,
    });
  }

  download() {
    this._rs.downloadProjectFile(this.src, this.parentResource);
  }

  openReplaceFileDialog() {
    this._dialog.open<ReplaceFileDialogComponent, ReplaceFileDialogProps>(ReplaceFileDialogComponent, {
      ...DspDialogConfig.mediumDialog({
        title: this._translateService.instant('resourceEditor.representations.document.title'),
        subtitle: this._translateService.instant('resourceEditor.representations.document.updateFile'),
        representation: Constants.HasDocumentFileValue,
        resource: this.parentResource,
      }),
      viewContainerRef: this._viewContainerRef,
    });
  }

  openFullscreen() {
    const elem = document.getElementsByClassName('pdf-viewer')[0];
    elem?.requestFullscreen?.();
  }

  zoom(mod: -1 | 1) {
    const newZoom = Math.round((this.zoomFactor + mod * 0.2) * 100) / 100;
    this.zoomFactor = newZoom <= 0 ? 0.2 : newZoom;
  }

  onPdfLoadError(_error: unknown) {
    this.failedToLoad = true;
  }

  private _setOriginalFilename() {
    this.originalFilename = '';
    this._rs.getFileInfo(this.src.fileUrl).subscribe(
      res => {
        this.originalFilename = res['originalFilename'] || '';
        this._cd.detectChanges();
      },
      () => {
        // error already handled by getFileInfo
        this.failedToLoad = true;
      }
    );
  }

  private _setPdfSrc() {
    // Only set pdfSrc if it hasn't been set yet or if the URL has changed
    if (!this.pdfSrc || this.pdfSrc.url !== this.src.fileUrl) {
      const authToken = this._accessTokenService.getAccessToken();
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : undefined;

      this.pdfSrc = {
        url: this.src.fileUrl,
        ...(headers && { httpHeaders: headers }),
        withCredentials: true,
      };
    }
  }
}
