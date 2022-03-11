/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/member-ordering */
import {
    Component,
    DoCheck,
    ElementRef,
    HostBinding,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Optional,
    Self, SimpleChanges
} from '@angular/core';
import {
    CanUpdateErrorState,
    ErrorStateMatcher,
    mixinErrorState
} from '@angular/material/core';
import { AbstractConstructor, Constructor } from '@angular/material/core/common-behaviors/constructor';
import {
    ControlValueAccessor,
    FormBuilder,
    FormControl,
    FormGroup,
    FormGroupDirective,
    NgControl,
    NgForm, Validators
} from '@angular/forms';
import { MatFormFieldControl } from '@angular/material/form-field';
import { KnoraDate, KnoraPeriod } from '@dasch-swiss/dsp-js';
import { Subject, Subscription } from 'rxjs';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { FocusMonitor } from '@angular/cdk/a11y';
import { ValueService } from 'src/app/workspace/resource/services/value.service';

// https://stackoverflow.com/questions/45661010/dynamic-nested-reactive-form-expressionchangedafterithasbeencheckederror
const resolvedPromise = Promise.resolve(null);

type CanUpdateErrorStateCtor = Constructor<CanUpdateErrorState> & AbstractConstructor<CanUpdateErrorState>;

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
    selector: 'app-date-edit',
    templateUrl: './date-edit.component.html',
    styleUrls: ['./date-edit.component.scss'],
    providers: [{ provide: MatFormFieldControl, useExisting: DateEditComponent }]
})
export class DateEditComponent extends _MatInputMixinBase implements ControlValueAccessor, MatFormFieldControl<KnoraDate | KnoraPeriod>, DoCheck, CanUpdateErrorState, OnDestroy, OnInit, OnChanges {

    static nextId = 0;

    @Input() calendar: string;

    @Input() valueRequiredValidator = true;

    form: FormGroup;
    stateChanges = new Subject<void>();

    eraControl: FormControl;
    yearControl: FormControl;
    monthControl: FormControl;
    dayControl: FormControl;

    months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

    days = [];

    readonly focused = false;

    readonly controlType = 'app-date-edit';

    private _subscriptions: Subscription[] = [];

    @Input()
    get value(): KnoraDate | null {

        if (!this.form.valid
            || this.calendar === undefined
            || this.yearControl.value === null) { // in case valueRequiredValidator is set to false, return null for an empty year
            return null;
        }

        let era: string;
        if (this.eraControl.enabled) {
            era = this.eraControl.value;
        } else {
            era = 'noEra';
        }

        return new KnoraDate(
            this.calendar,
            era,
            this.yearControl.value,
            this.monthControl.value ? this.monthControl.value : undefined,
            this.dayControl.value ? this.dayControl.value : undefined
        );
    }

