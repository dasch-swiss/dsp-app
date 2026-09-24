import { Injectable } from '@angular/core';
import { Constants, KnoraDate, KnoraPeriod, Precision } from '@dasch-swiss/dsp-js';
import { CalendarDate, createDate, getCalendar, isEqual } from '@dasch-swiss/vre/shared/calendar';

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

  /**
   * whether two dates denote the same instant, whatever calendar represents them.
   *
   * Converting a date to another calendar rewrites every field while meaning the same day:
   * 15.06.2024 Gregorian and 02.06.2024 Julian are one instant. Comparing the fields therefore
   * reports a change the user never made, which is why a calendar switch must be measured this
   * way and not by equality of `calendar`, `year`, `month` and `day`.
   *
   * Precision is part of what a date says, so a year and a day inside it are not the same instant.
   *
   * @param a the first date.
   * @param b the second date.
   */
  knoraDatesDenoteSameInstant(a: KnoraDate, b: KnoraDate): boolean {
    if (a.precision !== b.precision) {
      return false;
    }
    return isEqual(this.createJDNCalendarDateFromKnoraDate(a), this.createJDNCalendarDateFromKnoraDate(b));
  }

  /**
   * whether two date values denote the same instant, for single dates and periods alike.
   *
   * A period equals another period when both ends do; a period never equals a single date.
   *
   * @param a the first value.
   * @param b the second value.
   */
  dateValuesDenoteSameInstant(
    a: KnoraDate | KnoraPeriod | null | undefined,
    b: KnoraDate | KnoraPeriod | null | undefined
  ): boolean {
    if (a == null || b == null) {
      return a == null && b == null;
    }

    const aIsPeriod = a instanceof KnoraPeriod;
    const bIsPeriod = b instanceof KnoraPeriod;

    if (aIsPeriod !== bIsPeriod) {
      return false;
    }

    if (aIsPeriod && bIsPeriod) {
      return this.knoraDatesDenoteSameInstant(a.start, b.start) && this.knoraDatesDenoteSameInstant(a.end, b.end);
    }

    return this.knoraDatesDenoteSameInstant(a as KnoraDate, b as KnoraDate);
  }
}
