import { Injectable } from '@angular/core';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { UserService } from '@dasch-swiss/vre/core/session';
import { combineLatest, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AllProjectsService {
  allProjects$ = this._projectApiService.list().pipe(map(response => response.projects));
  otherProjects$ = combineLatest([this._userService.userActiveProjects$, this.allProjects$]).pipe(
    map(([userActiveProjects, projects]) => {
      return projects.filter(project => userActiveProjects.findIndex(userProj => userProj.id === project.id) === -1);
    })
  );
  allActiveProjects$ = this.allProjects$.pipe(
    map(projects =>
      projects.filter(project => project.status).sort((a, b) => (a.longname || '').localeCompare(b.longname || ''))
    )
  );

  allInactiveProjects$ = this.allProjects$.pipe(
    map(projects =>
      projects.filter(project => !project.status).sort((a, b) => (a.longname || '').localeCompare(b.longname || ''))
    )
  );

  constructor(
    private _projectApiService: ProjectApiService,
    private _userService: UserService
  ) {}
}