    set value(date: KnoraDate | null) {

        if (date instanceof KnoraDate) {

            this._initEra(this.calendar, date.era);

            this.yearControl.setValue(date.year);
            this.monthControl.setValue(date.month ? date.month : null);
            this.dayControl.setValue(date.day ? date.day : null);

        } else {
            // null

            this._initEra(this.calendar, 'CE');

            this.yearControl.setValue(null);
            this.monthControl.setValue(null);
            this.dayControl.setValue(null);

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

    @HostBinding() id = `app-date-edit-${DateEditComponent.nextId++}`;

    onChange = (_: any) => {
    };

    onTouched = () => {
    };

    get empty() {
        return !this.yearControl && !this.monthControl && !this.dayControl;
    }

    constructor(fb: FormBuilder,
        @Optional() @Self() public ngControl: NgControl,
        private _fm: FocusMonitor,
        private _elRef: ElementRef<HTMLElement>,
        @Optional() _parentForm: NgForm,
        @Optional() _parentFormGroup: FormGroupDirective,
        _defaultErrorStateMatcher: ErrorStateMatcher,
        private _valueService: ValueService) {

        super(_defaultErrorStateMatcher, _parentForm, _parentFormGroup, ngControl);

        if (this.ngControl != null) {
            // setting the value accessor directly (instead of using
            // the providers) to avoid running into a circular import.
            this.ngControl.valueAccessor = this;
        }

        this.eraControl = new FormControl(null);

        this.yearControl = new FormControl({
            value: null,
            disabled: false
        });

        this.monthControl = new FormControl({ value: null, disabled: true });

        this.dayControl = new FormControl({ value: null, disabled: true });

        // recalculate days of month when era changes
        const eraChangesSubscription = this.eraControl.valueChanges.subscribe(
            () => {
                if (this.yearControl.valid && this.monthControl.value) {
                    this._setDays(this.calendar, this.eraControl.value, this.yearControl.value, this.monthControl.value);
                }
            }
        );

        this._subscriptions.push(eraChangesSubscription);

        // enable/disable month selection depending on year
        // enable/disable day selection depending on
        const yearChangesSubscription = this.yearControl.valueChanges.subscribe(
            () => {
                if (this.yearControl.valid) {
                    this.monthControl.enable();
                } else {
                    this.monthControl.disable();
                }

                if (this.yearControl.valid && this.monthControl.value) {
                    this.dayControl.enable();
                } else {
                    this.dayControl.disable();
                }
            }
        );

        this._subscriptions.push(yearChangesSubscription);

        // enable/disable day selection depending on month
        // recalculate days when month changes
        const monthChangesSubscription = this.monthControl.valueChanges.subscribe(
            () => {
                if (this.yearControl.valid && this.monthControl.value) {
                    this._setDays(this.calendar, this.eraControl.value, this.yearControl.value, this.monthControl.value);
                }

                if (this.monthControl.value) {
                    this.dayControl.enable();
                } else {
                    this.dayControl.setValue(null);
                    this.dayControl.disable();
                }
            }
        );

        this._subscriptions.push(monthChangesSubscription);

        // init form
        this.form = fb.group({
            era: this.eraControl,
            year: this.yearControl,
            month: this.monthControl,
            day: this.dayControl
        });

    }

    ngOnInit() {
        if (this.valueRequiredValidator) {
            this.yearControl.setValidators([Validators.required, Validators.min(1)]);
            this.yearControl.updateValueAndValidity();
        }
    }

    ngOnChanges(changes: SimpleChanges) {

        const calendar = this.calendar;
        const era = this.eraControl.value;
        const year =  this.yearControl.value;
        const month = this.monthControl.value;

        // async to prevent changed after checked error
        resolvedPromise.then(
            () => {
                // reinit days on calendar change
                this._setDays(calendar, era, year, month);

                // enable / disable era, but preserve active era if possible
                this._initEra(calendar, era);

                this._handleInput();
            }
        );

    }

    ngDoCheck() {
        if (this.ngControl) {
            this.updateErrorState();
        }
    }

    ngOnDestroy() {
        this.stateChanges.complete();

        this._subscriptions.forEach(
            subs => {
                if (subs instanceof Subscription && !subs.closed) {
                    subs.unsubscribe();
                }
            }
        );
    }

    writeValue(date: KnoraDate | null): void {
        this.value = date;
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouched = fn;
    }

    _handleInput(): void {
        this.onChange(this.value);
    }

    onContainerClick(event: MouseEvent): void {
    }

    setDescribedByIds(ids: string[]): void {
    }

    /**
     *
     * sets available days for a given year and month.
     *
     * @param calendar calendar of the given date.
     * @param era era of the given date.
     * @param year year of the given date.
     * @param month month of the given date.
     */
    private _setDays(calendar: string, era: string, year: number, month: number) {

        const yearAstro = this._valueService.convertHistoricalYearToAstronomicalYear(year, era, calendar);

        const days = this._valueService.calculateDaysInMonth(calendar, yearAstro, month);

        // empty array
        this.days = [];
        for (let i = 1; i <= days; i++) {
            this.days.push(i);
        }

        // check if selected day is still valid, otherwise set to latest possible day
        if (this.dayControl.value !== null && this.dayControl.value > this.days.length) {
            this.dayControl.setValue(this.days.length);
        }
    }

    /**
     * inits the era control depending on the chosen calendar.
     *
     * @param calendar active calendar.
     * @param era era to set.
     */
    private _initEra(calendar: string, era: string) {

        if (calendar !== 'ISLAMIC') {
            this.eraControl.enable();
            this.eraControl.setValue(era !== null ? era : 'CE');
        } else {
            this.eraControl.setValue(null);
            this.eraControl.disable();
        }

    }

}
