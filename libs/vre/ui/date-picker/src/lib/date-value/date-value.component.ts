import { ChangeDetectionStrategy, Component, computed, forwardRef, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { KnoraDate, KnoraPeriod } from '@dasch-swiss/dsp-js';
import { CalendarSystem, compareDates } from '@dasch-swiss/vre/shared/calendar';
import { TranslatePipe } from '@ngx-translate/core';

import { CalendarDateService } from '../calendar-date/calendar-date.service';
import { CalendarSelectorComponent } from '../calendar-selector/calendar-selector.component';
import { DatePickerComponent } from '../date-picker/date-picker.component';

/** What the user is building: one date, or a period with two ends. */
interface DateValueState {
  readonly start: KnoraDate | null;
  readonly end: KnoraDate | null;
  readonly isPeriod: boolean;
  readonly calendar: CalendarSystem;
}

/**
 * A DSP date value: one date or a period, in one calendar, edited against what is stored.
 *
 * This is where the domain lives — periods, start and end, the stored value, whether saving would
 * change anything. The picker below it knows none of that; it is handed a date and a calendar and
 * reports what the user clicked.
 *
 * **The rules this component is held to**, because it owns every ingredient of the defect the
 * rewrite exists to remove — conversion, a stored value, and a form:
 *
 * 1. One authoritative store: {@link _state}. Nothing else is read as the value.
 * 2. No `valueChanges` subscription feeding back into its own state. There are no subscriptions.
 * 3. No imperative guard flags sequencing reads against writes. The previous implementation needed
 *    six of them; if this one needs any, the design is wrong.
 * 4. `writeValue` and `setDisabledState` write `signal()`s — never `input()`, which is read-only
 *    and would fail silently.
 * 5. Emission happens in event handlers only, never in an `effect()`, or the parent writing back
 *    becomes an echo.
 * 6. Conversion happens once per user choice, in one place, and the result is handed to the
 *    pickers as inputs.
 */
@Component({
  selector: 'app-date-value',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CalendarSelectorComponent,
    DatePickerComponent,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    TranslatePipe,
  ],
  templateUrl: './date-value.component.html',
  styleUrls: ['./date-value.component.scss'],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DateValueComponent), multi: true },
    { provide: NG_VALIDATORS, useExisting: forwardRef(() => DateValueComponent), multi: true },
  ],
})
export class DateValueComponent implements ControlValueAccessor, Validator {
  /** When false, an empty value is allowed — this is how a caller makes a date optional. */
  readonly valueRequired = input(true);

  private readonly _calendarDates = inject(CalendarDateService);

  /** The one authoritative store. */
  private readonly _state = signal<DateValueState>({
    start: null,
    end: null,
    isPeriod: false,
    calendar: 'GREGORIAN',
  });

  private readonly _disabled = signal(false);

  /**
   * The value as it was stored, when editing an existing one.
   *
   * Captured from the first write that carries a value, not the first write at all: the editor
   * renders this through a `formControl` that is empty until the resource loads, so the first
   * `writeValue` is a null. Treating that as "nothing is stored" left the conversion base unset for
   * the component's life, and a period switched away and back came home a year short.
   *
   * It is also never captured from a write this component caused — the user's own entry travelling
   * back through `writeValue` is not a stored value, and mistaking it for one put a stored-value
   * line on a form where nothing was stored.
   */
  private readonly _stored = signal<KnoraDate | KnoraPeriod | null>(null);

  /** Whether the user has interacted, which gates the required-field errors. */
  private readonly _touched = signal(false);

  /**
   * What conversions measure from: the stored value, until the user edits a date.
   *
   * Switching away and back then restores the stored value exactly, rather than accumulating the
   * drift of converting a conversion — a Julian year is a two-year Gregorian span, and converting
   * that back lands a year early.
   */
  private readonly _baseIsStored = signal(true);

  protected readonly state = this._state.asReadonly();
  protected readonly disabled = this._disabled.asReadonly();
  protected readonly stored = this._stored.asReadonly();

  protected readonly isEditingStoredValue = computed(() => this._stored() !== null);

  /** Which calendars can express this value; a period needs both ends representable. */
  protected readonly availableCalendars = computed<readonly CalendarSystem[]>(() => {
    const value = this._asValue(this._state());
    return value ? this._calendarDates.availableCalendarsFor(value) : (['GREGORIAN', 'JULIAN', 'ISLAMIC'] as const);
  });

  /** The stored value as text, for the lines that state what is stored and what was converted. */
  protected readonly storedText = computed(() => {
    const stored = this._stored();
    if (stored === null) {
      return '';
    }
    const calendar = this._calendarDates.calendarName(
      stored instanceof KnoraPeriod ? stored.start.calendar : stored.calendar
    );
    if (stored instanceof KnoraPeriod) {
      return `${this._plain(stored.start)} – ${this._plain(stored.end)} ${calendar}`;
    }
    return `${this._plain(stored)} ${calendar}`;
  });

