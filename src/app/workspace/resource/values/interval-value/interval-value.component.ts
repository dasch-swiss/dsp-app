import { Component, Inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { ValueErrorStateMatcher } from '../value-error-state-matcher';
import { CreateIntervalValue, ReadIntervalValue, UpdateIntervalValue } from '@dasch-swiss/dsp-js';
import {
    UntypedFormBuilder,
    UntypedFormControl,
    UntypedFormGroup
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { Interval, IntervalInputComponent } from './interval-input/interval-input.component';
import { BaseValueDirective } from 'src/app/main/directive/base-value.directive';

// https://stackoverflow.com/questions/45661010/dynamic-nested-reactive-form-expressionchangedafterithasbeencheckederror
const resolvedPromise = Promise.resolve(null);

@Component({
    selector: 'app-interval-value',
    templateUrl: './interval-value.component.html',
    styleUrls: ['./interval-value.component.scss']
})
export class IntervalValueComponent extends BaseValueDirective implements OnInit, OnChanges, OnDestroy {

    @ViewChild('intervalInput') intervalInputComponent: IntervalInputComponent;

    @Input() displayValue?: ReadIntervalValue;

    valueFormControl: UntypedFormControl;
    commentFormControl: UntypedFormControl;

    form: UntypedFormGroup;

    valueChangesSubscription: Subscription;

    customValidators = [];

    matcher = new ValueErrorStateMatcher();

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {
        super();
    }

    standardValueComparisonFunc(initValue: Interval, curValue: Interval | null): boolean {
        return (curValue instanceof Interval) && initValue.start === curValue.start && initValue.end === curValue.end;
    }

    getInitValue(): Interval | null {
        if (this.displayValue !== undefined) {
            return new Interval(this.displayValue.start, this.displayValue.end);
        } else {
            return null;
        }
    }

    ngOnInit() {
        // initialize form control elements
        this.valueFormControl = new UntypedFormControl(null);

        this.commentFormControl = new UntypedFormControl(null);

        // subscribe to any change on the comment and recheck validity
        this.valueChangesSubscription = this.commentFormControl.valueChanges.subscribe(
            data => {
                this.valueFormControl.updateValueAndValidity();
            }
        );

        this.form = this._fb.group({
            value: this.valueFormControl,
            comment: this.commentFormControl
        });

        this.resetFormControl();

        resolvedPromise.then(() => {
            // add form to the parent form group
            this.addToParentFormGroup(this.formName, this.form);
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.resetFormControl();
    }

    // unsubscribe when the object is destroyed to prevent memory leaks
    ngOnDestroy(): void {
        this.unsubscribeFromValueChanges();

        resolvedPromise.then(() => {
            // remove form from the parent form group
            this.removeFromParentFormGroup(this.formName);
        });
    }

    getNewValue(): CreateIntervalValue | false {
        if (this.mode !== 'create' || !this.form.valid || this.isEmptyVal()) {
            return false;
        }

        const newIntervalValue = new CreateIntervalValue();

        newIntervalValue.start = this.valueFormControl.value.start;
        newIntervalValue.end = this.valueFormControl.value.end;

        if (this.commentFormControl.value !== null && this.commentFormControl.value !== '') {
            newIntervalValue.valueHasComment = this.commentFormControl.value;
        }

        return newIntervalValue;
    }

    getUpdatedValue(): UpdateIntervalValue | false {
        if (this.mode !== 'update' || !this.form.valid) {
            return false;
        }

        const updatedIntervalValue = new UpdateIntervalValue();

        updatedIntervalValue.id = this.displayValue.id;

        updatedIntervalValue.start = this.valueFormControl.value.start;
        updatedIntervalValue.end = this.valueFormControl.value.end;

        // add the submitted comment to updatedIntervalValue only if user has added a comment
        if (this.commentFormControl.value !== null && this.commentFormControl.value !== '') {
            updatedIntervalValue.valueHasComment = this.commentFormControl.value;
        }

        return updatedIntervalValue;
    }

}
