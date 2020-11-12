import { Input, Directive } from '@angular/core';
import { CreateValue, ReadValue, UpdateValue } from '@dasch-swiss/dsp-js';
import { AbstractControl, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

@Directive()
export abstract class BaseValueComponent {

    shouldShowComment = false;

    /**
     * Value to be displayed, if any.
     */
    @Input() abstract displayValue?: ReadValue;

    /**
     * Sets the mode of the component.
     */
    @Input() mode: 'read' | 'update' | 'create' | 'search';

    /**
     * FormControl element for the value.
     */
    abstract valueFormControl: FormControl;

    /**
     * FormControl element for the comment on the value.
     */
    abstract commentFormControl: FormControl;

    /**
     * FormGroup that contains FormControl elements.
     */
    abstract form: FormGroup;

    /**
     * Subscription used for when the value changes.
     */
    abstract valueChangesSubscription: Subscription;

    /**
     * Custom validators for a specific value type.
     * Can be initialized to an empty array if not needed.
     */
    abstract customValidators: ValidatorFn[];

    /**
     * Standard implementation for comparison of primitive values.
     * Returns true if two values are equal.
     *
     * @param initValue Initially given value.
     * @param curValue Current value.
     */
    standardValueComparisonFunc(initValue: any, curValue: any): boolean {
        return initValue === curValue;
    }

    /**
     * Standard implementation to determine if a value or comment have been changed.
     *
     * @param initValue Initially given value.
     * @param initComment Initially given comment.
     * @param commentFormControl FormControl of the current comment.
     */
    standardValidatorFunc: (val: any, comment: string, commentCtrl: FormControl)
        => ValidatorFn = (initValue: any, initComment: string, commentFormControl: FormControl): ValidatorFn => {
            return (control: AbstractControl): { [key: string]: any } | null => {

                const invalid = this.standardValueComparisonFunc(initValue, control.value)
                    && (initComment === commentFormControl.value || (initComment === null && commentFormControl.value === ''));

                return invalid ? { valueNotChanged: { value: control.value } } : null;
            };
        };

    /**
     * Returns the initially given value set via displayValue.
     * Returns null if no value was given.
     */
    abstract getInitValue(): any;

    /**
     * Returns the initially given value comment set via displayValue.
     * Returns null if no value comment was given.
     */
    getInitComment(): string | null {

        if (this.displayValue !== undefined && this.displayValue.valueHasComment !== undefined) {
            return this.displayValue.valueHasComment;
        } else {
            return null;
        }
    }

    /**
     * Resets the form control elements
     * with displayValue's value and value comment.
     * Depending on the mode, validators are reset.
     */
    resetFormControl(): void {
        if (this.valueFormControl !== undefined && this.commentFormControl !== undefined) {

            const initialValue = this.getInitValue();
            const initialComment = this.getInitComment();
            this.valueFormControl.reset();
            this.valueFormControl.setValue(initialValue);
            this.commentFormControl.setValue(initialComment);

            this.valueFormControl.clearValidators();

            // set validators depending on mode
            if (this.mode === 'update') {
                // console.log('reset update validators');
                this.valueFormControl.setValidators([Validators.required, this.standardValidatorFunc(initialValue, initialComment, this.commentFormControl)].concat(this.customValidators));
            } else {
                // console.log('reset read/create validators');
                this.valueFormControl.setValidators([Validators.required].concat(this.customValidators));

            }

            this.valueFormControl.updateValueAndValidity();
        }
    }

    /**
     * Unsubscribes from the valueChangesSubscription
     */
    unsubscribeFromValueChanges(): void {
        if (this.valueChangesSubscription !== undefined) {
            this.valueChangesSubscription.unsubscribe();
        }
    }

    /**
     * Hide comment field by default if in READ mode
     */
    updateCommentVisibility(): void {
        this.shouldShowComment = this.mode === 'read' ? true : false;
    }

    /**
     * Toggles visibility of the comment field regardless of the mode
     */
    toggleCommentVisibility(): void {
        this.shouldShowComment = !this.shouldShowComment;
    }

    /**
     * Returns a value that is to be created.
     * Returns false if invalid.
     */
    abstract getNewValue(): CreateValue | false;

    /**
     * Returns a value that is to be updated.
     * Returns false if invalid.
     */
    abstract getUpdatedValue(): UpdateValue | false;


}
