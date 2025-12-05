/**
 * Unit tests for calendar conversion functions.
 */

import { createDate } from '../factories/date.factory';
import { CalendarError } from '../types/calendar.types';
import { compareDates, convertCalendar, isAfter, isBefore, isEqual, validatePeriod } from './calendar.converter';

describe('CalendarConverter', () => {
  describe('convertCalendar', () => {
    it('should return the same date if already in target calendar', () => {
      const date = createDate('GREGORIAN', 2024, 1, 15);
      const result = convertCalendar(date, 'GREGORIAN');
      expect(result).toEqual(date);
    });

    it('should convert from Gregorian to Julian', () => {
      const gregorian = createDate('GREGORIAN', 2024, 1, 15);
      const julian = convertCalendar(gregorian, 'JULIAN');

      expect(julian.calendar).toBe('JULIAN');
      expect(julian.year).toBe(2024);
      expect(julian.month).toBe(1);
      expect(julian.day).toBe(2); // 13-day difference in modern times
    });

    it('should convert from Julian to Gregorian', () => {
      const julian = createDate('JULIAN', 2024, 1, 2);
      const gregorian = convertCalendar(julian, 'GREGORIAN');

      expect(gregorian.calendar).toBe('GREGORIAN');
      expect(gregorian.year).toBe(2024);
      expect(gregorian.month).toBe(1);
      expect(gregorian.day).toBe(15);
    });

    it('should convert from Gregorian to Islamic', () => {
      const gregorian = createDate('GREGORIAN', 2024, 1, 15);
      const islamic = convertCalendar(gregorian, 'ISLAMIC');

      expect(islamic.calendar).toBe('ISLAMIC');
      expect(islamic.era).toBe('NONE');
      expect(islamic.year).toBeGreaterThan(1400); // Islamic year should be in the 1400s
    });

    it('should convert from Islamic to Gregorian', () => {
      const islamic = createDate('ISLAMIC', 1445, 7, 4);
      const gregorian = convertCalendar(islamic, 'GREGORIAN');

      expect(gregorian.calendar).toBe('GREGORIAN');
      expect(gregorian.era).toBe('CE');
      expect(gregorian.year).toBe(2024);
    });

    it('should convert from Julian to Islamic', () => {
      const julian = createDate('JULIAN', 2024, 1, 2);
      const islamic = convertCalendar(julian, 'ISLAMIC');

      expect(islamic.calendar).toBe('ISLAMIC');
      expect(islamic.era).toBe('NONE');
      expect(islamic.year).toBeGreaterThan(1400);
    });

    it('should preserve precision when converting', () => {
      const gregorian = createDate('GREGORIAN', 2024, 1, 15);
      const julian = convertCalendar(gregorian, 'JULIAN');
      expect(julian.precision).toBe('DAY');
    });

    it('should preserve year-only precision', () => {
      const gregorian = createDate('GREGORIAN', 2024);
      const julian = convertCalendar(gregorian, 'JULIAN');
      expect(julian.precision).toBe('YEAR');
    });

    it('should preserve month precision', () => {
      const gregorian = createDate('GREGORIAN', 2024, 1);
      const julian = convertCalendar(gregorian, 'JULIAN');
      expect(julian.precision).toBe('MONTH');
    });

    it('should set era to NONE for Islamic calendar', () => {
      const gregorian = createDate('GREGORIAN', 2024, 1, 15);
      const islamic = convertCalendar(gregorian, 'ISLAMIC');
      expect(islamic.era).toBe('NONE');
    });

    it('should round-trip from Gregorian to Julian and back', () => {
      const original = createDate('GREGORIAN', 2024, 3, 15);
      const julian = convertCalendar(original, 'JULIAN');
      const backToGregorian = convertCalendar(julian, 'GREGORIAN');

      expect(backToGregorian.year).toBe(original.year);
      expect(backToGregorian.month).toBe(original.month);
      expect(backToGregorian.day).toBe(original.day);
    });

    it('should round-trip from Gregorian to Islamic and back', () => {
      const original = createDate('GREGORIAN', 2024, 3, 15);
      const islamic = convertCalendar(original, 'ISLAMIC');
      const backToGregorian = convertCalendar(islamic, 'GREGORIAN');

      expect(backToGregorian.year).toBe(original.year);
      expect(backToGregorian.month).toBe(original.month);
      expect(backToGregorian.day).toBe(original.day);
    });
  });

  describe('compareDates', () => {
    it('should return 0 for equal dates in the same calendar', () => {
      const date1 = createDate('GREGORIAN', 2024, 1, 15);
      const date2 = createDate('GREGORIAN', 2024, 1, 15);
      expect(compareDates(date1, date2)).toBe(0);
    });

    it('should return negative number when first date is before second', () => {
      const earlier = createDate('GREGORIAN', 2024, 1, 15);
      const later = createDate('GREGORIAN', 2024, 2, 20);
      expect(compareDates(earlier, later)).toBeLessThan(0);
    });

    it('should return positive number when first date is after second', () => {
      const later = createDate('GREGORIAN', 2024, 2, 20);
      const earlier = createDate('GREGORIAN', 2024, 1, 15);
      expect(compareDates(later, earlier)).toBeGreaterThan(0);
    });

    it('should compare dates in different calendars', () => {
      const gregorian = createDate('GREGORIAN', 2024, 1, 15);
      const julian = createDate('JULIAN', 2024, 1, 2); // Same day
      expect(compareDates(gregorian, julian)).toBe(0);
    });

    it('should compare Gregorian and Islamic dates', () => {
      const gregorian = createDate('GREGORIAN', 2024, 1, 15);
      const islamic = convertCalendar(gregorian, 'ISLAMIC');
      expect(compareDates(gregorian, islamic)).toBe(0);
    });

    it('should handle year-only dates', () => {
      const date1 = createDate('GREGORIAN', 2023);
      const date2 = createDate('GREGORIAN', 2024);
      expect(compareDates(date1, date2)).toBeLessThan(0);
    });

    it('should be consistent: if a < b, then b > a', () => {
      const date1 = createDate('GREGORIAN', 2024, 1, 15);
      const date2 = createDate('GREGORIAN', 2024, 2, 20);

      const result1 = compareDates(date1, date2);
      const result2 = compareDates(date2, date1);

      expect(result1).toBeLessThan(0);
      expect(result2).toBeGreaterThan(0);
      expect(result1).toBe(-result2);
    });
  });

  describe('isBefore', () => {
    it('should return true when first date is before second', () => {
      const earlier = createDate('GREGORIAN', 2024, 1, 15);
      const later = createDate('GREGORIAN', 2024, 2, 20);
      expect(isBefore(earlier, later)).toBe(true);
    });

    it('should return false when first date is after second', () => {
      const later = createDate('GREGORIAN', 2024, 2, 20);
      const earlier = createDate('GREGORIAN', 2024, 1, 15);
      expect(isBefore(later, earlier)).toBe(false);
    });

    it('should return false when dates are equal', () => {
      const date1 = createDate('GREGORIAN', 2024, 1, 15);
      const date2 = createDate('GREGORIAN', 2024, 1, 15);
      expect(isBefore(date1, date2)).toBe(false);
    });

    it('should work with different calendars', () => {
      const gregorian = createDate('GREGORIAN', 2024, 1, 15);
      const julian = createDate('JULIAN', 2024, 1, 20); // After Gregorian date
      expect(isBefore(gregorian, julian)).toBe(true);
    });

    it('should work with Islamic calendar', () => {
      const islamic1 = createDate('ISLAMIC', 1445, 1, 1);
      const islamic2 = createDate('ISLAMIC', 1445, 2, 1);
      expect(isBefore(islamic1, islamic2)).toBe(true);
    });
  });

  describe('isAfter', () => {
    it('should return true when first date is after second', () => {
      const later = createDate('GREGORIAN', 2024, 2, 20);
      const earlier = createDate('GREGORIAN', 2024, 1, 15);
      expect(isAfter(later, earlier)).toBe(true);
    });

    it('should return false when first date is before second', () => {
      const earlier = createDate('GREGORIAN', 2024, 1, 15);
      const later = createDate('GREGORIAN', 2024, 2, 20);
      expect(isAfter(earlier, later)).toBe(false);
    });

    it('should return false when dates are equal', () => {
      const date1 = createDate('GREGORIAN', 2024, 1, 15);
      const date2 = createDate('GREGORIAN', 2024, 1, 15);
      expect(isAfter(date1, date2)).toBe(false);
    });

    it('should work with different calendars', () => {
      const gregorian = createDate('GREGORIAN', 2024, 1, 20);
      const julian = createDate('JULIAN', 2024, 1, 2); // Before Gregorian date
      expect(isAfter(gregorian, julian)).toBe(true);
    });

    it('should work with Islamic calendar', () => {
      const islamic1 = createDate('ISLAMIC', 1445, 2, 1);
      const islamic2 = createDate('ISLAMIC', 1445, 1, 1);
      expect(isAfter(islamic1, islamic2)).toBe(true);
    });
  });

  describe('isEqual', () => {
    it('should return true for equal dates in the same calendar', () => {
      const date1 = createDate('GREGORIAN', 2024, 1, 15);
      const date2 = createDate('GREGORIAN', 2024, 1, 15);
      expect(isEqual(date1, date2)).toBe(true);
    });

    it('should return false for different dates', () => {
      const date1 = createDate('GREGORIAN', 2024, 1, 15);
      const date2 = createDate('GREGORIAN', 2024, 2, 20);
      expect(isEqual(date1, date2)).toBe(false);
    });

    it('should return true for equivalent dates in different calendars', () => {
      const gregorian = createDate('GREGORIAN', 2024, 1, 15);
      const julian = createDate('JULIAN', 2024, 1, 2); // Same JDN
      expect(isEqual(gregorian, julian)).toBe(true);
    });

    it('should work with Islamic calendar', () => {
      const islamic = createDate('ISLAMIC', 1445, 7, 4);
      const gregorian = convertCalendar(islamic, 'GREGORIAN');
      expect(isEqual(islamic, gregorian)).toBe(true);
    });

    it('should be symmetric: if a equals b, then b equals a', () => {
      const date1 = createDate('GREGORIAN', 2024, 1, 15);
      const date2 = createDate('GREGORIAN', 2024, 1, 15);
      expect(isEqual(date1, date2)).toBe(isEqual(date2, date1));
    });
  });

  describe('validatePeriod', () => {
    it('should not throw for valid period where start is before end', () => {
      const start = createDate('GREGORIAN', 2024, 1, 1);
      const end = createDate('GREGORIAN', 2024, 12, 31);
      expect(() => validatePeriod(start, end)).not.toThrow();
    });

    it('should not throw when start equals end', () => {
      const start = createDate('GREGORIAN', 2024, 1, 15);
      const end = createDate('GREGORIAN', 2024, 1, 15);
      expect(() => validatePeriod(start, end)).not.toThrow();
    });

    it('should throw CalendarError when start is after end', () => {
      const start = createDate('GREGORIAN', 2024, 12, 31);
      const end = createDate('GREGORIAN', 2024, 1, 1);
      expect(() => validatePeriod(start, end)).toThrow(CalendarError);
      expect(() => validatePeriod(start, end)).toThrow('Period start date must be before or equal to end date');
    });

    it('should throw CalendarError when calendars differ', () => {
      const start = createDate('GREGORIAN', 2024, 1, 1);
      const end = createDate('JULIAN', 2024, 12, 31);
      expect(() => validatePeriod(start, end)).toThrow(CalendarError);
      expect(() => validatePeriod(start, end)).toThrow('Period dates must be in the same calendar');
    });

    it('should work with Julian calendar', () => {
      const start = createDate('JULIAN', 2024, 1, 1);
      const end = createDate('JULIAN', 2024, 12, 31);
      expect(() => validatePeriod(start, end)).not.toThrow();
    });

    it('should work with Islamic calendar', () => {
      const start = createDate('ISLAMIC', 1445, 1, 1);
      const end = createDate('ISLAMIC', 1445, 12, 30);
      expect(() => validatePeriod(start, end)).not.toThrow();
    });

    it('should throw when Islamic start is after end', () => {
      const start = createDate('ISLAMIC', 1445, 12, 30);
      const end = createDate('ISLAMIC', 1445, 1, 1);
      expect(() => validatePeriod(start, end)).toThrow(CalendarError);
    });

    it('should throw when mixing Gregorian and Islamic', () => {
      const start = createDate('GREGORIAN', 2024, 1, 1);
      const end = createDate('ISLAMIC', 1445, 12, 30);
      expect(() => validatePeriod(start, end)).toThrow(CalendarError);
      expect(() => validatePeriod(start, end)).toThrow('Period dates must be in the same calendar');
    });
  });

  describe('Integration tests', () => {
    it('should convert and compare dates consistently', () => {
      const gregorian1 = createDate('GREGORIAN', 2024, 1, 15);
      const gregorian2 = createDate('GREGORIAN', 2024, 2, 20);

      const julian1 = convertCalendar(gregorian1, 'JULIAN');
      const julian2 = convertCalendar(gregorian2, 'JULIAN');

      // Original comparison
      const gregorianComparison = compareDates(gregorian1, gregorian2);
      // Converted comparison
      const julianComparison = compareDates(julian1, julian2);

      // Both comparisons should have the same sign
      expect(Math.sign(gregorianComparison)).toBe(Math.sign(julianComparison));
    });

    it('should handle complex conversion chains', () => {
      const original = createDate('GREGORIAN', 2024, 3, 15);

      // Gregorian -> Julian -> Islamic -> Gregorian
      const julian = convertCalendar(original, 'JULIAN');
      const islamic = convertCalendar(julian, 'ISLAMIC');
      const backToGregorian = convertCalendar(islamic, 'GREGORIAN');

      expect(isEqual(original, backToGregorian)).toBe(true);
    });
  });
});
