import { Component } from '@angular/core';
import { RouteConstants } from '@dasch-swiss/vre/core/config';

@Component({
  selector: 'app-header-user-actions',
  template: `
    <span style="display: flex; align-items: center; gap: 8px">
      <app-version-badge />
      <a mat-button [routerLink]="['/', HELP_LINK]">{{ 'ui.header.help' | translate }}</a>
      <app-user-menu />
    </span>
  `,
  standalone: false,
})
export class HeaderUserActionsComponent {
  HELP_LINK = RouteConstants.help;
}
