import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { KnoraDate } from '@dasch-swiss/dsp-js';
import { CalendarSystem } from '@dasch-swiss/vre/shared/calendar';
import { TranslatePipe } from '@ngx-translate/core';

import { CalendarDateService } from '../calendar-date/calendar-date.service';

/**
 * A date being built, which is not yet necessarily a date.
 *
 * Mid-edit a year can be empty or a month chosen with no day, so this is deliberately looser than
 * `KnoraDate`: it is what the user has said so far. {@link DatePickerComponent.committed} turns it
 * into a `KnoraDate` at the single point where that is meaningful, and nothing else publishes.
 */
interface DateDraft {
  readonly year: number | null;
  readonly month: number | null;
  readonly day: number | null;
  readonly era: string;
}

/** Month abbreviations, and the Islamic month names, which exist nowhere else in the codebase. */
const MONTHS: readonly (readonly [string, string])[] = [
  ['Jan', 'Muḥarram'],
  ['Feb', 'Safar'],
  ['Mar', 'Rabīʿ al-ʾAwwal'],
  ['Apr', 'Rabīʿ ath-Thānī'],
  ['May', 'Jumadā al-ʾŪlā'],
  ['Jun', 'Jumādā ath-Thāniyah'],
  ['Jul', 'Rajab'],
  ['Aug', 'Shaʿbān'],
  ['Sep', 'Ramaḍān'],
  ['Oct', 'Shawwāl'],
  ['Nov', 'Ḏū al-Qaʿdah'],
  ['Dec', 'Ḏū al-Ḥijjah'],
];

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * Picks a date in the calendar it is told to use.
 *
 * **It is told a calendar; it never chooses or changes one.** That is the whole point of the
 * component. Its predecessor both converted dates and rendered them, holding the value twice — in
 * nine mutable fields and in a `FormGroup` that was rebuilt on every write — so a conversion could
 * finish correctly and then be overwritten by a subscription rebuilding the date from fields that
 * had not caught up. Three fixes for that passed their tests and failed in a browser.
 *
 * Here there is one writable store, {@link _draft}, and everything else is derived from it. The
 * component cannot relabel a date, because it has no code path that changes a calendar. It cannot
 * publish a half-updated one, because the only thing it emits is {@link committed}, computed from
 * the draft in one step.
 *
 * Conversion, formatting and grid arithmetic all live in {@link CalendarDateService}. Periods,
 * stored values and save semantics belong to whatever owns this component — a date picker has no
 * business knowing what a period is.
 */
@Component({
  selector: 'app-date-picker-v2',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    TranslatePipe,
  ],
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.scss'],
})
export class DatePickerComponent {
  /** The date to show. Replacing it replaces what is displayed; the component never writes it back. */
  readonly date = input<KnoraDate | null>(null);

  /**
   * The calendar to show it in.
   *
   * The owner decides this. Changing it does not convert anything here — the owner converts and
   * passes a new `date`. A picker that converted on its own is what produced the relabelling bug.
   */
  readonly calendar = input<CalendarSystem>('GREGORIAN');

  readonly disabled = input(false);

  /** Emitted when the user commits a date. Never fired by the component writing to itself. */
  readonly dateChange = output<KnoraDate | null>();

  protected readonly months = MONTHS;
  protected readonly weekDays = WEEKDAYS;

  private readonly _calendarDates = inject(CalendarDateService);

  /**
   * The single writable store: what the user has entered so far.
   *
   * Seeded from `date` on first read and thereafter owned by the user's edits. It is not a second
   * copy of the value — nothing reads it as the value. It is the half-finished input, which has to
   * exist because year is a free-text field and a date is only a date once it is complete.
   */
  private readonly _draft = signal<DateDraft | null>(null);

  /** The draft, falling back to the input while the user has not typed anything. */
  protected readonly draft = computed<DateDraft>(() => {
    const local = this._draft();
    if (local !== null) {
      return local;
    }
    const given = this.date();
    return {
      year: given?.year ?? null,
      month: given?.month ?? null,
      day: given?.day ?? null,
      era: this._eraFor(given?.era),
    };
  });

