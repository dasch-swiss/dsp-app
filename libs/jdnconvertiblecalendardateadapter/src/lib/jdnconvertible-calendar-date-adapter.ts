/*
 * Copyright © 2021 - 2023 Swiss National Data and Service Center for the Humanities and/or DaSCH Service Platform contributors.
 *  SPDX-License-Identifier: Apache-2.0
 */

import { Inject, Injectable, Optional } from '@angular/core';
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import {
  CalendarDate,
  CalendarPeriod,
  GregorianCalendarDate,
  JDNConvertibleCalendar,
  JulianCalendarDate,
  IslamicCalendarDate,
  JDNConvertibleCalendarNames,
} from '@dasch-swiss/jdnconvertiblecalendar';
import { ACTIVE_CALENDAR } from './active_calendar_token';

/**
 * Implements `DateAdapter` for `JDNConvertibleCalendar`.
 *
 * `JDNConvertibleCalendar` supports periods (dates with different precisions), but here only exact days are supported for now.
 */
@Injectable()
export class JDNConvertibleCalendarDateAdapter extends DateAdapter<JDNConvertibleCalendar> {
  private static readonly DD_MM_YYYY = 'DD-MM-YYYY';

  private static readonly MM_YYYY = 'MM-YYYY';

  private static readonly displayDateFormats = [
    JDNConvertibleCalendarDateAdapter.DD_MM_YYYY,
    JDNConvertibleCalendarDateAdapter.MM_YYYY,
  ];

  private static readonly parsableDateFormats = [JDNConvertibleCalendarDateAdapter.DD_MM_YYYY];

  private static readonly dateFormatRegexes = {
    'DD-MM-YYYY': new RegExp('^(\\d?\\d)-(\\d?\\d)-(\\d{4})'),
  };

  static defaultLocale = 'en';

  // the currently active calendar, assume Gregorian
  private _activeCalendar: 'Gregorian' | 'Julian' | 'Islamic' = 'Gregorian';

  get activeCalendar(): 'Gregorian' | 'Julian' | 'Islamic' {
    return this._activeCalendar;
  }

  set activeCalendar(cal: 'Gregorian' | 'Julian' | 'Islamic') {
    this._activeCalendar = cal;
  }

  constructor(
    @Optional() @Inject(MAT_DATE_LOCALE) dateLocale: string,
    @Inject(ACTIVE_CALENDAR) private activeCalendarToken
  ) {
    super();

    this.setLocale(dateLocale || JDNConvertibleCalendarDateAdapter.defaultLocale);

    // get active calendar from token
    this.activeCalendarToken.subscribe((activeCal: 'Gregorian' | 'Julian' | 'Islamic') => {
      if (JDNConvertibleCalendar.supportedCalendars.indexOf(activeCal) === -1) {
        throw Error('Invalid value for token ACTIVE_CALENDAR: ' + activeCal);
      }

      this.activeCalendar = activeCal;
    });
  }

  /**
   * Adds leading zeros to a given number and returns the resulting string.
   *
   * @param num the given number.
   * @param digits the number of expected digits.
   * @returns string containing leading zeros.
   */
  private static addLeadingZeroToNumber(num: number, digits: number): string {
    const missingDigits = digits - String(num).length;

    if (missingDigits > 0) {
      let leadingZeros = '';
      for (let i = 0; i < missingDigits; i++) {
        leadingZeros += '0';
      }

      return `${leadingZeros}${num}`;
    } else {
      return String(num);
    }
  }

  override setLocale(locale: string) {
    // make locale a two character string
    let shortLocale;

    if (locale.length > 2) {
      shortLocale = locale.substring(0, 2);
    } else {
      shortLocale = locale;
    }

    super.setLocale(shortLocale);
  }

  /**
   * Converts the given date to the indicated calendar.
   *
   * @param date the date to be converted.
   * @param calendar the calendar format to convert to.
   * @returns converted date.
   */
  convertCalendar(date: JDNConvertibleCalendar, calendar: string): JDNConvertibleCalendar {
    // another instance has to be returned, otherwise "activeDate" set method is not triggered for MatYearView

    const dateMod: JDNConvertibleCalendar = this.clone(date);

    switch (calendar) {
      case 'Gregorian':
        this.activeCalendar = 'Gregorian';
        return dateMod.convertCalendar('Gregorian');

      case 'Julian':
        this.activeCalendar = 'Julian';
        return dateMod.convertCalendar('Julian');

      case 'Islamic':
        this.activeCalendar = 'Islamic';
        return dateMod.convertCalendar('Islamic');

      default:
        // invalid format
        return dateMod;
    }
  }

