import { Injectable } from '@angular/core';
import { Constants, KnoraDate, KnoraPeriod, Precision } from '@dasch-swiss/dsp-js';
import {
  CALENDAR_SYSTEMS,
  CalendarDate,
  CalendarSystem,
  convertCalendarResult,
  createDate,
  getCalendar,
  isEqual,
} from '@dasch-swiss/vre/shared/calendar';

/**
 * A date value seen through a calendar other than the one it is stored in.
 *
 * `end` is present only when the source covers a range in the target calendar — a Julian year
 * straddling two Gregorian ones, say. Keeping it optional is what stops a caller printing a single
 * date for something the source never pinned down that precisely.
 */
export interface ConvertedKnoraDate {
  readonly start: KnoraDate;
  readonly end?: KnoraDate;
}

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
   * given an astronomical year, returns the historical year and its era.
   *
   * The inverse of {@link convertHistoricalYearToAstronomicalYear}. There is no year zero in
   * historical dating — 1 BCE is followed directly by 1 CE — so astronomical year 0 is 1 BCE,
   * −1 is 2 BCE, and so on. Getting this backwards is a one-year error on every pre-CE date, which
   * is what took down the adapter removed in #3441.
   *
   * @param yearAstro astronomical year, which may be zero or negative.
   * @param calendar the target calendar; the Islamic calendar carries no era.
   */
  convertAstronomicalYearToHistoricalYear(yearAstro: number, calendar: CalendarSystem): { year: number; era: string } {
    if (calendar === 'ISLAMIC') {
      return { year: yearAstro, era: 'noEra' };
    }
    return yearAstro > 0 ? { year: yearAstro, era: 'CE' } : { year: -yearAstro + 1, era: 'BCE' };
  }

  /**
   * builds a KnoraDate from a calendar date, preserving precision and era.
   *
   * The inverse of {@link createJDNCalendarDateFromKnoraDate}. The two type systems spell the
   * absent era differently — `NONE` here, `noEra` in KnoraDate — so the mapping is explicit.
   *
   * @param date the calendar date.
   */
  createKnoraDateFromCalendarDate(date: CalendarDate): KnoraDate {
    const { year, era } = this.convertAstronomicalYearToHistoricalYear(date.year, date.calendar);
    return new KnoraDate(date.calendar, era, year, date.month, date.day);
  }

  /**
   * shows a date in another calendar, as a single date or as the span it covers.
   *
   * Returns `undefined` when the target calendar cannot represent the date at all — a pre-Hijra
   * date has no Islamic form. Callers offer only the calendars {@link availableCalendarsFor}
   * reports, so a reader is never handed this case, but a caller that ignores that still cannot
   * accidentally render a fabricated date.
   *
   * @param date the date to show.
   * @param calendar the calendar to show it in.
   */
  convertKnoraDateTo(date: KnoraDate, calendar: CalendarSystem): ConvertedKnoraDate | undefined {
    const result = convertCalendarResult(this.createJDNCalendarDateFromKnoraDate(date), calendar);

    if (result.kind === 'refused') {
      return undefined;
    }
    if (result.kind === 'exact') {
      return { start: this.createKnoraDateFromCalendarDate(result.date) };
    }
    return {
      start: this.createKnoraDateFromCalendarDate(result.start),
      end: this.createKnoraDateFromCalendarDate(result.end),
    };
  }

  /**
   * which calendars a date value can be shown in.
   *
   * The stored calendar is always among them. A period is representable only where both of its
   * ends are, because a period carries one calendar for the whole value.
   *
   * @param value the date or period.
   */
  availableCalendarsFor(value: KnoraDate | KnoraPeriod): CalendarSystem[] {
    const dates = value instanceof KnoraPeriod ? [value.start, value.end] : [value];

    return CALENDAR_SYSTEMS.filter(calendar =>
      dates.every(date => this.convertKnoraDateTo(date, calendar) !== undefined)
    );
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
