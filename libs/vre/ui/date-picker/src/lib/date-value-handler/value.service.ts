import { Injectable } from '@angular/core';
import { Constants, KnoraDate, Precision } from '@dasch-swiss/dsp-js';
import { CalendarDate, createDate, getCalendar } from '@dasch-swiss/vre/shared/calendar';

@Injectable({
  providedIn: 'root',
})
export class ValueService {
  constants = Constants;

  /**
   * calculates the number of days in a month for a given year.
   *
   * @param calendar the date's calendar.
   * @param year the date's year.
   * @param month the date's month.
   */
  calculateDaysInMonth(calendar: string, year: number, month: number): number {
    const calendarSystem = calendar.toUpperCase() as 'GREGORIAN' | 'JULIAN' | 'ISLAMIC';
    const cal = getCalendar(calendarSystem);
    return cal.daysInMonth(year, month);
  }

  /**
   * given a historical date (year), returns the astronomical year.
   *
   * @param year year of the given date.
   * @param era era of the given date.
   */
  convertHistoricalYearToAstronomicalYear(year: number, era: string) {
    let yearAstro = year;
    if (era === 'BCE') {
      // convert historical date to astronomical date
      yearAstro = yearAstro * -1 + 1;
    }
    return yearAstro;
  }

  /**
   * given a Knora calendar date, creates a calendar date
   * taking into account precision.
   *
   * @param date the Knora calendar date.
   * @returns CalendarDate representing the date with precision
   */
  createJDNCalendarDateFromKnoraDate(date: KnoraDate): CalendarDate {
    const yearAstro = this.convertHistoricalYearToAstronomicalYear(date.year, date.era);
    const calendarSystem = date.calendar.toUpperCase() as 'GREGORIAN' | 'JULIAN' | 'ISLAMIC';
    const era = date.era === 'BCE' ? 'BCE' : date.era === 'noEra' ? 'NONE' : 'CE';

    if (date.precision === Precision.dayPrecision) {
      // Full date precision
      return createDate(calendarSystem, yearAstro, date.month!, date.day!, era as any);
    } else if (date.precision === Precision.monthPrecision) {
      // Month precision - use first day of month
      return createDate(calendarSystem, yearAstro, date.month!, undefined, era as any);
    } else if (date.precision === Precision.yearPrecision) {
      // Year precision only
      return createDate(calendarSystem, yearAstro, undefined, undefined, era as any);
    } else {
      throw Error('Invalid precision');
    }
  }
}
