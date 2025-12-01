import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
import { Title } from '@angular/platform-browser';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { StatusComponent } from '@dasch-swiss/vre/shared/app-common-to-move';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-system-page',
  template: `
    <div class="content large middle">
      @if (isSysAdmin$ | async) {
        <div>
          <nav mat-tab-nav-bar [tabPanel]="tabPanel" class="navigation tab-bar margin-from-top">
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
        </div>
      } @else {
        <div class="content large middle">
          <app-status [status]="403" />
        </div>
      }
    </div>
  `,
  styleUrls: ['./system-page.component.scss'],
  standalone: true,
  imports: [
    AsyncPipe,
    MatIcon,
    MatTabNav,
    MatTabNavPanel,
    MatTabLink,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    StatusComponent,
    TranslateModule,
  ],
})
export class SystemPageComponent {
  private readonly _userService = inject(UserService);
  private readonly _titleService = inject(Title);
  private readonly _translateService = inject(TranslateService);

  isSysAdmin$ = this._userService.isSysAdmin$;

  links = [
    { name: 'pages.system.allProjects', url: RouteConstants.systemProjects, icon: 'assignment' },
    { name: 'pages.system.allUsers', url: RouteConstants.systemUsers, icon: 'group' },
  ];

  activeLink = '';

  constructor() {
    this._titleService.setTitle('System administration');
  }
}
