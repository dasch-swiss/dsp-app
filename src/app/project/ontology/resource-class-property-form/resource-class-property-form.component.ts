import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSelectChange } from '@angular/material/select';
import {
    ApiResponseError,
    ClassDefinition,
    Constants,
    ListNodeInfo,
    ReadOntology,
    ResourcePropertyDefinition
} from '@dasch-swiss/dsp-js';
import { AutocompleteItem } from '@dasch-swiss/dsp-ui';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { CacheService } from 'src/app/main/cache/cache.service';
import { ErrorHandlerService } from 'src/app/main/error/error-handler.service';
import { DefaultProperties, DefaultProperty, PropertyCategory } from '../default-data/default-properties';

@Component({
    selector: 'app-resource-class-property-form',
    templateUrl: './resource-class-property-form.component.html',
    styleUrls: ['./resource-class-property-form.component.scss']
})
export class ResourceClassPropertyFormComponent implements OnInit {

    @Input() propertyForm: FormGroup;

    @Input() index: number;

    @Input() resClassIri?: string;

    @Output() deleteProperty: EventEmitter<number> = new EventEmitter();

    ontology: ReadOntology;
    // selection of default property types
    propertyTypes: PropertyCategory[] = DefaultProperties.data;

    showGuiAttr = false;

    // list of project specific lists (TODO: probably we have to add default knora lists?!)
    lists: ListNodeInfo[];

    // resource classes in this ontology
    resourceClass: ClassDefinition[] = [];

    // list of existing properties
    properties: AutocompleteItem[] = [];

    filteredProperties: Observable<AutocompleteItem[]>;

    selectTypeLabel: string; // = this.propertyTypes[0].group + ': ' + this.propertyTypes[0].elements[0].label;
    selectedGroup: string;

    existingProperty: boolean;

    loading = false;

    dspConstants = Constants;

    constructor(
        private _cache: CacheService,
        private _errorHandler: ErrorHandlerService
    ) { }

