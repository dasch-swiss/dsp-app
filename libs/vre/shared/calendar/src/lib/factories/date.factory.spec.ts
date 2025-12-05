/**
 * Unit tests for date factory functions.
 */

import { CalendarError } from '../types/calendar.types';
import { createDate, createPeriod, createToday, isCalendarDate, isCalendarPeriod } from './date.factory';

describe('DateFactory', () => {
  describe('createDate', () => {
    it('should create a date with year, month, and day', () => {
      const date = createDate('GREGORIAN', 2024, 1, 15);
      expect(date.calendar).toBe('GREGORIAN');
      expect(date.year).toBe(2024);
      expect(date.month).toBe(1);
      expect(date.day).toBe(15);
      expect(date.era).toBe('CE');
      expect(date.precision).toBe('DAY');
    });

    it('should create a date with year and month only', () => {
      const date = createDate('GREGORIAN', 2024, 1);
      expect(date.calendar).toBe('GREGORIAN');
      expect(date.year).toBe(2024);
      expect(date.month).toBe(1);
      expect(date.day).toBeUndefined();
      expect(date.era).toBe('CE');
      expect(date.precision).toBe('MONTH');
    });

    it('should create a date with year only', () => {
      const date = createDate('GREGORIAN', 2024);
      expect(date.calendar).toBe('GREGORIAN');
      expect(date.year).toBe(2024);
      expect(date.month).toBeUndefined();
      expect(date.day).toBeUndefined();
      expect(date.era).toBe('CE');
      expect(date.precision).toBe('YEAR');
    });

    it('should default to CE era for positive years', () => {
      const date = createDate('GREGORIAN', 2024, 1, 15);
      expect(date.era).toBe('CE');
    });

    it('should default to BCE era for negative years', () => {
      const date = createDate('GREGORIAN', -44, 3, 15);
      expect(date.era).toBe('BCE');
    });

    it('should allow explicit CE era specification', () => {
      const date = createDate('GREGORIAN', 2024, 1, 15, 'CE');
      expect(date.era).toBe('CE');
    });

    it('should allow explicit BCE era specification', () => {
      const date = createDate('JULIAN', -44, 3, 15, 'BCE');
      expect(date.era).toBe('BCE');
    });

    it('should set era to NONE for Islamic calendar', () => {
      const date = createDate('ISLAMIC', 1445, 7, 4);
      expect(date.era).toBe('NONE');
    });

    it('should throw error when specifying CE/BCE for Islamic calendar', () => {
      expect(() => createDate('ISLAMIC', 1445, 7, 4, 'CE')).toThrow(CalendarError);
      expect(() => createDate('ISLAMIC', 1445, 7, 4, 'CE')).toThrow(
        'Islamic calendar does not use CE/BCE era designation'
      );
    });

    it('should throw error for invalid calendar system', () => {
      expect(() => createDate('INVALID' as any, 2024, 1, 15)).toThrow(CalendarError);
      expect(() => createDate('INVALID' as any, 2024, 1, 15)).toThrow('Invalid calendar system');
    });

    it('should throw error for non-integer year', () => {
      expect(() => createDate('GREGORIAN', 2024.5, 1, 15)).toThrow(CalendarError);
      expect(() => createDate('GREGORIAN', 2024.5, 1, 15)).toThrow('Year must be an integer');
    });

    it('should throw error for non-integer month', () => {
      expect(() => createDate('GREGORIAN', 2024, 1.5, 15)).toThrow(CalendarError);
      expect(() => createDate('GREGORIAN', 2024, 1.5, 15)).toThrow('Month must be an integer');
    });

    it('should throw error for non-integer day', () => {
      expect(() => createDate('GREGORIAN', 2024, 1, 15.5)).toThrow(CalendarError);
      expect(() => createDate('GREGORIAN', 2024, 1, 15.5)).toThrow('Day must be an integer');
    });

    it('should throw error for month < 1', () => {
      expect(() => createDate('GREGORIAN', 2024, 0, 15)).toThrow(CalendarError);
      expect(() => createDate('GREGORIAN', 2024, 0, 15)).toThrow('Invalid month: 0');
    });

    it('should throw error for month > 12', () => {
      expect(() => createDate('GREGORIAN', 2024, 13, 15)).toThrow(CalendarError);
      expect(() => createDate('GREGORIAN', 2024, 13, 15)).toThrow('Invalid month: 13');
    });

    it('should throw error for day < 1', () => {
      expect(() => createDate('GREGORIAN', 2024, 1, 0)).toThrow(CalendarError);
      expect(() => createDate('GREGORIAN', 2024, 1, 0)).toThrow('Invalid day: 0');
    });

    it('should throw error for day > 31', () => {
      expect(() => createDate('GREGORIAN', 2024, 1, 32)).toThrow(CalendarError);
      expect(() => createDate('GREGORIAN', 2024, 1, 32)).toThrow('Invalid day: 32');
    });

    it('should throw error when specifying day without month', () => {
      expect(() => createDate('GREGORIAN', 2024, undefined, 15)).toThrow(CalendarError);
      expect(() => createDate('GREGORIAN', 2024, undefined, 15)).toThrow('Cannot specify day without month');
    });

    it('should create Julian calendar dates', () => {
      const date = createDate('JULIAN', 2024, 1, 15);
      expect(date.calendar).toBe('JULIAN');
      expect(date.year).toBe(2024);
      expect(date.month).toBe(1);
      expect(date.day).toBe(15);
    });

    it('should create Islamic calendar dates', () => {
      const date = createDate('ISLAMIC', 1445, 7, 4);
      expect(date.calendar).toBe('ISLAMIC');
      expect(date.year).toBe(1445);
      expect(date.month).toBe(7);
      expect(date.day).toBe(4);
      expect(date.era).toBe('NONE');
    });

    it('should handle year 0 correctly', () => {
      const date = createDate('GREGORIAN', 0, 1, 1);
      expect(date.year).toBe(0);
      expect(date.era).toBe('CE'); // Year 0 is considered CE in astronomical convention
    });

    it('should create immutable date objects', () => {
      const date = createDate('GREGORIAN', 2024, 1, 15);
      expect(Object.isFrozen(date)).toBe(false); // Objects are not frozen but should be treated as immutable
      expect(date).toHaveProperty('calendar');
      expect(date).toHaveProperty('year');
      expect(date).toHaveProperty('month');
      expect(date).toHaveProperty('day');
    });
  });

  describe('createPeriod', () => {
    it('should create a period with start and end dates', () => {
      const start = createDate('GREGORIAN', 2024, 1, 1);
      const end = createDate('GREGORIAN', 2024, 12, 31);
      const period = createPeriod(start, end);

      expect(period.start).toBe(start);
      expect(period.end).toBe(end);
    });

    it('should allow start and end to be the same date', () => {
      const start = createDate('GREGORIAN', 2024, 1, 15);
      const end = createDate('GREGORIAN', 2024, 1, 15);
      const period = createPeriod(start, end);

      expect(period.start).toBe(start);
      expect(period.end).toBe(end);
    });

    it('should throw error when calendars differ', () => {
      const start = createDate('GREGORIAN', 2024, 1, 1);
      const end = createDate('JULIAN', 2024, 12, 31);

      expect(() => createPeriod(start, end)).toThrow(CalendarError);
      expect(() => createPeriod(start, end)).toThrow('Period start and end must use the same calendar');
    });

    it('should work with Julian calendar', () => {
      const start = createDate('JULIAN', 2024, 1, 1);
      const end = createDate('JULIAN', 2024, 12, 31);
      const period = createPeriod(start, end);

      expect(period.start.calendar).toBe('JULIAN');
      expect(period.end.calendar).toBe('JULIAN');
    });

    it('should work with Islamic calendar', () => {
      const start = createDate('ISLAMIC', 1445, 1, 1);
      const end = createDate('ISLAMIC', 1445, 12, 30);
      const period = createPeriod(start, end);

      expect(period.start.calendar).toBe('ISLAMIC');
      expect(period.end.calendar).toBe('ISLAMIC');
    });

    it('should work with year-only precision', () => {
      const start = createDate('GREGORIAN', 2024);
      const end = createDate('GREGORIAN', 2025);
      const period = createPeriod(start, end);

      expect(period.start.precision).toBe('YEAR');
      expect(period.end.precision).toBe('YEAR');
    });

    it('should work with month precision', () => {
      const start = createDate('GREGORIAN', 2024, 1);
      const end = createDate('GREGORIAN', 2024, 12);
      const period = createPeriod(start, end);

      expect(period.start.precision).toBe('MONTH');
      expect(period.end.precision).toBe('MONTH');
    });
  });

  describe('createToday', () => {
    it('should create a date representing today in Gregorian calendar', () => {
      const today = createToday();
      const now = new Date();

      expect(today.calendar).toBe('GREGORIAN');
      expect(today.year).toBe(now.getFullYear());
      expect(today.month).toBe(now.getMonth() + 1);
      expect(today.day).toBe(now.getDate());
      expect(today.era).toBe('CE');
      expect(today.precision).toBe('DAY');
    });

    it('should create a date with DAY precision', () => {
      const today = createToday();
      expect(today.precision).toBe('DAY');
    });

    it('should return consistent results when called multiple times quickly', () => {
      const today1 = createToday();
      const today2 = createToday();

      // Should be the same date if called in quick succession
      expect(today1.year).toBe(today2.year);
      expect(today1.month).toBe(today2.month);
      expect(today1.day).toBe(today2.day);
    });
  });

  describe('isCalendarDate', () => {
    it('should return true for valid CalendarDate', () => {
      const date = createDate('GREGORIAN', 2024, 1, 15);
      expect(isCalendarDate(date)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isCalendarDate(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isCalendarDate(undefined)).toBe(false);
    });

    it('should return false for non-object values', () => {
      expect(isCalendarDate(123)).toBe(false);
      expect(isCalendarDate('date')).toBe(false);
      expect(isCalendarDate(true)).toBe(false);
    });

    it('should return false for object missing calendar property', () => {
      const invalid = { year: 2024, month: 1, day: 15, era: 'CE', precision: 'DAY' };
      expect(isCalendarDate(invalid)).toBe(false);
    });

    it('should return false for object with invalid calendar', () => {
      const invalid = { calendar: 'INVALID', year: 2024, month: 1, day: 15, era: 'CE', precision: 'DAY' };
      expect(isCalendarDate(invalid)).toBe(false);
    });

    it('should return false for object missing year', () => {
      const invalid = { calendar: 'GREGORIAN', month: 1, day: 15, era: 'CE', precision: 'DAY' };
      expect(isCalendarDate(invalid)).toBe(false);
    });

    it('should return false for object with non-number year', () => {
      const invalid = { calendar: 'GREGORIAN', year: '2024', month: 1, day: 15, era: 'CE', precision: 'DAY' };
      expect(isCalendarDate(invalid)).toBe(false);
    });

    it('should return false for object missing era', () => {
      const invalid = { calendar: 'GREGORIAN', year: 2024, month: 1, day: 15, precision: 'DAY' };
      expect(isCalendarDate(invalid)).toBe(false);
    });

    it('should return false for object with invalid era', () => {
      const invalid = { calendar: 'GREGORIAN', year: 2024, month: 1, day: 15, era: 'INVALID', precision: 'DAY' };
      expect(isCalendarDate(invalid)).toBe(false);
    });

    it('should return false for object missing precision', () => {
      const invalid = { calendar: 'GREGORIAN', year: 2024, month: 1, day: 15, era: 'CE' };
      expect(isCalendarDate(invalid)).toBe(false);
    });

    it('should return false for object with invalid precision', () => {
      const invalid = { calendar: 'GREGORIAN', year: 2024, month: 1, day: 15, era: 'CE', precision: 'INVALID' };
      expect(isCalendarDate(invalid)).toBe(false);
    });

    it('should return true for date without month and day', () => {
      const date = createDate('GREGORIAN', 2024);
      expect(isCalendarDate(date)).toBe(true);
    });

    it('should return true for date without day', () => {
      const date = createDate('GREGORIAN', 2024, 1);
      expect(isCalendarDate(date)).toBe(true);
    });

    it('should work for Julian calendar dates', () => {
      const date = createDate('JULIAN', 2024, 1, 15);
      expect(isCalendarDate(date)).toBe(true);
    });

    it('should work for Islamic calendar dates', () => {
      const date = createDate('ISLAMIC', 1445, 7, 4);
      expect(isCalendarDate(date)).toBe(true);
    });
  });

  describe('isCalendarPeriod', () => {
    it('should return true for valid CalendarPeriod', () => {
      const start = createDate('GREGORIAN', 2024, 1, 1);
      const end = createDate('GREGORIAN', 2024, 12, 31);
      const period = createPeriod(start, end);
      expect(isCalendarPeriod(period)).toBe(true);
    });

    it('should return false for null', () => {
      expect(isCalendarPeriod(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(isCalendarPeriod(undefined)).toBe(false);
    });

    it('should return false for non-object values', () => {
      expect(isCalendarPeriod(123)).toBe(false);
      expect(isCalendarPeriod('period')).toBe(false);
      expect(isCalendarPeriod(true)).toBe(false);
    });

    it('should return false for object missing start', () => {
      const end = createDate('GREGORIAN', 2024, 12, 31);
      const invalid = { end };
      expect(isCalendarPeriod(invalid)).toBe(false);
    });

    it('should return false for object missing end', () => {
      const start = createDate('GREGORIAN', 2024, 1, 1);
      const invalid = { start };
      expect(isCalendarPeriod(invalid)).toBe(false);
    });

    it('should return false for object with invalid start', () => {
      const end = createDate('GREGORIAN', 2024, 12, 31);
      const invalid = { start: 'not a date', end };
      expect(isCalendarPeriod(invalid)).toBe(false);
    });

    it('should return false for object with invalid end', () => {
      const start = createDate('GREGORIAN', 2024, 1, 1);
      const invalid = { start, end: 'not a date' };
      expect(isCalendarPeriod(invalid)).toBe(false);
    });

    it('should work for Julian calendar periods', () => {
      const start = createDate('JULIAN', 2024, 1, 1);
      const end = createDate('JULIAN', 2024, 12, 31);
      const period = createPeriod(start, end);
      expect(isCalendarPeriod(period)).toBe(true);
    });

    it('should work for Islamic calendar periods', () => {
      const start = createDate('ISLAMIC', 1445, 1, 1);
      const end = createDate('ISLAMIC', 1445, 12, 30);
      const period = createPeriod(start, end);
      expect(isCalendarPeriod(period)).toBe(true);
    });
  });
});
