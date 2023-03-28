/*
 * Copyright © 2021 - 2023 Swiss National Data and Service Center for the Humanities and/or DaSCH Service Platform contributors.
 *  SPDX-License-Identifier: Apache-2.0
 */

import { CalendarDate } from './CalendarDate';
import { JDNConvertibleConversionModule } from './JDNCalendarConversion';
import { GregorianCalendarDate, JulianCalendarDate, IslamicCalendarDate, JDNConvertibleCalendar } from './JDNConvertibleCalendar';
import { JDNPeriod } from './JDNPeriod';
import { CalendarPeriod } from './CalendarPeriod';
import assert from "assert";

/**
 * Checks if the received calendar date corresponds to the expected calendar date.
 *
 * @param {CalendarDate} expected expected calendar date.
 * @param {CalendarDate} received received calendar date.
 * @param checkDayOfWeek indicates if week day should be checked.
 */
const checkCalendarDate = (expected: CalendarDate, received: CalendarDate, checkDayOfWeek = true) => {

    assert.strictEqual(received.year, expected.year, `calendar date is wrong: year is ${received.year} instead of ${expected.year}`);
    assert.strictEqual(received.month, expected.month, `calendar date is wrong: month is ${received.month} instead of ${expected.month}`);
    assert.strictEqual(received.day, expected.day, `calendar date is wrong: day is ${received.day} instead of ${expected.day}`);

    if (checkDayOfWeek) {
        assert.strictEqual(received.dayOfWeek, expected.dayOfWeek, `calendar date is wrong: day of week is ${received.dayOfWeek} instead of ${expected.dayOfWeek}`);
    }
};

/**
 * Checks if the received JDN corresponds to the expected JDN.
 *
 * @param {number} expected expected JDN.
 * @param {number} received received JDN.
 */
const checkJDN = (expected: number, received: number) => {

    // make sure that the received JDN has no fraction
    assert.strictEqual(Math.floor(received), received, `JDN contains a fraction: ${received}`);

    assert.strictEqual(received, expected, `JDN is wrong: received JDN is ${received} instead of ${expected}`);
};

/**
 * Checks if the received JDC corresponds to the received JDC.
 *
 * @param {number} expected expected JDC.
 * @param {number} received received JDC.
 */
const checkJDC = (expected: number, received: number) => {
    assert.strictEqual(received, expected, `JDC is wrong: received JDN is ${received} instead of ${expected}`);
};

//
// Gregorian to JDC
//
describe('Conversion of a Gregorian calendar date to JDC', () => {

    it('convert the Gregorian Calendar date 01-01-2000 12:00 to JDC', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(2000, 1, 1, undefined, 0.5);
        const jdc: number = JDNConvertibleConversionModule.gregorianToJDC(gregorianCalendarDate);

        checkJDC(2451545.0, jdc);
    });


    it('convert the Gregorian Calendar date 27-01-1987 to JDC', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(1987, 1, 27, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.gregorianToJDC(gregorianCalendarDate);

        checkJDC(2446822.5, jdc);
    });

    it('convert the Gregorian Calendar date 04-10-1582 to JDC', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(1582, 10, 4, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.gregorianToJDC(gregorianCalendarDate);

        checkJDC(2299159.5, jdc);
    });

    it('convert the Gregorian Calendar date 15-10-1582 to JDC', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(1582, 10, 15, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.gregorianToJDC(gregorianCalendarDate);

        checkJDC(2299160.5, jdc);
    });

    it('convert the Gregorian Calendar date 22-12-(-1001) to JDC', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(-1001, 12, 22, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.gregorianToJDC(gregorianCalendarDate);

        checkJDC(1355797.5, jdc);
    });

    it('convert the Gregorian Calendar date 01-01-(-4712) to JDC', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(-4712, 1, 1, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.gregorianToJDC(gregorianCalendarDate);

        checkJDC(-0.5, jdc);
    });

    it('convert the Gregorian Calendar date 01-02(-1899) to JDC', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(-1899, 2, 1, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.gregorianToJDC(gregorianCalendarDate);

        checkJDC(1027479.5, jdc);
    });

    it('convert the Gregorian Calendar date 01-03(-1899) to JDC', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(-1899, 3, 1, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.gregorianToJDC(gregorianCalendarDate);

        checkJDC(1027507.5, jdc);
    });

    it('convert the Gregorian Calendar date 28-02(-98) to JDC', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(-98, 2, 28, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.gregorianToJDC(gregorianCalendarDate);

        checkJDC(1685321.5, jdc);
    });

    it('convert the Gregorian Calendar date 28-02(-99) to JDC', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(-99, 2, 28, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.gregorianToJDC(gregorianCalendarDate);

        checkJDC(1684956.5, jdc);
    });

    it('convert the Gregorian Calendar date 28-02(-100) to JDC', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(-100, 2, 28, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.gregorianToJDC(gregorianCalendarDate);

        checkJDC(1684590.5, jdc);
    });

    it('convert the Gregorian Calendar date 27-02(-101) to JDC', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(-101, 2, 27, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.gregorianToJDC(gregorianCalendarDate);

        checkJDC(1684224.5, jdc);
    });

    it('convert the Gregorian Calendar date 28-02(-101) to JDC', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(-101, 2, 28, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.gregorianToJDC(gregorianCalendarDate);

        checkJDC(1684225.5, jdc);
    });

    it('convert the Gregorian Calendar date 28-02(-102) to JDC', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(-102, 2, 28, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.gregorianToJDC(gregorianCalendarDate);

        checkJDC(1683860.5, jdc);
    });

    it('convert the Gregorian Calendar date 28-02(-103) to JDC', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(-103, 2, 28, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.gregorianToJDC(gregorianCalendarDate);

        checkJDC(1683495.5, jdc);
    });

    it('convert the Gregorian Calendar date 29-02(-104) to JDC', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(-104, 2, 29, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.gregorianToJDC(gregorianCalendarDate);

        checkJDC(1683130.5, jdc);
    });

    it('convert the Gregorian Calendar date 28-02(-104) to JDC', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(-104, 2, 28, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.gregorianToJDC(gregorianCalendarDate);

        checkJDC(1683129.5, jdc);
    });

    it('convert the Gregorian Calendar date 01-03(-104) to JDC', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(-104, 3, 1, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.gregorianToJDC(gregorianCalendarDate);

        checkJDC(1683131.5, jdc);
    });

    it('convert the Gregorian Calendar date 28-02(-105) to JDC', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(-105, 2, 28, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.gregorianToJDC(gregorianCalendarDate);

        checkJDC(1682764.5, jdc);
    });

    it('convert the Gregorian Calendar date 28-02(-106) to JDC', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(-106, 2, 28, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.gregorianToJDC(gregorianCalendarDate);

        checkJDC(1682399.5, jdc);
    });

    it('convert the Gregorian Calendar date 28-02(-107) to JDC', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(-107, 2, 28, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.gregorianToJDC(gregorianCalendarDate);

        checkJDC(1682034.5, jdc);
    });

    it('convert the Gregorian Calendar date 29-02(-108) to JDC', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(-108, 2, 29, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.gregorianToJDC(gregorianCalendarDate);

        checkJDC(1681669.5, jdc);
    });

    it('convert the Gregorian Calendar date 28-02(-108) to JDC', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(-108, 2, 28, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.gregorianToJDC(gregorianCalendarDate);

        checkJDC(1681668.5, jdc);
    });

    it('convert the Gregorian Calendar date 01-03(-108) to JDC', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(-108, 3, 1, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.gregorianToJDC(gregorianCalendarDate);

        checkJDC(1681670.5, jdc);
    });


});

//
// Gregorian to JDN
//
describe('Conversion of a Gregorian calendar date to JDN', () => {
    it('convert the Gregorian Calendar date 01-01-2000 to JDN', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(2000, 1, 1);
        const jdn: number = JDNConvertibleConversionModule.gregorianToJDN(gregorianCalendarDate);

        checkJDN(2451545, jdn);
    });

    it('convert the Gregorian Calendar date 06-12-2017 to JDN', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(2017, 12, 6);
        const jdn: number = JDNConvertibleConversionModule.gregorianToJDN(gregorianCalendarDate);

        checkJDN(2458094, jdn);
    });

    it('convert the Gregorian Calendar date 01-01-2000 to JDN', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(2000, 1, 1);
        const jdn: number = JDNConvertibleConversionModule.gregorianToJDN(gregorianCalendarDate);

        checkJDN(2451545, jdn);
    });

    it('convert the Gregorian Calendar date 27-01-1987 to JDN', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(1987, 1, 27);
        const jdn: number = JDNConvertibleConversionModule.gregorianToJDN(gregorianCalendarDate);

        checkJDN(2446823, jdn);
    });

    it('convert the Gregorian Calendar date 19-06-1987 to JDN', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(1987, 6, 19);
        const jdn: number = JDNConvertibleConversionModule.gregorianToJDN(gregorianCalendarDate);

        checkJDN(2446966, jdn);
    });

    it('convert the Gregorian Calendar date 27-01-1988 to JDN', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(1988, 1, 27);
        const jdn: number = JDNConvertibleConversionModule.gregorianToJDN(gregorianCalendarDate);

        checkJDN(2447188, jdn);
    });

    it('convert the Gregorian Calendar date 19-06-1988 to JDN', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(1988, 6, 19);
        const jdn: number = JDNConvertibleConversionModule.gregorianToJDN(gregorianCalendarDate);

        checkJDN(2447332, jdn);
    });

    it('convert the Gregorian Calendar date 01-01-1900 to JDN', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(1900, 1, 1);
        const jdn: number = JDNConvertibleConversionModule.gregorianToJDN(gregorianCalendarDate);

        checkJDN(2415021, jdn);
    });

    it('convert the Gregorian Calendar date 31-12-2016 to JDN', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(2016, 12, 31);
        const jdn: number = JDNConvertibleConversionModule.gregorianToJDN(gregorianCalendarDate);

        checkJDN(2457754, jdn);
    });

    it('convert the Gregorian Calendar date 01-01-1600 to JDN', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(1600, 1, 1);
        const jdn: number = JDNConvertibleConversionModule.gregorianToJDN(gregorianCalendarDate);

        checkJDN(2305448, jdn);
    });

    it('convert the Gregorian Calendar date 31-12-1600 to JDN', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(1600, 12, 31);
        const jdn: number = JDNConvertibleConversionModule.gregorianToJDN(gregorianCalendarDate);

        checkJDN(2305813, jdn);
    });

    it('convert the Gregorian Calendar date 04-10-1582 to JDN', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(1582, 10, 4);
        const jdn: number = JDNConvertibleConversionModule.gregorianToJDN(gregorianCalendarDate);

        checkJDN(2299160, jdn);
    });

    it('convert the Gregorian Calendar date 15-10-1582 to JDN', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(1582, 10, 15);
        const jdn: number = JDNConvertibleConversionModule.gregorianToJDN(gregorianCalendarDate);

        checkJDN(2299161, jdn);
    });

    it('convert the Gregorian Calendar date 22-12-(-1001) to JDN', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(-1001, 12, 22);
        const jdn: number = JDNConvertibleConversionModule.gregorianToJDN(gregorianCalendarDate);

        checkJDN(1355798, jdn);
    });

    it('convert the Gregorian Calendar date 01-01-(-4712) to JDN', () => {
        const gregorianCalendarDate: CalendarDate = new CalendarDate(-4712, 1, 1);
        const jdn: number = JDNConvertibleConversionModule.gregorianToJDN(gregorianCalendarDate);

        checkJDN(0, jdn);
    });

});

