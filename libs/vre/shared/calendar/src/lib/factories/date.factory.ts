/**
 * Factory functions for creating calendar dates and periods.
 *
 * These functions provide a convenient and type-safe way to create calendar dates
 * with automatic validation and precision determination.
 *
 * @module date.factory
 */

import {
  CalendarDate,
  CalendarError,
  CalendarPeriod,
  CalendarSystem,
  DatePrecision,
  Era,
} from '../types/calendar.types';

/**
 * Creates a calendar date with validation.
 *
 * This is the primary factory function for creating dates. It automatically
 * determines the precision based on which parameters are provided.
 *
 * @param calendar - The calendar system (GREGORIAN, JULIAN, or ISLAMIC)
 * @param year - The year (astronomical year, can be negative for BCE)
 * @param month - Optional month (1-12)
 * @param day - Optional day (1-31)
 * @param era - Optional era (defaults to CE for non-Islamic, NONE for Islamic)
 * @returns A validated calendar date
 * @throws {CalendarError} If the date is invalid
 *
 * @example
 * ```typescript
 * // Full date
 * const date = createDate('GREGORIAN', 2024, 1, 15);
 * // Result: { calendar: 'GREGORIAN', year: 2024, month: 1, day: 15, era: 'CE', precision: 'DAY' }
 *
 * // Year-only
 * const yearOnly = createDate('GREGORIAN', 2024);
 * // Result: { calendar: 'GREGORIAN', year: 2024, era: 'CE', precision: 'YEAR' }
 *
 * // Month precision
 * const monthPrecision = createDate('GREGORIAN', 2024, 1);
 * // Result: { calendar: 'GREGORIAN', year: 2024, month: 1, era: 'CE', precision: 'MONTH' }
 *
 * // BCE date
 * const bce = createDate('JULIAN', -44, 3, 15, 'BCE');
 * // Result: { calendar: 'JULIAN', year: -44, month: 3, day: 15, era: 'BCE', precision: 'DAY' }
 *
 * // Islamic date (era is automatically NONE)
 * const islamic = createDate('ISLAMIC', 1445, 7, 4);
 * // Result: { calendar: 'ISLAMIC', year: 1445, month: 7, day: 4, era: 'NONE', precision: 'DAY' }
 * ```
 */
export function createDate(
  calendar: CalendarSystem,
  year: number,
  month?: number,
  day?: number,
  era?: Era
): CalendarDate {
  // Validate calendar system
  if (!['GREGORIAN', 'JULIAN', 'ISLAMIC'].includes(calendar)) {
    throw new CalendarError(`Invalid calendar system: ${calendar}`);
  }

  // Validate year
  if (!Number.isInteger(year)) {
    throw new CalendarError('Year must be an integer');
  }

  // Determine era if not provided
  let finalEra: Era;
  if (era !== undefined) {
    finalEra = era;
  } else if (calendar === 'ISLAMIC') {
    // Islamic calendar has no era
    finalEra = 'NONE';
  } else {
    // Default to CE for positive years, BCE for negative
    finalEra = year >= 0 ? 'CE' : 'BCE';
  }

  // Validate era for Islamic calendar
  if (calendar === 'ISLAMIC' && finalEra !== 'NONE') {
    throw new CalendarError('Islamic calendar does not use CE/BCE era designation');
  }

  // Determine precision
  let precision: DatePrecision;
  if (day !== undefined) {
    precision = 'DAY';
  } else if (month !== undefined) {
    precision = 'MONTH';
  } else {
    precision = 'YEAR';
  }

  // Validate month if provided
  if (month !== undefined) {
    if (!Number.isInteger(month)) {
      throw new CalendarError('Month must be an integer');
    }
    if (month < 1 || month > 12) {
      throw new CalendarError(`Invalid month: ${month}. Month must be between 1 and 12`);
    }
  }

  // Validate day if provided
  if (day !== undefined) {
    if (!Number.isInteger(day)) {
      throw new CalendarError('Day must be an integer');
    }
    if (day < 1 || day > 31) {
      throw new CalendarError(`Invalid day: ${day}. Day must be between 1 and 31`);
    }
    if (month === undefined) {
      throw new CalendarError('Cannot specify day without month');
    }
  }

  // Create the date object
  const date: CalendarDate = {
    calendar,
    year,
    month,
    day,
    era: finalEra,
    precision,
  };

  return date;
}

