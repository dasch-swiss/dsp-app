/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/member-ordering */
import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { DatePipe } from '@angular/common';
import { ValueErrorStateMatcher } from '../../value-error-state-matcher';
import {
    Component,
    DoCheck,
    ElementRef,
    HostBinding,
    Input,
    OnDestroy,
    OnInit,
    Optional,
    Self,
} from '@angular/core';
import {
    AbstractControl,
    ControlValueAccessor,
    UntypedFormBuilder,
    UntypedFormControl,
    UntypedFormGroup,
    FormGroupDirective,
    NgControl,
    NgForm,
    ValidatorFn,
    Validators,
} from '@angular/forms';
import {
    CanUpdateErrorState,
    ErrorStateMatcher,
    mixinErrorState,
    _AbstractConstructor,
    _Constructor,
} from '@angular/material/core';
import { MatLegacyFormFieldControl as MatFormFieldControl } from '@angular/material/legacy-form-field';
import {
    CalendarDate,
    CalendarPeriod,
    GregorianCalendarDate,
} from 'jdnconvertiblecalendar';
import { Subject } from 'rxjs';
import { CustomRegex } from '../../custom-regex';

/** a valid time value must have both a date and a time, or both inputs must be null */
export function dateTimeValidator(
    otherControl: UntypedFormControl
): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        // valid if both date and time are null or have values, excluding empty strings
        const invalid = !(
            (control.value === null && otherControl.value === null) ||
            (control.value !== null &&
                control.value !== '' &&
                otherControl.value !== null &&
                otherControl.value !== '')
        );

        return invalid
            ? { validDateTimeRequired: { value: control.value } }
            : null;
    };
}

type CanUpdateErrorStateCtor = _Constructor<CanUpdateErrorState> &
    _AbstractConstructor<CanUpdateErrorState>;

class MatInputBase {
    constructor(
        public _defaultErrorStateMatcher: ErrorStateMatcher,
        public _parentForm: NgForm,
        public _parentFormGroup: FormGroupDirective,
        public ngControl: NgControl,
        public stateChanges: Subject<void>
    ) {}
}
const _MatInputMixinBase: CanUpdateErrorStateCtor & typeof MatInputBase =
    mixinErrorState(MatInputBase);

export class DateTime {
    /**
     * @param date DateTime's date.
     * @param time DateTime's time.
     */
    constructor(public date: GregorianCalendarDate, public time: string) {}
}

