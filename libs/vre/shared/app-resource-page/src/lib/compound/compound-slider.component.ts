import { Component } from '@angular/core';
import { CompoundService } from './compound.service';

@Component({
  selector: 'app-compound-slider',
  template: ` <mat-slider
    [color]="'primary'"
    [disabled]="compoundNavigation.totalPages < 2"
    [max]="compoundNavigation.totalPages"
    [min]="1"
    [step]="1"
    showTickMarks
    discrete
    #ngSlider
    style="display: flex"
    ><input
      matSliderThumb
      [(ngModel)]="compoundNavigation.page"
      (change)="
        openPage(
          {
            source: ngSliderThumb,
            parent: ngSlider,
            value: ngSliderThumb.value
          }.value
        )
      "
      #ngSliderThumb="matSliderThumb" />
  </mat-slider>`,
})
export class CompoundSliderComponent {
  get compoundNavigation() {
    return this.compoungService.compoundPosition;
  }

  openPage(page: number) {
    this.compoungService.openPage(page);
  }

  constructor(public compoungService: CompoundService) {}
}
