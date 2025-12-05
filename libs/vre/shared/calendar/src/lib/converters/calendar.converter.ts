/**
 * Calendar conversion functions.
 *
 * Provides functions to convert dates between different calendar systems
 * using Julian Day Numbers as an intermediate representation.
 *
 * @module calendar.converter
 */

import { getCalendar } from '../factories/calendar.factory';
import { CalendarDate, CalendarSystem, CalendarError } from '../types/calendar.types';

/**
 * Converts a date from one calendar system to another.
 *
 * This function uses Julian Day Numbers (JDN) as an intermediate representation.
 * The precision of the original date is preserved in the converted date.
 *
 * @param date - The date to convert
 * @param toCalendar - The target calendar system
 * @returns The date in the target calendar system
 *
 * @example
 * ```typescript
 * const gregorian = createDate('GREGORIAN', 2024, 1, 15);
 * const julian = convertCalendar(gregorian, 'JULIAN');
 * // Result: January 2, 2024 in Julian calendar
 *
 * const islamic = convertCalendar(gregorian, 'ISLAMIC');
 * // Result: Rajab 4, 1445 in Islamic calendar
 * ```
 */
export function convertCalendar(date: CalendarDate, toCalendar: CalendarSystem): CalendarDate {
  // If already in target calendar, return as-is
  if (date.calendar === toCalendar) {
    return date;
  }

  // Get calendar operations for source and target
  const sourceCalendar = getCalendar(date.calendar);
  const targetCalendar = getCalendar(toCalendar);

  // Convert to JDN
  const jdn = sourceCalendar.toJDN(date);

  // Convert from JDN to target calendar
  const converted = targetCalendar.fromJDN(jdn);

  // Preserve precision from original date
  return {
    ...converted,
    precision: date.precision,
    // Islamic calendar doesn't use era
    era: toCalendar === 'ISLAMIC' ? 'NONE' : converted.era,
  };
}

/**
 * Compare two dates.
 *
 * Compares dates even if they are in different calendar systems.
 * Returns a negative number if a < b, zero if a === b, positive if a > b.
 *
 * @param a - The first date
 * @param b - The second date
 * @returns Negative if a < b, zero if equal, positive if a > b
 *
 * @example
 * ```typescript
 * const date1 = createDate('GREGORIAN', 2024, 1, 15);
 * const date2 = createDate('GREGORIAN', 2024, 2, 20);
 *
 * compareDates(date1, date2); // Returns negative number (date1 is before date2)
 * compareDates(date2, date1); // Returns positive number (date2 is after date1)
 * compareDates(date1, date1); // Returns 0 (same date)
 * ```
 */
export function compareDates(a: CalendarDate, b: CalendarDate): number {
  const calendarA = getCalendar(a.calendar);
  const calendarB = getCalendar(b.calendar);

  const jdnA = calendarA.toJDN(a);
  const jdnB = calendarB.toJDN(b);

  return jdnA - jdnB;
}

/**
 * Check if date a is before date b.
 *
 * @param a - The first date
 * @param b - The second date
 * @returns True if a is before b
 *
 * @example
 * ```typescript
 * const date1 = createDate('GREGORIAN', 2024, 1, 15);
 * const date2 = createDate('GREGORIAN', 2024, 2, 20);
 * isBefore(date1, date2); // Returns true
 * ```
 */
export function isBefore(a: CalendarDate, b: CalendarDate): boolean {
  return compareDates(a, b) < 0;
}

/**
 * Check if date a is after date b.
 *
 * @param a - The first date
 * @param b - The second date
 * @returns True if a is after b
 *
 * @example
 * ```typescript
 * const date1 = createDate('GREGORIAN', 2024, 2, 20);
 * const date2 = createDate('GREGORIAN', 2024, 1, 15);
 * isAfter(date1, date2); // Returns true
 * ```
 */
export function isAfter(a: CalendarDate, b: CalendarDate): boolean {
  return compareDates(a, b) > 0;
}

/**
 * Check if two dates are equal.
 *
 * @param a - The first date
 * @param b - The second date
 * @returns True if dates are equal
 *
 * @example
 * ```typescript
 * const date1 = createDate('GREGORIAN', 2024, 1, 15);
 * const date2 = createDate('JULIAN', 2024, 1, 2); // Same day, different calendar
 * isEqual(date1, date2); // Returns true (same JDN)
 * ```
 */
export function isEqual(a: CalendarDate, b: CalendarDate): boolean {
  return compareDates(a, b) === 0;
}

/**
 * Validates that a period's start date is before or equal to its end date.
 *
 * @param start - The start date
 * @param end - The end date
 * @throws {CalendarError} If start is after end
 *
 * @example
 * ```typescript
 * const start = createDate('GREGORIAN', 2024, 1, 1);
 * const end = createDate('GREGORIAN', 2024, 12, 31);
 * validatePeriod(start, end); // OK
 *
 * validatePeriod(end, start); // Throws CalendarError
 * ```
 */
export function validatePeriod(start: CalendarDate, end: CalendarDate): void {
  if (start.calendar !== end.calendar) {
    throw new CalendarError(
      `Period dates must be in the same calendar. Start: ${start.calendar}, End: ${end.calendar}`
    );
  }

  if (isAfter(start, end)) {
    throw new CalendarError('Period start date must be before or equal to end date');
  }
}
