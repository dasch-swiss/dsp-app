import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { TranslatePipe } from '@ngx-translate/core';
import { AlertInfoComponent } from '../header/alert-info.component';

/**
 * Resource-level restriction notice, shown when `userHasPermission` on the *resource* is `RV`.
 *
 * Its wording must stay about the resource (hidden values) only. Asset quality is governed by the
 * file value's own permission and is surfaced on the asset viewer by `app-asset-restricted-badge`;
 * the two are independent, so a resource can be `RV` while its asset is served in full quality
 * (DEV-7392).
 */
@Component({
  selector: 'app-resource-restriction',
  template: ` @if (showRestrictedMessage) {
    <app-alert-info>
      {{ 'resourceEditor.restricted' | translate }}
      <button
        alertAction
        mat-icon-button
        type="button"
        data-cy="close-restricted-button"
        [attr.aria-label]="'ui.common.actions.close' | translate"
        (click)="showRestrictedMessage = false">
        <mat-icon>close</mat-icon>
      </button>
    </app-alert-info>
  }`,
  imports: [MatButtonModule, MatIconModule, TranslatePipe, AlertInfoComponent],
})
export class ResourceRestrictionComponent {
  showRestrictedMessage = true;
}
