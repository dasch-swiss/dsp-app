/**
 * Unit tests for Gregorian calendar operations.
 */

import { createDate } from '../factories/date.factory';
import { GregorianCalendar } from './gregorian.calendar';

describe('GregorianCalendar', () => {
  describe('toJDN', () => {
    it('should convert January 1, 2000 to JDN 2451545', () => {
      const date = createDate('GREGORIAN', 2000, 1, 1);
      expect(GregorianCalendar.toJDN(date)).toBe(2451545);
    });

    it('should convert January 1, 1 CE to JDN 1721424', () => {
      const date = createDate('GREGORIAN', 1, 1, 1);
      expect(GregorianCalendar.toJDN(date)).toBe(1721424);
    });

    it('should convert October 15, 1582 (first day of Gregorian calendar) correctly', () => {
      const date = createDate('GREGORIAN', 1582, 10, 15);
      expect(GregorianCalendar.toJDN(date)).toBe(2299161);
    });

    it('should convert October 4, 1582 (last day of Julian calendar) correctly', () => {
      const date = createDate('GREGORIAN', 1582, 10, 4);
      // This date uses Julian calendar calculation
      expect(GregorianCalendar.toJDN(date)).toBe(2299160);
    });

    it('should handle BCE dates correctly', () => {
      const date = createDate('GREGORIAN', -44, 3, 15, 'BCE'); // Ides of March, 44 BCE
      expect(GregorianCalendar.toJDN(date)).toBe(1705061);
    });

    it('should handle year 0 (1 BCE) correctly', () => {
      const date = createDate('GREGORIAN', 0, 1, 1);
      expect(GregorianCalendar.toJDN(date)).toBe(1721058);
    });

    it('should handle December 31 correctly', () => {
      const date = createDate('GREGORIAN', 2000, 12, 31);
      expect(GregorianCalendar.toJDN(date)).toBe(2451910);
    });

    it('should handle leap year February 29 correctly', () => {
      const date = createDate('GREGORIAN', 2000, 2, 29);
      expect(GregorianCalendar.toJDN(date)).toBe(2451604);
    });

    it('should use month 1 as default when month is undefined', () => {
      const date = { ...createDate('GREGORIAN', 2000), month: undefined };
      const result = GregorianCalendar.toJDN(date);
      const expected = GregorianCalendar.toJDN(createDate('GREGORIAN', 2000, 1, 1));
      expect(result).toBe(expected);
    });

    it('should use day 1 as default when day is undefined', () => {
      const date = { ...createDate('GREGORIAN', 2000, 3), day: undefined };
      const result = GregorianCalendar.toJDN(date);
      const expected = GregorianCalendar.toJDN(createDate('GREGORIAN', 2000, 3, 1));
      expect(result).toBe(expected);
    });
  });

  describe('toJDN/fromJDN round trip (DEV-7264)', () => {
    // The two functions must agree about which calendar a JDN represents. `toJDN` encodes dates
    // before 15 Oct 1582 with the Julian rule; `fromJDN` applied the Gregorian correction
    // unconditionally, so the pair was not invertible and the day drifted by up to 10.
    const CASES: Array<[string, number, number, number]> = [
      ['moon landing', 1969, 7, 20],
      ['first Gregorian day', 1582, 10, 15],
      ['last Julian day', 1582, 10, 4],
      ['Columbus reaches America', 1492, 10, 12],
      ['Magna Carta', 1215, 6, 15],
      ['Charlemagne crowned', 800, 12, 25],
      ['Ides of March, 44 BCE', -43, 3, 15],
    ];

    it.each(CASES)('round-trips %s', (_label, year, month, day) => {
      const input = createDate('GREGORIAN', year, month, day);
      const result = GregorianCalendar.fromJDN(GregorianCalendar.toJDN(input));

      expect(result.year).toBe(year);
      expect(result.month).toBe(month);
      expect(result.day).toBe(day);
    });

    it('round-trips every JDN across the 1582 boundary', () => {
      // Sweep a window spanning the reform so a regression on either side is caught.
      const failures: number[] = [];
      for (let jdn = 2299100; jdn <= 2299220; jdn++) {
        if (GregorianCalendar.toJDN(GregorianCalendar.fromJDN(jdn)) !== jdn) failures.push(jdn);
      }
      expect(failures).toEqual([]);
    });

    it('maps the ten days the reform skipped forward rather than round-tripping them', () => {
      // 5-14 October 1582 never existed: 4 Oct was followed directly by 15 Oct. Dates in that gap
      // are not expected to survive a round trip, and must not be mistaken for a regression.
      const result = GregorianCalendar.fromJDN(GregorianCalendar.toJDN(createDate('GREGORIAN', 1582, 10, 5)));

      expect(result.year).toBe(1582);
      expect(result.month).toBe(10);
      expect(result.day).toBe(15);
    });
  });

  describe('fromJDN', () => {
    it('should convert JDN 2451545 to January 1, 2000', () => {
      const result = GregorianCalendar.fromJDN(2451545);
      expect(result.calendar).toBe('GREGORIAN');
      expect(result.year).toBe(2000);
      expect(result.month).toBe(1);
      expect(result.day).toBe(1);
      expect(result.era).toBe('CE');
    });

    it('should convert JDN 1721424 to January 1, 1 CE', () => {
      // 1721424, not 1721426: `toJDN(1 Jan 1 CE)` returns 1721424, and before DEV-7264 this
      // assertion passed only because `fromJDN` decoded pre-1582 dates with the wrong rule.
      const result = GregorianCalendar.fromJDN(1721424);
      expect(result.year).toBe(1);
      expect(result.month).toBe(1);
      expect(result.day).toBe(1);
      expect(result.era).toBe('CE');
    });

    it('should convert JDN 2299161 to October 15, 1582', () => {
      const result = GregorianCalendar.fromJDN(2299161);
      expect(result.year).toBe(1582);
      expect(result.month).toBe(10);
      expect(result.day).toBe(15);
    });

    it('should handle BCE dates correctly', () => {
      const result = GregorianCalendar.fromJDN(1705061);
      expect(result.year).toBe(-44);
      expect(result.era).toBe('BCE');
    });

    it('should set era to CE for positive years', () => {
      const result = GregorianCalendar.fromJDN(2451545);
      expect(result.era).toBe('CE');
    });

    it('should set era to BCE for negative years', () => {
      // Era follows the sign of the astronomical year, matching `createDate`'s documented default
      // (`year >= 0 ? 'CE' : 'BCE'`). Year 0 is therefore CE by that rule even though it is 1 BCE
      // historically, so this needs a genuinely negative year to exercise the BCE branch.
      const result = GregorianCalendar.fromJDN(1705426); // 15 March, year -43
      expect(result.year).toBeLessThan(0);
      expect(result.era).toBe('BCE');
    });

    it('should round-trip correctly', () => {
      const original = createDate('GREGORIAN', 2024, 3, 15);
      const jdn = GregorianCalendar.toJDN(original);
      const converted = GregorianCalendar.fromJDN(jdn);
      expect(converted.year).toBe(original.year);
      expect(converted.month).toBe(original.month);
      expect(converted.day).toBe(original.day);
    });
  });

  describe('isLeapYear', () => {
    it('should return true for years divisible by 4', () => {
      expect(GregorianCalendar.isLeapYear(2024)).toBe(true);
      expect(GregorianCalendar.isLeapYear(2020)).toBe(true);
      expect(GregorianCalendar.isLeapYear(2004)).toBe(true);
    });

    it('should return false for years not divisible by 4', () => {
      expect(GregorianCalendar.isLeapYear(2023)).toBe(false);
      expect(GregorianCalendar.isLeapYear(2021)).toBe(false);
      expect(GregorianCalendar.isLeapYear(2019)).toBe(false);
    });

    it('should return false for years divisible by 100 but not 400', () => {
      expect(GregorianCalendar.isLeapYear(1900)).toBe(false);
      expect(GregorianCalendar.isLeapYear(1800)).toBe(false);
      expect(GregorianCalendar.isLeapYear(1700)).toBe(false);
    });

    it('should return true for years divisible by 400', () => {
      expect(GregorianCalendar.isLeapYear(2000)).toBe(true);
      expect(GregorianCalendar.isLeapYear(2400)).toBe(true);
      expect(GregorianCalendar.isLeapYear(1600)).toBe(true);
    });

    it('should handle negative years (BCE) correctly', () => {
      expect(GregorianCalendar.isLeapYear(-4)).toBe(true); // 5 BCE
      expect(GregorianCalendar.isLeapYear(-1)).toBe(false); // 2 BCE
    });

    it('should handle year 0 (1 BCE) correctly', () => {
      expect(GregorianCalendar.isLeapYear(0)).toBe(true);
    });
  });

  describe('daysInMonth', () => {
    it('should return 31 for January', () => {
      expect(GregorianCalendar.daysInMonth(2024, 1)).toBe(31);
    });

    it('should return 28 for February in non-leap years', () => {
      expect(GregorianCalendar.daysInMonth(2023, 2)).toBe(28);
      expect(GregorianCalendar.daysInMonth(2021, 2)).toBe(28);
      expect(GregorianCalendar.daysInMonth(1900, 2)).toBe(28);
    });

    it('should return 29 for February in leap years', () => {
      expect(GregorianCalendar.daysInMonth(2024, 2)).toBe(29);
      expect(GregorianCalendar.daysInMonth(2020, 2)).toBe(29);
      expect(GregorianCalendar.daysInMonth(2000, 2)).toBe(29);
    });

    it('should return 31 for March', () => {
      expect(GregorianCalendar.daysInMonth(2024, 3)).toBe(31);
    });

    it('should return 30 for April', () => {
      expect(GregorianCalendar.daysInMonth(2024, 4)).toBe(30);
    });

    it('should return 31 for May', () => {
      expect(GregorianCalendar.daysInMonth(2024, 5)).toBe(31);
    });

    it('should return 30 for June', () => {
      expect(GregorianCalendar.daysInMonth(2024, 6)).toBe(30);
    });

    it('should return 31 for July', () => {
      expect(GregorianCalendar.daysInMonth(2024, 7)).toBe(31);
    });

    it('should return 31 for August', () => {
      expect(GregorianCalendar.daysInMonth(2024, 8)).toBe(31);
    });

    it('should return 30 for September', () => {
      expect(GregorianCalendar.daysInMonth(2024, 9)).toBe(30);
    });

    it('should return 31 for October', () => {
      expect(GregorianCalendar.daysInMonth(2024, 10)).toBe(31);
    });

    it('should return 30 for November', () => {
      expect(GregorianCalendar.daysInMonth(2024, 11)).toBe(30);
    });

    it('should return 31 for December', () => {
      expect(GregorianCalendar.daysInMonth(2024, 12)).toBe(31);
    });

    it('should throw error for invalid month (0)', () => {
      expect(() => GregorianCalendar.daysInMonth(2024, 0)).toThrow('Invalid month: 0');
    });

    it('should throw error for invalid month (13)', () => {
      expect(() => GregorianCalendar.daysInMonth(2024, 13)).toThrow('Invalid month: 13');
    });

    it('should throw error for invalid month (-1)', () => {
      expect(() => GregorianCalendar.daysInMonth(2024, -1)).toThrow('Invalid month: -1');
    });
  });

  describe('dayOfWeek', () => {
    it('should return 1 (Monday) for January 1, 2024', () => {
      const date = createDate('GREGORIAN', 2024, 1, 1);
      expect(GregorianCalendar.dayOfWeek(date)).toBe(1);
    });

    it('should return 0 (Sunday) for January 7, 2024', () => {
      const date = createDate('GREGORIAN', 2024, 1, 7);
      expect(GregorianCalendar.dayOfWeek(date)).toBe(0);
    });

    it('should return 6 (Saturday) for January 6, 2024', () => {
      const date = createDate('GREGORIAN', 2024, 1, 6);
      expect(GregorianCalendar.dayOfWeek(date)).toBe(6);
    });

    it('should return 5 (Friday) for March 15, 2024', () => {
      const date = createDate('GREGORIAN', 2024, 3, 15);
      expect(GregorianCalendar.dayOfWeek(date)).toBe(5);
    });

    it('should handle year 2000 dates correctly', () => {
      const date = createDate('GREGORIAN', 2000, 1, 1); // Saturday
      expect(GregorianCalendar.dayOfWeek(date)).toBe(6);
    });

    it('should handle BCE dates correctly', () => {
      const date = createDate('GREGORIAN', -44, 3, 15, 'BCE');
      // Just verify it returns a valid day (0-6)
      const dow = GregorianCalendar.dayOfWeek(date);
      expect(dow).toBeGreaterThanOrEqual(0);
      expect(dow).toBeLessThanOrEqual(6);
    });

    it('should return consistent results for the same date', () => {
      const date = createDate('GREGORIAN', 2024, 6, 15);
      const dow1 = GregorianCalendar.dayOfWeek(date);
      const dow2 = GregorianCalendar.dayOfWeek(date);
      expect(dow1).toBe(dow2);
    });
  });

  describe('CalendarOperations interface', () => {
    it('should have all required operations', () => {
      expect(GregorianCalendar.toJDN).toBeDefined();
      expect(GregorianCalendar.fromJDN).toBeDefined();
      expect(GregorianCalendar.daysInMonth).toBeDefined();
      expect(GregorianCalendar.isLeapYear).toBeDefined();
      expect(GregorianCalendar.dayOfWeek).toBeDefined();
    });

    it('should have functions as values', () => {
      expect(typeof GregorianCalendar.toJDN).toBe('function');
      expect(typeof GregorianCalendar.fromJDN).toBe('function');
      expect(typeof GregorianCalendar.daysInMonth).toBe('function');
      expect(typeof GregorianCalendar.isLeapYear).toBe('function');
      expect(typeof GregorianCalendar.dayOfWeek).toBe('function');
    });
  });
});
