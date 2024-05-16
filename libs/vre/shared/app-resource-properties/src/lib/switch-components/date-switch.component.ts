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
        <span>{{ start | knoraDate: 'dd.MM.YYYY' : 'era' }}</span>
        -
        <span>{{ end | knoraDate: 'dd.MM.YYYY' : 'era' }}</span>
      </ng-container>
    </ng-container>

    <ng-template #knoraDateTpl>
      <ng-container *ngTemplateOutlet="calendarType; context: { date: knoraDate }"></ng-container>
      <span>{{ knoraDate | knoraDate: 'dd.MM.YYYY' : 'era' }}</span>
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
