/**
 * Unit tests for Julian calendar operations.
 */

import { createDate } from '../factories/date.factory';
import { JulianCalendar } from './julian.calendar';

describe('JulianCalendar', () => {
  describe('toJDN', () => {
    it('should convert January 1, 2000 to JDN 2451558', () => {
      const date = createDate('JULIAN', 2000, 1, 1);
      expect(JulianCalendar.toJDN(date)).toBe(2451558);
    });

    it('should convert January 1, 1 CE to a valid JDN', () => {
      const date = createDate('JULIAN', 1, 1, 1);
      const jdn = JulianCalendar.toJDN(date);
      expect(jdn).toBe(1721424);
    });

    it('should convert January 1, 1 BCE (year 0) correctly', () => {
      const date = createDate('JULIAN', 0, 1, 1);
      const jdn = JulianCalendar.toJDN(date);
      expect(jdn).toBe(1721058);
    });

    it('should handle BCE dates correctly', () => {
      const date = createDate('JULIAN', -44, 3, 15, 'BCE'); // Ides of March, 44 BCE
      const jdn = JulianCalendar.toJDN(date);
      expect(typeof jdn).toBe('number');
      expect(jdn).toBeGreaterThan(0);
    });

    it('should handle December 31 correctly', () => {
      const date = createDate('JULIAN', 2000, 12, 31);
      expect(JulianCalendar.toJDN(date)).toBe(2451923);
    });

    it('should handle leap year February 29 correctly', () => {
      const date = createDate('JULIAN', 2000, 2, 29);
      const jdn = JulianCalendar.toJDN(date);
      expect(typeof jdn).toBe('number');
      expect(jdn).toBeGreaterThan(0);
    });

    it('should use month 1 as default when month is undefined', () => {
      const date = { ...createDate('JULIAN', 2000), month: undefined };
      const result = JulianCalendar.toJDN(date);
      const expected = JulianCalendar.toJDN(createDate('JULIAN', 2000, 1, 1));
      expect(result).toBe(expected);
    });

    it('should use day 1 as default when day is undefined', () => {
      const date = { ...createDate('JULIAN', 2000, 3), day: undefined };
      const result = JulianCalendar.toJDN(date);
      const expected = JulianCalendar.toJDN(createDate('JULIAN', 2000, 3, 1));
      expect(result).toBe(expected);
    });

    it('should produce increasing JDNs for successive dates', () => {
      const date1 = createDate('JULIAN', 2000, 1, 1);
      const date2 = createDate('JULIAN', 2000, 1, 2);
      const date3 = createDate('JULIAN', 2000, 1, 3);

      const jdn1 = JulianCalendar.toJDN(date1);
      const jdn2 = JulianCalendar.toJDN(date2);
      const jdn3 = JulianCalendar.toJDN(date3);

      expect(jdn2).toBe(jdn1 + 1);
      expect(jdn3).toBe(jdn2 + 1);
    });

    it('should handle year -1 (2 BCE) correctly', () => {
      const date = createDate('JULIAN', -1, 1, 1, 'BCE');
      const jdn = JulianCalendar.toJDN(date);
      expect(typeof jdn).toBe('number');
      expect(jdn).toBeGreaterThan(0);
    });

    it('should handle large positive years', () => {
      const date = createDate('JULIAN', 3000, 1, 1);
      const jdn = JulianCalendar.toJDN(date);
      expect(typeof jdn).toBe('number');
      expect(jdn).toBeGreaterThan(0);
    });
  });

  describe('fromJDN', () => {
    it('should convert JDN 2451558 to January 1, 2000', () => {
      const result = JulianCalendar.fromJDN(2451558);
      expect(result.calendar).toBe('JULIAN');
      expect(result.year).toBe(2000);
      expect(result.month).toBe(1);
      expect(result.day).toBe(1);
      expect(result.era).toBe('CE');
    });

    it('should convert JDN 1721424 to January 1, 1 CE', () => {
      const result = JulianCalendar.fromJDN(1721424);
      expect(result.year).toBe(1);
      expect(result.month).toBe(1);
      expect(result.day).toBe(1);
      expect(result.era).toBe('CE');
    });

    it('should set era to CE for positive years', () => {
      const result = JulianCalendar.fromJDN(2451558);
      expect(result.era).toBe('CE');
    });

    it('should set era to BCE for negative years', () => {
      const result = JulianCalendar.fromJDN(1721057); // Should be year 0 or negative
      expect(result.era).toBe('BCE');
    });

    it('should return valid month (1-12)', () => {
      const result = JulianCalendar.fromJDN(2451558);
      expect(result.month).toBeGreaterThanOrEqual(1);
      expect(result.month).toBeLessThanOrEqual(12);
    });

    it('should return valid day (1-31)', () => {
      const result = JulianCalendar.fromJDN(2451558);
      expect(result.day).toBeGreaterThanOrEqual(1);
      expect(result.day).toBeLessThanOrEqual(31);
    });

    it('should round-trip correctly', () => {
      const original = createDate('JULIAN', 2024, 3, 15);
      const jdn = JulianCalendar.toJDN(original);
      const converted = JulianCalendar.fromJDN(jdn);

      expect(converted.year).toBe(original.year);
      expect(converted.month).toBe(original.month);
      expect(converted.day).toBe(original.day);
    });

    it('should round-trip correctly for year 1', () => {
      const original = createDate('JULIAN', 1, 1, 1);
      const jdn = JulianCalendar.toJDN(original);
      const converted = JulianCalendar.fromJDN(jdn);

      expect(converted.year).toBe(original.year);
      expect(converted.month).toBe(original.month);
      expect(converted.day).toBe(original.day);
    });

    it('should round-trip correctly for BCE dates', () => {
      const original = createDate('JULIAN', -44, 3, 15, 'BCE');
      const jdn = JulianCalendar.toJDN(original);
      const converted = JulianCalendar.fromJDN(jdn);

      expect(converted.year).toBe(original.year);
      expect(converted.month).toBe(original.month);
      expect(converted.day).toBe(original.day);
    });

    it('should round-trip correctly for December 31', () => {
      const original = createDate('JULIAN', 2000, 12, 31);
      const jdn = JulianCalendar.toJDN(original);
      const converted = JulianCalendar.fromJDN(jdn);

      expect(converted.year).toBe(original.year);
      expect(converted.month).toBe(original.month);
      expect(converted.day).toBe(original.day);
    });
  });

  describe('isLeapYear', () => {
    it('should return true for years divisible by 4', () => {
      expect(JulianCalendar.isLeapYear(2024)).toBe(true);
      expect(JulianCalendar.isLeapYear(2020)).toBe(true);
      expect(JulianCalendar.isLeapYear(2004)).toBe(true);
      expect(JulianCalendar.isLeapYear(2000)).toBe(true);
    });

    it('should return false for years not divisible by 4', () => {
      expect(JulianCalendar.isLeapYear(2023)).toBe(false);
      expect(JulianCalendar.isLeapYear(2021)).toBe(false);
      expect(JulianCalendar.isLeapYear(2019)).toBe(false);
      expect(JulianCalendar.isLeapYear(2001)).toBe(false);
    });

    it('should return true for 1900 (unlike Gregorian)', () => {
      // In Julian calendar, 1900 is a leap year
      // In Gregorian calendar, 1900 is not a leap year
      expect(JulianCalendar.isLeapYear(1900)).toBe(true);
    });

    it('should return true for 1800 (unlike Gregorian)', () => {
      expect(JulianCalendar.isLeapYear(1800)).toBe(true);
    });

    it('should return true for 1700 (unlike Gregorian)', () => {
      expect(JulianCalendar.isLeapYear(1700)).toBe(true);
    });

    it('should return true for 2000', () => {
      expect(JulianCalendar.isLeapYear(2000)).toBe(true);
    });

    it('should handle negative years (BCE) correctly', () => {
      expect(JulianCalendar.isLeapYear(-4)).toBe(true); // 5 BCE
      expect(JulianCalendar.isLeapYear(-1)).toBe(false); // 2 BCE
      expect(JulianCalendar.isLeapYear(-8)).toBe(true); // 9 BCE
    });

    it('should handle year 0 (1 BCE) correctly', () => {
      expect(JulianCalendar.isLeapYear(0)).toBe(true);
    });

    it('should be consistent across multiple calls', () => {
      const year = 2024;
      const result1 = JulianCalendar.isLeapYear(year);
      const result2 = JulianCalendar.isLeapYear(year);
      expect(result1).toBe(result2);
    });
  });

  describe('daysInMonth', () => {
    it('should return 31 for January', () => {
      expect(JulianCalendar.daysInMonth(2024, 1)).toBe(31);
    });

    it('should return 28 for February in non-leap years', () => {
      expect(JulianCalendar.daysInMonth(2023, 2)).toBe(28);
      expect(JulianCalendar.daysInMonth(2021, 2)).toBe(28);
      expect(JulianCalendar.daysInMonth(2019, 2)).toBe(28);
    });

    it('should return 29 for February in leap years', () => {
      expect(JulianCalendar.daysInMonth(2024, 2)).toBe(29);
      expect(JulianCalendar.daysInMonth(2020, 2)).toBe(29);
      expect(JulianCalendar.daysInMonth(2000, 2)).toBe(29);
    });

    it('should return 29 for February 1900 (leap year in Julian)', () => {
      expect(JulianCalendar.daysInMonth(1900, 2)).toBe(29);
    });

    it('should return 31 for March', () => {
      expect(JulianCalendar.daysInMonth(2024, 3)).toBe(31);
    });

    it('should return 30 for April', () => {
      expect(JulianCalendar.daysInMonth(2024, 4)).toBe(30);
    });

    it('should return 31 for May', () => {
      expect(JulianCalendar.daysInMonth(2024, 5)).toBe(31);
    });

    it('should return 30 for June', () => {
      expect(JulianCalendar.daysInMonth(2024, 6)).toBe(30);
    });

    it('should return 31 for July', () => {
      expect(JulianCalendar.daysInMonth(2024, 7)).toBe(31);
    });

    it('should return 31 for August', () => {
      expect(JulianCalendar.daysInMonth(2024, 8)).toBe(31);
    });

    it('should return 30 for September', () => {
      expect(JulianCalendar.daysInMonth(2024, 9)).toBe(30);
    });

    it('should return 31 for October', () => {
      expect(JulianCalendar.daysInMonth(2024, 10)).toBe(31);
    });

    it('should return 30 for November', () => {
      expect(JulianCalendar.daysInMonth(2024, 11)).toBe(30);
    });

    it('should return 31 for December', () => {
      expect(JulianCalendar.daysInMonth(2024, 12)).toBe(31);
    });

    it('should throw error for invalid month (0)', () => {
      expect(() => JulianCalendar.daysInMonth(2024, 0)).toThrow('Invalid month: 0');
    });

    it('should throw error for invalid month (13)', () => {
      expect(() => JulianCalendar.daysInMonth(2024, 13)).toThrow('Invalid month: 13');
    });

    it('should throw error for invalid month (-1)', () => {
      expect(() => JulianCalendar.daysInMonth(2024, -1)).toThrow('Invalid month: -1');
    });

    it('should work for all valid months (1-12)', () => {
      for (let month = 1; month <= 12; month++) {
        const days = JulianCalendar.daysInMonth(2024, month);
        expect(days).toBeGreaterThanOrEqual(28);
        expect(days).toBeLessThanOrEqual(31);
      }
    });
  });

  describe('dayOfWeek', () => {
    it('should return a valid day of week (0-6)', () => {
      const date = createDate('JULIAN', 2024, 1, 1);
      const dow = JulianCalendar.dayOfWeek(date);
      expect(dow).toBeGreaterThanOrEqual(0);
      expect(dow).toBeLessThanOrEqual(6);
    });

    it('should be consistent for the same date', () => {
      const date = createDate('JULIAN', 2024, 3, 15);
      const dow1 = JulianCalendar.dayOfWeek(date);
      const dow2 = JulianCalendar.dayOfWeek(date);
      expect(dow1).toBe(dow2);
    });

    it('should increment by 1 (mod 7) for successive days', () => {
      const date1 = createDate('JULIAN', 2024, 1, 1);
      const date2 = createDate('JULIAN', 2024, 1, 2);

      const dow1 = JulianCalendar.dayOfWeek(date1);
      const dow2 = JulianCalendar.dayOfWeek(date2);

      expect(dow2).toBe((dow1 + 1) % 7);
    });

    it('should work for different years', () => {
      const years = [1, 100, 1000, 2000, 2024];
      years.forEach(year => {
        const date = createDate('JULIAN', year, 1, 1);
        const dow = JulianCalendar.dayOfWeek(date);
        expect(dow).toBeGreaterThanOrEqual(0);
        expect(dow).toBeLessThanOrEqual(6);
      });
    });

    it('should work for BCE dates', () => {
      const date = createDate('JULIAN', -44, 3, 15, 'BCE');
      const dow = JulianCalendar.dayOfWeek(date);
      expect(dow).toBeGreaterThanOrEqual(0);
      expect(dow).toBeLessThanOrEqual(6);
    });

    it('should cycle through all 7 days in a week', () => {
      const daysOfWeek = new Set<number>();
      for (let day = 1; day <= 7; day++) {
        const date = createDate('JULIAN', 2024, 1, day);
        daysOfWeek.add(JulianCalendar.dayOfWeek(date));
      }
      expect(daysOfWeek.size).toBe(7);
    });
  });

  describe('CalendarOperations interface', () => {
    it('should have all required operations', () => {
      expect(JulianCalendar.toJDN).toBeDefined();
      expect(JulianCalendar.fromJDN).toBeDefined();
      expect(JulianCalendar.daysInMonth).toBeDefined();
      expect(JulianCalendar.isLeapYear).toBeDefined();
      expect(JulianCalendar.dayOfWeek).toBeDefined();
    });

    it('should have functions as values', () => {
      expect(typeof JulianCalendar.toJDN).toBe('function');
      expect(typeof JulianCalendar.fromJDN).toBe('function');
      expect(typeof JulianCalendar.daysInMonth).toBe('function');
      expect(typeof JulianCalendar.isLeapYear).toBe('function');
      expect(typeof JulianCalendar.dayOfWeek).toBe('function');
    });
  });
});
