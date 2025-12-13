import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
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
      <nav
        mat-tab-nav-bar
        mat-align-tabs="center"
        class="settings navigation"
        style="background: none"
        animationDuration="0ms"
        [tabPanel]="tabPanel">
        @for (link of navigation; track trackByFn($index, link); let first = $first) {
          <a
            mat-tab-link
            id="{{ link.route }}"
            [routerLink]="link.route"
            routerLinkActive="active-tab"
            #rla="routerLinkActive"
            [active]="rla.isActive">
            <mat-icon class="tab-icon">{{ link.icon }}</mat-icon>
            {{ link.label }}
          </a>
        }
      </nav>
      <mat-tab-nav-panel #tabPanel style="display: block; margin-top: 16px">
        <router-outlet />
      </mat-tab-nav-panel>
    </app-centered-layout>
  `,
  imports: [
    CenteredLayoutComponent,
    MatIcon,
    MatTabLink,
    MatTabNav,
    MatTabNavPanel,
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

  loading = false;

  trackByFn = (index: number, item: MenuItem) => `${index}-${item.route}`;
}
