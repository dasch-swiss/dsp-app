import { Inject, Injectable } from '@angular/core';
import { KnoraApiConnection, SystemPropertyDefinition } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { SetCurrentResourceAction } from '@dasch-swiss/vre/core/state';
import { DspResource, GenerateProperty } from '@dasch-swiss/vre/shared/app-common';
import { Store } from '@ngxs/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { ResourceUtil } from './resource.util';

@Injectable()
export class ResourceFetcherService {
  private _reloadSubject = new BehaviorSubject(null);
  resource$!: Observable<DspResource>;
  userCanEdit$!: Observable<boolean>;
  userCanDelete$!: Observable<boolean>;
  resourceVersion?: string;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _store: Store
  ) {}

  onInit(resourceIri: string, resourceVersion?: string) {
    this.resource$ = this._reloadSubject.asObservable().pipe(
      switchMap(() => this._getResource(resourceIri, resourceVersion)),
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

        this._store.dispatch(new SetCurrentResourceAction(res));
        return res;
      })
    );
  }
}
