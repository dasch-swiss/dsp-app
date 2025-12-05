/**
 * Islamic calendar operations.
 *
 * Implements calendar operations for the Islamic (Hijri) calendar system.
 * The Islamic calendar is a lunar calendar consisting of 12 months in a year of 354 or 355 days.
 *
 * Conversion algorithms from:
 * Jean Meeus, Astronomical Algorithms, 1998, 73pp. and 75pp.
 *
 * @remarks
 * This implementation uses the astronomical convention where there is a year 0.
 *
 * **Important Notes:**
 * - The first day of the Islamic calendar according to this algorithm is July 16, 622 CE (Julian)
 * - Historical Islamic dates may be off by 1-2 days compared to the actual calendar used
 * - Early Islamic calendar may have used luni-solar system before year 10 of the Hijra
 * - Many countries used actual lunar crescent sighting, not a calculated scheme
 * - The Islamic calendar does not use CE/BCE era designation
 *
 * @module islamic.calendar
 */

import { createDate } from '../factories/date.factory';
import { CalendarDate, CalendarOperations } from '../types/calendar.types';
import { JulianCalendar } from './julian.calendar';

/**
 * Helper function to truncate decimals (remove fractions).
 * Works correctly for both positive and negative numbers.
 *
 * @internal
 */
const truncate = (num: number): number => Math[num < 0 ? 'ceil' : 'floor'](num);

/**
 * Converts an Islamic calendar date to Julian Day Number (JDN).
 *
 * @param date - The Islamic calendar date to convert
 * @returns The Julian Day Number (integer)
 *
 * @example
 * ```typescript
 * const date = createDate('ISLAMIC', 1445, 7, 4);
 * const jdn = islamicToJDN(date);
 * ```
 */
function islamicToJDN(date: CalendarDate): number {
  const h = date.year;
  const m = date.month ?? 1;
  const d = date.day ?? 1;

  const n = d + Math.floor(29.5001 * (m - 1) + 0.99);
  const q = Math.floor(h / 30);
  let r = h % 30;
  if (r < 0) {
    r += 30;
  }
  const a = Math.floor((11 * r + 3) / 30);
  const w = 404 * q + 354 * r + 208 + a;
  const q1 = Math.floor(w / 1461);
  let q2 = w % 1461;
  if (q2 < 0) {
    q2 += 1461;
  }
  const g = 621 + 4 * Math.floor(7 * q + q1);
  const k = Math.floor(q2 / 365.2422);
  const e = Math.floor(365.2422 * k);
  let j = q2 - e + n - 1;
  let x = g + k;

  if (j > 366 && x % 4 === 0) {
    j -= 366;
    x += 1;
  } else if (j > 365 && x % 4 > 0) {
    j -= 365;
    x += 1;
  }

  const jdn = truncate(365.25 * (x - 1)) + 1721423 + j;

  return jdn;
}

/**
 * Determine if a year is a leap year in the Islamic calendar.
 *
 * In a 30-year cycle, years 2, 5, 7, 10, 13, 16, 18, 21, 24, 26, and 29 are leap years.
 *
 * @param year - The Islamic year
 * @returns True if leap year, false otherwise
 *
 * @example
 * ```typescript
 * islamicIsLeapYear(1445) // Returns true or false depending on cycle position
 * ```
 */
function islamicIsLeapYear(year: number): boolean {
  const yearInCycle = year % 30;
  const leapYears = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];
  return leapYears.includes(yearInCycle);
}

/**
 * Converts a Julian Day Number (JDN) to an Islamic calendar date.
 *
 * This conversion first converts to Julian calendar, then to Islamic.
 *
 * @param jdn - The Julian Day Number to convert
 * @returns The Islamic calendar date
 *
 * @example
 * ```typescript
 * const date = islamicFromJDN(2460311);
 * // Returns Islamic calendar date
 * ```
 */
