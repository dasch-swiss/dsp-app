import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-alert-info',
  template: ` <div class="restricted-message">
    <mat-icon>report_problem</mat-icon>
    <ng-content />
  </div>`,
  styleUrls: ['./alert-info.component.scss'],
  standalone: true,
  imports: [MatIconModule],
})
export class AlertInfoComponent {}
