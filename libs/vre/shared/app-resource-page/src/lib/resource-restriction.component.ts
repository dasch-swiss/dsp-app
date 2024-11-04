import { Component } from '@angular/core';

@Component({
  selector: 'app-resource-restriction',
  template: ` <div class="restricted-message" *ngIf="showRestrictedMessage">
    <mat-icon>report_problem</mat-icon>
    <p>This resource is restricted, file representations may be of lower quality and some properties may be hidden.</p>
    <mat-icon class="close" (click)="showRestrictedMessage = false">clear</mat-icon>
  </div>`,
  styleUrls: ['./resource-restriction.component.scss'],
})
export class ResourceRestrictionComponent {
  showRestrictedMessage = true;
}
