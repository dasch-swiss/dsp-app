import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import type { ReadRegionPreviewValue } from '@dasch-swiss/dsp-js';
import { AdminAPIApiService, ProjectLicenseDto } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { TranslatePipe } from '@ngx-translate/core';
import { forkJoin, Subscription, switchMap, take } from 'rxjs';
// Direct relative imports (NOT the lib barrel) for same-lib components to avoid the intra-lib DI cycle.
import { AlertInfoComponent } from '../../../../header/alert-info.component';
import { RepresentationService } from '../../../../representation/representation.service';
import { ResourceFetcherService } from '../../../../representation/resource-fetcher.service';
import { ResourceExplorerButtonComponent } from '../../../resource-explorer-button.component';

/**
 * Renders a RegionPreviewValue: the region crop image, the full-page thumbnail with the region
 * highlighted, the caption (a subdued image label for context + the region as the navigable target),
 * and the legal footer. No OpenSeadragon and no geometry math — the region is highlighted directly
 * from the served percentages: the whole page is darkened + desaturated and only the region rectangle
 * is revealed at normal brightness (no drawn box). The API always returns a crop, so there are two
 * image states:
 *  - restricted: Sipi denies the pixels (the authenticated fetch errors), so the crop cannot be shown
 *  - normal: crop + thumbnail with the region highlighted
 * The crop/thumbnail are fetched with the user's JWT and rendered as blob: URLs — a bare <img> cannot
 * carry the token (see RepresentationService.getImageBlob). Caption and legal footer render in both
 * states (metadata is always available for a value-visible user).
 */
