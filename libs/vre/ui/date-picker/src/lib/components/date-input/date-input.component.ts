/**
 * Date input component with calendar picker.
 *
 * A modern, standalone Angular component that integrates with Angular Material
 * datepicker and supports multiple calendar systems.
 *
 * @example
 * ```typescript
 * <app-date-input
 *   [calendarSystem]="'GREGORIAN'"
 *   [placeholder]="'Select date'"
 *   [minDate]="minDate"
 *   [maxDate]="maxDate"
 *   formControlName="date">
 * </app-date-input>
 * ```
 */

import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, forwardRef, signal, computed, inject } from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { DateAdapter, MAT_DATE_FORMATS } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';

import { CalendarDate, CalendarSystem, isCalendarDate } from '@dasch-swiss/vre/shared/calendar';
import { CALENDAR_DATE_FORMATS } from '../../adapters/calendar-date-formats';
import { CalendarDateAdapter } from '../../adapters/calendar-date.adapter';

@Component({
  selector: 'app-date-input',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateInputComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DateInputComponent),
      multi: true,
    },
    {
      provide: DateAdapter,
      useClass: CalendarDateAdapter,
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: CALENDAR_DATE_FORMATS,
    },
  ],
  template: `
    <mat-form-field [appearance]="appearance" class="date-input-field">
      @if (label) {
        <mat-label>{{ label }}</mat-label>
      }

      <input
        matInput
        [matDatepicker]="picker"
        [formControl]="dateControl"
        [placeholder]="placeholder"
        [min]="minDate"
        [max]="maxDate"
        [disabled]="isDisabled()"
        (dateChange)="onDateChange($event.value)" />

      @if (!isDisabled()) {
        <button matSuffix mat-icon-button (click)="picker.open()" [attr.aria-label]="'Open calendar'" type="button">
          <mat-icon>calendar_today</mat-icon>
        </button>
      }

      @if (dateControl.value && !isDisabled()) {
        <button matSuffix mat-icon-button (click)="clear()" [attr.aria-label]="'Clear date'" type="button">
          <mat-icon>clear</mat-icon>
        </button>
      }

      @if (hint) {
        <mat-hint>{{ hint }}</mat-hint>
      }

      @if (dateControl.invalid && dateControl.touched) {
        <mat-error>
          {{ getErrorMessage() }}
        </mat-error>
      }

      <mat-datepicker #picker></mat-datepicker>
    </mat-form-field>
  `,
  styles: [
    `
      .date-input-field {
        width: 100%;
      }
    `,
  ],
})
export class DateInputComponent implements ControlValueAccessor, Validator, OnInit {
  private adapter = inject(DateAdapter<CalendarDate>);

  // Input properties
  @Input() label = '';
  @Input() placeholder = 'YYYY-MM-DD';
  @Input() hint = '';
  @Input() appearance: 'fill' | 'outline' = 'fill';
  @Input() minDate?: CalendarDate;
  @Input() maxDate?: CalendarDate;
  @Input() required = false;

  @Input() set calendarSystem(system: CalendarSystem) {
    this._calendarSystem.set(system);
    if (this.adapter instanceof CalendarDateAdapter) {
      this.adapter.setCalendarSystem(system);
    }
  }

  // State
  private _calendarSystem = signal<CalendarSystem>('GREGORIAN');
  private _disabled = signal(false);

  // Form control
  dateControl = new FormControl<CalendarDate | null>(null);

  // Computed state
  isDisabled = computed(() => this._disabled());

  // ControlValueAccessor callbacks
  private onChange: (value: CalendarDate | null) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    // Set initial calendar system
    if (this.adapter instanceof CalendarDateAdapter) {
      this.adapter.setCalendarSystem(this._calendarSystem());
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: CalendarDate | null): void {
    if (value === null || isCalendarDate(value)) {
      this.dateControl.setValue(value, { emitEvent: false });
    }
  }

  registerOnChange(fn: (value: CalendarDate | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._disabled.set(isDisabled);
    if (isDisabled) {
      this.dateControl.disable({ emitEvent: false });
    } else {
      this.dateControl.enable({ emitEvent: false });
    }
  }

  // Validator implementation
  validate(): ValidationErrors | null {
    const value = this.dateControl.value;

    if (this.required && !value) {
      return { required: true };
    }

    if (value && !isCalendarDate(value)) {
      return { invalidDate: true };
    }

    if (value && this.minDate && !this.adapter.isValid(value)) {
      return { invalidDate: true };
    }

    return null;
  }

  // Date change handler
  onDateChange(date: CalendarDate | null): void {
    this.onChange(date);
    this.onTouched();
  }

  // Clear date
  clear(): void {
    this.dateControl.setValue(null);
    this.onChange(null);
    this.onTouched();
  }

  // Get error message
  getErrorMessage(): string {
    if (this.dateControl.hasError('required')) {
      return 'Date is required';
    }
    if (this.dateControl.hasError('invalidDate')) {
      return 'Invalid date';
    }
    if (this.dateControl.hasError('matDatepickerMin')) {
      return 'Date is before minimum allowed date';
    }
    if (this.dateControl.hasError('matDatepickerMax')) {
      return 'Date is after maximum allowed date';
    }
    return 'Invalid date';
  }
}
