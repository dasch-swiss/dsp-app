/*
 * Copyright © 2021 - 2023 Swiss National Data and Service Center for the Humanities and/or DaSCH Service Platform contributors.
 *  SPDX-License-Identifier: Apache-2.0
 */

import { CalendarDate } from './CalendarDate';
import { CalendarPeriod } from './CalendarPeriod';
import { JDNConvertibleConversionModule } from './JDNCalendarConversion';
import { JDNConvertibleCalendarError } from './JDNConvertibleCalendarError';
import { JDNPeriod } from './JDNPeriod';
import { TypeDefinitionsModule } from './TypeDefinitions';
import { Utils } from './Utils';

/**
 * Abstract class representing any calendar
 * that can be converted from and to a Julian Day.
 */
export abstract class JDNConvertibleCalendar {
  /**
   * Constant for the Gregorian calendar.
   */
  protected static readonly gregorian = 'Gregorian';

  /**
   * Constant for the Julian calendar.
   */
  protected static readonly julian = 'Julian';

  /**
   * Constant for the Islamic calendar.
   */
  protected static readonly islamic = 'Islamic';

  /**
   * Supported calendars (to be extended when new subclasses are implemented).
   */
  public static readonly supportedCalendars = [
    JDNConvertibleCalendar.gregorian,
    JDNConvertibleCalendar.julian,
    JDNConvertibleCalendar.islamic,
  ];

  /**
   * Calendar name of a subclass of `JDNConvertibleCalendar`.
   */
  public abstract readonly calendarName: string;

  /**
   * Indicates how many months a year has in a specific calendar.
   */
  public abstract readonly monthsInYear: number;

  /**
   * Indicates if the year 0 exists in a specific calendar.
   */
  public abstract readonly yearZeroExists: boolean;

  //
  // Both calendar dates and JDNs are stored in parallel to avoid unnecessary conversions (JDN to calendar date and possibly back to JDN).
  // Manipulations are exclusively performed by `this.convertJDNPeriodToCalendarPeriod` that keeps them in sync.
  //

  /**
   * Start of a given date in a specific calendar.
   */
  protected calendarStart: CalendarDate;

  /**
   * End of a given date in a specific calendar.
   */
  protected calendarEnd: CalendarDate;

  /**
   * Indicates if the date is exact (start and end of the given period are equal).
   */
  protected exactDate: boolean;

  /**
   * Start of given date as JDN.
   */
  protected jdnStart: TypeDefinitionsModule.JDN;

  /**
   * End of given date as JDN.
   */
  protected jdnEnd: TypeDefinitionsModule.JDN;

  /**
   * Converts a given JDN to a calendar date.
   * This method has to be implemented for each subclass
   * (specific calendar).
   *
   * Attention: depending on the conventions used, there may be a year 0 or not.
   * This depends on the implementation of this conversion function.
   *
   * @param jdn JDN to be converted to a calendar date.
   * @returns calendar date created from given JDN.
   */
  protected abstract JDNToCalendar(
    jdn: TypeDefinitionsModule.JDN
  ): CalendarDate;

  /**
   * Converts a given calendar date to JDN.
   * This method has to be implemented for each subclass
   * (specific calendar).
   *
   * Attention: depending on the conventions used, there may be a year 0 or not.
   * This depends on the implementation of this conversion function.
   *
   * @param date calendar date to be converted to a JDN.
   * @returns JDN created from given calendar date.
   */
  protected abstract calendarToJDN(
    date: CalendarDate
  ): TypeDefinitionsModule.JDN;

  /**
   * Calculates the day of week of a given JDN.
   *
   * @param jdn JDN for which the day of the week is to be calculated.
   * @returns day of week of the given JDN (as a 0-based index).
   */
  protected abstract dayOfWeekFromJDN(jdn: TypeDefinitionsModule.JDN): number;

