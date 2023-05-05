import {
    Component,
    Inject,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import {
    CreateBooleanValue,
    ReadBooleanValue,
    UpdateBooleanValue,
} from '@dasch-swiss/dsp-js';
import { BaseValueDirective } from '@dsp-app/src/app/main/directive/base-value.directive';

@Component({
    selector: 'app-boolean-value',
    templateUrl: './boolean-value.component.html',
    styleUrls: ['./boolean-value.component.scss'],
})
export class BooleanValueComponent
    extends BaseValueDirective
    implements OnInit, OnChanges, OnDestroy
{
    @Input() displayValue?: ReadBooleanValue;

    @Input() moreSpace?: boolean;

    customValidators = [];

    constructor(@Inject(FormBuilder) protected _fb: FormBuilder) {
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
        super.ngOnInit();
    }

    ngOnChanges(): void {
        this.resetFormControl();
    }

    // unsubscribe when the object is destroyed to prevent memory leaks
    ngOnDestroy(): void {
        super.ngOnDestroy();
    }

    getNewValue(): CreateBooleanValue | false {
        if (this.mode !== 'create' || !this.form.valid) {
            return false;
        }

        const newBooleanValue = new CreateBooleanValue();

        newBooleanValue.bool = this.valueFormControl.value;

        // add the submitted new comment to newBooleanValue only if the user has added a comment
        if (
            this.commentFormControl.value !== null &&
            this.commentFormControl.value !== ''
        ) {
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
        if (
            this.commentFormControl.value !== null &&
            this.commentFormControl.value !== ''
        ) {
            updatedBooleanValue.valueHasComment = this.commentFormControl.value;
        }

        return updatedBooleanValue;
    }
}
