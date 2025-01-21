import { Component, EventEmitter, HostListener, Output } from '@angular/core';
import { secondsToTimeString } from '@dasch-swiss/vre/ui/ui';
import { Segment } from './segment';
import { SegmentsService } from './segments.service';

@Component({
  selector: 'app-segment-tooltip',
  template: ` <div class="tooltip">
    <div class="mat-h5" style="margin-bottom: 0!important">
      <div>{{ segment.label }}</div>
      {{ segment.hasSegmentBounds.end - segment.hasSegmentBounds.start | timeFormat }}
    </div>
    <button mat-icon-button (click)="highlightSegment()">
      <mat-icon>arrow_downward</mat-icon>
    </button>
  </div>`,
  styles: [
    `
      .tooltip {
        display: flex;
        align-items: center;
        padding: 0 8px;
        border-radius: 5px;
        background-color: #616161;
        color: white;
      }
    `,
  ],
})
export class SegmentTooltipComponent {
  segment!: Segment;

  constructor(public segmentsService: SegmentsService) {}

  @Output() mouseEnter = new EventEmitter<void>();
  @Output() mouseLeave = new EventEmitter<void>();

  @HostListener('mouseenter')
  onMouseEnter() {
    this.mouseEnter.emit();
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    this.mouseLeave.emit();
  }

  highlightSegment() {
    this.segmentsService.highlightSegment(this.segment);
    this.mouseLeave.emit();
  }

  protected readonly secondsToTimeString = secondsToTimeString;
}