  /** Islamic has no era, so the toggle is absent and the value is always `noEra`. */
  protected readonly showsEra = computed(() => this.calendar() !== 'ISLAMIC');

  /** A year below 1 is not a year; until there is one, no month or day can be chosen. */
  protected readonly hasValidYear = computed(() => {
    const year = this.draft().year;
    return year !== null && year > 0;
  });

  /** Without a month there is no grid to pick a day from, so the day selector is inert. */
  protected readonly daySelectionDisabled = computed(() => !this.hasValidYear() || !this.draft().month);

  protected readonly monthGrid = computed(() => {
    const { year, month, era } = this.draft();
    if (!this.hasValidYear() || !month) {
      return { weeks: [] as number[][] };
    }
    return this._calendarDates.monthGrid(this.calendar(), era, year!, month);
  });

  /**
   * The day the grid shows as selected.
   *
   * Derived rather than stored, so a day the month cannot hold is never displayed: changing month,
   * year or era recomputes this, and a 31st simply stops being selected in a 30-day month. The
   * draft may still carry it, but nothing reads the draft as the value — {@link committed} uses
   * this — so an impossible date cannot be published or saved.
   */
  protected readonly selectedDay = computed(() => {
    const { day, month, year, era } = this.draft();
    if (day === null || !month || !this.hasValidYear()) {
      return null;
    }
    const astronomicalYear = this._calendarDates.convertHistoricalYearToAstronomicalYear(year!, era);
    return day <= this._calendarDates.daysInMonth(this.calendar(), astronomicalYear, month) ? day : null;
  });

  /**
   * What the picker would hand over: the draft as a `KnoraDate`, or null while incomplete.
   *
   * This is the only place a `KnoraDate` is built, and it is built from the derived values rather
   * than the raw draft — so it inherits {@link selectedDay}'s guarantee that an impossible day is
   * dropped, and degrades to month precision instead, which is true rather than invented.
   */
  protected readonly committed = computed<KnoraDate | null>(() => {
    const { year, month, era } = this.draft();
    if (!this.hasValidYear()) {
      return null;
    }
    const day = this.selectedDay();
    return new KnoraDate(this.calendar(), this.showsEra() ? era : 'noEra', year!, month ?? undefined, day ?? undefined);
  });

  /** The value as text, for the closed field. */
  protected readonly displayText = computed(() => {
    const value = this.committed();
    return value ? this._calendarDates.format(value, 'dd.MM.YYYY', 'era') : '';
  });

  protected readonly calendarLabel = computed(() => `ui.calendarMarker.calendars.${this.calendar()}`);

  // -----------------------------------------------------------------------------------------
  // User intent. Each of these is a thing the user did; each ends in exactly one emission.
  // -----------------------------------------------------------------------------------------

  protected onYearChange(value: string): void {
    const year = value === '' ? null : Number(value);
    this._edit({ year: Number.isFinite(year as number) ? year : null });
  }

  protected onMonthChange(month: number | null): void {
    this._edit({ month });
  }

  protected onEraChange(era: string): void {
    this._edit({ era });
  }

  protected onDayChange(day: number | null): void {
    this._edit({ day });
  }

  /** Today, in the calendar this picker was told to use. */
  protected onToday(): void {
    const today = this._calendarDates.today(this.calendar());
    if (today === undefined) {
      return;
    }
    this._edit({
      year: today.year,
      month: today.month ?? null,
      day: today.day ?? null,
      era: this._eraFor(today.era),
    });
  }

  private _edit(change: Partial<DateDraft>): void {
    this._draft.set({ ...this.draft(), ...change });
    this.dateChange.emit(this.committed());
  }

  /** Islamic dates carry no era; everything else defaults to CE rather than inheriting `noEra`. */
  private _eraFor(era: string | undefined): string {
    if (this.calendar() === 'ISLAMIC') {
      return 'noEra';
    }
    return era === undefined || era === 'noEra' ? 'CE' : era;
  }
}
