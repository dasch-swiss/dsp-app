import { KnoraDate, KnoraPeriod } from '@dasch-swiss/dsp-js';

import { ValueService } from './value.service';

describe('ValueService', () => {
  let service: ValueService;

  beforeEach(() => {
    service = new ValueService();
  });

  describe('knoraDatesDenoteSameInstant', () => {
    // The point of the whole check: a calendar conversion rewrites every field while meaning the
    // same day, so a field comparison would report an edit the user never made (DEV-7372).
    it('treats a date and its conversion to another calendar as the same instant', () => {
      const gregorian = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);
      const julian = new KnoraDate('JULIAN', 'CE', 2024, 6, 2);

      expect(service.knoraDatesDenoteSameInstant(gregorian, julian)).toBe(true);
    });

    it('treats the same date in the same calendar as the same instant', () => {
      const a = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);
      const b = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);

      expect(service.knoraDatesDenoteSameInstant(a, b)).toBe(true);
    });

    it('distinguishes adjacent days', () => {
      const a = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);
      const b = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 16);

      expect(service.knoraDatesDenoteSameInstant(a, b)).toBe(false);
    });

    it('distinguishes a year from a day inside it, because precision is part of what a date says', () => {
      const year = new KnoraDate('GREGORIAN', 'CE', 2024);
      const day = new KnoraDate('GREGORIAN', 'CE', 2024, 1, 1);

      expect(service.knoraDatesDenoteSameInstant(year, day)).toBe(false);
    });

    it('treats an Islamic date and its Gregorian equivalent as the same instant', () => {
      const gregorian = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);
      const islamic = new KnoraDate('ISLAMIC', 'noEra', 1445, 12, 8);

      expect(service.knoraDatesDenoteSameInstant(gregorian, islamic)).toBe(true);
    });

    it('compares BCE dates by the day they denote', () => {
      const a = new KnoraDate('JULIAN', 'BCE', 44, 3, 15);
      const b = new KnoraDate('JULIAN', 'BCE', 44, 3, 15);

      expect(service.knoraDatesDenoteSameInstant(a, b)).toBe(true);
    });
  });

  describe('dateValuesDenoteSameInstant', () => {
    it('treats a period and its conversion to another calendar as the same instant', () => {
      const gregorian = new KnoraPeriod(
        new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15),
        new KnoraDate('GREGORIAN', 'CE', 2024, 7, 15)
      );
      const julian = new KnoraPeriod(
        new KnoraDate('JULIAN', 'CE', 2024, 6, 2),
        new KnoraDate('JULIAN', 'CE', 2024, 7, 2)
      );

      expect(service.dateValuesDenoteSameInstant(gregorian, julian)).toBe(true);
    });

    it('reports a period whose end moved as changed', () => {
      const before = new KnoraPeriod(
        new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15),
        new KnoraDate('GREGORIAN', 'CE', 2024, 7, 15)
      );
      const after = new KnoraPeriod(
        new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15),
        new KnoraDate('GREGORIAN', 'CE', 2024, 7, 16)
      );

      expect(service.dateValuesDenoteSameInstant(before, after)).toBe(false);
    });

    it('never equates a period with a single date', () => {
      const single = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);
      const period = new KnoraPeriod(single, new KnoraDate('GREGORIAN', 'CE', 2024, 7, 15));

      expect(service.dateValuesDenoteSameInstant(single, period)).toBe(false);
    });

    it('treats two absent values as unchanged', () => {
      expect(service.dateValuesDenoteSameInstant(null, null)).toBe(true);
      expect(service.dateValuesDenoteSameInstant(undefined, null)).toBe(true);
    });

    it('reports a value appearing where there was none as changed', () => {
      const date = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);

      expect(service.dateValuesDenoteSameInstant(null, date)).toBe(false);
      expect(service.dateValuesDenoteSameInstant(date, null)).toBe(false);
    });
  });

  describe('convertAstronomicalYearToHistoricalYear', () => {
    // There is no year zero: astronomical 0 is 1 BCE. An off-by-one here is a full-year error on
    // every pre-CE date, which is the defect that got the adapter in #3441 deleted.
    it.each([
      [2024, 2024, 'CE'],
      [1, 1, 'CE'],
      [0, 1, 'BCE'],
      [-1, 2, 'BCE'],
      [-43, 44, 'BCE'],
    ])('maps astronomical %s to historical %s %s', (astro, year, era) => {
      expect(service.convertAstronomicalYearToHistoricalYear(astro, 'GREGORIAN')).toEqual({ year, era });
    });

    it('gives the Islamic calendar no era', () => {
      expect(service.convertAstronomicalYearToHistoricalYear(1445, 'ISLAMIC')).toEqual({
        year: 1445,
        era: 'noEra',
      });
    });

    it('round-trips through the historical-to-astronomical direction', () => {
      for (const [year, era] of [
        [2024, 'CE'],
        [1, 'CE'],
        [44, 'BCE'],
        [400, 'BCE'],
      ] as Array<[number, string]>) {
        const astro = service.convertHistoricalYearToAstronomicalYear(year, era);
        expect(service.convertAstronomicalYearToHistoricalYear(astro, 'GREGORIAN')).toEqual({ year, era });
      }
    });
  });

  describe('convertKnoraDateTo', () => {
    it('converts a day-precision date to the same day in another calendar', () => {
      const result = service.convertKnoraDateTo(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15), 'JULIAN');

      expect(result?.start.year).toBe(2024);
      expect(result?.start.month).toBe(6);
      expect(result?.start.day).toBe(2);
      expect(result?.end).toBeUndefined();
    });

    it('reports the span a year-precision date covers, rather than inventing one year', () => {
      const result = service.convertKnoraDateTo(new KnoraDate('JULIAN', 'CE', 1582), 'GREGORIAN');

      expect(result?.start.year).toBe(1582);
      expect(result?.end?.year).toBe(1583);
    });

    it('keeps a converted year-precision date free of month and day', () => {
      const result = service.convertKnoraDateTo(new KnoraDate('JULIAN', 'CE', 1582), 'GREGORIAN');

      expect(result?.start.month).toBeUndefined();
      expect(result?.start.day).toBeUndefined();
    });

    it('refuses a pre-Hijra date rather than returning a negative Islamic year', () => {
      expect(service.convertKnoraDateTo(new KnoraDate('GREGORIAN', 'CE', 500, 1, 1), 'ISLAMIC')).toBeUndefined();
    });

    it('preserves BCE through a conversion', () => {
      const result = service.convertKnoraDateTo(new KnoraDate('JULIAN', 'BCE', 44, 3, 15), 'GREGORIAN');

      expect(result?.start.era).toBe('BCE');
      expect(result?.start.year).toBe(44);
    });
  });

  describe('availableCalendarsFor', () => {
    it('offers all three for a modern date', () => {
      const calendars = service.availableCalendarsFor(new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15));

      expect(calendars).toEqual(['GREGORIAN', 'JULIAN', 'ISLAMIC']);
    });

    it('withholds the Islamic calendar from a pre-Hijra date', () => {
      const calendars = service.availableCalendarsFor(new KnoraDate('GREGORIAN', 'CE', 500, 1, 1));

      expect(calendars).toEqual(['GREGORIAN', 'JULIAN']);
    });

    it('offers a period only the calendars both of its ends can be shown in', () => {
      // One end before the Hijra is enough to rule the Islamic calendar out for the whole period.
      const period = new KnoraPeriod(
        new KnoraDate('GREGORIAN', 'CE', 500, 1, 1),
        new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15)
      );

      expect(service.availableCalendarsFor(period)).toEqual(['GREGORIAN', 'JULIAN']);
    });
  });
});
