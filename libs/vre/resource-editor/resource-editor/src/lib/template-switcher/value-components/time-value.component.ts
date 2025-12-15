import { Component, Input } from '@angular/core';
import { FormControl, FormsModule } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatDateFormats } from '@angular/material/core';
import { MatDatepicker, MatDatepickerInput, MatDatepickerToggle } from '@angular/material/datepicker';
import { MatError, MatFormField, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { HumanReadableErrorPipe } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';
import { DateTime } from '../../resource-properties/date-time';
import { CustomDateAdapter } from './custom-date-adapter';

const NATIVE_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'input',
  },
  display: {
    dateInput: 'input',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

@Component({
  selector: 'app-time-value',
  imports: [
    MatFormField,
    MatInput,
    MatDatepickerInput,
    FormsModule,
    TranslatePipe,
    MatSuffix,
    MatDatepickerToggle,
    MatDatepicker,
    MatError,
    HumanReadableErrorPipe,
  ],
  providers: [
    { provide: DateAdapter, useClass: CustomDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: NATIVE_DATE_FORMATS },
  ],
  template: `
    <div style="display: flex; gap: 8px">
      <mat-form-field>
        <input
          matInput
          [matDatepicker]="picker"
          [ngModel]="control.value?.date"
          (dateChange)="editDate($event)"
          (click)="picker.open()"
          [attr.aria-label]="'resourceEditor.templateSwitcher.timeValue.date' | translate"
          [placeholder]="'resourceEditor.templateSwitcher.timeValue.datePlaceholder' | translate"
          readonly />
        <mat-datepicker-toggle matSuffix [for]="picker" />
        <mat-datepicker #picker />
      </mat-form-field>

      <mat-form-field>
        <input
          matInput
          [disabled]="!control.value?.date"
          [ngModel]="control.value?.time"
          (ngModelChange)="editTime($event)"
          type="time"
          [attr.aria-label]="'resourceEditor.templateSwitcher.timeValue.time' | translate"
          data-cy="time-input" />
      </mat-form-field>
    </div>
    @if (control.touched && control.errors; as errors) {
      <mat-error>{{ errors | humanReadableError }}</mat-error>
    }
  `,
})
export class TimeValueComponent {
  @Input({ required: true }) control!: FormControl<DateTime>;

  editTime(newValue: string) {
    const newDate = new DateTime(this.control.value?.date, newValue);
    this.control.patchValue(newDate);
  }

  editDate(event: { value: Date }) {
    if (!event.value) {
      return;
    }

    if (!this.control.value?.time) {
      this.control.patchValue(new DateTime(event.value, '00:00'));
      return;
    }
    const newValue = new DateTime(event.value, this.control.value.time);
    this.control.patchValue(newValue);
  }
}