  /**
   * Calculates number of days for the month of the given date.
   *
   * The given date is expected to be of the same calendar as the instance the method is called on.
   *
   * @param date given date.
   * @returns number of days in month of given date.
   */
  public daysInMonth(date: CalendarDate): number {
    // get JDN for first day of the month of the given calendar date
    const firstDayOfGivenMonth = this.calendarToJDN(
      new CalendarDate(date.year, date.month, 1)
    );

    // first day of next month
    let firstDayOfNextMonth;

    // if the given date is in the last month of the year, switch to first day of the first month the next year.
    if (date.month + 1 > this.monthsInYear) {
      firstDayOfNextMonth = this.calendarToJDN(
        new CalendarDate(date.year + 1, 1, 1)
      );
    } else {
      // switch to the first day of the next month
      firstDayOfNextMonth = this.calendarToJDN(
        new CalendarDate(date.year, date.month + 1, 1)
      );
    }

    // calculate the difference between the first day of the month of the given day
    // and the first day of the next month -> number of days of the month of the given date
    return firstDayOfNextMonth - firstDayOfGivenMonth;
  }

  /**
   * Converts the given JDN period to a calendar period and stores it.
   *
   * This method makes sure that JDNs and calendar dates are in sync. This method has no return value,
   * it manipulates `this.calendarStart`, and `this.calendarEnd` instead.
   *
   * Do not manipulate members `this.exactDate`, `this.jdnStart`, `this.jdnEnd`, `this.calendarStart`, and `this.calendarEnd` directly,
   * use this method instead.
   *
   * @param jdnPeriod the period defined by JDNs to be converted to a calendar period.
   */
  protected convertJDNPeriodToCalendarPeriod(jdnPeriod: JDNPeriod): void {
    this.exactDate = jdnPeriod.exactDate;
    this.jdnStart = jdnPeriod.periodStart;
    this.jdnEnd = jdnPeriod.periodEnd;

    // check if the date is exact (start of period equals end of period)
    if (this.exactDate) {
      // only one conversion needed
      const date: CalendarDate = this.JDNToCalendar(jdnPeriod.periodStart);

      // calculate the day of the week
      const dayOfWeek = this.dayOfWeekFromJDN(jdnPeriod.periodStart);

      const dateWithDayOfWeek = new CalendarDate(
        date.year,
        date.month,
        date.day,
        dayOfWeek
      );

      this.calendarStart = dateWithDayOfWeek;
      this.calendarEnd = dateWithDayOfWeek;
    } else {
      // calculate the days of the week
      const dayOfWeekStart = this.dayOfWeekFromJDN(jdnPeriod.periodStart);
      const dayOfWeekEnd = this.dayOfWeekFromJDN(jdnPeriod.periodEnd);

      const dateStart = this.JDNToCalendar(jdnPeriod.periodStart);
      const dateEnd = this.JDNToCalendar(jdnPeriod.periodEnd);

      // calculate calendar dates for both start and end of period
      this.calendarStart = new CalendarDate(
        dateStart.year,
        dateStart.month,
        dateStart.day,
        dayOfWeekStart
      );
      this.calendarEnd = new CalendarDate(
        dateEnd.year,
        dateEnd.month,
        dateEnd.day,
        dayOfWeekEnd
      );
    }
  }

  /**
   * This constructor is inherited by all subclasses (no implementation in subclass required).
   *
   * The constructor supports two signatures:
   * - period: JDNPeriod creates a date from the given `JDNPeriod` (two JDNs)
   * - period: CalendarPeriod creates a date from the given `CalendarPeriod` (two calendar dates)
   */
  constructor(period: JDNPeriod);
  constructor(period: CalendarPeriod);
  constructor(period: JDNPeriod | CalendarPeriod) {
    // initialize members (required by TypeScript compiler)
    const julianPeriodStart = new CalendarDate(-4712, 1, 1);

    this.calendarStart = julianPeriodStart;

    this.calendarEnd = julianPeriodStart;

    this.exactDate = true;

    this.jdnStart = 0;

    this.jdnEnd = 0;

    if (period instanceof JDNPeriod) {
      // period is a JDNPeriod
      this.convertJDNPeriodToCalendarPeriod(period);
    } else {
      // period is a CalendarPeriod

      const jdnStart = this.calendarToJDN(period.periodStart);
      const jdnEnd = this.calendarToJDN(period.periodEnd);

      this.convertJDNPeriodToCalendarPeriod(new JDNPeriod(jdnStart, jdnEnd));
    }
  }

