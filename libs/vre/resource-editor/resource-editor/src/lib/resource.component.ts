import { ChangeDetectorRef, Component, Input, OnChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Constants, CountQueryResponse, ReadFileValue } from '@dasch-swiss/dsp-js';
import { getFileValue, RegionService } from '@dasch-swiss/vre/resource-editor/representations';
import { SegmentsService } from '@dasch-swiss/vre/resource-editor/segment-support';
import { DspCompoundPosition, DspResource } from '@dasch-swiss/vre/shared/app-common';
import { IncomingService } from '@dasch-swiss/vre/shared/app-common-to-move';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { take } from 'rxjs/operators';
import { CompoundService } from './compound/compound.service';

@Component({
  selector: 'app-resource',
  template: `
    <app-resource-restriction *ngIf="resource.res.userHasPermission === 'RV'" />

    <div class=" content large middle">
      <div class="resource-view">
        <app-resource-header [resource]="resource" />
        <app-resource-representation [resource]="resource" *ngIf="!resourceIsObjectWithoutRepresentation" />
        <app-compound-viewer *ngIf="isCompoundNavigation" />
        <app-resource-tabs [resource]="resource" />
      </div>
    </div>
  `,
  styleUrls: ['./resource.component.scss'],
  providers: [CompoundService, RegionService, SegmentsService],
})
export class ResourceComponent implements OnChanges {
  @Input({ required: true }) resource!: DspResource;
  representationsToDisplay!: ReadFileValue;
  isCompoundNavigation = false;
  resourceIsObjectWithoutRepresentation!: boolean;

  constructor(
    private _cdr: ChangeDetectorRef,
    private _incomingService: IncomingService,
    private _compoundService: CompoundService,
    private _regionService: RegionService,
    private _route: ActivatedRoute
  ) {}

  ngOnChanges() {
    this.resourceIsObjectWithoutRepresentation = this._isObjectWithoutRepresentation(this.resource);
    this._onInit(this.resource);
  }

  private _onInit(resource: DspResource) {
    if (this._isObjectWithoutRepresentation(resource)) {
      this._checkForCompoundNavigation(resource);
      return;
    }

    this.representationsToDisplay = getFileValue(resource)!;

    if (this._isStillImage(resource)) {
      this._regionService.initialize(resource.res.id);
      this._checkForAnnotationUri();
    }
  }

  private _isStillImage(resource: DspResource) {
    return resource.res.properties[Constants.HasStillImageFileValue] !== undefined;
  }

  private _isObjectWithoutRepresentation(resource: DspResource) {
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

  private _checkForCompoundNavigation(resource: DspResource) {
    this._incomingService
      .getStillImageRepresentationsForCompoundResource(resource.res.id, 0, true)
      .pipe(take(1))
      .subscribe(countQuery => {
        const countQuery_ = countQuery as CountQueryResponse;
        this.isCompoundNavigation = countQuery_.numberOfResults > 0;
        if (this.isCompoundNavigation) {
          this._compoundService.onInit(new DspCompoundPosition(countQuery_.numberOfResults), this.resource);
          this._cdr.detectChanges();
        }
      });
  }
}
