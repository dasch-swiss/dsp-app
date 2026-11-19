/**
 * Calendar System Library
 *
 * A comprehensive calendar library supporting Gregorian, Julian, and Islamic calendars.
 * Provides type-safe date creation, conversion, and manipulation with Julian Day Number (JDN)
 * as the underlying conversion mechanism.
 *
 * @example
 * ```typescript
 * import { createDate, convertCalendarResult, isEqual } from '@dasch-swiss/vre/shared/calendar';
 *
 * // Create a date
 * const gregorianDate = createDate('GREGORIAN', 2024, 1, 15);
 *
 * // Convert to another calendar: an exact date, a span, or a refusal
 * const result = convertCalendarResult(gregorianDate, 'JULIAN');
 *
 * // Compare dates
 * const same = result.kind === 'exact' && isEqual(result.date, gregorianDate);
 * ```
 *
 * @packageDocumentation
 */

// Types
export type { CalendarSystem, CalendarDate } from './lib/types/calendar.types';

export { CALENDAR_SYSTEMS } from './lib/types/calendar.types';

// Factories
export { createDate } from './lib/factories/date.factory';

export { getCalendar } from './lib/factories/calendar.factory';

// Converters
export { convertCalendarResult, isEqual, isPeriodOutOfOrder, jdnRange } from './lib/converters/calendar.converter';
