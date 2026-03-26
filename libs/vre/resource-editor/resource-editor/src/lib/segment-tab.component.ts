import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { delay, Subscription } from 'rxjs';
import { IncomingResourceToolbarComponent } from './incoming-resource-toolbar.component';
import { PropertiesDisplayComponent } from './properties-display/properties-display.component';
import { ResourceInfoBarComponent } from './resource-info-bar.component';
import { Segment } from './segment-support/segment';
import { SegmentsService } from './segment-support/segments.service';

@Component({
  selector: 'app-segment-tab',
  template: `
    <mat-accordion>
      @for (segment of segmentsService.segments; track segment.resource.res.id) {
        <mat-expansion-panel
          #panel
          [attr.data-segment-resource]="segment.resource.res.id"
          [class.active]="segment === selectedSegment"
          [expanded]="segment === selectedSegment"
          data-cy="segment-border">
          <mat-expansion-panel-header>
            <div style="width: 100%; display: flex; align-items: center; justify-content: space-between">
              <h3 class="label">{{ segment.label }}</h3>
              <div style="display: flex; align-items: center;">
                <button
                  mat-icon-button
                  matTooltip="Go to segment"
                  color="primary"
                  matTooltipPosition="above"
                  (click)="onTargetClicked(segment); $event.stopPropagation()">
                  <mat-icon>my_location</mat-icon>
                </button>
                <app-incoming-resource-toolbar [resource]="segment.resource.res" (click)="$event.stopPropagation()" />
              </div>
            </div>
          </mat-expansion-panel-header>
          @if (panel.expanded) {
            <app-resource-info-bar [resource]="segment.resource.res" />
            <app-properties-display [resource]="segment.resource" [parentResourceId]="resource.id" />
          }
        </mat-expansion-panel>
      }
    </mat-accordion>
  `,
  styles: ['.active {border: 1px solid} app-resource-info-bar {display: flex; flex-direction: row-reverse}'],
  imports: [
    MatButtonModule,
    MatExpansionModule,
    MatIconModule,
    MatTooltipModule,
    IncomingResourceToolbarComponent,
    PropertiesDisplayComponent,
    ResourceInfoBarComponent,
  ],
})
export class SegmentTabComponent implements OnInit, OnDestroy {
  @Input({ required: true }) resource!: ReadResource;

  selectedSegment: Segment | null = null;
  subscription!: Subscription;

  constructor(
    public segmentsService: SegmentsService,
    private readonly _cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.subscription = this.segmentsService.highlightSegment$
      .pipe(
        delay(100) // delay in order to let time to change tab and then scroll
      )
      .subscribe(segment => {
        this.selectedSegment = segment;
        if (segment !== null) {
          this._openSegment(segment.resource.res.id);
        }
        this._cdr.detectChanges();
      });
  }

  onTargetClicked(segment: Segment) {
    this.segmentsService.playSegment(segment);
  }

  private _openSegment(iri: string) {
    const element = document.querySelector(`[data-segment-resource="${iri}"]`) as HTMLElement;
    element?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
