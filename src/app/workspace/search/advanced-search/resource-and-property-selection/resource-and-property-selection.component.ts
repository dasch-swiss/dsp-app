import {
    Component,
    Inject,
    Input,
    OnChanges,
    OnInit,
    QueryList,
    SimpleChanges,
    ViewChild,
    ViewChildren
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import {
    KnoraApiConnection,
    ReadOntology, ResourceClassAndPropertyDefinitions,
    ResourceClassDefinition,
    ResourcePropertyDefinition
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { ErrorHandlerService } from 'src/app/main/services/error-handler.service';
import { SortingService } from 'src/app/main/services/sorting.service';
import { SearchSelectPropertyComponent } from './search-select-property/search-select-property.component';
import { SearchSelectResourceClassComponent } from './search-select-resource-class/search-select-resource-class.component';


@Component({
    selector: 'app-resource-and-property-selection',
    templateUrl: './resource-and-property-selection.component.html',
    styleUrls: ['./resource-and-property-selection.component.scss']
})
export class ResourceAndPropertySelectionComponent implements OnInit, OnChanges {

    // reference to the component that controls the resource class selection
    @ViewChild('resourceClass') resourceClassComponent: SearchSelectResourceClassComponent;

    // reference to the component controlling the property selection
    @ViewChildren('property') propertyComponents: QueryList<SearchSelectPropertyComponent>;

    @Input() formGroup: UntypedFormGroup;

    @Input() activeOntology: string;

    @Input() resourceClassRestriction?: string;

    @Input() topLevel;

    form: UntypedFormGroup;

    activeResourceClass: ResourceClassDefinition;

    activeProperties: boolean[] = [];

    resourceClasses: ResourceClassDefinition[];

    properties: ResourcePropertyDefinition[];

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        @Inject(UntypedFormBuilder) private _fb: UntypedFormBuilder,
        private _errorHandler: ErrorHandlerService,
        private _sortingService: SortingService
    ) { }

    ngOnInit(): void {

        this.form = this._fb.group({});

        // add form to the parent form group
        this.formGroup.addControl('resourceAndPropertySelection', this.form);
    }

    ngOnChanges(changes: SimpleChanges) {
        this.getResourceClassesAndPropertiesForOntology(this.activeOntology);
    }

    getResourceClassesAndPropertiesForOntology(ontologyIri: string) {

        // reset active resource class definition
        this.activeResourceClass = undefined;

        // reset specified properties
        this.activeProperties = [];

        this._dspApiConnection.v2.ontologyCache.getOntology(ontologyIri).subscribe(
            (onto: Map<string, ReadOntology>) => {

                const resClasses = onto.get(ontologyIri).getClassDefinitionsByType(ResourceClassDefinition);
                if (this.resourceClassRestriction !== undefined) {
                    this.resourceClasses = resClasses.filter(
                        (resClassDef: ResourceClassDefinition) => resClassDef.id === this.resourceClassRestriction
                    );
                    const subclasses = resClasses.filter(
                        (resClassDef: ResourceClassDefinition) =>
                            resClassDef.subClassOf.indexOf(this.resourceClassRestriction) > -1
                    );

                    this.resourceClasses = this.resourceClasses.concat(subclasses);
                } else {
                    this.resourceClasses = resClasses;
                }
                // sort resource classes by label
                this.resourceClasses = this._sortingService.keySortByAlphabetical(this.resourceClasses, 'label');

                this.properties = onto.get(ontologyIri).getPropertyDefinitionsByType(ResourcePropertyDefinition);

            },
            error => {
                this._errorHandler.showMessage(error);
            }
        );
    }

    getPropertiesForResourceClass(resourceClassIri: string | null) {

        // reset specified properties
        this.activeProperties = [];

        // if the client undoes the selection of a resource class, use the active ontology as a fallback
        if (resourceClassIri === null) {
            this.getResourceClassesAndPropertiesForOntology(this.activeOntology);
        } else {

            this._dspApiConnection.v2.ontologyCache.getResourceClassDefinition(resourceClassIri).subscribe(
                (onto: ResourceClassAndPropertyDefinitions) => {

                    this.activeResourceClass = onto.classes[resourceClassIri];

                    this.properties = onto.getPropertyDefinitionsByType(ResourcePropertyDefinition);

                }
            );
        }
    }

    /**
     * add a property to the search form.
     * @returns void
     */
    addProperty(): void {
        this.activeProperties.push(true);
    }

    /**
     * remove the last property from the search form.
     * @returns void
     */
    removeProperty(): void {
        this.activeProperties.splice(-1, 1);
    }

    /**
     * resets the form (selected resource class and specified properties) preserving the active ontology.
     */
    resetForm() {
        if (this.activeOntology !== undefined) {
            this.getResourceClassesAndPropertiesForOntology(this.activeOntology);
        }
    }

}
