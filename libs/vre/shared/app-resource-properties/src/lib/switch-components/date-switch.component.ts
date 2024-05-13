import { Component, Input, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { KnoraDate, KnoraPeriod } from '@dasch-swiss/dsp-js';
import { IsSwitchComponent } from './is-switch-component.interface';

@Component({
  selector: 'app-date-switch',
  template: `
    <ng-container *ngIf="displayMode; else editMode">
      <ng-container *ngIf="isKnoraPeriod; else knoraDateTpl">
        <ng-container *ngTemplateOutlet="calendarType; context: { date: start }"></ng-container>
        <span *ngIf="start.day as startDay">{{ startDay }}.</span
        ><span *ngIf="start.month as startMonth">{{ startMonth }}.</span>{{ start.year }}
        <span
          >- <span *ngIf="end.day as endDay">{{ endDay }}.</span
          ><span *ngIf="end.month as endMonth">{{ end.month }}.</span>{{ end.year }}</span
        >
      </ng-container>
    </ng-container>

    <ng-template #knoraDateTpl>
      <ng-container *ngTemplateOutlet="calendarType; context: { date: knoraDate }"></ng-container>
      <span *ngIf="knoraDate.day as knoraDateDay">{{ knoraDateDay }}.</span>
      <span *ngIf="knoraDate.month as knoraDateMonth">{{ knoraDateMonth }}.</span>
      {{ knoraDate.year }}
    </ng-template>

    <ng-template #editMode>
      <app-date-value-handler [formControl]="control"></app-date-value-handler>
      <mat-error *ngIf="control.touched && control.errors as errors">{{ errors | humanReadableError }}</mat-error>
    </ng-template>

    <ng-template #calendarType let-date="date">
      <div class="mat-body-2" style="font-size: 12px">{{ date | knoraDate: 'dd.MM.YYYY' : 'calendarOnly' }}</div>
    </ng-template>
  `,
})
export class DateSwitchComponent implements IsSwitchComponent, OnInit {
  get start() {
    return (this.control.value as KnoraPeriod).start;
  }

  get end() {
    return (this.control.value as KnoraPeriod).end;
  }

  get knoraDate() {
    return this.control.value as KnoraDate;
  }

  @Input() control!: FormControl<KnoraDate | KnoraPeriod>;
  @Input() displayMode = true;

  isKnoraPeriod!: boolean;

  ngOnInit() {
    this.isKnoraPeriod = this.control.value instanceof KnoraPeriod;
  }
}
