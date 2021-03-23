import { animate, state, style, transition, trigger } from '@angular/animations';
import { AfterContentInit, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
    Constants,
    IHasProperty,
    ListNodeInfo,
    ReadOntology,
    ReadProject,
    ResourceClassDefinitionWithAllLanguages,
    ResourcePropertyDefinitionWithAllLanguages
} from '@dasch-swiss/dsp-js';
import { CacheService } from 'src/app/main/cache/cache.service';
import {
    DefaultProperties,
    DefaultProperty,
    PropertyCategory,
    PropertyInfoObject
} from '../default-data/default-properties';
import { DefaultClass } from '../default-data/default-resource-classes';
import { Property } from '../resource-class-form/resource-class-form.service';

@Component({
    selector: 'app-property-info',
    templateUrl: './property-info.component.html',
    styleUrls: ['./property-info.component.scss'],
    animations: [
        // the fade-in/fade-out animation.
        // https://www.kdechant.com/blog/angular-animations-fade-in-and-fade-out
        trigger('simpleFadeAnimation', [

            // the "in" style determines the "resting" state of the element when it is visible.
            state('in', style({ opacity: 1 })),

            // fade in when created.
            transition(':enter', [
                // the styles start from this point when the element appears
                style({ opacity: 0 }),
                // and animate toward the "in" state above
                animate(150)
            ]),

            // fade out when destroyed.
            transition(':leave',
                // fading out uses a different syntax, with the "style" being passed into animate()
                animate(150, style({ opacity: 0 })))
        ])
    ]
})
export class PropertyInfoComponent implements OnInit, AfterContentInit {

    @Input() propDef: ResourcePropertyDefinitionWithAllLanguages;

    @Input() propCard?: IHasProperty;

    @Input() projectCode: string;

    @Output() editResourceProperty: EventEmitter<PropertyInfoObject> = new EventEmitter<PropertyInfoObject>();
    @Output() deleteResourceProperty: EventEmitter<DefaultClass> = new EventEmitter<DefaultClass>();

    // submit res class iri ot open res class
    @Output() clickedOnClass: EventEmitter<ResourceClassDefinitionWithAllLanguages> = new EventEmitter<ResourceClassDefinitionWithAllLanguages>();

    propInfo: Property = new Property();

    propType: DefaultProperty;

    propAttribute: string;
    propAttributeComment: string;

    ontology: ReadOntology;

    project: ReadProject;

    // list of default property types
    propertyTypes: PropertyCategory[] = DefaultProperties.data;

    // list of resource classes where the property is used
    resClasses: ResourceClassDefinitionWithAllLanguages[] = [];

    showActionBubble = false;

    constructor(
        private _cache: CacheService
    ) { }

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
                this.propType = group.elements.find(i =>
                    i.guiEle === this.propDef.guiElement &&
                    (i.objectType === this.propDef.objectType || i.subPropOf === this.propDef.subPropertyOf[0])
                );

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
                (response: ReadOntology) => {
                    this.ontology = response;
                    // get the base ontology of object type
                    const baseOnto = this.propDef.objectType.split('#')[0];
                    if (baseOnto !== response.id) {
                        // get class info from another ontology
                        this._cache.get('currentProjectOntologies').subscribe(
                            (ontologies: ReadOntology[]) => {
                                const onto = ontologies.find(i => i.id === baseOnto);
                                if (!onto && this.propDef.objectType === Constants.Region) {
                                    this.propAttribute = 'Region';
                                } else {
                                    this.propAttribute = onto.classes[this.propDef.objectType].label;
                                    this.propAttributeComment = onto.classes[this.propDef.objectType].comment;
                                }
                            }
                        );
                    } else {
                        this.propAttribute = response.classes[this.propDef.objectType].label;
                        this.propAttributeComment = response.classes[this.propDef.objectType].comment;
                    }

                }
            );
        }

        if (this.propDef.objectType === Constants.ListValue) {
            // this property is a list property
            // get current ontology lists to get linked list information
            this._cache.get('currentOntologyLists').subscribe(
                (response: ListNodeInfo[]) => {
                    const re = /\<([^)]+)\>/;
                    const listIri = this.propDef.guiAttributes[0].match(re)[1];
                    const listUrl = `/project/${this.projectCode}/lists/${encodeURIComponent(listIri)}`;
                    const list = response.find(i => i.id === listIri);
                    this.propAttribute = `<a href="${listUrl}">${list.labels[0].value}</a>`;
                    this.propAttributeComment = (list.comments.length ? list.comments[0].value : null);
                }
            );
        }

        // get all classes where the property is used
        if (!this.propCard) {
            this._cache.get('currentOntology').subscribe(
                (response: ReadOntology) => {
                    this.ontology = response;
                    const classes = response.getAllClassDefinitions();
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

    /**
     * show action bubble with various CRUD buttons when hovered over.
     */
    mouseEnter() {
        this.showActionBubble = true;
    }

    /**
     * hide action bubble with various CRUD buttons when not hovered over.
     */
    mouseLeave() {
        this.showActionBubble = false;
    }

}
