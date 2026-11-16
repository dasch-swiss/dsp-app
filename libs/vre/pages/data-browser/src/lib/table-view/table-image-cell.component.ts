import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition, Overlay } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnChanges, signal } from '@angular/core';
import { RepresentationService } from '@dasch-swiss/vre/resource-editor/resource-editor';
import { TranslatePipe } from '@ngx-translate/core';
import { Observable, of, Subscription } from 'rxjs';
import { TableImage } from './table-row.model';

const OPEN_DELAY_MS = 350;
const CLOSE_DELAY_MS = 150;

/**
 * A resource's still image as a thumbnail with a larger hover preview. DSP's own images are
 * fetched, not bound to `<img src>`, because a bare `src` cannot carry the user's token and Sipi
 * would refuse a non-public image; the object URLs are released on change or destroy. The preview
 * opens on hover, focus or click (touch has no hover) and fetches its larger rendition only once.
 */
@Component({
  selector: 'app-table-image-cell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkOverlayOrigin, CdkConnectedOverlay, TranslatePipe],
  template: `
    <button
      type="button"
      class="thumbnail-button"
      cdkOverlayOrigin
      #origin="cdkOverlayOrigin"
      data-cy="image-thumbnail"
      [class.is-previewing]="isOpen()"
      [attr.aria-label]="'pages.dataBrowser.table.previewImage' | translate: { label: label() }"
      [attr.aria-expanded]="isOpen()"
      (mouseenter)="scheduleOpen()"
      (mouseleave)="scheduleClose()"
      (focus)="open()"
      (blur)="scheduleClose()"
      (click)="open()"
      (keydown.escape)="close()">
      @if (thumbnailSrc(); as source) {
        <img class="thumbnail" [src]="source" alt="" (error)="failed.set(true)" />
      }
      @if (failed()) {
        <span class="unavailable">—</span>
      }
    </button>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="origin"
      [cdkConnectedOverlayOpen]="isOpen()"
      [cdkConnectedOverlayPositions]="positions"
      [cdkConnectedOverlayScrollStrategy]="closeOnScroll"
      (overlayKeydown)="onOverlayKeydown($event)"
      (detach)="close()">
      <div
        class="preview-card"
        role="dialog"
        data-cy="image-preview"
        [attr.aria-label]="'pages.dataBrowser.table.previewImage' | translate: { label: label() }"
        (mouseenter)="cancelClose()"
        (mouseleave)="scheduleClose()">
        @if (previewSrc() ?? thumbnailSrc(); as source) {
          <img [src]="source" alt="" />
        }
      </div>
    </ng-template>
  `,
  styles: [
    `
      :host {
        display: block;
        line-height: 0;
      }
      .thumbnail-button {
        display: inline-block;
        padding: 0;
        border: none;
        background: transparent;
        cursor: zoom-in;
        border-radius: 2px;
        line-height: 0;
      }
      .thumbnail-button:focus-visible,
      .thumbnail-button.is-previewing {
        outline: 2px solid var(--mat-sys-primary, #336790);
        outline-offset: 2px;
      }
      /* Scales with the row's height. */
      .thumbnail {
        display: block;
        max-width: 100%;
        height: calc(var(--row-cap, 64px) - 8px);
        object-fit: contain;
        object-position: left center;
      }
      .unavailable {
        line-height: normal;
        color: rgba(0, 0, 0, 0.38);
      }
      .preview-card {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 312px;
        height: 344px;
        padding: 16px;
        box-sizing: border-box;
        background: #2b2b2b;
        border-radius: 8px;
        box-shadow:
          0 12px 32px rgba(15, 23, 42, 0.22),
          0 0 0 1px rgba(15, 23, 42, 0.08);
      }
      .preview-card img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
    `,
  ],
})
export class TableImageCellComponent implements OnChanges {
  readonly image = input.required<TableImage>();
  readonly label = input('');

  protected readonly thumbnailSrc = signal<string | undefined>(undefined);
  protected readonly previewSrc = signal<string | undefined>(undefined);
  protected readonly failed = signal(false);
  protected readonly isOpen = signal(false);

  protected readonly positions: ConnectedPosition[] = [
    { originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: 12 },
    { originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -12 },
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 8 },
  ];

  protected readonly closeOnScroll = inject(Overlay).scrollStrategies.close();

  private readonly _representation = inject(RepresentationService);
  private readonly _objectUrls: string[] = [];
  private readonly _requests: Subscription[] = [];
  private _loadedUrl?: string;
  private _openTimer?: ReturnType<typeof setTimeout>;
  private _closeTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this._clearTimers();
      this._release();
    });
  }

  ngOnChanges(): void {
    // A rebuilt row hands over an equal image as a new object; only a new URL is worth a download.
    if (this.image().url === this._loadedUrl) {
      return;
    }
    this._loadedUrl = this.image().url;
    this._release();
    this.failed.set(false);
    this.thumbnailSrc.set(undefined);
    this.previewSrc.set(undefined);

    this._load(this.image().url).subscribe({
      next: src => this.thumbnailSrc.set(src),
      error: () => {
        this.failed.set(true);
        // Retry the same URL on the next change.
        this._loadedUrl = undefined;
      },
    });
  }

  protected scheduleOpen(): void {
    this.cancelClose();
    if (!this.isOpen() && !this._openTimer) {
      this._openTimer = setTimeout(() => this.open(), OPEN_DELAY_MS);
    }
  }

  protected scheduleClose(): void {
    clearTimeout(this._openTimer);
    this._openTimer = undefined;
    this.cancelClose();
    this._closeTimer = setTimeout(() => this.close(), CLOSE_DELAY_MS);
  }

  protected cancelClose(): void {
    clearTimeout(this._closeTimer);
    this._closeTimer = undefined;
  }

  protected open(): void {
    this._clearTimers();
    if (this.isOpen() || this.failed()) {
      return;
    }
    this.isOpen.set(true);

    if (!this.previewSrc()) {
      this._load(this.image().previewUrl).subscribe({
        next: src => this.previewSrc.set(src),
        // The thumbnail stays in the card.
        error: () => undefined,
      });
    }
  }

  protected close(): void {
    this._clearTimers();
    this.isOpen.set(false);
  }

  protected onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close();
    }
  }

  private _load(url: string): Observable<string> {
    if (!this.image().isSipi) {
      return of(url);
    }
    return new Observable<string>(subscriber => {
      const request = this._representation.getImageBlob(url).subscribe({
        next: blob => {
          const objectUrl = URL.createObjectURL(blob);
          this._objectUrls.push(objectUrl);
          subscriber.next(objectUrl);
          subscriber.complete();
        },
        error: (error: unknown) => subscriber.error(error),
      });
      this._requests.push(request);
      return () => request.unsubscribe();
    });
  }

  private _clearTimers(): void {
    clearTimeout(this._openTimer);
    clearTimeout(this._closeTimer);
    this._openTimer = undefined;
    this._closeTimer = undefined;
  }

  private _release(): void {
    this._requests.splice(0).forEach(request => request.unsubscribe());
    this._objectUrls.splice(0).forEach(url => URL.revokeObjectURL(url));
  }
}
