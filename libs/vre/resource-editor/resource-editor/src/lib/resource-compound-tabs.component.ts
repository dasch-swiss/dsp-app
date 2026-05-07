import { AsyncPipe, NgClass } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { TranslatePipe } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { AnnotationTabComponent } from './annotation-tab.component';
import { CompoundService } from './compound/compound.service';
import { IncomingResourceHeaderComponent } from './header/incoming-resource-header.component';
import { PropertiesDisplayComponent } from './properties-display/properties-display.component';
import { PropertiesToggleComponent } from './properties-display/properties-toggle.component';
import { RegionService } from './representations/region.service';
import { PropertiesDisplayService } from './resource-properties/properties-display.service';

@Component({
  selector: 'app-resource-compound-tabs',
  template: `
    <mat-tab-group animationDuration="0ms" [selectedIndex]="selectedTab" (selectedTabChange)="onTabChange($event)">
      <mat-tab [label]="'resourceEditor.properties' | translate">
        <app-properties-toggle [properties]="resource.resProps" />
        <app-properties-display [resource]="resource" />
      </mat-tab>

      @if (incomingResource) {
        <mat-tab [label]="resourceClassLabel(incomingResource.res)">
          <app-incoming-resource-header [resource]="incomingResource.res" />
          <app-properties-display [resource]="incomingResource" [parentResourceId]="resource.res.id" />
        </mat-tab>
      }

      @if (regionsCount > 0) {
        <mat-tab>
          <ng-template matTabLabel>
            <span>{{ 'resourceEditor.labelAnnotations' | translate }}</span>
            <span style="margin-left: 0.5em;" [matBadge]="regionsCount" matBadgeColor="primary" matBadgeOverlap="false">
            </span>
            <span [ngClass]="['dots-container', (regionService.regionsLoading$ | async) ? 'dots' : '']"> </span>
          </ng-template>
          <app-annotation-tab [resource]="resource.res" />
        </mat-tab>
      }
    </mat-tab-group>
  `,
  styles: [
    `
      :host ::ng-deep {
        .mat-mdc-tab-body,
        .mat-mdc-tab-body-content {
          height: auto !important;
          overflow: visible !important;
        }
      }
      .dots-container {
        margin-left: 1.5em;
        min-width: 3ch;
      }
      .dots {
        position: relative;
        display: inline-block;
        color: var(--primary);
      }
      .dots::after {
        content: '...';
        display: inline-block;
        overflow: hidden;
        width: 0;
        vertical-align: bottom;
        animation: dots 1s steps(3, end) infinite;
      }
      @keyframes dots {
        to {
          width: 3ch;
        }
      }
    `,
  ],
  imports: [
    AsyncPipe,
    NgClass,
    MatBadgeModule,
    MatTabsModule,
    TranslatePipe,
    AnnotationTabComponent,
    IncomingResourceHeaderComponent,
    PropertiesDisplayComponent,
    PropertiesToggleComponent,
  ],
})
export class ResourceCompoundTabsComponent implements OnInit, OnDestroy {
  @Input({ required: true }) resource!: DspResource;

  selectedTab = 0;
  incomingResource: DspResource | undefined;
  regionsCount = 0;

  private readonly _destroy$ = new Subject<void>();

  constructor(
    private readonly _cdr: ChangeDetectorRef,
    public readonly regionService: RegionService,
    private readonly _compoundService: CompoundService,
    public readonly propertiesDisplayService: PropertiesDisplayService
  ) {}

  resourceClassLabel = (resource: ReadResource | undefined) => resource?.entityInfo?.classes[resource.type].label || '';

  ngOnInit() {
    this._compoundService.incomingResource$.pipe(takeUntil(this._destroy$)).subscribe(resource => {
      this.incomingResource = resource;
      this._cdr.detectChanges();
    });

    this.regionService.selectedRegion$.pipe(takeUntil(this._destroy$)).subscribe(region => {
      if (region) {
        this.selectedTab = this.incomingResource ? 2 : 1;
        this._cdr.detectChanges();
      }
    });

    this.regionService.regions$.pipe(takeUntil(this._destroy$)).subscribe(regions => {
      this.regionsCount = regions.length;
      this._cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }

  onTabChange(event: MatTabChangeEvent) {
    this.selectedTab = event.index;
    const isAnnotationTab =
      (this.incomingResource && event.index === 2) || (!this.incomingResource && event.index === 1);
    if (isAnnotationTab) {
      this.regionService.showRegions(true);
    } else {
      this.regionService.showRegions(false);
    }
  }
}
