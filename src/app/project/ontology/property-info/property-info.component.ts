import { animate, state, style, transition, trigger } from '@angular/animations';
import { AfterContentInit, Component, EventEmitter, Inject, Input, OnChanges, Output } from '@angular/core';
import {
    ApiResponseError,
    CanDoResponse,
    Constants,
    IHasProperty,
    KnoraApiConnection,
    ListNodeInfo,
    ReadOntology,
    ReadProject,
    ResourceClassDefinitionWithAllLanguages,
    ResourcePropertyDefinitionWithAllLanguages,
    UpdateOntology,
    UpdateResourceClassCardinality
} from '@dasch-swiss/dsp-js';
import { CacheService } from 'src/app/main/cache/cache.service';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { ErrorHandlerService } from 'src/app/main/services/error-handler.service';
import {
    DefaultProperties,
    DefaultProperty,
    PropertyCategory,
    PropertyInfoObject
} from '../default-data/default-properties';
import { DefaultClass } from '../default-data/default-resource-classes';
import { OntologyService } from '../ontology.service';

// property data structure
export class Property {
    iri: string;
    label: string;
    type: DefaultProperty;
    multiple: boolean;
    required: boolean;
    guiAttr: string;
    // permission: string;

    constructor(
        iri?: string,
        label?: string,
        type?: any,
        multiple?: boolean,
        required?: boolean,
        guiAttr?: string
        // permission?: string
    ) {
        this.iri = iri;
        this.label = label;
        this.type = type;
        this.multiple = multiple;
        this.required = required;
        this.guiAttr = guiAttr;
        // this.permission = permission;
    }
}

export interface ShortInfo {
    id: string;
    label: string;
    comment: string;
}

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
export class PropertyInfoComponent implements OnChanges, AfterContentInit {

    @Input() propDef: ResourcePropertyDefinitionWithAllLanguages;

    @Input() propCard?: IHasProperty;

    @Input() resourceIri?: string;

    @Input() projectUuid: string;

    @Input() projectStatus: boolean;

    @Input() lastModificationDate?: string;

    @Input() userCanEdit: boolean; // is user a project admin or sys admin?

    // event emitter when the lastModificationDate changed; bidirectional binding with lastModificationDate parameter
    @Output() lastModificationDateChange: EventEmitter<string> = new EventEmitter<string>();

    @Output() editResourceProperty: EventEmitter<PropertyInfoObject> = new EventEmitter<PropertyInfoObject>();
    @Output() deleteResourceProperty: EventEmitter<DefaultClass> = new EventEmitter<DefaultClass>();
    @Output() removePropertyFromClass: EventEmitter<DefaultClass> = new EventEmitter<DefaultClass>();

    // submit res class iri to open res class (not yet implemented)
    @Output() clickedOnClass: EventEmitter<ShortInfo> = new EventEmitter<ShortInfo>();

    propInfo: Property = new Property();

    propType: DefaultProperty;

    propAttribute: string;
    propAttributeComment: string;

    propCanBeDeleted: boolean;

    ontology: ReadOntology;

    project: ReadProject;

    // list of default property types
    defaultProperties: PropertyCategory[] = DefaultProperties.data;

    // list of resource classes where the property is used
    resClasses: ShortInfo[] = [];

    // disable edit property button in case the property type is not supported in DSP-APP
    disableEditProperty = false;

