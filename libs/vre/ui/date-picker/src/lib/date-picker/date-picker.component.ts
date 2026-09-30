import { CdkConnectedOverlay, CdkOverlayOrigin, ConnectedPosition } from '@angular/cdk/overlay';
import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { KnoraDate } from '@dasch-swiss/dsp-js';
import { CalendarSystem } from '@dasch-swiss/vre/shared/calendar';
import { CalendarDateService, WEEKDAY_KEYS } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';

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

/**
 * The grid header, as translation keys rather than letters.
 *
 * "M T W T F S S" is English: German runs M D M D F S S and French L M M J V S D, so a hardcoded
 * row mislabels every column for most of the app's languages. The short forms live beside the full
 * names the reading popover uses, so the two cannot drift apart.
 */
const WEEKDAY_HEADER = WEEKDAY_KEYS.map(key => `ui.weekdays.${key}.short`);

/** The two eras offered as a segmented choice. Islamic has none and shows a fixed AH instead. */
const ERAS = ['CE', 'BCE'] as const;

/**
 * Below the field, falling back to above it.
 *
 * The panel is taller than most rows in a property list, so near the bottom of the viewport the
 * only way to show it whole is to flip it. Leaving it below is what cut it off.
 */
const PANEL_POSITIONS: readonly ConnectedPosition[] = [
  { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
  { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
];

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
  selector: 'app-date-picker',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Only the trigger's icon is Material now: the panel is native controls styled to the design,
  // which is a row of equal-height bordered boxes Material's form fields cannot express.
  imports: [CdkConnectedOverlay, CdkOverlayOrigin, MatIconModule, TranslatePipe],
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

  /**
   * Names this field — "Start date", "End date" — as a caption on the closed field and a title on
   * the open panel. Null for a lone date, which needs no name to be unambiguous.
   */
  readonly label = input<string | null>(null);

  /** Emitted when the user commits a date. Never fired by the component writing to itself. */
  readonly dateChange = output<KnoraDate | null>();

  protected readonly months = MONTHS;
  protected readonly weekDays = WEEKDAY_HEADER;
  protected readonly eras = ERAS;
  protected readonly PANEL_POSITIONS = PANEL_POSITIONS;

  /**
   * Whether the panel is showing.
   *
   * Closed at rest: two pickers that both render their grid inline stack into a column and, low in
   * a property list, run off the bottom of the screen. Opening one is the user's choice, and only
   * one panel exists per picker, so a period reads as two fields on one line.
   */
  private readonly _open = signal(false);

  protected readonly isOpen = this._open.asReadonly();

  private readonly _calendarDates = inject(CalendarDateService);

  /**
   * The single writable store: what the user has entered so far.
   *
   * Seeded from `date` on first read and thereafter owned by the user's edits. It is not a second
   * copy of the value — nothing reads it as the value. It is the half-finished input, which has to
   * exist because year is a free-text field and a date is only a date once it is complete.
   */
  private readonly _draft = signal<DateDraft | null>(null);

  /**
   * Every `date` the draft has already accounted for: the one it was seeded from, and each one it
   * has published since.
   *
   * This is what lets the component tell a new instruction from its own echo. The owner writes
   * `date` back after every emission, and some owners do not write it back at all, so "has this
   * value passed through here already?" is the question that distinguishes the two — not "is this
   * the most recent one".
   */
  private readonly _accountedFor = signal<readonly (KnoraDate | null)[]>([]);

  /**
   * The draft, falling back to the input while the user has not typed anything.
   *
   * **A new `date` from the owner wins over the draft.** The owner converts the value when the
   * calendar changes and hands the result down; a draft that shadowed the input for the
   * component's life kept the field showing the pre-conversion date while the value underneath had
   * already moved. The draft still wins over the *same* `date` arriving again, which is the
   * component's own emission travelling back through the owner — treating that as an instruction
   * would discard a half-typed year on every keystroke.
   */
  protected readonly draft = computed<DateDraft>(() => {
    const given = this.date();
    const local = this._draft();

    if (local !== null && this._hasAccountedFor(given)) {
      return local;
    }
    return {
      year: given?.year ?? null,
      month: given?.month ?? null,
      day: given?.day ?? null,
      era: this._eraFor(given?.era),
    };
  });

  /** Whether this exact date has already passed through the draft, in either direction. */
  private _hasAccountedFor(given: KnoraDate | null): boolean {
    return this._accountedFor().some(seen => this._sameDate(seen, given));
  }

  private _sameDate(a: KnoraDate | null, b: KnoraDate | null): boolean {
    if (a === null || b === null) {
      return a === b;
    }
    return a.calendar === b.calendar && a.era === b.era && a.year === b.year && a.month === b.month && a.day === b.day;
  }

  /** Islamic has no era, so the toggle is absent and the value is always `noEra`. */
  protected readonly showsEra = computed(() => this.calendar() !== 'ISLAMIC');

  /** A year below 1 is not a year; until there is one, no month or day can be chosen. */
  protected readonly hasValidYear = computed(() => {
    const year = this.draft().year;
    return year !== null && year > 0;
  });

  /**
   * The month the grid draws, which is today's while the user has entered nothing.
   *
   * **Display only — it is never written to the draft.** An empty picker used to be seeded with
   * today so there was something to click, but a seeded draft is indistinguishable from an entry:
   * switching the era then published `{2026, Sep, BCE}`, a date nobody typed, and the Month select
   * showed a month while no day was selected. Falling back here instead keeps the value empty
   * until the user actually picks a day, and keeps every control telling the same story.
   */
  private readonly _gridMonth = computed<{ year: number; month: number; era: string } | null>(() => {
    const { year, month, era } = this.draft();
    if (this.hasValidYear() && month) {
      return { year: year!, month, era };
    }
    // Nothing entered yet: show the current month so the panel opens on something clickable.
    if (year === null && month === null) {
      const today = this._calendarDates.today(this.calendar());
      if (today?.month !== undefined) {
        return { year: today.year, month: today.month, era: this._eraFor(today.era) };
      }
    }
    return null;
  });

  /**
   * Whether there is a month to show days for.
   *
   * Reads the grid rather than the draft, so an empty picker — whose grid falls back to the
   * current month — still shows days to click. Gating on the draft is what left a new value with
   * an empty panel.
   */
  protected readonly hasDayGrid = computed(() => this._gridMonth() !== null);

  protected readonly monthGrid = computed(() => {
    const grid = this._gridMonth();
    if (grid === null) {
      return { weeks: [] as number[][] };
    }
    return this._calendarDates.monthGrid(this.calendar(), grid.era, grid.year, grid.month);
  });

  /**
   * The month as one flat run of cells, for a seven-column grid.
   *
   * `null` is a leading blank before the first weekday; the service already pads with `0` for
   * those. A grid rather than rows of weeks, so the columns line up under the weekday header even
   * in a month whose last week is short.
   */
  protected readonly dayCells = computed<(number | null)[]>(() =>
    this.monthGrid().weeks.flatMap(week => week.map(day => (day > 0 ? day : null)))
  );

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

  /** What the trigger and the panel are called, for screen readers and the panel's own header. */
  protected readonly fieldLabel = computed(() => this.label() ?? 'ui.datePicker.calendar');

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

  /**
   * Picks a day from the grid.
   *
   * On an empty picker the grid is showing the current month as a fallback, so the click has to
   * adopt that month and year as well — otherwise it would set a day against no year and publish
   * nothing. This is the point where the fallback becomes the user's entry, because it is the
   * first moment they have chosen anything.
   */
  protected onDayChange(day: number | null): void {
    const { year, month } = this.draft();
    if (year === null && month === null) {
      const grid = this._gridMonth();
      if (grid !== null) {
        this._edit({ day, year: grid.year, month: grid.month, era: grid.era });
        return;
      }
    }
    this._edit({ day });
  }

  /** Today, in the calendar this picker was told to use. It commits, so it also closes. */
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
    this.close();
  }

  protected toggle(): void {
    if (!this.disabled()) {
      this._open.update(open => !open);
    }
  }

  protected close(): void {
    this._open.set(false);
  }

  protected onOverlayKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.close();
    }
  }

  private _edit(change: Partial<DateDraft>): void {
    // Read before anything is recorded: `draft()` consults `_accountedFor`, so adding to it first
    // would make this read the stale local draft rather than the date currently displayed.
    const base = this.draft();

    // The input the draft is diverging from counts as accounted for too: an owner that never
    // writes `date` back would otherwise look like it was issuing that same date as a fresh
    // instruction on the next read, discarding the edit that had just been made.
    const seeded = this.date();
    this._accountedFor.update(seen => (seen.some(d => this._sameDate(d, seeded)) ? seen : [...seen, seeded]));

    this._draft.set({ ...base, ...change });

    // What the owner is about to be told, and so what it will write back. Recording it here is
    // what lets {@link draft} recognise that echo and keep the user's entry, while still yielding
    // to a `date` the owner arrived at some other way — a conversion, or a reload.
    const published = this.committed();
    this._accountedFor.update(seen => [...seen, published]);
    this.dateChange.emit(published);
  }

  /** Islamic dates carry no era; everything else defaults to CE rather than inheriting `noEra`. */
  private _eraFor(era: string | undefined): string {
    if (this.calendar() === 'ISLAMIC') {
      return 'noEra';
    }
    return era === undefined || era === 'noEra' ? 'CE' : era;
  }
}
