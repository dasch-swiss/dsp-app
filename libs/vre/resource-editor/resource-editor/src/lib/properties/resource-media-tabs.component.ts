import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { DspResource } from '@dasch-swiss/vre/shared/app-common';
import { TranslatePipe } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { SegmentsService } from '../representation/segments/segments.service';
import { PropertiesDisplayComponent } from './properties-display/properties-display.component';
import { PropertiesToggleComponent } from './properties-display/properties-toggle.component';
import { PropertiesDisplayService } from './properties-display/property-value/properties-display.service';
import { ResourceRightsStatementContainerComponent } from './resource-rights-statement-container.component';
import { SegmentTabComponent } from './segment-tab.component';

@Component({
  selector: 'app-resource-media-tabs',
  template: `
    <mat-tab-group animationDuration="0ms" [selectedIndex]="selectedTab" (selectedTabChange)="onTabChange($event)">
      <mat-tab [label]="'resourceEditor.properties' | translate">
        <app-properties-toggle [properties]="resource.resProps" />
        <app-properties-display [resource]="resource" />
        <app-resource-rights-statement-container [resource]="resource" />
      </mat-tab>

      @if (segmentsService.segments.length > 0) {
        <mat-tab>
          <ng-template matTabLabel>
            <span [matBadge]="segmentsService.segments.length" matBadgeColor="primary" matBadgeOverlap="false">
              {{ 'resourceEditor.labelAnnotations' | translate }}
            </span>
          </ng-template>
          <app-segment-tab [resource]="resource.res" />
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
    `,
  ],
  imports: [
    MatBadgeModule,
    MatTabsModule,
    TranslatePipe,
    PropertiesDisplayComponent,
    PropertiesToggleComponent,
    ResourceRightsStatementContainerComponent,
    SegmentTabComponent,
  ],
})
export class ResourceMediaTabsComponent implements OnInit, OnDestroy {
  @Input({ required: true }) resource!: DspResource;

  selectedTab = 0;

  private readonly _destroy$ = new Subject<void>();

  constructor(
    private readonly _cdr: ChangeDetectorRef,
    public readonly segmentsService: SegmentsService,
    public readonly propertiesDisplayService: PropertiesDisplayService
  ) {}

  ngOnInit() {
    this.segmentsService.highlightSegment$.pipe(takeUntil(this._destroy$)).subscribe(segment => {
      if (segment) {
        this.selectedTab = 1;
        this._cdr.detectChanges();
      }
    });
  }

  ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
  }

  onTabChange(event: MatTabChangeEvent) {
    this.selectedTab = event.index;
  }
}
