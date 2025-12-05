/**
 * Angular Material DateAdapter for CalendarDate.
 *
 * This adapter enables CalendarDate to work with Angular Material's datepicker.
 * It provides all the necessary date manipulation and formatting operations.
 *
 * @module calendar-date.adapter
 */

import { Injectable } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import {
  CalendarDate,
  CalendarSystem,
  convertCalendar,
  createDate,
  createToday,
  getCalendar,
} from '@dasch-swiss/vre/shared/calendar';

/**
 * Angular Material DateAdapter implementation for CalendarDate.
 *
 * Supports all three calendar systems (Gregorian, Julian, Islamic)
 * and provides proper date manipulation for Material datepicker.
 *
 * @example
 * ```typescript
 * @Component({
 *   providers: [
 *     { provide: DateAdapter, useClass: CalendarDateAdapter },
 *     { provide: MAT_DATE_FORMATS, useValue: CALENDAR_DATE_FORMATS },
 *   ],
 * })
 * export class DatePickerComponent { }
 * ```
 */
@Injectable()
export class CalendarDateAdapter extends DateAdapter<CalendarDate> {
  private _calendarSystem: CalendarSystem = 'GREGORIAN';

  /**
   * Sets the calendar system to use for date operations.
   */
  setCalendarSystem(system: CalendarSystem): void {
    this._calendarSystem = system;
  }

  /**
   * Gets the current calendar system.
   */
  getCalendarSystem(): CalendarSystem {
    return this._calendarSystem;
  }

  /**
   * Gets the year of the given date.
   */
  override getYear(date: CalendarDate): number {
    if (!date) return 1;
    return date.year;
  }

  /**
   * Gets the month of the given date (0-11 for Material DateAdapter).
   * Note: Material expects 0-based months (0=January, 11=December)
   * but CalendarDate uses 1-based months (1=January, 12=December).
   */
  override getMonth(date: CalendarDate): number {
    if (!date) return 0;
    // Convert from 1-based (CalendarDate) to 0-based (Material)
    return (date.month ?? 1) - 1;
  }

  /**
   * Gets the date of month of the given date (1-31).
   */
  override getDate(date: CalendarDate): number {
    if (!date) return 1;
    return date.day ?? 1;
  }

  /**
   * Gets the day of week of the given date (0 = Sunday).
   */
  override getDayOfWeek(date: CalendarDate): number {
    if (!date) return 0;
    const calendar = getCalendar(date.calendar);
    return calendar.dayOfWeek(date);
  }

  /**
   * Gets a list of names for the months in the current calendar.
   */
  override getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
    // For now, return English month names
    // TODO: Implement proper localization and calendar-specific month names
    const long = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    if (style === 'narrow') {
      return long.map(name => name.charAt(0));
    } else if (style === 'short') {
      return long.map(name => name.substring(0, 3));
    }

