import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { CALENDAR_SYSTEMS, CalendarSystem } from '@dasch-swiss/vre/shared/calendar';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * States which calendar a date value is stored in, and lets a reader see it in another one.
 *
 * The calendar is part of what a source says — projects record a date in the calendar the document
 * used — so it is shown at rest, with no interaction, rather than being something to go looking
 * for. This is also why the control is not a toggle: with three calendars and a stored-versus-
 * displayed distinction, a toggle can only ever show the state you are not in.
 *
 * Choosing another calendar changes this value only, and only until the view is rebuilt. Nothing is
 * written back: the stored calendar stays visible as the anchor, so a reader quoting the date can
 * always see what the source actually said.
 */
@Component({
  selector: 'app-calendar-marker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatMenuModule, TranslatePipe],
  template: `
    <button
      mat-button
      class="calendar-marker"
      data-cy="calendar-marker"
      [attr.aria-label]="accessibleLabel()"
      [matMenuTriggerFor]="calendarMenu">
      <mat-icon>event</mat-icon>
      <span data-cy="calendar-marker-label">{{ calendarLabelKey(displayCalendar()) | translate }}</span>
      <mat-icon>arrow_drop_down</mat-icon>
    </button>

    @if (isConverted()) {
      <span class="calendar-marker-stored" data-cy="calendar-marker-stored">
        {{ 'ui.calendarMarker.storedAs' | translate: { calendar: calendarLabelKey(storedCalendar) | translate } }}
      </span>
    }

    <mat-menu #calendarMenu="matMenu">
      @for (calendar of calendars; track calendar) {
        <button
          mat-menu-item
          [attr.data-cy]="'calendar-option-' + calendar"
          [disabled]="!isAvailable(calendar)"
          (click)="selectCalendar(calendar)">
          @if (calendar === displayCalendar()) {
            <mat-icon>check</mat-icon>
          } @else {
            <mat-icon style="visibility: hidden">check</mat-icon>
          }
          <span>{{ calendarLabelKey(calendar) | translate }}</span>
        </button>
      }
    </mat-menu>
  `,
  styles: [
    `
      .calendar-marker-stored {
        margin-left: 4px;
        font-size: 12px;
        opacity: 0.7;
      }
    `,
  ],
})
export class CalendarMarkerComponent {
  /** The calendar the value is stored in. The anchor the marker always reports. */
  @Input({ required: true }) storedCalendar!: CalendarSystem;

  /**
   * Calendars this value can be shown in.
   *
   * A conversion can be unrepresentable — a pre-Hijra date has no Islamic form — and the answer
   * depends on the value, so the owner computes it. An unavailable calendar is disabled rather
   * than offered and then refused, which keeps a failure state off the display path entirely.
   */
  @Input({ required: true }) availableCalendars!: readonly CalendarSystem[];

  /** Emits the calendar the reader chose. Ephemeral: the owner re-renders, it never saves. */
  @Output() displayCalendarChange = new EventEmitter<CalendarSystem>();

  protected readonly calendars = CALENDAR_SYSTEMS;

  private readonly _selected = signal<CalendarSystem | undefined>(undefined);

  /** The calendar on screen: what the reader picked, or the stored one until they pick. */
  protected readonly displayCalendar = computed<CalendarSystem>(() => this._selected() ?? this.storedCalendar);

  protected readonly isConverted = computed(() => this.displayCalendar() !== this.storedCalendar);

  /**
   * Names both calendars when they differ, so assistive technology hears what the sighted reader
   * sees: the date is shown in one calendar and stored in another.
   */
  protected readonly accessibleLabel = computed(() =>
    this.isConverted()
      ? `Calendar: ${this.displayCalendar()}, stored as ${this.storedCalendar}`
      : `Calendar: ${this.storedCalendar}`
  );

  protected isAvailable(calendar: CalendarSystem): boolean {
    return calendar === this.storedCalendar || this.availableCalendars.includes(calendar);
  }

  protected calendarLabelKey(calendar: CalendarSystem): string {
    return `ui.calendarMarker.calendars.${calendar}`;
  }

  protected selectCalendar(calendar: CalendarSystem): void {
    if (!this.isAvailable(calendar)) {
      return;
    }
    this._selected.set(calendar);
    this.displayCalendarChange.emit(calendar);
  }
}
