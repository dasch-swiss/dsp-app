/**
 * Tests for date validators.
 *
 * Verifies that validators work correctly with Angular forms.
 */

import { FormControl } from '@angular/forms';
import { createDate, createPeriod } from '@dasch-swiss/vre/shared/calendar';
import {
  dateValidator,
  beforeDate,
  afterDate,
  dateRange,
  periodValidator,
  minPrecision,
  calendarSystem,
  leapYear,
  dayOfWeekValidator,
} from './date.validators';

describe('Date Validators', () => {
  describe('dateValidator', () => {
    it('should accept valid date', () => {
      const control = new FormControl(createDate('GREGORIAN', 2024, 1, 15));
      const validator = dateValidator();

      expect(validator(control)).toBeNull();
    });

    it('should accept null value', () => {
      const control = new FormControl(null);
      const validator = dateValidator();

      expect(validator(control)).toBeNull();
    });

    it('should reject non-CalendarDate value', () => {
      const control = new FormControl('2024-01-15');
      const validator = dateValidator();

      const result = validator(control);
      expect(result).toBeTruthy();
      expect(result!['invalidDate']).toBeDefined();
    });

    it('should reject invalid month', () => {
      const invalidDate = { ...createDate('GREGORIAN', 2024, 1, 15), month: 13 };
      const control = new FormControl(invalidDate);
      const validator = dateValidator();

      const result = validator(control);
      expect(result).toBeTruthy();
      expect(result!['invalidMonth']).toBeDefined();
    });

    it('should reject invalid day', () => {
      const invalidDate = { ...createDate('GREGORIAN', 2024, 2, 15), day: 30 };
      const control = new FormControl(invalidDate);
      const validator = dateValidator();

      const result = validator(control);
      expect(result).toBeTruthy();
      expect(result!['invalidDay']).toBeDefined();
    });
  });

  describe('beforeDate', () => {
    const maxDate = createDate('GREGORIAN', 2024, 12, 31);

    it('should accept date before max date', () => {
      const control = new FormControl(createDate('GREGORIAN', 2024, 6, 15));
      const validator = beforeDate(maxDate);

      expect(validator(control)).toBeNull();
    });

    it('should reject date equal to max date', () => {
      const control = new FormControl(maxDate);
      const validator = beforeDate(maxDate);

      const result = validator(control);
      expect(result).toBeTruthy();
      expect(result!['dateNotBefore']).toBeDefined();
    });

    it('should reject date after max date', () => {
      const control = new FormControl(createDate('GREGORIAN', 2025, 1, 1));
      const validator = beforeDate(maxDate);

      const result = validator(control);
      expect(result).toBeTruthy();
      expect(result!['dateNotBefore']).toBeDefined();
    });

    it('should accept null value', () => {
      const control = new FormControl(null);
      const validator = beforeDate(maxDate);

      expect(validator(control)).toBeNull();
    });
  });

  describe('afterDate', () => {
    const minDate = createDate('GREGORIAN', 2024, 1, 1);

    it('should accept date after min date', () => {
      const control = new FormControl(createDate('GREGORIAN', 2024, 6, 15));
      const validator = afterDate(minDate);

      expect(validator(control)).toBeNull();
    });

    it('should reject date equal to min date', () => {
      const control = new FormControl(minDate);
      const validator = afterDate(minDate);

      const result = validator(control);
      expect(result).toBeTruthy();
      expect(result!['dateNotAfter']).toBeDefined();
    });

    it('should reject date before min date', () => {
      const control = new FormControl(createDate('GREGORIAN', 2023, 12, 31));
      const validator = afterDate(minDate);

      const result = validator(control);
      expect(result).toBeTruthy();
      expect(result!['dateNotAfter']).toBeDefined();
    });
  });

  describe('dateRange', () => {
    const minDate = createDate('GREGORIAN', 2024, 1, 1);
    const maxDate = createDate('GREGORIAN', 2024, 12, 31);

    it('should accept date within range', () => {
      const control = new FormControl(createDate('GREGORIAN', 2024, 6, 15));
      const validator = dateRange(minDate, maxDate);

      expect(validator(control)).toBeNull();
    });

    it('should accept date equal to min date', () => {
      const control = new FormControl(minDate);
      const validator = dateRange(minDate, maxDate);

      expect(validator(control)).toBeNull();
    });

    it('should accept date equal to max date', () => {
      const control = new FormControl(maxDate);
      const validator = dateRange(minDate, maxDate);

      expect(validator(control)).toBeNull();
    });

    it('should reject date before range', () => {
      const control = new FormControl(createDate('GREGORIAN', 2023, 12, 31));
      const validator = dateRange(minDate, maxDate);

      const result = validator(control);
      expect(result).toBeTruthy();
      expect(result!['dateBeforeMin']).toBeDefined();
    });

    it('should reject date after range', () => {
      const control = new FormControl(createDate('GREGORIAN', 2025, 1, 1));
      const validator = dateRange(minDate, maxDate);

      const result = validator(control);
      expect(result).toBeTruthy();
      expect(result!['dateAfterMax']).toBeDefined();
    });
  });

  describe('periodValidator', () => {
    it('should accept valid period', () => {
      const start = createDate('GREGORIAN', 2024, 1, 1);
      const end = createDate('GREGORIAN', 2024, 12, 31);
      const period = createPeriod(start, end);
      const control = new FormControl(period);
      const validator = periodValidator();

      expect(validator(control)).toBeNull();
    });

    it('should accept period with same start and end', () => {
      const date = createDate('GREGORIAN', 2024, 6, 15);
      const period = createPeriod(date, date);
      const control = new FormControl(period);
      const validator = periodValidator();

      expect(validator(control)).toBeNull();
    });

    it('should reject period with end before start', () => {
      const start = createDate('GREGORIAN', 2024, 12, 31);
      const end = createDate('GREGORIAN', 2024, 1, 1);
      const period = { start, end };
      const control = new FormControl(period);
      const validator = periodValidator();

      const result = validator(control);
      expect(result).toBeTruthy();
      expect(result!['invalidPeriodOrder']).toBeDefined();
    });

    it('should accept null value', () => {
      const control = new FormControl(null);
      const validator = periodValidator();

      expect(validator(control)).toBeNull();
    });

    it('should reject non-period value', () => {
      const control = new FormControl('invalid');
      const validator = periodValidator();

      const result = validator(control);
      expect(result).toBeTruthy();
      expect(result!['invalidPeriod']).toBeDefined();
    });
  });

  describe('minPrecision', () => {
    it('should accept date with exact precision', () => {
      const control = new FormControl(createDate('GREGORIAN', 2024, 6, 15));
      const validator = minPrecision('DAY');

      expect(validator(control)).toBeNull();
    });

    it('should accept date with higher precision', () => {
      const control = new FormControl(createDate('GREGORIAN', 2024, 6, 15));
      const validator = minPrecision('MONTH');

      expect(validator(control)).toBeNull();
    });

    it('should reject date with lower precision', () => {
      const control = new FormControl(createDate('GREGORIAN', 2024));
      const validator = minPrecision('DAY');

      const result = validator(control);
      expect(result).toBeTruthy();
      expect(result!['insufficientPrecision']).toBeDefined();
    });

    it('should accept month precision when MONTH required', () => {
      const control = new FormControl(createDate('GREGORIAN', 2024, 6));
      const validator = minPrecision('MONTH');

      expect(validator(control)).toBeNull();
    });

    it('should accept year precision when YEAR required', () => {
      const control = new FormControl(createDate('GREGORIAN', 2024));
      const validator = minPrecision('YEAR');

      expect(validator(control)).toBeNull();
    });
  });

  describe('calendarSystem', () => {
    it('should accept date with correct calendar', () => {
      const control = new FormControl(createDate('GREGORIAN', 2024, 6, 15));
      const validator = calendarSystem('GREGORIAN');

      expect(validator(control)).toBeNull();
    });

    it('should reject date with wrong calendar', () => {
      const control = new FormControl(createDate('JULIAN', 2024, 6, 15));
      const validator = calendarSystem('GREGORIAN');

      const result = validator(control);
      expect(result).toBeTruthy();
      expect(result!['wrongCalendarSystem']).toBeDefined();
    });

    it('should work with Julian calendar', () => {
      const control = new FormControl(createDate('JULIAN', 2024, 6, 15));
      const validator = calendarSystem('JULIAN');

      expect(validator(control)).toBeNull();
    });

    it('should work with Islamic calendar', () => {
      const control = new FormControl(createDate('ISLAMIC', 1445, 7, 4));
      const validator = calendarSystem('ISLAMIC');

      expect(validator(control)).toBeNull();
    });
  });

  describe('leapYear', () => {
    it('should accept leap year date', () => {
      const control = new FormControl(createDate('GREGORIAN', 2024, 2, 29));
      const validator = leapYear();

      expect(validator(control)).toBeNull();
    });

    it('should reject non-leap year date', () => {
      const control = new FormControl(createDate('GREGORIAN', 2023, 6, 15));
      const validator = leapYear();

      const result = validator(control);
      expect(result).toBeTruthy();
      expect(result!['notLeapYear']).toBeDefined();
    });

    it('should handle century years correctly', () => {
      const control2000 = new FormControl(createDate('GREGORIAN', 2000, 1, 1));
      const control1900 = new FormControl(createDate('GREGORIAN', 1900, 1, 1));
      const validator = leapYear();

      expect(validator(control2000)).toBeNull(); // 2000 is leap year
      expect(validator(control1900)).toBeTruthy(); // 1900 is not leap year
    });
  });

  describe('dayOfWeekValidator', () => {
    it('should accept date on correct day of week', () => {
      // January 15, 2024 is a Monday (day 1)
      const control = new FormControl(createDate('GREGORIAN', 2024, 1, 15));
      const validator = dayOfWeekValidator(1);

      expect(validator(control)).toBeNull();
    });

    it('should reject date on wrong day of week', () => {
      // January 15, 2024 is not a Sunday (day 0)
      const control = new FormControl(createDate('GREGORIAN', 2024, 1, 15));
      const validator = dayOfWeekValidator(0);

      const result = validator(control);
      expect(result).toBeTruthy();
      expect(result!['wrongDayOfWeek']).toBeDefined();
    });

    it('should work for all days of week', () => {
      const date = createDate('GREGORIAN', 2024, 1, 15); // Monday
      const validator = dayOfWeekValidator(1);

      const control = new FormControl(date);
      expect(validator(control)).toBeNull();
    });
  });

  describe('Multiple validators', () => {
    it('should apply multiple validators correctly', () => {
      const minDate = createDate('GREGORIAN', 2024, 1, 1);
      const maxDate = createDate('GREGORIAN', 2024, 12, 31);

      const control = new FormControl(createDate('GREGORIAN', 2024, 6, 15), [
        dateValidator(),
        dateRange(minDate, maxDate),
        minPrecision('DAY'),
        calendarSystem('GREGORIAN'),
      ]);

      expect(control.valid).toBe(true);
    });

    it('should fail if any validator fails', () => {
      const minDate = createDate('GREGORIAN', 2024, 1, 1);
      const maxDate = createDate('GREGORIAN', 2024, 12, 31);

      // Date is outside range
      const control = new FormControl(createDate('GREGORIAN', 2025, 6, 15), [
        dateValidator(),
        dateRange(minDate, maxDate),
      ]);

      expect(control.valid).toBe(false);
      expect(control.errors).toBeTruthy();
    });
  });
});
