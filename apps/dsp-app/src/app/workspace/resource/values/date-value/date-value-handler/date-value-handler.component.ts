/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/member-ordering */
/* eslint-disable @typescript-eslint/no-unused-expressions */
import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
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
import { KnoraDate, KnoraPeriod } from '@dasch-swiss/dsp-js';
import { JDNConvertibleCalendar } from '@dasch-swiss/jdnconvertiblecalendar';
import { Subject, Subscription } from 'rxjs';
import { ValueService } from '../../../services/value.service';

/** if a period is defined, start date must be before end date */
export function periodStartEndValidator(
    isPeriod: UntypedFormControl,
    endDate: UntypedFormControl,
    valueService: ValueService
): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
        if (
            isPeriod.value &&
            control.value !== null &&
            endDate.value !== null
        ) {
            // period: check if start is before end
            const jdnStartDate =
                valueService.createJDNCalendarDateFromKnoraDate(control.value);
            const jdnEndDate = valueService.createJDNCalendarDateFromKnoraDate(
                endDate.value
            );

            const invalid =
                jdnStartDate.toJDNPeriod().periodEnd >=
                jdnEndDate.toJDNPeriod().periodStart;

            return invalid
                ? { periodStartEnd: { value: control.value } }
                : null;
        }

        return null;
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

@Component({
    selector: 'app-date-value-handler',
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
    extends _MatInputMixinBase
    implements
        ControlValueAccessor,
        MatFormFieldControl<KnoraDate | KnoraPeriod>,
        DoCheck,
        CanUpdateErrorState,
        OnInit,
        OnDestroy
{
    static nextId = 0;

    @Input() valueRequiredValidator = true;

    form: UntypedFormGroup;

    isPeriodControl: UntypedFormControl;
    calendarControl: UntypedFormControl;
    startDate: UntypedFormControl;
    endDate: UntypedFormControl;

    readonly focused = false;

    readonly controlType = 'app-date-value-handler';

    calendars = JDNConvertibleCalendar.supportedCalendars.map((cal) =>
        cal.toUpperCase()
    );

    private _subscriptions: Subscription[] = [];

    @Input()
    get value(): KnoraDate | KnoraPeriod | null {
        if (!this.form.valid) {
            return null;
        }

        if (!this.isPeriodControl.value) {
            return this.startDate.value;
        } else {
            if (
                this.endDate.value &&
                this.startDate.value.calendar !== this.endDate.value.calendar
            ) {
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

    private _placeholder: string;

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
        private _stateChanges: Subject<void>,
        private _fm: FocusMonitor,
        private _elRef: ElementRef<HTMLElement>,
        @Optional() _parentForm: NgForm,
        @Optional() _parentFormGroup: FormGroupDirective,
        _defaultErrorStateMatcher: ErrorStateMatcher,
        private _valueService: ValueService
    ) {
        super(
            _defaultErrorStateMatcher,
            _parentForm,
            _parentFormGroup,
            ngControl,
            _stateChanges
        );

        if (this.ngControl != null) {
            // setting the value accessor directly (instead of using
            // the providers) to avoid running into a circular import.
            this.ngControl.valueAccessor = this;
        }

        this.isPeriodControl = new UntypedFormControl(false); // tODO: if period, check if start is before end
        this.calendarControl = new UntypedFormControl(null);

        this.endDate = new UntypedFormControl(null);
        this.startDate = new UntypedFormControl(null);

        const eraChangesSubscription =
            this.isPeriodControl.valueChanges.subscribe((isPeriod) => {
                this.endDate.clearValidators();

                if (isPeriod && this.valueRequiredValidator) {
                    // end date is required in case of a period
                    this.endDate.setValidators([Validators.required]);
                }

                this.endDate.updateValueAndValidity();
            });

        this._subscriptions.push(eraChangesSubscription);

        // tODO: find better way to detect changes
        const startValueSubscription = this.startDate.valueChanges.subscribe(
            () => {
                // form's validity has not been updated yet,
                // trigger update
                this.form.updateValueAndValidity();
                this.handleInput();
            }
        );

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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onChange = (_: any) => {};

    onTouched = () => {};

    get empty() {
        return !this.startDate && !this.endDate;
    }

    ngOnInit(): void {
        if (this.valueRequiredValidator) {
            this.startDate.setValidators([
                Validators.required,
                periodStartEndValidator(
                    this.isPeriodControl,
                    this.endDate,
                    this._valueService
                ),
            ]);
        } else {
            this.startDate.setValidators([
                periodStartEndValidator(
                    this.isPeriodControl,
                    this.endDate,
                    this._valueService
                ),
            ]);
        }
        this.startDate.updateValueAndValidity();
    }

    ngDoCheck() {
        if (this.ngControl) {
            this.updateErrorState();
        }
    }

    ngOnDestroy() {
        this.stateChanges.complete();

        this._subscriptions.forEach((subs) => {
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
    /* eslint-disable @typescript-eslint/no-unused-vars */
    onContainerClick(event: MouseEvent): void {}

    setDescribedByIds(ids: string[]): void {}
    /* eslint-enable @typescript-eslint/no-unused-vars */
}
