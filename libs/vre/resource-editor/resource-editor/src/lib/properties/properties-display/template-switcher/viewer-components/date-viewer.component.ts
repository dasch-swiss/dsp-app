import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { input } from '@angular/core';
import { KnoraDate, KnoraPeriod, ReadDateValue } from '@dasch-swiss/dsp-js';
import { CALENDAR_SYSTEMS, CalendarSystem } from '@dasch-swiss/vre/shared/calendar';
import { CalendarDateService } from '@dasch-swiss/vre/ui/ui';
import { CalendarFacts, CalendarMarkerComponent, CalendarReading, KnoraDatePipe } from '@dasch-swiss/vre/ui/ui';

/**
 * Renders a date value in the calendar it is stored in, with a marker that reads it in the others.
 *
 * The rendered date never changes. Opening the marker lists this date in all three calendars at
 * once, which is what comparing sources actually requires; re-rendering the value in a chosen
 * calendar would mean reading one at a time, and would leave a reader unsure which they were
 * looking at.
 *
 * A year or month rarely maps onto a single unit of another calendar: Julian 1582 runs into
 * Gregorian 1583. Such a reading shows the span it covers rather than one date the source never
 * specified.
 */
@Component({
  selector: 'app-date-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CalendarMarkerComponent],
  template: `
    <span data-cy="date-text">{{ storedText() }}</span>
    <span data-cy="date-switch" style="display: inline-block; margin-left: 8px">
      <app-calendar-marker [storedCalendar]="storedCalendar()" [readings]="readings()" [facts]="facts()" />
    </span>
  `,
})
export class DateViewerComponent {
  /**
   * A signal input rather than a plain `@Input`, because the computeds below read it: `computed()`
   * tracks signal reads only, so a plain input would be captured once and then silently go stale
   * if this instance were reused with a different value instead of being recreated.
   */
  readonly value = input.required<ReadDateValue>();

  private readonly _calendarDates = inject(CalendarDateService);
  private readonly _datePipe = new KnoraDatePipe();

  /** The calendar the value is stored in — its start, for a period, which governs both ends. */
  protected readonly storedCalendar = computed<CalendarSystem>(() => {
    const date = this.value().date;
    const stored = date instanceof KnoraPeriod ? date.start : date;
    return stored.calendar.toUpperCase() as CalendarSystem;
  });

  /** What is on the page: always the stored date, in the calendar it was recorded in. */
  protected readonly storedText = computed(() => this._readIn(this.storedCalendar()) ?? '');

  /**
   * What holds for the value itself: its weekday, its position in the day count, its length.
   *
   * Computed from the stored date rather than any conversion, because they describe the instant
   * and not a reading of it. Each is omitted where it does not apply — a value stored at year or
   * month precision names no single day, so it has no weekday and no single JDN, and only a period
   * has a duration.
   */
  protected readonly facts = computed<CalendarFacts>(() => {
    const date = this.value().date;

    if (date instanceof KnoraPeriod) {
      return {
        weekday: this._calendarDates.weekdayOf(date.start),
        jdn: this._calendarDates.julianDayNumber(date.start),
        endJdn: this._calendarDates.julianDayNumber(date.end),
        durationDays: this._calendarDates.durationInDays(date),
      };
    }
    return {
      weekday: this._calendarDates.weekdayOf(date),
      jdn: this._calendarDates.julianDayNumber(date),
    };
  });

  /**
   * This value read in each calendar, for the marker to list.
   *
   * `availableCalendarsFor` already converts into all three to decide representability, so the
   * conversions here cost nothing that was not already being paid and discarded.
   */
  protected readonly readings = computed<CalendarReading[]>(() =>
    CALENDAR_SYSTEMS.map(calendar => ({ calendar, date: this._readIn(calendar) }))
  );

  /**
   * The whole value as text in one calendar, or `undefined` where that calendar cannot express it.
   *
   * `undefined` is the Islamic calendar's answer for a date before the Hijra. The marker says so in
   * words rather than dropping the row, so a reader can tell "no such date" from "not shown".
   */
  private _readIn(target: CalendarSystem): string | undefined {
    const date = this.value().date;

    if (date instanceof KnoraPeriod) {
      const start = this._renderDate(date.start, target);
      const end = this._renderDate(date.end, target);
      // En dash, not a hyphen: this is a range between two dates, not a compound word.
      return start && end ? `${start} – ${end}` : undefined;
    }
    return this._renderDate(date, target);
  }

  /** One date in one calendar; a span when the conversion covers a range. */
  private _renderDate(date: KnoraDate, target: CalendarSystem): string | undefined {
    if (target === date.calendar.toUpperCase()) {
      return this._format(date);
    }

    const converted = this._calendarDates.convertKnoraDateTo(date, target);
    if (converted === undefined) {
      return undefined;
    }

    return converted.end === undefined
      ? this._format(converted.start)
      : this._formatSpan(converted.start, converted.end);
  }

  /**
   * A span, with the era stated once when both ends share it.
   *
   * `1582/1583`, `754/753 BCE`, `06./07.1582` — repeating the era on both ends of a span reads as
   * two separate dates rather than one range.
   */
  private _formatSpan(start: KnoraDate, end: KnoraDate): string {
    if (start.era === end.era) {
      return `${this._format(start, false)}/${this._format(end)}`;
    }
    return `${this._format(start)}/${this._format(end)}`;
  }

  /**
   * One date as text, with the era shown where it carries information.
   *
   * Era appears on every BCE date and on CE years below 1000: "450" alone is ambiguous in a corpus
   * that also holds BCE material, while "2024 CE" is noise. The Islamic calendar never shows one —
   * AH is implied and it has no negative years.
   *
   * Formatted here rather than in `KnoraDatePipe` because that pipe also serves the date picker and
   * advanced search, and this rule belongs to this surface rather than to every date in the app.
   */
  private _format(date: KnoraDate, withEra = true): string {
    const text = this._datePipe.transform(date, 'dd.MM.YYYY');

    if (!withEra || date.era === 'noEra') {
      return text;
    }
    if (date.era === 'BCE') {
      return `${text} BCE`;
    }
    return date.year < 1000 ? `${text} CE` : text;
  }
}
