import { Component } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { CenteredLayoutComponent } from '@dasch-swiss/vre/ui/ui';
import { TranslateModule } from '@ngx-translate/core';
import { ProfileComponent } from './profile/profile.component';

@Component({
  selector: 'app-user',
  template: `
    <app-centered-layout>
      <app-profile />

      <nav
        mat-tab-nav-bar
        mat-stretch-tabs="false"
        mat-align-tabs="start"
        animationDuration="0ms"
        [tabPanel]="tabPanel">
        <a mat-tab-link [routerLink]="['/', MY_PROFILE, 'account']" routerLinkActive="active-link">
          <mat-icon class="tab-icon">settings</mat-icon>
          {{ 'pages.userSettings.navigation.myAccount' | translate }}
        </a>
        <a mat-tab-link [routerLink]="[PROJECTS]" routerLinkActive="active-link">
          <mat-icon class="tab-icon">assignments</mat-icon>
          {{ 'pages.userSettings.navigation.myProjects' | translate }}
        </a>
      </nav>

      <mat-tab-nav-panel #tabPanel></mat-tab-nav-panel>
      <router-outlet></router-outlet>
    </app-centered-layout>
  `,
  styles: [
    `
      .active-link {
        border-bottom: 2px solid #336790;
        font-weight: 500;
      }
    `,
  ],
  standalone: true,
  imports: [
    CenteredLayoutComponent,
    ProfileComponent,
    MatTabNav,
    MatTabLink,
    RouterLink,
    RouterLinkActive,
    MatIcon,
    TranslateModule,
    MatTabNavPanel,
    RouterOutlet,
  ],
})
export class UserComponent {
  MY_PROFILE = RouteConstants.myProfile;
  PROJECTS = RouteConstants.projects;
}
