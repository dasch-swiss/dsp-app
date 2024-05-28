import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { Constants, ReadLinkValue } from '@dasch-swiss/dsp-js';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { ResourceFetcherService } from '@dasch-swiss/vre/shared/app-representations';

@Component({
  selector: 'app-resource-fetcher',
  template: ' <app-resource *ngIf="resource" [resource]="resource"></app-resource>',
  providers: [ResourceFetcherService],
})
export class ResourceFetcherComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) resourceIri!: string;

  resource: DspResource | undefined;

  constructor(
    private _cdr: ChangeDetectorRef,
    private _resourceFetcherService: ResourceFetcherService
  ) {}

  ngOnChanges() {
    this._resourceFetcherService.onDestroy();
    this._resourceFetcherService.onInit(this.resourceIri);

    this._resourceFetcherService.resource$.subscribe(resource => {
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

  ngOnDestroy() {
    this._resourceFetcherService.onDestroy();
  }

  private _renderAsRegion(region: DspResource) {
    const annotatedRepresentationIri = (region.res.properties[Constants.IsRegionOfValue] as ReadLinkValue[])[0]
      .linkedResourceIri;

    /* TODO
                        this._getResource(annotatedRepresentationIri).subscribe(dspResource => {
                          this.resource = dspResource;
                        });
                        */
  }
}
