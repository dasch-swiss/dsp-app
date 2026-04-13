import { Injectable } from '@angular/core';
import { StoredProject } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { UserService } from '@dasch-swiss/vre/core/session';
import { Observable, combineLatest, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AllProjectsService {
  allProjects$!: Observable<StoredProject[]>;
  otherProjects$!: Observable<StoredProject[]>;
  allActiveProjects$!: Observable<StoredProject[]>;
  allInactiveProjects$!: Observable<StoredProject[]>;

  constructor(
    private readonly _projectApiService: ProjectApiService,
    private readonly _userService: UserService
  ) {
    this.allProjects$ = this._projectApiService.list().pipe(map(response => response.projects));
    this.otherProjects$ = combineLatest([this._userService.userActiveProjects$, this.allProjects$]).pipe(
      map(([userActiveProjects, projects]) => {
        return projects.filter(project => userActiveProjects.findIndex(userProj => userProj.id === project.id) === -1);
      })
    );
    this.allActiveProjects$ = this.allProjects$.pipe(
      map(projects =>
        projects.filter(project => project.status).sort((a, b) => (a.longname || '').localeCompare(b.longname || ''))
      )
    );
    this.allInactiveProjects$ = this.allProjects$.pipe(
      map(projects =>
        projects.filter(project => !project.status).sort((a, b) => (a.longname || '').localeCompare(b.longname || ''))
      )
    );
  }
}
