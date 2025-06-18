import { Injectable } from '@angular/core';
import { Constants, KnoraDate, Precision } from '@dasch-swiss/dsp-js';
import {
  CalendarDate,
  CalendarPeriod,
  GregorianCalendarDate,
  IslamicCalendarDate,
  JDNConvertibleCalendar,
  JulianCalendarDate,
} from '@dasch-swiss/jdnconvertiblecalendar';

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
    const date = new CalendarDate(year, month, 1);
    if (calendar === 'GREGORIAN') {
      const calDate = new GregorianCalendarDate(new CalendarPeriod(date, date));
      return calDate.daysInMonth(date);
    } else if (calendar === 'JULIAN') {
      const calDate = new JulianCalendarDate(new CalendarPeriod(date, date));
      return calDate.daysInMonth(date);
    } else if (calendar === 'ISLAMIC') {
      const calDate = new IslamicCalendarDate(new CalendarPeriod(date, date));
      return calDate.daysInMonth(date);
    } else {
      throw Error(`Unknown calendar ${calendar}`);
    }
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
   * given a Knora calendar date, creates a JDN calendar date
   * taking into account precision.
   *
   * @param date the Knora calendar date.
   */
  createJDNCalendarDateFromKnoraDate(date: KnoraDate): JDNConvertibleCalendar {
    let calPeriod: CalendarPeriod;

    const yearAstro = this.convertHistoricalYearToAstronomicalYear(date.year, date.era);

    if (date.precision === Precision.dayPrecision) {
      calPeriod = new CalendarPeriod(
        new CalendarDate(yearAstro, date.month!, date.day!),
        new CalendarDate(yearAstro, date.month!, date.day!)
      );
    } else if (date.precision === Precision.monthPrecision) {
      calPeriod = new CalendarPeriod(
        new CalendarDate(yearAstro, date.month!, 1),
        new CalendarDate(yearAstro, date.month!, this.calculateDaysInMonth(date.calendar, date.year, date.month!))
      );
    } else if (date.precision === Precision.yearPrecision) {
      calPeriod = new CalendarPeriod(
        new CalendarDate(yearAstro, 1, 1),
        new CalendarDate(yearAstro, 12, this.calculateDaysInMonth(date.calendar, date.year, 12))
      );
    } else {
      throw Error('Invalid precision');
    }

    if (date.calendar === 'GREGORIAN') {
      return new GregorianCalendarDate(calPeriod);
    } else if (date.calendar === 'JULIAN') {
      return new JulianCalendarDate(calPeriod);
    } else if (date.calendar === 'ISLAMIC') {
      return new IslamicCalendarDate(calPeriod);
    } else {
      throw Error('Invalid calendar');
    }
  }
}
