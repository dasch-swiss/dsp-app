import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { first } from 'rxjs';
import { ProjectPageService } from './project-page.service';

@Component({
  selector: 'app-project-page',
  template: `
    <app-project-page-header />
    <div class="content">
      <router-outlet />
    </div>
  `,
  styleUrls: ['./project-page.component.scss'],
  standalone: false,
})
export class ProjectPageComponent implements OnInit {
  hasProjectAdminRights$ = this._projectPageService.hasProjectAdminRights$;

  protected readonly RouteConstants = RouteConstants;

  constructor(
    protected _route: ActivatedRoute,
    private _titleService: Title,
    private _projectPageService: ProjectPageService
  ) {}

  ngOnInit() {
    this._projectPageService.currentProject$.pipe(first()).subscribe(project => {
      this._titleService.setTitle(project.shortname);
    });
  }
}
