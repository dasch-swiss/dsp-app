/*
 * Copyright © 2021 - 2023 Swiss National Data and Service Center for the Humanities and/or DaSCH Service Platform contributors.
 *  SPDX-License-Identifier: Apache-2.0
 */

import { CalendarDate } from './CalendarDate';
import { TypeDefinitionsModule } from './TypeDefinitions';

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace JDNConvertibleConversionModule {
  /**
   * Removes the fraction from a given number (<https://stackoverflow.com/questions/4912788/truncate-not-round-off-decimal-numbers-in-javascript/9232092#9232092>).
   * This also works for negative numbers.
   *
   * 1.2 -> 1
   * -3.2 -> -3
   *
   * @param num the number whose fraction is to be removed.
   * @returns given number without fractions.
   */
  const truncateDecimals = (num: number): number => Math[num < 0 ? 'ceil' : 'floor'](num);

  /**
   * Converts a Gregorian calendar date to a JDC.
   *
   * Conversion algorithm from:
   * Jean Meeus, Astronomical Algorithms, 1998, 60pp.
   *
   * There is a year 0.
   *
   * @param calendarDate Gregorian calendar date to be converted to JDC.
   * @returns the JDC representing the given Gregorian calendar date.
   */
  export const gregorianToJDC = (calendarDate: CalendarDate): TypeDefinitionsModule.JDC => {
    let year = 0;
    let month = 0;
    let day = calendarDate.day;

    if (calendarDate.daytime !== undefined) {
      day += calendarDate.daytime;
    }

    if (calendarDate.month > 2) {
      year = calendarDate.year;
      month = calendarDate.month;
    } else {
      year = calendarDate.year - 1;
      month = calendarDate.month + 12;
    }

    let b = 0;
    const a = truncateDecimals(year / 100.0);
    const idate = year * 10000 + month * 100 + day;
    // check whether given date is before October 15th, 1582 (see README)
    if (idate >= 15821015) {
      b = 2 - a + truncateDecimals(a / 4);
    } else {
      b = 0;
    }

    const jdc = truncateDecimals(365.25 * (year + 4716)) + truncateDecimals(30.6001 * (month + 1)) + day + b - 1524.5;
    return jdc;
  };

  /**
   * Converts a Gregorian calendar date to a JDN.
   *
   * @param calendarDate Gregorian calendar date to be converted to JDN.
   * @returns the JDN representing the given Gregorian calendar date.
   */
  export const gregorianToJDN = (calendarDate: CalendarDate): TypeDefinitionsModule.JDN => {
    const jdc: TypeDefinitionsModule.JDC = gregorianToJDC(calendarDate);

    /*

        Converts JDC to JDN by adding 0.5 and getting rid of fractions.

        2446822.5 up to 2446823.49… (JDCs for January 27th 1987) -> 2446823 (JDN for January 27th 1987)

         */

    return truncateDecimals(jdc + 0.5);
  };

  /**
   * Converts a JDC to a Gregorian Calendar date.
   *
   * Conversion algorithm from:
   * Jean Meeus, Astronomical Algorithms, 1998, 63pp.
   *
   * There is a year 0.
   *
   * @param jdc JDC to be converted to a Gregorian calendar date.
   * @returns the Gregorian calendar date created from the given JDC.
   */
  export const JDCToGregorian = (jdc: TypeDefinitionsModule.JDC): CalendarDate => {
    jdc += 0.5;
    const z = truncateDecimals(jdc);
    const f = jdc - z;

    const alpha = truncateDecimals((z - 1867216.25) / 36524.25);
    const a = z + 1 + alpha - truncateDecimals(alpha / 4);

    const b = a + 1524;
    const c = truncateDecimals((b - 122.1) / 365.25);
    const d = truncateDecimals(365.25 * c);
    const e = truncateDecimals((b - d) / 30.6001);

    const day = b - d - truncateDecimals(30.6001 * e) + f;
    let month;
    if (e < 14) {
      month = e - 1;
    } else {
      month = e - 13;
    }
    let year;
    if (month > 2) {
      year = c - 4716;
    } else {
      year = c - 4715;
    }

    const fullday = truncateDecimals(day);
    const daytime = day - fullday;
    return new CalendarDate(year, month, fullday, undefined, daytime);
  };

  /**
   * Converts a JDN to a Gregorian calendar date.
   *
   * @param jdn the given JDN.
   * @returns the Gregorian calendar date created from the given JDN.
   */
  export const JDNToGregorian = (jdn: TypeDefinitionsModule.JDN): CalendarDate => JDCToGregorian(jdn);

  /**
   * Converts a Julian calendar date to a JDC.
   *
   * Conversion algorithm from:
   * Jean Meeus, Astronomical Algorithms, 1998, 60pp.
   *
   * There is a year 0.
   *
   * @param calendarDate Julian calendar date to be converted to JDC.
   * @returns JDC representing the given Julian calendar date.
   */
  export const julianToJDC = (calendarDate: CalendarDate): TypeDefinitionsModule.JDC => {
    // TODO: check validity of given calendar date

    let year = 0;
    let month = 0;
    let day = calendarDate.day;

    if (calendarDate.daytime !== undefined) {
      day += calendarDate.daytime;
    }

    if (calendarDate.month > 2) {
      year = calendarDate.year;
      month = calendarDate.month;
    } else {
      year = calendarDate.year - 1;
      month = calendarDate.month + 12;
    }

    let c = 0;
    if (year < 0) {
      c = -0.75;
    }

    const jdc = truncateDecimals(365.25 * year + c) + truncateDecimals(30.6001 * (month + 1)) + day + 1720994.5;

    return jdc;
  };

  /**
   * Converts a Julian calendar date to a JDN.
   *
   * @param calendarDate Julian calendar date to be converted to JDN.
   * @returns JDN representing the given Julian calendar date.
   */
  export const julianToJDN = (calendarDate: CalendarDate): TypeDefinitionsModule.JDN => {
    // TODO: check validity of given calendar date
    const jdc = julianToJDC(calendarDate);

    /*

        Converts JDC to JDN by adding 0.5 and getting rid of fractions.

        2446822.5 up to 2446823.49… (JDCs for January 14th 1987) -> 2446823 (JDN for January 14th 1987)

         */

    return truncateDecimals(jdc + 0.5); // adaption because full number without fraction of JDC represents noon.
  };

  /**
   * Converts a JDC to a Julian Calendar date.
   *
   * Conversion algorithm from:
   * Jean Meeus, Astronomical Algorithms, 1998, 63pp.
   *
   * There is a year 0.
   *
   * @param jdc JDC to be converted to a Julian calendar date.
   * @returns Julian calendar date created from given JDC.
   */
  export const JDCToJulian = (jdc: TypeDefinitionsModule.JDC): CalendarDate => {
    jdc += 0.5;
    const z = truncateDecimals(jdc);
    const f = jdc - z;
    const a = z; // it's a julian calendar
    const b = a + 1524;
    const c = truncateDecimals((b - 122.1) / 365.25);
    const d = truncateDecimals(365.25 * c);
    const e = truncateDecimals((b - d) / 30.6001);

    const day = b - d - truncateDecimals(30.6001 * e) + f;
    let month;
    if (e < 14) {
      month = e - 1;
    } else {
      month = e - 13;
    }
    let year;
    if (month > 2) {
      year = c - 4716;
    } else {
      year = c - 4715;
    }

    const fullday = truncateDecimals(day);
    const daytime = day - fullday;
    return new CalendarDate(year, month, fullday, undefined, daytime);
  };

  /**
   * Converts a JDN to a Julian calendar date.
   *
   * @param jdn JDN to be converted to a Julian calendar date.
   * @returns Julian calendar date created from given JDN.
   */
  export const JDNToJulian = (jdn: TypeDefinitionsModule.JDN): CalendarDate => JDCToJulian(jdn);

  /**
   * Determine the day of week from the given JDN. Works only for calendars which use
   * the 7 day week with Sunday to Saturday.
   *
   * Algorithm from:
   * Jean Meeus: Astronomical Algorithms, 1998, p. 65.
   *
   * @param jdc given JDC.
   * @returns the number of the day of the week for the given JDC (0 Sunday, 1 Monday, 2 Tuesday, 3 Wednesday, 4 Thursday, 5 Friday, 6 Saturday).
   */
  export const dayOfWeekFromJDC = (jdc: TypeDefinitionsModule.JDC) => truncateDecimals(jdc + 1.5) % 7;

  /**
   * Converts an Islamic calendar date to a JDC.
   *
   * Algorithm from:
   * Jean Meeus, Astronomical Algorithms, 1998, 73pp.
   *
   * The first day of the Islamic calendar according to this algorithm is July 16th, 622 CE (Julian; JDC = 1948439.5).
   * This is in agreement with the widely used tables of Wuestenfeld et al., Wuestenfeld-Mahler'sche
   * Vergleichungs-Tabellen zur muslimischen und iranischen Zeitrechnung, 1961. However, it is well known that
   * these calendar dates may be off by 1 to 2 days in comparison to the calendar that was actually used, especially
   * if historical dates are concerned. There are two more points of concern: Sura 9, 36-37 of the Koran
   * suggests that a lunar calendar without intercalation was applied from year 10 of the Hijra onwards only; earlier
   * on, probably a luni-solar calendar was used. This algorithm assumes that a lunar calendar without any
   * intercalation started in year 1 of the Hijra. Secondly, in many countries the first actual sighting of the lunar
   * crescent was decisive for the beginning of a new month up to quite recent times, but not a regular scheme. This
   * introduces a dependency on the location: a new Islamic calendar month may have started on different days in
   * different locations.
   * Unambiguous conversion of historical Islamic dates into Julian or Gregorian calendar dates or vice cersa can
   * only be achieved if the day of the week is known in addition.
   *
   * @param calendarDate Islamic calendar date to be converted to JDC.
   * @returns JDC representing the given Islamic calendar date.
   */
  export const islamicToJDC = (calendarDate: CalendarDate): TypeDefinitionsModule.JDC => {
    const h = calendarDate.year;
    const m = calendarDate.month;
    let d = calendarDate.day;

    if (calendarDate.daytime !== undefined) {
      d += calendarDate.daytime;
    }

    const n = d + Math.floor(29.5001 * (m - 1) + 0.99);
    const q = Math.floor(h / 30);
    let r = h % 30;
    if (r < 0) {
      r += 30;
    }
    const a = Math.floor((11 * r + 3) / 30);
    const w = 404 * q + 354 * r + 208 + a;
    const q1 = Math.floor(w / 1461);
    let q2 = w % 1461;
    if (q2 < 0) {
      q2 += 1461;
    }
    const g = 621 + 4 * Math.floor(7 * q + q1);
    const k = Math.floor(q2 / 365.2422);
    const e = Math.floor(365.2422 * k);
    let j = q2 - e + n - 1;
    let x = g + k;

    if (j > 366 && x % 4 == 0) {
      j -= 366;
      x += 1;
    } else if (j > 365 && x % 4 > 0) {
      j -= 365;
      x += 1;
    }

    const jdc = truncateDecimals(365.25 * (x - 1)) + 1721423 + j - 0.5;

    return jdc;
  };

  /**
   * Converts an Islamic calendar date to a JDN.
   *
   * @param calendarDate Islamic calendar date to be converted to JDN.
   * @returns JDN representing the given Islamic calendar date.
   */
  export const islamicToJDN = (calendarDate: CalendarDate): TypeDefinitionsModule.JDN => {
    const jdc = islamicToJDC(calendarDate);

    return truncateDecimals(jdc + 0.5); // adaption because full number without fraction of JDC represents noon.
  };

  /**
   * Converts a JDC to an Islamic calendar date.
   *
   * Algorithm from:
   * Jean Meeus, Astronomical Algorithms, 1998, 75pp.
   *
   * The first day of the Islamic calendar according to this algorithm is July 16th, 622 CE (Julian; JDC = 1948439.5).
   * This is in agreement with the widely used tables of Wuestenfeld et al., Wuestenfeld-Mahler'sche
   * Vergleichungs-Tabellen zur muslimischen und iranischen Zeitrechnung, 1961. However, it is well known that
   * these calendar dates may be off by 1 to 2 days in comparison to the calendar that was actually used, especially
   * if historical dates are concerned. There are two more points of concern: Sura 9, 36-37 of the Koran
   * suggests that a lunar calendar without intercalation was applied from year 10 of the Hijra onwards only; earlier
   * on, probably a luni-solar calendar was used. This algorithm assumes that a lunar calendar without any
   * intercalation started in year 1 of the Hijra. Secondly, in many countries the first actual sighting of the lunar
   * crescent was decisive for the beginning of a new month up to quite recent times, but not a regular scheme. This
   * introduces a dependency on the location: a new Islamic calendar month may have started on different days in
   * different locations.
   * Unambiguous conversion of historical Islamic dates into Julian or Gregorian calendar dates or vice cersa can
   * only be achieved if the day of the week is known in addition.
   *
   * @param jdc JDC to be converted to an Islamic calendar date.
   * @returns Islamic calendar date created from given JDC.
   */
  export const JDCToIslamic = (jdc: TypeDefinitionsModule.JDC): CalendarDate => {
    // convert given JDC into a Julian calendar date
    const julianCalendarDate: CalendarDate = JDCToJulian(jdc);

    const x = julianCalendarDate.year;
    let m = julianCalendarDate.month;
    let d = julianCalendarDate.day;

    let w;
    if (x % 4 == 0) {
      w = 1;
    } else {
      w = 2;
    }

    const n = truncateDecimals((275 * m) / 9) - w * truncateDecimals((m + 9) / 12) + d - 30;
    const a = x - 623;
    const b = Math.floor(a / 4);
    let c = a / 4 - b;
    c = Math.floor(c * 4);
    const c1 = 365.2501 * c;
    let c2 = Math.floor(c1);

    if (c1 - c2 > 0.5) {
      c2 += 1;
    }

    const d_ = 1461 * b + 170 + c2;
    const q = Math.floor(d_ / 10631);
    let r = d_ % 10631;
    if (r < 0) {
      r += 10631;
    }
    const j = Math.floor(r / 354);
    let k = r % 354;
    if (k < 0) {
      k += 354;
    }
    const o = Math.floor((11 * j + 14) / 30);
    let h = 30 * q + j + 1;
    let jj = k - o + n - 1;

    if (jj > 354) {
      let cl = h % 30;
      if (cl < 0) {
        cl += 30;
      }
      let dl = (11 * cl + 3) % 30;
      if (dl < 0) {
        dl += 30;
      }

      if (dl < 19) {
        jj -= 354;
        h += 1;
      }
      if (dl > 18) {
        jj -= 355;
        h += 1;
      }

      if (jj == 0) {
        jj = 355;
        h -= 1;
      }
    }

    const s = Math.floor((jj - 1) / 29.5);

    m = 1 + s;

    d = Math.floor(jj - 29.5 * s);

    if (jj == 355) {
      m = 12;
      d = 30;
    }

    return new CalendarDate(h, m, d, undefined, julianCalendarDate.daytime);
  };

  /**
   * Converts a JDN to an Islamic calendar date.
   *
   * @param jdn JDN to be converted to an Islamic calendar date.
   * @returns @returns Islamic calendar date created from given JDN.
   */
  export const JDNToIslamic = (jdn: TypeDefinitionsModule.JDN): CalendarDate => JDCToIslamic(jdn);
}
