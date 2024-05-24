import { Component, Input, OnChanges } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Constants, CountQueryResponse, ReadFileValue } from '@dasch-swiss/dsp-js';
import { DspCompoundPosition, DspResource } from '@dasch-swiss/vre/shared/app-common';
import { getFileValue, RegionService, ValueOperationEventService } from '@dasch-swiss/vre/shared/app-representations';
import { IncomingService } from '@dasch-swiss/vre/shared/app-resource-properties';
import { take } from 'rxjs/operators';
import { CompoundService } from './compound/compound.service';

@Component({
  selector: 'app-resource',
  templateUrl: './resource.component.html',
  styleUrls: ['./resource.component.scss'],
  providers: [ValueOperationEventService, CompoundService, RegionService],
})
export class ResourceComponent implements OnChanges {
  @Input({ required: true }) resource!: DspResource;
  representationsToDisplay!: ReadFileValue;
  isCompoundNavigation: boolean | null = null;
  showRestrictedMessage = true;
  resourceIsObjectWithoutRepresentation!: boolean;

  constructor(
    private _router: Router,
    private _titleService: Title,
    private _incomingService: IncomingService,
    private _compoundService: CompoundService,
    private _regionService: RegionService
  ) {
    this._router.events.subscribe(() => {
      this._titleService.setTitle('Resource view');
    });
  }

  ngOnChanges() {
    this.showRestrictedMessage = true;
    this.resourceIsObjectWithoutRepresentation = getFileValue(this.resource) === null;

    this.onInit(this.resource);
  }

  onInit(resource: DspResource) {
    if (this._isObjectWithoutRepresentation(resource)) {
      this._checkForCompoundNavigation(resource);
      return;
    }

    this.isCompoundNavigation = false;
    this.representationsToDisplay = getFileValue(resource)!;

    if (this._isImageWithRegions(resource)) {
      this._regionService.onInit(resource);
    }
  }

  pageIsLoaded() {
    return (
      this.isCompoundNavigation === false ||
      (this.isCompoundNavigation === true && this._compoundService.incomingResource !== undefined)
    );
  }

  private _isImageWithRegions(resource: DspResource) {
    return resource.res.properties[Constants.HasStillImageFileValue] !== undefined;
  }

  private _isObjectWithoutRepresentation(resource: DspResource) {
    return getFileValue(resource) === null;
  }

  private _checkForCompoundNavigation(resource: DspResource) {
    this._incomingService
      .getStillImageRepresentationsForCompoundResource(resource.res.id, 0, true)
      .pipe(take(1))
      .subscribe(countQuery => {
        const countQuery_ = countQuery as CountQueryResponse;

        if (countQuery_.numberOfResults > 0) {
          this.isCompoundNavigation = true;
          this._compoundService.onInit(new DspCompoundPosition(countQuery_.numberOfResults), this.resource);
          return;
        }

        this.isCompoundNavigation = false;
      });
  }
}
