import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { TranslateModule } from '@ngx-translate/core';
import { UserMenuComponent } from './user-menu/user-menu.component';
import { VersionBadgeComponent } from './version-badge.component';

@Component({
  selector: 'app-header-user-actions',
  imports: [MatButtonModule, RouterModule, TranslateModule, VersionBadgeComponent, UserMenuComponent],
  template: `
    <span style="display: flex; align-items: center; gap: 8px">
      <app-version-badge />
      <a mat-button [routerLink]="['/', HELP_LINK]">{{ 'ui.header.help' | translate }}</a>
      <app-user-menu />
    </span>
  `,
  standalone: true,
})
export class HeaderUserActionsComponent {
  HELP_LINK = RouteConstants.help;
}
