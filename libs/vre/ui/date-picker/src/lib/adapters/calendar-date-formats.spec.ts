/**
 * Unit tests for calendar date formats.
 */

import {
  CALENDAR_DATE_FORMATS,
  CALENDAR_DATE_FORMATS_LONG,
  CALENDAR_DATE_FORMATS_SHORT,
} from './calendar-date-formats';

describe('CalendarDateFormats', () => {
  describe('CALENDAR_DATE_FORMATS', () => {
    it('should have parse configuration', () => {
      expect(CALENDAR_DATE_FORMATS.parse).toBeDefined();
      expect(CALENDAR_DATE_FORMATS.parse.dateInput).toBeDefined();
    });

    it('should use YYYY-MM-DD format for parsing', () => {
      expect(CALENDAR_DATE_FORMATS.parse.dateInput).toBe('YYYY-MM-DD');
    });

    it('should have display configuration', () => {
      expect(CALENDAR_DATE_FORMATS.display).toBeDefined();
    });

    it('should use YYYY-MM-DD format for display', () => {
      expect(CALENDAR_DATE_FORMATS.display.dateInput).toBe('YYYY-MM-DD');
    });

    it('should have month year label', () => {
      expect(CALENDAR_DATE_FORMATS.display.monthYearLabel).toBe('MMM YYYY');
    });

    it('should have accessibility labels', () => {
      expect(CALENDAR_DATE_FORMATS.display.dateA11yLabel).toBe('LL');
      expect(CALENDAR_DATE_FORMATS.display.monthYearA11yLabel).toBe('MMMM YYYY');
    });

    it('should be a valid MatDateFormats object', () => {
      expect(CALENDAR_DATE_FORMATS).toHaveProperty('parse');
      expect(CALENDAR_DATE_FORMATS).toHaveProperty('display');
    });
  });

  describe('CALENDAR_DATE_FORMATS_SHORT', () => {
    it('should have parse configuration', () => {
      expect(CALENDAR_DATE_FORMATS_SHORT.parse).toBeDefined();
      expect(CALENDAR_DATE_FORMATS_SHORT.parse.dateInput).toBeDefined();
    });

    it('should use MM/DD/YYYY format for parsing', () => {
      expect(CALENDAR_DATE_FORMATS_SHORT.parse.dateInput).toBe('MM/DD/YYYY');
    });

    it('should have display configuration', () => {
      expect(CALENDAR_DATE_FORMATS_SHORT.display).toBeDefined();
    });

    it('should use MM/DD/YYYY format for display', () => {
      expect(CALENDAR_DATE_FORMATS_SHORT.display.dateInput).toBe('MM/DD/YYYY');
    });

    it('should have month year label', () => {
      expect(CALENDAR_DATE_FORMATS_SHORT.display.monthYearLabel).toBe('MMM YYYY');
    });

    it('should have accessibility labels', () => {
      expect(CALENDAR_DATE_FORMATS_SHORT.display.dateA11yLabel).toBe('LL');
      expect(CALENDAR_DATE_FORMATS_SHORT.display.monthYearA11yLabel).toBe('MMMM YYYY');
    });

    it('should be a valid MatDateFormats object', () => {
      expect(CALENDAR_DATE_FORMATS_SHORT).toHaveProperty('parse');
      expect(CALENDAR_DATE_FORMATS_SHORT).toHaveProperty('display');
    });
  });

  describe('CALENDAR_DATE_FORMATS_LONG', () => {
    it('should have parse configuration', () => {
      expect(CALENDAR_DATE_FORMATS_LONG.parse).toBeDefined();
      expect(CALENDAR_DATE_FORMATS_LONG.parse.dateInput).toBeDefined();
    });

    it('should use MMMM DD, YYYY format for parsing', () => {
      expect(CALENDAR_DATE_FORMATS_LONG.parse.dateInput).toBe('MMMM DD, YYYY');
    });

    it('should have display configuration', () => {
      expect(CALENDAR_DATE_FORMATS_LONG.display).toBeDefined();
    });

    it('should use MMMM DD, YYYY format for display', () => {
      expect(CALENDAR_DATE_FORMATS_LONG.display.dateInput).toBe('MMMM DD, YYYY');
    });

    it('should have month year label', () => {
      expect(CALENDAR_DATE_FORMATS_LONG.display.monthYearLabel).toBe('MMMM YYYY');
    });

    it('should have accessibility labels', () => {
      expect(CALENDAR_DATE_FORMATS_LONG.display.dateA11yLabel).toBe('LL');
      expect(CALENDAR_DATE_FORMATS_LONG.display.monthYearA11yLabel).toBe('MMMM YYYY');
    });

    it('should be a valid MatDateFormats object', () => {
      expect(CALENDAR_DATE_FORMATS_LONG).toHaveProperty('parse');
      expect(CALENDAR_DATE_FORMATS_LONG).toHaveProperty('display');
    });
  });

  describe('Format comparison', () => {
    it('should have different parse formats', () => {
      expect(CALENDAR_DATE_FORMATS.parse.dateInput).not.toBe(CALENDAR_DATE_FORMATS_SHORT.parse.dateInput);
      expect(CALENDAR_DATE_FORMATS.parse.dateInput).not.toBe(CALENDAR_DATE_FORMATS_LONG.parse.dateInput);
      expect(CALENDAR_DATE_FORMATS_SHORT.parse.dateInput).not.toBe(CALENDAR_DATE_FORMATS_LONG.parse.dateInput);
    });

    it('should have different display formats', () => {
      expect(CALENDAR_DATE_FORMATS.display.dateInput).not.toBe(CALENDAR_DATE_FORMATS_SHORT.display.dateInput);
      expect(CALENDAR_DATE_FORMATS.display.dateInput).not.toBe(CALENDAR_DATE_FORMATS_LONG.display.dateInput);
      expect(CALENDAR_DATE_FORMATS_SHORT.display.dateInput).not.toBe(CALENDAR_DATE_FORMATS_LONG.display.dateInput);
    });

    it('should use consistent month year labels for standard and short formats', () => {
      expect(CALENDAR_DATE_FORMATS.display.monthYearLabel).toBe(CALENDAR_DATE_FORMATS_SHORT.display.monthYearLabel);
    });

    it('should use full month name for long format month year label', () => {
      expect(CALENDAR_DATE_FORMATS_LONG.display.monthYearLabel).toBe('MMMM YYYY');
    });

    it('should have consistent accessibility labels', () => {
      expect(CALENDAR_DATE_FORMATS.display.dateA11yLabel).toBe(CALENDAR_DATE_FORMATS_SHORT.display.dateA11yLabel);
      expect(CALENDAR_DATE_FORMATS.display.dateA11yLabel).toBe(CALENDAR_DATE_FORMATS_LONG.display.dateA11yLabel);

      expect(CALENDAR_DATE_FORMATS.display.monthYearA11yLabel).toBe(
        CALENDAR_DATE_FORMATS_SHORT.display.monthYearA11yLabel
      );
      expect(CALENDAR_DATE_FORMATS.display.monthYearA11yLabel).toBe(
        CALENDAR_DATE_FORMATS_LONG.display.monthYearA11yLabel
      );
    });
  });

  describe('Format structure', () => {
    it('standard format should have all required properties', () => {
      expect(CALENDAR_DATE_FORMATS.parse).toHaveProperty('dateInput');
      expect(CALENDAR_DATE_FORMATS.display).toHaveProperty('dateInput');
      expect(CALENDAR_DATE_FORMATS.display).toHaveProperty('monthYearLabel');
      expect(CALENDAR_DATE_FORMATS.display).toHaveProperty('dateA11yLabel');
      expect(CALENDAR_DATE_FORMATS.display).toHaveProperty('monthYearA11yLabel');
    });

    it('short format should have all required properties', () => {
      expect(CALENDAR_DATE_FORMATS_SHORT.parse).toHaveProperty('dateInput');
      expect(CALENDAR_DATE_FORMATS_SHORT.display).toHaveProperty('dateInput');
      expect(CALENDAR_DATE_FORMATS_SHORT.display).toHaveProperty('monthYearLabel');
      expect(CALENDAR_DATE_FORMATS_SHORT.display).toHaveProperty('dateA11yLabel');
      expect(CALENDAR_DATE_FORMATS_SHORT.display).toHaveProperty('monthYearA11yLabel');
    });

    it('long format should have all required properties', () => {
      expect(CALENDAR_DATE_FORMATS_LONG.parse).toHaveProperty('dateInput');
      expect(CALENDAR_DATE_FORMATS_LONG.display).toHaveProperty('dateInput');
      expect(CALENDAR_DATE_FORMATS_LONG.display).toHaveProperty('monthYearLabel');
      expect(CALENDAR_DATE_FORMATS_LONG.display).toHaveProperty('dateA11yLabel');
      expect(CALENDAR_DATE_FORMATS_LONG.display).toHaveProperty('monthYearA11yLabel');
    });
  });

  describe('Format patterns', () => {
    it('should use ISO format (YYYY-MM-DD) for standard format', () => {
      expect(CALENDAR_DATE_FORMATS.parse.dateInput).toMatch(/YYYY.*MM.*DD/);
      expect(CALENDAR_DATE_FORMATS.display.dateInput).toMatch(/YYYY.*MM.*DD/);
    });

    it('should use US format (MM/DD/YYYY) for short format', () => {
      expect(CALENDAR_DATE_FORMATS_SHORT.parse.dateInput).toMatch(/MM.*DD.*YYYY/);
      expect(CALENDAR_DATE_FORMATS_SHORT.display.dateInput).toMatch(/MM.*DD.*YYYY/);
    });

    it('should use long month name format for long format', () => {
      expect(CALENDAR_DATE_FORMATS_LONG.parse.dateInput).toContain('MMMM');
      expect(CALENDAR_DATE_FORMATS_LONG.display.dateInput).toContain('MMMM');
    });
  });
});