    return long;
  }

  /**
   * Gets a list of names for the dates of the month in the current calendar.
   */
  override getDateNames(): string[] {
    return Array.from({ length: 31 }, (_, i) => String(i + 1));
  }

  /**
   * Gets a list of names for the days of the week in the current calendar.
   */
  override getDayOfWeekNames(style: 'long' | 'short' | 'narrow'): string[] {
    const long = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    if (style === 'narrow') {
      return long.map(name => name.charAt(0));
    } else if (style === 'short') {
      return long.map(name => name.substring(0, 3));
    }

    return long;
  }

  /**
   * Gets the name of the year for the given date.
   */
  override getYearName(date: CalendarDate): string {
    if (!date) return '1';
    return String(date.year);
  }

  /**
   * Gets the first day of the week (0 = Sunday).
   */
  override getFirstDayOfWeek(): number {
    return 0; // Sunday
  }

  /**
   * Gets the number of days in the month of the given date.
   */
  override getNumDaysInMonth(date: CalendarDate): number {
    if (!date) return 31;
    const calendar = getCalendar(date.calendar);
    const month = date.month ?? 1;
    return calendar.daysInMonth(date.year, month);
  }

  /**
   * Clones the given date.
   */
  override clone(date: CalendarDate): CalendarDate {
    if (!date) return createDate(this._calendarSystem, 1, 1, 1);
    return { ...date };
  }

  /**
   * Creates a date with the given year, month, and day.
   * Note: Material passes 0-based months (0=January, 11=December)
   * but CalendarDate needs 1-based months (1=January, 12=December).
   */
  override createDate(year: number, month: number, date: number): CalendarDate {
    // Convert from 0-based (Material) to 1-based (CalendarDate)
    return createDate(this._calendarSystem, year, month + 1, date);
  }

  /**
   * Gets today's date in the current calendar system.
   */
  override today(): CalendarDate {
    const today = createToday();
    if (today.calendar === this._calendarSystem) {
      return today;
    }
    // Convert to the current calendar system if different
    return convertCalendar(today, this._calendarSystem);
  }

  /**
   * Parses a date from a string.
   * For now, this is a simple implementation that expects YYYY-MM-DD format.
   * Note: Expects 1-based months in the string (e.g., "2024-01-15" for January)
   * to match CalendarDate's internal 1-based month representation.
   */
  override parse(value: string): CalendarDate | null {
    if (!value) {
      return null;
    }

    const parts = value.split('-');
    if (parts.length !== 3) {
      return null;
    }

    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
      return null;
    }

    try {
      return createDate(this._calendarSystem, year, month, day);
    } catch {
      return null;
    }
  }

  /**
   * Formats a date to a string.
   * Note: Outputs 1-based months in the string (e.g., "2024-01-15" for January)
   * matching CalendarDate's internal 1-based month representation.
   */
  override format(date: CalendarDate, displayFormat: object): string {
    if (!date) return '';
    // Simple format: YYYY-MM-DD
    const year = date.year;
    const month = date.month?.toString().padStart(2, '0') ?? '01';
    const day = date.day?.toString().padStart(2, '0') ?? '01';

    return `${year}-${month}-${day}`;
  }

  /**
   * Adds the given number of years to the date.
   */
  override addCalendarYears(date: CalendarDate, years: number): CalendarDate {
    if (!date) return createDate(this._calendarSystem, 1, 1, 1);
    return createDate(date.calendar, date.year + years, date.month, date.day, date.era);
  }

  /**
   * Adds the given number of months to the date.
   */
  override addCalendarMonths(date: CalendarDate, months: number): CalendarDate {
    if (!date) return createDate(this._calendarSystem, 1, 1, 1);
    const calendar = getCalendar(date.calendar);
    let year = date.year;
    let month = date.month ?? 1;
    let day = date.day ?? 1;

    month += months;

    while (month > 12) {
      month -= 12;
      year += 1;
    }

    while (month < 1) {
      month += 12;
      year -= 1;
    }

    // Ensure day is valid for the new month
    const maxDay = calendar.daysInMonth(year, month);
    if (day > maxDay) {
      day = maxDay;
    }

    return createDate(date.calendar, year, month, day, date.era);
  }

  /**
   * Adds the given number of days to the date.
   */
  override addCalendarDays(date: CalendarDate, days: number): CalendarDate {
    if (!date) return createDate(this._calendarSystem, 1, 1, 1);
    const calendar = getCalendar(date.calendar);
    const jdn = calendar.toJDN(date);
    const newJdn = jdn + days;
    return calendar.fromJDN(newJdn);
  }

  /**
   * Converts the date to ISO 8601 string format.
   */
  override toIso8601(date: CalendarDate): string {
    if (!date) return '';
    return this.format(date, {});
  }

  /**
   * Deserializes a date from a value (usually from JSON).
   */
  override deserialize(value: string | number): CalendarDate | null {
    if (typeof value === 'string') {
      return this.parse(value);
    }
    return null;
  }

  /**
   * Checks whether the given object is a valid date instance.
   */
  override isDateInstance(obj: unknown): boolean {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      'calendar' in obj &&
      'year' in obj &&
      'era' in obj &&
      'precision' in obj
    );
  }

  /**
   * Checks whether the given date is valid.
   */
  override isValid(date: CalendarDate): boolean {
    try {
      if (!date || !date.year) {
        return false;
      }

      // Try to create the date again to validate
      const calendar = getCalendar(date.calendar);
      const month = date.month ?? 1;
      const day = date.day ?? 1;

      // Check month range
      if (month < 1 || month > 12) {
        return false;
      }

      // Check day range
      const maxDay = calendar.daysInMonth(date.year, month);
      if (day < 1 || day > maxDay) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Creates an invalid date (returns null as CalendarDate doesn't have invalid state).
   */
  override invalid(): CalendarDate {
    // Return a sentinel invalid date
    return createDate(this._calendarSystem, 1, 1, 1);
  }
}
