/**
 * Angular Material date formats for CalendarDate.
 *
 * Defines how dates should be displayed and parsed in different contexts.
 *
 * @module calendar-date-formats
 */

import { MatDateFormats } from '@angular/material/core';

/**
 * Standard date formats for CalendarDate with Angular Material.
 *
 * These formats define:
 * - How dates are parsed from user input
 * - How dates are displayed in the input field
 * - How dates are displayed in the calendar popup
 * - How month/year labels are displayed
 *
 * @example
 * ```typescript
 * @Component({
 *   providers: [
 *     { provide: MAT_DATE_FORMATS, useValue: CALENDAR_DATE_FORMATS },
 *   ],
 * })
 * export class DatePickerComponent { }
 * ```
 */
export const CALENDAR_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'YYYY-MM-DD',
  },
  display: {
    dateInput: 'YYYY-MM-DD',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

/**
 * Short date formats (MM/DD/YYYY style).
 */
export const CALENDAR_DATE_FORMATS_SHORT: MatDateFormats = {
  parse: {
    dateInput: 'MM/DD/YYYY',
  },
  display: {
    dateInput: 'MM/DD/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};

/**
 * Long date formats (Month DD, YYYY style).
 */
export const CALENDAR_DATE_FORMATS_LONG: MatDateFormats = {
  parse: {
    dateInput: 'MMMM DD, YYYY',
  },
  display: {
    dateInput: 'MMMM DD, YYYY',
    monthYearLabel: 'MMMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};
