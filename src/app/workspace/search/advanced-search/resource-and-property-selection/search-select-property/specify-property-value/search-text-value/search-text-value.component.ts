import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { PropertyValue, Value, ValueLiteral } from '../operator';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Constants } from '@dasch-swiss/dsp-js';

// https://stackoverflow.com/questions/45661010/dynamic-nested-reactive-form-expressionchangedafterithasbeencheckederror
const resolvedPromise = Promise.resolve(null);

@Component({
    selector: 'app-search-text-value',
    templateUrl: './search-text-value.component.html',
    styleUrls: ['./search-text-value.component.scss']
})
export class SearchTextValueComponent implements OnInit, OnDestroy, PropertyValue {

    // parent FormGroup
    @Input() formGroup: UntypedFormGroup;

    type = Constants.TextValue;

    form: UntypedFormGroup;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {
    }

    ngOnInit() {

        this.form = this._fb.group({
            textValue: [null, Validators.required]
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
        return new ValueLiteral(String(this.form.value.textValue), Constants.XsdString);
    }

}
