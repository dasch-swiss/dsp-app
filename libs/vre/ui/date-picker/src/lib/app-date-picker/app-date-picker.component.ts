import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';

import {
  Component,
  DoCheck,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  Optional,
  Output,
  Self,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormGroupDirective,
  FormsModule,
  NgControl,
  NgForm,
  ReactiveFormsModule,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ErrorStateMatcher, MatOptionModule } from '@angular/material/core';
import { MatFormFieldControl, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { KnoraDate } from '@dasch-swiss/dsp-js';
import { CalendarSystem, getCalendar } from '@dasch-swiss/vre/shared/calendar';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { ValueService } from '../date-value-handler/value.service';

/** error when invalid control is dirty, touched, or submitted. */
export class DatePickerErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: UntypedFormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

interface FormErrors {
  [key: string]: string;
}

interface ValidationMessages {
  [key: string]: {
    [key: string]: string;
  };
}

@Component({
  selector: 'app-date-picker',
  templateUrl: './app-date-picker.component.html',
  styleUrls: ['./app-date-picker.component.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatOptionModule,
    MatMenuModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatSelectModule,
    TranslatePipe,
  ],
})
export class AppDatePickerComponent
  implements ControlValueAccessor, MatFormFieldControl<KnoraDate>, OnChanges, DoCheck, OnDestroy
{
  static nextId = 0;

  // Required for MatFormFieldControl interface
  stateChanges = new Subject<void>();
  errorState = false;

  @ViewChild(MatMenuTrigger) popover!: MatMenuTrigger;
  @Output() datePickerClosed: EventEmitter<void> = new EventEmitter();
  @Output() emitDateChanged: EventEmitter<string> = new EventEmitter();
  @Input() errorStateMatcher!: ErrorStateMatcher;

  // disable calendar selector in case of end date in a period date value
  @Input() disableCalendarSelector!: boolean;

  // set predefinde calendar
  @Input() calendar = 'GREGORIAN';

  /**
   * the value as it is stored, when editing an existing one; absent when adding a new one.
   *
   * This is what a calendar switch converts from while editing, so switching away and back
   * restores the stored date exactly rather than the round trip's drift: Julian 1582 converts to
   * Gregorian 1582/1583, and converting that back lands on 1581. Measuring every switch from the
   * stored value instead means the user can explore calendars without silently editing the value.
   *
   * A new value has nothing to measure from, so it converts from the current entry and the drift
   * is real — the user is choosing the date, not reading one.
   */
  @Input() storedValue: KnoraDate | null = null;

  @HostBinding()
  id = `app-date-picker-${AppDatePickerComponent.nextId++}`;

  @HostBinding('attr.aria-describedby') describedBy = '';
  dateForm: UntypedFormGroup;
  focused = false;
  controlType = 'app-date-picker';
  matcher = new DatePickerErrorStateMatcher();

  // own date picker variables
  date!: KnoraDate;
  form!: UntypedFormGroup;

  formErrors: FormErrors = {
    year: '',
  };

  validationMessages: ValidationMessages = {
    year: {
      required: 'At least the year has to be set.',
      min: 'A valid year is greater than 0.',
    },
  };

  // list of months
  months = [
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

  weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  weeks: number[][] = [];
  days: number[] = [];
  day: number | undefined;
  month!: number;
  year!: number;

  disableDaySelector!: boolean;

  calendars = ['GREGORIAN', 'JULIAN', 'ISLAMIC'];

  era = 'CE';
  // ------

  /**
   * what the next calendar switch converts from.
   *
   * Deliberately a plain field rather than form state: `buildForm()` replaces the form on every
   * write to `value` — including this component's own re-entry through `setDate()` — and the
   * `value` setter reassigns `this.calendar` from the incoming date each time. A base held in the
   * form, or recomputed from `this.calendar`, would be reset by the component's own conversion and
   * every switch would measure from the last conversion again, which is the drift this exists to
   * avoid.
   *
   * Starts as the stored value while editing, becomes the user's entry once they edit a date
   * field, and is null while adding, where each switch converts from the current entry.
   */
  private _conversionBase: KnoraDate | null = null;

  private _required = false;
  private _disabled = false;
  private _placeholder!: string;

  @HostBinding('class.floating')
  get shouldLabelFloat() {
    return this.focused || !this.empty;
  }

  @Input()
  get required() {
    return this._required;
  }

  set required(req) {
    this._required = coerceBooleanProperty(req);
    this.stateChanges.next();
  }

  @Input()
  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this._disabled ? this.dateForm.disable() : this.dateForm.enable();
    this.stateChanges.next();
  }

  @Input()
  get placeholder() {
    return this._placeholder;
  }

  set placeholder(plh) {
    this._placeholder = plh;
    this.stateChanges.next();
  }

  @Input()
  get value(): KnoraDate | null {
    const dateValue = this.dateForm.value;
    if (dateValue !== null) {
      return dateValue.knoraDate;
    }
    return null;
  }

  set value(dateValue: KnoraDate | null) {
    if (dateValue !== null && dateValue instanceof KnoraDate) {
      this.dateForm.setValue({
        date: this.transform(dateValue, 'dd.MM.YYYY', 'era'),
        knoraDate: dateValue,
      });
      this.calendar = dateValue.calendar;
      this.era = this.calendar === 'ISLAMIC' ? 'noEra' : dateValue.era === 'noEra' ? 'CE' : dateValue.era;

      this.day = dateValue.day;
      this.month = dateValue.month ? dateValue.month : 0;
      this.year = dateValue.year;
      this.emitDateChanged.emit(this.transform(dateValue, 'YYYY-MM-dd', 'gravsearch'));
    } else {
      this.dateForm.setValue({ date: null, knoraDate: null });
    }

    this.stateChanges.next();
    this.buildForm();

    // `buildForm` runs `_setDays`, which clears a day the month cannot hold. When it did, the date
    // written above is impossible and the form still holds it — `value` reads back from the form,
    // not from these fields — so it is rewritten here at the precision that survived. Without this
    // an impossible date written straight in is kept and saved, no edit required.
    if (dateValue instanceof KnoraDate && dateValue.day !== undefined && this.day === undefined) {
      this.setDate(undefined);
    }
  }

  get empty() {
    const dateInput = this.dateForm.value;
    return !dateInput.knoraDate;
  }

  setDescribedByIds(ids: string[]) {
    this.describedBy = ids.join(' ');
  }

  // eslint-disable-next-line @typescript-eslint/member-ordering
  constructor(
    public readonly defaultErrorStateMatcher: ErrorStateMatcher,
    @Optional() public readonly parentForm: NgForm,
    @Optional() public readonly parentFormGroup: FormGroupDirective,
    @Optional() @Self() public readonly ngControl: NgControl,
    fb: UntypedFormBuilder,
    private readonly _elRef: ElementRef<HTMLElement>,
    private readonly _fm: FocusMonitor,
    private readonly _valueService: ValueService,
    private readonly _translate: TranslateService
  ) {
    this.dateForm = fb.group({
      date: [null, Validators.required],
      knoraDate: [null, Validators.required],
    });

    _fm.monitor(_elRef.nativeElement, true).subscribe(origin => {
      this.focused = !!origin;
      this.stateChanges.next();
    });

    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }

    // will be replaced by calendar and era
    this.placeholder = 'Click to select a date';

    this.buildForm();

    this.dateForm.valueChanges.subscribe(() => this.handleInput());
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-empty-function
  onChange = (_: any) => {};

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onTouched = () => {};

  ngOnChanges(changes: SimpleChanges) {
    // The owner changed the calendar this picker displays — see `_applyOwnerCalendar`.
    if (changes['calendar'] && this.disableCalendarSelector) {
      this._applyOwnerCalendar();
    }

    // A stored value arriving means this picker is editing rather than adding, so conversions
    // start measuring from it. Seeded here rather than in the `value` setter because that setter
    // also runs on the component's own conversions, which must not move the base.
    if (changes['storedValue']) {
      this._conversionBase = this.storedValue;
    }
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
    const control = this.ngControl ? this.ngControl.control : null;
    const newState = matcher.isErrorState(control, parent);

    if (newState !== oldState) {
      this.errorState = newState;
      this.stateChanges.next();
    }
  }

  ngOnDestroy() {
    this.stateChanges.complete();
  }

  onContainerClick(event: MouseEvent) {
    if ((event.target as Element).tagName.toLowerCase() !== 'input') {
      this._elRef.nativeElement.querySelector('input')?.focus();
    }
  }

  writeValue(dateValue: KnoraDate | null): void {
    this.value = dateValue;
  }

  transform(
    date: KnoraDate,
    format?: string,
    displayOptions?: 'era' | 'calendar' | 'calendarOnly' | 'gravsearch' | 'all'
  ): string {
    if (!(date instanceof KnoraDate)) {
      // console.error('Non-KnoraDate provided. Expected a valid KnoraDate');
      return '';
    }

    const formattedString = this.getFormattedString(date, format);

    if (displayOptions) {
      return this.addDisplayOptions(date, formattedString, displayOptions);
    } else {
      return formattedString;
    }
  }

  getFormattedString(date: KnoraDate, format: string | undefined): string {
    switch (format) {
      case 'dd.MM.YYYY':
        if (date.precision === 2) {
          return `${this.leftPadding(date.day)}.${this.leftPadding(date.month)}.${date.year}`;
        } else if (date.precision === 1) {
          return `${this.leftPadding(date.month)}.${date.year}`;
        } else {
          return `${date.year}`;
        }
      case 'dd-MM-YYYY':
        if (date.precision === 2) {
          return `${this.leftPadding(date.day)}-${this.leftPadding(date.month)}-${date.year}`;
        } else if (date.precision === 1) {
          return `${this.leftPadding(date.month)}-${date.year}`;
        } else {
          return `${date.year}`;
        }
      case 'MM/dd/YYYY':
        if (date.precision === 2) {
          return `${this.leftPadding(date.month)}/${this.leftPadding(date.day)}/${date.year}`;
        } else if (date.precision === 1) {
          return `${this.leftPadding(date.month)}/${date.year}`;
        } else {
          return `${date.year}`;
        }
      case 'YYYY-MM-dd':
        if (date.precision === 2) {
          return `${date.year}-${this.leftPadding(date.month)}-${this.leftPadding(date.day)}`;
        } else if (date.precision === 1) {
          return `${date.year}-${this.leftPadding(date.month)}`;
        } else {
          return `${date.year}`;
        }
      default:
        if (date.precision === 2) {
          return `${this.leftPadding(date.day)}.${this.leftPadding(date.month)}.${date.year}`;
        } else if (date.precision === 1) {
          return `${this.leftPadding(date.month)}.${date.year}`;
        } else {
          return `${date.year}`;
        }
    }
  }

  leftPadding(value: number | undefined): string {
    if (value !== undefined) {
      return `0${value}`.slice(-2);
    } else {
      return '';
    }
  }

  addDisplayOptions(date: KnoraDate, value: string, options: string): string {
    let era: string;

    switch (options) {
      case 'era':
        // displays date with era; era only in case of BCE
        return value + (date.era === 'noEra' ? '' : date.era === 'BCE' || date.era === 'AD' ? ` ${date.era}` : '');
      case 'calendar':
        // displays date without era but with calendar type
        return `${value} ${this.calendarName(date.calendar)}`;
      case 'calendarOnly':
        // displays only the selected calendar type without any data
        return this.calendarName(date.calendar);
      case 'gravsearch':
        // GREGORIAN:2023-8-2
        // CE is default era so no need to add it
        era = date.era === 'BCE' ? ' BCE' : '';
        return `${date.calendar}:${value}${era}`;
      case 'all':
        // displays date with era (only as BCE) and selected calendar type
        return `${value + (date.era === 'noEra' ? '' : date.era === 'BCE' ? ` ${date.era}` : '')} ${this.calendarName(
          date.calendar
        )}`;
      default:
        return '';
    }
  }

  /**
   * the calendar's name as a reader should see it.
   *
   * Translated rather than title-cased: the name was previously English in every language, and the
   * Islamic entry now also states which Islamic calendar this is — there are several, and they
   * disagree by a day or two, so a bare "Islamic" claims more than the app can back (DEV-7429).
   *
   * The `gravsearch` branch of {@link addDisplayOptions} deliberately does not use this: it emits a
   * literal dsp-api parses, so its calendar name must stay bare.
   */
  calendarName(calendar: string): string {
    const key = `ui.calendarMarker.calendars.${calendar.toUpperCase()}`;
    const translated = this._translate.instant(key);
    return translated && translated !== key ? translated : this.titleCase(calendar);
  }

  /**
   * returns a string in Title Case format
   * It's needed to transform a calendar name e.g. 'GREGORIAN' into 'Gregorian'
   *
   * @param str
   * @returns string
   */
  titleCase(str: string): string {
    return str
      .split(' ')
      .map(w => w[0].toUpperCase() + w.substring(1).toLowerCase())
      .join(' ');
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  handleInput() {
    this.onChange(this.value);
  }

  buildForm() {
    this.form = new UntypedFormGroup({
      calendar: new UntypedFormControl(),
      era: new UntypedFormControl(''),
      year: new UntypedFormControl('', [Validators.required, Validators.min(1)]),
      month: new UntypedFormControl(''),
    });

    this.disableDaySelector = this.month === 0;

    if (this.value) {
      this._updateForm();
    } else if (!this.disableCalendarSelector) {
      this.setToday();
    }

    this.form.valueChanges.subscribe(data => this.onValueChanged(data));
  }

  /**
   * whether the entered date can be expressed in a calendar.
   *
   * An unrepresentable calendar is disabled rather than offered and then refused, so the picker
   * never has to show an error for a choice it allowed. With nothing entered yet every calendar is
   * open, since there is no date to fail on.
   */
  isCalendarAvailable(calendar: string): boolean {
    const current = this.value;
    if (!current) {
      return true;
    }
    return this._valueService.availableCalendarsFor(current).includes(calendar.toUpperCase() as CalendarSystem);
  }

  /**
   * rewrites the form's fields so they describe the same day in the newly selected calendar.
   *
   * Detects the switch by comparing the form's calendar against the entered date's own, rather
   * than by subscribing to the control: `buildForm()` replaces the form on every value change, so
   * a subscription would be discarded and its first emission arrives before a date exists.
   *
   * Precision and era come back from the conversion, so a year-only date stays year-only and a BCE
   * date stays BCE. Where the target calendar cannot represent the date the switch is abandoned
   * and the previous calendar restored — the selector only offers representable calendars, so that
   * is a guard rather than a path a user can reach.
   *
   * @returns true when it converted, meaning the caller should stand down for this pass; the
   * conversion re-enters through `setDate`.
   */
  private _convertToSelectedCalendar(): boolean {
    const target = this.form.controls['calendar'].value?.toUpperCase() as CalendarSystem;
    // `this.value` rather than `this.date`: the latter is only assigned by `setDate`, so it is
    // still undefined on the first switch after a value is written in from outside.
    const current = this.value;

    if (!target || !current || current.calendar.toUpperCase() === target) {
      return false;
    }

    // Convert from the base, not from what is on screen. While editing an existing value the base
    // is the stored date, so switching Julian → Gregorian → Julian restores it exactly; converting
    // the displayed date each time would land on 1581 for a stored 1582.
    const source = this._conversionBase ?? current;

    // Returning to the base's own calendar is a return, not a conversion: take the base verbatim
    // so an imprecise date comes back at its stored precision rather than at a span's start.
    if (source.calendar.toUpperCase() === target) {
      this._applyDate(source);
      return true;
    }

    const converted = this._valueService.convertKnoraDateTo(source, target);
    if (converted === undefined) {
      this.form.controls['calendar'].setValue(current.calendar, { emitEvent: false });
      return true;
    }

    // A converted year or month can span two of the target calendar's; the picker holds a single
    // date, so it takes the start of that span. Rendering the span is the viewer's concern.
    this._applyDate(converted.start);
    return true;
  }

  /**
   * converts this picker's date into the calendar its owner selected.
   *
   * A period carries one calendar for the whole value, so the handler renders a single control and
   * pushes the result down through `[calendar]`. Both ends have their own selector suppressed, so
   * this is the *only* path that converts them — nothing else is running to correct it afterwards.
   *
   * Converts from the base directly rather than writing the target into the form and letting
   * `_convertToSelectedCalendar` pick it up. That indirection is what produced the reported bug:
   * `_convertToSelectedCalendar` reads its target from `this.form`, and the `value` setter calls
   * `buildForm()`, which replaces that form — so the control written a moment earlier was gone and
   * the conversion ran against the previous calendar. The display then lagged the label by one
   * switch: choosing Julian left 01.04.2020 on screen, and choosing Gregorian again showed
   * 19.03.2020, the Julian date under a Gregorian label.
   *
   * The picker's own selector, where it is shown, still goes through `_convertToSelectedCalendar`:
   * there the form *is* the source of the user's choice.
   */
  private _applyOwnerCalendar(): void {
    const target = this.calendar?.toUpperCase() as CalendarSystem | undefined;
    const current = this.value;

    if (!target || !current || current.calendar.toUpperCase() === target) {
      // Nothing to convert — but the form still has to show the calendar the owner named.
      this._updateForm();
      return;
    }

    const source = this._conversionBase ?? current;

    // Returning to the base's own calendar is a return, not a conversion: take it verbatim so an
    // imprecise date comes back at its stored precision rather than at a span's start.
    if (source.calendar.toUpperCase() === target) {
      this._applyDate(source);
      return;
    }

    const converted = this._valueService.convertKnoraDateTo(source, target);
    if (converted === undefined) {
      this._updateForm();
      return;
    }

    this._applyDate(converted.start);
  }

  /** writes one date into the picker's fields and its form, without re-triggering a conversion. */
  private _applyDate(date: KnoraDate): void {
    this.calendar = date.calendar.toUpperCase();
    this.era = date.era;
    this.year = date.year;
    this.month = date.month ?? 0;
    this.day = date.day;

    this.form.patchValue(
      { calendar: this.calendar, era: date.era, year: date.year, month: date.month ?? '' },
      { emitEvent: false }
    );

    this.setDate(date.day);
  }

  /**
   * this method is for the form error handling
   *
   * @param data Data which changed.
   */
  onValueChanged(data?: any) {
    if (!this.form) {
      return;
    }

    // A calendar change is the one edit that must not be read off the form as typed. Everything
    // below rebuilds the date from whatever year/month/day sit in the controls, which for a
    // calendar change means relabelling 15.06.2024 Gregorian as 15.06.2024 Julian — a different
    // day, saved without a word. Converting first puts the right numbers in the controls.
    if (this._convertToSelectedCalendar()) {
      return;
    }

    this.calendar = this.form.controls['calendar'].value;

    this.era =
      this.calendar === 'ISLAMIC' ? 'noEra' : this.form.controls['era'].value ? this.form.controls['era'].value : 'CE';
    // islamic calendar doesn't have a "before common era"
    // in case of switching calendar from islamic to gregorian or julian set default era value to CE
    if (this.calendar !== 'ISLAMIC' && this.era === 'noEra') {
      this.form.controls['era'].setValue('CE');
    }

    if (data.year > 0) {
      if (data.month) {
        // give possibility to select day;
        this.disableDaySelector = false;
        // set the corresponding days
        this._setDays(this.calendar, this.era, data.year, data.month);
      } else {
        // set precision to year only; disable the day selector
        this.disableDaySelector = true;
        this.day = undefined;
      }
    } else {
      // not valid form; disable the day selector
      this.disableDaySelector = true;
      this.day = undefined;
    }

    const form = this.form;

    Object.keys(this.formErrors).forEach((field: string) => {
      this.formErrors[field] = '';
      const control = form.get(field);
      if (control && control.dirty && !control.valid && control.errors !== null) {
        const messages = this.validationMessages[field];
        Object.keys(control.errors).forEach((key: string) => {
          this.formErrors[field] += `${messages[key]} `;
        });
      }
    });

    this.setDate(this.day);

    // After `setDate`, not before: `this.value` is read off the form's committed date, so calling
    // this any earlier compares the base against the pre-edit value, finds them equal, and never
    // rebases. Reaching here at all means this pass was a real edit to year, month, era or day
    // rather than a calendar switch, which returned above.
    this._rebaseOnUserEdit();
  }

  setDate(day?: number) {
    // set date on year, on year and month or on year, month and day precision
    if (this.form.controls['year'].value > 0 && this.form.valid) {
      this.day = day;
      this.date = new KnoraDate(
        this.calendar.toUpperCase(),
        this.era,
        this.form.controls['year'].value,
        this.form.controls['month'].value ? this.form.controls['month'].value : undefined,
        day || undefined
      );

      this.value = this.date;
    }
  }

  /**
   * moves the conversion base onto the user's own entry.
   *
   * Only meaningful while editing an existing value: adding has no base, and each switch already
   * converts from the current entry. Once the entry differs from the stored value, "(Stored value)"
   * stops being true of what conversions measure from, which is what {@link isBaseTheStoredValue}
   * reports.
   */
  private _rebaseOnUserEdit(): void {
    const current = this.value;
    if (current === null || this.storedValue === null) {
      return;
    }
    if (
      this._conversionBase !== null &&
      this._valueService.knoraDatesDenoteSameInstant(this._conversionBase, current)
    ) {
      return;
    }
    this._conversionBase = current;
  }

  /** whether conversions still measure from the stored value, which the "(Stored value)" suffix states. */
  isBaseTheStoredValue(): boolean {
    return this.storedValue !== null && this._conversionBase === this.storedValue;
  }

  /**
   * whether the entry still denotes the same day as the stored value.
   *
   * Compares instants rather than fields, so a calendar switch alone reads as unchanged: that is
   * the same comparison the save gate uses, and the status line has to agree with it or the picker
   * would promise a save the gate then refuses (REQ-3.9).
   */
  isUnchangedFromStored(): boolean {
    const current = this.value;
    if (this.storedValue === null || current === null) {
      return false;
    }
    return this._valueService.knoraDatesDenoteSameInstant(this.storedValue, current);
  }

  /** the date a conversion measures from, for the "Converted from ..." line. */
  get conversionBase(): KnoraDate | null {
    return this._conversionBase;
  }

  /** whether the entry is shown in a calendar other than the one it is measured from. */
  isConverted(): boolean {
    const current = this.value;
    return (
      current !== null &&
      this._conversionBase !== null &&
      current.calendar.toUpperCase() !== this._conversionBase.calendar.toUpperCase()
    );
  }

  /**
   * enters today's date, expressed in the calendar currently selected.
   *
   * Today is a Gregorian fact — that is what the system clock reports — and every other calendar
   * is reached by the same conversion the rest of the picker uses.
   *
   * This replaced a per-calendar implementation: Julian from a hand-written `0.75` century offset,
   * which agreed, and Islamic from `Intl.DateTimeFormat('en-TN-u-ca-islamic')`, which did not.
   * That locale resolves to ICU's observation-based `islamic`, while this app, dsp-api and this
   * picker's own day grid all use the tabular *civil* calendar. So "Today" was the only code in
   * either layer on a different calendar, and on roughly 0.9% of days it produced a date with no
   * place in the grid the user clicks — 30.08.1422, say, in a month rendered with 29 days, which
   * reads back as 01.09.1422.
   *
   * There is no single correct Islamic calendar, so this is not a claim that one scheme beats
   * another: it removes a disagreement inside one component. See
   * `06-islamic-calendar-consistency.md` in dasch-specs, and the anchors in
   * `islamic.calendar.spec.ts` that pin the client to dsp-api's stored values.
   */
  setToday() {
    const now = new Date();
    const today = new KnoraDate('GREGORIAN', 'CE', now.getFullYear(), now.getMonth() + 1, now.getDate());

    const target = this.calendar.toUpperCase() as CalendarSystem;
    const converted = target === 'GREGORIAN' ? today : this._valueService.convertKnoraDateTo(today, target)?.start;

    // Every calendar can express today, so this is a guard rather than a reachable path; leaving
    // the entry untouched is the honest response to a conversion that did not happen.
    if (converted === undefined) {
      return;
    }

    this.era = converted.era;
    this.day = converted.day;
    this.month = converted.month ?? 0;
    this.year = converted.year;
    this._updateForm();
  }

  closeDatePicker() {
    if (this.popover) {
      this.popover.closeMenu();
    }
  }

  private _updateForm() {
    this.form.setValue({
      calendar: this.calendar,
      era: this.era,
      year: this.year,
      month: this.month,
    });
    if (this.disableCalendarSelector) {
      this.form.controls['calendar'].disable();
    } else {
      this.form.controls['calendar'].enable();
    }
    if (this.month) {
      this._setDays(this.calendar, this.era, this.year, this.month);
    }
  }

  /**
   * given a historical date (year), returns the astronomical year.
   *
   * @param year year of the given date.
   * @param era era of the given date.
   */
  convertHistoricalYearToAstronomicalYear(year: number, era: string) {
    let yearAstro = year;
    if (era === 'BCE') {
      // convert historical date to astronomical date
      yearAstro = yearAstro * -1 + 1;
    }
    return yearAstro;
  }

  /**
   * calculates the number of days in a month for a given year.
   *
   * @param calendar the date's calendar.
   * @param year the date's year.
   * @param month the date's month.
   */
  calculateDaysInMonth(calendar: string, year: number, month: number): number {
    const calendarSystem = calendar.toUpperCase() as 'GREGORIAN' | 'JULIAN' | 'ISLAMIC';
    const cal = getCalendar(calendarSystem);
    return cal.daysInMonth(year, month);
  }

  /**
   * sets available days for a given year and month.
   *
   * @param calendar calendar of the given date.
   * @param era era of the given date.
   * @param year year of the given date.
   * @param month month of the given date.
   */
  private _setDays(calendar: string, era: string, year: number, month: number) {
    const yearAstro = this.convertHistoricalYearToAstronomicalYear(year, era);

    // count the days of the month
    let days = this.calculateDaysInMonth(calendar.toUpperCase(), yearAstro, month);

    // Drop a selected day the month cannot hold, rather than moving it to the last day that fits.
    //
    // Four things reach this method — a month change, a year change, an era switch and the initial
    // write — and each can leave a day stranded: 31 January becomes 31 February, 29 February in a
    // leap year becomes 29 February in a common one, and leapness flips across the CE/BCE boundary
    // because the astronomical year is `year * -1 + 1`. A date can also arrive impossible without
    // any edit at all. Before this, the grid rendered empty while the value kept the stranded day
    // and was saved: dsp-api accepts such a date and silently shifts it into the next month
    // (DEV-7428), so nothing anywhere reported it.
    //
    // Clearing rather than clamping, because 31 January is not evidence that the user meant 28
    // February. The value degrades to month precision, which is true, and the save gate compares
    // instants so the loss of precision registers as a real change rather than a silent one.
    if (this.day !== undefined && this.day > days) {
      this.day = undefined;
    }

    // calculate the week day and the position of the first day of the month
    // if date is before October 4th 1582, we should use the julian date converter for week day
    let firstDayOfMonth: number;

    const h = month <= 2 ? month + 12 : month;
    const k = month <= 2 ? year - 1 : year;

    // calculate weekday of the first the of the month;
    // found solution and formular here:
    // https://straub.as/java/basic/kalender.html
    if (year < 1582 || (year === 1582 && month <= 10) || calendar === 'JULIAN') {
      // get the day of the week by using the julian date converter independet from selected calendar
      firstDayOfMonth = (1 + 2 * h + Math.floor((3 * h + 3) / 5) + k + Math.floor(k / 4) - 1) % 7;
    } else {
      // firstDayOfMonth = new Date(year, month - 1, 1).getDay();
      firstDayOfMonth =
        (1 +
          2 * h +
          Math.floor((3 * h + 3) / 5) +
          k +
          Math.floor(k / 4) -
          Math.floor(k / 100) +
          Math.floor(k / 400) +
          1) %
        7;
    }

    // empty array of the days
    this.days = [];

    // if first day of the month is sunday (0)
    // move it to the end of the week (7)
    // because the first column is prepared for Monday
    if (firstDayOfMonth === 0) {
      firstDayOfMonth = 7;
    }

    // if era is not before common era, we support
    // week days. The following loop helps to set
    // position of the first day of the month
    if (era === 'CE') {
      for (let i = 1; i < firstDayOfMonth; i++) {
        this.days.push(0);
      }
    }

    // prepare list of the days
    for (let i = 1; i <= days; i++) {
      // special case for October 1582, which had only 21 days instead of 31
      // because of the change from julian to gregorian calendar
      if (calendar === 'GREGORIAN' && year === 1582 && month === 10 && i === 5 && era === 'CE') {
        i = 15;
        days = 31;
      }
      this.days.push(i);
    }

    // split the list of the days in to
    // list of days per week corresponding to the week day
    const dates = this.days;
    const weeks = [];
    while (dates.length > 0) {
      weeks.push(dates.splice(0, 7));
    }
    this.weeks = weeks;
  }
}
