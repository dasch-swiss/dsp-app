import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import type { ReadRegionPreviewValue } from '@dasch-swiss/dsp-js';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { AdminAPIApiService, ProjectLicenseDto } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { CenteredMessageComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { switchMap, take } from 'rxjs';
// Direct relative imports (NOT the lib barrel) for same-lib components to avoid the intra-lib DI cycle.
import { AlertInfoComponent } from '../../../../header/alert-info.component';
import { ResourceExplorerButtonComponent } from '../../../resource-explorer-button.component';
import { ResourceFetcherService } from '../../../../representation/resource-fetcher.service';

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
  imports: [TranslatePipe, MatIconModule, CenteredMessageComponent, AlertInfoComponent, ResourceExplorerButtonComponent],
  template: `
    <div class="card">
      @if (!value.cropUrl) {
        <!-- Non-rectangle geometry: the API emits no crop. Guard cropUrl FIRST — before any <img> — so a
             null src never false-fires (error) and mis-renders as restricted. -->
        <app-centered-message icon="hide_image" [message]="'resourceEditor.regionPreview.cannotDisplay' | translate" />
      } @else if (imageFailed) {
        <app-alert-info>
          <p>{{ 'resourceEditor.restricted' | translate }}</p>
        </app-alert-info>
      } @else {
        <!-- Media row: full-page thumbnail (constant width) on the left, the region crop on the right. -->
        <div class="media">
          @if (value.thumbnailUrl) {
            <div class="thumb-box">
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
            </div>
          }
          <div class="crop-box">
            <img [src]="value.cropUrl" (error)="onImageError()" class="crop" alt="" />
          </div>
        </div>
      }

      <div class="footer">
        <!-- One label/value grid: the source caption and the legal rows share the same columns, so the
             source link lines up with the legal values (one consistent box). -->
        <div class="meta-grid">
          <span class="legal-label">
            <mat-icon class="cap-icon">crop_free</mat-icon>
            {{ 'resourceEditor.regionPreview.annotationFrom' | translate }}
          </span>
          <span class="legal-value">
            <a class="cap-link" [href]="fullImageLink" target="_blank">{{
              value.fullImageLabel || value.fullImageIri
            }}</a>
            <app-resource-explorer-button [resourceIri]="value.fullImageIri" />
          </span>

          @if (value.copyrightHolder) {
            <span class="legal-label">{{ 'resourceEditor.legal.copyrightHolder' | translate }}</span>
            <span class="legal-value">{{ value.copyrightHolder }}</span>
          }
          @if (value.authorship?.length) {
            <span class="legal-label">{{ 'resourceEditor.legal.authorship' | translate }}</span>
            <span class="legal-value">{{ value.authorship.join(', ') }}</span>
          }
          @if (resolvedLicense) {
            <span class="legal-label">{{ 'resourceEditor.legal.license' | translate }}</span>
            <span class="legal-value">
              <a class="license-pill" [href]="resolvedLicense.uri" target="_blank">{{ resolvedLicense.labelEn }}</a>
            </span>
          }
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .card {
        border: 1px solid #d6e0e8;
        border-radius: 4px;
        overflow: hidden;
        background: #fff;
      }

      /* Media row: constant-width full-page thumbnail on the left, region crop (centered on a beige
         backdrop) on the right; the thumbnail is vertically centered next to a taller crop. */
      .media {
        display: flex;
      }

      .thumb-box {
        flex: 0 0 96px;
        border-right: 1px solid #e5e7eb;
        background: #fff;
        padding: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .thumb-wrap {
        position: relative;
        width: 100%;
      }

      .thumb {
        display: block;
        width: 100%;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.28);
      }

      .crop-box {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #fff; /* padding around the crop is white (same as the app), not part of the image */
      }

      .crop {
        display: block;
        max-width: 100%;
        max-height: 400px; /* max preview size — a long preview can't dominate the screen */
        object-fit: contain;
      }

      .highlight {
        position: absolute;
        border: 2px solid #d32f2f;
        box-sizing: border-box;
        pointer-events: none;
      }

      .footer {
        padding: 9px 12px;
        background: #f9fafb;
        border-top: 1px solid #e5e7eb;
        color: #656a70;
      }

      /* Source caption + legal rows in one grid, so all values align in the second column. */
      .meta-grid {
        display: grid;
        grid-template-columns: auto 1fr;
        column-gap: 20px;
        row-gap: 5px;
        align-items: center;
        font-size: 12px;
      }

      .legal-label {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
        color: #5b5f66;
      }

      .legal-value {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: #6b7280;
      }

      .cap-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }

      .cap-link {
        color: #336790;
        text-decoration: none;
      }

      /* The shared explorer button is tuned for the link viewer (a -15px lift over a 0-height host).
         Neutralize that here so it sits inline right after the source link, centered on the row,
         and shrink its state layer so it hugs the icon instead of carrying icon-button padding. */
      .legal-value ::ng-deep app-resource-explorer-button {
        display: inline-flex;
        align-items: center;
        height: auto;
      }

      .legal-value ::ng-deep app-resource-explorer-button button {
        position: static !important;
        --mdc-icon-button-state-layer-size: 24px;
        width: 24px;
        height: 24px;
        padding: 0;
      }

      .license-pill {
        display: inline-flex;
        align-items: center;
        border: 1px solid #9ca3af;
        border-radius: 3px;
        padding: 0 6px;
        font-weight: 600;
        color: #6b7280;
        font-size: 11px;
        text-decoration: none;
      }
    `,
  ],
})
export class RegionPreviewViewerComponent implements OnChanges, OnInit {
  @Input({ required: true }) value!: ReadRegionPreviewValue;
  imageFailed = false;

  // The value carries only the license IRI (License.id); the human-readable label + uri come from the
  // project's license list, fetched once. Same mechanism as ResourceLegalComponent.
  private _licenses: ProjectLicenseDto[] = [];

  constructor(
    private readonly _resourceService: ResourceService,
    private readonly _adminApiService: AdminAPIApiService,
    private readonly _resourceFetcher: ResourceFetcherService,
    private readonly _cd: ChangeDetectorRef
  ) {}

  ngOnChanges() {
    this.imageFailed = false; // a new value gets a fresh image-load attempt (no stale restricted latch)
  }

  ngOnInit() {
    this._resourceFetcher.projectShortcode$
      .pipe(
        switchMap(shortcode =>
          this._adminApiService.getAdminProjectsShortcodeProjectshortcodeLegalInfoLicenses(shortcode)
        ),
        take(1)
      )
      .subscribe(data => {
        this._licenses = data.data;
        this._cd.markForCheck(); // OnPush: the async result must trigger a view update
      });
  }

  // Returns a stable DTO reference (value-equal across CD passes) → safe under OnPush.
  get resolvedLicense() {
    return this._licenses.find(license => license.id === this.value.license?.id);
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