/**
 * Creates a calendar period with validation.
 *
 * A period represents a range of dates with a start and end point.
 * The start must be before or equal to the end.
 *
 * @param start - The start date of the period
 * @param end - The end date of the period
 * @returns A validated calendar period
 * @throws {CalendarError} If the period is invalid
 *
 * @example
 * ```typescript
 * const start = createDate('GREGORIAN', 2024, 1, 1);
 * const end = createDate('GREGORIAN', 2024, 12, 31);
 * const period = createPeriod(start, end);
 * ```
 */
export function createPeriod(start: CalendarDate, end: CalendarDate): CalendarPeriod {
  // Validate that both dates use the same calendar
  if (start.calendar !== end.calendar) {
    throw new CalendarError(
      `Period start and end must use the same calendar. Start: ${start.calendar}, End: ${end.calendar}`
    );
  }

  // Note: We don't validate start < end here because that requires JDN conversion
  // which would create a circular dependency. Validation will happen at the converter level.

  return {
    start,
    end,
  };
}

/**
 * Creates a date representing "today" in the Gregorian calendar.
 *
 * This is a convenience function that creates a date for the current day
 * using the system's local date.
 *
 * @returns A CalendarDate representing today
 *
 * @example
 * ```typescript
 * const today = createToday();
 * // Returns current date in Gregorian calendar
 * ```
 */
export function createToday(): CalendarDate {
  const now = new Date();
  return createDate('GREGORIAN', now.getFullYear(), now.getMonth() + 1, now.getDate(), 'CE');
}

/**
 * Type guard to check if a value is a valid CalendarDate.
 *
 * @param value - The value to check
 * @returns True if the value is a CalendarDate
 *
 * @example
 * ```typescript
 * const maybeDate: unknown = { calendar: 'GREGORIAN', year: 2024 };
 * if (isCalendarDate(maybeDate)) {
 *   // TypeScript knows maybeDate is a CalendarDate here
 *   console.log(maybeDate.year);
 * }
 * ```
 */
export function isCalendarDate(value: unknown): value is CalendarDate {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const date = value as Partial<CalendarDate>;

  return (
    typeof date.calendar === 'string' &&
    ['GREGORIAN', 'JULIAN', 'ISLAMIC'].includes(date.calendar) &&
    typeof date.year === 'number' &&
    typeof date.era === 'string' &&
    ['CE', 'BCE', 'NONE'].includes(date.era) &&
    typeof date.precision === 'string' &&
    ['YEAR', 'MONTH', 'DAY'].includes(date.precision) &&
    (date.month === undefined || typeof date.month === 'number') &&
    (date.day === undefined || typeof date.day === 'number')
  );
}

/**
 * Type guard to check if a value is a valid CalendarPeriod.
 *
 * @param value - The value to check
 * @returns True if the value is a CalendarPeriod
 *
 * @example
 * ```typescript
 * const maybePeriod: unknown = { start: {...}, end: {...} };
 * if (isCalendarPeriod(maybePeriod)) {
 *   // TypeScript knows maybePeriod is a CalendarPeriod here
 *   console.log(maybePeriod.start);
 * }
 * ```
 */
export function isCalendarPeriod(value: unknown): value is CalendarPeriod {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const period = value as Partial<CalendarPeriod>;

  return (
    period.start !== undefined && isCalendarDate(period.start) && period.end !== undefined && isCalendarDate(period.end)
  );
}
