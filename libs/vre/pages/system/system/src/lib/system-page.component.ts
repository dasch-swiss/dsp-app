import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
import { Title } from '@angular/platform-browser';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { CenteredLayoutComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-system-page',
  template: `
    <app-centered-layout>
      <nav mat-tab-nav-bar [tabPanel]="tabPanel" class="navigation margin-from-top">
        <mat-tab-nav-panel #tabPanel />
        @for (link of links; track link) {
          <a
            mat-tab-link
            [routerLink]="link.url"
            (click)="activeLink = link.name"
            routerLinkActive
            #rla="routerLinkActive"
            [active]="rla.isActive">
            <mat-icon class="tab-icon">{{ link.icon }}</mat-icon>
            {{ link.name | translate }}
          </a>
        }
      </nav>
      <router-outlet />
    </app-centered-layout>
  `,
  styleUrls: ['./system-page.component.scss'],
  imports: [
    MatIcon,
    MatTabNav,
    MatTabNavPanel,
    MatTabLink,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    TranslatePipe,
    CenteredLayoutComponent,
  ],
})
export class SystemPageComponent {
  private readonly _titleService = inject(Title);

  links = [
    { name: 'pages.system.allProjects', url: RouteConstants.systemProjects, icon: 'assignment' },
    { name: 'pages.system.allUsers', url: RouteConstants.systemUsers, icon: 'group' },
  ];

  activeLink = '';

  constructor() {
    this._titleService.setTitle('System administration');
  }
}
