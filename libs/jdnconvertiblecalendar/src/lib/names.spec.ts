/*
 * Copyright © 2021 - 2023 Swiss National Data and Service Center for the Humanities and/or DaSCH Service Platform contributors.
 *  SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert';
import { JDNConvertibleCalendarNames } from './JDNCalendarNames';

describe('get weekday names', () => {
  it("get weekdays for the Gregorian calendar using the locale 'en' in long format", () => {
    const weekdays = JDNConvertibleCalendarNames.getWeekdayNames(
      'Gregorian',
      'en',
      'long'
    );

    assert.deepStrictEqual(weekdays, [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]);
  });

  it("get weekdays for the Gregorian calendar using the locale 'en' in short format", () => {
    const weekdays = JDNConvertibleCalendarNames.getWeekdayNames(
      'Gregorian',
      'en',
      'short'
    );

    assert.deepStrictEqual(weekdays, [
      'Sun',
      'Mon',
      'Tue',
      'Wed',
      'Thur',
      'Fri',
      'Sat',
    ]);
  });

  it("get weekdays for the Gregorian calendar using the locale 'en' in narrow format", () => {
    const weekdays = JDNConvertibleCalendarNames.getWeekdayNames(
      'Gregorian',
      'en',
      'narrow'
    );

    assert.deepStrictEqual(weekdays, ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa']);
  });

  it("get weekdays for the Gregorian calendar using the locale 'de' in long format", () => {
    const weekdays = JDNConvertibleCalendarNames.getWeekdayNames(
      'Gregorian',
      'de',
      'long'
    );

    assert.deepStrictEqual(weekdays, [
      'Sonntag',
      'Montag',
      'Dienstag',
      'Mittwoch',
      'Donnerstag',
      'Freitag',
      'Sonntag',
    ]);
  });

  it("get weekdays for the Gregorian calendar using the locale 'de' in short format", () => {
    const weekdays = JDNConvertibleCalendarNames.getWeekdayNames(
      'Gregorian',
      'de',
      'short'
    );

    assert.deepStrictEqual(weekdays, [
      'So',
      'Mo',
      'Di',
      'Mi',
      'Do',
      'Fr',
      'Sa',
    ]);
  });

  it("get weekdays for the Gregorian calendar using the locale 'de' in narrow format", () => {
    const weekdays = JDNConvertibleCalendarNames.getWeekdayNames(
      'Gregorian',
      'de',
      'narrow'
    );

    assert.deepStrictEqual(weekdays, [
      'So',
      'Mo',
      'Di',
      'Mi',
      'Do',
      'Fr',
      'Sa',
    ]);
  });

  it("use English as fallback when attempting to get weekdays for the Gregorian calendar using the non existing locale 'la' in long format", () => {
    const weekdays = JDNConvertibleCalendarNames.getWeekdayNames(
      'Gregorian',
      'la',
      'long'
    );

    assert.deepStrictEqual(weekdays, [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]);
  });
});

describe('get months names', () => {
  it("get months for the Gregorian calendar using the locale 'en' in long format", () => {
    const months = JDNConvertibleCalendarNames.getMonthNames(
      'Gregorian',
      'en',
      'long'
    );

    assert.deepStrictEqual(months, [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]);
  });

  it("get months for the Gregorian calendar using the locale 'en' in short format", () => {
    const months = JDNConvertibleCalendarNames.getMonthNames(
      'Gregorian',
      'en',
      'short'
    );

    assert.deepStrictEqual(months, [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'June',
      'July',
      'Aug',
      'Sept',
      'Oct',
      'Nov',
      'Dec',
    ]);
  });

  it("get months for the Islamic calendar using the locale 'ar' in long format", () => {
    const months = JDNConvertibleCalendarNames.getMonthNames(
      'Islamic',
      'ar',
      'long'
    );

    assert.deepStrictEqual(months, [
      'محرم',
      'صفر',
      'ربيع الأول',
      'ربيع الثاني',
      'جمادى الأولى',
      'جمادى الآخرة',
      'رجب',
      'شعبان',
      'رمضان',
      'شوال',
      'ذو القعدة',
      'ذو الججة',
    ]);
  });

  it("use long format as a fallback  when attempting to get months for the Islamic calendar using the locale 'ar' in short format", () => {
    const months = JDNConvertibleCalendarNames.getMonthNames(
      'Islamic',
      'ar',
      'short'
    );

    assert.deepStrictEqual(months, [
      'محرم',
      'صفر',
      'ربيع الأول',
      'ربيع الثاني',
      'جمادى الأولى',
      'جمادى الآخرة',
      'رجب',
      'شعبان',
      'رمضان',
      'شوال',
      'ذو القعدة',
      'ذو الججة',
    ]);
  });

  it("use English as fallback when attempting to get months for the Gregorian calendar using the non existing locale 'la' in long format", () => {
    const weekdays = JDNConvertibleCalendarNames.getMonthNames(
      'Gregorian',
      'la',
      'long'
    );

    assert.deepStrictEqual(weekdays, [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ]);
  });
});
