import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import {
    ApiResponseError,
    CanDoResponse,
    ClassDefinition,
    Constants,
    IHasProperty,
    KnoraApiConnection,
    PropertyDefinition,
    ReadOntology,
    ReadProject,
    ResourceClassDefinitionWithAllLanguages,
    ResourcePropertyDefinitionWithAllLanguages,
    UpdateOntology,
    UpdateResourceClassCardinality
} from '@dasch-swiss/dsp-js';
import { CacheService } from 'src/app/main/cache/cache.service';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';
import { ErrorHandlerService } from 'src/app/main/services/error-handler.service';
import { NotificationService } from 'src/app/main/services/notification.service';
import { SortingService } from 'src/app/main/services/sorting.service';
import { DefaultProperties, DefaultProperty, PropertyCategory, PropertyInfoObject } from '../default-data/default-properties';
import { DefaultClass, DefaultResourceClasses } from '../default-data/default-resource-classes';
import { PropertyAssignment, OntologyProperties } from '../ontology.component';
import { OntologyService } from '../ontology.service';
import { GuiCardinality } from '../property-info/property-info.component';

export interface PropToDisplay extends IHasProperty {
    propDef?: PropertyDefinition;
}

export interface PropToAdd {
    ontologyId: string;
    ontologyLabel: string;
    properties: PropertyInfoObject[];
}

@Component({
    selector: 'app-resource-class-info',
    templateUrl: './resource-class-info.component.html',
    styleUrls: ['./resource-class-info.component.scss']
})
export class ResourceClassInfoComponent implements OnInit {

    // open / close res class card
    @Input() expanded = false;

    @Input() resourceClass: ClassDefinition;

    @Input() projectUuid: string;

    @Input() projectStatus: boolean;

    @Input() ontologies: ReadOntology[] = [];

    @Input() lastModificationDate?: string;

    @Input() userCanEdit: boolean; // is user a project admin or sys admin?

    // event emitter when the lastModificationDate changed; bidirectional binding with lastModificationDate parameter
    @Output() lastModificationDateChange: EventEmitter<string> = new EventEmitter<string>();

    // event emitter when the lastModificationDate changed; bidirectional binding with lastModificationDate parameter
    @Output() ontoPropertiesChange: EventEmitter<PropertyDefinition[]> = new EventEmitter<PropertyDefinition[]>();

    // to update the resource class itself (edit or delete)
    @Output() editResourceClass: EventEmitter<DefaultClass> = new EventEmitter<DefaultClass>();
    @Output() deleteResourceClass: EventEmitter<DefaultClass> = new EventEmitter<DefaultClass>();

    // to update the assignment of a property to a class we need the information about property (incl. propType)
    // and resource class
    @Output() updatePropertyAssignment: EventEmitter<string> = new EventEmitter<string>();

    ontology: ReadOntology;

    // list of all ontologies with their properties
    ontoProperties: OntologyProperties[] = [];

    // set to false if it is a subclass of a default class inheriting the order
    canChangeGuiOrder: boolean;

    classCanBeDeleted: boolean;

    // list of properties that can be displayed (not all the props should be displayed)
    propsToDisplay: PropToDisplay[] = [];

    subClassOfLabel = '';

    // list of default resource classes
    defaultClasses: DefaultClass[] = DefaultResourceClasses.data;

    // list of default property types
    defaultProperties: PropertyCategory[] = DefaultProperties.data;

    // list of existing ontology properties, which are not in this resource class
    existingProperties: PropToAdd[];

