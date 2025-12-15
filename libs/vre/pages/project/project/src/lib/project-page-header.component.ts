import { AsyncPipe } from '@angular/common';
import { Component } from '@angular/core';
import { MatToolbar } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { HeaderLogoComponent, HeaderUserActionsComponent } from '@dasch-swiss/vre/shared/app-common-to-move';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { map } from 'rxjs';
import { ProjectNavigationTabsComponent } from './project-navigation-tabs.component';
import { ProjectPageService } from './project-page.service';

@Component({
  selector: 'app-project-page-header',
  template: ` <mat-toolbar style="background-color: inherit; height: 56px">
      <span style="flex: 1; display: flex; align-items: center">
        <app-header-logo />
        <a class="title" [routerLink]="projectLink$ | async">{{ currentProjectName$ | async }}</a>
      </span>
      <app-header-user-actions />
    </mat-toolbar>
    <app-project-navigation-tabs />`,
  styles: [
    `
      :host {
        display: block;
        border-bottom: 1px solid #ebebeb;
        background-color: #f2f3f5;
      }

      .title {
        font-size: 18px;
        cursor: pointer;
        padding: 4px;
        border-radius: 8px;
        text-decoration: none;
        color: inherit;
        display: inline-block;
        &:hover {
          background-color: #e8e9eb;
        }
      }
    `,
  ],
  imports: [
    AsyncPipe,
    MatToolbar,
    RouterLink,
    HeaderLogoComponent,
    HeaderUserActionsComponent,
    ProjectNavigationTabsComponent,
  ],
})
export class ProjectPageHeaderComponent {
  currentProjectName$ = this._projectService.currentProject$.pipe(map(project => project.longname));
  projectLink$ = this._projectService.currentProject$.pipe(
    map(project => ['/project', ProjectService.IriToUuid(project.id)])
  );

  constructor(private readonly _projectService: ProjectPageService) {}
}
