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
 * Rounds down, towards negative infinity.
 *
 * Meeus' algorithms are stated in terms of floor, not truncation. The two agree for non-negative
 * operands, which is why this went unnoticed: every CE date produces only non-negative operands.
 * They diverge below zero, and this rounded towards zero instead — corrupting every date from
 * roughly 4100 BCE back, silently by a day at first and then by whole months, until `fromJDN`
 * computed a negative month and `createDate` threw `Invalid month: -8` rather than returning a
 * date. Over 8100 years of dates the old form failed 5285 round trips; this form fails none.
 *
 * @param num - The number to round down
 * @returns The greatest integer not exceeding `num`
 *
 * @internal
 * @example
 * ```typescript
 * floorDiv(1.9) // Returns 1
 * floorDiv(-3.2) // Returns -4, where truncation would give -3
 * ```
 */
const floorDiv = (num: number): number => Math.floor(num);

/**
 * This calendar is **proleptic**: Gregorian arithmetic applies at every date, including before the
 * reform of 15 October 1582.
 *
 * That is a deliberate choice and it matches dsp-api, which builds its ICU calendar with
 * `setGregorianChange(new Date(Long.MIN_VALUE))` — ICU's documented way of saying "the reform has
 * always been in effect". Its own test suite pins `GREGORIAN:1291-08-01 CE` to JDN 2192801, seven
 * days from the Julian reading of the same numerals, which only a proleptic calendar produces.
 *
 * This library previously switched to the Julian rule before 1582. That made a project's declared
 * calendar silently ignored for pre-reform dates — "Gregorian" meant Julian — and put the client
 * seven days out from the server for exactly those dates. It also made `toJDN` non-injective: the
 * ten days the reform skipped shared JDNs with the ten that replaced them, so two distinct stored
 * values compared equal and one of them changed on a round trip.
 *
 * DSP does not adjudicate which calendar a source used; the project declares it and the software
 * honours it. A witness may well have written a date in a reckoning that was not yet, or no longer,
 * official where they lived, and the archive has to be able to hold that.
 */

/**
 * Converts a Gregorian calendar date to Julian Day Number (JDN).
 *
 * Proleptic: the Gregorian rule applies at every date. See the note above the function.
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

  // The century correction, applied at every date: this calendar is proleptic. See the note above.
  const a = floorDiv(year / 100.0);
  const b = 2 - a + floorDiv(a / 4);

  // Calculate JDN using the Meeus algorithm
  const jdn = floorDiv(365.25 * (year + 4716)) + floorDiv(30.6001 * (month + 1)) + day + b - 1524;

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
  const z = floorDiv(jdn + 0.5);
  const f = jdn + 0.5 - z;

  // The inverse of the century correction in `gregorianToJDN`, applied at every JDN for the same
  // reason. The two must branch alike or they stop being inverses, which is the defect DEV-7264
  // recorded; with neither branching they are inverses everywhere.
  const alpha = floorDiv((z - 1867216.25) / 36524.25);
  const a = z + 1 + alpha - floorDiv(alpha / 4);

  const b = a + 1524;
  const c = floorDiv((b - 122.1) / 365.25);
  const d = floorDiv(365.25 * c);
  const e = floorDiv((b - d) / 30.6001);

  const day = b - d - floorDiv(30.6001 * e) + f;

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
  return floorDiv(jdn + 1.5) % 7;
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
