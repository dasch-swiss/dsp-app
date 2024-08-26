import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-media-slider',
  template: ` <mat-toolbar-row style="height: 34px; background-color: black">
    <mat-slider color="accent" style="width: 100%" [max]="max" [min]="0" [step]="1">
      <input matSliderThumb [ngModel]="currentTime" (ngModelChange)="afterNavigation.emit($event)" />
    </mat-slider>
  </mat-toolbar-row>`,
  styles: [
    `
      ::ng-deep .mdc-slider__thumb-knob {
        width: 0 !important;
        height: 0 !important;
        border-width: 7px !important;
      }
    `,
  ],
})
export class MediaSliderComponent {
  @Input({ required: true }) max!: number;
  @Input({ required: true }) currentTime!: number;
  @Output() afterNavigation = new EventEmitter<number>();
}
