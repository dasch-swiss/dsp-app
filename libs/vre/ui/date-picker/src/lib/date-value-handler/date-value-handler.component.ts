/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { coerceBooleanProperty } from '@angular/cdk/coercion';

import { Component, DoCheck, HostBinding, Input, OnDestroy, OnInit, Optional, Self } from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormGroupDirective,
  NgControl,
  NgForm,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldControl, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { KnoraDate, KnoraPeriod } from '@dasch-swiss/dsp-js';
import { CALENDAR_SYSTEMS, CalendarSystem, compareDates } from '@dasch-swiss/vre/shared/calendar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject, Subscription } from 'rxjs';
import { AppDatePickerComponent } from '../app-date-picker/app-date-picker.component';
import { ValueService } from './value.service';

/** if a period is defined, start date must be before end date */
export function periodStartEndValidator(
  isPeriod: UntypedFormControl,
  endDate: UntypedFormControl,
  valueService: ValueService
): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (isPeriod.value && control.value !== null && endDate.value !== null) {
      // period: check if start is before end
      const startCalendarDate = valueService.createJDNCalendarDateFromKnoraDate(control.value);
      const endCalendarDate = valueService.createJDNCalendarDateFromKnoraDate(endDate.value);

      // Start date should be before or equal to end date
      const invalid = compareDates(startCalendarDate, endCalendarDate) > 0;

      return invalid ? { periodStartEnd: { value: control.value } } : null;
    }

    return null;
  };
}

