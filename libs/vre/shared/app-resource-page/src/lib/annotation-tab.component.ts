import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { DspResource, ResourceService } from '@dasch-swiss/vre/shared/app-common';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { RegionService } from '@dasch-swiss/vre/shared/app-representations';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-annotation-tab',
  template: ` <div
    *ngFor="let annotation of regionService.regions; trackBy: trackAnnotationByFn"
    [id]="annotation.res.id"
    [class.active]="annotation.res.id === selectedRegion">
    <app-properties-display
      [resource]="annotation"
      [properties]="annotation.resProps"
      [displayLabel]="true"
      [linkToNewTab]="
        resourceService.getResourcePath(resource.res.id) +
        '?' +
        RouteConstants.annotationQueryParam +
        '=' +
        annotation.res.id
      " />
  </div>`,
  styles: ['.active {border: 1px solid}'],
})
export class AnnotationTabComponent implements OnInit, OnDestroy {
  @Input({ required: true }) resource!: DspResource;
  selectedRegion: string | null = null;

  private _subscription!: Subscription;

  constructor(
    public regionService: RegionService,
    public resourceService: ResourceService
  ) {}

  ngOnInit() {
    this.regionService.showRegions(true);

    this._subscription = this.regionService.highlightRegion$.subscribe(region => {
      this.selectedRegion = region;
      if (region !== null) {
        this._openRegion(region);
      }
    });
  }

  ngOnDestroy() {
    this._subscription.unsubscribe();
    this.regionService.showRegions(false);
  }

  private _openRegion(iri: string) {
    const region = document.getElementById(iri);
    if (region) {
      region.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }

  trackAnnotationByFn = (index: number, item: DspResource) => `${index}-${item.res.id}`;
  protected readonly RouteConstants = RouteConstants;
}
