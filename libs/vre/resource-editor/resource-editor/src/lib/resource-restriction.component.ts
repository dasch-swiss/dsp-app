import { Component } from '@angular/core';

@Component({
  selector: 'app-resource-restriction',
  template: ` <div *ngIf="showRestrictedMessage">
    <app-alert-info>
      <p>
        {{ 'resourceEditor.restricted' | translate }}
      </p>
      <mat-icon class="close" data-cy="close-restricted-button" (click)="showRestrictedMessage = false"
        >clear
      </mat-icon>
    </app-alert-info>
  </div>`,
})
export class ResourceRestrictionComponent {
  showRestrictedMessage = true;
}
