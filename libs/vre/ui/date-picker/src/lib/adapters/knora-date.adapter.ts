/**
 * Adapter for converting between CalendarDate and KnoraDate.
 *
 * This adapter provides bidirectional conversion between the internal CalendarDate
 * representation and DSP-API's KnoraDate format.
 *
 * @module knora-date.adapter
 */

import { KnoraDate, KnoraPeriod, Precision } from '@dasch-swiss/dsp-js';
import {
  CalendarDate,
  CalendarPeriod,
  CalendarSystem,
  createDate,
  createPeriod,
  Era,
} from '@dasch-swiss/vre/shared/calendar';

/**
 * Converts a KnoraDate to a CalendarDate.
 *
 * @param knoraDate - The KnoraDate from DSP-API
 * @returns The equivalent CalendarDate
 *
 * @example
 * ```typescript
 * const knoraDate = new KnoraDate('GREGORIAN', 'CE', 2024, 1, 15);
 * const calendarDate = knoraDateToCalendarDate(knoraDate);
 * // Result: { calendar: 'GREGORIAN', year: 2024, month: 1, day: 15, era: 'CE', precision: 'DAY' }
 * ```
 */
export function knoraDateToCalendarDate(knoraDate: KnoraDate): CalendarDate {
  // Convert calendar name to uppercase
  const calendar = knoraDate.calendar.toUpperCase() as CalendarSystem;

  // Convert era
  let era: Era;
  if (knoraDate.era === 'BCE') {
    era = 'BCE';
  } else if (knoraDate.era === 'CE' || knoraDate.era === 'AD') {
    era = 'CE';
  } else if (knoraDate.era === 'noEra') {
    era = 'NONE';
  } else {
    // Default to CE for unrecognized era
    era = calendar === 'ISLAMIC' ? 'NONE' : 'CE';
  }

  // Convert year: KnoraDate stores BCE years as positive, CalendarDate uses negative
  const year = era === 'BCE' ? -knoraDate.year : knoraDate.year;

  // Create date with appropriate precision
  return createDate(calendar, year, knoraDate.month, knoraDate.day, era);
}

/**
 * Converts a CalendarDate to a KnoraDate.
 *
 * @param date - The CalendarDate
 * @returns The equivalent KnoraDate
 *
 * @example
 * ```typescript
 * const calendarDate = createDate('GREGORIAN', 2024, 1, 15);
 * const knoraDate = calendarDateToKnoraDate(calendarDate);
 * // Result: KnoraDate('GREGORIAN', 'CE', 2024, 1, 15)
 * ```
 */
export function calendarDateToKnoraDate(date: CalendarDate): KnoraDate {
  // Convert era to KnoraDate format
  const knoraEra = date.era === 'BCE' ? 'BCE' : date.era === 'CE' ? 'CE' : 'noEra';

  // Convert year: CalendarDate uses negative years for BCE, KnoraDate uses positive
  const year = date.era === 'BCE' ? Math.abs(date.year) : date.year;

  // Create KnoraDate with appropriate precision
  return new KnoraDate(date.calendar, knoraEra, year, date.month, date.day);
}

/**
 * Converts a KnoraPeriod to a CalendarPeriod.
 *
 * @param knoraPeriod - The KnoraPeriod from DSP-API
 * @returns The equivalent CalendarPeriod
 *
 * @example
 * ```typescript
 * const knoraPeriod = new KnoraPeriod(startKnoraDate, endKnoraDate);
 * const calendarPeriod = knoraPeriodToCalendarPeriod(knoraPeriod);
 * ```
 */
export function knoraPeriodToCalendarPeriod(knoraPeriod: KnoraPeriod): CalendarPeriod {
  const start = knoraDateToCalendarDate(knoraPeriod.start);
  const end = knoraDateToCalendarDate(knoraPeriod.end);

  return createPeriod(start, end);
}

/**
 * Converts a CalendarPeriod to a KnoraPeriod.
 *
 * @param period - The CalendarPeriod
 * @returns The equivalent KnoraPeriod
 *
 * @example
 * ```typescript
 * const start = createDate('GREGORIAN', 2024, 1, 1);
 * const end = createDate('GREGORIAN', 2024, 12, 31);
 * const calendarPeriod = createPeriod(start, end);
 * const knoraPeriod = calendarPeriodToKnoraPeriod(calendarPeriod);
 * ```
 */
export function calendarPeriodToKnoraPeriod(period: CalendarPeriod): KnoraPeriod {
  const startKnoraDate = calendarDateToKnoraDate(period.start);
  const endKnoraDate = calendarDateToKnoraDate(period.end);

  return new KnoraPeriod(startKnoraDate, endKnoraDate);
}

/**
 * Gets the Precision value from a CalendarDate.
 *
 * This is useful when working with DSP-API which uses the Precision enum.
 *
 * @param date - The CalendarDate
 * @returns The DSP-API Precision value
 *
 * @example
 * ```typescript
 * const date = createDate('GREGORIAN', 2024, 1, 15);
 * const precision = getPrecisionFromCalendarDate(date);
 * // Result: Precision.dayPrecision
 * ```
 */
export function getPrecisionFromCalendarDate(date: CalendarDate): Precision {
  switch (date.precision) {
    case 'DAY':
      return Precision.dayPrecision;
    case 'MONTH':
      return Precision.monthPrecision;
    case 'YEAR':
      return Precision.yearPrecision;
  }
}

/**
 * Type guard to check if a value is a KnoraDate.
 *
 * @param value - The value to check
 * @returns True if the value is a KnoraDate
 */
export function isKnoraDate(value: unknown): value is KnoraDate {
  return value instanceof KnoraDate;
}

/**
 * Type guard to check if a value is a KnoraPeriod.
 *
 * @param value - The value to check
 * @returns True if the value is a KnoraPeriod
 */
export function isKnoraPeriod(value: unknown): value is KnoraPeriod {
  return value instanceof KnoraPeriod;
}
