/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { CommonModule } from '@angular/common';
import { Component, DoCheck, HostBinding, Input, OnDestroy, OnInit, Optional, Self } from '@angular/core';
import {
  ReactiveFormsModule,
  AbstractControl,
  ControlValueAccessor,
  FormGroupDirective,
  NgControl,
  NgForm,
  UntypedFormBuilder,
  UntypedFormControl,
  UntypedFormGroup,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldControl, MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { KnoraDate, KnoraPeriod } from '@dasch-swiss/dsp-js';
import { JDNConvertibleCalendar } from '@dasch-swiss/jdnconvertiblecalendar';
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
      const jdnStartDate = valueService.createJDNCalendarDateFromKnoraDate(control.value);
      const jdnEndDate = valueService.createJDNCalendarDateFromKnoraDate(endDate.value);

      const invalid = jdnStartDate.toJDNPeriod().periodEnd >= jdnEndDate.toJDNPeriod().periodStart;

      return invalid ? { periodStartEnd: { value: control.value } } : null;
    }

    return null;
  };
}

@Component({
  selector: 'app-date-value-handler',
  imports: [
    AppDatePickerComponent,
    CommonModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatTooltipModule,
    ReactiveFormsModule,
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
  standalone: true,
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

  readonly controlType = 'app-date-value-handler';

  calendars = JDNConvertibleCalendar.supportedCalendars.map(cal => cal.toUpperCase());

  private _subscriptions: Subscription[] = [];

  @Input()
  get value(): KnoraDate | KnoraPeriod | null {
    if (!this.form.valid) {
      return null;
    }

    if (!this.isPeriodControl.value) {
      return this.startDate.value;
    } else {
      if (this.endDate.value && this.startDate.value.calendar !== this.endDate.value.calendar) {
        this.endDate.value.calendar = this.startDate.value.calendar;
      }

      return new KnoraPeriod(this.startDate.value, this.endDate.value);
    }
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
    @Optional() @Self() public ngControl: NgControl,
    @Optional() public _parentForm: NgForm,
    @Optional() public _parentFormGroup: FormGroupDirective,
    public _defaultErrorStateMatcher: ErrorStateMatcher,
    private _valueService: ValueService
  ) {
    if (this.ngControl != null) {
      // setting the value accessor directly (instead of using
      // the providers) to avoid running into a circular import.
      this.ngControl.valueAccessor = this;
    }

    this.isPeriodControl = new UntypedFormControl(false); // tODO: if period, check if start is before end
    this.calendarControl = new UntypedFormControl(null);

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
    const parent = this._parentFormGroup || this._parentForm;
    const matcher = this._defaultErrorStateMatcher;
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
    this.value = date;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  handleInput(): void {
    this.onChange(this.value);
  }

  togglePeriodControl(ev: Event) {
    ev.preventDefault();
    this.isPeriodControl.setValue(!this.isPeriodControl.value);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  onContainerClick(event: MouseEvent): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function,@typescript-eslint/no-unused-vars
  setDescribedByIds(ids: string[]): void {}

  /* eslint-enable @typescript-eslint/no-unused-vars */
  handlePickerClose() {
    this.pickerClosed = true;
  }
}
