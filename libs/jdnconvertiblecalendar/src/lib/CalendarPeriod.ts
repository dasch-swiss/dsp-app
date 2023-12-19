/*
 * Copyright © 2021 - 2023 Swiss National Data and Service Center for the Humanities and/or DaSCH Service Platform contributors.
 *  SPDX-License-Identifier: Apache-2.0
 */

/**
 * Represents a period as two calendar dates.
 */
import { CalendarDate } from './CalendarDate';

export class CalendarPeriod {
  /**
   *
   * @param periodStart start of the period.
   * @param periodEnd End of the period.
   */
  constructor(
    public readonly periodStart: CalendarDate,
    public readonly periodEnd: CalendarDate
  ) {
    // TODO: can we check that periodStart equals or is before periodEnd?
  }
}
