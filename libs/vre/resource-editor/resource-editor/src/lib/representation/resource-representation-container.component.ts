import { Component, Input } from '@angular/core';
import { AssetRestrictedBadgeComponent } from './asset-restricted-badge.component';

@Component({
  selector: 'app-resource-representation-container',
  host: {
    '[style.--height]': 'heightValue',
  },
  template: `
    <div class="representation-container center">
      @if (restrictedView) {
        <app-asset-restricted-badge />
      }
      <ng-content />
    </div>
  `,
  styles: [
    `
      .representation-container {
        height: var(--height);
        border-radius: 8px;
        overflow: hidden;
        background: rgb(41, 41, 41);
        color: white;
        display: flex;
        flex-direction: column;
        /* Positioning context for the asset-level restriction badge (DEV-7392). */
        position: relative;
      }
    `,
  ],
  imports: [AssetRestrictedBadgeComponent],
})
export class ResourceRepresentationContainerComponent {
  @Input() height: 'auto' | 'small' | 'big' = 'big';

  /**
   * Whether the asset shown inside this container is served in restricted (degraded) quality,
   * i.e. the *file value* — not the resource — is `RV`. See `isRestrictedFileValue` (DEV-7392).
   */
  @Input() restrictedView = false;

  get heightValue(): string {
    switch (this.height) {
      case 'auto':
        return 'auto';
      case 'small':
        return '200px';
      case 'big':
        return '900px';
      default:
        return '900px';
    }
  }
}
