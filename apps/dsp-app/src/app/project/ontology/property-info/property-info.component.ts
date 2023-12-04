import {
    animate,
    state,
    style,
    transition,
    trigger,
} from '@angular/animations';
import {
    AfterContentInit,
    Component,
    EventEmitter,
    Inject,
    Input,
    OnChanges,
    Output,
} from '@angular/core';
import {
    ApiResponseError,
    CanDoResponse,
    Constants,
    KnoraApiConnection,
    ReadProject,
    ResourcePropertyDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, getAllEntityDefinitionsAsArray } from '@dasch-swiss/vre/shared/app-config';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import {
    DefaultClass,
    DefaultProperties,
    DefaultProperty,
    PropertyCategory,
    PropertyInfoObject,
} from '@dasch-swiss/vre/shared/app-helper-services';
import { OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
import { ListsSelectors, OntologiesSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';

// property data structure
export class Property {
    iri: string;
    label: string;
    type: DefaultProperty;
    multiple: boolean;
    required: boolean;
    guiAttr: string;

    constructor(
        iri?: string,
        label?: string,
        type?: any,
        multiple?: boolean,
        required?: boolean,
        guiAttr?: string
    ) {
        this.iri = iri;
        this.label = label;
        this.type = type;
        this.multiple = multiple;
        this.required = required;
        this.guiAttr = guiAttr;
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
                animate(150),
            ]),

            // fade out when destroyed.
            transition(
                ':leave',
                // fading out uses a different syntax, with the "style" being passed into animate()
                animate(150, style({ opacity: 0 }))
            ),
        ]),
    ],
})
export class PropertyInfoComponent implements OnChanges, AfterContentInit {
    @Input() propDef: ResourcePropertyDefinitionWithAllLanguages;

    @Input() projectUuid: string;

    @Input() projectStatus: boolean;

    @Input() lastModificationDate?: string;

    @Input() userCanEdit: boolean; // is user a project admin or sys admin?

    // event emitter when the lastModificationDate changed; bidirectional binding with lastModificationDate parameter
    @Output() lastModificationDateChange: EventEmitter<string> =
        new EventEmitter<string>();

    @Output() editResourceProperty: EventEmitter<PropertyInfoObject> =
        new EventEmitter<PropertyInfoObject>();
    @Output() deleteResourceProperty: EventEmitter<DefaultClass> =
        new EventEmitter<DefaultClass>();

    // submit res class iri to open res class (not yet implemented)
    @Output() clickedOnClass: EventEmitter<ShortInfo> =
        new EventEmitter<ShortInfo>();

    propInfo: Property = new Property();

    propType: DefaultProperty;

    propAttribute: string;
    propAttributeComment: string;

    propCanBeDeleted: boolean;

    project: ReadProject;

    // list of default property types
    defaultProperties: PropertyCategory[] = DefaultProperties.data;

    // list of resource classes where the property is used
    resClasses: ShortInfo[] = [];

    showActionBubble = false;

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _errorHandler: AppErrorHandler,
        private _ontoService: OntologyService,
        private _store: Store,
    ) {
    }

    ngOnChanges(): void {
        const currentProjectOntologies = this._store.selectSnapshot(OntologiesSelectors.currentProjectOntologies);
        // get info about subproperties, if they are not a subproperty of knora base ontology
        // in this case add it to the list of subproperty iris
        const superProp = this._ontoService.getSuperProperty(this.propDef, currentProjectOntologies);
        if (superProp) {
            if (this.propDef.subPropertyOf.indexOf(superProp) === -1) {
                this.propDef.subPropertyOf.push(superProp);
            }
        }

        // get the default property type for this property
        this._ontoService
            .getDefaultPropType(this.propDef)
            .subscribe((prop: DefaultProperty) => {
                this.propType = prop;
            });
    }

    ngAfterContentInit() {
        const currentProjectOntologies = this._store.selectSnapshot(OntologiesSelectors.currentProjectOntologies);
        if (this.propDef.isLinkProperty) {
            const ontology = this._store.selectSnapshot(OntologiesSelectors.currentOntology);
            // this property is a link property to another resource class
            // get current ontology to get linked res class information

            // get the base ontology of object type
            const baseOnto = this.propDef.objectType.split('#')[0];
            if (baseOnto !== ontology.id) {
                // get class info from another ontology
                const onto = currentProjectOntologies.find((i) => i.id === baseOnto);
                if (!onto && this.propDef.objectType === Constants.Region) {
                    this.propAttribute = 'Region';
                } else {
                    this.propAttribute = onto.classes[this.propDef.objectType].label;
                    this.propAttributeComment = onto.classes[this.propDef.objectType].comment;
                }
            } else {
                this.propAttribute = ontology.classes[this.propDef.objectType].label;
                this.propAttributeComment = ontology.classes[this.propDef.objectType].comment;
            }
        }

        if (this.propDef.objectType === Constants.ListValue) {
            const currentOntologyLists = this._store.selectSnapshot(ListsSelectors.listsInProject);
            // this property is a list property
            // get current ontology lists to get linked list information
            const re = /\<([^)]+)\>/;
            const listIri = this.propDef.guiAttributes[0].match(re)[1];
            const listUrl = `/project/${this.projectUuid}/lists/${encodeURIComponent(listIri)}`;
            const list = currentOntologyLists.find((i) => i.id === listIri);
            this.propAttribute = `<a href="${listUrl}">${list.labels[0].value}</a>`;
            this.propAttributeComment = list.comments.length
                ? list.comments[0].value
                : null;
        }

        // get all classes where the property is used
        this.resClasses = [];
        if (!currentProjectOntologies || currentProjectOntologies.length === 0) {
            return;
        }

        currentProjectOntologies.forEach((onto) => {
            const classes = getAllEntityDefinitionsAsArray(onto.classes);
            classes.forEach((resClass) => {
                if (resClass.propertiesList.find((prop) => prop.propertyIndex === this.propDef.id)) {
                    // build own resClass object with id, label and comment
                    const propOfClass: ShortInfo = {
                        id: resClass.id,
                        label: resClass.label,
                        comment: onto.label + (resClass.comment ? ': ' + resClass.comment : ''),
                    };
                    this.resClasses.push(propOfClass);
                }
            });
        });
    }

    trackByFn = (index: number, item: ShortInfo) => `${index}-${item.id}`;

    /**
     * determines whether a property can be deleted or not
     */
    canBeDeleted(): void {
        // check if the property can be deleted
        this._dspApiConnection.v2.onto
            .canDeleteResourceProperty(this.propDef.id)
            .subscribe(
                (canDoRes: CanDoResponse) => {
                    this.propCanBeDeleted = canDoRes.canDo;
                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                }
            );
    }

    /**
     * show action bubble with various CRUD buttons when hovered over.
     */
    mouseEnter() {
        this.canBeDeleted();
        this.showActionBubble = true;
    }

    /**
     * hide action bubble with various CRUD buttons when not hovered over.
     */
    mouseLeave() {
        this.showActionBubble = false;
    }
}
