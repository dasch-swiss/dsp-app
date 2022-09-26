/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/member-ordering */
import { Component, DoCheck, ElementRef, HostBinding, Input, OnDestroy, OnInit, Optional, Self } from '@angular/core';
import { MatFormFieldControl } from '@angular/material/form-field';
import { AbstractControl, ControlValueAccessor, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, FormGroupDirective, NgControl, NgForm, ValidatorFn, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { CanUpdateErrorState, ErrorStateMatcher, mixinErrorState, _AbstractConstructor, _Constructor } from '@angular/material/core';

/**
 * represents an interval consisting.
 */
export class Interval {

    /**
     * @param start interval's start.
     * @param end interval's end.
     */
    constructor(public start: number, public end: number) {
    }
}

/** error when invalid control is dirty, touched, or submitted. */
export class IntervalInputErrorStateMatcher implements ErrorStateMatcher {
    isErrorState(control: UntypedFormControl | null, form: FormGroupDirective | NgForm | null): boolean {
        const isSubmitted = form && form.submitted;
        return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
    }
}

/** interval must have a start and end of the same type, either both numbers or both null */
export function startEndSameTypeValidator(otherInterval: UntypedFormControl): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {

        // valid if both start and end are null or have values
        const invalid = !(control.value === null && otherInterval.value === null || control.value !== null && otherInterval.value !== null);

        return invalid ? { 'startEndSameTypeRequired': { value: control.value } } : null;
    };
}

type CanUpdateErrorStateCtor = _Constructor<CanUpdateErrorState> & _AbstractConstructor<CanUpdateErrorState>;

class MatInputBase {
    constructor(
        public _defaultErrorStateMatcher: ErrorStateMatcher,
        public _parentForm: NgForm,
        public _parentFormGroup: FormGroupDirective,
        public ngControl: NgControl,
        public stateChanges: Subject<void>
    ) { }
}
const _MatInputMixinBase: CanUpdateErrorStateCtor & typeof MatInputBase =
    mixinErrorState(MatInputBase);

// https://material.angular.io/guide/creating-a-custom-form-field-control
@Component({
    selector: 'app-interval-input',
    templateUrl: './interval-input.component.html',
    styleUrls: ['./interval-input.component.scss'],
    providers: [
        { provide: MatFormFieldControl, useExisting: IntervalInputComponent },
        { provide: Subject }
    ]
})
export class IntervalInputComponent extends _MatInputMixinBase implements ControlValueAccessor, MatFormFieldControl<Interval>, DoCheck, CanUpdateErrorState, OnDestroy, OnInit {
    static nextId = 0;

    form: UntypedFormGroup;
    @HostBinding() id = `app-interval-input-${IntervalInputComponent.nextId++}`;
    focused = false;
    errorState = false;
    controlType = 'app-interval-input';
    matcher = new IntervalInputErrorStateMatcher();

    startIntervalControl: UntypedFormControl;
    endIntervalControl: UntypedFormControl;

    @Input() intervalStartLabel = 'start';
    @Input() intervalEndLabel = 'end';
    @Input() valueRequiredValidator = true;

    onChange = (_: any) => { };
    onTouched = () => { };

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
    get value(): Interval | null {
        const userInput = this.form.value;
        if (userInput.start !== null && userInput.end !== null) {
            return new Interval(userInput.start, userInput.end);
        }
        return null;
    }

    set value(interval: Interval | null) {
        if (interval !== null) {
            this.form.setValue({ start: interval.start, end: interval.end });
        } else {
            this.form.setValue({ start: null, end: null });
        }

        this.startIntervalControl.updateValueAndValidity();
        this.endIntervalControl.updateValueAndValidity();

        this.stateChanges.next();
    }

    @Input() errorStateMatcher: ErrorStateMatcher;

    constructor(fb: UntypedFormBuilder,
        @Optional() @Self() public ngControl: NgControl,
        private _stateChanges: Subject<void>,
        private _fm: FocusMonitor,
        private _elRef: ElementRef<HTMLElement>,
        @Optional() _parentForm: NgForm,
        @Optional() _parentFormGroup: FormGroupDirective,
        _defaultErrorStateMatcher: ErrorStateMatcher) {

        super(_defaultErrorStateMatcher, _parentForm, _parentFormGroup, ngControl, _stateChanges);

        this.startIntervalControl = new UntypedFormControl(null);
        this.endIntervalControl = new UntypedFormControl(null);

        this.form = fb.group({
            start: this.startIntervalControl,
            end: this.endIntervalControl
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
            this.startIntervalControl.setValidators([Validators.required, startEndSameTypeValidator(this.endIntervalControl)]);
            this.endIntervalControl.setValidators([Validators.required, startEndSameTypeValidator(this.startIntervalControl)]);
        } else {
            this.startIntervalControl.setValidators(startEndSameTypeValidator(this.endIntervalControl));
            this.endIntervalControl.setValidators(startEndSameTypeValidator(this.startIntervalControl));
        }

        this.startIntervalControl.updateValueAndValidity();
        this.endIntervalControl.updateValueAndValidity();
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

    writeValue(interval: Interval | null): void {
        this.value = interval;
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
        this.startIntervalControl.updateValueAndValidity();
        this.endIntervalControl.updateValueAndValidity();
        this.onChange(this.value);
    }

}
