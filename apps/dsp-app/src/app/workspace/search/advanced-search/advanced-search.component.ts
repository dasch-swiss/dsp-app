import {
    AfterViewChecked,
    Component,
    EventEmitter,
    Inject,
    Input,
    OnDestroy,
    OnInit,
    Output,
    ViewChild,
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import {
    ApiResponseError,
    Constants,
    KnoraApiConnection,
    OntologiesMetadata,
    OntologyMetadata,
} from '@dasch-swiss/dsp-js';
import { Subscription } from 'rxjs';
import { DspApiConnectionToken } from '@dsp-app/src/app/main/declarations/dsp-api-tokens';
import { ErrorHandlerService } from '@dsp-app/src/app/main/services/error-handler.service';
import { SearchParams } from '../../results/list-view/list-view.component';
import { GravsearchGenerationService } from '../services/gravsearch-generation.service';
import { ResourceAndPropertySelectionComponent } from './resource-and-property-selection/resource-and-property-selection.component';
import { PropertyWithValue } from './resource-and-property-selection/search-select-property/specify-property-value/operator';

@Component({
    selector: 'app-advanced-search',
    templateUrl: './advanced-search.component.html',
    styleUrls: ['./advanced-search.component.scss'],
})
export class AdvancedSearchComponent
    implements OnInit, OnDestroy, AfterViewChecked
{
    // reference to the component that controls the resource class selection
    @ViewChild('resAndPropSel')
    resourceAndPropertySelection: ResourceAndPropertySelectionComponent;

    /**
     * filter ontologies by specified project IRI
     *
     * @param limitToProject
     */
    @Input() limitToProject?: string;

    /**
     * the data event emitter of type SearchParams
     *
     * @param  search
     */
    @Output() search = new EventEmitter<SearchParams>();

    ontologiesMetadata: OntologiesMetadata;

    // formGroup (used as parent for child components)
    form: UntypedFormGroup;

    // form validation status
    formValid = false;

    activeOntology: string;

    formChangesSubscription: Subscription;

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        @Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder,
        private _errorHandler: ErrorHandlerService,
        private _gravsearchGenerationService: GravsearchGenerationService
    ) {}

    ngOnInit() {
        // parent form is empty, it gets passed to the child components
        this.form = this._fb.group({});

        // initialize ontologies to be used for the ontologies selection in the search form
        this.initializeOntologies();
    }

    ngAfterViewChecked() {
        // if form status changes, re-run validation
        this.formChangesSubscription = this.form.statusChanges.subscribe(
            () => {
                this.formValid = this._validateForm();
            }
        );
    }

    ngOnDestroy() {
        if (this.formChangesSubscription !== undefined) {
            this.formChangesSubscription.unsubscribe();
        }
    }

    /**
     * gets all available ontologies for the search form.
     * @returns void
     */
    initializeOntologies(): void {
        if (this.limitToProject) {
            this._dspApiConnection.v2.onto
                .getOntologiesByProjectIri(this.limitToProject)
                .subscribe(
                    (response: OntologiesMetadata) => {
                        // filter out system ontologies
                        response.ontologies = response.ontologies.filter(
                            (onto) =>
                                onto.attachedToProject !==
                                Constants.SystemProjectIRI
                        );

                        this.ontologiesMetadata = response;

                        this.preSelectFirstOntology(
                            this.ontologiesMetadata.ontologies
                        );
                    },
                    (error: ApiResponseError) => {
                        this._errorHandler.showMessage(error);
                    }
                );
        } else {
            this._dspApiConnection.v2.onto.getOntologiesMetadata().subscribe(
                (response: OntologiesMetadata) => {
                    // filter out system ontologies
                    response.ontologies = response.ontologies.filter(
                        (onto) =>
                            onto.attachedToProject !==
                            Constants.SystemProjectIRI
                    );

                    this.ontologiesMetadata = response;

                    this.preSelectFirstOntology(
                        this.ontologiesMetadata.ontologies
                    );
                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                }
            );
        }
    }

    setActiveOntology(ontologyIri: string) {
        this.activeOntology = ontologyIri;
    }

    preSelectFirstOntology(ontologies: OntologyMetadata[]) {
        if (ontologies.length === 1) {
            this.activeOntology = ontologies[0].id;
        }
    }

    submit() {
        if (!this.formValid) {
            return; // check that form is valid
        }

        const resClassOption =
            this.resourceAndPropertySelection.resourceClassComponent
                .selectedResourceClassIri;

        let resClass;

        if (resClassOption !== false) {
            resClass = resClassOption;
        }

        const properties: PropertyWithValue[] =
            this.resourceAndPropertySelection.propertyComponents.map(
                (propComp) => propComp.getPropertySelectedWithValue()
            );

        const gravsearch =
            this._gravsearchGenerationService.createGravsearchQuery(
                properties,
                resClass
            );

        if (gravsearch) {
            // emit query
            this.search.emit({
                query: gravsearch,
                mode: 'gravsearch',
            });
        }
    }

    /**
     * validates form and returns its status (boolean).
     */
    private _validateForm(): boolean {
        if (
            this.resourceAndPropertySelection === undefined ||
            this.resourceAndPropertySelection.resourceClassComponent ===
                undefined ||
            this.resourceAndPropertySelection.propertyComponents === undefined
        ) {
            return false;
        }

        // check that either a resource class is selected or at least one property is specified
        return (
            this.form.valid &&
            (this.resourceAndPropertySelection.propertyComponents.length > 0 ||
                this.resourceAndPropertySelection.resourceClassComponent
                    .selectedResourceClassIri !== false)
        );
    }
}