function islamicFromJDN(jdn: number): CalendarDate {
  // First convert JDN to Julian calendar
  const julianDate = JulianCalendar.fromJDN(jdn);

  const x = julianDate.year;
  const julianMonth = julianDate.month ?? 1;
  const julianDay = julianDate.day ?? 1;

  let w: number;
  if (x % 4 === 0) {
    w = 1;
  } else {
    w = 2;
  }

  const n = truncate((275 * julianMonth) / 9) - w * truncate((julianMonth + 9) / 12) + julianDay - 30;
  const a = x - 623;
  const b = Math.floor(a / 4);
  let c = a / 4 - b;
  c = Math.floor(c * 4);
  const c1 = 365.2501 * c;
  let c2 = Math.floor(c1);

  if (c1 - c2 > 0.5) {
    c2 += 1;
  }

  const d_ = 1461 * b + 170 + c2;
  const q = Math.floor(d_ / 10631);
  let r = d_ % 10631;
  if (r < 0) {
    r += 10631;
  }
  const j = Math.floor(r / 354);
  let k = r % 354;
  if (k < 0) {
    k += 354;
  }
  const o = Math.floor((11 * j + 14) / 30);
  let h = 30 * q + j + 1;
  let jj = k - o + n - 1;

  if (jj > 354) {
    let cl = h % 30;
    if (cl < 0) {
      cl += 30;
    }
    let dl = (11 * cl + 3) % 30;
    if (dl < 0) {
      dl += 30;
    }

    if (dl < 19) {
      jj -= 354;
      h += 1;
    }
    if (dl > 18) {
      jj -= 355;
      h += 1;
    }

    if (jj === 0) {
      jj = 355;
      h -= 1;
    }
  }

  // Calculate month and day from day-of-year (jj)
  // Islamic months alternate between 30 and 29 days
  let month = 1;
  let remainingDays = jj;

  // Ensure we have at least 1 day
  if (remainingDays < 1) {
    remainingDays = 1;
  }

  // Find which month we're in by subtracting month lengths
  while (month <= 12) {
    // Odd months (1,3,5,7,9,11) have 30 days
    // Even months (2,4,6,8,10) have 29 days
    // Month 12 has 30 days in leap years, 29 otherwise
    let daysInCurrentMonth: number;
    if (month < 12) {
      daysInCurrentMonth = month % 2 === 1 ? 30 : 29;
    } else {
      daysInCurrentMonth = islamicIsLeapYear(h) ? 30 : 29;
    }

    if (remainingDays <= daysInCurrentMonth) {
      break;
    }

    remainingDays -= daysInCurrentMonth;
    month++;
  }

  const day = remainingDays;

  return createDate('ISLAMIC', h, month, day, 'NONE');
}

/**
 * Calculate the number of days in a month for the Islamic calendar.
 *
 * The Islamic calendar alternates between 30 and 29 day months,
 * with the 12th month having 30 days in leap years.
 *
 * @param year - The Islamic year
 * @param month - The month (1-12)
 * @returns Number of days in the month
 *
 * @example
 * ```typescript
 * islamicDaysInMonth(1445, 1) // Returns 30
 * islamicDaysInMonth(1445, 2) // Returns 29
 * islamicDaysInMonth(1445, 12) // Returns 29 or 30 (depending on leap year)
 * ```
 */
function islamicDaysInMonth(year: number, month: number): number {
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}. Month must be between 1 and 12.`);
  }

  // Months alternate between 30 and 29 days
  // Odd months (1, 3, 5, 7, 9, 11) have 30 days
  // Even months (2, 4, 6, 8, 10) have 29 days
  // Month 12 has 29 days normally, 30 in leap years
  if (month % 2 === 1) {
    return 30; // Odd months
  } else if (month < 12) {
    return 29; // Even months except 12
  } else {
    // Month 12: check if leap year
    return islamicIsLeapYear(year) ? 30 : 29;
  }
}

/**
 * Calculate the day of week for an Islamic date.
 *
 * @param date - The Islamic calendar date
 * @returns Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
 *
 * @example
 * ```typescript
 * const date = createDate('ISLAMIC', 1445, 7, 4);
 * islamicDayOfWeek(date) // Returns day of week
 * ```
 */
function islamicDayOfWeek(date: CalendarDate): number {
  const jdn = islamicToJDN(date);
  return truncate(jdn + 1.5) % 7;
}

/**
 * Islamic calendar operations.
 *
 * Provides all calendar-specific operations for the Islamic calendar.
 * Use this object to perform conversions and calculations with Islamic dates.
 *
 * @example
 * ```typescript
 * import { IslamicCalendar } from '@dasch-swiss/vre/shared/calendar';
 *
 * const date = createDate('ISLAMIC', 1445, 7, 4);
 * const jdn = IslamicCalendar.toJDN(date);
 * const daysInMonth = IslamicCalendar.daysInMonth(1445, 12);
 * const isLeap = IslamicCalendar.isLeapYear(1445);
 * ```
 */
export const IslamicCalendar: CalendarOperations = {
  toJDN: islamicToJDN,
  fromJDN: islamicFromJDN,
  daysInMonth: islamicDaysInMonth,
  isLeapYear: islamicIsLeapYear,
  dayOfWeek: islamicDayOfWeek,
};
