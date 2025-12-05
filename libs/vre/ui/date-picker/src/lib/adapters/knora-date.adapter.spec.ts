/**
 * Tests for KnoraDate adapter.
 *
 * Verifies bidirectional conversion between CalendarDate and KnoraDate.
 */

import { KnoraDate, KnoraPeriod, Precision } from '@dasch-swiss/dsp-js';
import { createDate, createPeriod } from '@dasch-swiss/vre/shared/calendar';
import {
  knoraDateToCalendarDate,
  calendarDateToKnoraDate,
  knoraPeriodToCalendarPeriod,
  calendarPeriodToKnoraPeriod,
  getPrecisionFromCalendarDate,
  isKnoraDate,
  isKnoraPeriod,
} from './knora-date.adapter';

describe('KnoraDate Adapter', () => {
  describe('knoraDateToCalendarDate', () => {
    it('should convert Gregorian KnoraDate to CalendarDate', () => {
      const knoraDate = new KnoraDate('GREGORIAN', 'CE', 2024, 1, 15);
      const calendarDate = knoraDateToCalendarDate(knoraDate);

      expect(calendarDate.calendar).toBe('GREGORIAN');
      expect(calendarDate.year).toBe(2024);
      expect(calendarDate.month).toBe(1);
      expect(calendarDate.day).toBe(15);
      expect(calendarDate.era).toBe('CE');
      expect(calendarDate.precision).toBe('DAY');
    });

    it('should convert Julian KnoraDate to CalendarDate', () => {
      const knoraDate = new KnoraDate('JULIAN', 'CE', 2024, 3, 1);
      const calendarDate = knoraDateToCalendarDate(knoraDate);

      expect(calendarDate.calendar).toBe('JULIAN');
      expect(calendarDate.year).toBe(2024);
      expect(calendarDate.month).toBe(3);
      expect(calendarDate.day).toBe(1);
      expect(calendarDate.era).toBe('CE');
    });

    it('should convert Islamic KnoraDate to CalendarDate with NONE era', () => {
      const knoraDate = new KnoraDate('ISLAMIC', 'noEra', 1445, 7, 4);
      const calendarDate = knoraDateToCalendarDate(knoraDate);

      expect(calendarDate.calendar).toBe('ISLAMIC');
      expect(calendarDate.year).toBe(1445);
      expect(calendarDate.month).toBe(7);
      expect(calendarDate.day).toBe(4);
      expect(calendarDate.era).toBe('NONE');
    });

    it('should convert BCE KnoraDate correctly', () => {
      const knoraDate = new KnoraDate('JULIAN', 'BCE', 44, 3, 15);
      const calendarDate = knoraDateToCalendarDate(knoraDate);

      expect(calendarDate.year).toBe(-44);
      expect(calendarDate.era).toBe('BCE');
    });

    it('should handle AD era as CE', () => {
      const knoraDate = new KnoraDate('GREGORIAN', 'AD', 2024, 1, 1);
      const calendarDate = knoraDateToCalendarDate(knoraDate);

      expect(calendarDate.era).toBe('CE');
    });

    it('should handle lowercase calendar names', () => {
      const knoraDate = new KnoraDate('gregorian', 'CE', 2024, 1, 1);
      const calendarDate = knoraDateToCalendarDate(knoraDate);

      expect(calendarDate.calendar).toBe('GREGORIAN');
    });
  });

  describe('calendarDateToKnoraDate', () => {
    it('should convert CalendarDate to Gregorian KnoraDate', () => {
      const calendarDate = createDate('GREGORIAN', 2024, 1, 15);
      const knoraDate = calendarDateToKnoraDate(calendarDate);

      expect(knoraDate.calendar).toBe('GREGORIAN');
      expect(knoraDate.year).toBe(2024);
      expect(knoraDate.month).toBe(1);
      expect(knoraDate.day).toBe(15);
      expect(knoraDate.era).toBe('CE');
    });

    it('should convert CalendarDate with BCE era', () => {
      const calendarDate = createDate('JULIAN', -44, 3, 15, 'BCE');
      const knoraDate = calendarDateToKnoraDate(calendarDate);

      expect(knoraDate.year).toBe(44); // KnoraDate stores BCE years as positive
      expect(knoraDate.era).toBe('BCE');
    });

    it('should convert Islamic CalendarDate with NONE era to noEra', () => {
      const calendarDate = createDate('ISLAMIC', 1445, 7, 4);
      const knoraDate = calendarDateToKnoraDate(calendarDate);

      expect(knoraDate.calendar).toBe('ISLAMIC');
      expect(knoraDate.era).toBe('noEra');
    });

    it('should handle year-only precision', () => {
      const calendarDate = createDate('GREGORIAN', 2024);
      const knoraDate = calendarDateToKnoraDate(calendarDate);

      expect(knoraDate.year).toBe(2024);
      expect(knoraDate.month).toBeUndefined();
      expect(knoraDate.day).toBeUndefined();
    });

    it('should handle month precision', () => {
      const calendarDate = createDate('GREGORIAN', 2024, 3);
      const knoraDate = calendarDateToKnoraDate(calendarDate);

      expect(knoraDate.year).toBe(2024);
      expect(knoraDate.month).toBe(3);
      expect(knoraDate.day).toBeUndefined();
    });
  });

  describe('Round-trip conversion', () => {
    it('should maintain data integrity through CalendarDate -> KnoraDate -> CalendarDate', () => {
      const original = createDate('GREGORIAN', 2024, 3, 15);
      const knoraDate = calendarDateToKnoraDate(original);
      const converted = knoraDateToCalendarDate(knoraDate);

      expect(converted.calendar).toBe(original.calendar);
      expect(converted.year).toBe(original.year);
      expect(converted.month).toBe(original.month);
      expect(converted.day).toBe(original.day);
      expect(converted.era).toBe(original.era);
      expect(converted.precision).toBe(original.precision);
    });

    it('should maintain data integrity through KnoraDate -> CalendarDate -> KnoraDate', () => {
      const original = new KnoraDate('GREGORIAN', 'CE', 2024, 3, 15);
      const calendarDate = knoraDateToCalendarDate(original);
      const converted = calendarDateToKnoraDate(calendarDate);

      expect(converted.calendar).toBe(original.calendar);
      expect(converted.year).toBe(original.year);
      expect(converted.month).toBe(original.month);
      expect(converted.day).toBe(original.day);
      expect(converted.era).toBe(original.era);
    });

    it('should handle Islamic calendar round-trip with era conversion', () => {
      const original = createDate('ISLAMIC', 1445, 7, 4);
      const knoraDate = calendarDateToKnoraDate(original);
      const converted = knoraDateToCalendarDate(knoraDate);

      expect(converted.calendar).toBe(original.calendar);
      expect(converted.year).toBe(original.year);
      expect(converted.month).toBe(original.month);
      expect(converted.day).toBe(original.day);
      expect(converted.era).toBe('NONE');
      expect(knoraDate.era).toBe('noEra');
    });
  });

  describe('knoraPeriodToCalendarPeriod', () => {
    it('should convert KnoraPeriod to CalendarPeriod', () => {
      const startKnora = new KnoraDate('GREGORIAN', 'CE', 2024, 1, 1);
      const endKnora = new KnoraDate('GREGORIAN', 'CE', 2024, 12, 31);
      const knoraPeriod = new KnoraPeriod(startKnora, endKnora);

      const calendarPeriod = knoraPeriodToCalendarPeriod(knoraPeriod);

      expect(calendarPeriod.start.year).toBe(2024);
      expect(calendarPeriod.start.month).toBe(1);
      expect(calendarPeriod.start.day).toBe(1);
      expect(calendarPeriod.end.year).toBe(2024);
      expect(calendarPeriod.end.month).toBe(12);
      expect(calendarPeriod.end.day).toBe(31);
    });

    it('should handle cross-era periods', () => {
      const startKnora = new KnoraDate('JULIAN', 'BCE', 44, 1, 1);
      const endKnora = new KnoraDate('JULIAN', 'CE', 44, 12, 31);
      const knoraPeriod = new KnoraPeriod(startKnora, endKnora);

      const calendarPeriod = knoraPeriodToCalendarPeriod(knoraPeriod);

      expect(calendarPeriod.start.era).toBe('BCE');
      expect(calendarPeriod.end.era).toBe('CE');
    });
  });

  describe('calendarPeriodToKnoraPeriod', () => {
    it('should convert CalendarPeriod to KnoraPeriod', () => {
      const start = createDate('GREGORIAN', 2024, 1, 1);
      const end = createDate('GREGORIAN', 2024, 12, 31);
      const calendarPeriod = createPeriod(start, end);

      const knoraPeriod = calendarPeriodToKnoraPeriod(calendarPeriod);

      expect(knoraPeriod.start.year).toBe(2024);
      expect(knoraPeriod.start.month).toBe(1);
      expect(knoraPeriod.start.day).toBe(1);
      expect(knoraPeriod.end.year).toBe(2024);
      expect(knoraPeriod.end.month).toBe(12);
      expect(knoraPeriod.end.day).toBe(31);
    });

    it('should handle Islamic calendar periods', () => {
      const start = createDate('ISLAMIC', 1445, 1, 1);
      const end = createDate('ISLAMIC', 1445, 12, 29);
      const calendarPeriod = createPeriod(start, end);

      const knoraPeriod = calendarPeriodToKnoraPeriod(calendarPeriod);

      expect(knoraPeriod.start.calendar).toBe('ISLAMIC');
      expect(knoraPeriod.start.era).toBe('noEra');
      expect(knoraPeriod.end.era).toBe('noEra');
    });
  });

  describe('getPrecisionFromCalendarDate', () => {
    it('should return dayPrecision for day-precision dates', () => {
      const date = createDate('GREGORIAN', 2024, 1, 15);
      const precision = getPrecisionFromCalendarDate(date);

      expect(precision).toBe(Precision.dayPrecision);
    });

    it('should return monthPrecision for month-precision dates', () => {
      const date = createDate('GREGORIAN', 2024, 3);
      const precision = getPrecisionFromCalendarDate(date);

      expect(precision).toBe(Precision.monthPrecision);
    });

    it('should return yearPrecision for year-only dates', () => {
      const date = createDate('GREGORIAN', 2024);
      const precision = getPrecisionFromCalendarDate(date);

      expect(precision).toBe(Precision.yearPrecision);
    });
  });

  describe('Type guards', () => {
    it('should identify KnoraDate instances', () => {
      const knoraDate = new KnoraDate('GREGORIAN', 'CE', 2024, 1, 15);
      expect(isKnoraDate(knoraDate)).toBe(true);
    });

    it('should reject non-KnoraDate values', () => {
      const calendarDate = createDate('GREGORIAN', 2024, 1, 15);
      expect(isKnoraDate(calendarDate)).toBe(false);
      expect(isKnoraDate(null)).toBe(false);
      expect(isKnoraDate(undefined)).toBe(false);
      expect(isKnoraDate({})).toBe(false);
    });

    it('should identify KnoraPeriod instances', () => {
      const start = new KnoraDate('GREGORIAN', 'CE', 2024, 1, 1);
      const end = new KnoraDate('GREGORIAN', 'CE', 2024, 12, 31);
      const knoraPeriod = new KnoraPeriod(start, end);

      expect(isKnoraPeriod(knoraPeriod)).toBe(true);
    });

    it('should reject non-KnoraPeriod values', () => {
      const calendarPeriod = createPeriod(createDate('GREGORIAN', 2024, 1, 1), createDate('GREGORIAN', 2024, 12, 31));

      expect(isKnoraPeriod(calendarPeriod)).toBe(false);
      expect(isKnoraPeriod(null)).toBe(false);
      expect(isKnoraPeriod(undefined)).toBe(false);
      expect(isKnoraPeriod({})).toBe(false);
    });
  });
});
