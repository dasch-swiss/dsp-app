import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Image-level restriction marker, overlaid on the image viewer itself.
 *
 * Shown when the image file value is `RV` (see `isRestrictedImage`), the only case in which the
 * media server delivers the image in reduced size or watermarked. Restricted view has no meaning for
 * other file types, so it is never shown for them. The resource-level banner
 * (`app-resource-restriction`) must not make this claim: a resource can be `RV` while its image is
 * served in full (DEV-7392).
 *
 * Rendered as an overlay rather than a block so it does not take height away from the player, and
 * anchored top-right because the legal panel occupies the top-left of the viewer and the media
 * toolbars sit at the bottom.
 */
@Component({
  selector: 'app-asset-restricted-badge',
  template: `
    <div
      class="badge"
      [matTooltip]="'resourceEditor.restrictedAsset.hint' | translate"
      data-cy="asset-restricted-badge">
      <mat-icon>visibility_off</mat-icon>
      <span>{{ 'resourceEditor.restrictedAsset.label' | translate }}</span>
    </div>
  `,
  styles: [
    `
      :host {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 2;
      }

      .badge {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 4px 10px 4px 8px;
        border-radius: 16px;
        /* Legible on both a dark viewer background and a light image behind it. */
        background: rgba(0, 0, 0, 0.72);
        color: #fff;
        font-size: 12px;
        line-height: 16px;
        white-space: nowrap;
        cursor: default;
      }

      mat-icon {
        font-size: 16px;
        width: 16px;
        height: 16px;
      }
    `,
  ],
  imports: [MatIconModule, MatTooltipModule, TranslatePipe],
})
export class AssetRestrictedBadgeComponent {}
