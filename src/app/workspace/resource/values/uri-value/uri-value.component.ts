import { Component, Inject, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { ValueErrorStateMatcher } from '../value-error-state-matcher';
import { CreateUriValue, ReadUriValue, UpdateUriValue } from '@dasch-swiss/dsp-js';
import { Subscription } from 'rxjs';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { CustomRegex } from '../custom-regex';
import { BaseValueDirective } from 'src/app/main/directive/base-value.directive';

// https://stackoverflow.com/questions/45661010/dynamic-nested-reactive-form-expressionchangedafterithasbeencheckederror
const resolvedPromise = Promise.resolve(null);

@Component({
    selector: 'app-uri-value',
    templateUrl: './uri-value.component.html',
    styleUrls: ['./uri-value.component.scss']
})
export class UriValueComponent extends BaseValueDirective implements OnInit, OnChanges, OnDestroy {

    @Input() displayValue?: ReadUriValue;
    @Input() label?: string;

    valueFormControl: UntypedFormControl;
    commentFormControl: UntypedFormControl;

    form: UntypedFormGroup;
    matcher = new ValueErrorStateMatcher();
    valueChangesSubscription: Subscription;

    customValidators = [Validators.pattern(CustomRegex.URI_REGEX)];

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {
        super();
    }

    getInitValue(): string | null {
        if (this.displayValue !== undefined) {
            return this.displayValue.uri;
        } else {
            return null;
        }
    }

    ngOnInit() {
        this.valueFormControl = new UntypedFormControl(null);
        this.commentFormControl = new UntypedFormControl(null);

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

    ngOnDestroy(): void {
        this.unsubscribeFromValueChanges();

        resolvedPromise.then(() => {
            // remove form from the parent form group
            this.removeFromParentFormGroup(this.formName);
        });
    }

    getNewValue(): CreateUriValue | false {
        if (this.mode !== 'create' || !this.form.valid || this.isEmptyVal()) {
            return false;
        }

        const newUriValue = new CreateUriValue();

        newUriValue.uri = this.valueFormControl.value;

        if (this.commentFormControl.value !== null && this.commentFormControl.value !== '') {
            newUriValue.valueHasComment = this.commentFormControl.value;
        }

        return newUriValue;
    }

    getUpdatedValue(): UpdateUriValue | false {
        if (this.mode !== 'update' || !this.form.valid) {
            return false;
        }
        const updatedUriValue = new UpdateUriValue();

        updatedUriValue.id = this.displayValue.id;

        updatedUriValue.uri = this.valueFormControl.value;

        if (this.commentFormControl.value !== null && this.commentFormControl.value !== '') {
            updatedUriValue.valueHasComment = this.commentFormControl.value;
        }

        return updatedUriValue;
    }

}