//
// Julian to JDC
//
describe('Conversion of a  Julian calendar date to JDC', () => {

    it('convert the Julian Calendar date 04-10-1582 to JDC', () => {
        const julianCalendarDate: CalendarDate = new CalendarDate(1582, 10, 4, undefined, 0.3);
        const jdc: number = JDNConvertibleConversionModule.julianToJDC(julianCalendarDate);

        checkJDC(2299159.8, jdc);
    });

    it('convert the Julian Calendar date 15-10-1582 to JDC', () => {
        const julianCalendarDate: CalendarDate = new CalendarDate(1582, 10, 15, undefined, 0.3);
        const jdc: number = JDNConvertibleConversionModule.julianToJDC(julianCalendarDate);

        checkJDC(2299170.8, jdc);
    });

    it('convert the Julian Calendar date 10-04-837 to JDC', () => {
        const julianCalendarDate: CalendarDate = new CalendarDate(837, 4, 10, undefined, 0.3);
        const jdc: number = JDNConvertibleConversionModule.julianToJDC(julianCalendarDate);

        checkJDC(2026871.8, jdc);
    });

    it('convert the Julian Calendar date 01-01-(-1000) to JDC', () => {
        const julianCalendarDate: CalendarDate = new CalendarDate(-1000, 1, 1, undefined, 0.9);
        const jdc: number = JDNConvertibleConversionModule.julianToJDC(julianCalendarDate);

        checkJDC(1355808.4, jdc);
    });

    it('convert the Julian Calendar date 17-08-(-1001) to JDC', () => {
        const julianCalendarDate: CalendarDate = new CalendarDate(-1001, 8, 17, undefined, 0.9);
        const jdc: number = JDNConvertibleConversionModule.julianToJDC(julianCalendarDate);

        checkJDC(1355671.4, jdc);
    });

    it('convert the Julian Calendar date 01-01-(-4712) to JDC', () => {
        const julianCalendarDate: CalendarDate = new CalendarDate(-4712, 1, 1, undefined, 0.5);
        const jdc: number = JDNConvertibleConversionModule.julianToJDC(julianCalendarDate);

        checkJDC(0, jdc);
    });

    it('convert the Julian Calendar date 02-03(-98) to JDC', () => {
        const JulianCalendarDate: CalendarDate = new CalendarDate(-98, 3, 2, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.julianToJDC(JulianCalendarDate);

        checkJDC(1685323.5, jdc);
    });

    it('convert the Julian Calendar date 02-03(-99) to JDC', () => {
        const JulianCalendarDate: CalendarDate = new CalendarDate(-99, 3, 2, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.julianToJDC(JulianCalendarDate);

        checkJDC(1684958.5, jdc);
    });

    it('convert the Julian Calendar date 02-03(-100) to JDC', () => {
        const JulianCalendarDate: CalendarDate = new CalendarDate(-100, 3, 2, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.julianToJDC(JulianCalendarDate);

        checkJDC(1684593.5, jdc);
    });

    it('convert the Julian Calendar date 02-03(-101) to JDC', () => {
        const JulianCalendarDate: CalendarDate = new CalendarDate(-101, 3, 2, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.julianToJDC(JulianCalendarDate);

        checkJDC(1684227.5, jdc);
    });

    it('convert the Julian Calendar date 03-03(-101) to JDC', () => {
        const JulianCalendarDate: CalendarDate = new CalendarDate(-101, 3, 3, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.julianToJDC(JulianCalendarDate);

        checkJDC(1684228.5, jdc);
    });

    it('convert the Julian Calendar date 03-03(-102) to JDC', () => {
        const JulianCalendarDate: CalendarDate = new CalendarDate(-102, 3, 3, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.julianToJDC(JulianCalendarDate);

        checkJDC(1683863.5, jdc);
    });

    it('convert the Julian Calendar date 03-03(-103) to JDC', () => {
        const JulianCalendarDate: CalendarDate = new CalendarDate(-103, 3, 3, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.julianToJDC(JulianCalendarDate);

        checkJDC(1683498.5, jdc);
    });

    it('convert the Julian Calendar date 03-03(-104) to JDC', () => {
        const JulianCalendarDate: CalendarDate = new CalendarDate(-104, 3, 3, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.julianToJDC(JulianCalendarDate);

        checkJDC(1683133.5, jdc);
    });

    it('convert the Julian Calendar date 02-03(-104) to JDC', () => {
        const JulianCalendarDate: CalendarDate = new CalendarDate(-104, 3, 2, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.julianToJDC(JulianCalendarDate);

        checkJDC(1683132.5, jdc);
    });

    it('convert the Julian Calendar date 04-03(-104) to JDC', () => {
        const JulianCalendarDate: CalendarDate = new CalendarDate(-104, 3, 4, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.julianToJDC(JulianCalendarDate);

        checkJDC(1683134.5, jdc);
    });

    it('convert the Julian Calendar date 03-03(-105) to JDC', () => {
        const JulianCalendarDate: CalendarDate = new CalendarDate(-105, 3, 3, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.julianToJDC(JulianCalendarDate);

        checkJDC(1682767.5, jdc);
    });

    it('convert the Julian Calendar date 03-03(-106) to JDC', () => {
        const JulianCalendarDate: CalendarDate = new CalendarDate(-106, 3, 3, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.julianToJDC(JulianCalendarDate);

        checkJDC(1682402.5, jdc);
    });

    it('convert the Julian Calendar date 03-03(-107) to JDC', () => {
        const JulianCalendarDate: CalendarDate = new CalendarDate(-107, 3, 3, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.julianToJDC(JulianCalendarDate);

        checkJDC(1682037.5, jdc);
    });

    it('convert the Julian Calendar date 03-03(-108) to JDC', () => {
        const JulianCalendarDate: CalendarDate = new CalendarDate(-108, 3, 3, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.julianToJDC(JulianCalendarDate);

        checkJDC(1681672.5, jdc);
    });

    it('convert the Julian Calendar date 02-03(-108) to JDC', () => {
        const JulianCalendarDate: CalendarDate = new CalendarDate(-108, 3, 2, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.julianToJDC(JulianCalendarDate);

        checkJDC(1681671.5, jdc);
    });

    it('convert the Julian Calendar date 04-03(-108) to JDC', () => {
        const JulianCalendarDate: CalendarDate = new CalendarDate(-108, 3, 4, undefined, 0);
        const jdc: number = JDNConvertibleConversionModule.julianToJDC(JulianCalendarDate);

        checkJDC(1681673.5, jdc);
    });


});

//
// Julian to JDN
//
describe('Conversion of a Julian calendar date to JDN', () => {

    it('convert the Julian Calendar date 04-10-1582 to JDN', () => {
        const julianCalendarDate: CalendarDate = new CalendarDate(1582, 10, 4);
        const jdn: number = JDNConvertibleConversionModule.julianToJDN(julianCalendarDate);

        checkJDN(2299160, jdn);
    });

    it('convert the Julian Calendar date 15-10-1582 to JDN', () => {
        const julianCalendarDate: CalendarDate = new CalendarDate(1582, 10, 15);
        const jdn: number = JDNConvertibleConversionModule.julianToJDN(julianCalendarDate);

        checkJDN(2299171, jdn);
    });

    it('convert the Julian Calendar date 10-04-837 to JDN', () => {
        const julianCalendarDate: CalendarDate = new CalendarDate(837, 4, 10);
        const jdn: number = JDNConvertibleConversionModule.julianToJDN(julianCalendarDate);

        checkJDN(2026872, jdn);
    });

    it('convert the Julian Calendar date 01-01-(-1000) to JDN', () => {
        const julianCalendarDate: CalendarDate = new CalendarDate(-1000, 1, 1);
        const jdn: number = JDNConvertibleConversionModule.julianToJDN(julianCalendarDate);

        checkJDN(1355808, jdn);
    });

    it('convert the Julian Calendar date 17-08-(-1001) to JDN', () => {
        const julianCalendarDate: CalendarDate = new CalendarDate(-1001, 8, 17);
        const jdn: number = JDNConvertibleConversionModule.julianToJDN(julianCalendarDate);

        checkJDN(1355671, jdn);
    });


    it('convert the Julian Calendar date 01-01-(-4712) to JDN', () => {
        const julianCalendarDate: CalendarDate = new CalendarDate(-4712, 1, 1);
        const jdn: number = JDNConvertibleConversionModule.julianToJDN(julianCalendarDate);

        checkJDN(0, jdn);
    });
});

//
// JDN to Gregorian
//
describe('Conversion JDN to Gregorian calendar', () => {
    it('convert the JDN 2458094 back to the Gregorian Calendar date 06-12-2017', () => {
        const gregorianCalendarDate = JDNConvertibleConversionModule.JDNToGregorian(2458094);

        const expectedDate = new CalendarDate(2017, 12, 6);

        checkCalendarDate(expectedDate, gregorianCalendarDate);
    });

    it('convert the JDN 2458094 back to the Gregorian Calendar date 06-12-2017', () => {
        const gregorianCalendarDate = JDNConvertibleConversionModule.JDNToGregorian(2458093.5);

        const expectedDate = new CalendarDate(2017, 12, 6);

        checkCalendarDate(expectedDate, gregorianCalendarDate);
    });

    it('convert the JDN 2458094 back to the Gregorian Calendar date 06-12-2017', () => {
        const gregorianCalendarDate = JDNConvertibleConversionModule.JDNToGregorian(2458094.4999);

        const expectedDate = new CalendarDate(2017, 12, 6);

        checkCalendarDate(expectedDate, gregorianCalendarDate);
    });

    it('convert the JDN 2457754 back to the Gregorian Calendar date 31-12-2016', () => {
        const gregorianCalendarDate = JDNConvertibleConversionModule.JDNToGregorian(2457754);

        const expectedDate = new CalendarDate(2016, 12, 31);

        checkCalendarDate(expectedDate, gregorianCalendarDate);
    });

    it('convert the JDN 2299150 back to the Gregorian Calendar date 04-10-1582', () => {
        const gregorianCalendarDate = JDNConvertibleConversionModule.JDNToGregorian(2299150);

        const expectedDate = new CalendarDate(1582, 10, 4);

        checkCalendarDate(expectedDate, gregorianCalendarDate);
    });

    it('convert the JDN 2299161 back to the Gregorian Calendar date 15-10-1582', () => {
        const gregorianCalendarDate = JDNConvertibleConversionModule.JDNToGregorian(2299161);

        const expectedDate = new CalendarDate(1582, 10, 15);

        checkCalendarDate(expectedDate, gregorianCalendarDate);
    });

    it('convert the JDN 1355808 back to the Gregorian Calendar date 22-12-(-1001)', () => {
        const gregorianCalendarDate = JDNConvertibleConversionModule.JDNToGregorian(1355808);

        const expectedDate = new CalendarDate(-1001, 12, 22);

        checkCalendarDate(expectedDate, gregorianCalendarDate);
    });

});

//
// JDN to Julian
//
describe('Conversion JDN to Julian calendar', () => {

    it('convert the JDN 2299160 back to the Julian Calendar date 04-10-1582', () => {
        const julianCalendarDate = JDNConvertibleConversionModule.JDNToJulian(2299160);

        const expectedDate = new CalendarDate(1582, 10, 4);

        checkCalendarDate(expectedDate, julianCalendarDate);
    });

    it('convert the JDN 2299171 back to the Julian Calendar date 15-10-1582', () => {
        const julianCalendarDate = JDNConvertibleConversionModule.JDNToJulian(2299171);

        const expectedDate = new CalendarDate(1582, 10, 15);

        checkCalendarDate(expectedDate, julianCalendarDate);
    });

    it('convert the JDN 2026872 back to the Julian Calendar date 10-04-837', () => {
        const julianCalendarDate = JDNConvertibleConversionModule.JDNToJulian(2026872);

        const expectedDate = new CalendarDate(837, 4, 10);

        checkCalendarDate(expectedDate, julianCalendarDate);
    });

    it('convert the JDN 1355808 back to the Julian Calendar date 01-01-(-1000)', () => {
        const julianCalendarDate = JDNConvertibleConversionModule.JDNToJulian(1355808);

        const expectedDate = new CalendarDate(-1000, 1, 1);

        checkCalendarDate(expectedDate, julianCalendarDate);
    });

    it('convert the JDN 1355671 back to the Julian Calendar date 17-08-(-1001)', () => {
        const julianCalendarDate = JDNConvertibleConversionModule.JDNToJulian(1355671);

        const expectedDate = new CalendarDate(-1001, 8, 17);

        checkCalendarDate(expectedDate, julianCalendarDate);
    });

});

describe('Islamic to JDC', () => {

    it('convert the Islamic Calendar date 17-03-1439 to JDC 2458093.5', () => {
        const jdc = JDNConvertibleConversionModule.islamicToJDC(new CalendarDate(1439, 3, 17));

        checkJDC(2458093.5, jdc);
    });

    it('convert the Islamic Calendar date 17-03-1439 to JDC 2458093.6', () => {
        const jdc = JDNConvertibleConversionModule.islamicToJDC(new CalendarDate(1439, 3, 17, undefined, 0.1));

        checkJDC(2458093.6, jdc);
    });

    it('convert the Islamic Calendar date 17-03-1439 to JDC 2458094', () => {
        const jdc = JDNConvertibleConversionModule.islamicToJDC(new CalendarDate(1439, 3, 17, undefined, 0.5));

        checkJDC(2458094, jdc);
    });

    it('convert the Islamic Calendar date 17-03-1439 to JDC 2458094', () => {
        const jdc = JDNConvertibleConversionModule.islamicToJDC(new CalendarDate(1439, 3, 17, undefined, 0.9));

        checkJDC(2458094.4, jdc);
    });

    it('convert the Islamic Calendar date 01-01-1421 to JDC 2451640.5', () => {
        const jdc = JDNConvertibleConversionModule.islamicToJDC(new CalendarDate(1421, 1, 1));

        checkJDC(2451640.5, jdc);
    });

    it('convert the Islamic Calendar date 29-12-0000 to JDC 1948438.5', () => {
        const jdc = JDNConvertibleConversionModule.islamicToJDC(new CalendarDate(0, 12, 29));

        checkJDC(1948438.5, jdc);
    });

    it('convert the Islamic Calendar date 01-01-0001 to JDC 1948439.5', () => {
        const jdc = JDNConvertibleConversionModule.islamicToJDC(new CalendarDate(1, 1, 1));

        checkJDC(1948439.5, jdc);
    });

    it('convert the Islamic Calendar date 25-01-0104 to JDC 1984963.5', () => {
        const jdc = JDNConvertibleConversionModule.islamicToJDC(new CalendarDate(104, 1, 25));

        checkJDC(1984963.5, jdc);
    });

    it('convert the Islamic Calendar date 20-02-0207 to JDC 2021488.5', () => {
        const jdc = JDNConvertibleConversionModule.islamicToJDC(new CalendarDate(207, 2, 20));

        checkJDC(2021488.5, jdc);
    });

    it('convert the Islamic Calendar date 18-04-0310 to JDC 2058044.5', () => {
        const jdc = JDNConvertibleConversionModule.islamicToJDC(new CalendarDate(310, 4, 18));

        checkJDC(2058044.5, jdc);
    });

    it('convert the Islamic Calendar date 15-06-0413 to JDC 2094600.5', () => {
        const jdc = JDNConvertibleConversionModule.islamicToJDC(new CalendarDate(413, 6, 15));

        checkJDC(2094600.5, jdc);
    });

    it('convert the Islamic Calendar date 09-06-0516 to JDC 2131094.5', () => {
        const jdc = JDNConvertibleConversionModule.islamicToJDC(new CalendarDate(516, 6, 9));

        checkJDC(2131094.5, jdc);
    });

    it('convert the Islamic Calendar date 28-05-0619 to JDC 2167583.5', () => {
        const jdc = JDNConvertibleConversionModule.islamicToJDC(new CalendarDate(619, 5, 28));

        checkJDC(2167583.5, jdc);
    });

    it('convert the Islamic Calendar date 24-06-0722 to JDC 2204108.5', () => {
        const jdc = JDNConvertibleConversionModule.islamicToJDC(new CalendarDate(722, 6, 24));

        checkJDC(2204108.5, jdc);
    });

    it('convert the Islamic Calendar date 08-08-0825 to JDC 2240651.5', () => {
        const jdc = JDNConvertibleConversionModule.islamicToJDC(new CalendarDate(825, 8, 8));

        checkJDC(2240651.5, jdc);
    });

    it('convert the Islamic Calendar date 01-09-0928 to JDC 2277173.5', () => {
        const jdc = JDNConvertibleConversionModule.islamicToJDC(new CalendarDate(928, 9, 1));

        checkJDC(2277173.5, jdc);
    });

    it('convert the Islamic Calendar date 08-10-1031 to JDC 2313710.5', () => {
        const jdc = JDNConvertibleConversionModule.islamicToJDC(new CalendarDate(1031, 10, 8));

        checkJDC(2313710.5, jdc);
    });

    it('convert the Islamic Calendar date 27-11-1134 to JDC 2350257.5', () => {
        const jdc = JDNConvertibleConversionModule.islamicToJDC(new CalendarDate(1134, 11, 27));

        checkJDC(2350257.5, jdc);
    });

    it('convert the Islamic Calendar date 29-12-1237 to JDC 2386789.5', () => {
        const jdc = JDNConvertibleConversionModule.islamicToJDC(new CalendarDate(1237, 12, 29));

        checkJDC(2386789.5, jdc);
    });

    it('convert the Islamic Calendar date 25-03-1341 to JDC 2423373.5', () => {
        const jdc = JDNConvertibleConversionModule.islamicToJDC(new CalendarDate(1341, 3, 25));

        checkJDC(2423373.5, jdc);
    });

    it('convert the Islamic Calendar date 20-07-1420 to JDC 2451481.5', () => {
        const jdc = JDNConvertibleConversionModule.islamicToJDC(new CalendarDate(1420, 7, 20));

        checkJDC(2451481.5, jdc);
    });

});

describe('Islamic to JDN', () => {

    it('convert the Islamic Calendar date 17-03-1439 to JDN 2458094', () => {
        const jdn = JDNConvertibleConversionModule.islamicToJDN(new CalendarDate(1439, 3, 17));

        checkJDN(2458094, jdn);
    });

    it('convert the Islamic Calendar date 01-01-1421 to JDN 2451641', () => {
        const jdn = JDNConvertibleConversionModule.islamicToJDN(new CalendarDate(1421, 1, 1));

        checkJDN(2451641, jdn);
    });

    it('convert the Islamic Calendar date 29-12-0000 to JDN 1948439', () => {
        const jdn = JDNConvertibleConversionModule.islamicToJDN(new CalendarDate(0, 12, 29));

        checkJDN(1948439, jdn);
    });

    it('convert the Islamic Calendar date 01-01-0001 to JDN 1948440', () => {
        const jdn = JDNConvertibleConversionModule.islamicToJDN(new CalendarDate(1, 1, 1));

        checkJDN(1948440, jdn);
    });

    it('convert the Islamic Calendar date 25-01-0104 to JDN 1984964', () => {
        const jdn = JDNConvertibleConversionModule.islamicToJDN(new CalendarDate(104, 1, 25));

        checkJDN(1984964, jdn);
    });

    it('convert the Islamic Calendar date 20-02-0207 to JDN 2021489', () => {
        const jdn = JDNConvertibleConversionModule.islamicToJDN(new CalendarDate(207, 2, 20));

        checkJDN(2021489, jdn);
    });

    it('convert the Islamic Calendar date 18-04-0310 to JDN 2058045', () => {
        const jdn = JDNConvertibleConversionModule.islamicToJDN(new CalendarDate(310, 4, 18));

        checkJDN(2058045, jdn);
    });

    it('convert the Islamic Calendar date 15-06-0413 to JDN 2094601', () => {
        const jdn = JDNConvertibleConversionModule.islamicToJDN(new CalendarDate(413, 6, 15));

        checkJDN(2094601, jdn);
    });

    it('convert the Islamic Calendar date 09-06-0516 to JDN 2131095', () => {
        const jdn = JDNConvertibleConversionModule.islamicToJDN(new CalendarDate(516, 6, 9));

        checkJDN(2131095, jdn);
    });

    it('convert the Islamic Calendar date 28-05-0619 to JDN 2167584', () => {
        const jdn = JDNConvertibleConversionModule.islamicToJDN(new CalendarDate(619, 5, 28));

        checkJDN(2167584, jdn);
    });

    it('convert the Islamic Calendar date 24-06-0722 to JDN 2204109', () => {
        const jdn = JDNConvertibleConversionModule.islamicToJDN(new CalendarDate(722, 6, 24));

        checkJDN(2204109, jdn);
    });

    it('convert the Islamic Calendar date 08-08-0825 to JDN 2240652', () => {
        const jdn = JDNConvertibleConversionModule.islamicToJDN(new CalendarDate(825, 8, 8));

        checkJDN(2240652, jdn);
    });

    it('convert the Islamic Calendar date 01-09-0928 to JDN 2277174', () => {
        const jdn = JDNConvertibleConversionModule.islamicToJDN(new CalendarDate(928, 9, 1));

        checkJDN(2277174, jdn);
    });

    it('convert the Islamic Calendar date 08-10-1031 to JDN 2313711', () => {
        const jdn = JDNConvertibleConversionModule.islamicToJDN(new CalendarDate(1031, 10, 8));

        checkJDN(2313711, jdn);
    });

    it('convert the Islamic Calendar date 27-11-1134 to JDN 2350258', () => {
        const jdn = JDNConvertibleConversionModule.islamicToJDN(new CalendarDate(1134, 11, 27));

        checkJDN(2350258, jdn);
    });

    it('convert the Islamic Calendar date 29-12-1237 to JDN 2386790', () => {
        const jdn = JDNConvertibleConversionModule.islamicToJDN(new CalendarDate(1237, 12, 29));

        checkJDN(2386790, jdn);
    });

    it('convert the Islamic Calendar date 25-03-1341 to JDN 2423374', () => {
        const jdn = JDNConvertibleConversionModule.islamicToJDN(new CalendarDate(1341, 3, 25));

        checkJDN(2423374, jdn);
    });

    it('convert the Islamic Calendar date 20-07-1420 to JDN 2451482', () => {
        const jdn = JDNConvertibleConversionModule.islamicToJDN(new CalendarDate(1420, 7, 20));

        checkJDN(2451482, jdn);
    });

});

describe('JDC to Islamic', () => {

    it('convert the JDC 2458093.5 to the Islamic Calendar date 17-03-1439', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDCToIslamic(2458093.5);

        const expectedDate = new CalendarDate(1439, 3, 17);

        checkCalendarDate(expectedDate, islamicCalendarDate);

    });

    it('convert the JDC 2458093.6 to the Islamic Calendar date 17-03-1439', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDCToIslamic(2458093.6);

        const expectedDate = new CalendarDate(1439, 3, 17, undefined, 0.1);

        checkCalendarDate(expectedDate, islamicCalendarDate);

        assert.notStrictEqual(undefined, islamicCalendarDate.daytime);

        if (islamicCalendarDate.daytime !== undefined) {

            const diffDaytime = Math.abs(islamicCalendarDate.daytime - 0.1);

            assert(diffDaytime < 0.01);

        }

    });

    it('convert the JDC 2448481.5 to the Islamic Calendar date 02-02-1412', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDCToIslamic(2448481.5);

        const expectedDate = new CalendarDate(1412, 2, 2);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDC 1948438.5 to the Islamic Calendar date 29-12-0000', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDCToIslamic(1948438.5);

        const expectedDate = new CalendarDate(0, 12, 29);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDC 1948439.5 to the Islamic Calendar date 01-01-0001', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDCToIslamic(1948439.5);

        const expectedDate = new CalendarDate(1, 1, 1);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDC 1984963.5 to the Islamic Calendar date 25-01-0104', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDCToIslamic(1984963.5);

        const expectedDate = new CalendarDate(104, 1, 25);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDC 2021488.5 to the Islamic Calendar date 20-02-0207', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDCToIslamic(2021488.5);

        const expectedDate = new CalendarDate(207, 2, 20);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDC 2058044.5 to the Islamic Calendar date 18-04-0310', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDCToIslamic(2058044.5);

        const expectedDate = new CalendarDate(310, 4, 18);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDC 2094600.5 to the Islamic Calendar date 15-06-0413', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDCToIslamic(2094600.5);

        const expectedDate = new CalendarDate(413, 6, 15);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDC 2131094.5 to the Islamic Calendar date 09-06-0516', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDCToIslamic(2131094.5);

        const expectedDate = new CalendarDate(516, 6, 9);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDC 2167583.5 to the Islamic Calendar date 28-05-0619', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDCToIslamic(2167583.5);

        const expectedDate = new CalendarDate(619, 5, 28);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDC 2204108.5 to the Islamic Calendar date 24-06-0722', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDCToIslamic(2204108.5);

        const expectedDate = new CalendarDate(722, 6, 24);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDC 2240651.5 to the Islamic Calendar date 08-08-0825', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDCToIslamic(2240651.5);

        const expectedDate = new CalendarDate(825, 8, 8);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDC 2277173.5 to the Islamic Calendar date 01-09-0928', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDCToIslamic(2277173.5);

        const expectedDate = new CalendarDate(928, 9, 1);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDC 2313710.5 to the Islamic Calendar date 08-10-1031', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDCToIslamic(2313710.5);

        const expectedDate = new CalendarDate(1031, 10, 8);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDC 2350257.5 to the Islamic Calendar date 27-11-1134', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDCToIslamic(2350257.5);

        const expectedDate = new CalendarDate(1134, 11, 27);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDC 2386789.5 to the Islamic Calendar date 29-12-1237', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDCToIslamic(2386789.5);

        const expectedDate = new CalendarDate(1237, 12, 29);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDC 2423373.5 to the Islamic Calendar date 25-03-1341', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDCToIslamic(2423373.5);

        const expectedDate = new CalendarDate(1341, 3, 25);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDC 2451481.5 to the Islamic Calendar date 20-07-1420', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDCToIslamic(2451481.5);

        const expectedDate = new CalendarDate(1420, 7, 20);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

});

describe('JDN to Islamic', () => {

    it('convert the JDN 2458094 to the Islamic Calendar date 17-03-1439', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDNToIslamic(2458094);

        const expectedDate = new CalendarDate(1439, 3, 17);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDN 1948439 to the Islamic Calendar date 29-12-0000', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDNToIslamic(1948439);

        const expectedDate = new CalendarDate(0, 12, 29);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDN 1948440 to the Islamic Calendar date 01-01-0001', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDNToIslamic(1948440);

        const expectedDate = new CalendarDate(1, 1, 1);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDN 1984964 to the Islamic Calendar date 25-01-0104', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDNToIslamic(1984964);

        const expectedDate = new CalendarDate(104, 1, 25);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDN 2021489 to the Islamic Calendar date 20-02-0207', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDNToIslamic(2021489);

        const expectedDate = new CalendarDate(207, 2, 20);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDN 2058045 to the Islamic Calendar date 18-04-0310', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDNToIslamic(2058045);

        const expectedDate = new CalendarDate(310, 4, 18);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDN 2094601 to the Islamic Calendar date 15-06-0413', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDNToIslamic(2094601);

        const expectedDate = new CalendarDate(413, 6, 15);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDN 2131095 to the Islamic Calendar date 09-06-0516', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDNToIslamic(2131095);

        const expectedDate = new CalendarDate(516, 6, 9);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDN 2167584 to the Islamic Calendar date 28-05-0619', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDNToIslamic(2167584);

        const expectedDate = new CalendarDate(619, 5, 28);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDN 2204109 to the Islamic Calendar date 24-06-0722', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDNToIslamic(2204109);

        const expectedDate = new CalendarDate(722, 6, 24);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDN 2240652 to the Islamic Calendar date 08-08-0825', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDNToIslamic(2240652);

        const expectedDate = new CalendarDate(825, 8, 8);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDN 2277174 to the Islamic Calendar date 01-09-0928', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDNToIslamic(2277174);

        const expectedDate = new CalendarDate(928, 9, 1);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDN 2313711 to the Islamic Calendar date 08-10-1031', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDNToIslamic(2313711);

        const expectedDate = new CalendarDate(1031, 10, 8);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDN 2350258 to the Islamic Calendar date 27-11-1134', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDNToIslamic(2350258);

        const expectedDate = new CalendarDate(1134, 11, 27);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDN 2386790 to the Islamic Calendar date 29-12-1237', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDNToIslamic(2386790);

        const expectedDate = new CalendarDate(1237, 12, 29);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDN 2423374 to the Islamic Calendar date 25-03-1341', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDNToIslamic(2423374);

        const expectedDate = new CalendarDate(1341, 3, 25);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

    it('convert the JDN 2451482 to the Islamic Calendar date 20-07-1420', () => {
        const islamicCalendarDate = JDNConvertibleConversionModule.JDNToIslamic(2451482);

        const expectedDate = new CalendarDate(1420, 7, 20);

        checkCalendarDate(expectedDate, islamicCalendarDate);
    });

});


//
// Julian to JDN and back
//
describe('JDN conversions to Julian calendar and back', () => {

    it('convert the Julian Calendar date 2017-11-23 to JDN', () => {

        const julianCalendarDate: CalendarDate = new CalendarDate(2017, 11, 23);
        const jdn = JDNConvertibleConversionModule.julianToJDN(julianCalendarDate);

        checkJDN(2458094, jdn);
    });

    it('convert the JDN 2458094 back to the Julian Calendar date 23-11-2017', () => {
        const julianCalendarDate = JDNConvertibleConversionModule.JDNToJulian(2458094);

        const expectedDate = new CalendarDate(2017, 11, 23);

        checkCalendarDate(expectedDate, julianCalendarDate);
    });

    it('convert the Julian Calendar date 1582-10-15 to JDN', () => {

        const julianCalendarDate: CalendarDate = new CalendarDate(1582, 10, 15);
        const jdn = JDNConvertibleConversionModule.julianToJDN(julianCalendarDate);

        checkJDN(2299171, jdn);
    });

    it('convert the JDN 2299171 back to the Julian Calendar date 15-10-1582', () => {
        const julianCalendarDate = JDNConvertibleConversionModule.JDNToJulian(2299171);

        const expectedDate = new CalendarDate(1582, 10, 15);

        checkCalendarDate(expectedDate, julianCalendarDate);
    });

    it('convert the Julian Calendar date (-1000)-01-01 to JDN', () => {

        const julianCalendarDate: CalendarDate = new CalendarDate(-1000, 1, 1);
        const jdn = JDNConvertibleConversionModule.julianToJDN(julianCalendarDate);

        checkJDN(1355808, jdn);
    });

    it('convert the JDN 1355808 back to the Julian Calendar date 01-01-(-1000)', () => {
        const julianCalendarDate = JDNConvertibleConversionModule.JDNToJulian(1355808);

        const expectedDate = new CalendarDate(-1000, 1, 1);

        checkCalendarDate(expectedDate, julianCalendarDate);
    });

});

//
// Conversions between different calendars
//
describe('Conversions from JDN to Gregorian and Julian calendar and in between conversions', () => {

    it('create a Gregorian date from JDN using an example from Meeus', () => {

        // see sample calculation in Jean Meeus: Astronomical Algorithms, 1998, p. 65.

        const gregorianCalendar = new GregorianCalendarDate(new JDNPeriod(2434924, 2434924));

        const gregorianCalendarPeriod: CalendarPeriod = gregorianCalendar.toCalendarPeriod();

        const expectedDate = new CalendarDate(1954, 6, 30, 3);

        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodEnd);

    });

    it('create a Julian date from JDN using an example from Meeus', () => {

        // see sample calculation in Jean Meeus: Astronomical Algorithms, 1998, p. 65.

        const julianCalendar = new JulianCalendarDate(new JDNPeriod(2434924, 2434924));

        const julianCalendarPeriod = julianCalendar.toCalendarPeriod();

        const expectedDate = new CalendarDate(1954, 6, 17, 3);

        checkCalendarDate(expectedDate, julianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, julianCalendarPeriod.periodEnd);

    });

    it('convert a Gregorian date into a Julian date', () => {

        // Gregorian Calendar date 06-12-2017
        const jdn = 2458094;

        const gregorianDate: GregorianCalendarDate = new GregorianCalendarDate(new JDNPeriod(jdn, jdn));

        const gregorianCalendarPeriod: CalendarPeriod = gregorianDate.toCalendarPeriod();

        const expectedGregorianDate = new CalendarDate(2017, 12, 6, 3);

        checkCalendarDate(expectedGregorianDate, gregorianCalendarPeriod.periodStart);
        checkCalendarDate(expectedGregorianDate, gregorianCalendarPeriod.periodEnd);

        const julianDate: JDNConvertibleCalendar = gregorianDate.convertCalendar('Julian');

        const jdnPeriod = julianDate.toJDNPeriod();

        checkJDN(jdn, jdnPeriod.periodStart);
        checkJDN(jdn, jdnPeriod.periodEnd);

        const julianCalendarPeriod = julianDate.toCalendarPeriod();

        const expectedJulianDate = new CalendarDate(2017, 11, 23, 3);

        checkCalendarDate(expectedJulianDate, julianCalendarPeriod.periodStart);
        checkCalendarDate(expectedJulianDate, julianCalendarPeriod.periodEnd);

    });

    it('create a Gregorian date from JDN 2299160', () => {

        const gregorianCalendar = new GregorianCalendarDate(new JDNPeriod(2299160, 2299160));

        const gregorianCalendarPeriod: CalendarPeriod = gregorianCalendar.toCalendarPeriod();

        const expectedDate = new CalendarDate(1582, 10, 14, 4);

        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodEnd);

    });

    it('create a Julian date from JDN 2299160', () => {

        const julianCalendar = new JulianCalendarDate(new JDNPeriod(2299160, 2299160));

        const julianCalendarPeriod = julianCalendar.toCalendarPeriod();

        const expectedDate = new CalendarDate(1582, 10, 4, 4);

        checkCalendarDate(expectedDate, julianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, julianCalendarPeriod.periodEnd);

    });

    it('convert a Gregorian date into a Julian date', () => {

        // Gregorian Calendar date 04-10-1582
        const jdn = 2299160;

        const gregorianDate: GregorianCalendarDate = new GregorianCalendarDate(new JDNPeriod(jdn, jdn));

        const gregorianCalendarPeriod: CalendarPeriod = gregorianDate.toCalendarPeriod();

        const expectedGregorianDate = new CalendarDate(1582, 10, 14, 4);

        checkCalendarDate(expectedGregorianDate, gregorianCalendarPeriod.periodStart);
        checkCalendarDate(expectedGregorianDate, gregorianCalendarPeriod.periodEnd);

        const julianDate: JDNConvertibleCalendar = gregorianDate.convertCalendar('Julian');

        const jdnPeriod = julianDate.toJDNPeriod();

        checkJDN(jdn, jdnPeriod.periodStart);
        checkJDN(jdn, jdnPeriod.periodEnd);

        const julianCalendarPeriod = julianDate.toCalendarPeriod();

        const expectedJulianDate = new CalendarDate(1582, 10, 4, 4);

        checkCalendarDate(expectedJulianDate, julianCalendarPeriod.periodStart);
        checkCalendarDate(expectedJulianDate, julianCalendarPeriod.periodEnd);

    });

    it('create a Gregorian date from JDN 2299161', () => {

        const gregorianCalendar = new GregorianCalendarDate(new JDNPeriod(2299161, 2299161));

        const gregorianCalendarPeriod: CalendarPeriod = gregorianCalendar.toCalendarPeriod();

        const expectedDate = new CalendarDate(1582, 10, 15, 5);

        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodEnd);

    });

    it('create a Julian date from JDN 2299161', () => {

        const julianCalendar = new JulianCalendarDate(new JDNPeriod(2299161, 2299161));

        const julianCalendarPeriod = julianCalendar.toCalendarPeriod();

        const expectedDate = new CalendarDate(1582, 10, 5, 5);

        checkCalendarDate(expectedDate, julianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, julianCalendarPeriod.periodEnd);

    });

    it('convert a Gregorian date into a Julian date', () => {

        // Gregorian Calendar date 15-10-1582
        const jdn = 2299161;

        const gregorianDate: GregorianCalendarDate = new GregorianCalendarDate(new JDNPeriod(jdn, jdn));

        const gregorianCalendarPeriod: CalendarPeriod = gregorianDate.toCalendarPeriod();

        const expectedGregorianDate = new CalendarDate(1582, 10, 15, 5);

        checkCalendarDate(expectedGregorianDate, gregorianCalendarPeriod.periodStart);
        checkCalendarDate(expectedGregorianDate, gregorianCalendarPeriod.periodEnd);

        const julianDate: JDNConvertibleCalendar = gregorianDate.convertCalendar('Julian');

        const jdnPeriod = julianDate.toJDNPeriod();

        checkJDN(jdn, jdnPeriod.periodStart);
        checkJDN(jdn, jdnPeriod.periodEnd);

        const julianCalendarPeriod = julianDate.toCalendarPeriod();

        const expectedJulianDate = new CalendarDate(1582, 10, 5, 5);

        checkCalendarDate(expectedJulianDate, julianCalendarPeriod.periodStart);
        checkCalendarDate(expectedJulianDate, julianCalendarPeriod.periodEnd);

    });

    it('create a Gregorian date from JDN 1355808', () => {

        const gregorianCalendar = new GregorianCalendarDate(new JDNPeriod(1355808, 1355808));

        const gregorianCalendarPeriod: CalendarPeriod = gregorianCalendar.toCalendarPeriod();

        const expectedDate = new CalendarDate(-1001, 12, 22, 0);

        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodEnd);

    });

    it('create a Julian date from JDN 1355808', () => {

        const julianCalendar = new JulianCalendarDate(new JDNPeriod(1355808, 1355808));

        const julianCalendarPeriod = julianCalendar.toCalendarPeriod();

        const expectedDate = new CalendarDate(-1000, 1, 1, 0);

        checkCalendarDate(expectedDate, julianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, julianCalendarPeriod.periodEnd);

    });

    it('convert a Gregorian date into a Julian date', () => {

        // Gregorian Calendar date 01-01-(-1000)
        const jdn = 1355808;

        const gregorianDate: GregorianCalendarDate = new GregorianCalendarDate(new JDNPeriod(jdn, jdn));

        const gregorianCalendarPeriod: CalendarPeriod = gregorianDate.toCalendarPeriod();

        const expectedGregorianDate = new CalendarDate(-1001, 12, 22, 0);

        checkCalendarDate(expectedGregorianDate, gregorianCalendarPeriod.periodStart);
        checkCalendarDate(expectedGregorianDate, gregorianCalendarPeriod.periodEnd);

        const julianDate: JDNConvertibleCalendar = gregorianDate.convertCalendar('Julian');

        const jdnPeriod = julianDate.toJDNPeriod();

        checkJDN(jdn, jdnPeriod.periodStart);
        checkJDN(jdn, jdnPeriod.periodEnd);

        const julianCalendarPeriod = julianDate.toCalendarPeriod();

        const expectedJulianDate = new CalendarDate(-1000, 1, 1, 0);

        checkCalendarDate(expectedJulianDate, julianCalendarPeriod.periodStart);
        checkCalendarDate(expectedJulianDate, julianCalendarPeriod.periodEnd);

    });

    it('convert an Islamic date into a Gregorian date', () => {

        // Islamic calendar date 17-03-1439
        const jdn = 2458094;

        const islamicDate: IslamicCalendarDate = new IslamicCalendarDate(new JDNPeriod(jdn, jdn));

        const islamicCalendarPeriod: CalendarPeriod = islamicDate.toCalendarPeriod();

        const expectedIslamicDate = new CalendarDate(1439, 3, 17, 3);

        checkCalendarDate(expectedIslamicDate, islamicCalendarPeriod.periodStart);
        checkCalendarDate(expectedIslamicDate, islamicCalendarPeriod.periodEnd);

        const gregorianDate: JDNConvertibleCalendar = islamicDate.convertCalendar('Gregorian');

        const jdnPeriod = gregorianDate.toJDNPeriod();

        checkJDN(jdn, jdnPeriod.periodStart);
        checkJDN(jdn, jdnPeriod.periodEnd);

        const gregorianCalendarPeriod = gregorianDate.toCalendarPeriod();

        const expectedGregorianDate = new CalendarDate(2017, 12, 6, 3);

        checkCalendarDate(expectedGregorianDate, gregorianCalendarPeriod.periodStart);
        checkCalendarDate(expectedGregorianDate, gregorianCalendarPeriod.periodEnd);

    });

    it('convert a Gregorian into an Islamic date', () => {

        // Gregorian calendar date 06-04-2000
        const jdn =  2451641;

        const gregorianDate: GregorianCalendarDate = new GregorianCalendarDate(new JDNPeriod(jdn, jdn));

        const gregorianCalendarPeriod: CalendarPeriod = gregorianDate.toCalendarPeriod();

        const expectedGregorianDate = new CalendarDate(2000, 4, 6, 4);

        checkCalendarDate(expectedGregorianDate, gregorianCalendarPeriod.periodStart);
        checkCalendarDate(expectedGregorianDate, gregorianCalendarPeriod.periodEnd);

        const islamicDate: JDNConvertibleCalendar = gregorianDate.convertCalendar('Islamic');

        const jdnPeriod = islamicDate.toJDNPeriod();

        checkJDN(jdn, jdnPeriod.periodStart);
        checkJDN(jdn, jdnPeriod.periodEnd);

        const islamicCalendarPeriod = islamicDate.toCalendarPeriod();

        const expectedIslamicDate = new CalendarDate(1421, 1, 1, 4);

        checkCalendarDate(expectedIslamicDate, islamicCalendarPeriod.periodStart);
        checkCalendarDate(expectedIslamicDate, islamicCalendarPeriod.periodEnd);

    });

});

//
// Determine number of days in a given month
//
describe('Get the number of days for a given month', () => {

    it('create a Gregorian date and get the number of days for a given Gregorian date\'s month', () => {

        // Gregorian Calendar date 06-12-2017
        const jdn = 2458094;

        const gregorianDate: GregorianCalendarDate = new GregorianCalendarDate(new JDNPeriod(jdn, jdn));

        const days: number = gregorianDate.daysInMonth(new CalendarDate(2017, 2, 15));

        assert.strictEqual(days, 28, `wrong number of days`);

    });

    it('create a Gregorian date and get the number of days for a given BCE Gregorian date\'s month ', () => {

        // Gregorian Calendar date 15-02-1900BCE
        const jdn = 1027510;

        const gregorianDate: GregorianCalendarDate = new GregorianCalendarDate(new JDNPeriod(jdn, jdn));

        const days: number = gregorianDate.daysInMonth(new CalendarDate(-1899, 2, 15));

        assert.strictEqual(days, 28, `wrong number of days`);

    });

    it('create a Gregorian date and get the number of days for a given BCE Gregorian date\'s month ', () => {

        // Gregorian Calendar date 15-02-99BCE
        const jdn = 1685309;

        const gregorianDate: GregorianCalendarDate = new GregorianCalendarDate(new JDNPeriod(jdn, jdn));

        const days: number = gregorianDate.daysInMonth(new CalendarDate(-98, 2, 15));

        assert.strictEqual(days, 28, `wrong number of days`);

    });

    it('create a Gregorian date and get the number of days for a given BCE Gregorian date\'s month ', () => {

        // Gregorian Calendar date 15-02-100BCE
        const jdn = 1684944;

        const gregorianDate: GregorianCalendarDate = new GregorianCalendarDate(new JDNPeriod(jdn, jdn));

        const days: number = gregorianDate.daysInMonth(new CalendarDate(-99, 2, 15));

        assert.strictEqual(days, 28, `wrong number of days`);

    });

    it('create a Gregorian date and get the number of days for a given BCE Gregorian date\'s month ', () => {

        // Gregorian Calendar date 15-02-101BCE
        const jdn = 1684578;

        const gregorianDate: GregorianCalendarDate = new GregorianCalendarDate(new JDNPeriod(jdn, jdn));

        const days: number = gregorianDate.daysInMonth(new CalendarDate(-100, 2, 15));

        assert.strictEqual(days, 29, `wrong number of days`);

    });

    it('create a Gregorian date and get the number of days for a given BCE Gregorian date\'s month ', () => {

        // Gregorian Calendar date 15-02-102BCE
        const jdn = 1684213;

        const gregorianDate: GregorianCalendarDate = new GregorianCalendarDate(new JDNPeriod(jdn, jdn));

        const days: number = gregorianDate.daysInMonth(new CalendarDate(-101, 2, 15));

        assert.strictEqual(days, 28, `wrong number of days`);

    });


    it('create a Julian date and get the number of days for a given Julian\'s date\'s month', () => {

        // Julian Calendar date 01-01-2017
        const jdn = 2457768;

        const julianDate = new JulianCalendarDate(new JDNPeriod(jdn, jdn));

        const days: number = julianDate.daysInMonth(new CalendarDate(2017, 2, 15));

        assert.strictEqual(days, 28, `wrong number of days`);

    });

    it('create an Islamic date and get the number of days for a given Islamic date\'s month', () => {

        // Islamic Calendar date 16-04-1438
        const jdn = 2457768;

        const islamicDate: IslamicCalendarDate = new IslamicCalendarDate(new JDNPeriod(jdn, jdn));

        const days: number = islamicDate.daysInMonth(new CalendarDate(1438, 4, 16));

        assert.strictEqual(days, 29, `wrong number of days`);

    });

    it('create an Islamic date and get the number of days for a given Islamic date\'s month', () => {

        // Islamic Calendar date 18-05-1438
        const jdn = 2457799;

        const islamicDate: IslamicCalendarDate = new IslamicCalendarDate(new JDNPeriod(jdn, jdn));

        const days: number = islamicDate.daysInMonth(new CalendarDate(1438, 5, 18));

        assert.strictEqual(days, 30, `wrong number of days`);

    });

    it('create an Islamic date and get the number of days for a given Islamic date\'s month', () => {

        // Islamic Calendar date 16-06-1438
        const jdn = 2457827;

        const islamicDate: IslamicCalendarDate = new IslamicCalendarDate(new JDNPeriod(jdn, jdn));

        const days: number = islamicDate.daysInMonth(new CalendarDate(1438, 6, 16));

        assert.strictEqual(days, 29, `wrong number of days`);

    });

    it('create an Islamic date and get the number of days for a given Islamic date\'s month', () => {

        // Islamic Calendar date 18-07-1438
        const jdn = 2457858;

        const islamicDate: IslamicCalendarDate = new IslamicCalendarDate(new JDNPeriod(jdn, jdn));

        const days: number = islamicDate.daysInMonth(new CalendarDate(1438, 7, 18));

        assert.strictEqual(days, 30, `wrong number of days`);

    });

    it('create an Islamic date and get the number of days for a given Islamic date\'s month', () => {

        // Islamic Calendar date 18-08-1438
        const jdn = 2457888;

        const islamicDate: IslamicCalendarDate = new IslamicCalendarDate(new JDNPeriod(jdn, jdn));

        const days: number = islamicDate.daysInMonth(new CalendarDate(1438, 8, 18));

        assert.strictEqual(days, 29, `wrong number of days`);

    });

    it('create an Islamic date and get the number of days for a given Islamic date\'s month', () => {

        // Islamic Calendar date 20-09-1438
        const jdn = 2457919;

        const islamicDate: IslamicCalendarDate = new IslamicCalendarDate(new JDNPeriod(jdn, jdn));

        const days: number = islamicDate.daysInMonth(new CalendarDate(1438, 9, 20));

        assert.strictEqual(days, 30, `wrong number of days`);

    });

    it('create an Islamic date and get the number of days for a given Islamic date\'s month', () => {

        // Islamic Calendar date 20-10-1438
        const jdn = 2457949;

        const islamicDate: IslamicCalendarDate = new IslamicCalendarDate(new JDNPeriod(jdn, jdn));

        const days: number = islamicDate.daysInMonth(new CalendarDate(1438, 10, 20));

        assert.strictEqual(days, 29, `wrong number of days`);

    });

    it('create an Islamic date and get the number of days for a given Islamic date\'s month', () => {

        // Islamic Calendar date 22-11-1438
        const jdn = 2457980;

        const islamicDate: IslamicCalendarDate = new IslamicCalendarDate(new JDNPeriod(jdn, jdn));

        const days: number = islamicDate.daysInMonth(new CalendarDate(1438, 11, 22));

        assert.strictEqual(days, 30, `wrong number of days`);

    });

    it('create an Islamic date and get the number of days for a given Islamic date\'s month', () => {

        // Islamic Calendar date 23-12-1438
        const jdn = 2458011;

        const islamicDate: IslamicCalendarDate = new IslamicCalendarDate(new JDNPeriod(jdn, jdn));

        const days: number = islamicDate.daysInMonth(new CalendarDate(1438, 12, 23));

        assert.strictEqual(days, 29, `wrong number of days`);

    });

    it('create an Islamic date and get the number of days for a given Islamic date\'s month', () => {

        // Islamic Calendar date 24-01-1439
        const jdn = 2458041;

        const islamicDate: IslamicCalendarDate = new IslamicCalendarDate(new JDNPeriod(jdn, jdn));

        const days: number = islamicDate.daysInMonth(new CalendarDate(1439, 1, 24));

        assert.strictEqual(days, 30, `wrong number of days`);

    });

    it('create an Islamic date and get the number of days for a given Islamic date\'s month', () => {

        // Islamic Calendar date 25-02-1439
        const jdn = 2458072;

        const islamicDate: IslamicCalendarDate = new IslamicCalendarDate(new JDNPeriod(jdn, jdn));

        const days: number = islamicDate.daysInMonth(new CalendarDate(1439, 2, 25));

        assert.strictEqual(days, 29, `wrong number of days`);

    });

    it('create an Islamic date and get the number of days for a given Islamic date\'s month', () => {

        // Islamic Calendar date 26-03-1439
        const jdn = 2458102;

        const islamicDate: IslamicCalendarDate = new IslamicCalendarDate(new JDNPeriod(jdn, jdn));

        const days: number = islamicDate.daysInMonth(new CalendarDate(1439, 3, 26));

        assert.strictEqual(days, 30, `wrong number of days`);

    });
    it('create an Islamic date and get the number of days for month 12 in a leap year (30 instead of 29)', () => {

        // Islamic Calendar date 22-12-1439
        const jdn = 2458364;

        const islamicDate: IslamicCalendarDate = new IslamicCalendarDate(new JDNPeriod(jdn, jdn));

        const days: number = islamicDate.daysInMonth(new CalendarDate(1439, 12, 22));

        assert.strictEqual(days, 30, `wrong number of days`);

    });

});

//
// Transpose a date by a given number of days
//
describe('Create a date and transpose it by a given number of days', () => {

    it('create the Gregorian date 06-12-2017 and shift it 365 days into the future', () => {

        // Gregorian Calendar date 06-12-2017
        const jdn = 2458094;

        const gregorianDate: GregorianCalendarDate = new GregorianCalendarDate(new JDNPeriod(jdn, jdn));

        // shift date 365 into the future
        gregorianDate.transposePeriodByDay(365);

        const gregorianCalendarPeriod = gregorianDate.toCalendarPeriod();

        const expectedDate = new CalendarDate(2018, 12, 6, 4);

        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodEnd);

        const jdnPeriod = gregorianDate.toJDNPeriod();

        checkJDN(jdn + 365, jdnPeriod.periodStart);
        checkJDN(jdn + 365, jdnPeriod.periodEnd);

    });

    it('create the Gregorian date 06-12-2017 and shift it 365 days into the past', () => {

        // Gregorian Calendar date 06-12-2017
        const jdn = 2458094;

        const gregorianDate: GregorianCalendarDate = new GregorianCalendarDate(new JDNPeriod(jdn, jdn));

        // shift date 365 into the future
        gregorianDate.transposePeriodByDay(-365);

        const gregorianCalendarPeriod = gregorianDate.toCalendarPeriod();

        const expectedDate = new CalendarDate(2016, 12, 6, 2);

        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodEnd);

        const jdnPeriod = gregorianDate.toJDNPeriod();

        checkJDN(jdn - 365, jdnPeriod.periodStart);
        checkJDN(jdn - 365, jdnPeriod.periodEnd);

    });

    it('shift the Islamic date 16-04-1438 365 days into the future', () => {

        // Islamic Calendar date 16-04-1438
        const jdn = 2457768;

        const islamicDate: IslamicCalendarDate = new IslamicCalendarDate(new JDNPeriod(jdn, jdn));

        // shift date 365 into the future
        islamicDate.transposePeriodByDay(365);

        const islamicCalendarPeriod = islamicDate.toCalendarPeriod();

        const expectedDate = new CalendarDate(1439, 4, 26, 0);

        checkCalendarDate(expectedDate, islamicCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, islamicCalendarPeriod.periodEnd);

        const jdnPeriod = islamicDate.toJDNPeriod();

        checkJDN(jdn + 365, jdnPeriod.periodStart);
        checkJDN(jdn + 365, jdnPeriod.periodEnd);

    });

    it('shift the Islamic date 18-05-1438 365 days into the future', () => {

        // Islamic Calendar date 18-05-1438
        const jdn = 2457799;

        const islamicDate: IslamicCalendarDate = new IslamicCalendarDate(new JDNPeriod(jdn, jdn));

        // shift date 365 into the future
        islamicDate.transposePeriodByDay(365);

        const islamicCalendarPeriod = islamicDate.toCalendarPeriod();

        const expectedDate = new CalendarDate(1439, 5, 28, 3);

        checkCalendarDate(expectedDate, islamicCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, islamicCalendarPeriod.periodEnd);

        const jdnPeriod = islamicDate.toJDNPeriod();

        checkJDN(jdn + 365, jdnPeriod.periodStart);
        checkJDN(jdn + 365, jdnPeriod.periodEnd);

    });

    it('shift the Islamic date 18-05-1438 365 days into the past', () => {

        // Islamic Calendar date 18-05-1438
        const jdn = 2457799;

        const islamicDate: IslamicCalendarDate = new IslamicCalendarDate(new JDNPeriod(jdn, jdn));

        // shift date 365 into the future
        islamicDate.transposePeriodByDay(-365);

        const islamicCalendarPeriod = islamicDate.toCalendarPeriod();

        const expectedDate = new CalendarDate(1437, 5, 6, 1);

        checkCalendarDate(expectedDate, islamicCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, islamicCalendarPeriod.periodEnd);

        const jdnPeriod = islamicDate.toJDNPeriod();

        checkJDN(jdn - 365, jdnPeriod.periodStart);
        checkJDN(jdn - 365, jdnPeriod.periodEnd);

    });

});

//
// Transpose a date by a given number of years
//
describe('Create a date and transpose it by a given number of years', () => {

    it('create the Gregorian date 06-12-2017 and shift it one year into the future', () => {

        // Gregorian Calendar date 06-12-2017
        const jdn = 2458094;

        const gregorianDate: GregorianCalendarDate = new GregorianCalendarDate(new JDNPeriod(jdn, jdn));

        // shift date one year into the future
        gregorianDate.transposePeriodByYear(1);

        const gregorianCalendarPeriod = gregorianDate.toCalendarPeriod();

        const expectedDate = new CalendarDate(2018, 12, 6, 4);

        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodEnd);

        const jdnPeriod = gregorianDate.toJDNPeriod();

        checkJDN(jdn + 365, jdnPeriod.periodStart);
        checkJDN(jdn + 365, jdnPeriod.periodEnd);

    });

    it('create the Gregorian date 06-12-2017 and shift it one year into the past', () => {

        // Gregorian Calendar date 06-12-2017
        const jdn = 2458094;

        const gregorianDate: GregorianCalendarDate = new GregorianCalendarDate(new JDNPeriod(jdn, jdn));

        // shift date 365 into the future
        gregorianDate.transposePeriodByYear(-1);

        const gregorianCalendarPeriod = gregorianDate.toCalendarPeriod();

        const expectedDate = new CalendarDate(2016, 12, 6, 2);

        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodEnd);

        const jdnPeriod = gregorianDate.toJDNPeriod();

        checkJDN(jdn - 365, jdnPeriod.periodStart);
        checkJDN(jdn - 365, jdnPeriod.periodEnd);

    });

    it('create the Islamic date 18-05-1438 and shift it one year into the future', () => {

        // Islamic Calendar date 18-05-1438
        const jdn = 2457800;

        const islamicDate: IslamicCalendarDate = new IslamicCalendarDate(new JDNPeriod(jdn, jdn));

        // shift date one year into the future
        islamicDate.transposePeriodByYear(1);

        const islamicCalendarPeriod = islamicDate.toCalendarPeriod();

        const expectedDate = new CalendarDate(1439, 5, 18, 0);

        checkCalendarDate(expectedDate, islamicCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, islamicCalendarPeriod.periodEnd);

        const jdnPeriod = islamicDate.toJDNPeriod();

        checkJDN(jdn + 354, jdnPeriod.periodStart);
        checkJDN(jdn + 354, jdnPeriod.periodEnd);

    });

    it('create the Islamic date 18-05-1438 and shift it five years into the past', () => {

        // Islamic Calendar date 18-05-1438
        const jdn = 2457800;

        const islamicDate: IslamicCalendarDate = new IslamicCalendarDate(new JDNPeriod(jdn, jdn));

        // shift date one year into the future
        islamicDate.transposePeriodByYear(-5);

        const islamicCalendarPeriod = islamicDate.toCalendarPeriod();

        const expectedDate = new CalendarDate(1433, 5, 18, 2);

        checkCalendarDate(expectedDate, islamicCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, islamicCalendarPeriod.periodEnd);

        const jdnPeriod = islamicDate.toJDNPeriod();

        checkJDN(jdn - 354 - 354 - 355 - 354 - 355, jdnPeriod.periodStart);
        checkJDN(jdn - 354 - 354 - 355 - 354 - 355, jdnPeriod.periodEnd);

    });

});

//
// Transpose a date by a given number of months
//
describe('Create a date and transpose it by a given number of months', () => {

    it('create the Gregorian date 31-12-2017 and shift it one month into the future', () => {

        // Gregorian Calendar date 31-12-2017
        const jdn = 2458119;

        const gregorianDate: GregorianCalendarDate = new GregorianCalendarDate(new JDNPeriod(jdn, jdn));

        // shift date one month into the future
        gregorianDate.transposePeriodByMonth(1);

        const gregorianCalendarPeriod = gregorianDate.toCalendarPeriod();

        const expectedDate = new CalendarDate(2018, 1, 31, 3);

        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodEnd);

        const jdnPeriod = gregorianDate.toJDNPeriod();

        checkJDN(jdn + 31, jdnPeriod.periodStart);
        checkJDN(jdn + 31, jdnPeriod.periodEnd);

    });

    it('create the Gregorian date 31-03-2017 and shift it 6 months into the future', () => {

        // Gregorian Calendar date 31-03-2017
        const jdn = 2457844;

        const gregorianDate: GregorianCalendarDate = new GregorianCalendarDate(new JDNPeriod(jdn, jdn));

        // shift date six months into the future
        gregorianDate.transposePeriodByMonth(6);

        const gregorianCalendarPeriod = gregorianDate.toCalendarPeriod();

        const expectedDate = new CalendarDate(2017, 9, 30, 6);

        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodEnd);

        const jdnPeriod = gregorianDate.toJDNPeriod();

        checkJDN(jdn + 30 + 31 + 30 + 31 + 31 + 30, jdnPeriod.periodStart);
        checkJDN(jdn + 30 + 31 + 30 + 31 + 31 + 30, jdnPeriod.periodEnd);

    });

    it('create the Gregorian date 15-03-2017 and shift it 2 months into the future', () => {

        // Gregorian Calendar date 15-03-2017
        const jdn = 2457828;

        const gregorianDate: GregorianCalendarDate = new GregorianCalendarDate(new JDNPeriod(jdn, jdn));

        // shift date two months into the future
        gregorianDate.transposePeriodByMonth(2);

        const gregorianCalendarPeriod = gregorianDate.toCalendarPeriod();

        const expectedDate = new CalendarDate(2017, 5, 15, 1);

        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodEnd);

        const jdnPeriod = gregorianDate.toJDNPeriod();

        checkJDN(jdn + 16 + 15 + 15 + 15, jdnPeriod.periodStart);
        checkJDN(jdn + 16 + 15 + 15 + 15, jdnPeriod.periodEnd);

    });

    it('create the Gregorian date 31-12-2017 and shift it one month into the past', () => {

        // Gregorian Calendar date 31-12-2017
        const jdn = 2458119;

        const gregorianDate: GregorianCalendarDate = new GregorianCalendarDate(new JDNPeriod(jdn, jdn));

        // shift date one month into the past
        gregorianDate.transposePeriodByMonth(-1);

        const gregorianCalendarPeriod = gregorianDate.toCalendarPeriod();

        const expectedDate = new CalendarDate(2017, 11, 30, 4);

        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodEnd);

        const jdnPeriod = gregorianDate.toJDNPeriod();

        checkJDN(jdn - 31, jdnPeriod.periodStart);
        checkJDN(jdn - 31, jdnPeriod.periodEnd);

    });

    it('create the Gregorian date 31-03-2017 and shift it one month into the past', () => {

        // Gregorian Calendar date 31-03-2017
        const jdn = 2457844;

        const gregorianDate: GregorianCalendarDate = new GregorianCalendarDate(new JDNPeriod(jdn, jdn));

        // shift date one month into the past
        gregorianDate.transposePeriodByMonth(-1);

        const gregorianCalendarPeriod = gregorianDate.toCalendarPeriod();

        const expectedDate = new CalendarDate(2017, 2, 28, 2);

        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodEnd);

        const jdnPeriod = gregorianDate.toJDNPeriod();

        checkJDN(jdn - 31, jdnPeriod.periodStart);
        checkJDN(jdn - 31, jdnPeriod.periodEnd);

    });

    it('create the Gregorian date 31-03-2017 and shift it three months into the past', () => {

        // Gregorian Calendar date 31-03-2017
        const jdn = 2457844;

        const gregorianDate: GregorianCalendarDate = new GregorianCalendarDate(new JDNPeriod(jdn, jdn));

        // shift date three months into the past
        gregorianDate.transposePeriodByMonth(-3);

        const gregorianCalendarPeriod = gregorianDate.toCalendarPeriod();

        const expectedDate = new CalendarDate(2016, 12, 31, 6);

        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodEnd);

        const jdnPeriod = gregorianDate.toJDNPeriod();

        checkJDN(jdn - 31 - 28 - 31, jdnPeriod.periodStart);
        checkJDN(jdn - 31 - 28 - 31, jdnPeriod.periodEnd);

    });

    it('create the Gregorian date 31-03-2017 and shift it 15 months into the past', () => {

        // Gregorian Calendar date 31-03-2017
        const jdn = 2457844;

        const gregorianDate: GregorianCalendarDate = new GregorianCalendarDate(new JDNPeriod(jdn, jdn));

        // shift date 15 months into the past
        gregorianDate.transposePeriodByMonth(-15);

        const gregorianCalendarPeriod = gregorianDate.toCalendarPeriod();

        const expectedDate = new CalendarDate(2015, 12, 31, 4);

        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, gregorianCalendarPeriod.periodEnd);

        const jdnPeriod = gregorianDate.toJDNPeriod();

        // 2016 is a leap year: 366 days
        checkJDN(jdn - 31 - 28 - 31 - 366, jdnPeriod.periodStart);
        checkJDN(jdn - 31 - 28 - 31 - 366, jdnPeriod.periodEnd);

    });

    it('create the Islamic date 18-12-1438 and shift it one month into the future', () => {

        // Islamic Calendar date 18-12-1438
        const jdn = 2458007;

        const islamicDate: IslamicCalendarDate = new IslamicCalendarDate(new JDNPeriod(jdn, jdn));

        // shift date one year into the future
        islamicDate.transposePeriodByMonth(1);

        const islamicCalendarPeriod = islamicDate.toCalendarPeriod();

        const expectedDate = new CalendarDate(1439, 1, 18, 1);

        checkCalendarDate(expectedDate, islamicCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, islamicCalendarPeriod.periodEnd);

        const jdnPeriod = islamicDate.toJDNPeriod();

        checkJDN(jdn + 29, jdnPeriod.periodStart);
        checkJDN(jdn + 29, jdnPeriod.periodEnd);

    });

    it('create the Islamic date 18-12-1434 (leap year) and shift it one month into the future', () => {

        // Islamic Calendar date 18-12-1434
        const jdn = 2456589;

        const islamicDate: IslamicCalendarDate = new IslamicCalendarDate(new JDNPeriod(jdn, jdn));

        // shift date one year into the future
        islamicDate.transposePeriodByMonth(1);

        const islamicCalendarPeriod = islamicDate.toCalendarPeriod();

        const expectedDate = new CalendarDate(1435, 1, 18, 5);

        checkCalendarDate(expectedDate, islamicCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, islamicCalendarPeriod.periodEnd);

        const jdnPeriod = islamicDate.toJDNPeriod();

        checkJDN(jdn + 30, jdnPeriod.periodStart);
        checkJDN(jdn + 30, jdnPeriod.periodEnd);

    });

    it('create the Islamic date 18-01-1439 and shift it one month into the past', () => {

        // Islamic Calendar date 18-01-1439
        const jdn = 2458036;

        const islamicDate: IslamicCalendarDate = new IslamicCalendarDate(new JDNPeriod(jdn, jdn));

        // shift date one year into the future
        islamicDate.transposePeriodByMonth(-1);

        const islamicCalendarPeriod = islamicDate.toCalendarPeriod();

        const expectedDate = new CalendarDate(1438, 12, 18, 0);

        checkCalendarDate(expectedDate, islamicCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, islamicCalendarPeriod.periodEnd);

        const jdnPeriod = islamicDate.toJDNPeriod();

        checkJDN(jdn - 29, jdnPeriod.periodStart);
        checkJDN(jdn - 29, jdnPeriod.periodEnd);

    });

    it('create the Islamic date 18-01-1435 (leap year) and shift it one month into the past', () => {

        // Islamic Calendar date 18-01-1435
        const jdn = 2456619;

        const islamicDate: IslamicCalendarDate = new IslamicCalendarDate(new JDNPeriod(jdn, jdn));

        // shift date one year into the future
        islamicDate.transposePeriodByMonth(-1);

        const islamicCalendarPeriod = islamicDate.toCalendarPeriod();

        const expectedDate = new CalendarDate(1434, 12, 18, 3);

        checkCalendarDate(expectedDate, islamicCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, islamicCalendarPeriod.periodEnd);

        const jdnPeriod = islamicDate.toJDNPeriod();

        checkJDN(jdn - 30, jdnPeriod.periodStart);
        checkJDN(jdn - 30, jdnPeriod.periodEnd);

    });

    it('create the Islamic date 18-12-1438 and shift it six months into the future', () => {

        // Islamic Calendar date 18-12-1438
        const jdn = 2458007;

        const islamicDate: IslamicCalendarDate = new IslamicCalendarDate(new JDNPeriod(jdn, jdn));

        // shift date one year into the future
        islamicDate.transposePeriodByMonth(6);

        const islamicCalendarPeriod = islamicDate.toCalendarPeriod();

        const expectedDate = new CalendarDate(1439, 6, 18, 2);

        checkCalendarDate(expectedDate, islamicCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, islamicCalendarPeriod.periodEnd);

        const jdnPeriod = islamicDate.toJDNPeriod();

        checkJDN(jdn + 29 + 30 + 29 + 30 + 29 + 30, jdnPeriod.periodStart);
        checkJDN(jdn + 29 + 30 + 29 + 30 + 29 + 30, jdnPeriod.periodEnd);

    });

    it('create the Islamic date 18-12-1434 (leap year) and shift it six months into the future', () => {

        // Islamic Calendar date 18-12-1434
        const jdn = 2456589;

        const islamicDate: IslamicCalendarDate = new IslamicCalendarDate(new JDNPeriod(jdn, jdn));

        // shift date one year into the future
        islamicDate.transposePeriodByMonth(6);

        const islamicCalendarPeriod = islamicDate.toCalendarPeriod();

        const expectedDate = new CalendarDate(1435, 6, 18, 6);

        checkCalendarDate(expectedDate, islamicCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, islamicCalendarPeriod.periodEnd);

        const jdnPeriod = islamicDate.toJDNPeriod();

        checkJDN(jdn + 30 + 30 + 29 + 30 + 29 + 30, jdnPeriod.periodStart);
        checkJDN(jdn + 30 + 30 + 29 + 30 + 29 + 30, jdnPeriod.periodEnd);

    });

    it('create the Islamic date 18-01-1439 and shift it six months into the past', () => {

        // Islamic Calendar date 18-01-1439
        const jdn = 2458036;

        const islamicDate: IslamicCalendarDate = new IslamicCalendarDate(new JDNPeriod(jdn, jdn));

        // shift date one year into the future
        islamicDate.transposePeriodByMonth(-6);

        const islamicCalendarPeriod = islamicDate.toCalendarPeriod();

        const expectedDate = new CalendarDate(1438, 7, 18, 6);

        checkCalendarDate(expectedDate, islamicCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, islamicCalendarPeriod.periodEnd);

        const jdnPeriod = islamicDate.toJDNPeriod();

        checkJDN(jdn - 29 - 30 - 29 - 30 - 29 - 30, jdnPeriod.periodStart);
        checkJDN(jdn - 29 - 30 - 29 - 30 - 29 - 30, jdnPeriod.periodEnd);

    });

    it('create the Islamic date 18-01-1435 (1434 is leap year) and shift it six months into the past', () => {

        // Islamic Calendar date 18-01-1435
        const jdn = 2456619;

        const islamicDate: IslamicCalendarDate = new IslamicCalendarDate(new JDNPeriod(jdn, jdn));

        // shift date one year into the future
        islamicDate.transposePeriodByMonth(-6);

        const islamicCalendarPeriod = islamicDate.toCalendarPeriod();

        const expectedDate = new CalendarDate(1434, 7, 18, 2);

        checkCalendarDate(expectedDate, islamicCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, islamicCalendarPeriod.periodEnd);

        const jdnPeriod = islamicDate.toJDNPeriod();

        checkJDN(jdn - 30 - 30 - 29 - 30 - 29 - 30, jdnPeriod.periodStart);
        checkJDN(jdn - 30 - 30 - 29 - 30 - 29 - 30, jdnPeriod.periodEnd);

    });
});

