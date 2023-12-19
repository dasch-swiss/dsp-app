/*
 * Copyright © 2021 - 2023 Swiss National Data and Service Center for the Humanities and/or DaSCH Service Platform contributors.
 *  SPDX-License-Identifier: Apache-2.0
 */

import { async, inject, TestBed } from '@angular/core/testing';
import { DateAdapter } from '@angular/material/core';
import {
  CalendarDate,
  GregorianCalendarDate,
  JDNConvertibleCalendar,
  JDNPeriod,
  CalendarPeriod,
} from '@dasch-swiss/jdnconvertiblecalendar';
import { BehaviorSubject } from 'rxjs';
import {
  JDNConvertibleCalendarDateAdapter,
  JDNConvertibleCalendarDateAdapterModule,
} from '../index';
import { ACTIVE_CALENDAR } from './active_calendar_token';

describe('JDNConvertibleCalendarDateAdapter', () => {
  let adapter: JDNConvertibleCalendarDateAdapter;
  let assertValidDate: (
    d: JDNConvertibleCalendar | null,
    valid: boolean
  ) => void;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [JDNConvertibleCalendarDateAdapterModule],
      providers: [
        {
          provide: ACTIVE_CALENDAR,
          useValue: new BehaviorSubject('Gregorian'),
        },
      ],
    }).compileComponents();
  }));

  beforeEach(inject(
    [DateAdapter],
    (dateAdapter: JDNConvertibleCalendarDateAdapter) => {
      adapter = dateAdapter;

      assertValidDate = (d: JDNConvertibleCalendar | null, valid: boolean) => {
        expect(adapter.isDateInstance(d))
          .withContext(`Expected ${d} to be a date instance`)
          .not.toBeNull();
        expect(adapter.isValid(d!))
          .withContext(
            `Expected ${d} to be ${valid ? 'valid' : 'invalid'},` +
              ` but was ${valid ? 'invalid' : 'valid'}`
          )
          .toBe(valid);
      };
    }
  ));

  it('should check class of date adapter', () => {
    expect(adapter instanceof JDNConvertibleCalendarDateAdapter).toBeTruthy();
  });

  it('should check the active calendar set by the ACTIVE_CALENDAR token', () => {
    expect(adapter.activeCalendar).toEqual('Gregorian');
  });

  it('should get year', () => {
    // January 1 2017
    const calDate = new CalendarDate(2017, 1, 1);

    expect(
      adapter.getYear(
        new GregorianCalendarDate(new CalendarPeriod(calDate, calDate))
      )
    ).toBe(2017);
  });

  it('should get month', () => {
    // January 1 2017
    const calDate = new CalendarDate(2017, 1, 1);

    expect(
      adapter.getMonth(
        new GregorianCalendarDate(new CalendarPeriod(calDate, calDate))
      )
    ).toBe(0);
  });

  it('should get date', () => {
    // January 1 2017
    const calDate = new CalendarDate(2017, 1, 1);

    expect(
      adapter.getDate(
        new GregorianCalendarDate(new CalendarPeriod(calDate, calDate))
      )
    ).toBe(1);
  });

  it('should get day of week', () => {
    // January 1 2017
    const calDate = new CalendarDate(2017, 1, 1);

    expect(
      adapter.getDayOfWeek(
        new GregorianCalendarDate(new CalendarPeriod(calDate, calDate))
      )
    ).toBe(0);
  });

  it('should get long month names', () => {
    expect(adapter.getMonthNames('long')).toEqual([
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

  it('should get date names', () => {
    expect(adapter.getDateNames()).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
      '12',
      '13',
      '14',
      '15',
      '16',
      '17',
      '18',
      '19',
      '20',
      '21',
      '22',
      '23',
      '24',
      '25',
      '26',
      '27',
      '28',
      '29',
      '30',
      '31',
    ]);
  });

  it('should get long day of week names', () => {
    expect(adapter.getDayOfWeekNames('long')).toEqual([
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ]);
  });

  it('should get year name', () => {
    // January 1 2017
    const calDate = new CalendarDate(2017, 1, 1);

    expect(
      adapter.getYearName(
        new GregorianCalendarDate(new CalendarPeriod(calDate, calDate))
      )
    ).toBe('2017');
  });

  it('should get first day of week', () => {
    expect(adapter.getFirstDayOfWeek()).toBe(0);
  });

  it('should create a GregorianCalendarDate', () => {
    expect(
      adapter.createDate(2017, 0, 1).toCalendarPeriod().periodStart
    ).toEqual(new CalendarDate(2017, 1, 1, 0));

    expect(() => adapter.createDate(2017, 0, 0)).toThrow(
      new Error('Invalid date "0". Date has to be at least 1.')
    );

    expect(() => adapter.createDate(2017, -1, 1)).toThrow(
      new Error(
        'Invalid month index "-1". Month index has to be between 0 and 11.'
      )
    );
  });

  it('should parse string according to given format', () => {
    // January 2 2017
    const calDate = new CalendarDate(2017, 1, 2);

    expect(adapter.parse('02-01-2017', 'DD-MM-YYYY')).toEqual(
      new GregorianCalendarDate(new CalendarPeriod(calDate, calDate))
    );
  });

  it('should add years', () => {
    // January 1 2017
    const jdn = 2457755;

    const future = adapter.addCalendarYears(
      new GregorianCalendarDate(new JDNPeriod(jdn, jdn)),
      1
    );

    expect(future).toEqual(
      new GregorianCalendarDate(new JDNPeriod(jdn + 365, jdn + 365))
    );

    expect(future.toCalendarPeriod().periodStart).toEqual(
      new CalendarDate(2018, 1, 1, 1)
    );

    const past = adapter.addCalendarYears(
      new GregorianCalendarDate(new JDNPeriod(jdn, jdn)),
      -1
    );

    expect(past).toEqual(
      new GregorianCalendarDate(new JDNPeriod(jdn - 366, jdn - 366))
    ); // leap year

    expect(past.toCalendarPeriod().periodStart).toEqual(
      new CalendarDate(2016, 1, 1, 5)
    );
  });

  it('should respect leap years when adding years', () => {
    // February 29 2016
    const jdn = 2457448;

    const future = adapter.addCalendarYears(
      new GregorianCalendarDate(new JDNPeriod(jdn, jdn)),
      1
    );

    expect(future).toEqual(
      new GregorianCalendarDate(new JDNPeriod(jdn + 365, jdn + 365))
    );

    expect(future.toCalendarPeriod().periodStart).toEqual(
      new CalendarDate(2017, 2, 28, 2)
    );

    const past = adapter.addCalendarYears(
      new GregorianCalendarDate(new JDNPeriod(jdn, jdn)),
      -1
    );

    expect(past).toEqual(
      new GregorianCalendarDate(new JDNPeriod(jdn - 366, jdn - 366))
    );

    expect(past.toCalendarPeriod().periodStart).toEqual(
      new CalendarDate(2015, 2, 28, 6)
    );
  });

  it('should add months', () => {
    // January 1 2017
    const jdn = 2457755;

    const future = adapter.addCalendarMonths(
      new GregorianCalendarDate(new JDNPeriod(jdn, jdn)),
      1
    );

    expect(future).toEqual(
      new GregorianCalendarDate(new JDNPeriod(jdn + 31, jdn + 31))
    );

    expect(future.toCalendarPeriod().periodStart).toEqual(
      new CalendarDate(2017, 2, 1, 3)
    );

    const past = adapter.addCalendarMonths(
      new GregorianCalendarDate(new JDNPeriod(jdn, jdn)),
      -1
    );

    expect(past).toEqual(
      new GregorianCalendarDate(new JDNPeriod(jdn - 31, jdn - 31))
    );

    expect(past.toCalendarPeriod().periodStart).toEqual(
      new CalendarDate(2016, 12, 1, 4)
    );
  });

  it('should respect month length differences when adding months', () => {
    // January 31 2017
    const jdn1 = 2457785;

    const future = adapter.addCalendarMonths(
      new GregorianCalendarDate(new JDNPeriod(jdn1, jdn1)),
      1
    );

    expect(future).toEqual(
      new GregorianCalendarDate(new JDNPeriod(jdn1 + 28, jdn1 + 28))
    );

    expect(future.toCalendarPeriod().periodStart).toEqual(
      new CalendarDate(2017, 2, 28, 2)
    );

    // March 31 2017
    const jdn2 = 2457844;

    const past = adapter.addCalendarMonths(
      new GregorianCalendarDate(new JDNPeriod(jdn2, jdn2)),
      -1
    );

    expect(past).toEqual(
      new GregorianCalendarDate(new JDNPeriod(jdn2 - 31, jdn2 - 31))
    );

    expect(past.toCalendarPeriod().periodStart).toEqual(
      new CalendarDate(2017, 2, 28, 2)
    );
  });

  it('should add days', () => {
    // January 1 2017
    const jdn = 2457755;

    const future = adapter.addCalendarDays(
      new GregorianCalendarDate(new JDNPeriod(jdn, jdn)),
      1
    );

    expect(future).toEqual(
      new GregorianCalendarDate(new JDNPeriod(jdn + 1, jdn + 1))
    );

    expect(future.toCalendarPeriod().periodStart).toEqual(
      new CalendarDate(2017, 1, 2, 1)
    );

    const past = adapter.addCalendarDays(
      new GregorianCalendarDate(new JDNPeriod(jdn, jdn)),
      -1
    );

    expect(past).toEqual(
      new GregorianCalendarDate(new JDNPeriod(jdn - 1, jdn - 1))
    );

    expect(past.toCalendarPeriod().periodStart).toEqual(
      new CalendarDate(2016, 12, 31, 6)
    );
  });

  it('should compare dates', () => {
    // January 1 2017
    const jdn = 2457755;

    const january1st2017 = new GregorianCalendarDate(new JDNPeriod(jdn, jdn));
    const january2nd2017 = new GregorianCalendarDate(
      new JDNPeriod(jdn + 1, jdn + 1)
    );

    const february1st2017 = new GregorianCalendarDate(
      new JDNPeriod(jdn + 31, jdn + 31)
    );

    const january1st2018 = new GregorianCalendarDate(
      new JDNPeriod(jdn + 365, jdn + 365)
    );

    expect(adapter.compareDate(january1st2017, january2nd2017)).toBeLessThan(0);

    expect(adapter.compareDate(january1st2017, february1st2017)).toBeLessThan(
      0
    );

    expect(adapter.compareDate(january1st2017, january1st2018)).toBeLessThan(0);

    expect(adapter.compareDate(january1st2017, january1st2017)).toBe(0);

    expect(adapter.compareDate(january1st2018, january1st2017)).toBeGreaterThan(
      0
    );

    expect(
      adapter.compareDate(february1st2017, january1st2017)
    ).toBeGreaterThan(0);

    expect(adapter.compareDate(january2nd2017, january1st2017)).toBeGreaterThan(
      0
    );
  });

  it('should clamp date at lower bound', () => {
    // January 1 2017
    const jdn = 2457755;

    // Given date January 1 2017, min: January 1 2018, max: January 1 2018
    expect(
      adapter.clampDate(
        new GregorianCalendarDate(new JDNPeriod(jdn, jdn)),
        new GregorianCalendarDate(new JDNPeriod(jdn + 365, jdn + 365)),
        new GregorianCalendarDate(new JDNPeriod(jdn + 365 * 2, jdn + 365 * 2))
      )
    ).toEqual(new GregorianCalendarDate(new JDNPeriod(jdn + 365, jdn + 365)));
  });

  it('should clamp date at upper bound', () => {
    // January 1 2018
    const jdn = 2458120;

    // Given date January 1 2020, min: January 1 2018, max: January 1 2019
    expect(
      adapter.clampDate(
        new GregorianCalendarDate(new JDNPeriod(jdn + 2 * 365, jdn + 2 * 365)),
        new GregorianCalendarDate(new JDNPeriod(jdn, jdn)),
        new GregorianCalendarDate(new JDNPeriod(jdn + 365, jdn + 365))
      )
    ).toEqual(new GregorianCalendarDate(new JDNPeriod(jdn + 365, jdn + 365)));
  });

  it('should clamp date already within bounds', () => {
    // January 1 2018
    const jdn = 2458120;

    // Given date February 2018, min: January 1 2018, max: January 1 2019
    expect(
      adapter.clampDate(
        new GregorianCalendarDate(new JDNPeriod(jdn + 31, jdn + 31)),
        new GregorianCalendarDate(new JDNPeriod(jdn, jdn)),
        new GregorianCalendarDate(new JDNPeriod(jdn + 365, jdn + 365))
      )
    ).toEqual(new GregorianCalendarDate(new JDNPeriod(jdn + 31, jdn + 31)));
  });

  it('should create valid dates from valid ISO strings', () => {
    assertValidDate(adapter.deserialize('1985-04-12T23:20:50.52Z'), true);
  });

  it('should convert a Gregorian date to a Julian date', () => {
    // January 1 2018
    const jdn = 2458120;

    const gregorianDate = new GregorianCalendarDate(new JDNPeriod(jdn, jdn));

    const julianDate = adapter.convertCalendar(gregorianDate, 'Julian');

    const julianJDNPeriod = julianDate.toJDNPeriod();

    expect(julianJDNPeriod.periodStart).toEqual(jdn);

    const julianCalendarPeriod = julianDate.toCalendarPeriod();

    expect(julianCalendarPeriod.periodStart.year).toEqual(2017);

    expect(julianCalendarPeriod.periodStart.month).toEqual(12);

    expect(julianCalendarPeriod.periodStart.day).toEqual(19);

    expect(julianCalendarPeriod.periodStart.dayOfWeek).toEqual(1);

    expect(adapter.activeCalendar).toEqual('Julian');
  });

  it("should create today's date in the Gregorian calendar", () => {
    // June 11th 2018 (Gregorian calendar)
    const todayExpected = new Date(2017, 5, 11);

    // date above will be returned for new Date()
    // https://jasmine.github.io/tutorials/your_first_suite
    jasmine.clock().mockDate(todayExpected);

    const today: JDNConvertibleCalendar = adapter.today();

    // create the expected Gregorian date
    const year = todayExpected.getFullYear();

    // 0 based month
    const month = todayExpected.getMonth();

    // day of month, 1 based index
    const day = todayExpected.getDate();

    const expectedCalDate = new CalendarDate(year, month + 1, day);

    const todayCalDate: GregorianCalendarDate = new GregorianCalendarDate(
      new CalendarPeriod(expectedCalDate, expectedCalDate)
    );

    expect(adapter.activeCalendar).toEqual('Gregorian'); // Gregorian is the standard if no conversions have been done
    expect(today).toEqual(todayCalDate);
  });
});
