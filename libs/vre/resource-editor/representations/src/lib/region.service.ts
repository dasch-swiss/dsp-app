import { Inject, Injectable } from '@angular/core';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js/src/knora-api-connection';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { DspResource, GenerateProperty } from '@dasch-swiss/vre/shared/app-common';
import { BehaviorSubject, concatMap, EMPTY, expand, map, Subject, takeUntil, tap, toArray } from 'rxjs';

/**
 * Regions, also called annotations, are used to mark specific areas on an image.
 * This service handles the loading, display and selection of a resource's regions.
 */
@Injectable()
export class RegionService {
  private _resourceId!: string;

  private _regionsSubject = new BehaviorSubject<DspResource[]>([]);
  regions$ = this._regionsSubject.asObservable();

  private _showRegions = new BehaviorSubject(false);
  showRegions$ = this._showRegions.asObservable();

  private _selectedRegion = new BehaviorSubject<string | null>(null);
  selectedRegion$ = this._selectedRegion.asObservable();

  private _ngUnsubscribe = new Subject<void>();

  constructor(
    @Inject(DspApiConnectionToken)
    private _dspApi: KnoraApiConnection
  ) {}

  /** This method acts as a constructor. */
  initialize(resourceId: string) {
    this._resourceId = resourceId;
    this.updateRegions$().pipe(takeUntil(this._ngUnsubscribe)).subscribe();
  }

  updateRegions$() {
    return this._getIncomingRegions(this._resourceId).pipe(
      tap(res => {
        this._regionsSubject.next(res);
      })
    );
  }

  showRegions(value: boolean) {
    this._showRegions.next(value);
  }

  selectRegion(regionIri: string) {
    this._selectedRegion.next(regionIri);
  }

  private _getIncomingRegions(resourceId: string) {
    let offset = 0;

    return this._dspApi.v2.search.doSearchIncomingRegions(resourceId, offset).pipe(
      expand(response => {
        if (response.mayHaveMoreResults) {
          offset++;
          return this._dspApi.v2.search.doSearchIncomingRegions(resourceId, offset);
        } else {
          return EMPTY;
        }
      }),
      concatMap(page => page.resources),
      toArray(),
      map(res =>
        res.map(resource => {
          const z = new DspResource(resource);
          z.resProps = GenerateProperty.regionProperty(resource);
          return z;
        })
      )
    );
  }
}
