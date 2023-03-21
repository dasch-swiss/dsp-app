import { Directive, Input, OnDestroy, OnInit } from '@angular/core';
import {
    AbstractControl,
    FormBuilder,
    FormControl,
    FormGroup,
    ValidatorFn,
    Validators,
} from '@angular/forms';
import { CreateValue, ReadValue, UpdateValue } from '@dasch-swiss/dsp-js';
import { Subscription } from 'rxjs';

// https://stackoverflow.com/questions/45661010/dynamic-nested-reactive-form-expressionchangedafterithasbeencheckederror
const resolvedPromise = Promise.resolve(null);

@Directive()
export abstract class BaseValueDirective implements OnInit, OnDestroy {
    /**
     * sets the mode of the component.
     */
    @Input() mode: 'read' | 'update' | 'create' | 'search';

    /**
     * parent FormGroup that contains all child FormGroups
     */
    @Input() parentForm?: FormGroup;

    /**
     * name of the FormGroup, used to add to the parentForm because the name needs to be unique
     */
    @Input() formName = 'Untitled FormGroup';

    /**
     * controls if the value should be required.
     */
    @Input() valueRequiredValidator = true;

    /**
     * disable the comment field
     */
    @Input() commentDisabled? = false;

    shouldShowComment = false;

    /**
     * subscription of comment changes.
     */
    commentChangesSubscription: Subscription;

    /**
     * formControl element for the value.
     */
    valueFormControl: FormControl;

    /**
     * formControl element for the comment on the value.
     */
    commentFormControl: FormControl;

    /**
     * formGroup that contains FormControl elements.
     */
    form: FormGroup;

    /**
     * value to be displayed, if any.
     */
    /* eslint-disable */
    @Input() abstract displayValue?: ReadValue;
    /* eslint-enable */

    /**
     * custom validators for a specific value type.
     * Can be initialized to an empty array if not needed.
     */
    abstract customValidators: ValidatorFn[];

    protected constructor(protected _fb?: FormBuilder) {}

    ngOnInit() {
        // initialize form control elements
        this.valueFormControl = new FormControl(null);
        this.commentFormControl = new FormControl(null);

        this.form = this._fb.group({
            value: this.valueFormControl,
            comment: this.commentFormControl,
        });
        this.resetFormControl();
        // subscribing to comment changes and revalidate. Enables changing of comments and saving values even if the valueFormControls value did not change.
        this.commentChangesSubscription =
            this.commentFormControl.valueChanges.subscribe((update) => {
                this.valueFormControl.updateValueAndValidity();
            });
        resolvedPromise.then(() => {
            // add form to the parent form group
            this.addToParentFormGroup(this.formName, this.form);
        });
    }

    ngOnDestroy() {
        // unsubscribe to avoid memory leaks
        if (this.commentChangesSubscription) {
            this.commentChangesSubscription.unsubscribe();
        }
        this.removeFromParentFormGroup(this.formName);
    }

    /**
     * standard implementation for comparison of primitive values.
     * Returns true if two values are equal.
     *
     * @param initValue Initially given value.
     * @param curValue Current value.
     */
    standardValueComparisonFunc(initValue: any, curValue: any): boolean {
        return initValue === curValue;
    }

    /**
     * standard implementation to determine if a value or comment have been changed.
     *
     * @param initValue Initially given value.
     * @param initComment Initially given comment.
     * @param commentFormControl FormControl of the current comment.
     */
    standardValidatorFunc: (
        val: any,
        comment: string,
        commentCtrl: FormControl
    ) => ValidatorFn =
        (
            initValue: any,
            initComment: string,
            commentFormControl: FormControl
        ): ValidatorFn =>
        (control: AbstractControl): { [key: string]: any } | null => {
            const invalid =
                this.standardValueComparisonFunc(initValue, control.value) &&
                (initComment === commentFormControl.value ||
                    (initComment === null && commentFormControl.value === ''));

            return invalid
                ? { valueNotChanged: { value: control.value } }
                : null;
        };

    /**
     * returns the initially given value comment set via displayValue.
     * Returns null if no value comment was given.
     */
    getInitComment(): string | null {
        if (
            this.displayValue !== undefined &&
            this.displayValue.valueHasComment !== undefined
        ) {
            return this.displayValue.valueHasComment;
        } else {
            return null;
        }
    }

    /**
     * resets the form control elements
     * with displayValue's value and value comment.
     * Depending on the mode, validators are reset.
     */
    resetFormControl(): void {
        if (
            this.valueFormControl !== undefined &&
            this.commentFormControl !== undefined
        ) {
            const initialValue = this.getInitValue();
            const initialComment = this.getInitComment();
            this.valueFormControl.reset();
            this.commentFormControl.reset();
            this.valueFormControl.setValue(initialValue);
            this.commentFormControl.setValue(initialComment);

            this.valueFormControl.clearValidators();

            // set validators depending on mode
            if (this.mode === 'update') {
                this.valueFormControl.setValidators(
                    [
                        Validators.required,
                        this.standardValidatorFunc(
                            initialValue,
                            initialComment,
                            this.commentFormControl
                        ),
                    ].concat(this.customValidators)
                );
            } else {
                // console.log('reset read/create validators');
                if (this.valueRequiredValidator) {
                    this.valueFormControl.setValidators(
                        [Validators.required].concat(this.customValidators)
                    );
                } else {
                    this.valueFormControl.setValidators(this.customValidators);
                }
            }

            this.valueFormControl.updateValueAndValidity();
        }
    }

    /**
     * hide comment field by default if in READ mode
     */
    updateCommentVisibility(): void {
        this.shouldShowComment = this.mode === 'read';
    }

    /**
     * toggles visibility of the comment field regardless of the mode
     */
    toggleCommentVisibility(): void {
        this.shouldShowComment = !this.shouldShowComment;
    }

    /**
     * add the value components FormGroup to a parent FormGroup if one is defined
     */
    addToParentFormGroup(name: string, form: FormGroup) {
        if (this.parentForm) {
            this.parentForm.addControl(name, form);
        }
    }

    /**
     * remove the value components FormGroup from a parent FormGroup if one is defined
     */
    removeFromParentFormGroup(name: string) {
        if (this.parentForm) {
            this.parentForm.removeControl(name);
        }
    }

    /**
     * checks if the value is empty.
     */
    isEmptyVal(): boolean {
        return (
            this.valueFormControl.value === null ||
            this.valueFormControl.value === ''
        );
    }

    /**
     * returns true if there is no property value but one required or an invalid property value in the valueFormControl
     */
    hasError() {
        return (
            this.valueFormControl.hasError('pattern') ||
            this.valueFormControl.hasError('required')
        );
    }

    /**
     * returns the initially given value set via displayValue.
     * Returns null if no value was given.
     */
    abstract getInitValue(): any;

    /**
     * returns a value that is to be created.
     * Returns false if invalid.
     */
    abstract getNewValue(): CreateValue | false;

    /**
     * returns a value that is to be updated.
     * Returns false if invalid.
     */
    abstract getUpdatedValue(): UpdateValue | false;
}