  /** Whether what is shown is a conversion of the stored value rather than the stored value itself. */
  protected readonly isConverted = computed(() => {
    const stored = this._stored();
    if (stored === null) {
      return false;
    }
    const storedCalendar = (stored instanceof KnoraPeriod ? stored.start.calendar : stored.calendar).toUpperCase();
    return storedCalendar !== this._state().calendar;
  });

  /** Whether conversions still measure from the stored value, which "(Stored value)" states. */
  protected readonly baseIsStored = computed(() => this._baseIsStored() && this._stored() !== null);

  /** What would be written, as text. */
  protected readonly willBeStoredText = computed(() => {
    const value = this._asValue(this._state());
    if (value === null) {
      return '';
    }
    const calendar = this._calendarDates.calendarName(this._state().calendar);
    if (value instanceof KnoraPeriod) {
      return `${this._plain(value.start)} – ${this._plain(value.end)} ${calendar}`;
    }
    return `${this._plain(value)} ${calendar}`;
  });

  /**
   * Whether saving would change anything.
   *
   * Compares the instant a date denotes rather than its fields, so a calendar switch alone reads as
   * unchanged — the same comparison the save gate uses. Saying otherwise would promise a save the
   * gate then refuses.
   */
  protected readonly isUnchangedFromStored = computed(() => {
    const stored = this._stored();
    const current = this._asValue(this._state());
    if (stored === null || current === null) {
      return false;
    }
    return this._calendarDates.dateValuesDenoteSameInstant(stored, current);
  });

  /** The period's ends are out of order — shown in the card, not only as a form error. */
  protected readonly endBeforeStart = computed(() => {
    const { start, end, isPeriod } = this._state();
    if (!isPeriod || start === null || end === null) {
      return false;
    }
    // Compared through JDN rather than by field, so a period whose ends sit in different calendars
    // still validates correctly — which comparing year/month/day would not.
    return (
      compareDates(
        this._calendarDates.createJDNCalendarDateFromKnoraDate(start),
        this._calendarDates.createJDNCalendarDateFromKnoraDate(end)
      ) > 0
    );
  });

  protected readonly showStartRequired = computed(
    () => this.valueRequired() && this._touched() && this._state().start === null
  );

  protected readonly showEndRequired = computed(
    () => this._touched() && this._state().isPeriod && this._state().end === null
  );

  // -----------------------------------------------------------------------------------------
  // ControlValueAccessor
  // -----------------------------------------------------------------------------------------

  private _onChange: (value: KnoraDate | KnoraPeriod | null) => void = () => {};
  private _onTouched: () => void = () => {};

  /** Set only while this component reports its own change, so the echo is not taken for a store. */
  private _emitting = false;

  writeValue(value: KnoraDate | KnoraPeriod | null): void {
    // A write that did not originate here is a value being loaded, so it replaces what is stored
    // and re-anchors conversions on it. Without this the component would keep measuring against
    // the first value it ever saw: it is bound to an input rather than recreated per value, so a
    // second resource would be edited against the first one's stored date, and every "nothing to
    // save" judgement would be made against the wrong thing.
    if (!this._emitting) {
      this._stored.set(value);
      this._baseIsStored.set(true);
      this._touched.set(false);
    }

    // A null write is the form being cleared or reset, not a period becoming a single date. The
    // period shape belongs to what the user asked for, and dropping it here silently turned a
    // range back into one date with nothing to notice it.
    if (value === null) {
      this._state.update(state => ({ ...state, start: null, end: null }));
      return;
    }

    this._state.set({
      start: value instanceof KnoraPeriod ? value.start : value,
      end: value instanceof KnoraPeriod ? value.end : null,
      isPeriod: value instanceof KnoraPeriod,
      calendar: this._calendarOf(value),
    });
  }