    ngOnInit() {

        this._cache.get('currentOntology').subscribe(
            (response: ReadOntology) => {
                this.ontology = response;

                // set various lists to select from
                // a) in case of link value:
                // set list of resource classes from response; needed for linkValue
                const classKeys: string[] = Object.keys(response.classes);
                for (const c of classKeys) {
                    this.resourceClass.push(this.ontology.classes[c]);
                }

                // b) in case of already existing label:
                // set list of properties from response; needed for autocomplete in label to reuse existing property
                const propKeys: string[] = Object.keys(response.properties);
                for (const p of propKeys) {
                    const prop = this.ontology.properties[p];
                    if (prop.objectType !== Constants.LinkValue && prop.objectType !== this.resClassIri) {
                        const existingProperty: AutocompleteItem = {
                            iri: this.ontology.properties[p].id,
                            name: this.ontology.properties[p].id.split('#')[1],
                            label: this.ontology.properties[p].label
                        };
                        this.properties.push(existingProperty);
                    }
                }

                if (this.propertyForm) {
                    // init list of property types with first element
                    this.propertyForm.patchValue({ type: this.propertyTypes[0].elements[0] });

                    if (this.propertyForm.value.label) {

                        const existingProp: AutocompleteItem = {
                            iri: this.propertyForm.value.iri,
                            label: this.propertyForm.value.label,
                            name: ''
                        };

                        // edit mode: this prop value exists already
                        this.loading = true;
                        this.updateFieldsDependingOnLabel(existingProp);
                    }
                }
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );

        // c) in case of list value:
        // set list of lists; needed for listValue
        this._cache.get('currentOntologyLists').subscribe(
            (response: ListNodeInfo[]) => {
                this.lists = response;
            }
        );

        this.filteredProperties = this.propertyForm.controls['label'].valueChanges
            .pipe(
                startWith(''),
                map(prop => prop.length >= 0 ? this.filter(this.properties, prop) : [])
            );
    }

    /**
     * filter a list while typing in auto complete input field
     * @param list List of options
     * @param label Value to filter by
     * @returns Filtered list of options
     */
    filter(list: AutocompleteItem[], label: string) {
        return list.filter(prop =>
            prop.label?.toLowerCase().includes(label.toLowerCase())
        );
    }

    updateAttributeField(event: MatSelectChange) {

        // reset value of guiAttr
        this.propertyForm.controls['guiAttr'].setValue(undefined);
        // depending on the selected property type,
        // we have to define gui element attributes
        // e.g. iri of list or connected resource class
        switch (event.value.objectType) {
            case Constants.ListValue:
            case Constants.LinkValue:
                this.showGuiAttr = true;
                this.propertyForm.controls['guiAttr'].setValidators([
                    Validators.required
                ]);
                this.propertyForm.controls['guiAttr'].updateValueAndValidity();
                break;

            default:
                this.propertyForm.controls['guiAttr'].clearValidators();
                this.propertyForm.controls['guiAttr'].updateValueAndValidity();
                this.showGuiAttr = false;
        }

    }

    /**
     * @param {MatOption} option
     */
    updateFieldsDependingOnLabel(option: AutocompleteItem) {
        this.propertyForm.controls['iri'].setValue(option.iri);

        // set label and disable the input
        this.propertyForm.controls['label'].setValue(option.label);
        this.propertyForm.controls['label'].disable();

        // find corresponding property type

        if (this.ontology.properties[option.iri] instanceof ResourcePropertyDefinition) {
            const tempProp: any | ResourcePropertyDefinition = this.ontology.properties[option.iri];

            let obj: DefaultProperty;
            // find gui ele from list of default property-types to set type value
            for (const group of this.propertyTypes) {
                obj = group.elements.find(i => i.guiEle === tempProp.guiElement && (i.objectType === tempProp.objectType || i.subPropOf === tempProp.subPropertyOf[0]));

                if (obj) {
                    this.propertyForm.controls['type'].setValue(obj);
                    break;
                }
            }

            switch (tempProp.guiElement) {
                // prop type is a list
                case Constants.SalsahGui + Constants.HashDelimiter + 'List':
                case Constants.SalsahGui + Constants.HashDelimiter + 'Radio':
                    // gui attribute value for lists looks as follow: hlist=<http://rdfh.ch/lists/00FF/73d0ec0302>
                    // get index from guiAttr array where value starts with hlist=
                    const i = tempProp.guiAttributes.findIndex(element => element.includes('hlist'));

                    // find content beteween pointy brackets to get list iri
                    const re = /\<([^)]+)\>/;
                    const listIri = tempProp.guiAttributes[i].match(re)[1];

                    this.showGuiAttr = true;
                    this.propertyForm.controls['guiAttr'].setValue(listIri);
                    this.propertyForm.controls['guiAttr'].disable();
                    break;

                // prop type is resource pointer
                case Constants.SalsahGui + Constants.HashDelimiter + 'Searchbox':

                    this.showGuiAttr = true;
                    this.propertyForm.controls['guiAttr'].setValue(tempProp.objectType);
                    this.propertyForm.controls['guiAttr'].disable();
                    break;

                default:
                    this.showGuiAttr = false;
            }
        }
        this.propertyForm.controls['type'].disable();
        this.existingProperty = true;
    }

    resetProperty(ev: Event) {
        ev.preventDefault();
        this.existingProperty = false;

        this.propertyForm.controls['iri'].reset();
        this.propertyForm.controls['label'].setValue('');
        this.propertyForm.controls['label'].enable();
        this.propertyForm.controls['type'].setValue(this.propertyTypes[0].elements[0]);
        this.propertyForm.controls['type'].enable();
        this.propertyForm.controls['guiAttr'].setValue(undefined);
        this.propertyForm.controls['guiAttr'].enable();

        this.propertyForm.controls['multiple'].reset();
        this.propertyForm.controls['required'].reset();
    }


}
