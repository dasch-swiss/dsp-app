import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { MenuItem } from '../../main/declarations/menu-item';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-settings',
  template: `
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
      <router-outlet></router-outlet>
    </mat-tab-nav-panel>
  `,
})
export class SettingsComponent {
  navigation: MenuItem[] = [
    {
      label: 'Project Description',
      shortLabel: 'Project Description',
      route: RouteConstants.edit,
      icon: 'edit_square',
    },
    {
      label: 'Image Settings',
      shortLabel: 'Image Settings',
      route: RouteConstants.imageSettings,
      icon: 'branding_watermark',
    },
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