//
// Create a JDN period
//
describe('Create a JDNPeriod', () => {


    it('attempt to create a JDN with invalid args: non integers', () => {

        // assert.throws(
        //     () => {
        //         new JDNPeriod(1.1, 2);
        //     },
        //     function (err: Error) {
        //         if ((err instanceof Error) && err.message === 'JDNs are expected to be integers') {
        //             return true;
        //         }
        //     }
        // );

    });

    it('attempt to create a JDN with invalid args: end greater than start', () => {

        // assert.throws(
        //     () => {
        //         new JDNPeriod(2, 1);
        //     },
        //     function (err: Error) {
        //
        //         if ((err instanceof Error) && err.message === 'start of a JDNPeriod must not be greater than its end') {
        //             return true;
        //         }
        //     }
        // );

    });

});

//
// BCE date testing
//
describe('For Julian and Gregorian calendar: Create a BCE date', () => {
    //
    // all our conversion routines use the year 0! Thus 44 BCE is -43
    //
    it('create the JDN for the Julian calendar date 15-03-44 BCE when Caesar was murdered and convert it to Gregorian', () => {

        // assassination of Caesar: Julian calendar date 15-03-44 BCE
        const jdn = JDNConvertibleConversionModule.julianToJDN(new CalendarDate(-43, 3, 15));

        checkJDN(1705426, jdn);

        const murderOfCaesarJulianCalendarDate = new JulianCalendarDate(new JDNPeriod(jdn, jdn));

        const murderOfJuliusCaesarJulianCalPeriod = murderOfCaesarJulianCalendarDate.toCalendarPeriod();

        // in the Julian calendar, there is a year 0 in the conversion algorithm we use: 44 BCE -> -43
        const expectedJulianCalendarDate = new CalendarDate(-43, 3, 15, 3);

        checkCalendarDate(expectedJulianCalendarDate, murderOfJuliusCaesarJulianCalPeriod.periodStart);
        checkCalendarDate(expectedJulianCalendarDate, murderOfJuliusCaesarJulianCalPeriod.periodEnd);

        const murderOfCaesarGregorianCalendarDate = murderOfCaesarJulianCalendarDate.convertCalendar('Gregorian');

        const murderOfJuliusCaesarGregorianCalPeriod = murderOfCaesarGregorianCalendarDate.toCalendarPeriod();

        // in the Gregorian calendar, there is a year 0 in the conversion algorithm we use: 44 BCE -> -43
        const expectedGregorianCalendarDate = new CalendarDate(-43, 3, 13, 3);

        checkCalendarDate(expectedGregorianCalendarDate, murderOfJuliusCaesarGregorianCalPeriod.periodStart);
        checkCalendarDate(expectedGregorianCalendarDate, murderOfJuliusCaesarGregorianCalPeriod.periodEnd);

        const jdnPeriodFromGregorian = murderOfCaesarGregorianCalendarDate.toJDNPeriod();

        checkJDN(jdn, jdnPeriodFromGregorian.periodStart);
        checkJDN(jdn, jdnPeriodFromGregorian.periodEnd);

    });

    it('shift the Julian calendar date 15-03-44 BCE into the future by one year', () => {

        // assassination of Caesar: Julian calendar date 15-03-44 BCE
        const jdn = 1705426;

        const julianCalendarDate: JulianCalendarDate = new JulianCalendarDate(new JDNPeriod(jdn, jdn));

        julianCalendarDate.transposePeriodByYear(1);

        const julianCalendarPeriod = julianCalendarDate.toCalendarPeriod();

        const expectedDate = new CalendarDate(-42, 3, 15, 4);

        checkCalendarDate(expectedDate, julianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, julianCalendarPeriod.periodEnd);

        const jdnPeriodFromJulian = julianCalendarDate.toJDNPeriod();

        checkJDN(jdn + 365, jdnPeriodFromJulian.periodStart);
        checkJDN(jdn + 365, jdnPeriodFromJulian.periodEnd);

    });

    it('shift the Julian calendar date 15-03-44 BCE into the past by one year', () => {

        // assassination of Caesar: Julian calendar date 15-03-44 BCE
        const jdn = 1705426;

        const julianCalendarDate: JulianCalendarDate = new JulianCalendarDate(new JDNPeriod(jdn, jdn));

        julianCalendarDate.transposePeriodByYear(-1);

        const julianCalendarPeriod = julianCalendarDate.toCalendarPeriod();

        // Julian calendar date 15-03-45 BCE
        const expectedDate = new CalendarDate(-44, 3, 15, 2);

        checkCalendarDate(expectedDate, julianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, julianCalendarPeriod.periodEnd);

        const jdnPeriodFromJulian = julianCalendarDate.toJDNPeriod();

        checkJDN(jdn - 365, jdnPeriodFromJulian.periodStart);
        checkJDN(jdn - 365, jdnPeriodFromJulian.periodEnd);

    });

    it('shift the Julian calendar date 15-03-44 BCE into the future by one month', () => {

        // assassination of Caesar: Julian calendar date 15-03-44 BCE
        const jdn = 1705426;

        const julianCalendarDate: JulianCalendarDate = new JulianCalendarDate(new JDNPeriod(jdn, jdn));

        julianCalendarDate.transposePeriodByMonth(1);

        const julianCalendarPeriod = julianCalendarDate.toCalendarPeriod();

        // Julian calendar date 15-04-44 BCE
        const expectedDate = new CalendarDate(-43, 4, 15, 6);

        checkCalendarDate(expectedDate, julianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, julianCalendarPeriod.periodEnd);

        const jdnPeriodFromJulian = julianCalendarDate.toJDNPeriod();

        checkJDN(jdn + 31, jdnPeriodFromJulian.periodStart);
        checkJDN(jdn + 31, jdnPeriodFromJulian.periodEnd);

    });

    it('shift the Julian calendar date 15-03-44 BCE into the future by 23 months', () => {

        // assassination of Caesar: Julian calendar date 15-03-44 BCE
        const jdn = 1705426;

        const julianCalendarDate: JulianCalendarDate = new JulianCalendarDate(new JDNPeriod(jdn, jdn));

        julianCalendarDate.transposePeriodByMonth(23);

        const julianCalendarPeriod = julianCalendarDate.toCalendarPeriod();

        // Julian calendar date 15-02-42 BCE
        const expectedDate = new CalendarDate(-41, 2, 15, 5);

        checkCalendarDate(expectedDate, julianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, julianCalendarPeriod.periodEnd);

        const jdnPeriodFromJulian = julianCalendarDate.toJDNPeriod();

        checkJDN(jdn + (2 * 365) - 28, jdnPeriodFromJulian.periodStart);
        checkJDN(jdn + (2 * 365) - 28, jdnPeriodFromJulian.periodEnd);

    });

    it('shift the Julian calendar date 15-03-44 BCE into the past by eleven months', () => {

        // assassination of Caesar: Julian calendar date 15-03-44 BCE
        const jdn = 1705426;

        const julianCalendarDate: JulianCalendarDate = new JulianCalendarDate(new JDNPeriod(jdn, jdn));

        julianCalendarDate.transposePeriodByMonth(-11);

        const julianCalendarPeriod = julianCalendarDate.toCalendarPeriod();

        // Julian calendar date 15-03-45 BCE
        const expectedDate = new CalendarDate(-44, 4, 15, 5);

        checkCalendarDate(expectedDate, julianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, julianCalendarPeriod.periodEnd);

        const jdnPeriodFromJulian = julianCalendarDate.toJDNPeriod();

        checkJDN(jdn - 365 + 31, jdnPeriodFromJulian.periodStart);
        checkJDN(jdn - 365 + 31, jdnPeriodFromJulian.periodEnd);

    });

    it('shift the Julian calendar date 15-03-44 BCE into the past by one month', () => {

        // assassination of Caesar: Julian calendar date 15-03-44 BCE
        const jdn = 1705426;

        const julianCalendarDate: JulianCalendarDate = new JulianCalendarDate(new JDNPeriod(jdn, jdn));

        julianCalendarDate.transposePeriodByMonth(-1);

        const julianCalendarPeriod = julianCalendarDate.toCalendarPeriod();

        // Julian calendar date 15-03-44 BCE
        const expectedDate = new CalendarDate(-43, 2, 15, 3);

        checkCalendarDate(expectedDate, julianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, julianCalendarPeriod.periodEnd);

        const jdnPeriodFromJulian = julianCalendarDate.toJDNPeriod();

        checkJDN(jdn - 28, jdnPeriodFromJulian.periodStart);
        checkJDN(jdn - 28, jdnPeriodFromJulian.periodEnd);

    });

    it('shift the Julian calendar date 15-03-44 BCE into the future by 10 days', () => {

        // assassination of Caesar: Julian calendar date 15-03-44 BCE
        const jdn = 1705426;

        const julianCalendarDate: JulianCalendarDate = new JulianCalendarDate(new JDNPeriod(jdn, jdn));

        julianCalendarDate.transposePeriodByDay(10);

        const julianCalendarPeriod = julianCalendarDate.toCalendarPeriod();

        // Julian calendar date 25-03-44 BCE
        const expectedDate = new CalendarDate(-43, 3, 25, 6);

        checkCalendarDate(expectedDate, julianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, julianCalendarPeriod.periodEnd);

        const jdnPeriodFromJulian = julianCalendarDate.toJDNPeriod();

        checkJDN(jdn + 10, jdnPeriodFromJulian.periodStart);
        checkJDN(jdn + 10, jdnPeriodFromJulian.periodEnd);

    });

    it('shift the Julian calendar date 15-03-44 BCE into the past by 10 days', () => {

        // assassination of Caesar: Julian calendar date 15-03-44 BCE
        const jdn = 1705426;

        const julianCalendarDate: JulianCalendarDate = new JulianCalendarDate(new JDNPeriod(jdn, jdn));

        julianCalendarDate.transposePeriodByDay(-10);

        const julianCalendarPeriod = julianCalendarDate.toCalendarPeriod();

        // Julian calendar date 05-03-44 BCE
        const expectedDate = new CalendarDate(-43, 3, 5, 0);

        checkCalendarDate(expectedDate, julianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, julianCalendarPeriod.periodEnd);

        const jdnPeriodFromJulian = julianCalendarDate.toJDNPeriod();

        checkJDN(jdn - 10, jdnPeriodFromJulian.periodStart);
        checkJDN(jdn - 10, jdnPeriodFromJulian.periodEnd);

    });

    it('shift the Julian Calendar date 31-12-1 BCE one day into the future and check for correct behaviour for year 0', () => {

        // Julian Calendar date 31-12-1 BCE
        const jdn = 1721423;

        const julianCalendarDate: JulianCalendarDate = new JulianCalendarDate(new JDNPeriod(jdn, jdn));

        julianCalendarDate.transposePeriodByDay(1);

        const julianCalendarPeriod = julianCalendarDate.toCalendarPeriod();

        // Julian Calendar dates have no year 0 (convention used in the conversions functions)
        // hence the year after -1 is the year 1
        const expectedDate = new CalendarDate(1, 1, 1, 6);

        checkCalendarDate(expectedDate, julianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, julianCalendarPeriod.periodEnd);

        const jdnPeriodFromJulian = julianCalendarDate.toJDNPeriod();

        checkJDN(jdn + 1, jdnPeriodFromJulian.periodStart);
        checkJDN(jdn + 1, jdnPeriodFromJulian.periodEnd);

    });

    it('shift the Julian Calendar date 31-12-1 BCE one month into the future and check for correct behaviour for year 0', () => {

        // Julian Calendar date 31-12-1 BCE
        const jdn = 1721423;

        const julianCalendarDate: JulianCalendarDate = new JulianCalendarDate(new JDNPeriod(jdn, jdn));

        julianCalendarDate.transposePeriodByMonth(1);

        const julianCalendarPeriod = julianCalendarDate.toCalendarPeriod();

        // Julian Calendar dates have no year 0 (convention used in the conversions functions)
        // hence the year after -1 is the year 1
        const expectedDate = new CalendarDate(1, 1, 31, 1);

        checkCalendarDate(expectedDate, julianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, julianCalendarPeriod.periodEnd);

        const jdnPeriodFromJulian = julianCalendarDate.toJDNPeriod();

        checkJDN(jdn + 31, jdnPeriodFromJulian.periodStart);
        checkJDN(jdn + 31, jdnPeriodFromJulian.periodEnd);

    });

    it('shift the Julian Calendar date 31-12-1 BCE one year into the future and check for correct behaviour for year 0', () => {

        // Julian Calendar date 31-12-1 BCE
        const jdn = 1721423;

        const julianCalendarDate: JulianCalendarDate = new JulianCalendarDate(new JDNPeriod(jdn, jdn));

        julianCalendarDate.transposePeriodByYear(1);

        const julianCalendarPeriod = julianCalendarDate.toCalendarPeriod();

        // Julian Calendar dates have no year 0 (convention used in the conversions functions)
        // hence the year after -1 is the year 1
        const expectedDate = new CalendarDate(1, 12, 31, 6);

        checkCalendarDate(expectedDate, julianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, julianCalendarPeriod.periodEnd);

        const jdnPeriodFromJulian = julianCalendarDate.toJDNPeriod();

        checkJDN(jdn + 365, jdnPeriodFromJulian.periodStart);
        checkJDN(jdn + 365, jdnPeriodFromJulian.periodEnd);

    });

    it('shift the Julian Calendar date 1-1-1 CE one day into the past and check for correct behaviour for year 0', () => {

        // Julian Calendar date 1-1-1 CE
        const jdn = 1721424;

        const julianCalendarDate: JulianCalendarDate = new JulianCalendarDate(new JDNPeriod(jdn, jdn));

        julianCalendarDate.transposePeriodByDay(-1);

        const julianCalendarPeriod = julianCalendarDate.toCalendarPeriod();

        // Julian Calendar dates have no year 0 (convention used in the conversions functions)
        // hence the year after -1 is the year 1
        const expectedDate = new CalendarDate(0, 12, 31, 5);

        checkCalendarDate(expectedDate, julianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, julianCalendarPeriod.periodEnd);

        const jdnPeriodFromJulian = julianCalendarDate.toJDNPeriod();

        checkJDN(jdn - 1, jdnPeriodFromJulian.periodStart);
        checkJDN(jdn - 1, jdnPeriodFromJulian.periodEnd);

    });

    it('shift the Julian Calendar date 1-1-1 CE one month into the past and check for correct behaviour for year 0', () => {

        // Julian Calendar date 1-1-1 CE
        const jdn = 1721424;

        const julianCalendarDate: JulianCalendarDate = new JulianCalendarDate(new JDNPeriod(jdn, jdn));

        julianCalendarDate.transposePeriodByMonth(-1);

        const julianCalendarPeriod = julianCalendarDate.toCalendarPeriod();

        // Julian Calendar dates have no year 0 (convention used in the conversions functions)
        // hence the year after -1 is the year 1
        const expectedDate = new CalendarDate(0, 12, 1, 3);

        checkCalendarDate(expectedDate, julianCalendarPeriod.periodStart);
        checkCalendarDate(expectedDate, julianCalendarPeriod.periodEnd);

        const jdnPeriodFromJulian = julianCalendarDate.toJDNPeriod();

        checkJDN(jdn - 31, jdnPeriodFromJulian.periodStart);
        checkJDN(jdn - 31, jdnPeriodFromJulian.periodEnd);

    });

});

