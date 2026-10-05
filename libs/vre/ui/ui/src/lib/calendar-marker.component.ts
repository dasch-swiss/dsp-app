import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CalendarSystem } from '@dasch-swiss/vre/shared/calendar';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Just below the trigger and slightly left of it, falling back to above near the viewport bottom.
 *
 * The small negative x-offset lines the popover's first column up with the trigger's text rather
 * than with its padding edge.
 */
const POPOVER_POSITIONS: readonly ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetX: -10, offsetY: 6 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetX: -10, offsetY: -6 },
];

/**
 * One reading of a date in a calendar, ready to display.
 *
 * `date` is absent when the calendar cannot express this value — a date before the Hijra has no
 * Islamic form — and the marker then says so in its place rather than dropping the row. Hiding it
 * would leave a reader unsure whether the calendar was forgotten or genuinely does not apply.
 */
export interface CalendarReading {
  readonly calendar: CalendarSystem;
  readonly date?: string;
}

/**
 * What the value is, beyond how each calendar spells it.
 *
 * These belong to the instant rather than to any one calendar — the same day has one weekday and
 * one Julian Day Number whichever calendar names it — so the marker states them once, below the
 * readings, instead of repeating them on every row.
 *
 * Every field is optional because none of them always applies: a date stored at year or month
 * precision spans many days, so it has no single weekday and no single JDN, and the marker says
 * nothing rather than picking one. `durationDays` exists only for a period.
 */
export interface CalendarFacts {
  readonly weekday?: string;
  readonly endWeekday?: string;
  readonly jdn?: number;
  readonly endJdn?: number;
  readonly durationDays?: number;
  /** Set when a day of the value lies in the ten the Gregorian reform skipped. */
  readonly reformGap?: { readonly date: string; readonly julian: string };
}

/**
 * States which calendar a date is stored in, and shows that date in the others on click.
 *
 * The calendar is part of what a source says — projects record a date in the calendar the document
 * used — so it is named at rest, with no interaction needed to discover it.
 *
 * It **compares rather than switches**. An earlier version let a reader pick a calendar and
 * re-rendered the value in it, which meant reading one calendar at a time and holding the others in
 * mind; comparing is what a researcher actually does. Listing all three at once also removes the
 * displayed-versus-stored distinction entirely: what is on the page is always the stored date, so
 * there is no state to track and no way for a reader to lose the source.
 */
