import { ChangeDetectionStrategy, Component, computed, forwardRef, inject, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALIDATORS, NG_VALUE_ACCESSOR, ValidationErrors, Validator } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { KnoraDate, KnoraPeriod, Precision } from '@dasch-swiss/dsp-js';
import { CALENDAR_SYSTEMS, CalendarSystem } from '@dasch-swiss/vre/shared/calendar';
import { CalendarDateService } from '@dasch-swiss/vre/ui/ui';
import { TranslatePipe } from '@ngx-translate/core';

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
   * What conversions measure from, per end: the stored value's ends, until the user enters or clears
   * one — then that entry, in the calendar it was entered in.
   *
   * Every switch converts from here, never from the previous switch's result, so returning to the
   * calendar a date was stored or entered in gives it back exactly. Converting a conversion drifts:
   * an Islamic year restated by its first day comes back one Gregorian year earlier, so a user
   * switching back and forth watched the year count down.
   */
  private readonly _base = signal<{ readonly start: KnoraDate | null; readonly end: KnoraDate | null }>({
    start: null,
    end: null,
  });

  protected readonly state = this._state.asReadonly();
  protected readonly disabled = this._disabled.asReadonly();
  protected readonly stored = this._stored.asReadonly();

  protected readonly isEditingStoredValue = computed(() => this._stored() !== null);

  /**
   * The calendars a switch can go to: those the base converts into, a period with its ends in order.
   * Measured from the base, as the switch is, so the calendar a date was stored in stays offered —
   * and an offered calendar that then refused the switch would be a control that does nothing.
   */
  protected readonly availableCalendars = computed<readonly CalendarSystem[]>(() =>
    CALENDAR_SYSTEMS.filter(calendar => calendar === this._state().calendar || this._fromBase(calendar) !== null)
  );

  /** The stored value as text, for the lines that state what is stored and what was converted. */
  protected readonly storedText = computed(() => {
    const stored = this._stored();
    return stored === null ? '' : this._text(stored);
  });

  /**
   * The stored value converted into the calendar now chosen, while the form still holds it.
   *
   * What the conversion hint is about. Measured from the stored value rather than read from the
   * form, so the hint stays true when the user adds an end to a converted single date: the start is
   * still the conversion. Once the user changes a date that came from the stored value, the hint
   * would name a date no longer in the form, so there is none; the stored-value line above the
   * fields still says what is stored.
   */
  private readonly _convertedStored = computed<KnoraDate | KnoraPeriod | null>(() => {
    const stored = this._stored();
    const { start, end, calendar } = this._state();
    if (stored === null || start === null || this._calendarOf(stored) === calendar) {
      return null;
    }
    const holds = (converted: KnoraDate | null, current: KnoraDate | null): converted is KnoraDate =>
      converted !== null && current !== null && this._calendarDates.knoraDatesDenoteSameInstant(converted, current);

    if (stored instanceof KnoraPeriod) {
      const convertedStart = this._convert(stored.start, calendar);
      const convertedEnd = this._convert(stored.end, calendar);
      return holds(convertedStart, start) && holds(convertedEnd, end)
        ? new KnoraPeriod(convertedStart, convertedEnd)
        : null;
    }
    const converted = this._convert(stored, calendar);
    return holds(converted, start) ? converted : null;
  });

  /**
   * The conversion hint: its translation key and the two values it names as text, or null.
   *
   * Only a day is ever converted, so only a day is ever named. A year or a month is restated by a
   * fixed rule — the same numbers between Julian and Gregorian, the containing year or month in
   * Islamic — and goes without comment; in a period with one day and one year or month, the hint
   * names the day alone. The "same day" clause is the one thing a reader cannot work out from the
   * numerals: 15.06.2024 Gregorian and 02.06.2024 Julian look like different dates and are not.
   */
  protected readonly conversionHint = computed(() => {
    const stored = this._stored();
    const converted = this._convertedStored();
    if (stored === null || converted === null) {
      return null;
    }
    if (!this._isImprecise(stored)) {
      return this._convertedHint(stored, converted);
    }
    if (stored instanceof KnoraPeriod && converted instanceof KnoraPeriod) {
      if (stored.start.precision === Precision.dayPrecision) {
        return this._convertedHint(stored.start, converted.start);
      }
      if (stored.end.precision === Precision.dayPrecision) {
        return this._convertedHint(stored.end, converted.end);
      }
    }
    return null;
  });

  private _convertedHint(stored: KnoraDate | KnoraPeriod, converted: KnoraDate | KnoraPeriod) {
    let key = 'ui.datePicker.convertedStored';
    if (this._calendarDates.dateValuesDenoteSameInstant(stored, converted)) {
      key =
        converted instanceof KnoraPeriod
          ? 'ui.datePicker.convertedStoredSamePeriod'
          : 'ui.datePicker.convertedStoredSameDay';
    }
    return { key, from: this._text(stored), to: this._text(converted) };
  }

  /**
   * The note for a day the Gregorian reform skipped, whether the user picked it or a conversion
   * produced it — Julian 25.09.1582 is Gregorian 05.10.1582. It is stored as given, so it reloads
   * as the same day; the note is what keeps that from happening silently.
   */
  protected readonly reformGap = computed(() => {
    const value = this._asValue(this._state());
    return value === null ? undefined : this._calendarDates.reformGapOf(value);
  });

  /** The calendar now chosen, for the hint that names it. */
  protected readonly calendarLabel = computed(() => `ui.calendarMarker.calendars.${this._state().calendar}`);

  /** The period's ends are out of order — shown in the card, not only as a form error. */
  protected readonly endBeforeStart = computed(() => {
    const { start, end, isPeriod } = this._state();
    if (!isPeriod || start === null || end === null) {
      return false;
    }
    return this._calendarDates.isPeriodOutOfOrder(start, end);
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
      this._base.set({
        start: value instanceof KnoraPeriod ? value.start : value,
        end: value instanceof KnoraPeriod ? value.end : null,
      });
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
    const converted = this._fromBase(calendar);
    if (converted === null) {
      // The target cannot express this value. Keeping what the value actually has is the honest
      // answer; stamping the unrepresentable calendar onto it is what relabelling looked like.
      return;
    }
    this._commit({ ...this._state(), ...converted, calendar });
  }

  protected onStartChange(date: KnoraDate | null): void {
    this._touch();
    this._base.update(base => ({ ...base, start: date }));
    this._commit({ ...this._state(), start: date });
  }

  protected onEndChange(date: KnoraDate | null): void {
    this._touch();
    this._base.update(base => ({ ...base, end: date }));
    this._commit({ ...this._state(), end: date });
  }

  protected onTogglePeriod(event: Event): void {
    event.preventDefault();
    this._touch();
    const isPeriod = !this._state().isPeriod;
    const end = isPeriod ? (this._state().end ?? this._presetEnd(this._state().start)) : null;
    this._base.update(base => ({ ...base, end }));
    this._commit({ ...this._state(), isPeriod, end });
  }

  // -----------------------------------------------------------------------------------------

  /**
   * The value converted from its base into a calendar, or null when that calendar cannot take it:
   * an end it cannot express, or a period whose ends the conversion would put out of order — a day
   * converts while a month keeps its numbers, so Julian 25.12.1600 – 12.1600 would become
   * Gregorian 04.01.1601 – 12.1600.
   */
  private _fromBase(calendar: CalendarSystem): { start: KnoraDate | null; end: KnoraDate | null } | null {
    const { start, end } = this._base();
    const convertedStart = start === null ? null : this._convert(start, calendar);
    const convertedEnd = end === null ? null : this._convert(end, calendar);
    if ((start !== null && convertedStart === null) || (end !== null && convertedEnd === null)) {
      return null;
    }
    if (
      convertedStart !== null &&
      convertedEnd !== null &&
      this._calendarDates.isPeriodOutOfOrder(convertedStart, convertedEnd)
    ) {
      return null;
    }
    return { start: convertedStart, end: convertedEnd };
  }

  /** One end of the value in another calendar, as this editor restates it — see the service. */
  private _convert(date: KnoraDate, target: CalendarSystem): KnoraDate | null {
    return this._calendarDates.restateKnoraDateIn(date, target) ?? null;
  }

  /** The end a period starts with when the user adds one: the next day, month or year. */
  private _presetEnd(start: KnoraDate | null): KnoraDate | null {
    return start === null ? null : (this._calendarDates.nextKnoraDate(start) ?? null);
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

  /** Whether any end of the value is a year or a month rather than a day. */
  private _isImprecise(value: KnoraDate | KnoraPeriod): boolean {
    const dates = value instanceof KnoraPeriod ? [value.start, value.end] : [value];
    return dates.some(date => date.precision !== Precision.dayPrecision);
  }

  private _text(value: KnoraDate | KnoraPeriod): string {
    const calendar = this._calendarDates.calendarName(this._calendarOf(value));
    if (value instanceof KnoraPeriod) {
      return `${this._plain(value.start)} – ${this._plain(value.end)} ${calendar}`;
    }
    return `${this._plain(value)} ${calendar}`;
  }

  private _plain(date: KnoraDate): string {
    return this._calendarDates.format(date, 'dd.MM.YYYY', 'era');
  }
}
