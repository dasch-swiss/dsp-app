import { Component } from '@angular/core';

@Component({
  selector: 'app-alert-info',
  template: ` <div class="restricted-message">
    <mat-icon>report_problem</mat-icon>
    <ng-content></ng-content>
  </div>`,
  styleUrls: ['./alert-info.component.scss'],
})
export class AlertInfoComponent {}