    // load single property (in case of property cardinality action)
    loadProperty = false;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _dialog: MatDialog,
        private _errorHandler: ErrorHandlerService,
        private _notification: NotificationService,
        private _ontoService: OntologyService,
        private _sortingService: SortingService
    ) { }

    ngOnInit(): void {
        // grab the onto properties information to display
        this.ontoProperties = [];
        // get all project ontologies
        this._cache.get('currentProjectOntologies').subscribe(
            (ontologies: ReadOntology[]) => {
                this.ontologies = ontologies;
                ontologies.forEach(onto => {
                    const prepareList: OntologyProperties = {
                        ontology: onto.id,
                        properties: this.initOntoProperties(onto.getAllPropertyDefinitions())
                    };
                    this.ontoProperties.push(prepareList);
                });
            },
            () => {} // don't log error to rollbar if 'currentProjectOntologies' does not exist in the cache
        );

        // get currently selected ontology
        this._cache.get('currentOntology').subscribe(
            (response: ReadOntology) => {
                this.ontology = response;
                this.lastModificationDate = this.ontology.lastModificationDate;
                // translate iris from "subclass of" array
                this.translateSubClassOfIri(this.resourceClass.subClassOf);
                // prepare list of properties to display
                this.preparePropsToDisplay(this.resourceClass.propertiesList);
                // check if the class can be deleted
                this.canBeDeleted();
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );

    }

    /**
     * translates iris from "subclass of" array
     * - display label from default resource classes (as part of DSP System Project)
     * - in case the class is a subclass of another class in the same ontology: display this class label
     * - in none of those cases display the name from the class IRI
     *
     * @param classIris
     */
    translateSubClassOfIri(classIris: string[]) {

        // reset the label
        this.subClassOfLabel = '';

        classIris.forEach((iri, index) => {
            // get ontology iri from class iri
            const splittedIri = iri.split('#');
            const ontologyIri = splittedIri[0];
            const className = splittedIri[1];

            this.subClassOfLabel += (index > 0 ? ', ' : '');

            // find default class for the current class iri
            const defaultClass = this.defaultClasses.find(i => i.iri === iri);
            if (defaultClass) {
                this.subClassOfLabel += defaultClass.label;
                this.canChangeGuiOrder = true;
            } else if (this.ontology.id === ontologyIri) {
                // the class is not defined in the default classes
                // but defined in the current ontology
                // get class label from there
                this.subClassOfLabel += this.ontology.classes[iri].label;
                // in this case, the user can't update the cardinality incl. the gui order in this class
                // we have to disable this update cardinality functionality
                this.canChangeGuiOrder = false;
            } else {
                // the ontology iri of the upper class couldn't be found
                // display the class name
                if (className) {
                    this.subClassOfLabel += className;
                } else {
                    // iri is not kind of [ontologyIri]#[className]
                    this.subClassOfLabel += iri.split('/').filter(e => e).slice(-1);
                }
                // in this case, the user can't update the currentCardinality incl. the gui order in this class
                // we have to disable this update currentCardinality functionality
                this.canChangeGuiOrder = false;
            }
        });

    }

    initOntoProperties(allOntoProperties: PropertyDefinition[]): PropertyDefinition[] {
        // reset the ontology properties
        const listOfProperties = [];

        // display only the properties which are not a subjectType of Standoff
        allOntoProperties.forEach(resProp => {
            const standoff = (resProp.subjectType ? resProp.subjectType.includes('Standoff') : false);
            if (resProp.objectType !== Constants.LinkValue && !standoff) {
                listOfProperties.push(resProp);
            }
        });
        // sort properties by label
        // --> TODO: add sort functionallity to the gui
        return this._sortingService.keySortByAlphabetical(listOfProperties, 'label');
    }

    /**
     * prepares props to display
     * Not all props should be displayed; there are some system / API-specific
     * properties which have to be filtered.
     *
     * @param classProps
     */
    preparePropsToDisplay(classProps: PropToDisplay[]) {

        // reset existing properties to select from
        this.existingProperties = [];

        classProps.forEach((hasProp: PropToDisplay) => {

            const ontoIri = hasProp.propertyIndex.split(Constants.HashDelimiter)[0];
            // ignore http://api.knora.org/ontology/knora-api/v2 and ignore  http://www.w3.org/2000/01/rdf-schema
            if (ontoIri !== Constants.KnoraApiV2 && ontoIri !== Constants.Rdfs) {
                // get property definition from list of project ontologies
                const index = this.ontoProperties.findIndex((item: OntologyProperties) => item.ontology === ontoIri);
                hasProp.propDef = this.ontoProperties[index].properties.find((obj: ResourcePropertyDefinitionWithAllLanguages) =>
                    obj.id === hasProp.propertyIndex &&
                    ((obj.subjectType && !obj.subjectType.includes('Standoff')) && obj.objectType !== Constants.LinkValue || !obj.isLinkValueProperty)
                );

                // propDef was found, add hasProp to the properties list which has to be displayed in this resource class
                if (hasProp.propDef) {
                    if (this.propsToDisplay.indexOf(hasProp) === -1) {
                        this.propsToDisplay.push(hasProp);
                    }

                    // and remove from list of existing properties to avoid double cardinality entries
                    // because the prop displayed in the class cannot be added a second time,
                    // so we have to hide it from the list of "Add existing property"
                    const delProp = this.ontoProperties[index].properties.indexOf(hasProp.propDef, 0);
                    if (delProp > -1) {
                        this.ontoProperties[index].properties.splice(delProp, 1);
                    }
                }
            }
        });

        this.ontoProperties.forEach((op: OntologyProperties, i: number) => {

            this.existingProperties.push({
                ontologyId: op.ontology,
                ontologyLabel: this.ontologies[i].label,
                properties: []
            });

            op.properties.forEach((availableProp: ResourcePropertyDefinitionWithAllLanguages) => {

                const superProp = this._ontoService.getSuperProperty(availableProp);
                if (superProp) {
                    if (availableProp.subPropertyOf.indexOf(superProp) === -1) {
                        availableProp.subPropertyOf.push(superProp);
                    }
                }

                let propType: DefaultProperty;
                // find corresponding default property to have more prop info
                this._ontoService.getDefaultPropType(availableProp).subscribe(
                    (prop: DefaultProperty) => {
                        propType = prop;
                    }
                );

                const propToAdd: PropertyInfoObject = {
                    propType: propType,
                    propDef: availableProp
                };

                this.existingProperties[i].properties.push(propToAdd);

            });

        });
    }

    canBeDeleted() {

        // check if the class can be deleted
        this._dspApiConnection.v2.onto.canDeleteResourceClass(this.resourceClass.id).subscribe(
            (response: CanDoResponse) => {
                this.classCanBeDeleted = response.canDo;
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );
    }

    addNewProperty(propType: DefaultProperty) {
        const propertyAssignment: PropertyAssignment = {
            resClass: this.resourceClass,
            property: {
                propType: propType
            }
        };
        this.assignProperty(propertyAssignment);
    }

    addExistingProperty(prop: PropertyInfoObject) {
        const propertyAssignment: PropertyAssignment = {
            resClass: this.resourceClass,
            property: {
                propType: prop.propType,
                propDef: prop.propDef,
            }
        };
        this.assignProperty(propertyAssignment);
    }

    /**
     * removes property from resource class
     * @param property
     */
    removeProperty(property: DefaultClass) {

        this.loadProperty = true;

        const onto = new UpdateOntology<UpdateResourceClassCardinality>();

        onto.lastModificationDate = this.lastModificationDate;

        onto.id = this.ontology.id;

        const delCard = new UpdateResourceClassCardinality();

        delCard.id = this.resourceClass.id;

        delCard.cardinalities = [];

        delCard.cardinalities = this.propsToDisplay.filter(prop => (prop.propertyIndex === property.iri));
        onto.entity = delCard;

        this._dspApiConnection.v2.onto.deleteCardinalityFromResourceClass(onto).subscribe(
            (res: ResourceClassDefinitionWithAllLanguages) => {

                this.lastModificationDate = res.lastModificationDate;
                this.lastModificationDateChange.emit(this.lastModificationDate);
                this.preparePropsToDisplay(this.propsToDisplay);

                this.updatePropertyAssignment.emit(this.ontology.id);
                // display success message
                this._notification.openSnackBar(`You have successfully removed "${property.label}" from "${this.resourceClass.label}".`);

                this.loadProperty = false;
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(<ApiResponseError>error);
            }
        );

    }

    /**
     * assignProperty: Open the dialogue in order to add an existing property to a class or to create a new
     * property and add it to the class
     * @param propertyAssignment information about the link of a property to a class
     **/
    assignProperty(propertyAssignment: PropertyAssignment) {
        if (!propertyAssignment) {
            return;
        }
        const classLabel = propertyAssignment.resClass.label;

        let mode: 'createProperty' | 'editProperty' = 'createProperty';
        let propLabel = propertyAssignment.property.propType.group + ': ' + propertyAssignment.property.propType.label;
        let title = 'Add new property of type "' + propLabel + '" to class "' + classLabel + '"';
        if (propertyAssignment.property.propDef) {
            // the property already exists. To assign an existing property simply open the dialog in edit mode
            mode = 'editProperty';
            propLabel = propertyAssignment.property.propDef.label;
            title = 'Add existing property "' + propLabel + '" to class "' + classLabel + '"';
        }

        const dialogConfig: MatDialogConfig = {
            width: '640px',
            maxHeight: '80vh',
            position: {
                top: '112px'
            },
            data: {
                propInfo: propertyAssignment.property,
                title: title,
                subtitle: 'Customize property and cardinality',
                mode: mode,
                parentIri: propertyAssignment.resClass.id,
                position: this.propsToDisplay.length + 1
            }
        };
        this.openEditDialog(dialogConfig);
    }

    /**
     * changeCardinalities: Open the dialogue in order to change the currentCardinality of an existing property and
     * class combination
     * @param cardRequest information about the property, its type and its new cardinalities to be set
     **/
    changeCardinalities(cardRequest: { prop: PropToDisplay; propType: DefaultProperty; targetCardinality: GuiCardinality }) {
        const dialogConfig: MatDialogConfig = {
            width: '640px',
            maxHeight: '80vh',
            position: {
                top: '112px'
            },
            data: {
                propInfo: { propDef: cardRequest.prop.propDef, propType: cardRequest.propType },
                title: 'Update cardinality',
                subtitle: `Set the cardinality for property ${ cardRequest.prop.propDef.label }`,
                mode: 'updateCardinality',
                parentIri: this.resourceClass.id,
                currentCardinality: cardRequest.prop.cardinality,
                targetCardinality: cardRequest.targetCardinality,
                classProperties: this.propsToDisplay
            }
        };
        this.openEditDialog(dialogConfig);

    }

    /**
     * openEditDialog: Open the dialogue in order assign a property or change cardinalities
     * @param dialogConfig the MatDialogConfig
     **/
    openEditDialog(dialogConfig: MatDialogConfig) {
        const dialogRef = this._dialog.open(
            DialogComponent,
            dialogConfig
        );

        dialogRef.afterClosed().subscribe(result => {
            // update the view: list of properties in resource class
            this.updatePropertyAssignment.emit(this.ontology.id);
        });
    }


    /**
     * drag and drop property line
     */
    drop(event: CdkDragDrop<string[]>) {

        // set sort order for child component
        moveItemInArray(this.propsToDisplay, event.previousIndex, event.currentIndex);

        if (event.previousIndex !== event.currentIndex) {
            // the dropped property item has a new index (= gui order)
            // send the new gui-order to the api by
            // preparing the UpdateOntology object first
            const onto = new UpdateOntology<UpdateResourceClassCardinality>();

            onto.lastModificationDate = this.lastModificationDate;

            onto.id = this.ontology.id;

            const addCard = new UpdateResourceClassCardinality();

            addCard.id = this.resourceClass.id;

            addCard.cardinalities = [];

            this.propsToDisplay.forEach((prop, index) => {
                const propCard: IHasProperty = {
                    propertyIndex: prop.propertyIndex,
                    cardinality: prop.cardinality,
                    guiOrder: index + 1
                };

                addCard.cardinalities.push(propCard);
            });

            onto.entity = addCard;

            // send the request to the api
            this._dspApiConnection.v2.onto.replaceGuiOrderOfCardinalities(onto).subscribe(
                (responseGuiOrder: ResourceClassDefinitionWithAllLanguages) => {
                    this.lastModificationDate = responseGuiOrder.lastModificationDate;

                    // successful request: update the view
                    this.lastModificationDateChange.emit(this.lastModificationDate);

                    // display success message
                    this._notification.openSnackBar(`You have successfully changed the order of properties in the resource class "${this.resourceClass.label}".`);

                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                }
            );

        }

    }

    /**
     * opens resource instances in new tab using gravsearch
     * @param iri
     */
    openResourceInstances(iri: string) {
        // open resource instances in new tab:
        // it's important not to indent the gravsearch.
        const gravsearch = `
PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
CONSTRUCT {

?mainRes knora-api:isMainResource true .


} WHERE {

?mainRes a knora-api:Resource .

?mainRes a <${iri}> .

}

OFFSET 0`;

        const doSearchRoute = `/search/gravsearch/${encodeURIComponent(gravsearch)}`;
        window.open(doSearchRoute, '_blank');
    }

    createResourceInstance(iri: string, label: string) {
        let projectIri: string;
        // get project iri
        this._cache.get(this.projectUuid).subscribe(
            (res: ReadProject) => {
                projectIri = res.id;
            }
        );

        const dialogConfig: MatDialogConfig = {
            width: '840px',
            maxHeight: '80vh',
            position: {
                top: '112px'
            },
            data: { id: iri, mode: 'createResource', project: projectIri, title: label,  subtitle: 'Set the property values of the resource' },
            disableClose: true
        };

        const dialogRef = this._dialog.open(
            DialogComponent,
            dialogConfig
        );

        dialogRef.afterClosed().subscribe(() => { });
    }

}
