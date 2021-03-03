import { AfterContentInit, Component, Input, OnInit } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import {
    Constants,
    IHasProperty,
    ListNodeInfo,
    ReadOntology,
    ResourceClassDefinitionWithAllLanguages,
    ResourcePropertyDefinitionWithAllLanguages
} from '@dasch-swiss/dsp-js';
import { CacheService } from 'src/app/main/cache/cache.service';
import { PropertyCategory, DefaultProperties, DefaultProperty } from '../default-data/default-properties';
import { Property } from '../resource-class-form/resource-class-form.service';

@Component({
    selector: 'app-property-info',
    templateUrl: './property-info.component.html',
    styleUrls: ['./property-info.component.scss']
})
export class PropertyInfoComponent implements OnInit, AfterContentInit {

    @Input() propDef: ResourcePropertyDefinitionWithAllLanguages;

    @Input() propCard?: IHasProperty;

    @Input() projectcode: string;

    propInfo: Property = new Property();

    propType: DefaultProperty;

    // list of default property types
    propertyTypes: PropertyCategory[] = DefaultProperties.data;

    propAttribute: string;

    // list of resource classes where the property is used
    resClasses: ResourceClassDefinitionWithAllLanguages[] = [];

    constructor(
        private _cache: CacheService,
        private _domSanitizer: DomSanitizer,
        private _matIconRegistry: MatIconRegistry
    ) {

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

    ngOnInit(): void {
        // convert cardinality from js-lib convention to app convention
        // if cardinality is defined; only in resource class view
        if (this.propCard) {
            switch (this.propCard.cardinality) {
                case 0:
                    this.propInfo.multiple = false;
                    this.propInfo.required = true;
                    break;
                case 1:
                    this.propInfo.multiple = false;
                    this.propInfo.required = false;
                    break;
                case 2:
                    this.propInfo.multiple = true;
                    this.propInfo.required = false;
                    break;
                case 3:
                    this.propInfo.multiple = true;
                    this.propInfo.required = true;
                    break;
            }
        }

        // find gui ele from list of default property-types to set type value
        if (this.propDef.guiElement) {
            for (const group of this.propertyTypes) {
                this.propType = group.elements.find(i => i.gui_ele === this.propDef.guiElement && (i.objectType === this.propDef.objectType || i.subPropOf === this.propDef.subPropertyOf[0]));

                if (this.propType) {
                    break;
                }
            }
        }

    }

    ngAfterContentInit() {

        if (this.propDef.isLinkProperty) {
            // this property is a link property to another resource class
            // get current ontology to get linked res class information
            this._cache.get('currentOntology').subscribe(
                (ontology: ReadOntology) => {
                    // get the base ontology of object type
                    const baseOnto = this.propDef.objectType.split('#')[0];
                    if (baseOnto !== ontology.id) {
                        // get class info from another ontology
                        this._cache.get('currentProjectOntologies').subscribe(
                            (ontologies: ReadOntology[]) => {
                                const onto = ontologies.find(i => i.id === baseOnto);
                                if (!onto && this.propDef.objectType === Constants.Region) {
                                    this.propAttribute = 'Region';
                                } else {
                                    this.propAttribute = onto.classes[this.propDef.objectType].label;
                                }
                            }
                        );
                    } else {
                        this.propAttribute = ontology.classes[this.propDef.objectType].label;
                    }

                }
            );
        }

        if (this.propDef.objectType === Constants.ListValue) {
            // this property is a list property
            // get current ontology lists to get linked list information
            this._cache.get('currentOntologyLists').subscribe(
                (response: ListNodeInfo[]) => {
                    const re: RegExp = /\<([^)]+)\>/;
                    const listIri = this.propDef.guiAttributes[0].match(re)[1];
                    const listUrl = `/project/${this.projectcode}/lists/${encodeURIComponent(listIri)}`;
                    const list = response.find(i => i.id === listIri);
                    this.propAttribute = `<a href="${listUrl}">${list.labels[0].value}</a>`;
                }
            );
        }

        // get all classes where the property is used
        if (!this.propCard) {
            this._cache.get('currentOntology').subscribe(
                (ontology: ReadOntology) => {
                    const classes = ontology.getAllClassDefinitions();
                    for (const c of classes) {
                        if (c.propertiesList.find(i => i.propertyIndex === this.propDef.id)) {
                            this.resClasses.push(c as ResourceClassDefinitionWithAllLanguages);
                        }
                        // const splittedSubClass = ontology.classes[c].subClassOf[0].split('#');

                        // if (splittedSubClass[0] !== Constants.StandoffOntology && splittedSubClass[1] !== 'StandoffTag' && splittedSubClass[1] !== 'StandoffLinkTag') {
                        //     this.ontoClasses.push(this.ontology.classes[c]);
                        // }
                    }
                }
            );



        }

    }

}
