/**
 * Round-trip guarantees for every supported calendar (DEV-7372).
 *
 * DEV-7264 and its predecessor were both one defect: two functions that must be inverses, written
 * from different sources, drifting apart without anything noticing. The Islamic calendar carried
 * the same defect until this suite was written — 26 days in the first 111,561 after the Hijra
 * failed to round-trip and 10 threw `Invalid month: 13`.
 *
 * These tests exist so that class of bug cannot return silently. They assert on every JDN in a
 * range rather than on samples, because sampling is what let the Islamic failures sit unnoticed:
 * they were rare enough that any reasonable set of hand-picked cases missed them.
 */

import { ISLAMIC_EPOCH_JDN } from '../calendars/islamic.calendar';
import { getCalendar } from '../factories/calendar.factory';
import { createDate } from '../factories/date.factory';
import { CalendarSystem } from '../types/calendar.types';
import { convertCalendar, convertCalendarResult } from './calendar.converter';

/** The Islamic calendar's floor, so the shared range starts where all three are defined. */
const RANGE_START = ISLAMIC_EPOCH_JDN;
/** Roughly 1512 CE, giving ~1500 years of coverage on each calendar. */
const RANGE_END = 2500000;

const CALENDARS: CalendarSystem[] = ['GREGORIAN', 'JULIAN', 'ISLAMIC'];

const ORDERED_PAIRS: Array<[CalendarSystem, CalendarSystem]> = [
  ['GREGORIAN', 'JULIAN'],
  ['GREGORIAN', 'ISLAMIC'],
  ['JULIAN', 'GREGORIAN'],
  ['JULIAN', 'ISLAMIC'],
  ['ISLAMIC', 'GREGORIAN'],
  ['ISLAMIC', 'JULIAN'],
];

