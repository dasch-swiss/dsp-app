import { Component, OnInit } from '@angular/core';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { RegionService } from '@dasch-swiss/vre/shared/app-representations';

@Component({
  selector: 'app-annotation-tab',
  template: ` <div
    class="region-property"
    *ngFor="let annotation of regionService.regions; trackBy: trackAnnotationByFn"
    [id]="annotation.res.id"
    [class.active]="annotation.res.id === selectedRegion">
    <app-properties-display [resource]="annotation" [properties]="annotation.resProps" [isAnnotation]="true" />
  </div>`,
  styles: ['.active {border: 1px solid}'],
})
export class AnnotationTabComponent implements OnInit {
  selectedRegion: string | null = null;

  constructor(public regionService: RegionService) {}

  ngOnInit() {
    this.regionService.highlightRegion$.subscribe(region => {
      this.selectedRegion = region;
      if (region !== null) {
        this._openRegion(region);
      }
    });
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
}
