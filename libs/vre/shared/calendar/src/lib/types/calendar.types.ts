/**
 * Core type definitions for the calendar system.
 *
 * This module defines the fundamental types used throughout the calendar system,
 * including calendar systems, eras, precisions, and date representations.
 *
 * @module calendar.types
 */

/**
 * Supported calendar systems.
 *
 * The calendar system provides comprehensive support for converting dates between
 * different calendar systems using Julian Day Numbers (JDN) as an intermediate representation.
 */
export const CALENDAR_SYSTEMS = ['GREGORIAN', 'JULIAN', 'ISLAMIC'] as const;

/**
 * Type representing a supported calendar system.
 *
 * @example
 * ```typescript
 * const calendar: CalendarSystem = 'GREGORIAN';
 * ```
 */
export type CalendarSystem = (typeof CALENDAR_SYSTEMS)[number];

/**
 * Era designations for dates.
 *
 * - **CE** (Common Era): Equivalent to AD (Anno Domini)
 * - **BCE** (Before Common Era): Equivalent to BC (Before Christ)
 * - **NONE**: No era designation (used for Islamic calendar)
 */
export const ERAS = ['CE', 'BCE', 'NONE'] as const;

/**
 * Type representing an era.
 *
 * @example
 * ```typescript
 * const modernEra: Era = 'CE';
 * const ancientEra: Era = 'BCE';
 * ```
 */
export type Era = (typeof ERAS)[number];

/**
 * Precision level for dates.
 *
 * Dates can have different levels of precision depending on available information:
 * - **YEAR**: Year only (e.g., 2024)
 * - **MONTH**: Year and month (e.g., 2024-01)
 * - **DAY**: Full date (e.g., 2024-01-15)
 */
export const DATE_PRECISIONS = ['YEAR', 'MONTH', 'DAY'] as const;

/**
 * Type representing date precision.
 *
 * @example
 * ```typescript
 * const fullPrecision: DatePrecision = 'DAY';
 * const yearOnly: DatePrecision = 'YEAR';
 * ```
 */
export type DatePrecision = (typeof DATE_PRECISIONS)[number];

/**
 * Immutable representation of a calendar date.
 *
 * This is the core data structure for representing dates in any supported calendar system.
 * All dates are immutable - operations on dates return new date objects.
 *
 * @remarks
 * - **calendar**: The calendar system (Gregorian, Julian, or Islamic)
 * - **year**: The year (astronomical year, can be negative for BCE)
 * - **month**: The month (1-12), undefined if precision is YEAR
 * - **day**: The day (1-31), undefined if precision is YEAR or MONTH
 * - **era**: The era (CE, BCE, or NONE for Islamic)
 * - **precision**: The precision level of this date
 *
 * @example
 * ```typescript
 * // Full date
 * const date: CalendarDate = {
 *   calendar: 'GREGORIAN',
 *   year: 2024,
 *   month: 1,
 *   day: 15,
 *   era: 'CE',
 *   precision: 'DAY'
 * };
 *
 * // Year-only date
 * const yearOnly: CalendarDate = {
 *   calendar: 'GREGORIAN',
 *   year: 2024,
 *   era: 'CE',
 *   precision: 'YEAR'
 * };
 * ```
 */
export interface CalendarDate {
  readonly calendar: CalendarSystem;
  readonly year: number;
  readonly month?: number;
  readonly day?: number;
  readonly era: Era;
  readonly precision: DatePrecision;
}

/**
 * Immutable representation of a date period/range.
 *
 * A period represents a range of dates with a start and end point.
 * Both dates must be in the same calendar system.
 *
 * @remarks
 * The start date must be before or equal to the end date.
 *
 * @example
 * ```typescript
 * const period: CalendarPeriod = {
 *   start: {
 *     calendar: 'GREGORIAN',
 *     year: 2024,
 *     month: 1,
 *     day: 1,
 *     era: 'CE',
 *     precision: 'DAY'
 *   },
 *   end: {
 *     calendar: 'GREGORIAN',
 *     year: 2024,
 *     month: 12,
 *     day: 31,
 *     era: 'CE',
 *     precision: 'DAY'
 *   }
 * };
 * ```
 */
