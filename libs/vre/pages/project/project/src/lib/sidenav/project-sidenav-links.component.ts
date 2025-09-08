import { Component } from '@angular/core';
import { ActivatedRoute, EventType, Router } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { filter, map, startWith, switchMap } from 'rxjs';
import { ProjectPageService } from '../project-page.service';

@Component({
  selector: 'app-projects-sidenav-links',
  template: `
    @if (link$ | async; as link) {
      <mat-list>
        <app-projects-sidenav-links-item
          [link]="[routeConstants.advancedSearch]"
          [label]="'Advanced Search'"
          [icon]="'search'"
          [active]="link === 'advanced-search'" />
        <app-projects-sidenav-links-item
          [link]="[routeConstants.projectDescription]"
          [label]="'Project Description'"
          [icon]="'description'"
          [active]="link === 'description'" />
        @if (hasProjectAdminRights$ | async) {
          <app-projects-sidenav-links-item
            [link]="[routeConstants.settings]"
            [label]="'Project Settings'"
            [icon]="'settings'"
            [active]="link === 'settings'" />
        }
        <app-projects-sidenav-links-item
          [link]="[routeConstants.dataModels]"
          [label]="'Data Model'"
          [icon]="'bubble_chart'"
          [active]="link === 'data-models'" />
      </mat-list>
    }
  `,
  styles: [
    `
      mat-list {
        padding: 0;
      }
    `,
  ],
})
export class ProjectSidenavLinksComponent {
  protected readonly routeConstants = RouteConstants;

  hasProjectAdminRights$ = this._projectPageService.hasProjectAdminRights$;

  link$ = this._router.events.pipe(
    filter(v => v.type === EventType.NavigationEnd),
    startWith(null),
    switchMap(() => this._route.firstChild!.url),
    map(url => url[0].path)
  );

  constructor(
    private _projectPageService: ProjectPageService,
    private _route: ActivatedRoute,
    private _router: Router
  ) {}
}
