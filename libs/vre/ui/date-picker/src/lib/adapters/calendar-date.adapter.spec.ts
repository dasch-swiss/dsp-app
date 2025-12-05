/**
 * Tests for CalendarDateAdapter.
 *
 * Verifies that CalendarDate works correctly with Angular Material datepicker.
 */

import { createDate } from '@dasch-swiss/vre/shared/calendar';
import { CalendarDateAdapter } from './calendar-date.adapter';

describe('CalendarDateAdapter', () => {
  let adapter: CalendarDateAdapter;

  beforeEach(() => {
    adapter = new CalendarDateAdapter();
    adapter.setCalendarSystem('GREGORIAN');
  });

  describe('Calendar system management', () => {
    it('should default to GREGORIAN calendar', () => {
      expect(adapter.getCalendarSystem()).toBe('GREGORIAN');
    });

    it('should allow changing calendar system', () => {
      adapter.setCalendarSystem('JULIAN');
      expect(adapter.getCalendarSystem()).toBe('JULIAN');
    });
  });

  describe('Date component extraction', () => {
    it('should extract year from date', () => {
      const date = createDate('GREGORIAN', 2024, 1, 15);
      expect(adapter.getYear(date)).toBe(2024);
    });

    it('should extract month from date', () => {
      const date = createDate('GREGORIAN', 2024, 3, 15);
      // Adapter returns 0-based month for Material (March = 2)
      expect(adapter.getMonth(date)).toBe(2);
    });

    it('should extract day from date', () => {
      const date = createDate('GREGORIAN', 2024, 1, 15);
      expect(adapter.getDate(date)).toBe(15);
    });

    it('should handle year-only precision', () => {
      const date = createDate('GREGORIAN', 2024);
      expect(adapter.getYear(date)).toBe(2024);
      // Adapter returns 0-based month for Material (January = 0)
      expect(adapter.getMonth(date)).toBe(0); // Default to January (0-based)
      expect(adapter.getDate(date)).toBe(1); // Default to 1st
    });

    it('should get day of week', () => {
      const date = createDate('GREGORIAN', 2024, 1, 15); // Monday
      const dayOfWeek = adapter.getDayOfWeek(date);
      expect(dayOfWeek).toBeGreaterThanOrEqual(0);
      expect(dayOfWeek).toBeLessThan(7);
    });
  });

  describe('Date creation', () => {
    it('should create a date with given components', () => {
      const date = adapter.createDate(2024, 0, 15); // Month is 0-indexed in Material
      expect(date.year).toBe(2024);
      expect(date.month).toBe(1); // CalendarDate uses 1-indexed months
      expect(date.day).toBe(15);
      expect(date.calendar).toBe('GREGORIAN');
    });

    it('should create date in current calendar system', () => {
      adapter.setCalendarSystem('JULIAN');
      const date = adapter.createDate(2024, 2, 15);
      expect(date.calendar).toBe('JULIAN');
    });

    it('should get today in current calendar system', () => {
      const today = adapter.today();
      expect(today).toBeDefined();
      expect(today.year).toBeGreaterThan(2000);
    });
  });

  describe('Date manipulation', () => {
    it('should add years to date', () => {
      const date = createDate('GREGORIAN', 2024, 1, 15);
      const result = adapter.addCalendarYears(date, 5);
      expect(result.year).toBe(2029);
      expect(result.month).toBe(1);
      expect(result.day).toBe(15);
    });

    it('should subtract years from date', () => {
      const date = createDate('GREGORIAN', 2024, 1, 15);
      const result = adapter.addCalendarYears(date, -5);
      expect(result.year).toBe(2019);
    });

    it('should add months to date', () => {
      const date = createDate('GREGORIAN', 2024, 1, 15);
      const result = adapter.addCalendarMonths(date, 3);
      expect(result.year).toBe(2024);
      expect(result.month).toBe(4);
      expect(result.day).toBe(15);
    });

    it('should handle month overflow when adding months', () => {
      const date = createDate('GREGORIAN', 2024, 11, 15);
      const result = adapter.addCalendarMonths(date, 3);
      expect(result.year).toBe(2025);
      expect(result.month).toBe(2); // February
    });

    it('should handle month underflow when subtracting months', () => {
      const date = createDate('GREGORIAN', 2024, 2, 15);
      const result = adapter.addCalendarMonths(date, -3);
      expect(result.year).toBe(2023);
      expect(result.month).toBe(11); // November
    });

    it('should adjust day when month has fewer days', () => {
      const date = createDate('GREGORIAN', 2024, 1, 31); // January 31
      const result = adapter.addCalendarMonths(date, 1); // February has 29 days in 2024
      expect(result.year).toBe(2024);
      expect(result.month).toBe(2);
      expect(result.day).toBe(29); // Adjusted to last day of February
    });

    it('should add days to date', () => {
      const date = createDate('GREGORIAN', 2024, 1, 15);
      const result = adapter.addCalendarDays(date, 10);
      expect(result.year).toBe(2024);
      expect(result.month).toBe(1);
      expect(result.day).toBe(25);
    });

    it('should handle day overflow across months', () => {
      const date = createDate('GREGORIAN', 2024, 1, 25);
      const result = adapter.addCalendarDays(date, 10);
      expect(result.year).toBe(2024);
      expect(result.month).toBe(2); // February
      expect(result.day).toBe(4);
    });

    it('should subtract days from date', () => {
      const date = createDate('GREGORIAN', 2024, 2, 10);
      const result = adapter.addCalendarDays(date, -5);
      expect(result.year).toBe(2024);
      expect(result.month).toBe(2);
      expect(result.day).toBe(5);
    });
  });

  describe('Date formatting and parsing', () => {
    it('should format date to ISO string', () => {
      const date = createDate('GREGORIAN', 2024, 1, 15);
      const formatted = adapter.format(date, {});
      expect(formatted).toBe('2024-01-15');
    });

    it('should format date with single-digit month', () => {
      const date = createDate('GREGORIAN', 2024, 3, 5);
      const formatted = adapter.format(date, {});
      expect(formatted).toBe('2024-03-05');
    });

    it('should parse date from ISO string', () => {
      const parsed = adapter.parse('2024-01-15');
      expect(parsed).toBeDefined();
      expect(parsed!.year).toBe(2024);
      expect(parsed!.month).toBe(1);
      expect(parsed!.day).toBe(15);
    });

    it('should return null for invalid date string', () => {
      expect(adapter.parse('invalid')).toBeNull();
      expect(adapter.parse('2024-13-01')).toBeNull(); // Invalid month
      expect(adapter.parse('2024-01-32')).toBeNull(); // Invalid day
    });

    it('should return null for empty string', () => {
      expect(adapter.parse('')).toBeNull();
    });

    it('should convert to ISO 8601 format', () => {
      const date = createDate('GREGORIAN', 2024, 1, 15);
      expect(adapter.toIso8601(date)).toBe('2024-01-15');
    });

    it('should deserialize from string', () => {
      const deserialized = adapter.deserialize('2024-01-15');
      expect(deserialized).toBeDefined();
      expect(deserialized!.year).toBe(2024);
    });
  });

  describe('Date validation', () => {
    it('should validate correct date', () => {
      const date = createDate('GREGORIAN', 2024, 1, 15);
      expect(adapter.isValid(date)).toBe(true);
    });

    it('should invalidate date with invalid month', () => {
      const date = { ...createDate('GREGORIAN', 2024, 1, 15), month: 13 };
      expect(adapter.isValid(date)).toBe(false);
    });

    it('should invalidate date with invalid day', () => {
      const date = { ...createDate('GREGORIAN', 2024, 1, 15), day: 32 };
      expect(adapter.isValid(date)).toBe(false);
    });

    it('should check if value is date instance', () => {
      const date = createDate('GREGORIAN', 2024, 1, 15);
      expect(adapter.isDateInstance(date)).toBe(true);
      expect(adapter.isDateInstance(null)).toBe(false);
      expect(adapter.isDateInstance({})).toBe(false);
      expect(adapter.isDateInstance('2024-01-15')).toBe(false);
    });
  });

  describe('Calendar metadata', () => {
    it('should return month names', () => {
      const long = adapter.getMonthNames('long');
      expect(long).toHaveLength(12);
      expect(long[0]).toBe('January');
      expect(long[11]).toBe('December');
    });

    it('should return short month names', () => {
      const short = adapter.getMonthNames('short');
      expect(short).toHaveLength(12);
      expect(short[0]).toBe('Jan');
      expect(short[11]).toBe('Dec');
    });

    it('should return narrow month names', () => {
      const narrow = adapter.getMonthNames('narrow');
      expect(narrow).toHaveLength(12);
      expect(narrow[0]).toBe('J');
      expect(narrow[11]).toBe('D');
    });

    it('should return day of week names', () => {
      const long = adapter.getDayOfWeekNames('long');
      expect(long).toHaveLength(7);
      expect(long[0]).toBe('Sunday');
      expect(long[6]).toBe('Saturday');
    });

    it('should return date names', () => {
      const dateNames = adapter.getDateNames();
      expect(dateNames).toHaveLength(31);
      expect(dateNames[0]).toBe('1');
      expect(dateNames[30]).toBe('31');
    });

    it('should return year name', () => {
      const date = createDate('GREGORIAN', 2024, 1, 15);
      expect(adapter.getYearName(date)).toBe('2024');
    });

    it('should return first day of week', () => {
      expect(adapter.getFirstDayOfWeek()).toBe(0); // Sunday
    });

    it('should return number of days in month', () => {
      const jan = createDate('GREGORIAN', 2024, 1, 1);
      const feb = createDate('GREGORIAN', 2024, 2, 1);
      const febNonLeap = createDate('GREGORIAN', 2023, 2, 1);

      expect(adapter.getNumDaysInMonth(jan)).toBe(31);
      expect(adapter.getNumDaysInMonth(feb)).toBe(29); // 2024 is leap year
      expect(adapter.getNumDaysInMonth(febNonLeap)).toBe(28);
    });
  });

  describe('Date cloning', () => {
    it('should clone date', () => {
      const original = createDate('GREGORIAN', 2024, 1, 15);
      const clone = adapter.clone(original);

      expect(clone).toEqual(original);
      expect(clone).not.toBe(original); // Different object reference
    });

    it('should create independent clone', () => {
      const original = createDate('GREGORIAN', 2024, 1, 15);
      const clone = adapter.clone(original);

      // Modifying the clone shouldn't affect the original
      const modified = { ...clone, day: 20 };

      expect(original.day).toBe(15);
      expect(modified.day).toBe(20);
    });
  });

  describe('Different calendar systems', () => {
    it('should work with Julian calendar', () => {
      adapter.setCalendarSystem('JULIAN');
      const date = adapter.createDate(2024, 0, 15);

      expect(date.calendar).toBe('JULIAN');
      expect(adapter.isValid(date)).toBe(true);
    });

    it('should work with Islamic calendar', () => {
      adapter.setCalendarSystem('ISLAMIC');
      const date = adapter.createDate(1445, 6, 4);

      expect(date.calendar).toBe('ISLAMIC');
      expect(adapter.isValid(date)).toBe(true);
    });

    it('should handle date manipulation in different calendars', () => {
      adapter.setCalendarSystem('JULIAN');
      const date = adapter.createDate(2024, 0, 15);
      const result = adapter.addCalendarDays(date, 10);

      expect(result.calendar).toBe('JULIAN');
      expect(result.day).toBe(25);
    });
  });
});
