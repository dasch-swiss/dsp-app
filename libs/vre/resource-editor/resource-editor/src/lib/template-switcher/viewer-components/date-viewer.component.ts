import { Component, Input, OnInit } from '@angular/core';
import { KnoraDate, KnoraPeriod, ReadDateValue } from '@dasch-swiss/dsp-js';

@Component({
  selector: 'app-date-viewer',
  template: `
    @if (isKnoraPeriod) {
      <span>{{ start | knoraDate: 'dd.MM.YYYY' : 'era' }}</span>
      -
      <span>{{ end | knoraDate: 'dd.MM.YYYY' : 'era' }}</span>
      <ng-container *ngTemplateOutlet="calendarType; context: { date: start }"></ng-container>
    } @else {
      <span>{{ knoraDate | knoraDate: 'dd.MM.YYYY' : 'era' }}</span>
      <ng-container *ngTemplateOutlet="calendarType; context: { date: knoraDate }"></ng-container>
    }

    <ng-template #calendarType let-date="date">
      <span data-cy="date-switch" style="display: inline-block; margin-left: 8px">
        ({{ date | knoraDate: 'dd.MM.YYYY' : 'calendarOnly' }})
      </span>
    </ng-template>
  `,
  standalone: false,
})
export class DateViewerComponent implements OnInit {
  @Input({ required: true }) value!: ReadDateValue;

  get start() {
    return (this.value.date as KnoraPeriod).start;
  }

  get end() {
    return (this.value.date as KnoraPeriod).end;
  }

  get knoraDate() {
    return this.value.date as KnoraDate;
  }

  isKnoraPeriod!: boolean;

  ngOnInit() {
    this.isKnoraPeriod = this.value.date instanceof KnoraPeriod;
  }
}