  /**
   * Returns the given period as two calendar dates.
   *
   * @returns period consisting of two calendar dates.
   */
  public toCalendarPeriod(): CalendarPeriod {
    return new CalendarPeriod(this.calendarStart, this.calendarEnd);
  }

  /**
   * Converts an instance of `JDNConvertibleCalendar` to a `JDNPeriod`.
   *
   * @returns period consisting of two JDNs.
   */
  public toJDNPeriod(): JDNPeriod {
    return new JDNPeriod(this.jdnStart, this.jdnEnd);
  }

  /**
   * Converts from one calendar into another.
   *
   * To be extended when new subclasses are added.
   *
   * @param {"Gregorian" | "Julian" | "Islamic"} toCalendarType calendar to convert to.
   * @returns instance of target calendar (subclass of `JDNConvertibleCalendar`).
   */
  public convertCalendar(
    toCalendarType: 'Gregorian' | 'Julian' | 'Islamic'
  ): JDNConvertibleCalendar {
    if (
      JDNConvertibleCalendar.supportedCalendars.indexOf(toCalendarType) == -1
    ) {
      throw new JDNConvertibleCalendarError(
        'Target calendar not supported: ' + toCalendarType
      );
    }

    if (this.calendarName == toCalendarType) return this; // no conversion needed

    const jdnPeriod: JDNPeriod = this.toJDNPeriod();

    // call constructor of subclass representing the target calendar
    switch (toCalendarType) {
      case JDNConvertibleCalendar.gregorian:
        return new GregorianCalendarDate(jdnPeriod);

      case JDNConvertibleCalendar.julian:
        return new JulianCalendarDate(jdnPeriod);

      case JDNConvertibleCalendar.islamic:
        return new IslamicCalendarDate(jdnPeriod);
    }
  }

  /**
   * Transposes the current period by the given number of days.
   *
   * @param days the number of days that the current period will be shifted.
   */
  public transposePeriodByDay(days: number): void {
    if (days === 0) return;

    if (!Utils.isInteger(days))
      throw new JDNConvertibleCalendarError(
        `parameter "days" is expected to be an integer`
      );

    const currentPeriod = this.toJDNPeriod();

    const newPeriod = new JDNPeriod(
      currentPeriod.periodStart + days,
      currentPeriod.periodEnd + days
    );

    this.convertJDNPeriodToCalendarPeriod(newPeriod);
  }

