/**
 * Calendar System Library
 *
 * A comprehensive calendar library supporting Gregorian, Julian, and Islamic calendars.
 * Provides type-safe date creation, conversion, and manipulation with Julian Day Number (JDN)
 * as the underlying conversion mechanism.
 *
 * @example
 * ```typescript
 * import { createDate, convertCalendar, compareDates } from '@dasch-swiss/vre/shared/calendar';
 *
 * // Create a date
 * const gregorianDate = createDate('GREGORIAN', 2024, 1, 15);
 *
 * // Convert to another calendar
 * const julianDate = convertCalendar(gregorianDate, 'JULIAN');
 *
 * // Compare dates
 * const isEarlier = compareDates(gregorianDate, julianDate) < 0;
 * ```
 *
 * @packageDocumentation
 */

// Types
export type {
  CalendarSystem,
  Era,
  DatePrecision,
  CalendarDate,
  CalendarPeriod,
  CalendarOperations,
  DateFormat,
  DateFormatOptions,
} from './lib/types/calendar.types';

export { CalendarError, CALENDAR_SYSTEMS, ERAS, DATE_PRECISIONS } from './lib/types/calendar.types';

// Factories
export { createDate, createPeriod, createToday, isCalendarDate, isCalendarPeriod } from './lib/factories/date.factory';

export { getCalendar } from './lib/factories/calendar.factory';

// Calendars
export { GregorianCalendar } from './lib/calendars/gregorian.calendar';
export { JulianCalendar } from './lib/calendars/julian.calendar';
export { IslamicCalendar } from './lib/calendars/islamic.calendar';

// Converters
export {
  convertCalendar,
  compareDates,
  isBefore,
  isAfter,
  isEqual,
  validatePeriod,
} from './lib/converters/calendar.converter';
