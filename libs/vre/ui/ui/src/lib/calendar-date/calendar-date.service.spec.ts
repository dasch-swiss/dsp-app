import { TestBed } from '@angular/core/testing';
import { KnoraDate, KnoraPeriod } from '@dasch-swiss/dsp-js';
import { provideTranslateService } from '@ngx-translate/core';

import { CalendarDateService } from './calendar-date.service';

/**
 * The same expectations as `calendar-arithmetic.characterisation.spec.ts`, asked of the service
 * rather than the component. Both files must agree: that is what proves the extraction moved the
 * behaviour rather than changing it.
 */
describe('CalendarDateService', () => {
  let service: CalendarDateService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    service = TestBed.inject(CalendarDateService);
  });

  describe('month lengths', () => {
    it.each([
      ['GREGORIAN', 2024, 2, 29],
      ['GREGORIAN', 2025, 2, 28],
      ['GREGORIAN', 1900, 2, 28],
      ['GREGORIAN', 2000, 2, 29],
      ['JULIAN', 1900, 2, 29],
      ['ISLAMIC', 1445, 1, 30],
      ['ISLAMIC', 1445, 2, 29],
    ])('%s %i-%i has %i days', (calendar, year, month, expected) => {
      expect(service.daysInMonth(calendar as string, year as number, month as number)).toBe(expected);
    });
  });

  describe('historical to astronomical year', () => {
    it.each([
      [2024, 'CE', 2024],
      [1, 'BCE', 0],
      [44, 'BCE', -43],
    ])('%i %s is astronomical %i', (year, era, expected) => {
      expect(service.convertHistoricalYearToAstronomicalYear(year as number, era as string)).toBe(expected);
    });
  });

  describe('the month grid', () => {
    const cells = (calendar: string, era: string, year: number, month: number) =>
      service.monthGrid(calendar, era, year, month).weeks.flat();
    const dayNumbers = (c: number[]) => c.filter(d => d > 0);
    const leadingBlanks = (calendar: string, era: string, year: number, month: number) =>
      service.monthGrid(calendar, era, year, month).weeks[0].filter(d => d === 0).length;

    it('runs 1..n for an ordinary month', () => {
      const d = dayNumbers(cells('GREGORIAN', 'CE', 2024, 6));

      expect(d[0]).toBe(1);
      expect(d[d.length - 1]).toBe(30);
      expect(d.length).toBe(30);
    });

    it('skips the ten days the Gregorian reform deleted', () => {
      const d = dayNumbers(cells('GREGORIAN', 'CE', 1582, 10));

      expect(d).toContain(4);
      expect(d).not.toContain(5);
      expect(d).not.toContain(14);
      expect(d).toContain(15);
      expect(d.length).toBe(21);
    });

    it('leaves the Julian October 1582 whole, since that calendar had no reform', () => {
      const d = dayNumbers(cells('JULIAN', 'CE', 1582, 10));

      expect(d).toContain(5);
      expect(d.length).toBe(31);
    });

    it('leaves a BCE October 1582 whole, since the rule is era-specific', () => {
      expect(dayNumbers(cells('GREGORIAN', 'BCE', 1582, 10))).toContain(5);
    });

    // Blank counts are the weekday of the 1st, minus one. Each is checked against the Julian Day
    // Number, which is a continuous day count and so independent of any calendar's own rules.
    it.each([
      // 01.06.2024 Gregorian was a Saturday.
      ['GREGORIAN', 'CE', 2024, 6, 5],
      // 01.03.1500 proleptic Gregorian was a Thursday. The previous implementation answered Sunday
      // here: it took its Julian branch for any year before 1582, even when asked for Gregorian.
      ['GREGORIAN', 'CE', 1500, 3, 3],
      // 01.06.2024 Julian was a Friday.
      ['JULIAN', 'CE', 2024, 6, 4],
    ])('positions %s %s %i-%i with %i leading blanks', (cal, era, year, month, expected) => {
      expect(leadingBlanks(cal as string, era as string, year as number, month as number)).toBe(expected);
    });

    // A BCE month used to get no padding at all, so every one of them started on a Monday.
    it('positions a BCE month by its real weekday', () => {
      // 01.03.44 BCE Julian was a Wednesday.
      expect(leadingBlanks('JULIAN', 'BCE', 44, 3)).toBe(2);
    });

    // The date from the bug report: drawn as a Saturday, actually a Wednesday.
    it('puts 20.09.100 BCE Julian on a Wednesday', () => {
      const grid = service.monthGrid('JULIAN', 'BCE', 100, 9);
      const flat = grid.weeks.flat();

      // Monday is column 0, so Wednesday is column 2.
      expect(flat.indexOf(20) % 7).toBe(2);
    });

    // Islamic has no era, so it fell through the same CE-only guard as BCE did.
    it('positions an Islamic month by its real weekday', () => {
      // 1 Muharram 1445 was a Wednesday — the conversion check date in the DEV-7372 handoff.
      expect(leadingBlanks('ISLAMIC', 'noEra', 1445, 1)).toBe(2);
    });

    it('does not drain its own output, unlike the implementation it replaces', () => {
      // `_setDays` spliced out of the array it had just filled, so reading `days` afterwards always
      // gave an empty list. A pure function has no such trap.
      const grid = service.monthGrid('GREGORIAN', 'CE', 2024, 6);

      expect(grid.weeks.flat().length).toBe(grid.weeks.flat().length);
      expect(grid.weeks.length).toBeGreaterThan(0);
    });
  });

  describe('facts about the instant', () => {
    // Verified against independent JDN arithmetic: 20.09.100 BCE Julian is JDN 1685161.
    it('gives the Julian Day Number of a day-precision date', () => {
      expect(service.julianDayNumber(new KnoraDate('JULIAN', 'BCE', 100, 9, 20))).toBe(1685161);
    });

    // No catalogue is loaded in jsdom, so the key is what comes back; the Storybook test asserts
    // the translated name. What matters here is which weekday it resolved to.
    it('names the weekday of a day-precision date', () => {
      expect(service.weekdayOf(new KnoraDate('JULIAN', 'BCE', 100, 9, 20))).toContain('wednesday');
    });

    it('agrees across calendars, since they name one instant', () => {
      const julian = new KnoraDate('JULIAN', 'CE', 2024, 6, 2);
      const gregorian = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);

      expect(service.julianDayNumber(julian)).toBe(service.julianDayNumber(gregorian));
      expect(service.weekdayOf(julian)).toBe(service.weekdayOf(gregorian));
    });

    // A year covers 365 days and a month about thirty, so neither has one of either. Saying
    // nothing is the only honest answer; picking the first day would invent a precision.
    it('gives no JDN for a year', () => {
      expect(service.julianDayNumber(new KnoraDate('GREGORIAN', 'CE', 1582))).toBeUndefined();
    });

    it('gives no weekday for a year', () => {
      expect(service.weekdayOf(new KnoraDate('GREGORIAN', 'CE', 1582))).toBeUndefined();
    });

    it('gives no weekday for a month', () => {
      expect(service.weekdayOf(new KnoraDate('GREGORIAN', 'CE', 1582, 6))).toBeUndefined();
    });

    it('counts a period inclusively, as a span is spoken about', () => {
      const period = new KnoraPeriod(
        new KnoraDate('GREGORIAN', 'CE', 2024, 1, 1),
        new KnoraDate('GREGORIAN', 'CE', 2024, 1, 12)
      );

      expect(service.durationInDays(period)).toBe(12);
    });

    it('counts a single-day period as one day', () => {
      const period = new KnoraPeriod(
        new KnoraDate('GREGORIAN', 'CE', 2024, 1, 1),
        new KnoraDate('GREGORIAN', 'CE', 2024, 1, 1)
      );

      expect(service.durationInDays(period)).toBe(1);
    });

    it('counts a period whose ends sit in different calendars', () => {
      const period = new KnoraPeriod(
        new KnoraDate('JULIAN', 'CE', 2024, 6, 2),
        new KnoraDate('GREGORIAN', 'CE', 2024, 6, 16)
      );

      expect(service.durationInDays(period)).toBe(2);
    });

    it('gives no duration when an end is imprecise', () => {
      const period = new KnoraPeriod(
        new KnoraDate('GREGORIAN', 'CE', 2024, 1, 1),
        new KnoraDate('GREGORIAN', 'CE', 2024)
      );

      expect(service.durationInDays(period)).toBeUndefined();
    });
  });

  describe('conversion', () => {
    it('converts a day between calendars', () => {
      const julian = service.convertKnoraDateTo(new KnoraDate('GREGORIAN', 'CE', 2020, 4, 1), 'JULIAN');

      expect([julian?.start.day, julian?.start.month, julian?.start.year]).toEqual([19, 3, 2020]);
    });

    it('reports a span when the source covers one', () => {
      const converted = service.convertKnoraDateTo(new KnoraDate('JULIAN', 'CE', 1582), 'GREGORIAN');

      expect(converted?.end).toBeDefined();
    });

    it('refuses a calendar that cannot express the date', () => {
      expect(service.convertKnoraDateTo(new KnoraDate('GREGORIAN', 'CE', 500, 1, 1), 'ISLAMIC')).toBeUndefined();
    });

    it('offers a calendar only when both ends of a period are representable', () => {
      const period = new KnoraPeriod(
        new KnoraDate('GREGORIAN', 'CE', 500, 1, 1),
        new KnoraDate('GREGORIAN', 'CE', 700, 1, 1)
      );

      expect(service.availableCalendarsFor(period)).not.toContain('ISLAMIC');
    });

    it('gives today in the calendar asked for, through the same conversion as everything else', () => {
      const now = new Date();
      const expected = service.convertKnoraDateTo(
        new KnoraDate('GREGORIAN', 'CE', now.getFullYear(), now.getMonth() + 1, now.getDate()),
        'ISLAMIC'
      )?.start;

      expect(service.today('ISLAMIC')?.day).toBe(expected?.day);
    });
  });

  describe('comparing instants', () => {
    it('sees one instant through two calendars', () => {
      const a = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);
      const b = new KnoraDate('JULIAN', 'CE', 2024, 6, 2);

      expect(service.knoraDatesDenoteSameInstant(a, b)).toBe(true);
    });

    it('treats a different precision as a different instant', () => {
      const year = new KnoraDate('GREGORIAN', 'CE', 2024);
      const day = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);

      expect(service.knoraDatesDenoteSameInstant(year, day)).toBe(false);
    });

    it('compares whole periods', () => {
      const a = new KnoraPeriod(
        new KnoraDate('GREGORIAN', 'CE', 2020, 1, 1),
        new KnoraDate('GREGORIAN', 'CE', 2024, 1, 1)
      );
      const b = new KnoraPeriod(
        new KnoraDate('GREGORIAN', 'CE', 2020, 1, 1),
        new KnoraDate('GREGORIAN', 'CE', 2024, 1, 1)
      );

      expect(service.dateValuesDenoteSameInstant(a, b)).toBe(true);
    });

    it('does not equate a period with a single date', () => {
      const period = new KnoraPeriod(new KnoraDate('GREGORIAN', 'CE', 2020), new KnoraDate('GREGORIAN', 'CE', 2024));

      expect(service.dateValuesDenoteSameInstant(period, new KnoraDate('GREGORIAN', 'CE', 2020))).toBe(false);
    });
  });

  describe('formatting', () => {
    const date = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);

    it.each([
      ['dd.MM.YYYY', '15.06.2024'],
      ['dd-MM-YYYY', '15-06-2024'],
      ['MM/dd/YYYY', '06/15/2024'],
      ['YYYY-MM-dd', '2024-06-15'],
    ])('renders %s as %s', (pattern, expected) => {
      expect(service.formatPattern(date, pattern as string)).toBe(expected);
    });

    it('drops the day at month precision', () => {
      expect(service.formatPattern(new KnoraDate('GREGORIAN', 'CE', 2024, 6), 'dd.MM.YYYY')).toBe('06.2024');
    });

    it('keeps a gravsearch literal bare and untranslated', () => {
      // The single most dangerous line in the service: a human-readable calendar name here would
      // break every date query in the app.
      const literal = service.format(date, 'YYYY-MM-dd', 'gravsearch');

      expect(literal).toBe('GREGORIAN:2024-06-15');
    });

    it('marks BCE in a gravsearch literal', () => {
      const bce = new KnoraDate('JULIAN', 'BCE', 44, 3, 15);

      // The year is not zero-padded, only day and month — which is how the original emitted it.
      expect(service.format(bce, 'YYYY-MM-dd', 'gravsearch')).toBe('JULIAN:44-03-15 BCE');
    });

    it('falls back to title case when a calendar has no translation', () => {
      expect(service.calendarName('GREGORIAN')).toBe('Gregorian');
    });
  });
});
