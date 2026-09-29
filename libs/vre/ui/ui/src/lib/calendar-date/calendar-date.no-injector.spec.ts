import { KnoraDate } from '@dasch-swiss/dsp-js';

import { KnoraDatePipe } from '../pipes/formatting/knoradate.pipe';
import { CalendarDateService } from './calendar-date.service';

/**
 * Both of these are constructed with `new` in production — the date viewer builds a `KnoraDatePipe`
 * that way, and the pipe in turn needs a service.
 *
 * `inject()` throws NG0203 when called outside an injection context, and `{ optional: true }` does
 * not help: it covers a missing provider, not a missing context. That distinction is easy to get
 * wrong and impossible to notice in a TestBed, where there is always a context — these tests exist
 * because it was got wrong once and would have shipped.
 */
describe('constructing outside an injection context', () => {
  const date = new KnoraDate('GREGORIAN', 'CE', 2024, 6, 15);

  it('constructs the service directly', () => {
    expect(() => new CalendarDateService()).not.toThrow();
  });

  it('formats without a translate service, falling back to title case', () => {
    expect(new CalendarDateService().format(date, 'dd.MM.YYYY', 'all')).toBe('15.06.2024 Gregorian');
  });

  it('constructs the pipe directly', () => {
    expect(() => new KnoraDatePipe()).not.toThrow();
  });

  it('formats through the pipe', () => {
    expect(new KnoraDatePipe().transform(date, 'dd.MM.YYYY', 'all')).toBe('15.06.2024 Gregorian');
  });
});
