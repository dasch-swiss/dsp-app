import { Component } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { UserSelectors } from '@dasch-swiss/vre/core/state';
import { Store } from '@ngxs/store';

@Component({
  selector: 'app-system-page',
  template: `
    <div class="content large middle">
      <div *ngIf="isSysAdmin$ | async; else notAllowed">
        <nav mat-tab-nav-bar [tabPanel]="tabPanel" class="navigation tab-bar margin-from-top">
          <mat-tab-nav-panel #tabPanel />
          <a
            mat-tab-link
            *ngFor="let link of links"
            [routerLink]="link.url"
            (click)="activeLink = link.name"
            routerLinkActive
            #rla="routerLinkActive"
            [active]="rla.isActive">
            <mat-icon class="tab-icon">{{ link.icon }}</mat-icon>
            {{ link.name }}
          </a>
        </nav>
        <router-outlet />
      </div>
    </div>

    <ng-template #notAllowed>
      <div class="content large middle">
        <app-status [status]="403" />
      </div>
    </ng-template>
  `,
  styleUrls: ['./system-page.component.scss'],
})
export class SystemPageComponent {
  isSysAdmin$ = this._store.select(UserSelectors.isSysAdmin);

  links = [
    { name: 'All Projects', url: RouteConstants.systemProjects, icon: 'assignment' },
    { name: 'All Users', url: RouteConstants.systemUsers, icon: 'group' },
  ];

  activeLink = '';

  constructor(
    private readonly _store: Store,
    private readonly _titleService: Title
  ) {
    this._titleService.setTitle('System administration');
  }
}
