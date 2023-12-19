/*
 * Copyright © 2021 - 2023 Swiss National Data and Service Center for the Humanities and/or DaSCH Service Platform contributors.
 *  SPDX-License-Identifier: Apache-2.0
 */

import { JDNConvertibleCalendarError } from './JDNConvertibleCalendarError';
import { Utils } from './Utils';

/**
 * Represents a calendar date (calendar agnostic).
 *
 * Assumes that every supported calendar
 * can be represented by a combination of year, month, and day.
 *
 */
export class CalendarDate {
  /**
   *
   * Please note that this software uses the (astronomical) convention that BCE dates are represented as negative years and that the year zero (0) is used.
   * The year 1 BCE must be indicated as year 0, and the year 2 BCE corresponds to -1 etc.
   *
   * @param year year of the given date.
   * @param month month of the given date.
   * @param day day of the given date (day of month, 1 based index).
   * @param dayOfWeek day of week of the given date (0 based index), if any.
   * @param daytime time of the day (0 - 0.9…), if any. 0 refers to midnight, 0.5 to noon, 0.9… to midnight of the same day. 1 would already refer to the next day and is thus not valid.
   */
  constructor(
    public readonly year: number,
    public readonly month: number,
    public readonly day: number,
    public readonly dayOfWeek?: number,
    public readonly daytime?: number
  ) {
    // check validity of daytime
    if (daytime !== undefined && daytime >= 1)
      throw new JDNConvertibleCalendarError('Invalid daytime: ' + daytime + ', valid range: 0 - 0.9…');

    // TODO: When other calendar than Gregorian or Julian are implemented, this may have to be changed
    if (dayOfWeek !== undefined && (!Utils.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6))
      throw new JDNConvertibleCalendarError('Invalid day of week: ' + dayOfWeek);
  }
}
