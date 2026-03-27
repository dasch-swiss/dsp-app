import { Inject, Injectable } from '@angular/core';
import { KnoraApiConnection, ListNodeV2 } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { catchError, map, Observable, of, Subject, takeUntil } from 'rxjs';
import { IriLabelPair } from '../model';

@Injectable()
export class DynamicFormsDataService {
  private cancelPreviousCountRequest$ = new Subject<void>();
  private cancelPreviousSearchRequest$ = new Subject<void>();

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApiConnection: KnoraApiConnection
  ) {}

  getResourcesListCount$(searchValue: string, resourceClassIri: string): Observable<number> {
    this.cancelPreviousCountRequest$.next();
    if (!searchValue || searchValue.length <= 2) return of(0);

    return this._dspApiConnection.v2.search
      .doSearchByLabelCountQuery(searchValue, {
        limitToResourceClass: resourceClassIri,
      })
      .pipe(
        takeUntil(this.cancelPreviousCountRequest$),
        map(response => response.numberOfResults)
      );
  }

  searchResourcesByLabel$(searchValue: string, resourceClassIri: string, offset = 0): Observable<IriLabelPair[]> {
    this.cancelPreviousSearchRequest$.next();

    if (!searchValue || searchValue.length <= 2) return of([]);

    return this._dspApiConnection.v2.search
      .doSearchByLabel(searchValue, offset, {
        limitToResourceClass: resourceClassIri,
      })
      .pipe(
        takeUntil(this.cancelPreviousSearchRequest$),
        map(response =>
          response.resources.map(res => ({
            iri: res.id,
            label: res.label,
          }))
        ),
        catchError(err => {
          return of([]); // return an empty array on error wrapped in an observable
        })
      );
  }

  getList$(rootNodeIri: string): Observable<ListNodeV2 | undefined> {
    return this._dspApiConnection.v2.list.getList(rootNodeIri).pipe(
      catchError(err => {
        return of(undefined);
      })
    );
  }
}