  registerOnChange(fn: (value: KnoraDate | KnoraPeriod | null) => void): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this._disabled.set(isDisabled);
  }

  /**
   * Whether the value is complete and coherent.
   *
   * A period that has been asked for but not yet finished is genuinely incomplete, so it is
   * invalid — saving half a period would store a single date under a user's intent to store a
   * range. But the message is withheld until the field has been touched: an error appearing the
   * instant a user clicks "add end date" is scolding them for not having done something yet.
   * {@link showEndRequired} owns that display rule; this owns the truth.
   */
  validate(): ValidationErrors | null {
    const { start, end, isPeriod } = this._state();

    if (this.valueRequired() && start === null) {
      return { required: true };
    }
    if (isPeriod && end === null) {
      // Not gated on `valueRequired`: that input says whether a value must exist at all, not
      // whether a period a user has explicitly asked for may be left half-built.
      return { endRequired: true };
    }
    if (this.endBeforeStart()) {
      return { periodStartEnd: true };
    }
    return null;
  }

  // -----------------------------------------------------------------------------------------
  // User intent — every emission originates in one of these
  // -----------------------------------------------------------------------------------------

  /**
   * Converts the whole value into the chosen calendar.
   *
   * The only place a conversion happens, and it happens once: both ends are converted here and the
   * pickers are handed the results as inputs. Previously three separate code paths converted, and
   * they could disagree.
   */
  protected onCalendarChange(calendar: CalendarSystem): void {
    const source = this._conversionSource();
    if (source === null) {
      this._commit({ ...this._state(), calendar });
      return;
    }

    const start = this._convert(source.start, calendar, 'start');
    if (start === null) {
      // The target cannot express this date. Restoring what the value actually has is the honest
      // answer; stamping the unrepresentable calendar onto it is what relabelling looked like.
      return;
    }

    const end = source.end === null ? null : this._convert(source.end, calendar, 'end');
    if (source.end !== null && end === null) {
      return;
    }

    this._commit({ ...this._state(), start, end, calendar });
  }

  protected onStartChange(date: KnoraDate | null): void {
    this._touch();
    this._rebaseIfEdited(date, this._state().end);
    this._commit({ ...this._state(), start: date });
  }

  protected onEndChange(date: KnoraDate | null): void {
    this._touch();
    this._rebaseIfEdited(this._state().start, date);
    this._commit({ ...this._state(), end: date });
  }

  protected onTogglePeriod(event: Event): void {
    event.preventDefault();
    this._touch();
    const isPeriod = !this._state().isPeriod;
    this._commit({ ...this._state(), isPeriod, end: isPeriod ? this._state().end : null });
  }

  // -----------------------------------------------------------------------------------------

  /** What a conversion measures from: the stored value while it is still the basis. */
  private _conversionSource(): { start: KnoraDate; end: KnoraDate | null } | null {
    const stored = this._stored();
    if (this._baseIsStored() && stored !== null) {
      return stored instanceof KnoraPeriod ? { start: stored.start, end: stored.end } : { start: stored, end: null };
    }
    const { start, end } = this._state();
    return start === null ? null : { start, end };
  }

  /**
   * One end of the value in another calendar.
   *
   * A start takes the first day of its converted span and an end the last, so an imprecise period
   * never shrinks: a Julian 1580–1585 covers Gregorian 1580–1586, and taking each span's start
   * would silently drop a year of a value that is saved rather than merely displayed.
   *
   * Returning to the source's own calendar is a return, not a conversion: the date is taken
   * verbatim, so an imprecise one comes back at its stored precision rather than a span's start.
   */
  private _convert(date: KnoraDate, target: CalendarSystem, which: 'start' | 'end'): KnoraDate | null {
    if (date.calendar.toUpperCase() === target) {
      return date;
    }
    const converted = this._calendarDates.convertKnoraDateTo(date, target);
    if (converted === undefined) {
      return null;
    }
    return which === 'end' ? (converted.end ?? converted.start) : converted.start;
  }

  /**
   * Moves the conversion base onto the user's entry once they change a date.
   *
   * Compared against what converting the stored value into the current calendar would produce,
   * because a conversion is *supposed* to move the ends — comparing against the stored value
   * directly would read every correct conversion as an edit.
   */
  private _rebaseIfEdited(start: KnoraDate | null, end: KnoraDate | null): void {
    if (!this._baseIsStored()) {
      return;
    }
    const source = this._conversionSource();
    if (source === null || start === null) {
      return;
    }

    const calendar = this._state().calendar;
    const expectedStart = this._convert(source.start, calendar, 'start');
    const expectedEnd = source.end === null ? null : this._convert(source.end, calendar, 'end');

    const startMoved = expectedStart === null || !this._calendarDates.knoraDatesDenoteSameInstant(expectedStart, start);
    const endMoved =
      expectedEnd !== null && end !== null && !this._calendarDates.knoraDatesDenoteSameInstant(expectedEnd, end);

    if (startMoved || endMoved) {
      this._baseIsStored.set(false);
    }
  }

  /** The single exit: state is set, then the value is reported, in that order, once. */
  private _commit(state: DateValueState): void {
    this._state.set(state);

    this._emitting = true;
    try {
      this._onChange(this._asValue(state));
    } finally {
      this._emitting = false;
    }
  }

  private _touch(): void {
    if (!this._touched()) {
      this._touched.set(true);
      this._onTouched();
    }
  }

  /**
   * The state as a value the form can hold.
   *
   * A period with no end yet is **still the start date**, not nothing. Asking for an end date is a
   * statement of intent, not a retraction of what has already been entered — an earlier version
   * returned null here, so clicking "add end date" on a complete date emptied the form and turned
   * a valid control invalid before the user had picked anything. That reads as data loss.
   *
   * The value only becomes a `KnoraPeriod` once there are two ends to make one from.
   */
  private _asValue(state: DateValueState): KnoraDate | KnoraPeriod | null {
    if (state.start === null) {
      return null;
    }
    if (state.isPeriod && state.end !== null) {
      return new KnoraPeriod(state.start, state.end);
    }
    return state.start;
  }

  private _calendarOf(value: KnoraDate | KnoraPeriod | null): CalendarSystem {
    if (value === null) {
      return this._state().calendar;
    }
    const date = value instanceof KnoraPeriod ? value.start : value;
    return date.calendar.toUpperCase() as CalendarSystem;
  }

  private _plain(date: KnoraDate): string {
    return this._calendarDates.format(date, 'dd.MM.YYYY', 'era');
  }
}
