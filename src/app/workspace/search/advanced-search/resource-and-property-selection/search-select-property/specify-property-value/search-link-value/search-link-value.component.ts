import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Constants, KnoraApiConnection, ReadResource, ReadResourceSequence } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { IRI, PropertyValue, Value } from '../operator';

// https://stackoverflow.com/questions/45661010/dynamic-nested-reactive-form-expressionchangedafterithasbeencheckederror
const resolvedPromise = Promise.resolve(null);

@Component({
    selector: 'app-search-link-value',
    templateUrl: './search-link-value.component.html',
    styleUrls: ['./search-link-value.component.scss']
})
export class SearchLinkValueComponent implements OnInit, OnDestroy, PropertyValue {

    // parent FormGroup
    @Input() formGroup: UntypedFormGroup;

    type = Constants.LinkValue;

    form: UntypedFormGroup;

    resources: ReadResource[];

    private _restrictToResourceClass: string;

    @Input()
    set restrictResourceClass(value: string) {
        this._restrictToResourceClass = value;
    }

    get restrictResourceClass() {
        return this._restrictToResourceClass;
    }

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        @Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {
    }

    ngOnInit() {
        this.form = this._fb.group({
            resource: [null, Validators.compose([
                Validators.required,
                this.validateResource
            ])]
        });

        this.form.valueChanges.subscribe((data) => {
            this.searchByLabel(data.resource);
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

    /**
     * displays a selected resource using its label.
     *
     * @param resource the resource to be displayed (or no selection yet).
     */
    displayResource(resource: ReadResource | null) {

        // null is the initial value (no selection yet)
        if (resource !== null) {
            return resource.label;
        }
    }

    /**
     * search for resources whose labels contain the given search term, restricting to to the given properties object constraint.
     *
     * @param searchTerm the term to search for.
     */
    searchByLabel(searchTerm: string) {

        // at least 3 characters are required
        if (searchTerm.length >= 3) {
            this._dspApiConnection.v2.search.doSearchByLabel(searchTerm, 0, { limitToResourceClass: this._restrictToResourceClass }).subscribe(
                (response: ReadResourceSequence) => {
                    this.resources = response.resources;
                });
        } else {
            // clear selection
            this.resources = undefined;
        }

    }

    /**
     * checks that the selection is a [[ReadResource]].
     *
     * null is returned if the value is valid: https://angular.io/guide/form-validation#custom-validators
     *
     * @param form element whose value has to be checked.
     */
    validateResource(c: UntypedFormControl) {

        const isValidResource = (c.value instanceof ReadResource);

        if (isValidResource) {
            return null;
        } else {
            return {
                noResource: {
                    value: c.value
                }
            };
        }

    }

    getValue(): Value {
        return new IRI(this.form.value.resource.id);
    }

}
