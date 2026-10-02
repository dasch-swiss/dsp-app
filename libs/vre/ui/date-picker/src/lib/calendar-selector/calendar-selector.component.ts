import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CALENDAR_SYSTEMS, CalendarSystem } from '@dasch-swiss/vre/shared/calendar';
import { TranslatePipe } from '@ngx-translate/core';

/**
 * Chooses which calendar a date value is expressed in.
 *
 * Separate from the picker because choosing a calendar is not part of picking a date: a period
 * carries one calendar for the whole value, so the choice belongs to whatever owns the value while
 * the picker is merely told the answer. Keeping them apart is what stopped the picker from being
 * able to relabel a date at all.
 *
 * It renders a choice and reports one. It does not convert, does not know what a period is, and
 * does not decide which calendars are possible — the owner passes that in, because only the owner
 * knows the value being converted.
 */
@Component({
  selector: 'app-calendar-selector',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Native buttons rather than mat-button-toggle: the design is a 32px-high segmented control
  // whose selected option is filled, and Material's toggle brings its own height, ripple and
  // selection tick, each of which had to be overridden to get there.
  imports: [MatIconModule, TranslatePipe],
  template: `
    <div class="calendar-selector">
      <div
        class="calendar-segmented"
        role="radiogroup"
        [attr.data-cy]="hookPrefix() + 'calendar-select'"
        [attr.aria-label]="'ui.datePicker.calendar' | translate">
        @for (cal of calendars; track cal) {
          <button
            type="button"
            role="radio"
            class="calendar-option"
            [class.is-selected]="cal === calendar()"
            [attr.aria-checked]="cal === calendar()"
            [attr.data-cy]="hookPrefix() + 'calendar-option-' + cal"
            [disabled]="disabled() || !isAvailable(cal)"
            (click)="calendarChange.emit(cal)">
            {{ 'ui.calendarMarker.calendars.' + cal | translate }}
          </button>
        }
      </div>

      @if (caption()) {
        <p class="calendar-caption" [attr.data-cy]="hookPrefix() + 'calendar-caption'">
          {{ caption()! | translate }}
        </p>
      }

      <!-- Why a calendar is unavailable, rather than only greying it out. A reader who does not
      know when the Hijra was cannot otherwise tell a missing option from a broken one. -->
      @if (!isAvailable('ISLAMIC')) {
        <p class="picker-note" [attr.data-cy]="hookPrefix() + 'pre-hijra-note'">
          <mat-icon class="line-icon">info</mat-icon>
          {{ 'ui.datePicker.preHijraNote' | translate }}
        </p>
      }
    </div>
  `,
  styles: [
    `
      // Three equal columns, so the control reads as one choice among three rather than a row of
      // buttons — and so a longer translation ("Islamisch (tabellarisch)") cannot resize its
      // neighbours.
      .calendar-segmented {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        width: 100%;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        overflow: hidden;
      }

      .calendar-option {
        height: 32px;
        padding: 0 6px;
        border: 0;
        // Hairlines between the options, not around them: the group owns the outer border.
        border-right: 1px solid #e5e7eb;
        background: #fff;
        font-family: inherit;
        font-size: 13px;
        font-weight: 400;
        line-height: 1;
        color: #374151;
        cursor: pointer;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition:
          background 150ms,
          color 150ms;

        &:last-child {
          border-right: 0;
        }

        &:hover:not(:disabled):not(.is-selected) {
          background: #f9fafb;
        }

        // Filled rather than ticked: a checkmark left the label unreadable.
        &.is-selected {
          background: #336790;
          color: #fff;
          font-weight: 700;
        }

        // Dimmed rather than hidden, so a reader can see the calendar exists but does not apply.
        &:disabled {
          cursor: default;
          opacity: 0.4;
        }

        &:focus-visible {
          outline: 2px solid #336790;
          outline-offset: -2px;
        }
      }

      .calendar-caption {
        margin: 4px 0 0;
        font-size: 12px;
        color: #4b5563;
      }

      .picker-note {
        display: flex;
        align-items: flex-start;
        gap: 4px;
        margin: 8px 0 0;
        font-size: 12px;
        line-height: 1.4;
        color: #4b5563;
      }

      .line-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
        flex: none;
      }
    `,
  ],
})
export class CalendarSelectorComponent {
  /** The calendar currently chosen. */
  readonly calendar = input.required<CalendarSystem>();

  /**
   * Which calendars the value can actually be expressed in.
   *
   * The others are shown disabled rather than hidden, so a reader can see that a calendar exists
   * and is not available here — which is a different statement from it not existing.
   */
  readonly available = input<readonly CalendarSystem[]>(CALENDAR_SYSTEMS);

  readonly disabled = input(false);

  /** An optional line under the control, for an owner that needs to explain the choice's scope. */
  readonly caption = input<string | null>(null);

  /**
   * Prefixes the `data-cy` hooks.
   *
   * Two call sites need distinct hooks — a single date and a period — and they were previously two
   * near-identical copies of this control. One component with a prefix replaces both.
   */
  readonly hookPrefix = input('');

  readonly calendarChange = output<CalendarSystem>();

  protected readonly calendars = CALENDAR_SYSTEMS;

  private readonly _availableSet = computed(() => new Set(this.available()));

  protected isAvailable(calendar: CalendarSystem): boolean {
    return this._availableSet().has(calendar);
  }
}