  /**
   * Transposes the current period by the given number of years.
   *
   * This method is not accurate in the arithmetical sense: it tries to fit the given day in the month of the new year.
   * If this is not possible, it takes the last day of the new month (e.g., February 29 will become the last possible day of February).
   *
   * @param years the number of years that the current period will be shifted.
   */
  public transposePeriodByYear(years: number): void {
    if (years === 0) return;

    if (!Utils.isInteger(years))
      throw new JDNConvertibleCalendarError(
        `parameter "years" is expected to be an integer`
      );

    const currentCalendarPeriod = this.toCalendarPeriod();

    let newJDNPeriod: JDNPeriod;

    // indicates if the shifting is towards the future or the past
    const intoTheFuture: boolean = years > 0;

    if (this.exactDate) {
      let yearZeroCorrection = 0;
      // when switching from a negative to a negative year and the year zero does not exist in the calendar used, correct it.
      if (
        !this.yearZeroExists &&
        intoTheFuture &&
        currentCalendarPeriod.periodStart.year < 1 &&
        currentCalendarPeriod.periodStart.year + years > -1
      ) {
        yearZeroCorrection = 1;
        // when switching from a positive to a negative year and the year zero does not exist in the calendar used, correct it.
      } else if (
        !this.yearZeroExists &&
        !intoTheFuture &&
        currentCalendarPeriod.periodStart.year > -1 &&
        currentCalendarPeriod.periodStart.year + years < 1
      ) {
        yearZeroCorrection = -1;
      }

      // determine max. number of days in the new month
      const maxDaysInNewMonth: number = this.daysInMonth(
        new CalendarDate(
          currentCalendarPeriod.periodStart.year + years + yearZeroCorrection,
          currentCalendarPeriod.periodStart.month,
          1
        )
      );

      const newCalendarDate = new CalendarDate(
        currentCalendarPeriod.periodStart.year + years + yearZeroCorrection,
        currentCalendarPeriod.periodStart.month,
        currentCalendarPeriod.periodStart.day > maxDaysInNewMonth
          ? maxDaysInNewMonth
          : currentCalendarPeriod.periodStart.day
      );

      const newJDN = this.calendarToJDN(newCalendarDate);

      newJDNPeriod = new JDNPeriod(newJDN, newJDN);
    } else {
      let yearZeroCorrectionStart = 0;
      // when switching from a negative to a negative year and the year zero does not exist in the calendar used, correct it.
      if (
        !this.yearZeroExists &&
        intoTheFuture &&
        currentCalendarPeriod.periodStart.year < 1 &&
        currentCalendarPeriod.periodStart.year + years > -1
      ) {
        yearZeroCorrectionStart = 1;
        // when switching from a positive to a negative year and the year zero does not exist in the calendar used, correct it.
      } else if (
        !this.yearZeroExists &&
        !intoTheFuture &&
        currentCalendarPeriod.periodStart.year > -1 &&
        currentCalendarPeriod.periodStart.year + years < 1
      ) {
        yearZeroCorrectionStart = -1;
      }

      // determine max. number of days in the new month
      const maxDaysInNewMonthStart: number = this.daysInMonth(
        new CalendarDate(
          currentCalendarPeriod.periodStart.year +
            years +
            yearZeroCorrectionStart,
          currentCalendarPeriod.periodStart.month,
          1
        )
      );

      const newCalendarDateStart = new CalendarDate(
        currentCalendarPeriod.periodStart.year +
          years +
          yearZeroCorrectionStart,
        currentCalendarPeriod.periodStart.month,
        currentCalendarPeriod.periodStart.day > maxDaysInNewMonthStart
          ? maxDaysInNewMonthStart
          : currentCalendarPeriod.periodStart.day
      );

      const newJDNStart = this.calendarToJDN(newCalendarDateStart);

      let yearZeroCorrectionEnd = 0;
      // when switching from a negative to a negative year and the year zero does not exist in the calendar used, correct it.
      if (
        !this.yearZeroExists &&
        intoTheFuture &&
        currentCalendarPeriod.periodEnd.year < 1 &&
        currentCalendarPeriod.periodEnd.year + years > -1
      ) {
        yearZeroCorrectionEnd = 1;
        // when switching from a positive to a negative year and the year zero does not exist in the calendar used, correct it.
      } else if (
        !this.yearZeroExists &&
        !intoTheFuture &&
        currentCalendarPeriod.periodEnd.year > -1 &&
        currentCalendarPeriod.periodEnd.year + years < 1
      ) {
        yearZeroCorrectionEnd = -1;
      }

      // determine max. number of days in the new month
      const maxDaysInNewMonthEnd: number = this.daysInMonth(
        new CalendarDate(
          currentCalendarPeriod.periodEnd.year + years + yearZeroCorrectionEnd,
          currentCalendarPeriod.periodEnd.month,
          1
        )
      );

      const newCalendarDateEnd = new CalendarDate(
        currentCalendarPeriod.periodEnd.year + years + yearZeroCorrectionEnd,
        currentCalendarPeriod.periodEnd.month,
        currentCalendarPeriod.periodEnd.day > maxDaysInNewMonthEnd
          ? maxDaysInNewMonthEnd
          : currentCalendarPeriod.periodEnd.day
      );

      const newJDNEnd = this.calendarToJDN(newCalendarDateEnd);

      newJDNPeriod = new JDNPeriod(newJDNStart, newJDNEnd);
    }

    this.convertJDNPeriodToCalendarPeriod(newJDNPeriod);
  }