export interface CalendarPeriod {
  readonly start: CalendarDate;
  readonly end: CalendarDate;
}

/**
 * Calendar-specific operations interface.
 *
 * Each calendar system implements these operations to provide
 * conversions, calculations, and utilities specific to that calendar.
 *
 * @remarks
 * This interface uses the Strategy pattern - different calendar systems
 * provide different implementations of these operations.
 */
export interface CalendarOperations {
  /**
   * Convert a calendar date to Julian Day Number.
   *
   * The Julian Day Number (JDN) is the continuous count of days since the beginning
   * of the Julian Period on January 1, 4713 BCE (proleptic Julian calendar).
   *
   * @param date - The calendar date to convert
   * @returns The Julian Day Number (integer)
   *
   * @example
   * ```typescript
   * const date = { calendar: 'GREGORIAN', year: 2000, month: 1, day: 1, era: 'CE', precision: 'DAY' };
   * const jdn = gregorianCalendar.toJDN(date); // Returns 2451545
   * ```
   */
  toJDN(date: CalendarDate): number;

  /**
   * Convert a Julian Day Number to a calendar date.
   *
   * @param jdn - The Julian Day Number (integer)
   * @returns The calendar date
   *
   * @example
   * ```typescript
   * const date = gregorianCalendar.fromJDN(2451545);
   * // Returns { calendar: 'GREGORIAN', year: 2000, month: 1, day: 1, era: 'CE', precision: 'DAY' }
   * ```
   */
  fromJDN(jdn: number): CalendarDate;

  /**
   * Calculate the number of days in a month.
   *
   * @param year - The year (astronomical year, can be negative)
   * @param month - The month (1-12)
   * @returns Number of days in the month
   *
   * @example
   * ```typescript
   * gregorianCalendar.daysInMonth(2024, 2); // Returns 29 (leap year)
   * gregorianCalendar.daysInMonth(2023, 2); // Returns 28
   * ```
   */
  daysInMonth(year: number, month: number): number;

  /**
   * Determine if a year is a leap year.
   *
   * @param year - The year (astronomical year, can be negative)
   * @returns True if leap year, false otherwise
   *
   * @example
   * ```typescript
   * gregorianCalendar.isLeapYear(2024); // Returns true
   * gregorianCalendar.isLeapYear(2023); // Returns false
   * ```
   */
  isLeapYear(year: number): boolean;

  /**
   * Calculate the day of week for a date.
   *
   * @param date - The calendar date
   * @returns Day of week (0=Sunday, 1=Monday, ..., 6=Saturday)
   *
   * @example
   * ```typescript
   * const date = { calendar: 'GREGORIAN', year: 2024, month: 1, day: 1, era: 'CE', precision: 'DAY' };
   * gregorianCalendar.dayOfWeek(date); // Returns 1 (Monday)
   * ```
   */
  dayOfWeek(date: CalendarDate): number;
}

/**
 * Date format types supported by the formatter.
 *
 * @remarks
 * - **DD-MM-YYYY**: 15-01-2024
 * - **MM-DD-YYYY**: 01-15-2024
 * - **YYYY-MM-DD**: 2024-01-15 (ISO format)
 * - **DD.MM.YYYY**: 15.01.2024
 * - **GRAVSEARCH**: GREGORIAN:2024-01-15 CE (DSP-API gravsearch format)
 */
export type DateFormat = 'DD-MM-YYYY' | 'MM-DD-YYYY' | 'YYYY-MM-DD' | 'DD.MM.YYYY' | 'GRAVSEARCH';

/**
 * Configuration options for date formatting.
 */
export interface DateFormatOptions {
  /** The format to use */
  format: DateFormat;
  /** Whether to show the era (CE/BCE) */
  showEra?: boolean;
  /** Whether to show the calendar name */
  showCalendar?: boolean;
  /** Locale for month/day names */
  locale?: string;
}

/**
 * Error class for calendar-related errors.
 */
export class CalendarError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CalendarError';
  }
}
