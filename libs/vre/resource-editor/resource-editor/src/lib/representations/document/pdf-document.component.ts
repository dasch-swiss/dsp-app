import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReadDocumentFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { AccessTokenService } from '@dasch-swiss/vre/core/session';
import { PdfViewerComponent, PdfViewerModule } from 'ng2-pdf-viewer';
import { catchError, EMPTY } from 'rxjs';
import { RepresentationErrorMessageComponent } from '../representation-error-message.component';
import { RepresentationService } from '../representation.service';
import { PdfToolbarComponent } from './pdf-toolbar.component';

interface PdfSource {
  url: string;
  httpHeaders?: { Authorization: string };
  withCredentials: boolean;
}

@Component({
  selector: 'app-pdf-document',
  imports: [PdfViewerModule, RepresentationErrorMessageComponent, PdfToolbarComponent],
  template: `
    @if (failedToLoad) {
      <app-representation-error-message />
    } @else {
      <div #pdfContainer style="flex: 1; display: flex; flex-direction: column">
        @if (pdfSrc) {
          <pdf-viewer
            style="flex: 1"
            [src]="pdfSrc"
            [original-size]="false"
            [autoresize]="true"
            [show-all]="true"
            [show-borders]="true"
            [zoom]="zoomFactor"
            [zoom-scale]="'page-width'"
            (error)="onPdfLoadError($event)"
            (after-load-complete)="onPdfLoaded()" />
        }
        @if (pdfLoaded) {
          <app-pdf-toolbar
            [zoomFactor]="zoomFactor"
            [parentResource]="parentResource"
            [src]="src"
            (zoomChange)="onZoomChange($event)"
            (searchQuery)="onSearchQueryChange($event)"
            (fullscreenToggle)="onFullscreenToggle()"
            (downloadFile)="onDownload()" />
        }
      </div>
    }
  `,
  styles: [
    `
      :host {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
      }
    `,
  ],
})
export class PdfDocumentComponent implements OnChanges, AfterViewInit, OnDestroy {
  @Input({ required: true }) src!: ReadDocumentFileValue;
  @Input({ required: true }) parentResource!: ReadResource;

  @ViewChild(PdfViewerComponent, { static: false }) private _pdfComponent!: PdfViewerComponent;
  @ViewChild('pdfContainer', { static: false }) private _pdfContainer?: ElementRef<HTMLDivElement>;

  originalFilename = '';
  zoomFactor = 1.0;
  pdfQuery = '';
  failedToLoad = false;
  pdfLoaded = false;
  pdfSrc: PdfSource | null = null;

  private readonly _destroyRef = inject(DestroyRef);
  private _resizeObserver: ResizeObserver | null = null;

  constructor(
    private readonly _accessTokenService: AccessTokenService,
    private readonly _rs: RepresentationService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['src'] && changes['src'].currentValue) {
      this.pdfLoaded = false;
      this._setOriginalFilename();
      this._setPdfSrc();
    }
  }

  ngAfterViewInit(): void {
    this._setupResizeObserver();
  }

  ngOnDestroy(): void {
    this._cleanupResizeObserver();
    // Note: No blob URL cleanup needed - pdfSrc contains direct file URLs, not blob URLs
    // The ng2-pdf-viewer library handles its own internal resource cleanup
    this.pdfSrc = null;
  }

  onPdfLoaded() {
    this.pdfLoaded = true;
  }

  onSearchQueryChange(query: string) {
    if (!this._pdfComponent?.eventBus) {
      return;
    }
    const eventName = query !== this.pdfQuery ? 'find' : 'findagain';
    this.pdfQuery = query;
    this._pdfComponent.eventBus.dispatch(eventName, {
      query: this.pdfQuery,
      highlightAll: true,
    });
  }

  onZoomChange(newZoom: number) {
    this.zoomFactor = newZoom;
  }

  onDownload() {
    this._rs.downloadProjectFile(this.src, this.parentResource);
  }

  onFullscreenToggle() {
    if (!this._pdfComponent) {
      return;
    }

    // Use the public pdfViewerContainer property instead of accessing private element
    let elem: HTMLElement | null = null;

    // Access the public pdfViewerContainer ElementRef
    if (this._pdfComponent.pdfViewerContainer?.nativeElement) {
      elem = this._pdfComponent.pdfViewerContainer.nativeElement;
    }

    // Fallback to finding the first pdf-viewer element
    if (!elem) {
      const elements = document.getElementsByClassName('ng2-pdf-viewer-container');
      elem = elements.length > 0 ? (elements[0] as HTMLElement) : null;
    }

    // Request fullscreen if element is found and method exists
    if (elem && 'requestFullscreen' in elem && typeof elem.requestFullscreen === 'function') {
      elem.requestFullscreen();
    }
  }

  onPdfLoadError(error: unknown) {
    console.error('Failed to load PDF:', error);
    this.failedToLoad = true;
  }

  private _setOriginalFilename() {
    this.originalFilename = '';
    this._rs
      .getFileInfo(this.src.fileUrl)
      .pipe(
        takeUntilDestroyed(this._destroyRef),
        catchError(error => {
          console.error('Failed to load file info:', error);
          this.failedToLoad = true;
          return EMPTY;
        })
      )
      .subscribe(res => {
        this.originalFilename = res.originalFilename || res['originalFilename'] || '';
      });
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

  private _setupResizeObserver() {
    if (!this._pdfContainer || !this._pdfComponent) {
      return;
    }

    this._resizeObserver = new ResizeObserver(() => {
      if (this._pdfComponent?.updateSize && !this.failedToLoad) {
        setTimeout(() => {
          this._pdfComponent.updateSize();
        }, 0);
      }
    });

    this._resizeObserver.observe(this._pdfContainer.nativeElement);
  }

  private _cleanupResizeObserver() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
  }
}
