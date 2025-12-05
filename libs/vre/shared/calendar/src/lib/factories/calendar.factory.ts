/**
 * Calendar factory functions.
 *
 * Provides factory functions to get calendar operations for different calendar systems.
 *
 * @module calendar.factory
 */

import { GregorianCalendar } from '../calendars/gregorian.calendar';
import { IslamicCalendar } from '../calendars/islamic.calendar';
import { JulianCalendar } from '../calendars/julian.calendar';
import { CalendarSystem, CalendarOperations } from '../types/calendar.types';

/**
 * Gets calendar operations for a specific calendar system.
 *
 * This is the primary way to access calendar-specific operations.
 * Returns an object implementing the `CalendarOperations` interface.
 *
 * @param system - The calendar system (GREGORIAN, JULIAN, or ISLAMIC)
 * @returns Calendar operations for the specified system
 * @throws {Error} If an invalid calendar system is provided
 *
 * @example
 * ```typescript
 * const gregorian = getCalendar('GREGORIAN');
 * const jdn = gregorian.toJDN(someDate);
 * const daysInMonth = gregorian.daysInMonth(2024, 2);
 * ```
 */
export function getCalendar(system: CalendarSystem): CalendarOperations {
  switch (system) {
    case 'GREGORIAN':
      return GregorianCalendar;
    case 'JULIAN':
      return JulianCalendar;
    case 'ISLAMIC':
      return IslamicCalendar;
    default:
      throw new Error(`Unknown calendar system: ${system}`);
  }
}
