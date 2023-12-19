/*
 * Copyright © 2021 - 2023 Swiss National Data and Service Center for the Humanities and/or DaSCH Service Platform contributors.
 *  SPDX-License-Identifier: Apache-2.0
 */

import namesJson from './names.json';

// Names of weekdays
interface Weekdays {
  long: string[];

  short?: string[];

  narrow?: string[];
}

// Map of locales to weekdays
interface LocaleToWeekdays {
  [locale: string]: Weekdays;
}

// Names of months
interface Months {
  long: string[];

  short?: string[];

  narrow?: string[];
}

// Map of Locales to names of months
interface LocaleToMonths {
  [locale: string]: Months;
}

// Names of weekdays and months for a calendar.
interface Names {
  weekdays: LocaleToWeekdays;

  months: LocaleToMonths;
}

// Map of calendars to names
// of weekdays and months.
interface Calendars {
  [calendar: string]: Names;
}

export namespace JDNConvertibleCalendarNames {
  const defaultLocale = 'en';

  const defaultFormat = 'long';

  const labels: Calendars = namesJson;

  /**
   * Get names of weekdays for the given calendar and the given locale in the given format.
   * Will fall back to the default locale if there are no names available for the preferred locale.
   * Will fall back to long if the preferred format is not available.
   *
   * @param calendar the calendar to get the weekday names for.
   * @param locale the preferred locale.
   * @param format the preferred format.
   */
  export const getWeekdayNames = (
    calendar: 'Gregorian' | 'Julian' | 'Islamic',
    locale: string,
    format: 'long' | 'short' | 'narrow'
  ): string[] => {
    let weekdays: Weekdays;

    // get the weekdays for the given calendar in the preferred locale, if available.
    if (labels[calendar].weekdays.hasOwnProperty(locale)) {
      weekdays = labels[calendar].weekdays[locale];
    } else {
      weekdays = labels[calendar].weekdays[defaultLocale];
    }

    let weekydayNames: string[];

    // get the requested format, if available.
    if (weekdays.hasOwnProperty(format)) {
      weekydayNames = weekdays[format] as string[];
    } else {
      weekydayNames = weekdays[defaultFormat];
    }

    return weekydayNames;
  };

  /**
   * Get names of months for the given calendar and the given locale in the given format.
   * Will fall back to the default locale if there are no names available for the preferred locale.
   * Will fall back to long if the preferred format is not available.
   *
   * @param calendar calendar the calendar to get the month names for.
   * @param locale the preferred locale.
   * @param format the preferred format.
   */
  export const getMonthNames = (
    calendar: 'Gregorian' | 'Julian' | 'Islamic',
    locale: string,
    format: 'long' | 'short' | 'narrow'
  ): string[] => {
    let months: Months;

    // get the month names for the given calendar in the preferred locale, if available.
    if (labels[calendar].months.hasOwnProperty(locale)) {
      months = labels[calendar].months[locale];
    } else {
      months = labels[calendar].months[defaultLocale];
    }

    let monthsNames: string[];

    // get the requested format, if available.
    if (months.hasOwnProperty(format)) {
      monthsNames = months[format] as string[];
    } else {
      monthsNames = months[defaultFormat];
    }

    return monthsNames;
  };
}
