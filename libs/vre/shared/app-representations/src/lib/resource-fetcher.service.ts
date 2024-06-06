import { Inject, Injectable } from '@angular/core';
import { KnoraApiConnection, ReadResource, SystemPropertyDefinition } from '@dasch-swiss/dsp-js';
import { Common, DspResource } from '@dasch-swiss/vre/shared/app-common';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { SetCurrentResourceAction } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import { BehaviorSubject, Subscription } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable()
export class ResourceFetcherService {
  private _resourceIri!: string;
  private _loadResourceSubject = new BehaviorSubject(null);

  private _resourceSubject = new BehaviorSubject<DspResource | null>(null);
  resource$ = this._resourceSubject.asObservable();

  private _subscription: Subscription | undefined;

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection,
    private _store: Store
  ) {}

  onInit(resourceIri: string) {
    this._resourceIri = resourceIri;
    this._subscription = this._loadResourceSubject
      .asObservable()
      .pipe(switchMap(() => this._getResource()))
      .subscribe(res => this._resourceSubject.next(res));
  }

  onDestroy() {
    this._subscription?.unsubscribe();
  }

  reload() {
    this._loadResourceSubject.next(null);
  }

  private _getResource() {
    return this._dspApiConnection.v2.res.getResource(this._resourceIri).pipe(
      map(response => {
        const res = new DspResource(response as ReadResource);
        res.resProps = Common.initProps(res.res);

        // gather system property information
        res.systemProps = res.res.entityInfo.getPropertyDefinitionsByType(SystemPropertyDefinition);
        this._store.dispatch(new SetCurrentResourceAction(res));
        return res;
      })
    );
  }
}
