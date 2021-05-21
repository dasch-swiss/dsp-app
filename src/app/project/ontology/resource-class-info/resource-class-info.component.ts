import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
    ApiResponseError,
    ClassDefinition,
    IHasProperty,
    KnoraApiConnection,
    ReadOntology,
    ResourceClassDefinitionWithAllLanguages,
    UpdateOntology,
    UpdateResourceClassCardinality
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/dsp-ui';
import { CacheService } from 'src/app/main/cache/cache.service';
import { ErrorHandlerService } from 'src/app/main/error/error-handler.service';
import { DefaultClass, DefaultResourceClasses } from '../default-data/default-resource-classes';

@Component({
    selector: 'app-resource-class-info',
    templateUrl: './resource-class-info.component.html',
    styleUrls: ['./resource-class-info.component.scss']
})
export class ResourceClassInfoComponent implements OnInit {

    // open / close res class card
    @Input() expanded = false;

    @Input() resourceClass: ClassDefinition;

    @Input() projectCode: string;

    @Input() lastModificationDate?: string;

    @Output() editResourceClass: EventEmitter<DefaultClass> = new EventEmitter<DefaultClass>();
    @Output() updateCardinality: EventEmitter<ClassDefinition> = new EventEmitter<ClassDefinition>();
    @Output() deleteResourceClass: EventEmitter<DefaultClass> = new EventEmitter<DefaultClass>();

    @Output() updateParent: EventEmitter<string> = new EventEmitter<string>();

    ontology: ReadOntology;

    cardinalityUpdateEnabled: boolean;

    // list of properties that can be displayed (not all of the props should be displayed)
    propsToDisplay: IHasProperty[] = [];

    subClassOfLabel = '';

    // list of default classes
    defaultClasses: DefaultClass[] = DefaultResourceClasses.data;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _errorHandler: ErrorHandlerService,
        private _snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this._cache.get('currentOntology').subscribe(
            (response: ReadOntology) => {
                this.ontology = response;
                this.lastModificationDate = this.ontology.lastModificationDate;
                this.translateSubClassOfIri(this.resourceClass.subClassOf);
                this.preparePropsToDisplay(this.resourceClass.propertiesList);
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );
    }

    /**
     * translates iri from "sub class of" array
     * - display label from default resource classes (as part of DSP System Project)
     * - in case the class is a subclass of another class in the same ontology: display this class label
     * - in none of those cases display the name from the class IRI
     *
     * @param classIris
     */
    translateSubClassOfIri(classIris: string[]) {

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
                this.cardinalityUpdateEnabled = true;
            } else if (this.ontology.id === ontologyIri) {
                // the class is not defined in the default classes
                // but defined in the current ontology
                // get class label from there
                this.subClassOfLabel += this.ontology.classes[iri].label;
                // in this case, the user can't update the cardinality incl. the gui order in this class
                // we have to disable this update cardinality functionality
                this.cardinalityUpdateEnabled = false;
            } else {
                // the ontology iri of the upper class couldn't be found
                // display the class name
                if (className) {
                    this.subClassOfLabel += className;
                } else {
                    // iri is not kind of [ontologyIri]#[className]
                    this.subClassOfLabel += iri.split('/').filter(e => e).slice(-1);
                }
                // in this case, the user can't update the cardinality incl. the gui order in this class
                // we have to disable this update cardinality functionality
                this.cardinalityUpdateEnabled = false;
            }
        });

    }

    /**
     * prepares props to display
     * Not all props should be displayed; there are some system / API-specific
     * properties which have to be filtered.
     *
     * @param props
     */
    preparePropsToDisplay(classProps: IHasProperty[]) {

        const ontoProps = this.ontology.getAllPropertyDefinitions();

        // reset properties to display
        this.propsToDisplay = [];

        classProps.forEach((hasProp) => {
            const propToDisplay = ontoProps.find(obj =>
                obj.id === hasProp.propertyIndex &&
                (obj.objectType !== 'http://api.knora.org/ontology/knora-api/v2#LinkValue' ||
                    (obj.subjectType && !obj.subjectType.includes('Standoff'))
                )
            );

            if (propToDisplay) {
                this.propsToDisplay.push(hasProp);
            }

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
                    this.preparePropsToDisplay(this.propsToDisplay);

                    this.updateParent.emit(this.lastModificationDate);

                    // display success message
                    this._snackBar.open(`You have successfully changed the order of properties in the resource class "${this.resourceClass.label}".`, '', {
                        horizontalPosition: 'center',
                        verticalPosition: 'top',
                        duration: 2500,
                        panelClass: 'success'
                    });

                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                }
            );

        }

    }

}