@Component({
  selector: 'app-calendar-marker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, MatIconModule, TranslatePipe],
  template: `
    <button
      type="button"
      class="calendar-marker"
      data-cy="calendar-marker"
      cdkOverlayOrigin
      #trigger="cdkOverlayOrigin"
      [attr.aria-expanded]="isOpen()"
      [attr.aria-label]="'ui.calendarMarker.inEachCalendar' | translate: { calendar: storedLabel() | translate }"
      (click)="toggle()">
      <mat-icon class="calendar-marker-icon">event</mat-icon>
      <span data-cy="calendar-marker-label">{{ storedLabel() | translate }}</span>
    </button>

    <ng-template
      cdkConnectedOverlay
      [cdkConnectedOverlayOrigin]="trigger"
      [cdkConnectedOverlayOpen]="isOpen()"
      [cdkConnectedOverlayPositions]="POPOVER_POSITIONS"
      [cdkConnectedOverlayHasBackdrop]="true"
      cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop"
      (backdropClick)="close()"
      (detach)="close()"
      (overlayKeydown)="onOverlayKeydown($event)">
      <div
        class="calendar-marker-popover"
        role="dialog"
        data-cy="calendar-marker-popover"
        [attr.aria-label]="'ui.calendarMarker.inEachCalendar' | translate: { calendar: storedLabel() | translate }">
        @for (reading of ordered(); track reading.calendar) {
          <span class="calendar-marker-date" [class.is-stored]="reading.calendar === storedCalendar()">
            @if (reading.date) {
              {{ reading.date }}
            } @else {
              <span class="calendar-marker-absent">{{ 'ui.calendarMarker.beforeHijra' | translate }}</span>
            }
          </span>
          <span
            class="calendar-marker-name"
            [class.is-stored]="reading.calendar === storedCalendar()"
            [attr.data-cy]="'calendar-reading-' + reading.calendar">
            {{ 'ui.calendarMarker.calendars.' + reading.calendar | translate }}
          </span>
        }

        <!-- One instant has one weekday and one day number whatever calendar names it, so these
        are stated once below the readings rather than repeated on every row. They keep the same
        two columns — value left, what it is right — so the numbers stay aligned with the dates
        above them. -->
        @if (hasFacts()) {
          <span class="calendar-marker-rule" data-cy="calendar-marker-facts"></span>

          @if (jdnText()) {
            <span class="calendar-marker-date" data-cy="calendar-marker-jdn">{{ jdnText() }}</span>
            <span class="calendar-marker-name">{{ 'ui.calendarMarker.jdn' | translate }}</span>
          }

          @if (weekdayText()) {
            <span class="calendar-marker-weekdays" data-cy="calendar-marker-weekday">{{ weekdayText() }}</span>
          }

          @if (facts().durationDays !== undefined) {
            <span class="calendar-marker-duration" data-cy="calendar-marker-duration">
              {{ 'ui.calendarMarker.periodOfDays' | translate: { count: facts().durationDays } }}
            </span>
          }

          @if (facts().reformGap; as gap) {
            <span class="calendar-marker-reform-gap" data-cy="calendar-marker-reform-gap">
              {{ 'ui.calendarMarker.reformGapNote' | translate: gap }}
            </span>
          }
        }
      </div>
    </ng-template>
  `,
  styles: [
    `
      .calendar-marker {
        background: none;
        border: 0;
        padding: 0;
        margin-left: 6px;
        display: inline-flex;
        align-items: center;
        gap: 2px;
        font: inherit;
        font-size: 12px;
        color: #4b5563;
        cursor: pointer;
        /* Dotted, not solid: it opens a reading, it does not change the value. */
        text-decoration: underline dotted;
        text-decoration-color: #d1d5db;
        text-underline-offset: 3px;
        transition:
          color 150ms,
          text-decoration-color 150ms;
      }

      .calendar-marker:hover,
      .calendar-marker:focus-visible {
        color: #336790;
        text-decoration-color: #a8c0d4;
      }

      .calendar-marker-icon {
        font-size: 12px;
        width: 12px;
        height: 12px;
      }

      .calendar-marker-popover {
        display: grid;
        grid-template-columns: max-content max-content;
        column-gap: 10px;
        row-gap: 4px;
        padding: 8px 12px;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        box-shadow:
          0 10px 15px -3px rgb(0 0 0 / 0.1),
          0 4px 6px -4px rgb(0 0 0 / 0.05);
        font-size: 12px;
      }

      .calendar-marker-date {
        color: #111827;
        font-variant-numeric: tabular-nums;
      }

      /* A stated colour rather than opacity over whatever the row inherits, which would drift. */
      .calendar-marker-name {
        color: #4b5563;
      }

      .is-stored {
        font-weight: 700;
        color: #111827;
      }

      .calendar-marker-absent {
        font-style: italic;
        color: #4b5563;
      }

      /* Separates the readings from what holds for the value itself. A row of its own rather than
         a border on the next one, so the rule spans both columns whatever follows it. */
      .calendar-marker-rule {
        grid-column: 1 / -1;
        margin-top: 2px;
        border-top: 1px solid #e5e7eb;
      }

      /* These say one thing each, so they run the full width rather than sitting in a column. */
      .calendar-marker-weekdays,
      .calendar-marker-duration {
        grid-column: 1 / -1;
        color: #4b5563;
      }

      .calendar-marker-reform-gap {
        grid-column: 1 / -1;
        max-width: 280px;
        color: #92400e;
      }
    `,
  ],
})
export class CalendarMarkerComponent {
  /** The calendar the value is stored in — named at rest, and listed first and bold when open. */
  readonly storedCalendar = input.required<CalendarSystem>();

  /**
   * This date read in every calendar. The owner converts; this component formats and lists.
   *
   * Signal inputs rather than plain `@Input`s, because the computeds below read them: `computed()`
   * tracks signal reads only, so a plain input would be captured once and then silently go stale.
   */
  readonly readings = input.required<readonly CalendarReading[]>();

  /**
   * What holds for the value itself, whatever calendar names it.
   *
   * Empty by default, so a caller that has nothing to add — the advanced search's preview, say —
   * gets the readings alone and no empty row.
   */
  readonly facts = input<CalendarFacts>({});

  protected readonly POPOVER_POSITIONS = POPOVER_POSITIONS;

  private readonly _open = signal(false);

  protected readonly isOpen = this._open.asReadonly();

  protected readonly storedLabel = computed(() => `ui.calendarMarker.calendars.${this.storedCalendar()}`);

  protected readonly hasFacts = computed(() => {
    const { weekday, jdn, durationDays, reformGap } = this.facts();
    return weekday !== undefined || jdn !== undefined || durationDays !== undefined || reformGap !== undefined;
  });

  /**
   * Both ends of a period, or the one weekday of a single date.
   *
   * A period that begins and ends on the same weekday still shows both, because the pair is what
   * says it is a period; collapsing it would read as a single date.
   */
  protected readonly weekdayText = computed(() => {
    const { weekday, endWeekday } = this.facts();
    if (weekday === undefined) {
      return '';
    }
    return endWeekday === undefined ? weekday : `${weekday}–${endWeekday}`;
  });

  /** A period spans two, so it reads as a range; a single date shows the one. */
  protected readonly jdnText = computed(() => {
    const { jdn, endJdn } = this.facts();
    if (jdn === undefined) {
      return '';
    }
    return endJdn === undefined || endJdn === jdn ? `${jdn}` : `${jdn}–${endJdn}`;
  });

  /** Stored calendar first; the others keep the order the owner supplied. */
  protected readonly ordered = computed(() => {
    const stored = this.storedCalendar();
    return [...this.readings()].sort((a, b) => Number(b.calendar === stored) - Number(a.calendar === stored));
  });

  protected toggle(): void {
    this._open.update(open => !open);
  }

  protected close(): void {
    this._open.set(false);
  }

  protected onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close();
    }
  }
}
