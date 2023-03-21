import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import {
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { Constants } from '@dasch-swiss/dsp-js';
import { Value, ValueLiteral } from '../operator';

// https://stackoverflow.com/questions/45661010/dynamic-nested-reactive-form-expressionchangedafterithasbeencheckederror
const resolvedPromise = Promise.resolve(null);

@Component({
    selector: 'app-search-decimal-value',
    templateUrl: './search-decimal-value.component.html',
    styleUrls: ['./search-decimal-value.component.scss'],
})
export class SearchDecimalValueComponent implements OnInit, OnDestroy {
    // parent FormGroup
    @Input() formGroup: UntypedFormGroup;

    type = Constants.DecimalValue;

    form: UntypedFormGroup;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {}

    ngOnInit() {
        this.form = this._fb.group({
            decimalValue: [null, Validators.compose([Validators.required])],
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
            String(this.form.value.decimalValue),
            Constants.XsdDecimal
        );
    }
}
