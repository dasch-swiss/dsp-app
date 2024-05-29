import { Injectable } from '@angular/core';
import { ReadResourceSequence } from '@dasch-swiss/dsp-js';
import { Common, DspResource } from '@dasch-swiss/vre/shared/app-common';
import { IncomingService } from '@dasch-swiss/vre/shared/app-common-to-move';
import { BehaviorSubject, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

@Injectable()
export class RegionService {
  private _resource!: DspResource;

  private _regionsSubject = new BehaviorSubject<DspResource[]>([]);
  regions$ = this._regionsSubject.asObservable();

  get regions() {
    return this._regionsSubject.value;
  }

  private _showRegions = new BehaviorSubject(false);
  showRegions$ = this._showRegions.asObservable();

  private _highlightRegion = new BehaviorSubject<string | null>(null);
  highlightRegion$ = this.showRegions$.pipe(
    switchMap(value => (value ? this._highlightRegion.asObservable() : of(null)))
  );

  constructor(private _incomingService: IncomingService) {}

  onInit(resource: DspResource) {
    this._resource = resource;
    this.updateRegions();
  }

  showRegions(value: boolean) {
    this._showRegions.next(value);
  }

  updateRegions() {
    this._getIncomingRegions()
      .pipe(take(1))
      .subscribe(res => {
        this._regionsSubject.next(res);
      });
  }

  highlightRegion(regionIri: string) {
    this._highlightRegion.next(regionIri);
  }

  private _getIncomingRegions() {
    const offset = 0;
    return this._incomingService.getIncomingRegions(this._resource.res.id, offset).pipe(
      map(regions =>
        (regions as ReadResourceSequence).resources.map(_resource => {
          const z = new DspResource(_resource);
          z.resProps = Common.initProps(_resource);
          return z;
        })
      )
    );
  }
}
