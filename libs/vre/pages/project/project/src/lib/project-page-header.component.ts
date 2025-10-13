import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { map } from 'rxjs';
import { ProjectPageService } from './project-page.service';

@Component({
  selector: 'app-project-page-header',
  template: ` <mat-toolbar style="background-color: inherit; height: 56px">
      <span style="flex: 1; display: flex; align-items: center">
        <app-header-logo />
        <h1 class="title" (click)="goToProjectPage()">{{ currentProjectName$ | async }}</h1>
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
        &:hover {
          background-color: #e8e9eb;
        }
      }
    `,
  ],
  standalone: false,
})
export class ProjectPageHeaderComponent {
  currentProjectName$ = this._projectService.currentProject$.pipe(map(project => project.longname));
  constructor(
    private _projectService: ProjectPageService,
    private _router: Router
  ) {}

  goToProjectPage() {
    this._router.navigate(['/project', this._projectService.currentProjectId]);
  }
}
