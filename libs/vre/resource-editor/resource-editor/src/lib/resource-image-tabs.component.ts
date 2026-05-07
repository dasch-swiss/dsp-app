import { AsyncPipe, NgClass } from '@angular/common';
import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { TranslatePipe } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { PropertiesDisplayComponent } from './properties/properties-display/properties-display.component';
import { PropertiesToggleComponent } from './properties/properties-display/properties-toggle.component';
import { PropertiesDisplayService } from './properties/properties-display/property-value/properties-display.service';
import { RegionService } from './representation/region.service';
import { AnnotationTabComponent } from './resource/annotation/annotation-tab.component';

@Component({
  selector: 'app-resource-image-tabs',
  template: `
    <mat-tab-group animationDuration="0ms" [selectedIndex]="selectedTab" (selectedTabChange)="onTabChange($event)">
      @if (!annotationIri) {
        <mat-tab [label]="'resourceEditor.properties' | translate">
          <app-properties-toggle [properties]="resource.resProps" />
          <app-properties-display [resource]="resource" />
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
    PropertiesDisplayComponent,
    PropertiesToggleComponent,
  ],
})
export class ResourceImageTabsComponent implements OnInit, OnDestroy {
  @Input({ required: true }) resource!: DspResource;
  @Input() annotationIri: string | null = null;

  selectedTab = 0;
  regionsCount = 0;

  private readonly _destroy$ = new Subject<void>();

  constructor(
    private readonly _cdr: ChangeDetectorRef,
    public readonly regionService: RegionService,
    public readonly propertiesDisplayService: PropertiesDisplayService
  ) {}

  ngOnInit() {
    // When annotationIri is set, ResourceImageComponent calls showRegions(true) directly on init;
    // tab-level showRegions toggling only applies to user-driven tab switches via onTabChange.
    this.regionService.selectedRegion$.pipe(takeUntil(this._destroy$)).subscribe(region => {
      if (region) {
        this.selectedTab = this.annotationIri ? 0 : 1;
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
    const isAnnotationTab = (this.annotationIri && event.index === 0) || (!this.annotationIri && event.index === 1);
    if (isAnnotationTab) {
      this.regionService.showRegions(true);
    } else {
      this.regionService.showRegions(false);
    }
  }
}
