import { Component, Input, OnChanges } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Constants, CountQueryResponse, ReadFileValue } from '@dasch-swiss/dsp-js';
import { DspCompoundPosition, DspResource } from '@dasch-swiss/vre/shared/app-common';
import { IncomingService } from '@dasch-swiss/vre/shared/app-common-to-move';
import { getFileValue, RegionService, ValueOperationEventService } from '@dasch-swiss/vre/shared/app-representations';
import { take } from 'rxjs/operators';
import { CompoundService } from './compound/compound.service';

@Component({
  selector: 'app-resource',
  template: `
    <div class="restricted-message" *ngIf="resource?.res?.userHasPermission === 'RV' && showRestrictedMessage">
      <mat-icon>report_problem</mat-icon>
      <p>
        This resource is restricted, file representations may be of lower quality and some properties may be hidden.
      </p>
      <mat-icon class="close" (click)="showRestrictedMessage = false">clear</mat-icon>
    </div>

    <div class="content large middle">
      <div class="resource-view" *ngIf="resource; else noResourceTpl">
        <app-resource-header [resource]="resource" />

        <ng-container *ngIf="isCompoundNavigation === false; else compoundViewerTpl">
          <app-resource-representation [resource]="resource" *ngIf="!resourceIsObjectWithoutRepresentation" />
        </ng-container>

        <dasch-swiss-app-progress-indicator *ngIf="!pageIsLoaded()" />

        <app-resource-tabs [resource]="resource" />
      </div>
    </div>

    <ng-template #compoundViewerTpl>
      <app-compound-viewer />
    </ng-template>

    <ng-template #noResourceTpl>
      <div>
        <p>The resource could not be found.</p>
        <p>Reasons:</p>
        <ul>
          <li>It could be a deleted resource and does not exist anymore.</li>
          <li>You don't have the permissions to open this resource.</li>
          <li>The identifier or the ARK URL is wrong.</li>
        </ul>
      </div>
    </ng-template>
  `,
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
