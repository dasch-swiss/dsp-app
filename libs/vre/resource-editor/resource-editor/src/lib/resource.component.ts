import { ChangeDetectorRef, Component, Inject, Input, OnChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Constants, CountQueryResponse, KnoraApiConnection, ReadFileValue, ReadResource } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, RouteConstants } from '@dasch-swiss/vre/core/config';
import { DspCompoundPosition, DspResource } from '@dasch-swiss/vre/shared/app-common';
import { take } from 'rxjs';
import { CompoundViewerComponent } from './compound/compound-viewer.component';
import { CompoundService } from './compound/compound.service';
import { getFileValue } from './representations/get-file-value';
import { RegionService } from './representations/region.service';
import { ResourceHeaderComponent } from './resource-header.component';
import { ResourceLegalComponent } from './resource-legal.component';
import { PropertiesDisplayService } from './resource-properties/properties-display.service';
import { ResourceRepresentationComponent } from './resource-representation.component';
import { ResourceRestrictionComponent } from './resource-restriction.component';
import { ResourceTabsComponent } from './resource-tabs.component';
import { SegmentsService } from './segment-support/segments.service';

@Component({
  selector: 'app-resource',
  template: `
    @if (resource.res.userHasPermission === 'RV') {
      <app-resource-restriction />
    }
    <app-resource-header [resource]="resource" />
    @if (!resourceIsObjectWithoutRepresentation) {
      <app-resource-legal [fileValue]="representationsToDisplay" />
      <app-resource-representation [resource]="resource" />
    }
    @if (isCompoundNavigation) {
      <app-compound-viewer />
    }
    <app-resource-tabs [resource]="resource" style="display: block; margin-top: 50px" />
  `,
  providers: [CompoundService, PropertiesDisplayService, RegionService, SegmentsService],
  imports: [
    CompoundViewerComponent,
    ResourceHeaderComponent,
    ResourceLegalComponent,
    ResourceRepresentationComponent,
    ResourceRestrictionComponent,
    ResourceTabsComponent,
  ],
})
export class ResourceComponent implements OnChanges {
  @Input({ required: true }) resource!: DspResource;
  representationsToDisplay!: ReadFileValue;
  isCompoundNavigation!: boolean;
  resourceIsObjectWithoutRepresentation!: boolean;

  constructor(
    private readonly _cdr: ChangeDetectorRef,
    private readonly _compoundService: CompoundService,
    @Inject(DspApiConnectionToken) private _dspApi: KnoraApiConnection,
    private _regionService: RegionService,
    private _route: ActivatedRoute
  ) {}

  ngOnChanges() {
    this._compoundService.reset();
    this.isCompoundNavigation = false;

    this.resourceIsObjectWithoutRepresentation = this._isObjectWithoutRepresentation(this.resource.res);
    this._onInit(this.resource.res);
  }

  private _onInit(resource: ReadResource) {
    if (this._isObjectWithoutRepresentation(resource)) {
      this._checkForCompoundNavigation(resource);
      return;
    }

    this.representationsToDisplay = getFileValue(resource)!;

    if (this._isStillImage(resource)) {
      this._regionService.initialize(resource.id);
      this._checkForAnnotationUri();
    }
  }

  private _isStillImage(resource: ReadResource) {
    return resource.properties[Constants.HasStillImageFileValue] !== undefined;
  }

  private _isObjectWithoutRepresentation(resource: ReadResource) {
    return getFileValue(resource) === null;
  }

  private _checkForAnnotationUri() {
    const annotation = this._route.snapshot.queryParamMap.get(RouteConstants.annotationQueryParam);
    if (!annotation) {
      return;
    }

    this._regionService.showRegions(true);
    this._regionService.selectRegion(annotation);
  }

  private _checkForCompoundNavigation(resource: ReadResource) {
    this._dspApi.v2.search
      .doSearchStillImageRepresentationsCount(resource.id)
      .pipe(take(1))
      .subscribe(countQuery => {
        const countQuery_ = countQuery as CountQueryResponse;
        this.isCompoundNavigation = countQuery_.numberOfResults > 0;
        if (this.isCompoundNavigation) {
          this._compoundService.onInit(new DspCompoundPosition(countQuery_.numberOfResults), this.resource);
          this._cdr.detectChanges();
        } else {
          this._compoundService.incomingResource.next(undefined);
        }
      });
  }
}
