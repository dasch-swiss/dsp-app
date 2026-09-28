import { CdkConnectedOverlay, CdkOverlayOrigin } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CalendarSystem } from '@dasch-swiss/vre/shared/calendar';
import { TranslatePipe } from '@ngx-translate/core';

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
        color: rgba(0, 0, 0, 0.6);
        cursor: pointer;
        /* Dotted, not solid: it opens a reading, it does not change the value. */
        text-decoration: underline dotted;
        text-underline-offset: 3px;
        transition: color 150ms;
      }

      .calendar-marker:hover,
      .calendar-marker:focus-visible {
        color: #336790;
      }

      .calendar-marker-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
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
        font-variant-numeric: tabular-nums;
      }

      .calendar-marker-name {
        opacity: 0.7;
      }

      .is-stored {
        font-weight: 700;
        opacity: 1;
      }

      .calendar-marker-absent {
        font-style: italic;
        opacity: 0.7;
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

  private readonly _open = signal(false);

  protected readonly isOpen = this._open.asReadonly();

  protected readonly storedLabel = computed(() => `ui.calendarMarker.calendars.${this.storedCalendar()}`);

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
