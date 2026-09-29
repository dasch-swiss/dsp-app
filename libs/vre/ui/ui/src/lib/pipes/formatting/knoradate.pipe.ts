import { inject, Pipe, PipeTransform } from '@angular/core';
import { KnoraDate } from '@dasch-swiss/dsp-js';

import { CalendarDateService } from '../../calendar-date/calendar-date.service';

/**
 * Renders a `KnoraDate` as text.
 *
 * A thin adapter over {@link CalendarDateService.format}, which owns the formatting rules. It used
 * to carry its own copy — the same padding, the same era logic, the same calendar naming — kept in
 * step with the picker's copy by hand. Two implementations of one rule is how they drift: a fix
 * applied to whichever file a search landed in would silently not apply to the other, which is the
 * defect shape the calendar rewrite exists to remove.
 */
@Pipe({
  name: 'knoraDate',
})
export class KnoraDatePipe implements PipeTransform {
  /**
   * The service, injected where possible and constructed directly where not.
   *
   * This pipe is also created with `new KnoraDatePipe()` — by the date viewer and by its own spec —
   * and `inject()` throws NG0203 outside an injection context even with `{ optional: true }`, which
   * covers a missing provider rather than a missing context.
   */
  private readonly _calendarDates = KnoraDatePipe._resolveService();

  private static _resolveService(): CalendarDateService {
    try {
      return inject(CalendarDateService, { optional: true }) ?? new CalendarDateService();
    } catch {
      return new CalendarDateService();
    }
  }

  transform(date: KnoraDate, format?: string, displayOptions?: 'era' | 'calendar' | 'calendarOnly' | 'all'): string {
    return this._calendarDates.format(date, format, displayOptions);
  }
}