  getYear(date: JDNConvertibleCalendar): number {
    return date.toCalendarPeriod().periodStart.year;
  }

  getMonth(date: JDNConvertibleCalendar): number {
    // return 0 index based month
    return date.toCalendarPeriod().periodStart.month - 1;
  }

  getDate(date: JDNConvertibleCalendar): number {
    return date.toCalendarPeriod().periodStart.day;
  }

  getDayOfWeek(date: JDNConvertibleCalendar): number {
    // dayOfWeek is an optional class member, but always set when returned by this method
    const dayOfWeek: number | undefined = date.toCalendarPeriod().periodStart.dayOfWeek;

    if (dayOfWeek !== undefined) {
      return dayOfWeek;
    } else {
      throw new Error('day of week is not set although it should be');
    }
  }

  getMonthNames(style: 'long' | 'short' | 'narrow'): string[] {
    if (this.activeCalendar === 'Julian' || this.activeCalendar === 'Gregorian') {
      return JDNConvertibleCalendarNames.getMonthNames('Gregorian', this.locale, style);
    } else if (this.activeCalendar === 'Islamic') {
      return JDNConvertibleCalendarNames.getMonthNames('Islamic', this.locale, style);
    }
  }

  getDateNames(): string[] {
    // TODO: implement this properly, taking calendar and locale into account
    const dateNames: string[] = [];
    for (let i = 1; i <= 31; i++) {
      dateNames.push(String(i));
    }

    return dateNames;
  }

  getDayOfWeekNames(style: 'long' | 'short' | 'narrow') {
    if (this.activeCalendar === 'Julian' || this.activeCalendar === 'Gregorian') {
      return JDNConvertibleCalendarNames.getWeekdayNames('Gregorian', this.locale, style);
    } else if (this.activeCalendar === 'Islamic') {
      return JDNConvertibleCalendarNames.getWeekdayNames('Islamic', this.locale, style);
    }
  }

  getYearName(date: JDNConvertibleCalendar): string {
    return String(date.toCalendarPeriod().periodStart.year);
  }

  getFirstDayOfWeek(): number {
    // TODO: implement this properly, taking calendar into account
    return 0;
  }

  getNumDaysInMonth(date: JDNConvertibleCalendar): number {
    const calendarPeriod = date.toCalendarPeriod();

    return date.daysInMonth(calendarPeriod.periodStart);
  }

  clone(date: JDNConvertibleCalendar): JDNConvertibleCalendar {
    const jdnPeriod = date.toJDNPeriod();

    switch (this.activeCalendar) {
      case 'Gregorian':
        return new GregorianCalendarDate(jdnPeriod);

      case 'Julian':
        return new JulianCalendarDate(jdnPeriod);

      case 'Islamic':
        return new IslamicCalendarDate(jdnPeriod);
    }
  }

  /**
   * Creates a date in the specified calendar.
   *
   * @param year the date's year.
   * @param month the date's month (0-based index).
   * @param date the date's day.
   * @param calendar the calendar to be used.
   * @returns a date in the specified calendar.
   */
  private createCalendarDate(year: number, month: number, date: number, calendar: string): JDNConvertibleCalendar {
    if (month < 0 || month > 11) {
      throw Error(`Invalid month index "${month}". Month index has to be between 0 and 11.`);
    }

    if (date < 1) {
      throw Error(`Invalid date "${date}". Date has to be at least 1.`);
    }

    // month param is 0 indexed, but we use 1 based index for months
    const calDate = new CalendarDate(year, month + 1, date);

    switch (calendar) {
      case 'Gregorian':
        return new GregorianCalendarDate(new CalendarPeriod(calDate, calDate));

      case 'Julian':
        return new JulianCalendarDate(new CalendarPeriod(calDate, calDate));

      case 'Islamic':
        return new IslamicCalendarDate(new CalendarPeriod(calDate, calDate));
    }
  }

  createDate(year: number, month: number, date: number): JDNConvertibleCalendar {
    // create a date in the active calendar
    return this.createCalendarDate(year, month, date, this.activeCalendar);
  }

  today(): JDNConvertibleCalendar {
    // get today's date from the native JS Date object
    const today: Date = new Date();

    const year = today.getFullYear();

    // 0 based month
    const month = today.getMonth();

    // day of month, 1 based index
    const day = today.getDate();

    // create a Gregorian calendar date from the native JS object
    // month used a 1 based index
    const calDate = new CalendarDate(year, month + 1, day);

    const dateGregorian = new GregorianCalendarDate(new CalendarPeriod(calDate, calDate));

    // convert the date to the active calendar
    const date: JDNConvertibleCalendar = this.convertCalendar(dateGregorian, this.activeCalendar);

    return date;
  }

