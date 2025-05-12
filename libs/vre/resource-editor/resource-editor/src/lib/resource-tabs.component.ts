import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Constants, ReadResource } from '@dasch-swiss/dsp-js';
import { RegionService } from '@dasch-swiss/vre/resource-editor/representations';
import { SegmentsService } from '@dasch-swiss/vre/resource-editor/segment-support';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CompoundService } from './compound/compound.service';

@Component({
  selector: 'app-resource-tabs',
  template: `
    <mat-tab-group animationDuration="0ms" [selectedIndex]="selectedTab" (selectedTabChange)="onTabChange($event)">
      <mat-tab #matTabProperties [label]="'resourceEditor.properties' | translate">
        <app-properties-display *ngIf="resource" [resource]="resource" />
      </mat-tab>

      <mat-tab *ngIf="incomingResource" #matTabIncoming [label]="resourceClassLabel(incomingResource.res)">
        <app-properties-display
          [resource]="incomingResource"
          [displayLabel]="true"
          [parentResourceId]="resource.res.id" />
      </mat-tab>

      <!-- image annotations -->
      <mat-tab label="Annotations" *ngIf="displayAnnotations">
        <ng-template matTabLabel>
          {{ 'resourceEditor.labelAnnotations' | translate }}
          <span *ngIf="regionsCount > 0" [matBadge]="regionsCount" matBadgeColor="primary" matBadgeOverlap="false">
          </span>
        </ng-template>
        <app-annotation-tab [resource]="resource.res" />
      </mat-tab>

      <!-- audio & video annotations -->
      <mat-tab label="Segments" *ngIf="segmentsService.segments.length > 0">
        <ng-template matTabLabel>
          <span [matBadge]="segmentsService.segments.length" matBadgeColor="primary" matBadgeOverlap="false">
            {{ 'resourceEditor.labelAnnotations' | translate }}
          </span>
        </ng-template>
        <app-segment-tab [resource]="resource.res" />
      </mat-tab>
    </mat-tab-group>
  `,
  styles: [
    `
      :host ::ng-deep {
        .mat-mdc-tab-body {
          width: 100%;
        }
        .mat-mdc-tab-body.mat-mdc-tab-body-active,
        .mat-mdc-tab-body-content,
        .mat-mdc-tab-body-wrapper {
          overflow: visible;
        }
      }
    `,
  ],
})
export class ResourceTabsComponent implements OnInit, OnDestroy {
  @Input({ required: true }) resource!: DspResource;

  selectedTab = 0;
  incomingResource: DspResource | undefined;

  private ngUnsubscribe = new Subject<void>();

  regionsCount = 0;

  get displayAnnotations() {
    return (
      (this.resource.res.properties[Constants.HasStillImageFileValue] !== undefined || this.incomingResource) &&
      this.regionsCount > 0
    );
  }

  constructor(
    private _cdr: ChangeDetectorRef,
    public regionService: RegionService,
    private _compoundService: CompoundService,
    public segmentsService: SegmentsService
  ) {}

  resourceClassLabel = (resource: ReadResource | undefined) => resource?.entityInfo?.classes[resource.type].label || '';

  ngOnInit() {
    this.segmentsService.highlightSegment$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(segment => {
      if (segment) {
        this.selectedTab = 1;
        this._cdr.detectChanges();
      }
    });

    this._compoundService.incomingResource$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(resource => {
      this.incomingResource = resource;
      this._cdr.detectChanges();
    });

    this.regionService.selectedRegion$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(region => {
      if (region) {
        this.selectedTab = 2;
        this._cdr.detectChanges();
      }
    });

    this.regionService.regions$.pipe(takeUntil(this.ngUnsubscribe)).subscribe(regions => {
      this.regionsCount = regions.length;
      this._cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.ngUnsubscribe.unsubscribe();
  }

  onTabChange(event: any) {
    this.selectedTab = event.index;
    if ((this.incomingResource && event.index === 2) || (!this.incomingResource && event.index === 1)) {
      this._openAnnotationTab();
    } else {
      this.regionService.showRegions(false);
    }
  }

  private _openAnnotationTab() {
    this.selectedTab = 2;
    this.regionService.showRegions(true);
  }
}
