import { Injectable } from '@angular/core';
import { StoredProject } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { UserService } from '@dasch-swiss/vre/core/session';
import { SortingHelper } from '@dasch-swiss/vre/shared/app-helper-services';
import { Observable, combineLatest, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AllProjectsService {
  allProjects$!: Observable<StoredProject[]>;
  otherProjects$!: Observable<StoredProject[]>;

  constructor(
    private readonly _projectApiService: ProjectApiService,
    private readonly _userService: UserService
  ) {
    this.allProjects$ = this._projectApiService
      .list()
      .pipe(map(response => SortingHelper.keySortByAlphabetical(response.projects, 'longname')));
    this.otherProjects$ = combineLatest([this._userService.userProjects$, this.allProjects$]).pipe(
      map(([userProjects, projects]) => {
        return projects.filter(project => userProjects.findIndex(userProj => userProj.id === project.id) === -1);
      })
    );
  }
}
