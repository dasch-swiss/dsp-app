import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DateTime } from '../date-time';
import { dateTimeTimestamp } from '../date-time-timestamp';
import { IsSwitchComponent } from './is-switch-component.interface';

@Component({
  selector: 'app-time-switch',
  template: ` <ng-container *ngIf="displayMode; else editMode">
      <div data-cy="time-switch-date">Date: {{ dateAndTimestamp | date }}</div>
      <div data-cy="time-switch-time">Time: {{ dateAndTimestamp | date: 'HH:mm' }}</div>
    </ng-container>
    <ng-template #editMode>
      <app-time-value [control]="control" />
    </ng-template>`,
})
export class TimeSwitchComponent implements IsSwitchComponent {
  @Input() control!: FormControl<DateTime>;
  @Input() displayMode = true;

  get dateAndTimestamp() {
    if (!this.control.value || !this.control.value?.date || !this.control.value?.time) {
      return null;
    }
    return dateTimeTimestamp(this.control.value.date, this.control.value.time);
  }
}
