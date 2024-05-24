import { ChangeDetectorRef, Component, Input, OnChanges } from '@angular/core';
import { Constants, ReadLinkValue } from '@dasch-swiss/dsp-js';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { LoadResourceAction, ResourceSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-resource-fetcher',
  template: ' <app-resource *ngIf="resource" [resource]="resource"></app-resource>',
})
export class ResourceFetcherComponent implements OnChanges {
  @Input({ required: true }) resourceIri!: string;

  resource: DspResource | undefined;

  constructor(
    private _store: Store,
    private _cdr: ChangeDetectorRef
  ) {}

  ngOnChanges() {
    this._getResource(this.resourceIri)
      .pipe(switchMap(() => this._store.select(ResourceSelectors.resource)))
      .subscribe(resource => {
        if (resource === null) {
          return;
        }

        if (resource.res.isDeleted) {
          return;
        }

        if (resource.isRegion) {
          this._renderAsRegion(resource);
          return;
        }

        this.resource = resource;
        this._cdr.detectChanges();
      });
  }

  private _renderAsRegion(region: DspResource) {
    const annotatedRepresentationIri = (region.res.properties[Constants.IsRegionOfValue] as ReadLinkValue[])[0]
      .linkedResourceIri;

    this._getResource(annotatedRepresentationIri).subscribe(dspResource => {
      this.resource = dspResource;
    });
  }

  private _getResource(iri: string): Observable<DspResource> {
    return this._store.dispatch(new LoadResourceAction(iri));
  }
}