  /**
   * Converts the given calendar date to a new one, shifting the months by the given number.
   *
   * @param calendarDate the given calendar date.
   * @param months the number of months to shift.
   * @returns calendar transposed by the given number of months.
   */
  protected handleMonthTransposition(
    calendarDate: CalendarDate,
    months: number
  ): CalendarDate {
    if (months === 0) return calendarDate;

    if (!Utils.isInteger(months))
      throw new JDNConvertibleCalendarError(
        `parameter "months" is expected to be an integer`
      );

    // indicates if the shifting is towards the future or the past
    const intoTheFuture: boolean = months > 0;

    // get number of full years to shift
    const yearsToShift = Math.floor(Math.abs(months) / this.monthsInYear);

    // get remaining months to shift: max. this.monthsInYear - 1
    const monthsToShift = Math.abs(months) % this.monthsInYear;

    let newCalendarDate: CalendarDate;

    if (intoTheFuture) {
      // switch to the next year if the number of months does not fit
      if (calendarDate.month + monthsToShift > this.monthsInYear) {
        // months to be added to new year
        const monthsOverflow =
          calendarDate.month + monthsToShift - this.monthsInYear;

        // when switching from a negative to a negative year and the year zero does not exist in the calendar used, correct it.
        let yearZeroCorrection = 0;
        if (
          !this.yearZeroExists &&
          calendarDate.year < 1 &&
          calendarDate.year + yearsToShift + 1 > -1
        ) {
          yearZeroCorrection = 1;
        }

        // determine max. number of days in the new month
        const maxDaysInNewMonth: number = this.daysInMonth(
          new CalendarDate(
            calendarDate.year + yearsToShift + 1 + yearZeroCorrection,
            monthsOverflow,
            1
          )
        );

        newCalendarDate = new CalendarDate(
          calendarDate.year + yearsToShift + 1 + yearZeroCorrection, // add an extra year
          monthsOverflow,
          calendarDate.day > maxDaysInNewMonth
            ? maxDaysInNewMonth
            : calendarDate.day
        );
      } else {
        // determine max. number of days in the new month
        const maxDaysInNewMonth = this.daysInMonth(
          new CalendarDate(
            calendarDate.year + yearsToShift,
            calendarDate.month + monthsToShift,
            1
          )
        );

        newCalendarDate = new CalendarDate(
          calendarDate.year + yearsToShift,
          calendarDate.month + monthsToShift,
          calendarDate.day > maxDaysInNewMonth
            ? maxDaysInNewMonth
            : calendarDate.day
        );
      }
    } else {
      // switch to the previous year if the number of months does not fit
      if (calendarDate.month - monthsToShift < 1) {
        // months to be subtracted from the previous year
        const newMonth =
          this.monthsInYear - (monthsToShift - calendarDate.month);

        // when switching from a positive to a negative year and the year zero does not exist in the calendar used, correct it.
        let yearZeroCorrection = 0;
        if (
          !this.yearZeroExists &&
          calendarDate.year > -1 &&
          calendarDate.year - yearsToShift - 1 < 1
        ) {
          yearZeroCorrection = -1;
        }

        // determine max. number of days in the new month
        const maxDaysInNewMonth = this.daysInMonth(
          new CalendarDate(
            calendarDate.year - yearsToShift - 1 + yearZeroCorrection,
            newMonth,
            1
          )
        );

        newCalendarDate = new CalendarDate(
          calendarDate.year - yearsToShift - 1 + yearZeroCorrection, // subtract an extra year
          newMonth,
          calendarDate.day > maxDaysInNewMonth
            ? maxDaysInNewMonth
            : calendarDate.day
        );
      } else {
        // determine max. number of days in the new month
        const maxDaysInNewMonth = this.daysInMonth(
          new CalendarDate(
            calendarDate.year - yearsToShift,
            calendarDate.month - monthsToShift,
            1
          )
        );

        newCalendarDate = new CalendarDate(
          calendarDate.year - yearsToShift,
          calendarDate.month - monthsToShift,
          calendarDate.day > maxDaysInNewMonth
            ? maxDaysInNewMonth
            : calendarDate.day
        );
      }
    }

    return newCalendarDate;
  }