//
// testing the day of week function
//
describe('Determine day of week from JDC', () => {

    it('Test for day of the week from JDC 2434923.5 to 3 (Wednesday)', () => {
        assert.strictEqual(JDNConvertibleConversionModule.dayOfWeekFromJDC(2434923.5), 3);
    });

    it('Test for day of the week from JDC 2434924.0 to 3 (Wednesday)', () => {
        assert.strictEqual(JDNConvertibleConversionModule.dayOfWeekFromJDC(2434924.0), 3);
    });

    it('Test for day of the week from JDC 2434924.4999 to 3 (Wednesday)', () => {
        assert.strictEqual(JDNConvertibleConversionModule.dayOfWeekFromJDC(2434924.4999), 3);
    });
});

describe('Instantiate a calendar date from a calendar period', () => {

    it('create a Gregorian date from an exact calendar period', () => {

        const gregorianCalendarDate: GregorianCalendarDate = new GregorianCalendarDate(new CalendarPeriod(new CalendarDate(2018, 7, 26), new CalendarDate(2018, 7, 26)));

        const calPeriod = gregorianCalendarDate.toCalendarPeriod();

        checkCalendarDate(new CalendarDate(2018, 7, 26), calPeriod.periodStart, false);
        checkCalendarDate(new CalendarDate(2018, 7, 26), calPeriod.periodEnd, false);

        const jdnPeriod = gregorianCalendarDate.toJDNPeriod();

        checkJDN(2458326, jdnPeriod.periodStart);
        checkJDN(2458326, jdnPeriod.periodEnd);

    });

    it('create a Gregorian date from a calendar period', () => {

        const gregorianCalendarDate: GregorianCalendarDate = new GregorianCalendarDate(new CalendarPeriod(new CalendarDate(2018, 7, 26), new CalendarDate(2018, 7, 27)));

        const calPeriod = gregorianCalendarDate.toCalendarPeriod();

        checkCalendarDate(new CalendarDate(2018, 7, 26), calPeriod.periodStart, false);
        checkCalendarDate(new CalendarDate(2018, 7, 27), calPeriod.periodEnd, false);

        const jdnPeriod = gregorianCalendarDate.toJDNPeriod();

        checkJDN(2458326, jdnPeriod.periodStart);
        checkJDN(2458327, jdnPeriod.periodEnd);

    });

    it('create a Julian date from an exact calendar period', () => {

        const julianCalendarDate: JulianCalendarDate = new JulianCalendarDate(new CalendarPeriod(new CalendarDate(2018, 7, 26), new CalendarDate(2018, 7, 26)));

        const calPeriod = julianCalendarDate.toCalendarPeriod();

        checkCalendarDate(new CalendarDate(2018, 7, 26), calPeriod.periodStart, false);
        checkCalendarDate(new CalendarDate(2018, 7, 26), calPeriod.periodEnd, false);

        const jdnPeriod = julianCalendarDate.toJDNPeriod();

        checkJDN(2458339, jdnPeriod.periodStart);
        checkJDN(2458339, jdnPeriod.periodEnd);

    });

    it('create a Julian date from a calendar period', () => {

        const julianCalendarDate: JulianCalendarDate = new JulianCalendarDate(new CalendarPeriod(new CalendarDate(2018, 7, 26), new CalendarDate(2018, 7, 27)));

        const calPeriod = julianCalendarDate.toCalendarPeriod();

        checkCalendarDate(new CalendarDate(2018, 7, 26), calPeriod.periodStart, false);
        checkCalendarDate(new CalendarDate(2018, 7, 27), calPeriod.periodEnd, false);

        const jdnPeriod = julianCalendarDate.toJDNPeriod();

        checkJDN(2458339, jdnPeriod.periodStart);
        checkJDN(2458340, jdnPeriod.periodEnd);

    });

    it('create an Islamic date from an exact calendar period', () => {

        const islamicCalendarDate: IslamicCalendarDate = new IslamicCalendarDate(new CalendarPeriod(new CalendarDate(1439, 11, 3), new CalendarDate(1439, 11, 13)));

        const calPeriod = islamicCalendarDate.toCalendarPeriod();

        checkCalendarDate(new CalendarDate(1439, 11, 3, 1), calPeriod.periodStart);
        checkCalendarDate(new CalendarDate(1439, 11, 13, 4), calPeriod.periodEnd);

        const jdnPeriod = islamicCalendarDate.toJDNPeriod();

        checkJDN(2458316, jdnPeriod.periodStart);
        checkJDN(2458326, jdnPeriod.periodEnd);

    });

    it('create an Islamic date from an exact calendar period', () => {

        const islamicCalendarDate: IslamicCalendarDate = new IslamicCalendarDate(new CalendarPeriod(new CalendarDate(1438, 12, 3), new CalendarDate(1439, 1, 13)));

        const calPeriod = islamicCalendarDate.toCalendarPeriod();

        checkCalendarDate(new CalendarDate(1438, 12, 3, 6), calPeriod.periodStart);
        checkCalendarDate(new CalendarDate(1439, 1, 13, 3), calPeriod.periodEnd);

        const jdnPeriod = islamicCalendarDate.toJDNPeriod();

        checkJDN(2457992, jdnPeriod.periodStart);
        checkJDN(2458031, jdnPeriod.periodEnd);

    });

    it('create an Islamic date from an exact calendar period in a leap year', () => {

        const islamicCalendarDate: IslamicCalendarDate = new IslamicCalendarDate(new CalendarPeriod(new CalendarDate(1434, 12, 3), new CalendarDate(1435, 1, 13)));

        const calPeriod = islamicCalendarDate.toCalendarPeriod();

        checkCalendarDate(new CalendarDate(1434, 12, 3, 2), calPeriod.periodStart);
        checkCalendarDate(new CalendarDate(1435, 1, 13, 0), calPeriod.periodEnd);

        const jdnPeriod = islamicCalendarDate.toJDNPeriod();

        checkJDN(2456574, jdnPeriod.periodStart);
        checkJDN(2456614, jdnPeriod.periodEnd);

    });

});
