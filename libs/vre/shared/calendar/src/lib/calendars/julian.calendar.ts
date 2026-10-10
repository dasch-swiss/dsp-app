/**
 * Julian calendar operations.
 *
 * Implements calendar operations for the Julian calendar system.
 * The Julian calendar was introduced by Julius Caesar in 45 BCE.
 *
 * Conversion algorithms from:
 * Jean Meeus, Astronomical Algorithms, 1998, 60pp. and 63pp.
 *
 * @remarks
 * This implementation uses the astronomical convention where there is a year 0.
 * Year 1 BCE = Year 0, Year 2 BCE = Year -1, etc.
 *
 * @module julian.calendar
 */

import { createDate } from '../factories/date.factory';
import { CalendarDate, CalendarOperations } from '../types/calendar.types';

/**
 * Rounds down, towards negative infinity.
 *
 * Meeus' algorithms are stated in terms of floor, not truncation. The two agree for non-negative
 * operands, which is why rounding towards zero here went unnoticed: every CE date produces only
 * non-negative operands. They diverge below zero, corrupting deep-BCE dates.
 *
 * @internal
 */
const floorDiv = (num: number): number => Math.floor(num);

/**
 * Converts a Julian calendar date to Julian Day Number (JDN).
 *
 * @param date - The Julian calendar date to convert
 * @returns The Julian Day Number (integer)
 *
 * @example
 * ```typescript
 * const date = createDate('JULIAN', 2000, 1, 1);
 * const jdn = julianToJDN(date);
 * ```
 */
function julianToJDN(date: CalendarDate): number {
  let year = date.year;
  let month = date.month ?? 1;
  const day = date.day ?? 1;

  // Adjust year and month for the algorithm
  if (month <= 2) {
    year -= 1;
    month += 12;
  }

  // No BCE correction term: this used to subtract 0.75 for negative years, by hand, to compensate
  // for a rounding helper that truncated towards zero where Meeus requires floor. `floorDiv` now
  // floors, so the compensation would be applied twice and every BCE date would land a day early.
  const jdn = floorDiv(365.25 * year) + floorDiv(30.6001 * (month + 1)) + day + 1720995;

  return jdn;
}

/**
 * Converts a Julian Day Number (JDN) to a Julian calendar date.
 *
 * @param jdn - The Julian Day Number to convert
 * @returns The Julian calendar date
 *
 * @example
 * ```typescript
 * const date = julianFromJDN(2451558);
 * // Returns Julian calendar date for January 14, 2000
 * ```
 */
function julianFromJDN(jdn: number): CalendarDate {
  const z = floorDiv(jdn + 0.5);
  const a = z; // For Julian calendar, no adjustment needed

  const b = a + 1524;
  const c = floorDiv((b - 122.1) / 365.25);
  const d = floorDiv(365.25 * c);
  const e = floorDiv((b - d) / 30.6001);

  const day = b - d - floorDiv(30.6001 * e);

  let month: number;
  if (e < 14) {
    month = e - 1;
  } else {
    month = e - 13;
  }

  let year: number;
  if (month > 2) {
    year = c - 4716;
  } else {
    year = c - 4715;
  }

  const fullDay = floorDiv(day);

  // Determine era based on year
  const era = year >= 0 ? 'CE' : 'BCE';

  return createDate('JULIAN', year, month, fullDay, era);
}

/**
 * Determine if a year is a leap year in the Julian calendar.
 *
 * Julian leap year rule:
 * - Every year divisible by 4 is a leap year
 * - No exceptions (unlike Gregorian)
 *
 * @param year - The year (astronomical year, can be negative)
 * @returns True if leap year, false otherwise
 *
 * @example
 * ```typescript
 * julianIsLeapYear(2024) // true
 * julianIsLeapYear(1900) // true (unlike Gregorian)
 * julianIsLeapYear(2023) // false
 * ```
 */
function julianIsLeapYear(year: number): boolean {
  return year % 4 === 0;
}

/**
 * Calculate the number of days in a month for the Julian calendar.
 *
 * @param year - The year (astronomical year, can be negative)
 * @param month - The month (1-12)
 * @returns Number of days in the month
 *
 * @example
 * ```typescript
 * julianDaysInMonth(2024, 2) // Returns 29 (leap year)
 * julianDaysInMonth(2023, 2) // Returns 28
 * ```
 */
function julianDaysInMonth(year: number, month: number): number {
  const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}. Month must be between 1 and 12.`);
  }

  let days = daysPerMonth[month - 1];

  // Adjust for February in leap years
  if (month === 2 && julianIsLeapYear(year)) {
    days = 29;
  }

  return days;
}

/**
 * Calculate the day of week for a date.
 *
 * @param date - The calendar date
 * @returns Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 *
 * @example
 * ```typescript
 * const date = createDate('JULIAN', 2000, 1, 1);
 * julianDayOfWeek(date) // Returns day of week
 * ```
 */
function julianDayOfWeek(date: CalendarDate): number {
  const jdn = julianToJDN(date);
  return floorDiv(jdn + 1.5) % 7;
}

/**
 * Julian calendar operations.
 *
 * Provides all calendar-specific operations for the Julian calendar.
 * Use this object to perform conversions and calculations with Julian dates.
 *
 * @example
 * ```typescript
 * import { JulianCalendar } from '@dasch-swiss/vre/shared/calendar';
 *
 * const date = createDate('JULIAN', 2024, 1, 15);
 * const jdn = JulianCalendar.toJDN(date);
 * const daysInMonth = JulianCalendar.daysInMonth(2024, 2); // 29
 * const isLeap = JulianCalendar.isLeapYear(1900); // true
 * ```
 */
export const JulianCalendar: CalendarOperations = {
  toJDN: julianToJDN,
  fromJDN: julianFromJDN,
  daysInMonth: julianDaysInMonth,
  isLeapYear: julianIsLeapYear,
  dayOfWeek: julianDayOfWeek,
};
