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
