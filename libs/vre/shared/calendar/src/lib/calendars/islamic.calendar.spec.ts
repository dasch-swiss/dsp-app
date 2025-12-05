/**
 * Unit tests for Islamic calendar operations.
 */

import { createDate } from '../factories/date.factory';
import { IslamicCalendar } from './islamic.calendar';

describe('IslamicCalendar', () => {
  describe('toJDN', () => {
    it('should convert Muharram 1, 1445 to a valid JDN', () => {
      const date = createDate('ISLAMIC', 1445, 1, 1);
      const jdn = IslamicCalendar.toJDN(date);
      expect(typeof jdn).toBe('number');
      expect(jdn).toBeGreaterThan(0);
    });

    it('should convert Rajab 4, 1445 to a valid JDN', () => {
      const date = createDate('ISLAMIC', 1445, 7, 4);
      const jdn = IslamicCalendar.toJDN(date);
      expect(typeof jdn).toBe('number');
      expect(jdn).toBeGreaterThan(0);
    });

    it('should convert year 1, month 1, day 1 to a valid JDN', () => {
      const date = createDate('ISLAMIC', 1, 1, 1);
      const jdn = IslamicCalendar.toJDN(date);
      // Should be around July 16, 622 CE (JDN ~1948440)
      expect(jdn).toBeGreaterThan(1948000);
      expect(jdn).toBeLessThan(1949000);
    });

    it('should handle month 12 correctly', () => {
      const date = createDate('ISLAMIC', 1445, 12, 1);
      const jdn = IslamicCalendar.toJDN(date);
      expect(typeof jdn).toBe('number');
      expect(jdn).toBeGreaterThan(0);
    });

    it('should handle day 30 in odd months correctly', () => {
      const date = createDate('ISLAMIC', 1445, 1, 30);
      const jdn = IslamicCalendar.toJDN(date);
      expect(typeof jdn).toBe('number');
      expect(jdn).toBeGreaterThan(0);
    });

    it('should use month 1 as default when month is undefined', () => {
      const date = { ...createDate('ISLAMIC', 1445), month: undefined };
      const result = IslamicCalendar.toJDN(date);
      const expected = IslamicCalendar.toJDN(createDate('ISLAMIC', 1445, 1, 1));
      expect(result).toBe(expected);
    });

    it('should use day 1 as default when day is undefined', () => {
      const date = { ...createDate('ISLAMIC', 1445, 7), day: undefined };
      const result = IslamicCalendar.toJDN(date);
      const expected = IslamicCalendar.toJDN(createDate('ISLAMIC', 1445, 7, 1));
      expect(result).toBe(expected);
    });

    it('should produce increasing JDNs for successive dates', () => {
      const date1 = createDate('ISLAMIC', 1445, 1, 1);
      const date2 = createDate('ISLAMIC', 1445, 1, 2);
      const date3 = createDate('ISLAMIC', 1445, 1, 3);

      const jdn1 = IslamicCalendar.toJDN(date1);
      const jdn2 = IslamicCalendar.toJDN(date2);
      const jdn3 = IslamicCalendar.toJDN(date3);

      expect(jdn2).toBe(jdn1 + 1);
      expect(jdn3).toBe(jdn2 + 1);
    });
  });

  describe('fromJDN', () => {
    it('should convert a valid JDN to an Islamic date', () => {
      const jdn = 2460311; // Some valid JDN
      const result = IslamicCalendar.fromJDN(jdn);

      expect(result.calendar).toBe('ISLAMIC');
      expect(result.era).toBe('NONE');
      expect(typeof result.year).toBe('number');
      expect(typeof result.month).toBe('number');
      expect(typeof result.day).toBe('number');
    });

    it('should return era as NONE for Islamic dates', () => {
      const jdn = 2460311;
      const result = IslamicCalendar.fromJDN(jdn);
      expect(result.era).toBe('NONE');
    });

    it('should return valid month (1-12)', () => {
      const jdn = 2460311;
      const result = IslamicCalendar.fromJDN(jdn);
      expect(result.month).toBeGreaterThanOrEqual(1);
      expect(result.month).toBeLessThanOrEqual(12);
    });

    it('should return valid day (1-30)', () => {
      const jdn = 2460311;
      const result = IslamicCalendar.fromJDN(jdn);
      expect(result.day).toBeGreaterThanOrEqual(1);
      expect(result.day).toBeLessThanOrEqual(30);
    });

    it('should round-trip correctly', () => {
      const original = createDate('ISLAMIC', 1445, 7, 4);
      const jdn = IslamicCalendar.toJDN(original);
      const converted = IslamicCalendar.fromJDN(jdn);

      expect(converted.year).toBe(original.year);
      expect(converted.month).toBe(original.month);
      expect(converted.day).toBe(original.day);
    });

    it('should round-trip correctly for year 1', () => {
      const original = createDate('ISLAMIC', 1, 1, 1);
      const jdn = IslamicCalendar.toJDN(original);
      const converted = IslamicCalendar.fromJDN(jdn);

      expect(converted.year).toBe(original.year);
      expect(converted.month).toBe(original.month);
      expect(converted.day).toBe(original.day);
    });

    it('should round-trip correctly for end of month', () => {
      const original = createDate('ISLAMIC', 1445, 1, 30);
      const jdn = IslamicCalendar.toJDN(original);
      const converted = IslamicCalendar.fromJDN(jdn);

      expect(converted.year).toBe(original.year);
      expect(converted.month).toBe(original.month);
      expect(converted.day).toBe(original.day);
    });

    it('should round-trip correctly for month 12', () => {
      const original = createDate('ISLAMIC', 1445, 12, 15);
      const jdn = IslamicCalendar.toJDN(original);
      const converted = IslamicCalendar.fromJDN(jdn);

      expect(converted.year).toBe(original.year);
      expect(converted.month).toBe(original.month);
      expect(converted.day).toBe(original.day);
    });
  });

  describe('isLeapYear', () => {
    it('should identify leap years in the 30-year cycle', () => {
      // In a 30-year cycle, years 2, 5, 7, 10, 13, 16, 18, 21, 24, 26, and 29 are leap years
      const leapYearsInCycle = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29];

      leapYearsInCycle.forEach(yearInCycle => {
        // Test in first cycle
        expect(IslamicCalendar.isLeapYear(yearInCycle)).toBe(true);
        // Test in second cycle (30 + yearInCycle)
        expect(IslamicCalendar.isLeapYear(30 + yearInCycle)).toBe(true);
        // Test in third cycle (60 + yearInCycle)
        expect(IslamicCalendar.isLeapYear(60 + yearInCycle)).toBe(true);
      });
    });

    it('should identify non-leap years in the 30-year cycle', () => {
      const nonLeapYearsInCycle = [1, 3, 4, 6, 8, 9, 11, 12, 14, 15, 17, 19, 20, 22, 23, 25, 27, 28, 30];

      nonLeapYearsInCycle.forEach(yearInCycle => {
        expect(IslamicCalendar.isLeapYear(yearInCycle)).toBe(false);
      });
    });

    it('should return false for year 1', () => {
      expect(IslamicCalendar.isLeapYear(1)).toBe(false);
    });

    it('should return true for year 2 (first leap year)', () => {
      expect(IslamicCalendar.isLeapYear(2)).toBe(true);
    });

    it('should handle year 1445 correctly', () => {
      const isLeap = IslamicCalendar.isLeapYear(1445);
      const expectedCycleYear = 1445 % 30; // = 25
      expect(isLeap).toBe([2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29].includes(expectedCycleYear));
    });

    it('should be consistent across multiple calls', () => {
      const year = 1445;
      const result1 = IslamicCalendar.isLeapYear(year);
      const result2 = IslamicCalendar.isLeapYear(year);
      expect(result1).toBe(result2);
    });
  });

  describe('daysInMonth', () => {
    it('should return 30 for odd months (1, 3, 5, 7, 9, 11)', () => {
      const oddMonths = [1, 3, 5, 7, 9, 11];
      oddMonths.forEach(month => {
        expect(IslamicCalendar.daysInMonth(1445, month)).toBe(30);
      });
    });

    it('should return 29 for even months (2, 4, 6, 8, 10)', () => {
      const evenMonths = [2, 4, 6, 8, 10];
      evenMonths.forEach(month => {
        expect(IslamicCalendar.daysInMonth(1445, month)).toBe(29);
      });
    });

    it('should return 29 for month 12 in non-leap years', () => {
      // Year 1 is not a leap year
      expect(IslamicCalendar.daysInMonth(1, 12)).toBe(29);
    });

    it('should return 30 for month 12 in leap years', () => {
      // Year 2 is a leap year
      expect(IslamicCalendar.daysInMonth(2, 12)).toBe(30);
      // Year 5 is a leap year
      expect(IslamicCalendar.daysInMonth(5, 12)).toBe(30);
    });

    it('should handle month 12 correctly based on leap year cycle', () => {
      // Test for a known non-leap year
      const nonLeapYear = 1; // Year 1 % 30 = 1, not in leap year list
      expect(IslamicCalendar.daysInMonth(nonLeapYear, 12)).toBe(29);

      // Test for a known leap year
      const leapYear = 2; // Year 2 % 30 = 2, in leap year list
      expect(IslamicCalendar.daysInMonth(leapYear, 12)).toBe(30);
    });

    it('should throw error for invalid month (0)', () => {
      expect(() => IslamicCalendar.daysInMonth(1445, 0)).toThrow('Invalid month: 0');
    });

    it('should throw error for invalid month (13)', () => {
      expect(() => IslamicCalendar.daysInMonth(1445, 13)).toThrow('Invalid month: 13');
    });

    it('should throw error for invalid month (-1)', () => {
      expect(() => IslamicCalendar.daysInMonth(1445, -1)).toThrow('Invalid month: -1');
    });

    it('should work for all valid months (1-12)', () => {
      for (let month = 1; month <= 12; month++) {
        const days = IslamicCalendar.daysInMonth(1445, month);
        expect(days).toBeGreaterThanOrEqual(29);
        expect(days).toBeLessThanOrEqual(30);
      }
    });
  });

  describe('dayOfWeek', () => {
    it('should return a valid day of week (0-6)', () => {
      const date = createDate('ISLAMIC', 1445, 7, 4);
      const dow = IslamicCalendar.dayOfWeek(date);
      expect(dow).toBeGreaterThanOrEqual(0);
      expect(dow).toBeLessThanOrEqual(6);
    });

    it('should be consistent for the same date', () => {
      const date = createDate('ISLAMIC', 1445, 1, 1);
      const dow1 = IslamicCalendar.dayOfWeek(date);
      const dow2 = IslamicCalendar.dayOfWeek(date);
      expect(dow1).toBe(dow2);
    });

    it('should increment by 1 (mod 7) for successive days', () => {
      const date1 = createDate('ISLAMIC', 1445, 1, 1);
      const date2 = createDate('ISLAMIC', 1445, 1, 2);

      const dow1 = IslamicCalendar.dayOfWeek(date1);
      const dow2 = IslamicCalendar.dayOfWeek(date2);

      expect(dow2).toBe((dow1 + 1) % 7);
    });

    it('should work for different months', () => {
      for (let month = 1; month <= 12; month++) {
        const date = createDate('ISLAMIC', 1445, month, 1);
        const dow = IslamicCalendar.dayOfWeek(date);
        expect(dow).toBeGreaterThanOrEqual(0);
        expect(dow).toBeLessThanOrEqual(6);
      }
    });

    it('should work for year 1', () => {
      const date = createDate('ISLAMIC', 1, 1, 1);
      const dow = IslamicCalendar.dayOfWeek(date);
      expect(dow).toBeGreaterThanOrEqual(0);
      expect(dow).toBeLessThanOrEqual(6);
    });
  });

  describe('CalendarOperations interface', () => {
    it('should have all required operations', () => {
      expect(IslamicCalendar.toJDN).toBeDefined();
      expect(IslamicCalendar.fromJDN).toBeDefined();
      expect(IslamicCalendar.daysInMonth).toBeDefined();
      expect(IslamicCalendar.isLeapYear).toBeDefined();
      expect(IslamicCalendar.dayOfWeek).toBeDefined();
    });

    it('should have functions as values', () => {
      expect(typeof IslamicCalendar.toJDN).toBe('function');
      expect(typeof IslamicCalendar.fromJDN).toBe('function');
      expect(typeof IslamicCalendar.daysInMonth).toBe('function');
      expect(typeof IslamicCalendar.isLeapYear).toBe('function');
      expect(typeof IslamicCalendar.dayOfWeek).toBe('function');
    });
  });
});
