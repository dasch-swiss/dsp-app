import { Component, Input, OnChanges } from '@angular/core';
import { Segment } from './segment';

@Component({
  selector: 'app-segments-display',
  template: ` <div style="background: black; padding: 0 24px" [ngStyle]="{ height: height + 'px' }">
    <div style="position: relative">
      <div *ngFor="let row of segmentInRow" style="height: 10px">
        <app-segment *ngFor="let segment of row" [segment]="segment" [videoLengthSecs]="videoLengthSecs" />
      </div>
    </div>
  </div>`,
})
export class SegmentsDisplayComponent implements OnChanges {
  @Input({ required: true }) segments!: Segment[];
  @Input({ required: true }) videoLengthSecs!: number;

  segmentInRow!: Segment[][];
  height!: number;
  readonly rowHeight = 8;

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