@Component({
  selector: 'app-region-preview-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslatePipe, MatIconModule, AlertInfoComponent, ResourceExplorerButtonComponent],
  template: `
    <div class="card">
      @if (imageFailed) {
        <!-- The API always returns a crop; the only non-normal state is the media server denying the pixels. -->
        <app-alert-info>
          <p>{{ 'resourceEditor.restricted' | translate }}</p>
        </app-alert-info>
      } @else if (cropSrc) {
        <!-- Media row: full-page thumbnail (constant width) on the left, the region crop on the right.
             src is a blob: URL from the authenticated fetch so the JWT reaches Sipi; while the fetch is
             in flight (no cropSrc yet, not failed) this block is blank. -->
        <div class="media">
          @if (thumbnailSrc) {
            <div class="thumb-box">
              <div class="thumb-wrap">
                <!-- Base layer: the whole page. When a region rectangle is served it is darkened +
                     desaturated so the region stands out by contrast (no drawn box). -->
                <img [src]="thumbnailSrc" class="thumb" [class.thumb--dimmed]="hasBox" alt="" />
                @if (hasBox) {
                  <!-- Overlay: the same page at normal brightness, clipped to just the region rectangle. -->
                  <img
                    [src]="thumbnailSrc"
                    class="thumb thumb--region"
                    [style.clip-path]="regionClip"
                    alt=""
                    aria-hidden="true" />
                }
              </div>
            </div>
          }
          <div class="crop-box">
            <img [src]="cropSrc" class="crop" alt="" />
          </div>
        </div>
      }

      <div class="footer">
        <!-- One label/value grid: the source caption and the legal rows share the same columns, so the
             source link lines up with the legal values (one consistent box). -->
        <div class="meta-grid">
          <span class="legal-label">
            <mat-icon class="cap-icon">crop_free</mat-icon>
            {{ 'resourceEditor.regionPreview.annotation' | translate }}
          </span>
          <span class="legal-value cap-value">
            <!-- Subdued image label = plain context (which page it is from); the region is the emphasized,
                 navigable target — both the label and the arrow open the region page. -->
            <span class="cap-image">{{ value.fullImageLabel || value.fullImageIri }}</span>
            <span class="cap-sep" aria-hidden="true">—</span>
            <a class="cap-link cap-region" [href]="regionLink" target="_blank">{{
              value.regionLabel || value.regionIri
            }}</a>
            <app-resource-explorer-button [resourceIri]="value.regionIri" />
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

      /* Media row: constant-width full-page thumbnail on the left, region crop (centered on a black
         backdrop) on the right; the thumbnail is vertically centered next to a taller crop. The
         thumbnail and crop sit on one black panel, separated by a slim grey hairline that marks the
         (otherwise invisible) boundary between them. */
      .media {
        display: flex;
      }

      .thumb-box {
        flex: 0 0 96px;
        background: #000;
        padding: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        /* Slim grey hairline marking the seam between the thumbnail and the crop (both are #000, so
           without it the boundary is invisible). Full-height: the flex row stretches this box. */
        border-right: 1px solid #3a3f45;
      }

      .thumb-wrap {
        position: relative;
        width: 100%;
      }

      .thumb {
        display: block;
        width: 100%;
      }

      /* Region highlight: darken (~48%) + desaturate the whole page. The region itself is revealed
         at normal brightness by the .thumb--region overlay clipped to the region rectangle. */
      .thumb--dimmed {
        filter: brightness(0.52) saturate(0.3);
      }

      .thumb--region {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        pointer-events: none;
      }

      .crop-box {
        flex: 1;
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #000;
        /* Slim black margin around the crop: keeps a little black visible even when the crop fills the
           box (same padding technique as .thumb-box, which uses 8px). */
        padding: 6px;
      }

      .crop {
        display: block;
        max-width: 100%;
        max-height: 400px; /* max preview size — a long preview can't dominate the screen */
        object-fit: contain;
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

      /* Caption row: subdued image label (context) — separator — emphasized region link (target). */
      .cap-value {
        min-width: 0; /* let the image label truncate instead of overflowing the row */
      }

      .cap-image {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        /* Same grey/size as the legal values (.legal-value) so the caption reads as ordinary metadata;
           the region link stays emphasized on its own via bold + link colour. */
        color: #6b7280;
      }

      .cap-sep {
        flex: 0 0 auto;
        color: #6b7280; /* same grey as the label + legal values */
      }

      .cap-region {
        flex: 0 0 auto;
        font-weight: 600; /* emphasized: the region is the primary, navigable target */
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
export class RegionPreviewViewerComponent implements OnChanges, OnDestroy, OnInit {
  @Input({ required: true }) value!: ReadRegionPreviewValue;
  imageFailed = false;

  // blob: object URLs from the authenticated fetch; null while in flight (media row stays blank).
  cropSrc: string | null = null;
  thumbnailSrc: string | null = null;
  private _imgSub?: Subscription;

  // The value carries only the license IRI (License.id); the human-readable label + uri come from the
  // project's license list, fetched once. Same mechanism as ResourceLegalComponent.
  private _licenses: ProjectLicenseDto[] = [];

  constructor(
    private readonly _resourceService: ResourceService,
    private readonly _adminApiService: AdminAPIApiService,
    private readonly _resourceFetcher: ResourceFetcherService,
    private readonly _representationService: RepresentationService,
    private readonly _cd: ChangeDetectorRef
  ) {}

  ngOnChanges() {
    // a new value gets a fresh image-load attempt: release the old blobs, cancel any in-flight fetch,
    // and reset the restricted latch before re-fetching.
    this._revokeUrls();
    this._imgSub?.unsubscribe();
    this.imageFailed = false;
    this.cropSrc = null;
    this.thumbnailSrc = null;

    if (!this.value.cropUrl) {
      this.imageFailed = true;
      return;
    }

    this._imgSub = forkJoin({
      crop: this._representationService.getImageBlob(this.value.cropUrl),
      ...(this.value.thumbnailUrl ? { thumb: this._representationService.getImageBlob(this.value.thumbnailUrl) } : {}),
    }).subscribe({
      next: ({ crop, thumb }) => {
        this.cropSrc = URL.createObjectURL(crop);
        if (thumb) {
          this.thumbnailSrc = URL.createObjectURL(thumb);
        }
        this._cd.markForCheck(); // OnPush: the async result must trigger a view update
      },
      error: () => {
        // Any failure (Sipi denies the pixels for a resource this user can't view, or a transport error)
        // falls back to the restricted card — same outcome the bare <img> (error) handler produced before.
        this.imageFailed = true;
        this._cd.markForCheck();
      },
    });
  }

  ngOnDestroy() {
    this._imgSub?.unsubscribe();
    this._revokeUrls();
  }

  private _revokeUrls() {
    if (this.cropSrc) {
      URL.revokeObjectURL(this.cropSrc);
    }
    if (this.thumbnailSrc) {
      URL.revokeObjectURL(this.thumbnailSrc);
    }
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
  // The caption's navigable target is the region itself (label + arrow), not the full image.
  get regionLink() {
    return `/resource${this._resourceService.getResourcePath(this.value.regionIri)}`;
  }

  get hasBox() {
    return (
      this.value.highlightBoxX != null &&
      this.value.highlightBoxY != null &&
      this.value.highlightBoxW != null &&
      this.value.highlightBoxH != null
    );
  }

  // clip-path inset() that reveals only the region rectangle (percentages of the thumbnail). It punches
  // the normal-brightness region window through the darkened + desaturated base layer.
  // inset(top right bottom left): top=Y, right=100-(X+W), bottom=100-(Y+H), left=X; clamped at 0.
  get regionClip(): string | null {
    if (!this.hasBox) {
      return null;
    }
    const top = this.value.highlightBoxY!;
    const left = this.value.highlightBoxX!;
    const right = Math.max(0, 100 - (this.value.highlightBoxX! + this.value.highlightBoxW!));
    const bottom = Math.max(0, 100 - (this.value.highlightBoxY! + this.value.highlightBoxH!));
    return `inset(${top}% ${right}% ${bottom}% ${left}%)`;
  }

  get hasLegal() {
    return !!(this.value.copyrightHolder || this.value.authorship?.length || this.value.license);
  }
}