@Component({
    selector: 'app-time-input',
    templateUrl: './time-input.component.html',
    styleUrls: ['./time-input.component.scss'],
    providers: [
        { provide: MatFormFieldControl, useExisting: TimeInputComponent },
        { provide: Subject },
    ],
})
export class TimeInputComponent
    extends _MatInputMixinBase
    implements
        ControlValueAccessor,
        MatFormFieldControl<string>,
        DoCheck,
        CanUpdateErrorState,
        OnDestroy,
        OnInit
{
    static nextId = 0;

    form: UntypedFormGroup;
    @HostBinding() id = `app-time-input-${TimeInputComponent.nextId++}`;
    focused = false;
    errorState = false;
    controlType = 'app-time-input';
    matcher = new ValueErrorStateMatcher();
    onChange = (_: any) => {};
    onTouched = () => {};

    @Input() dateLabel = 'Date';
    @Input() timeLabel = 'Time';
    @Input() valueRequiredValidator = true;

    dateFormControl: UntypedFormControl;
    timeFormControl: UntypedFormControl;

    datePipe = new DatePipe('en-US');

    get empty() {
        const userInput = this.form.value;
        return !userInput.date && !userInput.time;
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
    get value(): string | null {
        if (this.form.valid) {
            try {
                const userInput = new DateTime(
                    this.form.value.date,
                    this.form.value.time
                );
                return this.userInputToTimestamp(userInput);
            } catch {
                return null;
            }
        }
        return null;
    }

    set value(timestamp: string | null) {
        if (timestamp !== null) {
            try {
                const dateTime = this.convertTimestampToDateTime(timestamp);
                this.form.setValue({
                    date: dateTime.date,
                    time: dateTime.time,
                });
            } catch {
                this.form.setValue({ date: null, time: null });
            }
        } else {
            this.form.setValue({ date: null, time: null });
        }

        this.dateFormControl.updateValueAndValidity();
        this.timeFormControl.updateValueAndValidity();

        this.stateChanges.next();
    }

    @Input() errorStateMatcher: ErrorStateMatcher;

    constructor(
        fb: UntypedFormBuilder,
        @Optional() @Self() public ngControl: NgControl,
        private _stateChanges: Subject<void>,
        private _fm: FocusMonitor,
        private _elRef: ElementRef<HTMLElement>,
        @Optional() _parentForm: NgForm,
        @Optional() _parentFormGroup: FormGroupDirective,
        _defaultErrorStateMatcher: ErrorStateMatcher
    ) {
        super(
            _defaultErrorStateMatcher,
            _parentForm,
            _parentFormGroup,
            ngControl,
            _stateChanges
        );

        this.dateFormControl = new UntypedFormControl(null);

        this.timeFormControl = new UntypedFormControl(null);

        this.form = fb.group({
            date: this.dateFormControl,
            time: this.timeFormControl,
        });

        _fm.monitor(_elRef.nativeElement, true).subscribe((origin) => {
            this.focused = !!origin;
            this.stateChanges.next();
        });

        if (this.ngControl != null) {
            this.ngControl.valueAccessor = this;
        }
    }

    ngOnInit() {
        if (this.valueRequiredValidator) {
            this.dateFormControl.setValidators([
                Validators.required,
                dateTimeValidator(this.timeFormControl),
            ]);
            this.timeFormControl.setValidators([
                Validators.required,
                dateTimeValidator(this.dateFormControl),
                Validators.pattern(CustomRegex.TIME_REGEX),
            ]);
        } else {
            this.dateFormControl.setValidators(
                dateTimeValidator(this.timeFormControl)
            );
            this.timeFormControl.setValidators([
                dateTimeValidator(this.dateFormControl),
                Validators.pattern(CustomRegex.TIME_REGEX),
            ]);
        }

        this.dateFormControl.updateValueAndValidity();
        this.timeFormControl.updateValueAndValidity();
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

    writeValue(datetime: string | null): void {
        this.value = datetime;
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
        this.dateFormControl.updateValueAndValidity();
        this.timeFormControl.updateValueAndValidity();
        this.onChange(this.value);
    }

    // return converted Date obj as a string without the milliseconds
    userInputToTimestamp(userInput: DateTime): string {
        const splitTime = userInput.time.split(':');

        // in a Javascript Date, the month is 0-based so we need to subtract 1
        const updateDate = new Date(
            userInput.date.toCalendarPeriod().periodStart.year,
            userInput.date.toCalendarPeriod().periodStart.month - 1,
            userInput.date.toCalendarPeriod().periodStart.day,
            Number(splitTime[0]),
            Number(splitTime[1])
        );

        return updateDate.toISOString().split('.')[0] + 'Z';
    }

    // converts and returns a unix timestamp string as an array consisting of a GregorianCalendarDate and a string
    convertTimestampToDateTime(timestamp: string): DateTime {
        const calendarDate = new CalendarDate(
            Number(this.datePipe.transform(timestamp, 'y')),
            Number(this.datePipe.transform(timestamp, 'M')),
            Number(this.datePipe.transform(timestamp, 'd'))
        );

        const date = new GregorianCalendarDate(
            new CalendarPeriod(calendarDate, calendarDate)
        );

        const time = this.datePipe.transform(timestamp, 'HH:mm');

        const dateTime = new DateTime(date, time);

        return dateTime;
    }
}