describe('calendar round trips (DEV-7372)', () => {
  describe('toJDN/fromJDN are inverses on every day in range', () => {
    // Exhaustive rather than sampled: see the module comment. Zero failures is the only pass.
    it.each(CALENDARS)(
      '%s round-trips every JDN from the Hijra epoch to %s',
      calendar => {
        const cal = getCalendar(calendar);
        const failures: number[] = [];

        for (let jdn = RANGE_START; jdn <= RANGE_END; jdn++) {
          const date = cal.fromJDN(jdn);
          if (cal.toJDN(date) !== jdn) {
            failures.push(jdn);
            if (failures.length > 5) break;
          }
        }

        expect(failures).toEqual([]);
      },
      120000
    );

    it('the Islamic calendar never yields a month outside 1..12', () => {
      const cal = getCalendar('ISLAMIC');
      const offending: Array<{ jdn: number; month: number | undefined }> = [];

      for (let jdn = RANGE_START; jdn <= RANGE_END; jdn++) {
        const month = cal.fromJDN(jdn).month;
        if (month === undefined || month < 1 || month > 12) {
          offending.push({ jdn, month });
          if (offending.length > 5) break;
        }
      }

      expect(offending).toEqual([]);
    }, 120000);
  });

  describe('converting between calendars and back preserves the day', () => {
    const DAY_CASES: Array<[string, number, number, number]> = [
      ['moon landing', 1969, 7, 20],
      ['a modern date', 2024, 6, 15],
      ['a leap day', 2024, 2, 29],
      ['first day of a year', 2000, 1, 1],
      ['last day of a year', 1999, 12, 31],
      ['the first Gregorian day', 1582, 10, 15],
    ];

    describe.each(ORDERED_PAIRS)('%s to %s', (from, to) => {
      it.each(DAY_CASES)('round-trips %s', (_label, year, month, day) => {
        // Islamic years are not Gregorian ones, so start from a JDN the source can express
        // rather than from the literal numerals.
        const gregorian = createDate('GREGORIAN', year, month, day);
        const jdn = getCalendar('GREGORIAN').toJDN(gregorian);
        const source = getCalendar(from).fromJDN(jdn);

        const converted = convertCalendar(source, to);
        const back = convertCalendar(converted, from);

        expect(getCalendar(from).toJDN(back)).toBe(jdn);
      });
    });
  });

  describe('year and month precision report the span they cover', () => {
    it('Julian year 1582 spans two Gregorian years', () => {
      const result = convertCalendarResult(createDate('JULIAN', 1582), 'GREGORIAN');

      expect(result.kind).toBe('span');
      if (result.kind !== 'span') return;
      expect(result.start.year).toBe(1582);
      expect(result.end.year).toBe(1583);
    });

    it('a span states no month or day for a year-precision source', () => {
      const result = convertCalendarResult(createDate('JULIAN', 1582), 'GREGORIAN');

      expect(result.kind).toBe('span');
      if (result.kind !== 'span') return;
      expect(result.start.month).toBeUndefined();
      expect(result.start.day).toBeUndefined();
      expect(result.end.month).toBeUndefined();
      expect(result.end.day).toBeUndefined();
    });

    it('a month-precision source states no day', () => {
      const result = convertCalendarResult(createDate('JULIAN', 1582, 6), 'GREGORIAN');

      const endpoints = result.kind === 'span' ? [result.start, result.end] : [(result as any).date];
      endpoints.forEach(endpoint => {
        expect(endpoint.day).toBeUndefined();
        expect(endpoint.month).toBeDefined();
      });
    });

    it('an Islamic year maps onto a Gregorian span, not a single year', () => {
      const result = convertCalendarResult(createDate('ISLAMIC', 1445), 'GREGORIAN');

      expect(result.kind).toBe('span');
      if (result.kind !== 'span') return;
      expect(result.end.year).toBeGreaterThan(result.start.year);
    });

    it('a day-precision date converts to exactly one date', () => {
      const result = convertCalendarResult(createDate('GREGORIAN', 2024, 6, 15), 'JULIAN');

      expect(result.kind).toBe('exact');
      if (result.kind !== 'exact') return;
      expect(result.date.day).toBe(2);
      expect(result.date.month).toBe(6);
      expect(result.date.year).toBe(2024);
    });
  });

  describe('BCE dates', () => {
    // Asserted on JDN, not on fields: before 1582 the Gregorian calendar here is proleptically
    // Julian, so the two agreeing field-for-field is correct rather than a missed conversion.
    const BCE_CASES: Array<[string, number, number, number]> = [
      ['the Ides of March', -43, 3, 15],
      ['a year before the epoch', -1, 6, 1],
      ['a deep BCE date', -400, 1, 1],
    ];

    it.each(BCE_CASES)('round-trips %s between Julian and Gregorian', (_label, year, month, day) => {
      const source = createDate('JULIAN', year, month, day, 'BCE');
      const jdn = getCalendar('JULIAN').toJDN(source);

      const converted = convertCalendar(source, 'GREGORIAN');

      expect(getCalendar('GREGORIAN').toJDN(converted)).toBe(jdn);
      expect(getCalendar('JULIAN').toJDN(convertCalendar(converted, 'JULIAN'))).toBe(jdn);
    });

    it('refuses to express a BCE date in the Islamic calendar', () => {
      const result = convertCalendarResult(createDate('JULIAN', -43, 3, 15, 'BCE'), 'ISLAMIC');

      expect(result.kind).toBe('refused');
      if (result.kind !== 'refused') return;
      expect(result.reason).toBe('BEFORE_TARGET_EPOCH');
    });
  });

  describe('the 1582 Gregorian reform', () => {
    it('4 October 1582 Julian is the day before the reform', () => {
      const lastJulianDay = createDate('JULIAN', 1582, 10, 4);
      const jdn = getCalendar('JULIAN').toJDN(lastJulianDay);

      expect(getCalendar('GREGORIAN').toJDN(createDate('GREGORIAN', 1582, 10, 15))).toBe(jdn + 1);
    });

    it('15 October 1582 is the first Gregorian day', () => {
      const firstGregorian = createDate('GREGORIAN', 1582, 10, 15);

      expect(getCalendar('GREGORIAN').toJDN(firstGregorian)).toBe(2299161);
    });

    it('round-trips the ten days the reform skipped, because the calendar is proleptic', () => {
      // The reform skipped 5–14 October 1582 where it was enacted, but this calendar applies the
      // Gregorian rule at every date and has no gap. DSP does not adjudicate which reckoning a
      // source used — the project declares it — so a date recorded in that window is kept as
      // recorded rather than silently moved ten days forward.
      for (let day = 5; day <= 14; day++) {
        const jdn = getCalendar('GREGORIAN').toJDN(createDate('GREGORIAN', 1582, 10, day));

        expect(getCalendar('GREGORIAN').fromJDN(jdn).day).toBe(day);
      }
    });
  });

  describe('refusal', () => {
    it('refuses a pre-Hijra date rather than returning one', () => {
      const result = convertCalendarResult(createDate('GREGORIAN', 500, 1, 1), 'ISLAMIC');

      expect(result.kind).toBe('refused');
    });

    it('never returns a negative Islamic year', () => {
      const result = convertCalendarResult(createDate('GREGORIAN', 100, 1, 1), 'ISLAMIC');

      expect(result.kind).toBe('refused');
      if (result.kind === 'exact') {
        expect(result.date.year).toBeGreaterThan(0);
      }
    });

    it('the day the Islamic calendar begins is representable', () => {
      const firstDay = getCalendar('GREGORIAN').fromJDN(ISLAMIC_EPOCH_JDN);
      const result = convertCalendarResult(firstDay, 'ISLAMIC');

      expect(result.kind).toBe('exact');
      if (result.kind !== 'exact') return;
      expect(result.date.year).toBe(1);
      expect(result.date.month).toBe(1);
      expect(result.date.day).toBe(1);
    });
  });
});
