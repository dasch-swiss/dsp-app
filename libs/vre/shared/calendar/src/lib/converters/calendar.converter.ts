/**
 * Calendar conversion functions.
 *
 * Provides functions to convert dates between different calendar systems
 * using Julian Day Numbers as an intermediate representation.
 *
 * @module calendar.converter
 */

import { ISLAMIC_EPOCH_JDN } from '../calendars/islamic.calendar';
import { getCalendar } from '../factories/calendar.factory';
import { createDate } from '../factories/date.factory';
import { CalendarDate, CalendarSystem, CalendarError, ConversionResult } from '../types/calendar.types';

/**
 * The first JDN each calendar can represent.
 *
 * Gregorian and Julian are proleptic here — they extend backwards indefinitely, and a pre-1582
 * "Gregorian" date is proleptically Julian by construction. The Islamic calendar is tabular and
 * genuinely starts at the Hijra, so it is the only one with a floor.
 *
 * @internal
 */
function firstRepresentableJDN(calendar: CalendarSystem): number | undefined {
  return calendar === 'ISLAMIC' ? ISLAMIC_EPOCH_JDN : undefined;
}

/**
 * The first and last JDN a date covers, given its precision.
 *
 * A day-precision date covers one day; a month covers its whole month; a year covers 1 January to
 * 31 December. This is what makes an honest span possible: the range is computed in the *source*
 * calendar, where the precision was stated, and only then mapped into the target.
 *
 * @internal
 */
function jdnRange(date: CalendarDate): { first: number; last: number } {
  const calendar = getCalendar(date.calendar);

  if (date.precision === 'DAY') {
    const jdn = calendar.toJDN(date);
    return { first: jdn, last: jdn };
  }

  if (date.precision === 'MONTH') {
    const month = date.month!;
    const first = calendar.toJDN(createDate(date.calendar, date.year, month, 1, date.era));
    const lastDay = calendar.daysInMonth(date.year, month);
    const last = calendar.toJDN(createDate(date.calendar, date.year, month, lastDay, date.era));
    return { first, last };
  }

  const first = calendar.toJDN(createDate(date.calendar, date.year, 1, 1, date.era));
  const lastDayOfYear = calendar.daysInMonth(date.year, 12);
  const last = calendar.toJDN(createDate(date.calendar, date.year, 12, lastDayOfYear, date.era));
  return { first, last };
}

/**
 * Converts a date into another calendar, reporting honestly what the result is.
 *
 * Unlike {@link convertCalendar}, which returns a single date and therefore has to assert one even
 * when the source does not determine one, this reports the three outcomes conversion actually has:
 * an exact date, the span the source covers, or a refusal. See {@link ConversionResult}.
 *
 * The span is derived by mapping the source's whole range through JDN, so `Julian 1582` becomes
 * Gregorian 1582/1583 rather than silently dropping the second year.
 *
 * @param date - The date to convert
 * @param toCalendar - The target calendar system
 * @returns What the target calendar can say about this date
 *
 * @example
 * ```typescript
 * const result = convertCalendarResult(createDate('JULIAN', 1582), 'GREGORIAN');
 * // { kind: 'span', start: 1582-01-01 CE, end: 1583-01-10 CE }
 * ```
 */
export function convertCalendarResult(date: CalendarDate, toCalendar: CalendarSystem): ConversionResult {
  if (date.calendar === toCalendar) {
    return { kind: 'exact', date };
  }

  const { first, last } = jdnRange(date);

  const floor = firstRepresentableJDN(toCalendar);
  if (floor !== undefined && first < floor) {
    return { kind: 'refused', reason: 'BEFORE_TARGET_EPOCH' };
  }

  const target = getCalendar(toCalendar);
  const startFull = target.fromJDN(first);
  const endFull = target.fromJDN(last);

  // Re-state the endpoints at the source's precision: a year-precision source says nothing about
  // days, so neither may its conversion.
  const atPrecision = (full: CalendarDate): CalendarDate => {
    if (date.precision === 'DAY') {
      return full;
    }
    if (date.precision === 'MONTH') {
      return createDate(toCalendar, full.year, full.month, undefined, full.era);
    }
    return createDate(toCalendar, full.year, undefined, undefined, full.era);
  };

  const start = atPrecision(startFull);
  const end = atPrecision(endFull);

  const sameUnit = start.year === end.year && start.month === end.month && start.day === end.day;

  return sameUnit ? { kind: 'exact', date: start } : { kind: 'span', start, end };
}

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
