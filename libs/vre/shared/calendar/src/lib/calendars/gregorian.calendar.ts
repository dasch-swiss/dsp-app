/**
 * Gregorian calendar operations.
 *
 * Implements calendar operations for the Gregorian calendar system.
 * The Gregorian calendar was introduced by Pope Gregory XIII in October 1582
 * to correct the drift of the Julian calendar.
 *
 * Conversion algorithms from:
 * Jean Meeus, Astronomical Algorithms, 1998, 60pp. and 63pp.
 *
 * @remarks
 * This implementation uses the astronomical convention where there is a year 0.
 * Year 1 BCE = Year 0, Year 2 BCE = Year -1, etc.
 *
 * The transition from Julian to Gregorian calendar occurred on October 15, 1582.
 * October 4, 1582 was immediately followed by October 15, 1582.
 *
 * @module gregorian.calendar
 */

import { createDate } from '../factories/date.factory';
import { CalendarDate, CalendarOperations } from '../types/calendar.types';

/**
 * Helper function to truncate decimals (remove fractions).
 * Works correctly for both positive and negative numbers.
 *
 * @param num - The number to truncate
 * @returns The number without fractions
 *
 * @internal
 * @example
 * ```typescript
 * truncate(1.9) // Returns 1
 * truncate(-3.2) // Returns -3
 * ```
 */
const truncate = (num: number): number => Math[num < 0 ? 'ceil' : 'floor'](num);

/**
 * Converts a Gregorian calendar date to Julian Day Number (JDN).
 *
 * The algorithm handles the transition from Julian to Gregorian calendar
 * on October 15, 1582. Dates before this use Julian calendar calculations.
 *
 * @param date - The Gregorian calendar date to convert
 * @returns The Julian Day Number (integer)
 *
 * @example
 * ```typescript
 * const date = createDate('GREGORIAN', 2000, 1, 1);
 * const jdn = gregorianToJDN(date); // Returns 2451545
 * ```
 */
function gregorianToJDN(date: CalendarDate): number {
  let year = date.year;
  let month = date.month ?? 1;
  const day = date.day ?? 1;

  // Adjust year and month for the algorithm
  // (Treat January and February as months 13 and 14 of the previous year)
  if (month <= 2) {
    year -= 1;
    month += 12;
  }

  // Check if date is before October 15, 1582 (Gregorian calendar introduction)
  // If before, use Julian calendar calculation
  const idate = date.year * 10000 + (date.month ?? 1) * 100 + (date.day ?? 1);
  let b = 0;

  if (idate >= 15821015) {
    // Gregorian calendar
    const a = truncate(year / 100.0);
    b = 2 - a + truncate(a / 4);
  } else {
    // Julian calendar
    b = 0;
  }

  // Calculate JDN using the Meeus algorithm
  const jdn = truncate(365.25 * (year + 4716)) + truncate(30.6001 * (month + 1)) + day + b - 1524;

  return jdn;
}

/**
 * Converts a Julian Day Number (JDN) to a Gregorian calendar date.
 *
 * @param jdn - The Julian Day Number to convert
 * @returns The Gregorian calendar date
 *
 * @example
 * ```typescript
 * const date = gregorianFromJDN(2451545);
 * // Returns { calendar: 'GREGORIAN', year: 2000, month: 1, day: 1, era: 'CE', precision: 'DAY' }
 * ```
 */
function gregorianFromJDN(jdn: number): CalendarDate {
  const z = truncate(jdn + 0.5);
  const f = jdn + 0.5 - z;

  const alpha = truncate((z - 1867216.25) / 36524.25);
  const a = z + 1 + alpha - truncate(alpha / 4);

  const b = a + 1524;
  const c = truncate((b - 122.1) / 365.25);
  const d = truncate(365.25 * c);
  const e = truncate((b - d) / 30.6001);

  const day = b - d - truncate(30.6001 * e) + f;

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

  const fullDay = truncate(day);

  // Determine era based on year
  const era = year >= 0 ? 'CE' : 'BCE';

  return createDate('GREGORIAN', year, month, fullDay, era);
}

/**
 * Determine if a year is a leap year in the Gregorian calendar.
 *
 * Gregorian leap year rules:
 * - Divisible by 4: leap year
 * - BUT divisible by 100: not a leap year
 * - BUT divisible by 400: leap year
 *
 * @param year - The year (astronomical year, can be negative)
 * @returns True if leap year, false otherwise
 *
 * @example
 * ```typescript
 * gregorianIsLeapYear(2024) // true (divisible by 4)
 * gregorianIsLeapYear(1900) // false (divisible by 100 but not 400)
 * gregorianIsLeapYear(2000) // true (divisible by 400)
 * ```
 */
function gregorianIsLeapYear(year: number): boolean {
  if (year % 400 === 0) {
    return true;
  }
  if (year % 100 === 0) {
    return false;
  }
  if (year % 4 === 0) {
    return true;
  }
  return false;
}

/**
 * Calculate the number of days in a month for the Gregorian calendar.
 *
 * @param year - The year (astronomical year, can be negative)
 * @param month - The month (1-12)
 * @returns Number of days in the month
 *
 * @example
 * ```typescript
 * gregorianDaysInMonth(2024, 2) // Returns 29 (leap year)
 * gregorianDaysInMonth(2023, 2) // Returns 28
 * gregorianDaysInMonth(2024, 1) // Returns 31
 * ```
 */
function gregorianDaysInMonth(year: number, month: number): number {
  const daysPerMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}. Month must be between 1 and 12.`);
  }

  let days = daysPerMonth[month - 1];

  // Adjust for February in leap years
  if (month === 2 && gregorianIsLeapYear(year)) {
    days = 29;
  }

  return days;
}

/**
 * Calculate the day of week for a date.
 *
 * Algorithm from: Jean Meeus, Astronomical Algorithms, 1998, p. 65.
 *
 * @param date - The calendar date
 * @returns Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 *
 * @example
 * ```typescript
 * const date = createDate('GREGORIAN', 2024, 1, 1); // Monday
 * gregorianDayOfWeek(date) // Returns 1
 * ```
 */
function gregorianDayOfWeek(date: CalendarDate): number {
  const jdn = gregorianToJDN(date);
  return truncate(jdn + 1.5) % 7;
}

/**
 * Gregorian calendar operations.
 *
 * Provides all calendar-specific operations for the Gregorian calendar.
 * Use this object to perform conversions and calculations with Gregorian dates.
 *
 * @example
 * ```typescript
 * import { GregorianCalendar } from '@dasch-swiss/vre/shared/calendar';
 *
 * const date = createDate('GREGORIAN', 2024, 1, 15);
 * const jdn = GregorianCalendar.toJDN(date);
 * const daysInMonth = GregorianCalendar.daysInMonth(2024, 2); // 29
 * const isLeap = GregorianCalendar.isLeapYear(2024); // true
 * ```
 */
export const GregorianCalendar: CalendarOperations = {
  toJDN: gregorianToJDN,
  fromJDN: gregorianFromJDN,
  daysInMonth: gregorianDaysInMonth,
  isLeapYear: gregorianIsLeapYear,
  dayOfWeek: gregorianDayOfWeek,
};
