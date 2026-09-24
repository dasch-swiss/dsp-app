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
import { CalendarDate, CalendarError, CalendarOperations } from '../types/calendar.types';

/**
 * Helper function to truncate decimals (remove fractions).
 * Works correctly for both positive and negative numbers.
 *
 * @internal
 */
const truncate = (num: number): number => Math[num < 0 ? 'ceil' : 'floor'](num);

/**
 * The Hijra epoch: 1 Muḥarram 1 AH, which is 16 July 622 CE in the proleptic Julian calendar.
 *
 * This is the floor of the tabular calendar. `islamicToJDN` and `islamicFromJDN` are inverses at
 * and above it and are not defined below it, so `islamicFromJDN` refuses a smaller JDN rather than
 * returning a negative year. A negative Islamic year is not a date: the calendar has no
 * pre-epoch convention, and the previous implementation returned things like year −686 for a BCE
 * input, which then flowed into the UI as though it meant something.
 */
export const ISLAMIC_EPOCH_JDN = 1948440;

/**
 * Determine if a year is a leap year in the tabular Islamic calendar.
 *
 * The tabular calendar runs a 30-year cycle with 11 leap years, placed at the positions below.
 * A leap year gives month 12 a 30th day.
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
  // Positions within the 30-year cycle that carry the intercalary day.
  const leapYears = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];
  // `year % 30` is negative for negative years in JS, so normalise into 0..29 first.
  const yearInCycle = ((year % 30) + 30) % 30;
  return leapYears.includes(yearInCycle);
}

/**
 * Days elapsed from the epoch to the first day of an Islamic year.
 *
 * A 30-year cycle holds 19 common years of 354 days and 11 leap years of 355, so 10631 days.
 * The leap days already fallen within the current cycle are counted from the same leap-year
 * predicate the rest of the module uses, rather than from a closed-form accumulation. A closed
 * form has to agree with that predicate's exact leap placement, and when the two disagree the
 * functions stop being inverses — which is the defect this rewrite exists to remove, so the
 * definition is not duplicated in a second shape.
 *
 * @internal
 */
function daysBeforeIslamicYear(year: number): number {
  const yearIndex = year - 1;
  const cycle = Math.floor(yearIndex / 30);
  const yearsIntoCycle = yearIndex - cycle * 30;

  let days = cycle * 10631 + yearsIntoCycle * 354;
  // Years `cycle * 30 + 1` .. `year - 1` are the ones already elapsed inside this cycle.
  for (let y = cycle * 30 + 1; y < year; y++) {
    if (islamicIsLeapYear(y)) {
      days += 1;
    }
  }
  return days;
}

/**
 * Days elapsed from the start of an Islamic year to the first day of one of its months.
 *
 * Odd months have 30 days and even months 29, so a whole number of month pairs is 59 days.
 *
 * @internal
 */
function daysBeforeIslamicMonth(month: number): number {
  const monthIndex = month - 1;
  return Math.floor(monthIndex / 2) * 59 + (monthIndex % 2) * 30;
}

/**
 * Converts an Islamic calendar date to Julian Day Number (JDN).
 *
 * The inverse of {@link islamicFromJDN}. Both are derived from the same tabular definition —
 * the 30-year cycle in `islamicIsLeapYear`, the 59-day month pair, and {@link ISLAMIC_EPOCH_JDN} —
 * so that they cannot drift apart. They previously came from two different sources and were not
 * inverses: 26 days in the first 111,561 of the calendar failed to round-trip and 10 threw,
 * because `islamicFromJDN` could compute a month 13 that `createDate` then rejected.
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
  const year = date.year;
  const month = date.month ?? 1;
  const day = date.day ?? 1;

  return ISLAMIC_EPOCH_JDN + daysBeforeIslamicYear(year) + daysBeforeIslamicMonth(month) + (day - 1);
}

/**
 * Converts a Julian Day Number (JDN) to an Islamic calendar date.
 *
 * The inverse of {@link islamicToJDN}; see that function for why they share one definition.
 *
 * @param jdn - The Julian Day Number to convert
 * @returns The Islamic calendar date
 * @throws {CalendarError} If the JDN falls before the Hijra epoch, which the tabular calendar
 * does not define. Callers that offer a calendar choice check representability first, so a user
 * is never offered a conversion that lands here.
 *
 * @example
 * ```typescript
 * const date = islamicFromJDN(2460311);
 * // Returns Islamic calendar date
 * ```
 */
function islamicFromJDN(jdn: number): CalendarDate {
  if (jdn < ISLAMIC_EPOCH_JDN) {
    throw new CalendarError(
      `JDN ${jdn} is before the Hijra epoch (${ISLAMIC_EPOCH_JDN}); the Islamic calendar has no date for it`
    );
  }

  const daysSinceEpoch = jdn - ISLAMIC_EPOCH_JDN;

  // Locate the year by whole 30-year cycles first, then walk at most one year to correct for the
  // uneven leap placement inside the cycle.
  const cycle = Math.floor(daysSinceEpoch / 10631);
  let year = cycle * 30 + 1;
  let remaining = daysSinceEpoch - cycle * 10631;

  for (;;) {
    const yearLength = islamicIsLeapYear(year) ? 355 : 354;
    if (remaining < yearLength) {
      break;
    }
    remaining -= yearLength;
    year += 1;
  }

  // `remaining` is now the zero-based day of the year, which is at most 354, so the loop below
  // always settles on a month in 1..12 and can never produce the month 13 the old code could.
  let month = 1;
  for (; month < 12; month++) {
    const monthLength = month % 2 === 1 ? 30 : 29;
    if (remaining < monthLength) {
      break;
    }
    remaining -= monthLength;
  }

  const day = remaining + 1;

  return createDate('ISLAMIC', year, month, day, 'NONE');
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
