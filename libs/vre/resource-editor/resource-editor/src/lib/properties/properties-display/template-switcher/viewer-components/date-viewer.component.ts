import { ChangeDetectionStrategy, Component, Input, OnInit, computed, inject, signal } from '@angular/core';
import { KnoraDate, KnoraPeriod, ReadDateValue } from '@dasch-swiss/dsp-js';
import { CalendarSystem } from '@dasch-swiss/vre/shared/calendar';
import { ValueService } from '@dasch-swiss/vre/ui/date-picker';
import { CalendarMarkerComponent, KnoraDatePipe } from '@dasch-swiss/vre/ui/ui';

/**
 * Renders a date value, with a marker stating the calendar it is stored in.
 *
 * A reader can show the value in another calendar through the marker. That choice lives here and
 * only here: it lasts until this component is rebuilt, touches no other value, and is never
 * written back. The workspace sets no `RouteReuseStrategy`, so Angular destroys and recreates the
 * component on navigation and the choice resets on its own — were that ever to change, this signal
 * would need an explicit reset.
 *
 * A year or month rarely maps onto a single unit of another calendar: Julian 1582 runs into
 * Gregorian 1583. Such a value renders as the span it actually covers rather than as one date the
 * source never specified.
 */
@Component({
  selector: 'app-date-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [KnoraDatePipe, CalendarMarkerComponent],
  template: `
    <span data-cy="date-text">{{ displayText() }}</span>
    <span data-cy="date-switch" style="display: inline-block; margin-left: 8px">
      <app-calendar-marker
        [storedCalendar]="storedCalendar"
        [availableCalendars]="availableCalendars"
        (displayCalendarChange)="displayCalendar.set($event)" />
    </span>
  `,
})
export class DateViewerComponent implements OnInit {
  @Input({ required: true }) value!: ReadDateValue;

  private readonly _valueService = inject(ValueService);
  private readonly _datePipe = new KnoraDatePipe();

  /** The calendar the reader is looking at. Ephemeral, per value, never saved. */
  protected readonly displayCalendar = signal<CalendarSystem | undefined>(undefined);

  protected storedCalendar!: CalendarSystem;
  protected availableCalendars: CalendarSystem[] = [];

  protected readonly displayText = computed(() => {
    const target = this.displayCalendar();
    const date = this.value.date;

    if (date instanceof KnoraPeriod) {
      return `${this._render(date.start, target)} - ${this._render(date.end, target)}`;
    }
    return this._render(date, target);
  });

  ngOnInit() {
    const date = this.value.date;
    const stored = date instanceof KnoraPeriod ? date.start : date;
    this.storedCalendar = stored.calendar.toUpperCase() as CalendarSystem;
    this.availableCalendars = this._valueService.availableCalendarsFor(date);
  }

  /**
   * One date as text, in the chosen calendar.
   *
   * Falls back to the stored date whenever the target calendar cannot express it. The marker never
   * offers such a calendar, so this is a guard rather than a path a reader can reach.
   */
  private _render(date: KnoraDate, target: CalendarSystem | undefined): string {
    if (target === undefined || target === date.calendar.toUpperCase()) {
      return this._format(date);
    }

    const converted = this._valueService.convertKnoraDateTo(date, target);
    if (converted === undefined) {
      return this._format(date);
    }

    return converted.end === undefined
      ? this._format(converted.start)
      : `${this._format(converted.start)}/${this._format(converted.end)}`;
  }

  private _format(date: KnoraDate): string {
    return this._datePipe.transform(date, 'dd.MM.YYYY', 'era');
  }
}