  /**
   * Transposes the current period by the given number of months.
   *
   * This method is not accurate in the arithmetical sense: it tries to fit the given day in the new month.
   * If this is not possible, it takes the last day of the new month (e.g., January 31 will become the last possible day of February).
   *
   * @param months the number of months that the current period will be shifted.
   */
  public transposePeriodByMonth(months: number): void {
    if (months === 0) return;

    if (!Utils.isInteger(months))
      throw new JDNConvertibleCalendarError(
        `parameter "months" is expected to be an integer`
      );

    const currentCalendarPeriod = this.toCalendarPeriod();

    let newJDNPeriod: JDNPeriod;

    if (this.exactDate) {
      const newCalDate = this.handleMonthTransposition(
        currentCalendarPeriod.periodStart,
        months
      );

      const newJDN = this.calendarToJDN(newCalDate);

      newJDNPeriod = new JDNPeriod(newJDN, newJDN);
    } else {
      const newCalDateStart = this.handleMonthTransposition(
        currentCalendarPeriod.periodStart,
        months
      );

      const newJDNStart = this.calendarToJDN(newCalDateStart);

      const newCalDateEnd = this.handleMonthTransposition(
        currentCalendarPeriod.periodEnd,
        months
      );

      const newJDNEnd = this.calendarToJDN(newCalDateEnd);

      newJDNPeriod = new JDNPeriod(newJDNStart, newJDNEnd);
    }

    this.convertJDNPeriodToCalendarPeriod(newJDNPeriod);
  }
}

/**
 * Represents a Gregorian calendar date.
 */
export class GregorianCalendarDate extends JDNConvertibleCalendar {
  public readonly calendarName = JDNConvertibleCalendar.gregorian;

  public readonly monthsInYear = 12;

  // We use calendar conversion methods that use the convention
  // that the year zero exists in the Gregorian Calendar.
  public readonly yearZeroExists = true;

  protected JDNToCalendar(jdn: TypeDefinitionsModule.JDN): CalendarDate {
    return JDNConvertibleConversionModule.JDNToGregorian(jdn);
  }

  protected calendarToJDN(date: CalendarDate): TypeDefinitionsModule.JDN {
    return JDNConvertibleConversionModule.gregorianToJDN(date);
  }

  protected dayOfWeekFromJDN(jdn: number): number {
    return JDNConvertibleConversionModule.dayOfWeekFromJDC(jdn);
  }
}

/**
 * Represents a Julian calendar date.
 */
export class JulianCalendarDate extends JDNConvertibleCalendar {
  public readonly calendarName = JDNConvertibleCalendar.julian;

  public readonly monthsInYear = 12;

  // We use calendar conversion methods that use the convention
  // that the year zero does exist in the Julian Calendar.
  public readonly yearZeroExists = true;

  protected JDNToCalendar(jdn: TypeDefinitionsModule.JDN): CalendarDate {
    return JDNConvertibleConversionModule.JDNToJulian(jdn);
  }

  protected calendarToJDN(date: CalendarDate): TypeDefinitionsModule.JDN {
    return JDNConvertibleConversionModule.julianToJDN(date);
  }

  protected dayOfWeekFromJDN(jdn: TypeDefinitionsModule.JDN): number {
    return JDNConvertibleConversionModule.dayOfWeekFromJDC(jdn);
  }
}

/**
 * Represents an Islamic calendar date.
 */
export class IslamicCalendarDate extends JDNConvertibleCalendar {
  public readonly calendarName = JDNConvertibleCalendar.islamic;

  public readonly monthsInYear = 12;

  // We use calendar conversion methods that use the convention
  // that the year zero does exist in the Julian Calendar.
  public readonly yearZeroExists = true;

  protected JDNToCalendar(jdn: TypeDefinitionsModule.JDN): CalendarDate {
    return JDNConvertibleConversionModule.JDNToIslamic(jdn);
  }

  protected calendarToJDN(date: CalendarDate): TypeDefinitionsModule.JDN {
    return JDNConvertibleConversionModule.islamicToJDN(date);
  }

  protected dayOfWeekFromJDN(jdn: TypeDefinitionsModule.JDN): number {
    return JDNConvertibleConversionModule.dayOfWeekFromJDC(jdn);
  }
}
