import { Inject, Injectable } from '@angular/core';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { filterNull, UserPermissions } from '@dasch-swiss/vre/shared/app-common';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { BehaviorSubject, combineLatest, map, ReplaySubject, shareReplay, switchMap, take } from 'rxjs';

@Injectable()
export class ProjectPageService {
  private _currentProjectUuidSubject = new ReplaySubject<string>(1);
  private _reloadProjectSubject = new BehaviorSubject<null>(null);

  currentProjectUuid$ = this._currentProjectUuidSubject.pipe(take(1));

  currentProject$ = this._reloadProjectSubject.pipe(
    switchMap(() => this._currentProjectUuidSubject),
    switchMap(projectUuid => this.projectApiService.get(this._projectService.uuidToIri(projectUuid))),
    map(response => response.project),
    shareReplay(1)
  );

  private _user$ = this._userService.user$.pipe(filterNull());
  private _projectAndUser$ = combineLatest([this.currentProject$, this._user$]);

  hasProjectAdminRights$ = this._projectAndUser$.pipe(
    map(([currentProject, user]) => UserPermissions.hasProjectAdminRights(user, currentProject.id))
  );

  hasProjectMemberRights$ = this._projectAndUser$.pipe(
    map(([currentProject, user]) => UserPermissions.hasProjectMemberRights(user, currentProject.id))
  );

  ontologiesMetadata$ = this.currentProject$.pipe(
    switchMap(project => this._dspApiConnection.v2.onto.getOntologiesByProjectIri(project.id)),
    map(response => response.ontologies)
  );

  ontologies$ = this.ontologiesMetadata$.pipe(
    switchMap(ontologies =>
      combineLatest(ontologies.map(onto => this._dspApiConnection.v2.onto.getOntology(onto.id, true)))
    )
  );
  constructor(
    private projectApiService: ProjectApiService,
    private _userService: UserService,
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _projectService: ProjectService
  ) {}

  setCurrentProjectUuid(projectUuid: string): void {
    this._currentProjectUuidSubject.next(projectUuid);
  }

  reloadProject() {
    this._reloadProjectSubject.next(null);
  }
}
