import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { PropertyValue, Value, ValueLiteral } from '../operator';
import {
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { Constants } from '@dasch-swiss/dsp-js';

// https://stackoverflow.com/questions/45661010/dynamic-nested-reactive-form-expressionchangedafterithasbeencheckederror
const resolvedPromise = Promise.resolve(null);

@Component({
    selector: 'app-search-boolean-value',
    templateUrl: './search-boolean-value.component.html',
    styleUrls: ['./search-boolean-value.component.scss'],
})
export class SearchBooleanValueComponent
    implements OnInit, OnDestroy, PropertyValue
{
    // parent FormGroup
    @Input() formGroup: UntypedFormGroup;

    type = Constants.BooleanValue;

    form: UntypedFormGroup;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {}

    ngOnInit() {
        this.form = this._fb.group({
            booleanValue: [false, Validators.compose([Validators.required])],
        });

        resolvedPromise.then(() => {
            // add form to the parent form group
            this.formGroup.addControl('propValue', this.form);
        });
    }

    ngOnDestroy() {
        // remove form from the parent form group
        resolvedPromise.then(() => {
            this.formGroup.removeControl('propValue');
        });
    }

    getValue(): Value {
        return new ValueLiteral(
            String(this.form.value.booleanValue),
            Constants.XsdBoolean
        );
    }
}
