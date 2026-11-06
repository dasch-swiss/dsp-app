import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/**
 * Inline notice used for permission / availability messages around a resource.
 *
 * Content projected into the `[alertAction]` slot is laid out at the trailing edge (e.g. a dismiss
 * button), so the component owns the layout and no consumer has to reach into it with `::ng-deep`.
 */
@Component({
  selector: 'app-alert-info',
  template: `
    <div class="alert" role="status">
      <mat-icon class="alert-icon">report_problem</mat-icon>
      <div class="alert-text"><ng-content /></div>
      <ng-content select="[alertAction]" />
    </div>
  `,
  styleUrls: ['./alert-info.component.scss'],
  imports: [MatIconModule],
})
export class AlertInfoComponent {}
