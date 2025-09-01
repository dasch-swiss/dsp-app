import { Injectable } from '@angular/core';
import { AdminGroupsApiService, AdminProjectsApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { Store } from '@ngxs/store';
import { BehaviorSubject, EMPTY, filter, map, shareReplay, switchMap } from 'rxjs';
import { ProjectPageService } from '../../project-page.service';

@Injectable()
export class CollaborationPageService {
  reloadProjectMembers$ = new BehaviorSubject<null>(null);

  private _project$ = this._projectPageService.currentProject$;

  groups$ = this._project$
    .pipe(
      switchMap(project => {
        if (!project) {
          return EMPTY;
        }
        return this._adminGroupsApi.getAdminGroups().pipe(
          map(response => {
            return (response.groups ?? []).filter(group => (group.project!.id as unknown as string) === project.id);
          })
        );
      })
    )
    .pipe(shareReplay({ bufferSize: 1, refCount: true }));

  projectMembers$ = this.reloadProjectMembers$.asObservable().pipe(
    switchMap(() => this._project$),
    filter(project => project !== undefined),
    switchMap(project => this._adminProjectsApi.getAdminProjectsIriProjectiriMembers(project!.id)),
    map(response => response.members || []),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(
    private _adminGroupsApi: AdminGroupsApiService,
    private _store: Store,
    private _projectPageService: ProjectPageService,
    private _adminProjectsApi: AdminProjectsApiService
  ) {}

  reloadProjectMembers() {
    this.reloadProjectMembers$.next(null);
  }
}
