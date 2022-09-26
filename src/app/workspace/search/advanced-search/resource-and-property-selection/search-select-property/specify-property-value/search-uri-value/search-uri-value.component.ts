import { Component, Inject, Input, OnInit, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Constants } from '@dasch-swiss/dsp-js';
import { CustomRegex } from 'src/app/workspace/resource/values/custom-regex';
import { PropertyValue, Value, ValueLiteral } from '../operator';

// https://stackoverflow.com/questions/45661010/dynamic-nested-reactive-form-expressionchangedafterithasbeencheckederror
const resolvedPromise = Promise.resolve(null);

@Component({
    selector: 'app-search-uri-value',
    templateUrl: './search-uri-value.component.html',
    styleUrls: ['./search-uri-value.component.scss']
})
export class SearchUriValueComponent implements OnInit, OnDestroy, PropertyValue {

    // parent FormGroup
    @Input() formGroup: UntypedFormGroup;

    type = Constants.UriValue;

    form: UntypedFormGroup;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {

    }

    ngOnInit() {

        this.form = this._fb.group({
            uriValue: [null, Validators.compose([Validators.required, Validators.pattern(CustomRegex.URI_REGEX)])]
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

        return new ValueLiteral(String(this.form.value.uriValue), Constants.XsdAnyUri);
    }

}
