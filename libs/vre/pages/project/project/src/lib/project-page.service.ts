import { Inject, Injectable } from '@angular/core';
import { KnoraApiConnection, ReadOntology } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { filterNull, UserPermissions } from '@dasch-swiss/vre/shared/app-common';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { BehaviorSubject, combineLatest, map, of, shareReplay, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ProjectPageService {
  private _reloadProjectSubject = new BehaviorSubject<null>(null);

  private _currentProjectUuid?: string;
  private _currentProjectId?: string;
  private _currentProjectIdSubject = new BehaviorSubject<string>('');

  get currentProjectId(): string {
    if (!this._currentProjectId) {
      throw new Error('ProjectPageService: setup() must be called before accessing currentProjectId');
    }
    return this._currentProjectId;
  }

  get currentProjectUuid(): string {
    if (!this._currentProjectUuid) {
      throw new Error('ProjectPageService: setup() must be called before accessing currentProjectUuid');
    }
    return this._currentProjectUuid;
  }

  readonly currentProject$ = combineLatest([
    this._reloadProjectSubject,
    this._currentProjectIdSubject.asObservable(),
  ]).pipe(
    switchMap(([, projectId]) => this._projectApiService.get(projectId)),
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
    switchMap(ontologies => {
      if (ontologies.length > 0) {
        return combineLatest(ontologies.map(onto => this._dspApiConnection.v2.onto.getOntology(onto.id, true)));
      } else {
        return of([] as ReadOntology[]);
      }
    })
  );
  constructor(
    private readonly _projectApiService: ProjectApiService,
    private readonly _userService: UserService,
    @Inject(DspApiConnectionToken)
    private readonly _dspApiConnection: KnoraApiConnection,
    private readonly _projectService: ProjectService
  ) {}

  setup(projectUuid: string): void {
    this._currentProjectUuid = projectUuid;
    this._currentProjectId = this._projectService.uuidToIri(projectUuid);
    this._currentProjectIdSubject.next(this._currentProjectId);
  }

  reloadProject() {
    this._reloadProjectSubject.next(null);
  }
}
