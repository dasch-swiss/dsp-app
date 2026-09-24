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
});