    showActionBubble = false;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _errorHandler: ErrorHandlerService,
        private _ontoService: OntologyService
    ) {

        this._cache.get('currentOntology').subscribe(
            (response: ReadOntology) => {
                this.ontology = response;
            }
        );
    }

    ngOnChanges(): void {

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

        // get info about subproperties, if they are not a subproperty of knora base ontology
        // in this case add it to the list of subproperty iris
        const superProp = this._ontoService.getSuperProperty(this.propDef);
        if (superProp) {
            if (this.propDef.subPropertyOf.indexOf(superProp) === -1) {
                this.propDef.subPropertyOf.push(superProp);
            }
        }

        // get the default property type for this property
        this._ontoService.getDefaultPropType(this.propDef).subscribe(
            (prop: DefaultProperty) => {
                this.propType = prop;
            }
        );

    }

    ngAfterContentInit() {

        if (this.propDef.isLinkProperty) {
            // this property is a link property to another resource class
            // get current ontology to get linked res class information

            // get the base ontology of object type
            const baseOnto = this.propDef.objectType.split('#')[0];
            if (baseOnto !== this.ontology.id) {
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
                    },
                    () => {} // don't log error to rollbar if 'currentProjectOntologies' does not exist in the cache
                );
            } else {
                this.propAttribute = this.ontology.classes[this.propDef.objectType].label;
                this.propAttributeComment = this.ontology.classes[this.propDef.objectType].comment;
            }
        }

        if (this.propDef.objectType === Constants.ListValue) {
            // this property is a list property
            // get current ontology lists to get linked list information
            this._cache.get('currentOntologyLists').subscribe(
                (response: ListNodeInfo[]) => {
                    const re = /\<([^)]+)\>/;
                    const listIri = this.propDef.guiAttributes[0].match(re)[1];
                    const listUrl = `/project/${this.projectUuid}/lists/${encodeURIComponent(listIri)}`;
                    const list = response.find(i => i.id === listIri);
                    this.propAttribute = `<a href="${listUrl}">${list.labels[0].value}</a>`;
                    this.propAttributeComment = (list.comments.length ? list.comments[0].value : null);
                }
            );
        }

        // get all classes where the property is used
        if (!this.propCard) {
            this.resClasses = [];
            this._cache.get('currentProjectOntologies').subscribe(
                (ontologies: ReadOntology[]) => {
                    ontologies.forEach(onto => {
                        const classes = onto.getAllClassDefinitions();
                        classes.forEach(resClass => {
                            if (resClass.propertiesList.find(prop => prop.propertyIndex === this.propDef.id)) {
                                // build own resClass object with id, label and comment
                                const propOfClass: ShortInfo = {
                                    id: resClass.id,
                                    label: resClass.label,
                                    comment: onto.label + (resClass.comment ? ': ' + resClass.comment : '')
                                };
                                this.resClasses.push(propOfClass);
                            }
                        });
                    });
                },
                () => {} // don't log error to rollbar if 'currentProjectOntologies' does not exist in the cache
            );
        }
    }

    /**
     * determines whether property can be deleted
     * resp. removed from res class if we have the cardinality info
     */
    canBeDeleted() {
        if (!this.propCard) {
            // check if the property can be deleted
            this._dspApiConnection.v2.onto.canDeleteResourceProperty(this.propDef.id).subscribe(
                (canDoRes: CanDoResponse) => {
                    this.propCanBeDeleted = canDoRes.canDo;
                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                }
            );
        } else {
            // check if the property can be removed from res class
            if (this.lastModificationDate) {
                const onto = new UpdateOntology<UpdateResourceClassCardinality>();

                onto.lastModificationDate = this.lastModificationDate;

                onto.id = this.ontology.id;

                const delCard = new UpdateResourceClassCardinality();

                delCard.id = this.resourceIri;

                delCard.cardinalities = [];

                delCard.cardinalities = [this.propCard];
                onto.entity = delCard;

                // property can only be removed from class if it's not inherited from another prop or class
                if (this.propCard.isInherited) {
                    this.propCanBeDeleted = false;
                } else {
                    this._dspApiConnection.v2.onto.canDeleteCardinalityFromResourceClass(onto).subscribe(
                        (canDoRes: CanDoResponse) => {
                            this.propCanBeDeleted = canDoRes.canDo;
                        }
                        // since this request runs on mouseover, it can always
                        // ends in a EditConflictException because of a wrong lastModificationDate.
                        // so, it doesn't make sense to handle the error here and to open the snackbar
                    );
                }


            }
        }
    }

    /**
     * show action bubble with various CRUD buttons when hovered over.
     */
    mouseEnter() {
        if (this.userCanEdit) {
            this.canBeDeleted();
            this.showActionBubble = true;
        }
    }

    /**
     * hide action bubble with various CRUD buttons when not hovered over.
     */
    mouseLeave() {
        this.showActionBubble = false;
    }

}
