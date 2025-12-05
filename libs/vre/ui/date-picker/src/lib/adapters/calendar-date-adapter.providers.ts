/**
 * Provider function for CalendarDateAdapter.
 *
 * Use this to configure Angular Material datepickers to work with CalendarDate.
 * This replaces the need for a separate module.
 *
 * @example
 * ```typescript
 * // In app.module.ts or component providers:
 * @NgModule({
 *   providers: [
 *     ...provideCalendarDateAdapter(),
 *   ]
 * })
 * ```
 */
import { Provider } from '@angular/core';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { CALENDAR_DATE_FORMATS } from './calendar-date-formats';
import { CalendarDateAdapter } from './calendar-date.adapter';

/**
 * Provides the CalendarDateAdapter for Angular Material datepickers.
 *
 * This is the modern, recommended way to configure the date adapter.
 * No NgModule needed - just spread this into your providers array.
 */
export function provideCalendarDateAdapter(): Provider[] {
  return [
    {
      provide: DateAdapter,
      useClass: CalendarDateAdapter,
      deps: [MAT_DATE_LOCALE],
    },
    {
      provide: MAT_DATE_FORMATS,
      useValue: CALENDAR_DATE_FORMATS,
    },
  ];
}
