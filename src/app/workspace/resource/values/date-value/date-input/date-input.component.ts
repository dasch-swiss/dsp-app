/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/member-ordering */
import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { Component, DoCheck, ElementRef, HostBinding, Input, OnDestroy, OnInit, Optional, Self } from '@angular/core';
import {
    AbstractControl,
    ControlValueAccessor,
    FormBuilder,
    FormControl,
    FormGroup,
    FormGroupDirective,
    NgControl,
    NgForm,
    ValidatorFn,
    Validators
} from '@angular/forms';
import { CanUpdateErrorState, CanUpdateErrorStateCtor, ErrorStateMatcher, mixinErrorState } from '@angular/material/core';
import { MatFormFieldControl } from '@angular/material/form-field';
import { KnoraDate, KnoraPeriod } from '@dasch-swiss/dsp-js';
import {
    CalendarDate,
    CalendarPeriod,
    GregorianCalendarDate,
    JDNConvertibleCalendar,
    JulianCalendarDate
} from 'jdnconvertiblecalendar';
import { Subject } from 'rxjs';
import { CalendarHeaderComponent } from '../calendar-header/calendar-header.component';

/** error when invalid control is dirty, touched, or submitted. */
export class DateInputErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
        const isSubmitted = form && form.submitted;
        return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
    }
}

/** if a period is defined, start and end date must have the same calendar */
export function sameCalendarValidator(isPeriod: FormControl, endDate: FormControl): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {

        if (isPeriod.value) {

            let invalid = true;
            if (control.value instanceof JDNConvertibleCalendar && endDate.value instanceof JDNConvertibleCalendar) {
                invalid = control.value.calendarName !== endDate.value.calendarName;
            }

            return invalid ? { 'sameCalendarRequired': { value: control.value } } : null;
        }

        return null;
    };
}

/** if a period is defined, start date must be before end date */
export function periodStartEndValidator(isPeriod: FormControl, endDate: FormControl): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {

        if (isPeriod.value) {
            let invalid = true;

            if (control.value instanceof JDNConvertibleCalendar && endDate.value instanceof JDNConvertibleCalendar) {

                // check if start is before end
                const startAsJdnPeriod = (control.value as JDNConvertibleCalendar).toJDNPeriod();
                const endAsJdnPeriod = (endDate.value as JDNConvertibleCalendar).toJDNPeriod();

                // check for start after end
                invalid = startAsJdnPeriod.periodStart >= endAsJdnPeriod.periodStart;
            }

            return invalid ? { 'periodStartEnd': { value: control.value } } : null;
        }

        return null;
    };
}

class MatInputBase {
    constructor(public _defaultErrorStateMatcher: ErrorStateMatcher,
        public _parentForm: NgForm,
        public _parentFormGroup: FormGroupDirective,
        public ngControl: NgControl) {
    }
}

const _MatInputMixinBase: CanUpdateErrorStateCtor & typeof MatInputBase =
    mixinErrorState(MatInputBase);

@Component({
    selector: 'app-date-input',
    templateUrl: './date-input.component.html',
    styleUrls: ['./date-input.component.scss'],
    providers: [{ provide: MatFormFieldControl, useExisting: DateInputComponent }]
})
export class DateInputComponent extends _MatInputMixinBase implements ControlValueAccessor, MatFormFieldControl<KnoraDate | KnoraPeriod>, DoCheck, CanUpdateErrorState, OnDestroy, OnInit {

    static nextId = 0;

    @HostBinding() id = `app-date-input-${DateInputComponent.nextId++}`;
    @Input() valueRequiredValidator = true;

    form: FormGroup;
    stateChanges = new Subject<void>();
    focused = false;
    errorState = false;
    controlType = 'app-date-input';
    matcher = new DateInputErrorStateMatcher();

    calendarHeaderComponent = CalendarHeaderComponent;
    startDateControl: FormControl;
    endDateControl: FormControl;
    isPeriodControl: FormControl;

    onChange = (_: any) => {
    };
    onTouched = () => {
    };

    get empty() {
        const userInput = this.form.value;
        return !userInput.start && !userInput.end;
    }

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

    private _required = false;

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

    private _placeholder: string;

    @HostBinding('attr.aria-describedby') describedBy = '';

    setDescribedByIds(ids: string[]) {
        this.describedBy = ids.join(' ');
    }

