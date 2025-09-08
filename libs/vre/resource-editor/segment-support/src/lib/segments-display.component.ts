import { Component, Input, OnChanges } from '@angular/core';
import { Segment } from './segment';

@Component({
  selector: 'app-segments-display',
  template: ` <div style="background: black; padding: 0 24px" [ngStyle]="{ height: height + 'px' }">
    <div style="position: relative">
      @for (row of segmentInRow; track row) {
        <div style="height: 10px">
          @for (segment of row; track segment) {
            <app-segment [segment]="segment" [videoLengthSecs]="videoLengthSecs" />
          }
        </div>
      }
    </div>
  </div>`,
})
export class SegmentsDisplayComponent implements OnChanges {
  @Input({ required: true }) segments!: Segment[];
  @Input({ required: true }) videoLengthSecs!: number;

  segmentInRow!: Segment[][];
  height!: number;

  ngOnChanges() {
    this.segmentInRow = this.segments.reduce(
      (array, current) => {
        if (current.row === array.length - 1) {
          array[array.length - 1].push(current);
        } else {
          array.push([current]);
        }
        return array;
      },
      [[]] as Segment[][]
    );
  }
}
