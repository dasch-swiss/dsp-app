import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatOption } from '@angular/material/core';
import { MatIconRegistry } from '@angular/material/icon';
import { MatSelectChange } from '@angular/material/select';
import { DomSanitizer } from '@angular/platform-browser';
import { ApiResponseError, ClassDefinition, ListNodeInfo, ReadOntology, ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';
import { NotificationService } from '@dasch-swiss/dsp-ui';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { CacheService } from 'src/app/main/cache/cache.service';
import { DefaultProperties, Property, PropertyValue } from '../default-data/default-properties';

// TODO: should be removed and replaced by AutocompleteItem from dsp-ui
/**
 * a list, which is used in the mat-autocomplete form field
 * contains objects with id and name. the id is usual the iri
 */
export interface AutocompleteItem {
    iri: string;
    name: string;
    label?: string;
}

// https://stackoverflow.com/questions/45661010/dynamic-nested-reactive-form-expressionchangedafterithasbeencheckederror
// const resolvedPromise = Promise.resolve(null);

@Component({
    selector: 'app-property-form',
    templateUrl: './property-form.component.html',
    styleUrls: ['./property-form.component.scss']
})
export class PropertyFormComponent implements OnInit {

    @Input() propertyForm: FormGroup;

    @Input() index: number;

    @Output() deleteProperty: EventEmitter<number> = new EventEmitter();

    name = new FormControl();
    label = new FormControl();
    type = new FormControl();
    multiple = new FormControl();
    required = new FormControl();

    // selection of default property types
    propertyTypes: Property[] = DefaultProperties.data;

    showGuiAttr: boolean = false;

    // list of project specific lists (TODO: probably we have to add default knora lists?!)
    lists: ListNodeInfo[];

    // current ontology
    ontology: ReadOntology;

    // reresource classs in this ontology
    reresourceClasss: ClassDefinition[] = [];

    // list of existing properties
    properties: AutocompleteItem[] = [];

    filteredProperties: Observable<AutocompleteItem[]>;

    selectTypeLabel: string; // = this.propertyTypes[0].group + ': ' + this.propertyTypes[0].elements[0].label;
    selectedGroup: string;

    constructor(
        private _cache: CacheService,
        private _domSanitizer: DomSanitizer,
        private _matIconRegistry: MatIconRegistry,
        private _notification: NotificationService) {

        // special icons for property type
        this._matIconRegistry.addSvgIcon(
            'integer_icon',
            this._domSanitizer.bypassSecurityTrustResourceUrl('/assets/images/integer-icon.svg')
        );
        this._matIconRegistry.addSvgIcon(
            'decimal_icon',
            this._domSanitizer.bypassSecurityTrustResourceUrl('/assets/images/decimal-icon.svg')
        );
    }

    ngOnInit() {


        if (this.propertyForm) {
            // init list of property types with first element
            this.propertyForm.patchValue({ type: this.propertyTypes[0].elements[0] });
        }

        this._cache.get('currentOntology').subscribe(
            (response: ReadOntology) => {
                this.ontology = response;

                // set various lists to select from
                // a) in case of link value:
                // set list of reresource classes from response; needed for linkValue
                const classKeys: string[] = Object.keys(response.classes);
                for (const c of classKeys) {
                    this.reresourceClasss.push(this.ontology.classes[c]);
                }

                // b) in case of already existing label:
                // set list of properties from response; needed for autocomplete in label to reuse existing property
                const propKeys: string[] = Object.keys(response.properties);
                for (const p of propKeys) {
                    if (this.ontology.properties[p].objectType !== 'http://api.knora.org/ontology/knora-api/v2#LinkValue') {
                        const existingProperty: AutocompleteItem = {
                            iri: this.ontology.properties[p].id,
                            name: this.ontology.properties[p].id.split('#')[1],
                            label: this.ontology.properties[p].label
                        };

                        this.properties.push(existingProperty);
                    }

                }
            },
            (error: ApiResponseError) => {
                this._notification.openSnackBar(error);
            }
        );

        // c) in case of list value:
        // set list of lists; needed for listValue
        this._cache.get('currentOntologyLists').subscribe(
            (response: ListNodeInfo[]) => {
                this.lists = response;
            },
            (error: ApiResponseError) => {
                this._notification.openSnackBar(error);
            }
        );

        this.filteredProperties = this.propertyForm.controls['label'].valueChanges
            .pipe(
                startWith(''),
                map(prop => prop.length >= 2 ? this.filter(this.properties, prop) : [])
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
            prop.label.toLowerCase().includes(label.toLowerCase())
        );
    }

    updateAttributeField(event: MatSelectChange) {

        // reset value of guiAttr
        this.propertyForm.controls['guiAttr'].setValue(undefined);
        // depending on the selected property type,
        // we have to define gui element attributes
        // e.g. iri of list or connected reresource class
        switch (event.value.subPropOf) {
            case 'knora-api:ListValue':
            case 'knora-api:LinkValue':
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
     * @param  {MatOption} option
     */
    updateFieldsDependingOnLabel(option: MatOption) {
        this.propertyForm.controls['name'].setValue(option.value.name);

        this.propertyForm.controls['label'].setValue(option.value.label);
        this.propertyForm.controls['label'].disable();

        if (this.ontology.properties[option.value.iri] instanceof ResourcePropertyDefinition) {
            const tempProp: any = this.ontology.properties[option.value.iri];

            let obj: PropertyValue;
            // find gui ele from list of default property-types to set type value
            for (let group of this.propertyTypes) {
                obj = group.elements.find(i => i.gui_ele === 'salsah-gui:' + tempProp.guiElement.split('#')[1]);

                if (obj) {
                    this.propertyForm.controls['type'].setValue(obj);
                    break;
                }
            }

            switch (tempProp.guiElement) {
                // prop type is a list
                case 'http://api.knora.org/ontology/salsah-gui/v2#List':
                case 'http://api.knora.org/ontology/salsah-gui/v2#Radio':
                    // gui attribute value for lists looks as follow: hlist=<http://rdfh.ch/lists/00FF/73d0ec0302>
                    // get index from guiAttr array where value starts with hlist=
                    let i = tempProp.guiAttributes.findIndex(element => element.includes('hlist'));

                    // find content beteween pointy brackets to get list irir
                    const re: RegExp = /\<([^)]+)\>/;
                    const listIri = tempProp.guiAttributes[i].match(re)[1];

                    this.showGuiAttr = true;
                    this.propertyForm.controls['guiAttr'].setValue(listIri);
                    this.propertyForm.controls['guiAttr'].disable();
                    break;
                // prop type is resource pointer
                case 'http://api.knora.org/ontology/salsah-gui/v2#Searchbox':

                    this.showGuiAttr = true;
                    this.propertyForm.controls['guiAttr'].setValue(tempProp.objectType);
                    this.propertyForm.controls['guiAttr'].disable();
                    break;

                default:
                    this.showGuiAttr = false;

            }

        }
        this.propertyForm.controls['type'].disable();

    }

    resetProperty(ev: Event) {
        ev.preventDefault();

        this.propertyForm.controls['name'].reset();
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