@Component({
  selector: 'app-date-value-handler',
  imports: [
    AppDatePickerComponent,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatIconModule,
    MatTooltipModule,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: './date-value-handler.component.html',
  styleUrls: ['./date-value-handler.component.scss'],
  providers: [
    {
      provide: MatFormFieldControl,
      useExisting: DateValueHandlerComponent,
    },
    { provide: Subject },
  ],
})
export class DateValueHandlerComponent
  implements ControlValueAccessor, MatFormFieldControl<KnoraDate | KnoraPeriod>, DoCheck, OnInit, OnDestroy
{
  static nextId = 0;

  @Input() valueRequiredValidator = true;

  // Required for CanUpdateErrorState interface
  errorState = false;
  stateChanges = new Subject<void>();

  form: UntypedFormGroup;

  isPeriodControl: UntypedFormControl;
  calendarControl: UntypedFormControl;
  startDate: UntypedFormControl;
  endDate: UntypedFormControl;

  pickerClosed = false;
  readonly focused = false;

  /**
   * the value as it was stored, when this handler is editing an existing one.
   *
   * Captured from the first write rather than taken as an input: `writeValue` delivers the stored
   * value when a form is initialised for editing, and delivers null when adding. Later writes are
   * the user's own edits, which must not move this — it is what the picker's calendar switches
   * convert from, so that switching away and back restores the stored date exactly.
   */
  storedStartDate: KnoraDate | null = null;
  storedEndDate: KnoraDate | null = null;

  private _storedValueCaptured = false;

  /**
   * Set while this component is emitting its own change, so the write that comes back is not
   * mistaken for a stored value.
   *
   * On the add path the user picks a date, `onChange` reports it, and Angular may write that same
   * value straight back through `writeValue`. Treating that as the first stored value made an
   * *added* value behave as an edited one: the stored-value line appeared on a form where nothing
   * is stored yet, which also put an extra element in the DOM and broke an unrelated E2E selector.
   */
  private _emittingOwnChange = false;

  /**
   * what a calendar switch converts the period from — the stored period while editing.
   *
   * Held here rather than in the pickers because a period carries one calendar for the whole
   * value, so the conversion is a property of the pair. Once the user edits either end, that
   * entry becomes the basis, as it does for a single date.
   */
  private _baseIsStored = true;

  /**
   * set while this component is rewriting both ends for a calendar change.
   *
   * The two ends are written one after the other, so mid-conversion the value is momentarily torn:
   * a Gregorian start beside a still-Julian end. Those are genuinely different instants, so the
   * edit detection below would read the conversion as a user edit and rebase onto its own output —
   * after which switching back no longer restored the stored period.
   */
  private _converting = false;

  /** every calendar until a value says otherwise; an empty picker rules nothing out. */
  private _availableCalendars: CalendarSystem[] = [...CALENDAR_SYSTEMS];

  readonly controlType = 'app-date-value-handler';

  calendars = ['GREGORIAN', 'JULIAN', 'ISLAMIC'];

  private _subscriptions: Subscription[] = [];

  @Input()
  get value(): KnoraDate | KnoraPeriod | null {
    if (!this.form.valid) {
      return null;
    }

    if (!this.isPeriodControl.value) {
      return this.startDate.value;
    }

    const start: KnoraDate = this.startDate.value;
    let end: KnoraDate = this.endDate.value;

    // A period carries one calendar: CreateDateValue and UpdateDateValue have a single `calendar`
    // field for the whole value, so the two ends cannot disagree. This used to be enforced by
    // writing through `end.calendar`, which relabelled the end date as a different day and only
    // compiled because the value arrives untyped from a form control — `KnoraDate.calendar` is
    // readonly. Converting produces a new date that still means what it meant.
    if (end && start.calendar !== end.calendar) {
      const converted = this._valueService.convertKnoraDateTo(end, start.calendar.toUpperCase() as CalendarSystem);
      if (converted !== undefined) {
        // The end of a span, not its start: an imprecise end date covers a range in the target
        // calendar, and a period ends at the last day that range includes. Taking the start here
        // would shorten the period — a Julian year end converted to Gregorian would lose the
        // second year the span runs into, and this value is saved, not merely displayed.
        end = converted.end ?? converted.start;
      }
    }

    return new KnoraPeriod(start, end);
  }

  set value(date: KnoraDate | KnoraPeriod | null) {
    if (date instanceof KnoraDate) {
      // single date
      this.calendarControl.setValue(date.calendar);
      this.isPeriodControl.setValue(false);
      this.startDate.setValue(date);
    } else if (date instanceof KnoraPeriod) {
      // period
      this.calendarControl.setValue(date.start.calendar);
      this.isPeriodControl.setValue(true);
      this.startDate.setValue(date.start);
      this.endDate.setValue(date.end);
    } else {
      // null
      this.calendarControl.setValue('GREGORIAN');
      this.isPeriodControl.setValue(false);
      this.startDate.setValue(null);
      this.endDate.setValue(null);
    }

    this.stateChanges.next();
  }

  @Input()
  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    this._disabled ? this.form.disable() : this.form.enable();
    this.stateChanges.next();
  }

  private _disabled = false;

  @Input()
  get placeholder() {
    return this._placeholder;
  }

  set placeholder(plh) {
    this._placeholder = plh;
    this.stateChanges.next();
  }

  private _placeholder!: string;

  @Input()
  get required() {
    return this._required;
  }

  set required(req) {
    this._required = coerceBooleanProperty(req);
    this.stateChanges.next();
  }

  private _required = false;

  @HostBinding('class.floating')
  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  @HostBinding()
  id = `app-date-value-handler-${DateValueHandlerComponent.nextId++}`;

  constructor(
    fb: UntypedFormBuilder,
    @Optional() @Self() public readonly ngControl: NgControl,
    @Optional() public readonly parentForm: NgForm,
    @Optional() public readonly parentFormGroup: FormGroupDirective,
    public readonly defaultErrorStateMatcher: ErrorStateMatcher,
    private readonly _valueService: ValueService,
    private readonly _translate: TranslateService
  ) {
    if (this.ngControl != null) {
      // setting the value accessor directly (instead of using
      // the providers) to avoid running into a circular import.
      this.ngControl.valueAccessor = this;
    }

    this.isPeriodControl = new UntypedFormControl(false); // tODO: if period, check if start is before end
    // Seeded rather than null: the pickers now take their calendar from this control, and a null
    // reaches `_setDays` as `null.toUpperCase()`. The `value` setter overwrites it from the
    // written value, so this is only what an empty handler starts on.
    this.calendarControl = new UntypedFormControl('GREGORIAN');

    this.endDate = new UntypedFormControl(null);
    this.startDate = new UntypedFormControl(null);

    const eraChangesSubscription = this.isPeriodControl.valueChanges.subscribe(isPeriod => {
      this.endDate.clearValidators();

      if (isPeriod && this.valueRequiredValidator) {
        // end date is required in case of a period
        this.endDate.setValidators([Validators.required]);
      }

      this.endDate.updateValueAndValidity();
    });

    this._subscriptions.push(eraChangesSubscription);

    // tODO: find better way to detect changes
    const startValueSubscription = this.startDate.valueChanges.subscribe(() => {
      // form's validity has not been updated yet,
      // trigger update
      this.form.updateValueAndValidity();
      this.handleInput();
    });

    this._subscriptions.push(startValueSubscription);

    // tODO: find better way to detect changes
    const endValueSubscription = this.endDate.valueChanges.subscribe(() => {
      // trigger period check validator set on start date control
      this.startDate.updateValueAndValidity();
      // form's validity has not been updated yet,
      // trigger update
      this.form.updateValueAndValidity();
      this.handleInput();
    });

    this._subscriptions.push(endValueSubscription);

    // init form
    this.form = fb.group({
      isPeriod: this.isPeriodControl,
      calendar: this.calendarControl,
      startDate: this.startDate,
      endDate: this.endDate,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  onChange = (_: any) => {};

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onTouched = () => {};

  get empty() {
    return !this.startDate && !this.endDate;
  }

  ngOnInit(): void {
    if (this.valueRequiredValidator) {
      this.startDate.setValidators([
        Validators.required,
        periodStartEndValidator(this.isPeriodControl, this.endDate, this._valueService),
      ]);
    } else {
      this.startDate.setValidators([periodStartEndValidator(this.isPeriodControl, this.endDate, this._valueService)]);
    }
    this.startDate.updateValueAndValidity();
  }

  ngDoCheck() {
    if (this.ngControl) {
      this.updateErrorState();
    }
  }

  updateErrorState() {
    const oldState = this.errorState;
    const parent = this.parentFormGroup || this.parentForm;
    const matcher = this.defaultErrorStateMatcher;
    const control = this.ngControl ? (this.ngControl.control as UntypedFormControl) : null;
    const newState = matcher.isErrorState(control, parent);

    if (newState !== oldState) {
      this.errorState = newState;
      this.stateChanges.next();
    }
  }

  ngOnDestroy() {
    this.stateChanges.complete();

    this._subscriptions.forEach(subs => {
      if (subs instanceof Subscription && !subs.closed) {
        subs.unsubscribe();
      }
    });
  }

  writeValue(date: KnoraDate | KnoraPeriod | null): void {
    this._captureStoredValue(date);
    this.value = date;
  }

  /**
   * Captures the stored value on the first write that actually carries one.
   *
   * The editor renders this handler through a `formControl` that is empty at first render and
   * filled once the resource loads, so the first `writeValue` is a null and the second is the
   * stored value. Treating the null as "the first write" left `storedStartDate` null for the rest
   * of the component's life: `[storedValue]` reached the pickers as null, no conversion base was
   * ever seeded, and a period switched away and back drifted off its stored value — 1580 came back
   * as 1579.
   */

  /** records the first written value as the stored one, which is what conversions measure from. */
  private _captureStoredValue(date: KnoraDate | KnoraPeriod | null): void {
    if (this._storedValueCaptured) {
      return;
    }

    // A null write is the empty form before the resource arrives, not a value being added: there
    // is nothing to record yet, and recording it would lock in "nothing is stored" forever.
    if (date === null) {
      return;
    }

    // A value arriving because this component just emitted it is the user's own entry, not
    // something that was stored. Only a write originating outside — Angular writing an existing
    // value into the form — records a stored value.
    if (this._emittingOwnChange) {
      return;
    }

    this._storedValueCaptured = true;

    if (date instanceof KnoraDate) {
      this.storedStartDate = date;
    } else if (date instanceof KnoraPeriod) {
      this.storedStartDate = date.start;
      this.storedEndDate = date.end;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  handleInput(): void {
    this._refreshAvailableCalendars();
    this._emittingOwnChange = true;
    try {
      this.onChange(this.value);
    } finally {
      this._emittingOwnChange = false;
    }
  }

  /** the stored value as text, for the lines that state what is stored and what was converted. */
  get storedValueText(): string {
    if (this.storedStartDate === null) {
      return '';
    }
    const start = this._formatDate(this.storedStartDate);
    const calendar = this._calendarName(this.storedStartDate.calendar);
    if (this.storedEndDate === null) {
      return `${start} ${calendar}`;
    }
    return `${start} – ${this._formatDate(this.storedEndDate)} ${calendar}`;
  }

  /**
   * which calendars this value can be expressed in; a period needs both ends representable.
   *
   * Reads a list recomputed on value changes rather than converting during rendering: called from
   * the template it ran against a half-written period mid-conversion and answered differently
   * within one change-detection pass, which Angular reports as NG0100.
   */
  isCalendarAvailable(calendar: string): boolean {
    return this._availableCalendars.includes(calendar.toUpperCase() as CalendarSystem);
  }

  /** recomputes which calendars the current value can be expressed in. */
  private _refreshAvailableCalendars(): void {
    const current = this.value;
    this._availableCalendars = current ? this._valueService.availableCalendarsFor(current) : [...CALENDAR_SYSTEMS];
  }

  /**
   * whether the value is shown in a calendar other than the one it is measured from.
   *
   * A stored flag rather than a getter comparing the live form: read during change detection, such
   * a getter can answer differently within one pass — the calendar control and the two date
   * controls are written separately — which Angular reports as NG0100. Set once per conversion,
   * where the answer is actually decided.
   */
  isConverted = false;

  /**
   * the "converted from" line as plain text, or empty when there is nothing to say.
   *
   * Stored rather than computed from getters in the template: the pickers write their values
   * during change detection, so a condition built from live form state can answer differently
   * within one pass, which Angular reports as NG0100.
   */
  convertedFromText = '';

  /** whether that line should name the stored value as the basis. */
  convertedFromIsStored = false;

  /** whether conversions still measure from the stored value, which "(Stored value)" states. */
  get isBaseTheStoredValue(): boolean {
    return this._baseIsStored && this.storedStartDate !== null;
  }

  /** the period a conversion measures from: the stored one while it is still the basis. */
  get conversionBase(): { start: KnoraDate; end: KnoraDate | null } | null {
    if (this._baseIsStored && this.storedStartDate !== null) {
      return { start: this.storedStartDate, end: this.storedEndDate };
    }
    return null;
  }

  /**
   * rewrites both ends so they describe the same span in the newly selected calendar.
   *
   * The start takes the **first** day of its converted span and the end the **last**, so an
   * imprecise period never shrinks: Julian 1580–1585 covers Gregorian 1580–1586, and taking each
   * span's start would end it in 1585 and silently drop a year of the period.
   *
   * Converts from the stored period while that is still the basis, so switching away and back
   * restores it exactly, as the single picker does.
   */
  onCalendarSelected(calendar: string): void {
    const target = calendar.toUpperCase() as CalendarSystem;
    const base = this.conversionBase;
    const start: KnoraDate | null = base ? base.start : this.startDate.value;
    const end: KnoraDate | null = base ? base.end : this.endDate.value;

    if (!start) {
      return;
    }

    const convertedStart =
      start.calendar.toUpperCase() === target ? start : this._valueService.convertKnoraDateTo(start, target)?.start;

    if (convertedStart === undefined) {
      return;
    }

    let convertedEnd: KnoraDate | null = null;
    if (end) {
      if (end.calendar.toUpperCase() === target) {
        convertedEnd = end;
      } else {
        const converted = this._valueService.convertKnoraDateTo(end, target);
        if (converted === undefined) {
          return;
        }
        // The last day of the end's span, not its first: a period ends where its span ends.
        convertedEnd = converted.end ?? converted.start;
      }
    }

    // Decided before the writes, not after: writing the controls runs change detection, and state
    // that flips afterwards has already been read in that pass — Angular reports the block
    // appearing late as NG0100.
    this.isConverted = base !== null && base.start.calendar.toUpperCase() !== target;
    this.convertedFromIsStored = this._baseIsStored && this.storedStartDate !== null;
    this.convertedFromText = this.isConverted ? this.storedValueText : '';

    this._converting = true;
    try {
      this.startDate.setValue(convertedStart);
      if (convertedEnd) {
        this.endDate.setValue(convertedEnd);
      }
    } finally {
      this._converting = false;
    }
  }

  /**
   * the calendar's name as a reader should see it.
   *
   * This line previously printed the bare `ISLAMIC`/`GREGORIAN` the value carries — untranslated in
   * every language, and silent about which Islamic calendar is meant (DEV-7429).
   */
  private _calendarName(calendar: string): string {
    const key = `ui.calendarMarker.calendars.${calendar.toUpperCase()}`;
    const translated = this._translate.instant(key);
    return translated && translated !== key ? translated : calendar.toUpperCase();
  }

  /** one date as dd.MM.yyyy at whatever precision it carries. */
  private _formatDate(date: KnoraDate): string {
    const pad = (n: number) => `${n}`.padStart(2, '0');
    if (date.day !== undefined && date.month !== undefined) {
      return `${pad(date.day)}.${pad(date.month)}.${date.year}`;
    }
    if (date.month !== undefined) {
      return `${pad(date.month)}.${date.year}`;
    }
    return `${date.year}`;
  }

  /**
   * notices when an end was genuinely edited rather than converted.
   *
   * The picker emits on every write to its value, its own conversions included, so this cannot
   * take the event as evidence of a user edit. Nor can it compare against the stored period
   * directly: a conversion is *supposed* to move the ends — Julian 1580–1585 becomes Gregorian
   * 1580–1586, the end taking the last day of its span so the period does not shrink — so any such
   * comparison reads a correct conversion as an edit.
   *
   * It compares against what converting the stored period into the calendar now selected would
   * produce. Equal means the user is looking at a conversion; different means they changed a date.
   */
  onEndEdited(): void {
    if (this._converting || !this._baseIsStored || this.storedStartDate === null) {
      return;
    }

    const start: KnoraDate | null = this.startDate.value;
    if (start === null) {
      return;
    }

    const target = start.calendar.toUpperCase() as CalendarSystem;
    const expectedStart = this._convertEnd(this.storedStartDate, target, 'start');

    if (expectedStart === null || !this._valueService.knoraDatesDenoteSameInstant(expectedStart, start)) {
      this._baseIsStored = false;
      return;
    }

    const end: KnoraDate | null = this.endDate.value;
    if (this.storedEndDate === null || end === null) {
      return;
    }

    const expectedEnd = this._convertEnd(this.storedEndDate, target, 'end');
    if (expectedEnd === null || !this._valueService.knoraDatesDenoteSameInstant(expectedEnd, end)) {
      this._baseIsStored = false;
    }
  }

  /**
   * one end of the period in another calendar.
   *
   * A start takes the first day of its converted span and an end the last, which is what keeps an
   * imprecise period from shrinking; both callers of this rule have to agree, so it lives here
   * rather than being written out twice.
   */
  private _convertEnd(date: KnoraDate, target: CalendarSystem, which: 'start' | 'end'): KnoraDate | null {
    if (date.calendar.toUpperCase() === target) {
      return date;
    }
    const converted = this._valueService.convertKnoraDateTo(date, target);
    if (converted === undefined) {
      return null;
    }
    return which === 'end' ? (converted.end ?? converted.start) : converted.start;
  }

  togglePeriodControl(ev: Event) {
    ev.preventDefault();
    this.isPeriodControl.setValue(!this.isPeriodControl.value);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  onContainerClick(_event: MouseEvent): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  setDescribedByIds(_ids: string[]): void {}

  /* eslint-enable @typescript-eslint/no-unused-vars */
  handlePickerClose() {
    this.pickerClosed = true;
  }
}