    @Input()
    get value(): KnoraDate | KnoraPeriod | null {

        if (!this.form.valid) {
            return null;
        }

        const userInput = this.form.value;

        if (!this.isPeriodControl.value) {
            // single date
            if (userInput.dateStart !== null) {
                return new KnoraDate(
                    userInput.dateStart.calendarName.toUpperCase(), 'CE', userInput.dateStart.calendarStart.year, userInput.dateStart.calendarStart.month, userInput.dateStart.calendarStart.day);
            } else {
                return null;
            }
        } else {
            // period
            if (userInput.dateStart !== null && userInput.dateEnd !== null) {

                const start = new KnoraDate(
                    userInput.dateStart.calendarName.toUpperCase(), 'CE', userInput.dateStart.calendarStart.year, userInput.dateStart.calendarStart.month, userInput.dateStart.calendarStart.day);
                const end = new KnoraDate(
                    userInput.dateEnd.calendarName.toUpperCase(), 'CE', userInput.dateEnd.calendarStart.year, userInput.dateEnd.calendarStart.month, userInput.dateEnd.calendarStart.day);

                return new KnoraPeriod(start, end);
            } else {
                return null;
            }
        }
    }

    set value(date: KnoraDate | KnoraPeriod | null) {
        if (date !== null) {
            if (date instanceof KnoraDate) {
                // single date

                this.form.setValue({
                    dateStart: this.createCalendarDate(date),
                    dateEnd: null,
                    isPeriod: false
                });

                this.startDateControl.updateValueAndValidity();

            } else {
                // period
                const period = date as KnoraPeriod;

                this.form.setValue({
                    dateStart: this.createCalendarDate(period.start),
                    dateEnd: this.createCalendarDate(period.end),
                    isPeriod: true
                });

                this.startDateControl.updateValueAndValidity();

            }
        } else {
            this.form.setValue({ dateStart: null, dateEnd: null, isPeriod: false });

            this.startDateControl.updateValueAndValidity();
        }
        this.stateChanges.next();
    }

    /**
     * given a `KnoraDate`, creates a Gregorian or Julian calendar date.
     *
     * @param date the given KnoraDate.
     */
    createCalendarDate(date: KnoraDate): GregorianCalendarDate | JulianCalendarDate {

        const calDate = new CalendarDate(date.year, date.month, date.day);
        const period = new CalendarPeriod(calDate, calDate);

        // determine calendar
        if (date.calendar === 'GREGORIAN') {
            return new GregorianCalendarDate(period);
        } else if (date.calendar === 'JULIAN') {
            return new JulianCalendarDate(period);
        } else {
            throw new Error('Unsupported calendar: ' + date.calendar);
        }
    }

    @Input() errorStateMatcher: ErrorStateMatcher;

    constructor(
        fb: FormBuilder,
        @Optional() @Self() public ngControl: NgControl,
        private _fm: FocusMonitor,
        private _elRef: ElementRef<HTMLElement>,
        @Optional() _parentForm: NgForm,
        @Optional() _parentFormGroup: FormGroupDirective,
        _defaultErrorStateMatcher: ErrorStateMatcher) {

        super(_defaultErrorStateMatcher, _parentForm, _parentFormGroup, ngControl);

        this.endDateControl = new FormControl(null);
        this.isPeriodControl = new FormControl(null);
        this.startDateControl = new FormControl(null);

        this.form = fb.group({
            dateStart: this.startDateControl,
            dateEnd: this.endDateControl,
            isPeriod: this.isPeriodControl
        });

        _fm.monitor(_elRef.nativeElement, true).subscribe(origin => {
            this.focused = !!origin;
            this.stateChanges.next();
        });

        if (this.ngControl != null) {
            this.ngControl.valueAccessor = this;
        }
    }

    ngOnInit() {
        if (this.valueRequiredValidator) {
            this.startDateControl.setValidators([
                Validators.required,
                sameCalendarValidator(this.isPeriodControl, this.endDateControl),
                periodStartEndValidator(this.isPeriodControl, this.endDateControl)
            ]);
        } else {
            this.startDateControl.setValidators([
                sameCalendarValidator(this.isPeriodControl, this.endDateControl),
                periodStartEndValidator(this.isPeriodControl, this.endDateControl)
            ]);
        }

        this.startDateControl.updateValueAndValidity();
    }

    ngDoCheck() {
        if (this.ngControl) {
            this.updateErrorState();
        }
    }

    ngOnDestroy() {
        this.stateChanges.complete();
    }

    onContainerClick(event: MouseEvent) {
        if ((event.target as Element).tagName.toLowerCase() !== 'input') {
            this._elRef.nativeElement.querySelector('input').focus();
        }
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

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }

    _handleInput(): void {
        // trigger evaluation of validators defined for start date
        this.startDateControl.updateValueAndValidity();
        this.onChange(this.value);
    }

}
