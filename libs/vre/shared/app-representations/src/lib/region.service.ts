import { Injectable } from '@angular/core';
import { ReadResourceSequence } from '@dasch-swiss/dsp-js';
import { Common, DspResource } from '@dasch-swiss/vre/shared/app-common';
import { IncomingService } from '@dasch-swiss/vre/shared/app-common-to-move';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { map, startWith, switchMap } from 'rxjs/operators';

@Injectable()
export class RegionService {
  regions: DspResource[] = [];
  private _resource!: DspResource;

  private _showRegions = new BehaviorSubject(false);
  showRegions$ = this._showRegions.asObservable();

  private _highlightRegion = new BehaviorSubject<string | null>(null);
  highlightRegion$ = this.showRegions$.pipe(
    switchMap(value => (value ? this._highlightRegion.asObservable() : of(null)))
  );

  private _regionAdded = new Subject<void>();
  regionAdded$ = this._regionAdded.asObservable();

  constructor(private _incomingService: IncomingService) {}

  onInit(resource: DspResource) {
    this._resource = resource;

    this.regionAdded$
      .pipe(
        startWith(null),
        switchMap(() => this.getIncomingRegions())
      )
      .subscribe(regions => {
        this.regions = regions;
      });
  }

  displayRegions(value: boolean) {
    this._showRegions.next(value);
  }

  addRegion(region: string) {
    this._regionAdded.next();
    this._highlightRegion.next(region);
  }

  highlightRegion(regionIri: string) {
    this._highlightRegion.next(regionIri);
  }

  getIncomingRegions() {
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
