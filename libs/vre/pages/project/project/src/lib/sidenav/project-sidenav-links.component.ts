import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { MatList } from '@angular/material/list';
import { ActivatedRoute, EventType, Router } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { TranslateModule } from '@ngx-translate/core';
import { filter, map, startWith, switchMap } from 'rxjs';
import { ProjectPageService } from '../project-page.service';
import { ProjectSidenavLinksItemComponent } from './project-sidenav-links-item.component';

@Component({
  selector: 'app-projects-sidenav-links',
  template: `
    @if (link$ | async; as link) {
      <mat-list>
        <app-projects-sidenav-links-item
          [link]="[routeConstants.advancedSearch]"
          [label]="'pages.project.sidenav.advancedSearch' | translate"
          [icon]="'search'"
          [active]="link === 'advanced-search'" />
        <app-projects-sidenav-links-item
          [link]="[routeConstants.projectDescription]"
          [label]="'pages.project.sidenav.projectDescription' | translate"
          [icon]="'description'"
          [active]="link === 'description'" />
        @if (hasProjectAdminRights$ | async) {
          <app-projects-sidenav-links-item
            [link]="[routeConstants.settings]"
            [label]="'pages.project.sidenav.projectSettings' | translate"
            [icon]="'settings'"
            [active]="link === 'settings'" />
        }
        <app-projects-sidenav-links-item
          [link]="[routeConstants.dataModels]"
          [label]="'pages.project.sidenav.dataModel' | translate"
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
  imports: [AsyncPipe, MatList, TranslateModule, ProjectSidenavLinksItemComponent],
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
    private readonly _projectPageService: ProjectPageService,
    private readonly _route: ActivatedRoute,
    private readonly _router: Router
  ) {}
}
