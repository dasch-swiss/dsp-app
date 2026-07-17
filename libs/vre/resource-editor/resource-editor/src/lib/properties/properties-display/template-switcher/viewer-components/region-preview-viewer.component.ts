import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import type { ReadFileValue, ReadRegionPreviewValue } from '@dasch-swiss/dsp-js';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { CenteredMessageComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
// Direct relative imports (NOT the lib barrel) for same-lib components to avoid the intra-lib DI cycle.
import { AlertInfoComponent } from '../../../../header/alert-info.component';
import { ResourceLegalComponent } from '../../../../representation/resource-legal.component';

/**
 * Renders a RegionPreviewValue: the region crop image, the full-page thumbnail with a static
 * percentage highlight box, the source caption + navigate-to-full-image, and the legal footer.
 * No OpenSeadragon and no geometry math — the highlight box is drawn directly from the served
 * percentages. Three mutually exclusive image states:
 *  - cannot-display: the API emits no crop for non-rectangle geometry (cropUrl == null)
 *  - restricted: the user cannot view the full image, so Sipi denies the pixels and <img> fails
 *  - normal: crop + thumbnail + highlight box
 * Caption and legal footer render in all states (metadata is always available for a value-visible user).
 */
@Component({
  selector: 'app-region-preview-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, MatIconModule, CenteredMessageComponent, AlertInfoComponent, ResourceLegalComponent],
  template: `
    @if (!value.cropUrl) {
      <!-- Non-rectangle geometry: the API emits no crop. Guard cropUrl FIRST — before any <img> — so a
           null src never false-fires (error) and mis-renders as restricted. -->
      <app-centered-message icon="hide_image" [message]="'resourceEditor.regionPreview.cannotDisplay' | translate" />
    } @else if (imageFailed) {
      <app-alert-info>
        <p>{{ 'resourceEditor.restricted' | translate }}</p>
      </app-alert-info>
    } @else {
      <img [src]="value.cropUrl" (error)="onImageError()" class="crop" alt="" />
      @if (value.thumbnailUrl) {
        <div class="thumb-wrap">
          <img [src]="value.thumbnailUrl" (error)="onImageError()" class="thumb" alt="" />
          @if (hasBox) {
            <div
              class="highlight"
              [style.left.%]="value.highlightBoxX"
              [style.top.%]="value.highlightBoxY"
              [style.width.%]="value.highlightBoxW"
              [style.height.%]="value.highlightBoxH"></div>
          }
        </div>
      }
    }

    <div class="caption">
      <a [href]="fullImageLink" target="_blank">{{ value.fullImageLabel || value.fullImageIri }}</a>
      <a [href]="fullImageLink" target="_blank" aria-label="open full image">
        <mat-icon>arrow_forward</mat-icon>
      </a>
    </div>

    @if (hasLegal) {
      <app-resource-legal [fileValue]="legalFileValue" />
    }
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .crop {
        display: block;
        margin: 0 auto;
        max-width: 100%;
        max-height: 400px; /* max preview size — a tall preview can't dominate the screen */
        object-fit: contain;
        background: #fff; /* all padding white */
      }

      .thumb-wrap {
        position: relative;
        display: inline-block;
        margin-top: 8px;
        background: #fff;
      }

      .thumb {
        display: block;
        max-width: 100%;
        max-height: 400px; /* constant thumbnail size regardless of crop size */
        width: auto;
      }

      .highlight {
        position: absolute;
        border: 2px solid #d32f2f;
        box-sizing: border-box;
        pointer-events: none;
      }

      .caption {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 8px;
      }
    `,
  ],
})
export class RegionPreviewViewerComponent implements OnInit {
  @Input({ required: true }) value!: ReadRegionPreviewValue;
  imageFailed = false;

  // Computed ONCE in ngOnInit — a getter returning a fresh object literal each call breaks OnPush:
  // Angular's dev-mode second CD pass compares [fileValue] by reference and throws
  // ExpressionChangedAfterItHasBeenCheckedError (and defeats OnPush memoization).
  // ResourceLegalComponent only reads copyrightHolder/authorship/license, so the structurally-overlapping
  // object is assignable to ReadFileValue via a targeted assertion (no `any`).
  legalFileValue!: ReadFileValue;

  constructor(private readonly _resourceService: ResourceService) {}

  ngOnInit() {
    this.legalFileValue = {
      copyrightHolder: this.value.copyrightHolder,
      authorship: this.value.authorship,
      license: this.value.license,
    } as ReadFileValue;
  }

  // These getters return primitives (value-equal across CD passes) → safe under OnPush.
  get fullImageLink() {
    return `/resource${this._resourceService.getResourcePath(this.value.fullImageIri)}`;
  }

  get hasBox() {
    return (
      this.value.highlightBoxX != null &&
      this.value.highlightBoxY != null &&
      this.value.highlightBoxW != null &&
      this.value.highlightBoxH != null
    );
  }

  get hasLegal() {
    return !!(this.value.copyrightHolder || this.value.authorship?.length || this.value.license);
  }

  onImageError() {
    this.imageFailed = true;
  }
}
