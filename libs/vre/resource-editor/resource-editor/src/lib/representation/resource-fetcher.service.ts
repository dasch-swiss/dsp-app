import { Inject, Injectable } from '@angular/core';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { DspResource, filterUndefined, generateDspResource } from '@dasch-swiss/vre/shared/app-common';
import { BehaviorSubject, map, shareReplay, Subject, switchMap } from 'rxjs';
import { ResourceUtil } from './resource.util';

@Injectable()
export class ResourceFetcherService {
  private _resourceSubject = new BehaviorSubject<DspResource | undefined>(undefined);
  resource$ = this._resourceSubject.asObservable();

  resourceVersion?: string | null = null;

  userCanEdit$ = this.resource$.pipe(
    map(resource => resource && !this.resourceVersion && ResourceUtil.userCanEdit(resource.res))
  );

  userCanDelete$ = this.resource$.pipe(
    map(resource => resource && !this.resourceVersion && ResourceUtil.userCanDelete(resource.res))
  );

  attachedUser$ = this.resource$.pipe(
    filterUndefined(),
    switchMap(resource => this._userApiService.get(resource.res.attachedToUser).pipe(map(response => response.user)))
  );

  project$ = this.resource$.pipe(
    filterUndefined(),
    switchMap(resource => this._adminApiService.getAdminProjectsIriProjectiri(resource.res.attachedToProject)),
    map(v => v.project),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  projectIri$ = this.project$.pipe(map(project => project.id as unknown as string));
  projectShortcode$ = this.project$.pipe(map(project => project.shortcode as unknown as string));

  _scrollToTop = new Subject<void>();
  scrollToTop$ = this._scrollToTop.asObservable();

  constructor(
    @Inject(DspApiConnectionToken) private readonly _dspApiConnection: KnoraApiConnection,
    private readonly _adminApiService: AdminAPIApiService,
    private readonly _userApiService: UserApiService
  ) {}

  loadResource(resourceIri: string, resourceVersion?: string) {
    // TEMP DEBUG (DEV-6568): trace fetch trigger.
    // eslint-disable-next-line no-console
    console.warn(
      `[DEV-6568] (3) loadResource resourceIri=${JSON.stringify(resourceIri)} version=${JSON.stringify(resourceVersion)}`
    );
    this.resourceVersion = resourceVersion;
    this._getResource(resourceIri, resourceVersion).subscribe(resource => {
      // eslint-disable-next-line no-console
      console.warn('[DEV-6568] (5) loadResource emitting DspResource ->', resource);
      this._resourceSubject.next(resource);
    });
  }

  reload() {
    const resourceIri = this._resourceSubject.value?.res.id;
    if (!resourceIri) {
      throw new AppError('Resource IRI is not found');
    }
    this.loadResource(resourceIri);
  }

  scrollToTop() {
    this._scrollToTop.next();
  }

  private _getResource(resourceIri: string, resourceVersion?: string) {
    return this._dspApiConnection.v2.res.getResource(resourceIri, resourceVersion).pipe(
      map(readResource => {
        // TEMP DEBUG (DEV-6568): raw API payload — inspect properties[*] filenames here.
        /* eslint-disable no-console */
        console.warn('[DEV-6568] (4) getResource raw ReadResource ->', readResource);
        console.warn('[DEV-6568] (4) raw properties keys =', Object.keys(readResource?.properties ?? {}));
        console.warn(
          '[DEV-6568] (4) raw file values =',
          Object.entries(readResource?.properties ?? {}).map(([prop, vals]) => ({
            prop,
            values: (vals as any[])?.map(v => ({ type: v?.type, filename: v?.filename, fileUrl: v?.fileUrl })),
          }))
        );
        /* eslint-enable no-console */
        return readResource;
      }),
      map(generateDspResource)
    );
  }
}
