import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { AlertInfoComponent } from './alert-info.component';

@Component({
  selector: 'app-resource-restriction',
  template: ` @if (showRestrictedMessage) {
    <div>
      <app-alert-info>
        <p>
          {{ 'resourceEditor.restricted' | translate }}
        </p>
        <mat-icon class="close" data-cy="close-restricted-button" (click)="showRestrictedMessage = false"
          >clear
        </mat-icon>
      </app-alert-info>
    </div>
  }`,
  imports: [MatIconModule, TranslateModule, AlertInfoComponent],
})
export class ResourceRestrictionComponent {
  showRestrictedMessage = true;
}
