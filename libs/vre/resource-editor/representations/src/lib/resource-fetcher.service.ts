import { Inject, Injectable } from '@angular/core';
import { KnoraApiConnection, ReadUser, SystemPropertyDefinition } from '@dasch-swiss/dsp-js';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminProjectsApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource, GenerateProperty } from '@dasch-swiss/vre/shared/app-common';
import { BehaviorSubject, map, Observable, shareReplay, switchMap } from 'rxjs';
import { ResourceUtil } from './resource.util';

@Injectable()
export class ResourceFetcherService {
  private _reloadSubject = new BehaviorSubject(null);

  resource$!: Observable<DspResource>;
  projectShortcode$!: Observable<string>;

  userCanEdit$!: Observable<boolean>;
  userCanDelete$!: Observable<boolean>;
  resourceVersion?: string;

  attachedUser$!: Observable<ReadUser>;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _adminProjectsApiService: AdminProjectsApiService,
    private _userApiService: UserApiService
  ) {}

  onInit(resourceIri: string, resourceVersion?: string) {
    this.resource$ = this._reloadSubject.asObservable().pipe(
      switchMap(() => this._getResource(resourceIri, resourceVersion)),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.attachedUser$ = this.resource$.pipe(
      switchMap(resource => this._userApiService.get(resource.res.attachedToUser).pipe(map(response => response.user)))
    );

    this.projectShortcode$ = this.resource$.pipe(
      switchMap(resource =>
        this._adminProjectsApiService.getAdminProjectsIriProjectiri(resource.res.attachedToProject)
      ),
      map(v => v.project.shortcode as unknown as string),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    this.resourceVersion = resourceVersion;

    this.userCanEdit$ = this.resource$.pipe(
      map(resource => resourceVersion === undefined && ResourceUtil.userCanEdit(resource.res))
    );

    this.userCanDelete$ = this.resource$.pipe(
      map(resource => resourceVersion === undefined && ResourceUtil.userCanDelete(resource.res))
    );
  }

  reload() {
    this._reloadSubject.next(null);
  }

  private _getResource(resourceIri: string, resourceVersion?: string) {
    return this._dspApiConnection.v2.res.getResource(resourceIri, resourceVersion).pipe(
      map(response => {
        const res = new DspResource(response);
        res.resProps = GenerateProperty.commonProperty(res.res);
        res.systemProps = res.res.entityInfo.getPropertyDefinitionsByType(SystemPropertyDefinition);
        return res;
      })
    );
  }
}
