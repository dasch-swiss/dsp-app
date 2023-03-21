import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import {
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { Constants } from '@dasch-swiss/dsp-js';
import { PropertyValue, Value, ValueLiteral } from '../operator';

// https://stackoverflow.com/questions/45661010/dynamic-nested-reactive-form-expressionchangedafterithasbeencheckederror
const resolvedPromise = Promise.resolve(null);

@Component({
    selector: 'app-search-int-value',
    templateUrl: './search-int-value.component.html',
    styleUrls: ['./search-int-value.component.scss'],
})
export class SearchIntValueComponent
    implements OnInit, OnDestroy, PropertyValue
{
    // parent FormGroup
    @Input() formGroup: UntypedFormGroup;

    type = Constants.IntValue;

    form: UntypedFormGroup;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {}

    ngOnInit() {
        this.form = this._fb.group({
            integerValue: [
                null,
                Validators.compose([
                    Validators.required,
                    Validators.pattern(/^-?\d+$/),
                ]),
            ], // only allow for integer values (no fractions)
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
            String(this.form.value.integerValue),
            Constants.XsdInteger
        );
    }
}
