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

    it.each([
      ['GREGORIAN', 'CE', 2024, 6, 5],
      ['GREGORIAN', 'CE', 1500, 3, 6],
      ['JULIAN', 'CE', 2024, 6, 4],
    ])('positions %s %s %i-%i with %i leading blanks', (cal, era, year, month, expected) => {
      expect(leadingBlanks(cal as string, era as string, year as number, month as number)).toBe(expected);
    });

    it('omits the leading blanks for a BCE date', () => {
      expect(leadingBlanks('GREGORIAN', 'BCE', 44, 3)).toBe(0);
    });

    it('does not drain its own output, unlike the implementation it replaces', () => {
      // `_setDays` spliced out of the array it had just filled, so reading `days` afterwards always
      // gave an empty list. A pure function has no such trap.
      const grid = service.monthGrid('GREGORIAN', 'CE', 2024, 6);

      expect(grid.weeks.flat().length).toBe(grid.weeks.flat().length);
      expect(grid.weeks.length).toBeGreaterThan(0);
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
