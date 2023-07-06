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
    ListNodeInfo,
    ReadOntology,
    ResourcePropertyDefinitionWithAllLanguages,
    UpdateOntology,
    UpdateResourceClassCardinality,
} from '@dasch-swiss/dsp-js';
import { ApplicationStateService } from '@dasch-swiss/vre/shared/app-state-service';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import { DefaultProperty } from '../../default-data/default-properties';
import { DefaultClass } from '../../default-data/default-resource-classes';
import { OntologyService } from '../../ontology.service';

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

    ontology: ReadOntology;

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _applicationStateService: ApplicationStateService,
        private _errorHandler: AppErrorHandler,
        private _ontoService: OntologyService
    ) {
        this._applicationStateService
            .get('currentOntology')
            .subscribe((response: ReadOntology) => {
                this.ontology = response;
            });
    }

    ngOnChanges(): void {
        // set the cardinality values in the class view
        const cards = this._ontoService.getCardinalityGuiValues(
            this.propCard.cardinality
        );
        this.propInfo.multiple = cards.multiple;
        this.propInfo.required = cards.required;
        // get info about subproperties, if they are not a subproperty of knora base ontology
        // in this case add it to the list of subproperty iris
        const superProp = this._ontoService.getSuperProperty(this.propDef);
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

            // get the base ontology of object type
            const baseOnto = this.propDef.objectType.split('#')[0];
            if (baseOnto !== this.ontology.id) {
                // get class info from another ontology
                this._applicationStateService.get('currentProjectOntologies').subscribe(
                    (ontologies: ReadOntology[]) => {
                        const onto = ontologies.find((i) => i.id === baseOnto);
                        if (
                            !onto &&
                            this.propDef.objectType === Constants.Region
                        ) {
                            this.propAttribute = 'Region';
                        } else {
                            this.propAttribute =
                                onto.classes[this.propDef.objectType].label;
                            this.propAttributeComment =
                                onto.classes[this.propDef.objectType].comment;
                        }
                    },
                    () => {} // don't log error to rollbar if 'currentProjectOntologies' does not exist in the application state
                );
            } else {
                this.propAttribute =
                    this.ontology.classes[this.propDef.objectType].label;
                this.propAttributeComment =
                    this.ontology.classes[this.propDef.objectType].comment;
            }
        }

        if (this.propDef.objectType === Constants.ListValue) {
            // this property is a list property
            // get current ontology lists to get linked list information
            this._applicationStateService
                .get('currentOntologyLists')
                .subscribe((response: ListNodeInfo[]) => {
                    const re = /\<([^)]+)\>/;
                    const listIri = this.propDef.guiAttributes[0].match(re)[1];
                    const listUrl = `/project/${
                        this.projectUuid
                    }/lists/${encodeURIComponent(listIri)}`;
                    const list = response.find((i) => i.id === listIri);
                    this.propAttribute = `<a href="${listUrl}">${list.labels[0].value}</a>`;
                    this.propAttributeComment = list.comments.length
                        ? list.comments[0].value
                        : null;
                });
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

        onto.id = this.ontology.id;

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
