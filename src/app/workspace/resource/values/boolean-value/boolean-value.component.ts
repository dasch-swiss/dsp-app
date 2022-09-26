import { Component, Inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { CreateBooleanValue, ReadBooleanValue, UpdateBooleanValue } from '@dasch-swiss/dsp-js';
import { Subscription } from 'rxjs';
import { BaseValueDirective } from 'src/app/main/directive/base-value.directive';

// https://stackoverflow.com/questions/45661010/dynamic-nested-reactive-form-expressionchangedafterithasbeencheckederror
const resolvedPromise = Promise.resolve(null);

@Component({
    selector: 'app-boolean-value',
    templateUrl: './boolean-value.component.html',
    styleUrls: ['./boolean-value.component.scss']
})
export class BooleanValueComponent extends BaseValueDirective implements OnInit, OnChanges, OnDestroy {

    @Input() displayValue?: ReadBooleanValue;

    @Input() moreSpace?: boolean;

    valueFormControl: UntypedFormControl;
    commentFormControl: UntypedFormControl;

    form: UntypedFormGroup;

    valueChangesSubscription: Subscription;

    customValidators = [];

    displayTypes = [];

    preferredDisplayType: string;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {
        super();
    }

    getInitValue(): boolean | null {
        if (this.displayValue !== undefined) {
            return this.displayValue.bool;
        } else {
            return false;
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

    onSubmit() {
        this.valueFormControl.markAsDirty();
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

    getNewValue(): CreateBooleanValue | false {
        if (this.mode !== 'create' || !this.form.valid) {
            return false;
        }

        const newBooleanValue = new CreateBooleanValue();

        newBooleanValue.bool = this.valueFormControl.value;

        // add the submitted new comment to newBooleanValue only if the user has added a comment
        if (this.commentFormControl.value !== null && this.commentFormControl.value !== '') {
            newBooleanValue.valueHasComment = this.commentFormControl.value;
        }

        return newBooleanValue;
    }

    getUpdatedValue(): UpdateBooleanValue | false {
        if (this.mode !== 'update' || !this.form.valid) {
            return false;
        }

        const updatedBooleanValue = new UpdateBooleanValue();

        updatedBooleanValue.id = this.displayValue.id;

        updatedBooleanValue.bool = this.valueFormControl.value;

        // add the submitted comment to updatedBooleanValue only if user has added a comment
        if (this.commentFormControl.value !== null && this.commentFormControl.value !== '') {
            updatedBooleanValue.valueHasComment = this.commentFormControl.value;
        }

        return updatedBooleanValue;
    }

}
