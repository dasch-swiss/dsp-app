import { Component, Input, OnChanges, OnDestroy, OnInit } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { Constants } from '@dasch-swiss/dsp-js';
import { DspResource, PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { RegionService } from '@dasch-swiss/vre/shared/app-representations';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { CompoundService } from './compound/compound.service';

@Component({
  selector: 'app-resource-tabs',
  template: `
    <mat-tab-group
      *ngIf="!resource.res.isDeleted"
      animationDuration="0ms"
      [(selectedIndex)]="selectedTab"
      (selectedTabChange)="tabChanged($event)">
      <mat-tab #matTabProperties [label]="'appLabels.resource.properties' | translate">
        <app-properties-display *ngIf="resourceProperties" [resource]="resource" [properties]="resourceProperties" />
      </mat-tab>

      <mat-tab
        *ngIf="compoundService.incomingResource as incomingResource"
        #matTabIncoming
        [label]="resourceClassLabel(incomingResource)">
        <app-properties-display
          [resource]="incomingResource"
          [properties]="incomingResource.resProps"
          [displayLabel]="true" />
      </mat-tab>

      <!-- annotations -->
      <mat-tab label="Annotations" *ngIf="displayAnnotations">
        <ng-template matTabLabel class="annotations">
          <span [matBadge]="regionService.regions.length" matBadgeColor="primary" matBadgeOverlap="false">
            Annotations
          </span>
        </ng-template>
        <app-annotation-tab *ngIf="annotationTabSelected && regionService.regions.length > 0" [resource]="resource" />
      </mat-tab>
    </mat-tab-group>
  `,
})
export class ResourceTabsComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true }) resource!: DspResource;

  selectedTab = 0;
  resourceProperties!: PropertyInfoValues[];
  annotationTabSelected = false;

  private ngUnsubscribe = new Subject<void>();

  get displayAnnotations() {
    return this.resource.res.properties[Constants.HasStillImageFileValue] !== undefined || this.compoundService.exists;
  }

  constructor(
    public regionService: RegionService,
    public compoundService: CompoundService,
    private _route: ActivatedRoute
  ) {}

  resourceClassLabel = (resource: DspResource) => resource.res.entityInfo?.classes[resource.res.type].label;

  tabChanged(event: MatTabChangeEvent) {
    this.annotationTabSelected = event.tab.textLabel === 'Annotations';
  }

  ngOnInit() {
    this._highlightAnnotationFromUri();
  }

  ngOnChanges() {
    this.resourceProperties = this.resource.resProps
      .filter(prop => !prop.propDef['isLinkProperty'])
      .filter(prop => !prop.propDef.subPropertyOf.includes('http://api.knora.org/ontology/knora-api/v2#hasFileValue'));
  }

  ngOnDestroy() {
    this.ngUnsubscribe.unsubscribe();
  }

  private _highlightAnnotationFromUri() {
    const annotation = this._route.snapshot.queryParamMap.get(RouteConstants.annotationQueryParam);
    if (!annotation) {
      return;
    }

    this.regionService.imageIsLoaded$
      .pipe(
        filter(loaded => loaded),
        takeUntil(this.ngUnsubscribe)
      )
      .subscribe(() => {
        this._openAnnotationTab();
        this.regionService.highlightRegion(annotation);
      });
  }

  private _openAnnotationTab() {
    this.selectedTab = 2;
  }
}
