/**
 * Date range input component for selecting periods.
 *
 * A modern, standalone Angular component that allows users to select
 * a date range (start and end dates) with proper validation.
 *
 * @example
 * ```typescript
 * <app-date-range-input
 *   [calendarSystem]="'GREGORIAN'"
 *   [label]="'Project Duration'"
 *   formControlName="duration">
 * </app-date-range-input>
 * ```
 */

import { CommonModule } from '@angular/common';
import { Component, Input, forwardRef, signal, computed, inject, OnInit } from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  FormControl,
  FormGroup,
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

import {
  CalendarDate,
  CalendarPeriod,
  CalendarSystem,
  createPeriod,
  isCalendarPeriod,
  isBefore,
  compareDates,
} from '@dasch-swiss/vre/shared/calendar';
import { CALENDAR_DATE_FORMATS } from '../../adapters/calendar-date-formats';
import { CalendarDateAdapter } from '../../adapters/calendar-date.adapter';

@Component({
  selector: 'app-date-range-input',
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
      useExisting: forwardRef(() => DateRangeInputComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => DateRangeInputComponent),
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
    <div class="date-range-container">
      @if (label) {
        <label class="date-range-label">{{ label }}</label>
      }

      <div class="date-range-inputs">
        <!-- Start Date -->
        <mat-form-field [appearance]="appearance" class="date-field start-date">
          <mat-label>{{ startLabel }}</mat-label>
          <input
            matInput
            [matDatepicker]="startPicker"
            [formControl]="startControl"
            [placeholder]="placeholder"
            [max]="endControl.value"
            [disabled]="isDisabled()"
            (dateChange)="onDateChange()" />
          <button
            matSuffix
            mat-icon-button
            (click)="startPicker.open()"
            [disabled]="isDisabled()"
            [attr.aria-label]="'Open start date calendar'"
            type="button">
            <mat-icon>calendar_today</mat-icon>
          </button>
          <mat-datepicker #startPicker></mat-datepicker>
        </mat-form-field>

        <span class="date-range-separator">—</span>

        <!-- End Date -->
        <mat-form-field [appearance]="appearance" class="date-field end-date">
          <mat-label>{{ endLabel }}</mat-label>
          <input
            matInput
            [matDatepicker]="endPicker"
            [formControl]="endControl"
            [placeholder]="placeholder"
            [min]="startControl.value"
            [disabled]="isDisabled()"
            (dateChange)="onDateChange()" />
          <button
            matSuffix
            mat-icon-button
            (click)="endPicker.open()"
            [disabled]="isDisabled()"
            [attr.aria-label]="'Open end date calendar'"
            type="button">
            <mat-icon>calendar_today</mat-icon>
          </button>
          <mat-datepicker #endPicker></mat-datepicker>
        </mat-form-field>

        @if (rangeForm.value.start && rangeForm.value.end && !isDisabled()) {
          <button
            mat-icon-button
            (click)="clear()"
            class="clear-button"
            [attr.aria-label]="'Clear date range'"
            type="button">
            <mat-icon>clear</mat-icon>
          </button>
        }
      </div>

      @if (hint) {
        <div class="date-range-hint">{{ hint }}</div>
      }

      @if (hasError()) {
        <div class="date-range-error">
          {{ getErrorMessage() }}
        </div>
      }
    </div>
  `,
  styles: [
    `
      .date-range-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .date-range-label {
        font-size: 14px;
        font-weight: 500;
        color: rgba(0, 0, 0, 0.6);
      }

      .date-range-inputs {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .date-field {
        flex: 1;
        min-width: 200px;
      }

      .date-range-separator {
        font-size: 18px;
        color: rgba(0, 0, 0, 0.6);
        padding: 0 4px;
      }

      .clear-button {
        margin-top: -8px;
      }

      .date-range-hint {
        font-size: 12px;
        color: rgba(0, 0, 0, 0.6);
        margin-top: -4px;
      }

      .date-range-error {
        font-size: 12px;
        color: #f44336;
        margin-top: -4px;
      }
    `,
  ],
})
export class DateRangeInputComponent implements ControlValueAccessor, Validator, OnInit {
  private adapter = inject(DateAdapter<CalendarDate>);

  // Input properties
  @Input() label = '';
  @Input() startLabel = 'Start Date';
  @Input() endLabel = 'End Date';
  @Input() placeholder = 'YYYY-MM-DD';
  @Input() hint = '';
  @Input() appearance: 'fill' | 'outline' = 'fill';
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
  private _touched = false;

  // Form controls
  startControl = new FormControl<CalendarDate | null>(null);
  endControl = new FormControl<CalendarDate | null>(null);

  rangeForm = new FormGroup({
    start: this.startControl,
    end: this.endControl,
  });

  // Computed state
  isDisabled = computed(() => this._disabled());

  // ControlValueAccessor callbacks
  private onChange: (value: CalendarPeriod | null) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    // Set initial calendar system
    if (this.adapter instanceof CalendarDateAdapter) {
      this.adapter.setCalendarSystem(this._calendarSystem());
    }
  }

  // ControlValueAccessor implementation
  writeValue(value: CalendarPeriod | null): void {
    if (value === null) {
      this.startControl.setValue(null, { emitEvent: false });
      this.endControl.setValue(null, { emitEvent: false });
    } else if (isCalendarPeriod(value)) {
      this.startControl.setValue(value.start, { emitEvent: false });
      this.endControl.setValue(value.end, { emitEvent: false });
    }
  }

  registerOnChange(fn: (value: CalendarPeriod | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._disabled.set(isDisabled);
    if (isDisabled) {
      this.startControl.disable({ emitEvent: false });
      this.endControl.disable({ emitEvent: false });
    } else {
      this.startControl.enable({ emitEvent: false });
      this.endControl.enable({ emitEvent: false });
    }
  }

  // Validator implementation
  validate(): ValidationErrors | null {
    const start = this.startControl.value;
    const end = this.endControl.value;

    // Check required
    if (this.required && (!start || !end)) {
      return { required: true };
    }

    // If both dates present, validate the period
    if (start && end) {
      // Validate that start is before or equal to end
      if (!isBefore(start, end) && compareDates(start, end) !== 0) {
        return {
          invalidPeriod: {
            message: 'Start date must be before or equal to end date',
          },
        };
      }
    }

    return null;
  }

  // Date change handler
  onDateChange(): void {
    const start = this.startControl.value;
    const end = this.endControl.value;

    if (!this._touched) {
      this._touched = true;
      this.onTouched();
    }

    // Only emit value if both dates are present
    if (start && end) {
      try {
        // Validate that start is before or equal to end
        if (!isBefore(start, end) && compareDates(start, end) !== 0) {
          // Invalid period (start after end), emit null
          this.onChange(null);
          return;
        }

        const period = createPeriod(start, end);
        this.onChange(period);
      } catch {
        // Invalid period, emit null
        this.onChange(null);
      }
    } else if (!start && !end) {
      // Both empty, emit null
      this.onChange(null);
    } else {
      // One date missing, don't emit yet
      // Keep the existing value
    }
  }

  // Clear date range
  clear(): void {
    this.startControl.setValue(null);
    this.endControl.setValue(null);
    this.onChange(null);
    this._touched = true;
    this.onTouched();
  }

  // Check if form has errors
  hasError(): boolean {
    if (!this._touched) {
      return false;
    }

    const errors = this.validate();
    return errors !== null;
  }

  // Get error message
  getErrorMessage(): string {
    if (!this._touched) {
      return '';
    }

    const errors = this.validate();

    if (!errors) {
      return '';
    }

    if (errors['required']) {
      return 'Both start and end dates are required';
    }

    if (errors['invalidPeriod']) {
      return errors['invalidPeriod'].message || 'Invalid date range';
    }

    if (this.startControl.hasError('matDatepickerParse')) {
      return 'Invalid start date format';
    }

    if (this.endControl.hasError('matDatepickerParse')) {
      return 'Invalid end date format';
    }

    return 'Invalid date range';
  }
}
