import { inject, Injectable } from '@angular/core';
import { KnoraApiConnection, ListNodeV2WithAllLanguages } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { Observable, shareReplay } from 'rxjs';

/**
 * Whole lists by root IRI, each fetched once and replayed to every later subscriber.
 *
 * Not provided in root on purpose: a list edited in the ontology editor must not stay stale app-wide.
 */
@Injectable()
export class ListCacheService {
  private readonly _dspApiConnection = inject<KnoraApiConnection>(DspApiConnectionToken);
  private readonly _listByRoot = new Map<string, Observable<ListNodeV2WithAllLanguages>>();

  get$(rootIri: string): Observable<ListNodeV2WithAllLanguages> {
    let list$ = this._listByRoot.get(rootIri);
    if (!list$) {
      list$ = this._dspApiConnection.v2.list
        .getListWithAllLanguages(rootIri)
        .pipe(shareReplay({ bufferSize: 1, refCount: false }));
      this._listByRoot.set(rootIri, list$);
    }
    return list$;
  }
}
