import { Component, Inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { ValueErrorStateMatcher } from '../value-error-state-matcher';
import { CreateDecimalValue, ReadDecimalValue, UpdateDecimalValue } from '@dasch-swiss/dsp-js';
import { Subscription } from 'rxjs';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { CustomRegex } from '../custom-regex';
import { BaseValueDirective } from 'src/app/main/directive/base-value.directive';

// https://stackoverflow.com/questions/45661010/dynamic-nested-reactive-form-expressionchangedafterithasbeencheckederror
const resolvedPromise = Promise.resolve(null);

@Component({
    selector: 'app-decimal-value',
    templateUrl: './decimal-value.component.html',
    styleUrls: ['./decimal-value.component.scss']
})
export class DecimalValueComponent extends BaseValueDirective implements OnInit, OnChanges, OnDestroy {

    @Input() displayValue?: ReadDecimalValue;

    valueFormControl: UntypedFormControl;
    commentFormControl: UntypedFormControl;

    form: UntypedFormGroup;
    matcher = new ValueErrorStateMatcher();
    valueChangesSubscription: Subscription;

    customValidators = [Validators.pattern(CustomRegex.DECIMAL_REGEX)]; // only allow for decimal values

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {
        super();
    }

    getInitValue(): number | null {
        if (this.displayValue !== undefined) {
            return this.displayValue.decimal;
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

    getNewValue(): CreateDecimalValue | false {
        if (this.mode !== 'create' || !this.form.valid  || this.isEmptyVal()) {
            return false;
        }

        const newDecimalValue = new CreateDecimalValue();

        newDecimalValue.decimal = this.valueFormControl.value;

        if (this.commentFormControl.value !== null && this.commentFormControl.value !== '') {
            newDecimalValue.valueHasComment = this.commentFormControl.value;
        }

        return newDecimalValue;
    }

    getUpdatedValue(): UpdateDecimalValue | false {
        if (this.mode !== 'update' || !this.form.valid) {
            return false;
        }

        const updatedDecimalValue = new UpdateDecimalValue();

        updatedDecimalValue.id = this.displayValue.id;

        updatedDecimalValue.decimal = this.valueFormControl.value;

        // add the submitted comment to updatedIntValue only if user has added a comment
        if (this.commentFormControl.value !== null && this.commentFormControl.value !== '') {
            updatedDecimalValue.valueHasComment = this.commentFormControl.value;
        }

        return updatedDecimalValue;
    }

}
