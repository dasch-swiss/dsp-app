import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { MenuItem } from '@dasch-swiss/vre/pages/user-settings/user';
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
        <a
          mat-tab-link
          *ngFor="let link of navigation; trackBy: trackByFn; let first = first"
          id="{{ link.route }}"
          [routerLink]="link.route"
          routerLinkActive="active-tab"
          #rla="routerLinkActive"
          [active]="rla.isActive">
          <mat-icon class="tab-icon">{{ link.icon }}</mat-icon>
          {{ link.label }}
        </a>
      </nav>
      <mat-tab-nav-panel #tabPanel>
        <router-outlet />
      </mat-tab-nav-panel>
    </app-centered-layout>
  `,
})
export class SettingsPageComponent {
  private _translateService = inject(TranslateService);

  navigation: MenuItem[] = [
    {
      label: 'Project Description',
      shortLabel: 'Project Description',
      route: RouteConstants.edit,
      icon: 'edit_square',
    },
    {
      label: this._translateService.instant('pages.project.resourceMetadata.tab'),
      shortLabel: this._translateService.instant('pages.project.resourceMetadata.tab'),
      route: RouteConstants.resourceMetadata,
      icon: 'code_blocks',
    },
    {
      label: 'Image Settings',
      shortLabel: 'Image Settings',
      route: RouteConstants.imageSettings,
      icon: 'branding_watermark',
    },
    { label: 'Legal Settings', shortLabel: 'Legal Settings', route: RouteConstants.legalSettings, icon: 'gavel' },
    {
      label: 'Project Members',
      shortLabel: 'Members',
      route: RouteConstants.collaboration,
      icon: 'group',
    },
  ];

  loading = false;

  trackByFn = (index: number, item: MenuItem) => `${index}-${item.route}`;
}
