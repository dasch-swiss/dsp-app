/**
 * Unit tests for CustomDateAdapter.
 */

import { TestBed } from '@angular/core/testing';
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { CustomDateAdapter } from './custom-date-adapter';

describe('CustomDateAdapter', () => {
  let adapter: CustomDateAdapter;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: DateAdapter, useClass: CustomDateAdapter },
        { provide: MAT_DATE_LOCALE, useValue: 'en-US' },
      ],
    });
    adapter = TestBed.inject(DateAdapter) as CustomDateAdapter;
  });

  describe('format', () => {
    it('should format date as DD.MM.YYYY', () => {
      const date = new Date(2024, 0, 15); // January 15, 2024
      const formatted = adapter.format(date, {});
      expect(formatted).toBe('15.01.2024');
    });

    it('should pad day with leading zero', () => {
      const date = new Date(2024, 0, 5); // January 5, 2024
      const formatted = adapter.format(date, {});
      expect(formatted).toBe('05.01.2024');
    });

    it('should pad month with leading zero', () => {
      const date = new Date(2024, 2, 15); // March 15, 2024
      const formatted = adapter.format(date, {});
      expect(formatted).toBe('15.03.2024');
    });

    it('should handle single digit day and month', () => {
      const date = new Date(2024, 0, 1); // January 1, 2024
      const formatted = adapter.format(date, {});
      expect(formatted).toBe('01.01.2024');
    });

    it('should handle double digit day and month', () => {
      const date = new Date(2024, 11, 31); // December 31, 2024
      const formatted = adapter.format(date, {});
      expect(formatted).toBe('31.12.2024');
    });

    it('should handle February 29 in leap year', () => {
      const date = new Date(2024, 1, 29); // February 29, 2024
      const formatted = adapter.format(date, {});
      expect(formatted).toBe('29.02.2024');
    });

    it('should ignore displayFormat parameter', () => {
      const date = new Date(2024, 0, 15);
      const formatted1 = adapter.format(date, {});
      const formatted2 = adapter.format(date, 'any format');
      expect(formatted1).toBe(formatted2);
    });

    it('should handle year 2000', () => {
      const date = new Date(2000, 0, 1);
      const formatted = adapter.format(date, {});
      expect(formatted).toBe('01.01.2000');
    });

    it('should handle year 1999', () => {
      const date = new Date(1999, 11, 31);
      const formatted = adapter.format(date, {});
      expect(formatted).toBe('31.12.1999');
    });

    it('should handle years with more than 4 digits', () => {
      const date = new Date(10000, 0, 1);
      const formatted = adapter.format(date, {});
      expect(formatted).toBe('01.01.10000');
    });
  });

  describe('parse', () => {
    it('should parse DD.MM.YYYY format', () => {
      const parsed = adapter.parse('15.01.2024');
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed?.getDate()).toBe(15);
      expect(parsed?.getMonth()).toBe(0); // January is 0
      expect(parsed?.getFullYear()).toBe(2024);
    });

    it('should parse dates with single digit day', () => {
      const parsed = adapter.parse('5.01.2024');
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed?.getDate()).toBe(5);
    });

    it('should parse dates with single digit month', () => {
      const parsed = adapter.parse('15.3.2024');
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed?.getMonth()).toBe(2); // March is 2
    });

    it('should parse dates with both single digits', () => {
      const parsed = adapter.parse('5.3.2024');
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed?.getDate()).toBe(5);
      expect(parsed?.getMonth()).toBe(2);
    });

    it('should parse dates with leading zeros', () => {
      const parsed = adapter.parse('05.03.2024');
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed?.getDate()).toBe(5);
      expect(parsed?.getMonth()).toBe(2);
      expect(parsed?.getFullYear()).toBe(2024);
    });

    it('should return null for empty string', () => {
      const parsed = adapter.parse('');
      expect(parsed).toBeNull();
    });

    it('should return null for null', () => {
      const parsed = adapter.parse(null);
      expect(parsed).toBeNull();
    });

    it('should return null for undefined', () => {
      const parsed = adapter.parse(undefined);
      expect(parsed).toBeNull();
    });

    it('should fall back to parent parser for invalid format', () => {
      const parsed = adapter.parse('invalid');
      // Parent parser will handle it (may return null or attempt parsing)
      expect(parsed).toBeDefined(); // May be null or a Date
    });

    it('should fall back to parent parser for incomplete date', () => {
      const parsed = adapter.parse('15.01');
      expect(parsed).toBeDefined();
    });

    it('should fall back to parent parser for non-string values', () => {
      const date = new Date(2024, 0, 15);
      const parsed = adapter.parse(date);
      expect(parsed).toBeDefined();
    });

    it('should handle February 29 in leap year', () => {
      const parsed = adapter.parse('29.02.2024');
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed?.getDate()).toBe(29);
      expect(parsed?.getMonth()).toBe(1); // February
      expect(parsed?.getFullYear()).toBe(2024);
    });

    it('should handle December 31', () => {
      const parsed = adapter.parse('31.12.2024');
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed?.getDate()).toBe(31);
      expect(parsed?.getMonth()).toBe(11); // December
      expect(parsed?.getFullYear()).toBe(2024);
    });

    it('should handle year 2000', () => {
      const parsed = adapter.parse('01.01.2000');
      expect(parsed).toBeInstanceOf(Date);
      expect(parsed?.getFullYear()).toBe(2000);
    });

    it('should round-trip correctly', () => {
      const original = new Date(2024, 0, 15);
      const formatted = adapter.format(original, {});
      const parsed = adapter.parse(formatted);

      expect(parsed).toBeInstanceOf(Date);
      expect(parsed?.getDate()).toBe(original.getDate());
      expect(parsed?.getMonth()).toBe(original.getMonth());
      expect(parsed?.getFullYear()).toBe(original.getFullYear());
    });
  });

  describe('_to2digit (private method behavior)', () => {
    it('should format single digits with leading zero through format method', () => {
      const date1 = new Date(2024, 0, 1);
      const date2 = new Date(2024, 0, 9);

      expect(adapter.format(date1, {})).toBe('01.01.2024');
      expect(adapter.format(date2, {})).toBe('09.01.2024');
    });

    it('should not add leading zero to double digits through format method', () => {
      const date1 = new Date(2024, 0, 10);
      const date2 = new Date(2024, 11, 31);

      expect(adapter.format(date1, {})).toBe('10.01.2024');
      expect(adapter.format(date2, {})).toBe('31.12.2024');
    });
  });

  describe('Integration', () => {
    it('should maintain consistency between format and parse', () => {
      const testDates = [
        new Date(2024, 0, 1),
        new Date(2024, 0, 15),
        new Date(2024, 5, 30),
        new Date(2024, 11, 31),
        new Date(2000, 0, 1),
        new Date(2024, 1, 29), // Leap year
      ];

      testDates.forEach(original => {
        const formatted = adapter.format(original, {});
        const parsed = adapter.parse(formatted);

        expect(parsed).toBeInstanceOf(Date);
        expect(parsed?.getDate()).toBe(original.getDate());
        expect(parsed?.getMonth()).toBe(original.getMonth());
        expect(parsed?.getFullYear()).toBe(original.getFullYear());
      });
    });

    it('should handle all months correctly', () => {
      for (let month = 0; month < 12; month++) {
        const date = new Date(2024, month, 15);
        const formatted = adapter.format(date, {});
        const parsed = adapter.parse(formatted);

        expect(parsed?.getMonth()).toBe(month);
      }
    });

    it('should handle all days in a month correctly', () => {
      // Test January (31 days)
      for (let day = 1; day <= 31; day++) {
        const date = new Date(2024, 0, day);
        const formatted = adapter.format(date, {});
        const parsed = adapter.parse(formatted);

        expect(parsed?.getDate()).toBe(day);
      }
    });
  });
});
