/**
 * Angular form validators for CalendarDate.
 *
 * Provides validators for date inputs, date ranges, and calendar-specific validation.
 *
 * @module date.validators
 */

import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import {
  CalendarDate,
  CalendarPeriod,
  compareDates,
  isBefore,
  isAfter,
  isCalendarDate,
  isCalendarPeriod,
  getCalendar,
} from '@dasch-swiss/vre/shared/calendar';

/**
 * Validator that requires the control value to be a valid CalendarDate.
 *
 * @example
 * ```typescript
 * const control = new FormControl(null, [dateValidator()]);
 * ```
 */
export function dateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null; // Let required validator handle empty values
    }

    if (!isCalendarDate(value)) {
      return { invalidDate: { value } };
    }

    try {
      // Validate date components
      const calendar = getCalendar(value.calendar);
      const month = value.month ?? 1;
      const day = value.day ?? 1;

      // Check month range
      if (month < 1 || month > 12) {
        return { invalidMonth: { value: month } };
      }

      // Check day range
      const maxDay = calendar.daysInMonth(value.year, month);
      if (day < 1 || day > maxDay) {
        return { invalidDay: { value: day, max: maxDay } };
      }

      return null;
    } catch (error) {
      return { invalidDate: { value, error } };
    }
  };
}

/**
 * Validator that requires the control value to be a date before a specific date.
 *
 * @param maxDate - The maximum allowed date (exclusive)
 *
 * @example
 * ```typescript
 * const today = createToday();
 * const control = new FormControl(null, [beforeDate(today)]);
 * ```
 */
export function beforeDate(maxDate: CalendarDate): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value || !isCalendarDate(value)) {
      return null; // Let other validators handle this
    }

    if (!isBefore(value, maxDate)) {
      return {
        dateNotBefore: {
          value,
          maxDate,
        },
      };
    }

    return null;
  };
}

/**
 * Validator that requires the control value to be a date after a specific date.
 *
 * @param minDate - The minimum allowed date (exclusive)
 *
 * @example
 * ```typescript
 * const today = createToday();
 * const control = new FormControl(null, [afterDate(today)]);
 * ```
 */
export function afterDate(minDate: CalendarDate): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value || !isCalendarDate(value)) {
      return null; // Let other validators handle this
    }

    if (!isAfter(value, minDate)) {
      return {
        dateNotAfter: {
          value,
          minDate,
        },
      };
    }

    return null;
  };
}

/**
 * Validator that requires the control value to be within a date range.
 *
 * @param minDate - The minimum allowed date (inclusive)
 * @param maxDate - The maximum allowed date (inclusive)
 *
 * @example
 * ```typescript
 * const min = createDate('GREGORIAN', 2020, 1, 1);
 * const max = createDate('GREGORIAN', 2030, 12, 31);
 * const control = new FormControl(null, [dateRange(min, max)]);
 * ```
 */
export function dateRange(minDate: CalendarDate, maxDate: CalendarDate): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value || !isCalendarDate(value)) {
      return null; // Let other validators handle this
    }

    const compareMin = compareDates(value, minDate);
    const compareMax = compareDates(value, maxDate);

    if (compareMin < 0) {
      return {
        dateBeforeMin: {
          value,
          minDate,
        },
      };
    }

    if (compareMax > 0) {
      return {
        dateAfterMax: {
          value,
          maxDate,
        },
      };
    }

    return null;
  };
}

/**
 * Validator that requires a valid date period (start before end).
 *
 * @example
 * ```typescript
 * const control = new FormControl(null, [periodValidator()]);
 * ```
 */
export function periodValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value) {
      return null; // Let required validator handle empty values
    }

    if (!isCalendarPeriod(value)) {
      return { invalidPeriod: { value } };
    }

    try {
      // Validate both start and end dates
      const startValid = isCalendarDate(value.start);
      const endValid = isCalendarDate(value.end);

      if (!startValid || !endValid) {
        return { invalidPeriod: { value } };
      }

      // Validate start is before end
      if (!isBefore(value.start, value.end) && compareDates(value.start, value.end) !== 0) {
        return {
          invalidPeriodOrder: {
            start: value.start,
            end: value.end,
          },
        };
      }

      return null;
    } catch (error) {
      return { invalidPeriod: { value, error } };
    }
  };
}

/**
 * Validator that requires the date to have a minimum precision.
 *
 * @param requiredPrecision - Minimum required precision ('YEAR', 'MONTH', or 'DAY')
 *
 * @example
 * ```typescript
 * // Require full date (day precision)
 * const control = new FormControl(null, [minPrecision('DAY')]);
 * ```
 */
export function minPrecision(requiredPrecision: 'YEAR' | 'MONTH' | 'DAY'): ValidatorFn {
  const precisionOrder = { YEAR: 1, MONTH: 2, DAY: 3 };

  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value || !isCalendarDate(value)) {
      return null; // Let other validators handle this
    }

    const valuePrecisionLevel = precisionOrder[value.precision];
    const minPrecisionLevel = precisionOrder[requiredPrecision];

    if (valuePrecisionLevel < minPrecisionLevel) {
      return {
        insufficientPrecision: {
          value: value.precision,
          required: requiredPrecision,
        },
      };
    }

    return null;
  };
}

/**
 * Validator that requires the date to be in a specific calendar system.
 *
 * @param requiredCalendar - The required calendar system
 *
 * @example
 * ```typescript
 * const control = new FormControl(null, [calendarSystem('GREGORIAN')]);
 * ```
 */
export function calendarSystem(requiredCalendar: 'GREGORIAN' | 'JULIAN' | 'ISLAMIC'): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value || !isCalendarDate(value)) {
      return null; // Let other validators handle this
    }

    if (value.calendar !== requiredCalendar) {
      return {
        wrongCalendarSystem: {
          value: value.calendar,
          required: requiredCalendar,
        },
      };
    }

    return null;
  };
}

/**
 * Validator that requires the date to be a leap year.
 *
 * @example
 * ```typescript
 * const control = new FormControl(null, [leapYear()]);
 * ```
 */
export function leapYear(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value || !isCalendarDate(value)) {
      return null; // Let other validators handle this
    }

    const calendar = getCalendar(value.calendar);
    if (!calendar.isLeapYear(value.year)) {
      return {
        notLeapYear: {
          year: value.year,
        },
      };
    }

    return null;
  };
}

/**
 * Validator that requires the date to be on a specific day of the week.
 *
 * @param dayOfWeek - Required day of week (0 = Sunday, 6 = Saturday)
 *
 * @example
 * ```typescript
 * // Require Monday
 * const control = new FormControl(null, [dayOfWeekValidator(1)]);
 * ```
 */
export function dayOfWeekValidator(dayOfWeek: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;

    if (!value || !isCalendarDate(value)) {
      return null; // Let other validators handle this
    }

    const calendar = getCalendar(value.calendar);
    const actualDayOfWeek = calendar.dayOfWeek(value);

    if (actualDayOfWeek !== dayOfWeek) {
      return {
        wrongDayOfWeek: {
          value: actualDayOfWeek,
          required: dayOfWeek,
        },
      };
    }

    return null;
  };
}
