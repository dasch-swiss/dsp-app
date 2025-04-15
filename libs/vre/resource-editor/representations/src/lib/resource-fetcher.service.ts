import { Inject, Injectable } from '@angular/core';
import { KnoraApiConnection, SystemPropertyDefinition } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { SetCurrentResourceAction } from '@dasch-swiss/vre/core/state';
import { DspResource, GenerateProperty } from '@dasch-swiss/vre/shared/app-common';
import { Store } from '@ngxs/store';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';

@Injectable()
export class ResourceFetcherService {
  private _reloadSubject = new BehaviorSubject(null);
  resource$!: Observable<DspResource>;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _store: Store
  ) {}

  onInit(resourceIri: string) {
    this.resource$ = this._reloadSubject.asObservable().pipe(
      switchMap(() => this._getResource(resourceIri)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  reload() {
    this._reloadSubject.next(null);
  }

  private _getResource(resourceIri: string) {
    return this._dspApiConnection.v2.res.getResource(resourceIri).pipe(
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
