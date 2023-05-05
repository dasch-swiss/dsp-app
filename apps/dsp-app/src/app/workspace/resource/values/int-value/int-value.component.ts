import {
    Component,
    Inject,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import {
    CreateIntValue,
    ReadIntValue,
    UpdateIntValue,
} from '@dasch-swiss/dsp-js';
import { BaseValueDirective } from '@dsp-app/src/app/main/directive/base-value.directive';
import { CustomRegex } from '../custom-regex';
import { ValueErrorStateMatcher } from '../value-error-state-matcher';

const DECIMAL_VALUE = 10;

@Component({
    selector: 'app-int-value',
    templateUrl: './int-value.component.html',
    styleUrls: ['./int-value.component.scss'],
})
export class IntValueComponent
    extends BaseValueDirective
    implements OnInit, OnChanges, OnDestroy
{
    @Input() displayValue?: ReadIntValue;

    matcher = new ValueErrorStateMatcher();

    customValidators = [Validators.pattern(CustomRegex.INT_REGEX)]; // only allow for integer values (no fractions)

    constructor(@Inject(FormBuilder) protected _fb: FormBuilder) {
        super();
    }

    getInitValue(): number | null {
        if (this.displayValue !== undefined) {
            return this.displayValue.int;
        } else {
            return null;
        }
    }

    ngOnInit() {
        super.ngOnInit();
    }

    ngOnChanges(): void {
        this.resetFormControl();
    }

    ngOnDestroy(): void {
        super.ngOnDestroy();
    }

    getNewValue(): CreateIntValue | false {
        if (this.mode !== 'create' || !this.form.valid || this.isEmptyVal()) {
            return false;
        }

        const newIntValue = new CreateIntValue();

        newIntValue.int = parseInt(this.valueFormControl.value, DECIMAL_VALUE);

        if (this.commentFormControl.value) {
            newIntValue.valueHasComment = this.commentFormControl.value;
        }

        return newIntValue;
    }

    getUpdatedValue(): UpdateIntValue | false {
        if (this.mode !== 'update' || !this.form.valid) {
            return false;
        }

        const updatedIntValue = new UpdateIntValue();

        updatedIntValue.id = this.displayValue.id;

        updatedIntValue.int = parseInt(
            this.valueFormControl.value,
            DECIMAL_VALUE
        );

        // add the submitted comment to updatedIntValue only if user has added a comment
        if (this.commentFormControl.value) {
            updatedIntValue.valueHasComment = this.commentFormControl.value;
        }

        return updatedIntValue;
    }
}
