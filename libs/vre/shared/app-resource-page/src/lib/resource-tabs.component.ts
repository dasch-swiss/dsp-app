import { Component, Input, OnChanges } from '@angular/core';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { DspResource, PropertyInfoValues } from '@dasch-swiss/vre/shared/app-common';
import { RegionService } from '@dasch-swiss/vre/shared/app-representations';
import { CompoundService } from './compound/compound.service';

@Component({
  selector: 'app-resource-tabs',
  template: `
    <mat-tab-group
      *ngIf="!resource.res.isDeleted"
      animationDuration="0ms"
      [(selectedIndex)]="selectedTab"
      (selectedTabChange)="tabChanged($event)">
      <!-- first tab for the main resource e.g. book -->
      <mat-tab #matTabProperties [label]="'appLabels.resource.properties' | translate">
        <app-properties-display *ngIf="resourceProperties" [resource]="resource" [properties]="resourceProperties" />
      </mat-tab>

      <!-- incoming (compound object) resource -->
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
      <ng-container *ngIf="regionService as irs">
        <mat-tab label="Annotations" *ngIf="true">
          <ng-template matTabLabel class="annotations">
            <span [matBadge]="irs.regions.length" matBadgeColor="primary" matBadgeOverlap="false"> Annotations </span>
          </ng-template>
          <app-annotation-tab *ngIf="irs.regions.length > 0" />
        </mat-tab>
      </ng-container>
    </mat-tab-group>
  `,
})
export class ResourceTabsComponent implements OnChanges {
  @Input({ required: true }) resource!: DspResource;

  selectedTab = 0;

  constructor(
    public regionService: RegionService,
    public compoundService: CompoundService
  ) {}

  resourceProperties!: PropertyInfoValues[];
  loading = true;

  resourceClassLabel = (resource: DspResource) => resource.res.entityInfo?.classes[resource.res.type].label;

  tabChanged(event: MatTabChangeEvent) {
    this.regionService.displayRegions(event.tab.textLabel === 'Annotations');
  }

  ngOnChanges() {
    this.resourceProperties = this.resource.resProps
      .filter(prop => !prop.propDef['isLinkProperty'])
      .filter(prop => !prop.propDef.subPropertyOf.includes('http://api.knora.org/ontology/knora-api/v2#hasFileValue'));

    this.regionService.regionAdded$.subscribe(() => {
      this.selectedTab = 2;
    });
  }
}
