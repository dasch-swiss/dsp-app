import { Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { filter, pairwise, Subject, take, takeUntil } from 'rxjs';
import { getFileValue } from './representations/get-file-value';
import { RegionService } from './representations/region.service';
import { ResourceHeaderComponent } from './resource-header.component';
import { ResourceImageTabsComponent } from './resource-image-tabs.component';
import { ResourceLegalComponent } from './resource-legal.component';
import { PropertiesDisplayService } from './resource-properties/properties-display.service';
import { ResourceRepresentationComponent } from './resource-representation.component';
import { ResourceRestrictionComponent } from './resource-restriction.component';

@Component({
  selector: 'app-resource-image',
  template: `
    @if (resource.res.userHasPermission === 'RV') {
      <app-resource-restriction />
    }
    <app-resource-header [resource]="resource" />
    <app-resource-legal [fileValue]="fileValue" />
    <app-resource-representation [resource]="resource" />
    <app-resource-image-tabs
      [resource]="resource"
      [annotationIri]="annotationIri"
      style="display: block; margin-top: 50px" />
  `,
  providers: [RegionService, PropertiesDisplayService],
  imports: [
    ResourceRestrictionComponent,
    ResourceHeaderComponent,
    ResourceLegalComponent,
    ResourceRepresentationComponent,
    ResourceImageTabsComponent,
  ],
})
export class ResourceImageComponent implements OnChanges, OnDestroy {
  @Input({ required: true }) resource!: DspResource;
  @Input() annotationIri: string | null = null;

  private readonly _destroy$ = new Subject<void>();

  constructor(private readonly _regionService: RegionService) {}

  get fileValue() {
    return getFileValue(this.resource.res)!;
  }

  ngOnChanges() {
    this._destroy$.next();
    this._regionService.initialize(this.resource.res.id);

    if (this.annotationIri) {
      this._regionService.showRegions(true);
      this._regionService.selectRegion(this.annotationIri);

      // Wait for the true→false transition (loading started then finished),
      // then filter to the annotation and re-trigger highlight on the drawn SVG
      this._regionService.regionsLoading$
        .pipe(
          pairwise(),
          filter(([prev, curr]) => prev && !curr),
          take(1),
          takeUntil(this._destroy$)
        )
        .subscribe(() => {
          this._regionService.filterToRegion(this.annotationIri!);
          this._regionService.selectRegion(this.annotationIri!);
        });
    }
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }
}
