import { Component, OnInit, OnChanges, OnDestroy, ViewChild, Input, Inject, SimpleChanges } from '@angular/core';
import { TimeInputComponent } from './time-input/time-input.component';
import { ReadTimeValue, CreateTimeValue, UpdateTimeValue } from '@dasch-swiss/dsp-js';
import { UntypedFormControl, UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ValueErrorStateMatcher } from '../value-error-state-matcher';
import { BaseValueDirective } from 'src/app/main/directive/base-value.directive';

// https://stackoverflow.com/questions/45661010/dynamic-nested-reactive-form-expressionchangedafterithasbeencheckederror
const resolvedPromise = Promise.resolve(null);

@Component({
    selector: 'app-time-value',
    templateUrl: './time-value.component.html',
    styleUrls: ['./time-value.component.scss']
})
export class TimeValueComponent extends BaseValueDirective implements OnInit, OnChanges, OnDestroy {

    @ViewChild('timeInput') timeInputComponent: TimeInputComponent;

    @Input() displayValue?: ReadTimeValue;

    valueFormControl: UntypedFormControl;
    commentFormControl: UntypedFormControl;

    form: UntypedFormGroup;

    valueChangesSubscription: Subscription;

    customValidators = [];

    matcher = new ValueErrorStateMatcher();

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {
        super();
    }

    getInitValue(): string | null {
        if (this.displayValue !== undefined) {
            return this.displayValue.time;
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
            comment: this.commentFormControl,
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

    getNewValue(): CreateTimeValue | false {
        if (this.mode !== 'create' || !this.form.valid || this.isEmptyVal()) {
            return false;
        }

        const newTimeValue = new CreateTimeValue();

        newTimeValue.time = this.valueFormControl.value;

        if (this.commentFormControl.value !== null && this.commentFormControl.value !== '') {
            newTimeValue.valueHasComment = this.commentFormControl.value;
        }

        return newTimeValue;
    }

    getUpdatedValue(): UpdateTimeValue | false {
        if (this.mode !== 'update' || !this.form.valid) {
            return false;
        }

        const updatedTimeValue = new UpdateTimeValue();

        updatedTimeValue.id = this.displayValue.id;
        updatedTimeValue.time = this.valueFormControl.value;

        // add the submitted comment to updatedTimeValue only if user has added a comment
        if (this.commentFormControl.value !== null && this.commentFormControl.value !== '') {
            updatedTimeValue.valueHasComment = this.commentFormControl.value;
        }

        return updatedTimeValue;
    }

}
