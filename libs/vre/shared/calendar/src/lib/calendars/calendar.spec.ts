/**
 * Basic tests for calendar library.
 *
 * These tests verify the core functionality of the calendar system.
 */

import { convertCalendar, compareDates } from '../converters/calendar.converter';
import { createDate } from '../factories/date.factory';
import { GregorianCalendar } from './gregorian.calendar';
import { IslamicCalendar } from './islamic.calendar';
import { JulianCalendar } from './julian.calendar';

describe('Calendar Library', () => {
  describe('createDate', () => {
    it('should create a Gregorian date with full precision', () => {
      const date = createDate('GREGORIAN', 2024, 1, 15);

      expect(date.calendar).toBe('GREGORIAN');
      expect(date.year).toBe(2024);
      expect(date.month).toBe(1);
      expect(date.day).toBe(15);
      expect(date.era).toBe('CE');
      expect(date.precision).toBe('DAY');
    });

    it('should create a year-only precision date', () => {
      const date = createDate('GREGORIAN', 2024);

      expect(date.year).toBe(2024);
      expect(date.month).toBeUndefined();
      expect(date.day).toBeUndefined();
      expect(date.precision).toBe('YEAR');
    });

    it('should create a month precision date', () => {
      const date = createDate('GREGORIAN', 2024, 3);

      expect(date.year).toBe(2024);
      expect(date.month).toBe(3);
      expect(date.day).toBeUndefined();
      expect(date.precision).toBe('MONTH');
    });

    it('should create a BCE date', () => {
      const date = createDate('JULIAN', -44, 3, 15, 'BCE');

      expect(date.year).toBe(-44);
      expect(date.era).toBe('BCE');
    });

    it('should create an Islamic date with NONE era', () => {
      const date = createDate('ISLAMIC', 1445, 7, 4);

      expect(date.calendar).toBe('ISLAMIC');
      expect(date.era).toBe('NONE');
    });

    it('should throw error for invalid month', () => {
      expect(() => createDate('GREGORIAN', 2024, 13, 1)).toThrow();
      expect(() => createDate('GREGORIAN', 2024, 0, 1)).toThrow();
    });

    it('should throw error for invalid day', () => {
      expect(() => createDate('GREGORIAN', 2024, 1, 0)).toThrow();
      expect(() => createDate('GREGORIAN', 2024, 1, 32)).toThrow();
    });
  });

  describe('Gregorian Calendar', () => {
    it('should convert January 1, 2000 to JDN 2451545', () => {
      const date = createDate('GREGORIAN', 2000, 1, 1);
      const jdn = GregorianCalendar.toJDN(date);

      expect(jdn).toBe(2451545);
    });

    it('should convert JDN 2451545 back to January 1, 2000', () => {
      const date = GregorianCalendar.fromJDN(2451545);

      expect(date.year).toBe(2000);
      expect(date.month).toBe(1);
      expect(date.day).toBe(1);
    });

    it('should identify 2024 as a leap year', () => {
      expect(GregorianCalendar.isLeapYear(2024)).toBe(true);
    });

    it('should identify 2023 as not a leap year', () => {
      expect(GregorianCalendar.isLeapYear(2023)).toBe(false);
    });

    it('should identify 1900 as not a leap year (century rule)', () => {
      expect(GregorianCalendar.isLeapYear(1900)).toBe(false);
    });

    it('should identify 2000 as a leap year (400-year rule)', () => {
      expect(GregorianCalendar.isLeapYear(2000)).toBe(true);
    });

    it('should return correct days in February for leap year', () => {
      expect(GregorianCalendar.daysInMonth(2024, 2)).toBe(29);
    });

    it('should return correct days in February for non-leap year', () => {
      expect(GregorianCalendar.daysInMonth(2023, 2)).toBe(28);
    });

    it('should return correct days in January', () => {
      expect(GregorianCalendar.daysInMonth(2024, 1)).toBe(31);
    });
  });

  describe('Julian Calendar', () => {
    it('should convert dates to JDN', () => {
      const date = createDate('JULIAN', 2000, 1, 1);
      const jdn = JulianCalendar.toJDN(date);

      // Julian January 1, 2000 is 13 days behind Gregorian
      expect(jdn).toBe(2451558);
    });

    it('should identify leap years correctly (every 4 years)', () => {
      expect(JulianCalendar.isLeapYear(2024)).toBe(true);
      expect(JulianCalendar.isLeapYear(1900)).toBe(true); // Unlike Gregorian
      expect(JulianCalendar.isLeapYear(2023)).toBe(false);
    });
  });

  describe('Islamic Calendar', () => {
    it('should convert dates to JDN', () => {
      const date = createDate('ISLAMIC', 1445, 1, 1);
      const jdn = IslamicCalendar.toJDN(date);

      expect(typeof jdn).toBe('number');
      expect(jdn).toBeGreaterThan(0);
    });

    it('should determine days in month correctly', () => {
      // Odd months have 30 days
      expect(IslamicCalendar.daysInMonth(1445, 1)).toBe(30);
      expect(IslamicCalendar.daysInMonth(1445, 3)).toBe(30);

      // Even months have 29 days
      expect(IslamicCalendar.daysInMonth(1445, 2)).toBe(29);
      expect(IslamicCalendar.daysInMonth(1445, 4)).toBe(29);
    });
  });

  describe('convertCalendar', () => {
    it('should convert Gregorian to Julian', () => {
      const gregorian = createDate('GREGORIAN', 2024, 1, 15);
      const julian = convertCalendar(gregorian, 'JULIAN');

      expect(julian.calendar).toBe('JULIAN');
      expect(julian.year).toBe(2024);
      expect(julian.month).toBe(1);
      expect(julian.day).toBe(2); // Julian is 13 days behind
    });

    it('should convert Gregorian to Islamic', () => {
      const gregorian = createDate('GREGORIAN', 2024, 1, 15);
      const islamic = convertCalendar(gregorian, 'ISLAMIC');

      expect(islamic.calendar).toBe('ISLAMIC');
      expect(islamic.era).toBe('NONE');
    });

    it('should preserve precision when converting', () => {
      const gregorian = createDate('GREGORIAN', 2024);
      const julian = convertCalendar(gregorian, 'JULIAN');

      expect(julian.precision).toBe('YEAR');
    });

    it('should return same date if already in target calendar', () => {
      const date = createDate('GREGORIAN', 2024, 1, 15);
      const result = convertCalendar(date, 'GREGORIAN');

      expect(result).toBe(date); // Same reference
    });
  });

  describe('compareDates', () => {
    it('should correctly compare dates in same calendar', () => {
      const date1 = createDate('GREGORIAN', 2024, 1, 15);
      const date2 = createDate('GREGORIAN', 2024, 2, 20);

      expect(compareDates(date1, date2)).toBeLessThan(0);
      expect(compareDates(date2, date1)).toBeGreaterThan(0);
      expect(compareDates(date1, date1)).toBe(0);
    });

    it('should correctly compare dates in different calendars', () => {
      const gregorian = createDate('GREGORIAN', 2024, 1, 15);
      const julian = createDate('JULIAN', 2024, 1, 2); // Same JDN

      expect(compareDates(gregorian, julian)).toBe(0); // Same day
    });
  });

  describe('Round-trip conversion', () => {
    it('should maintain date integrity through Gregorian->Julian->Gregorian', () => {
      const original = createDate('GREGORIAN', 2024, 3, 15);
      const julian = convertCalendar(original, 'JULIAN');
      const backToGregorian = convertCalendar(julian, 'GREGORIAN');

      expect(backToGregorian.year).toBe(original.year);
      expect(backToGregorian.month).toBe(original.month);
      expect(backToGregorian.day).toBe(original.day);
    });

    it('should maintain date integrity through Gregorian->Islamic->Gregorian', () => {
      const original = createDate('GREGORIAN', 2024, 3, 15);
      const islamic = convertCalendar(original, 'ISLAMIC');
      const backToGregorian = convertCalendar(islamic, 'GREGORIAN');

      expect(backToGregorian.year).toBe(original.year);
      expect(backToGregorian.month).toBe(original.month);
      expect(backToGregorian.day).toBe(original.day);
    });
  });
});
