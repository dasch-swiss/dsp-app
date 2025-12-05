/**
 * Unit tests for calendar factory functions.
 */

import { GregorianCalendar } from '../calendars/gregorian.calendar';
import { IslamicCalendar } from '../calendars/islamic.calendar';
import { JulianCalendar } from '../calendars/julian.calendar';
import { getCalendar } from './calendar.factory';

describe('CalendarFactory', () => {
  describe('getCalendar', () => {
    it('should return GregorianCalendar for GREGORIAN system', () => {
      const calendar = getCalendar('GREGORIAN');
      expect(calendar).toBe(GregorianCalendar);
    });

    it('should return JulianCalendar for JULIAN system', () => {
      const calendar = getCalendar('JULIAN');
      expect(calendar).toBe(JulianCalendar);
    });

    it('should return IslamicCalendar for ISLAMIC system', () => {
      const calendar = getCalendar('ISLAMIC');
      expect(calendar).toBe(IslamicCalendar);
    });

    it('should throw error for unknown calendar system', () => {
      expect(() => getCalendar('UNKNOWN' as any)).toThrow('Unknown calendar system: UNKNOWN');
    });

    it('should return an object with all CalendarOperations methods', () => {
      const calendar = getCalendar('GREGORIAN');
      expect(typeof calendar.toJDN).toBe('function');
      expect(typeof calendar.fromJDN).toBe('function');
      expect(typeof calendar.daysInMonth).toBe('function');
      expect(typeof calendar.isLeapYear).toBe('function');
      expect(typeof calendar.dayOfWeek).toBe('function');
    });

    it('should return the same instance on multiple calls', () => {
      const calendar1 = getCalendar('GREGORIAN');
      const calendar2 = getCalendar('GREGORIAN');
      expect(calendar1).toBe(calendar2);
    });

    it('should return different instances for different calendars', () => {
      const gregorian = getCalendar('GREGORIAN');
      const julian = getCalendar('JULIAN');
      const islamic = getCalendar('ISLAMIC');

      expect(gregorian).not.toBe(julian);
      expect(gregorian).not.toBe(islamic);
      expect(julian).not.toBe(islamic);
    });

    it('should return calendars that have functional toJDN methods', () => {
      const gregorian = getCalendar('GREGORIAN');
      const julian = getCalendar('JULIAN');
      const islamic = getCalendar('ISLAMIC');

      // All calendars should be able to convert a date to JDN
      expect(typeof gregorian.toJDN).toBe('function');
      expect(typeof julian.toJDN).toBe('function');
      expect(typeof islamic.toJDN).toBe('function');
    });

    it('should return calendars that have functional fromJDN methods', () => {
      const gregorian = getCalendar('GREGORIAN');
      const julian = getCalendar('JULIAN');
      const islamic = getCalendar('ISLAMIC');

      // All calendars should be able to convert JDN to date
      expect(typeof gregorian.fromJDN).toBe('function');
      expect(typeof julian.fromJDN).toBe('function');
      expect(typeof islamic.fromJDN).toBe('function');
    });

    it('should return calendars that have functional daysInMonth methods', () => {
      const gregorian = getCalendar('GREGORIAN');
      const julian = getCalendar('JULIAN');
      const islamic = getCalendar('ISLAMIC');

      expect(gregorian.daysInMonth(2024, 1)).toBe(31);
      expect(julian.daysInMonth(2024, 1)).toBe(31);
      expect(islamic.daysInMonth(1445, 1)).toBe(30);
    });

    it('should return calendars that have functional isLeapYear methods', () => {
      const gregorian = getCalendar('GREGORIAN');
      const julian = getCalendar('JULIAN');
      const islamic = getCalendar('ISLAMIC');

      expect(gregorian.isLeapYear(2024)).toBe(true);
      expect(julian.isLeapYear(2024)).toBe(true);
      expect(typeof islamic.isLeapYear(1445)).toBe('boolean');
    });
  });
});
