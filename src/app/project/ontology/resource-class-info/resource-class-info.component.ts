import { EventEmitter, Input, Output } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { ApiResponseError, ClassDefinition, ReadOntology } from '@dasch-swiss/dsp-js';
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

    @Output() editResourceClass: EventEmitter<DefaultClass> = new EventEmitter<DefaultClass>();
    @Output() updateCardinality: EventEmitter<ClassDefinition> = new EventEmitter<ClassDefinition>();
    @Output() deleteResourceClass: EventEmitter<DefaultClass> = new EventEmitter<DefaultClass>();

    ontology: ReadOntology;

    subClassOfLabel = '';

    // list of default classes
    defaultClasses: DefaultClass[] = DefaultResourceClasses.data;

    constructor(
        private _cache: CacheService,
        private _errorHandler: ErrorHandlerService,
    ) { }

    ngOnInit(): void {
        this._cache.get('currentOntology').subscribe(
            (response: ReadOntology) => {
                this.ontology = response;
                this.translateSubClassOfIri(this.resourceClass.subClassOf);
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
            } else if (this.ontology.id === ontologyIri) {
                // the class is not defined in the default classes
                // but defined in the current ontology
                // get class label from there
                this.subClassOfLabel += this.ontology.classes[iri].label;
            } else {
                // the ontology iri of the upper class couldn't be found
                // display the class name
                if (className) {
                    this.subClassOfLabel += className;
                } else {
                    // iri is not kind of [ontologyIri]#[className]
                    this.subClassOfLabel += iri.split('/').filter(e => e).slice(-1);
                }
            }
        });

    }

}
