import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatListItem, MatListItemIcon, MatListItemTitle, MatNavList } from '@angular/material/list';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { MenuItem } from '@dasch-swiss/vre/pages/user-settings/user';
import { CenteredLayoutComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslateService } from '@ngx-translate/core';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-settings-page',
  template: `
    <app-centered-layout>
      <div style="display: flex; gap: 24px; align-items: flex-start; width: 100%">
        <mat-nav-list style="min-width: 200px; padding: 0">
          @for (link of navigation; track trackByFn($index, link)) {
            <a mat-list-item [routerLink]="link.route" routerLinkActive="active-tab">
              <mat-icon matListItemIcon>{{ link.icon }}</mat-icon>
              <span matListItemTitle>{{ link.label }}</span>
            </a>
          }
        </mat-nav-list>
        <div style="flex: 1; min-width: 0">
          <router-outlet />
        </div>
      </div>
    </app-centered-layout>
  `,
  imports: [
    CenteredLayoutComponent,
    MatIcon,
    MatListItem,
    MatListItemIcon,
    MatListItemTitle,
    MatNavList,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
})
export class SettingsPageComponent {
  private _translateService = inject(TranslateService);

  navigation = [
    {
      label: this._translateService.instant('ui.common.fields.description'),
      route: RouteConstants.edit,
      icon: 'edit_square',
    },
    {
      label: this._translateService.instant('pages.project.resourceMetadata.tab'),
      route: RouteConstants.resourceMetadata,
      icon: 'code_blocks',
    },
    {
      label: this._translateService.instant('pages.project.settingsPage.image'),
      route: RouteConstants.imageSettings,
      icon: 'branding_watermark',
    },
    {
      label: this._translateService.instant('pages.project.legalSettings.tab'),
      route: RouteConstants.legalSettings,
      icon: 'gavel',
    },
    {
      label: this._translateService.instant('ui.common.entities.members'),
      route: RouteConstants.collaboration,
      icon: 'group',
    },
  ];

  trackByFn = (index: number, item: MenuItem) => `${index}-${item.route}`;
}
