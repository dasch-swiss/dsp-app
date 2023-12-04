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
    IHasProperty,
    KnoraApiConnection,
    ResourcePropertyDefinitionWithAllLanguages,
    UpdateOntology,
    UpdateResourceClassCardinality,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import { DefaultClass, DefaultProperty, OntologyService } from '@dasch-swiss/vre/shared/app-helper-services';
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

export interface GuiCardinality {
    key: CardinalityKey;
    value: boolean;
}

type CardinalityKey = 'multiple' | 'required';

@Component({
    selector: 'app-resource-class-property-info',
    templateUrl: './resource-class-property-info.component.html',
    styleUrls: ['./resource-class-property-info.component.scss'],
})
export class ResourceClassPropertyInfoComponent
    implements OnChanges, AfterContentInit
{
    @Input() propDef: ResourcePropertyDefinitionWithAllLanguages;

    @Input() propCard: IHasProperty;

    @Input() resourceIri?: string;

    @Input() projectUuid: string;

    @Input() lastModificationDate?: string;

    @Input() userCanEdit: boolean; // is user a project admin or sys admin?

    @Output() removePropertyFromClass: EventEmitter<DefaultClass> =
        new EventEmitter<DefaultClass>();

    @Output() changeCardinalities: EventEmitter<{
        prop: IHasProperty;
        propType: DefaultProperty;
        targetCardinality: GuiCardinality;
    }> = new EventEmitter<{
        prop: IHasProperty;
        propType: DefaultProperty;
        targetCardinality: GuiCardinality;
    }>();

    propInfo: Property = new Property();

    propType: DefaultProperty;

    propAttribute: string;
    propAttributeComment: string;

    propCanBeRemovedFromClass: boolean;

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _errorHandler: AppErrorHandler,
        private _ontoService: OntologyService,
        private _store: Store,
    ) {
    }

    ngOnChanges(): void {
        // set the cardinality values in the class view
        const cards = this._ontoService.getCardinalityGuiValues(
            this.propCard.cardinality
        );
        this.propInfo.multiple = cards.multiple;
        this.propInfo.required = cards.required;
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
        if (this.propDef.isLinkProperty) {
            // this property is a link property to another resource class
            // get current ontology to get linked res class information

            const ontology = this._store.selectSnapshot(OntologiesSelectors.currentOntology);
            const currentProjectOntologies = this._store.selectSnapshot(OntologiesSelectors.currentProjectOntologies);
            // get the base ontology of object type
            const baseOnto = this.propDef.objectType.split('#')[0];
            if (baseOnto !== ontology.id) {
                // get class info from another ontology
                const onto = currentProjectOntologies.find((i) => i.id === baseOnto);
                if ( !onto ) {
                    if (this.propDef.objectType === Constants.Region) {
                        this.propAttribute = 'Region';
                    }  // else no ontology found

                } else {
                    this.propAttribute =
                        onto.classes[this.propDef.objectType].label;
                    this.propAttributeComment =
                        onto.classes[this.propDef.objectType].comment;
                }
            } else {
                this.propAttribute = ontology.classes[this.propDef.objectType].label;
                this.propAttributeComment = ontology.classes[this.propDef.objectType].comment;
            }
        }

        if (this.propDef.objectType === Constants.ListValue) {
            // this property is a list property
            // get current ontology lists to get linked list information
            const currentOntologyLists = this._store.selectSnapshot(ListsSelectors.listsInProject);
            const re = /\<([^)]+)\>/;
            const listIri = this.propDef.guiAttributes[0].match(re)[1];
            const listUrl = `/project/${
                this.projectUuid
            }/list/${listIri.split('/').pop()}`;
            const list = currentOntologyLists.find((i) => i.id === listIri);
            this.propAttribute = `<a href="${listUrl}">${list.labels[0].value}</a>`;
            this.propAttributeComment = list.comments.length
                ? list.comments[0].value
                : null;
        }
    }

    /**
     * determines whether a property can be removed from a class or not
     */
    canBeRemovedFromClass(): void {
        // check if the property can be removed from res class
        if (!this.lastModificationDate) {
            // guard
            return;
        }

        // property can only be removed from class if it's not inherited from another prop or class
        if (this.propCard.isInherited) {
            // other guard
            this.propCanBeRemovedFromClass = false;
            return;
        }
        const onto = new UpdateOntology<UpdateResourceClassCardinality>();

        onto.lastModificationDate = this.lastModificationDate;

        const ontology = this._store.selectSnapshot(OntologiesSelectors.currentOntology);
        onto.id = ontology.id;

        const delCard = new UpdateResourceClassCardinality();

        delCard.id = this.resourceIri;

        delCard.cardinalities = [];

        delCard.cardinalities = [this.propCard];
        onto.entity = delCard;

        this._dspApiConnection.v2.onto
            .canDeleteCardinalityFromResourceClass(onto)
            .subscribe(
                (canDoRes: CanDoResponse) => {
                    this.propCanBeRemovedFromClass = canDoRes.canDo;
                },
                // open snackbar displaying the error
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                }
            );
    }
}
