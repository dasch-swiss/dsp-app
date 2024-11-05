import { Injectable } from '@angular/core';
import { ReadResourceSequence } from '@dasch-swiss/dsp-js';
import { DspResource, GenerateProperty } from '@dasch-swiss/vre/shared/app-common';
import { IncomingService } from '@dasch-swiss/vre/shared/app-common-to-move';
import { BehaviorSubject, Subject } from 'rxjs';
import { map, takeUntil, tap } from 'rxjs/operators';

/**
 * Regions, also called annotations, are used to mark specific areas on an image.
 * This service handles the loading, display and selection of a resource's regions.
 */
@Injectable()
export class RegionService {
  private _resourceId!: string;

  private _regionsSubject = new BehaviorSubject<DspResource[]>([]);
  regions$ = this._regionsSubject.asObservable();

  get regions() {
    return this._regionsSubject.value;
  }

  private _showRegions = new BehaviorSubject(false);
  showRegions$ = this._showRegions.asObservable();

  private _selectedRegion = new BehaviorSubject<string | null>(null);
  selectedRegion$ = this._selectedRegion.asObservable();

  private _ngUnsubscribe = new Subject<void>();

  constructor(private _incomingService: IncomingService) {}

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
    const offset = 0;
    return this._incomingService.getIncomingRegions(resourceId, offset).pipe(
      map(regions =>
        (regions as ReadResourceSequence).resources.map(_resource => {
          const z = new DspResource(_resource);
          z.resProps = GenerateProperty.regionProperty(_resource);
          return z;
        })
      )
    );
  }
}