  parse(value: any, parseFormat: any): JDNConvertibleCalendar | null {
    let date;
    if (
      parseFormat !== undefined &&
      typeof parseFormat === 'string' &&
      JDNConvertibleCalendarDateAdapter.parsableDateFormats.indexOf(parseFormat) !== -1
    ) {
      switch (parseFormat) {
        case JDNConvertibleCalendarDateAdapter.DD_MM_YYYY: {
          const dateStringRegex = JDNConvertibleCalendarDateAdapter.dateFormatRegexes[parseFormat];

          const parsed: Array<any> | null = dateStringRegex.exec(value);

          if (parsed !== null) {
            // index 0 is the whole match

            // month index must be 0 based
            date = this.createDate(parseInt(parsed[3]), parseInt(parsed[2]) - 1, parseInt(parsed[1]));
            break;
          } else {
            console.log(`Error: parsing of date string failed: ${value}`);
            return null;
          }
        }
        default: {
          console.log(`Error: supported parsable format was not handled correctly: ${parseFormat}`);
          return null;
        }
      }
    } else {
      console.log(`Error: unknown parseFormat ${parseFormat}`);
      return null;
    }

    return date;
  }

  format(date: JDNConvertibleCalendar, displayFormat: any): string {
    let dateString = '';
    if (
      displayFormat !== undefined &&
      typeof displayFormat === 'string' &&
      JDNConvertibleCalendarDateAdapter.displayDateFormats.lastIndexOf(displayFormat) !== -1
    ) {
      const calendarPeriod = date.toCalendarPeriod();

      switch (displayFormat) {
        case JDNConvertibleCalendarDateAdapter.DD_MM_YYYY: {
          dateString = `${JDNConvertibleCalendarDateAdapter.addLeadingZeroToNumber(
            calendarPeriod.periodStart.day,
            2
          )}-${JDNConvertibleCalendarDateAdapter.addLeadingZeroToNumber(
            calendarPeriod.periodStart.month,
            2
          )}-${JDNConvertibleCalendarDateAdapter.addLeadingZeroToNumber(calendarPeriod.periodStart.year, 4)}`;
          break;
        }

        case JDNConvertibleCalendarDateAdapter.MM_YYYY: {
          dateString = `${JDNConvertibleCalendarDateAdapter.addLeadingZeroToNumber(
            calendarPeriod.periodStart.month,
            2
          )}-${JDNConvertibleCalendarDateAdapter.addLeadingZeroToNumber(calendarPeriod.periodStart.year, 4)}`;
          break;
        }

        default: {
          console.log(`Error: supported display format was not handled correctly: ${displayFormat}`);
        }
      }
    } else {
      console.log(`Error: unknown displayFormat ${displayFormat}`);
    }

    return dateString;
  }

  addCalendarYears(date: JDNConvertibleCalendar, years: number): JDNConvertibleCalendar {
    // another instance has to be returned, otherwise "activeDate" set method is not triggered for MatYearView

    const dateMod = this.clone(date);

    dateMod.transposePeriodByYear(years);

    return dateMod;
  }

  addCalendarMonths(date: JDNConvertibleCalendar, months: number): JDNConvertibleCalendar {
    // another instance has to be returned, otherwise "activeDate" set method is not triggered for MatMonthView

    const dateMod = this.clone(date);

    dateMod.transposePeriodByMonth(months);

    return dateMod;
  }

  addCalendarDays(date: JDNConvertibleCalendar, days: number): JDNConvertibleCalendar {
    // another instance has to be returned, otherwise events do not work correctly

    const dateMod = this.clone(date);

    dateMod.transposePeriodByDay(days);

    return dateMod;
  }

  toIso8601(date: JDNConvertibleCalendar) {
    // use Gregorian
    const gregorianCal = date.convertCalendar('Gregorian');

    const gregorianCalPeriod = gregorianCal.toCalendarPeriod();

    return `${JDNConvertibleCalendarDateAdapter.addLeadingZeroToNumber(
      gregorianCalPeriod.periodStart.year,
      4
    )}-${JDNConvertibleCalendarDateAdapter.addLeadingZeroToNumber(
      gregorianCalPeriod.periodStart.month,
      2
    )}-${JDNConvertibleCalendarDateAdapter.addLeadingZeroToNumber(gregorianCalPeriod.periodStart.day, 2)}`;
  }

  isDateInstance(obj: any): boolean {
    return obj instanceof JDNConvertibleCalendar;
  }

  isValid(date: JDNConvertibleCalendar): boolean {
    // TODO: implement this properly

    return true;
  }

  invalid(): JDNConvertibleCalendar {
    // TODO: create an invalid instance? For testing?

    return this.today();
  }
}
