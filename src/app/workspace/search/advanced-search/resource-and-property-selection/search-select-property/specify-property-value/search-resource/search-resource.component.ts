import { Component, Inject, Input, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { Constants } from '@dasch-swiss/dsp-js';
import { ResourceAndPropertySelectionComponent } from '../../../resource-and-property-selection.component';
import { LinkedResource, PropertyValue, PropertyWithValue, Value } from '../operator';

// https://stackoverflow.com/questions/45661010/dynamic-nested-reactive-form-expressionchangedafterithasbeencheckederror
const resolvedPromise = Promise.resolve(null);

@Component({
    selector: 'app-search-resource',
    templateUrl: './search-resource.component.html',
    styleUrls: ['./search-resource.component.scss']
})
export class SearchResourceComponent implements OnInit, PropertyValue {

    // parent FormGroup
    @Input() formGroup: UntypedFormGroup;

    @Input() restrictResourceClass: string;

    // reference to the component that controls the resource class selection
    @ViewChild('resAndPropSel') resourceAndPropertySelection: ResourceAndPropertySelectionComponent;

    type = Constants.Resource;

    form: UntypedFormGroup;

    ontology: string;

    constructor(@Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder) {
    }

    ngOnInit(): void {

        this.form = this._fb.group({});

        resolvedPromise.then(() => {
            this.formGroup.addControl('propValue', this.form);
        });

        // get ontology from restriction
        this.ontology = this.restrictResourceClass.split('#')[0];
    }

    getValue(): Value {

        const resClassOption = this.resourceAndPropertySelection.resourceClassComponent.selectedResourceClassIri;

        let resClass;

        if (resClassOption !== false) {
            resClass = resClassOption;
        }

        const properties: PropertyWithValue[] = this.resourceAndPropertySelection.propertyComponents.map(
            (propComp) => propComp.getPropertySelectedWithValue()
        );

        return new LinkedResource(properties, resClass);
    }

}
