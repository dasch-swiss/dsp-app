import {
    Component,
    EventEmitter,
    Inject,
    Input,
    OnChanges,
    OnDestroy,
    OnInit,
    Output,
    SimpleChanges,
    ViewChild
} from '@angular/core';
import { AbstractControl, FormBuilder } from '@angular/forms';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import {
    Constants,
    CreateLinkValue,
    KnoraApiConnection,
    ReadLinkValue,
    ReadOntology,
    ReadResource,
    ReadResourceSequence,
    ResourceClassAndPropertyDefinitions,
    ResourceClassDefinition,
    ResourcePropertyDefinition,
    UpdateLinkValue
} from '@dasch-swiss/dsp-js';
import { Subscription } from 'rxjs';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { DialogComponent, DialogEvent } from 'src/app/main/dialog/dialog.component';
import { BaseValueDirective } from 'src/app/main/directive/base-value.directive';

export function resourceValidator(control: AbstractControl) {
    const invalid = !(control.value === null || control.value === '' || control.value instanceof ReadResource);
    return invalid ? { invalidType: { value: control.value } } : null;
}

@Component({
    selector: 'app-link-value',
    templateUrl: './link-value.component.html',
    styleUrls: ['./link-value.component.scss']
})

export class LinkValueComponent extends BaseValueDirective implements OnInit, OnChanges, OnDestroy {
    @Input() displayValue?: ReadLinkValue;
    @Input() parentResource: ReadResource;
    @Input() propIri: string;
    @Input() currentOntoIri: string;

    @Output() referredResourceClicked: EventEmitter<ReadLinkValue> = new EventEmitter();
    @Output() referredResourceHovered: EventEmitter<ReadLinkValue> = new EventEmitter();

    @ViewChild(MatAutocompleteTrigger) autocomplete: MatAutocompleteTrigger;

    resources: ReadResource[] = [];
    restrictToResourceClass: string;
    resourceClassLabel: string;

    labelChangesSubscription: Subscription;
    // label cannot contain logical operations of lucene index
    customValidators = [resourceValidator];

    resourceClasses: ResourceClassDefinition[];
    subClasses: ResourceClassDefinition[] = [];
    properties: ResourcePropertyDefinition[];

    loadingResults = false;
    showNoResultsMessage = false;

    constructor(
        private _dialog: MatDialog,
        @Inject(FormBuilder) protected _fb: FormBuilder,
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection) {
        super();
    }

    /**
     * displays a selected resource using its label.
     *
     * @param resource the resource to be displayed (or no selection yet).
     */
    displayResource(resource: ReadResource | null): string {
        // null is the initial value (no selection yet)
        if (resource instanceof ReadResource) {
            return resource.label;
        }
    }

    /**
     * search for resources whose labels contain the given search term, restricting to to the given properties object constraint.
     * this is to be used for update and new linked resources
     *
     * @param searchTerm label to be searched
     */
    searchByLabel(searchTerm: string) {
        this.showNoResultsMessage = false;

        // at least 3 characters are required
        if (typeof searchTerm === 'string' && searchTerm.length >= 3) {
            this.loadingResults = true;
            this._dspApiConnection.v2.search.doSearchByLabel(
                searchTerm, 0, { limitToResourceClass: this.restrictToResourceClass }).subscribe(
                (response: ReadResourceSequence) => {
                    this.resources = response.resources;
                    this.loadingResults = false;
                    this.showNoResultsMessage = this.resources.length > 0;
                });
        } else {
            this.resources = [];
        }
    }

    // show the label of the linked resource
    getInitValue(): ReadResource | null {
        if (this.displayValue !== undefined) {
            return this.displayValue.linkedResource;
        } else {
            return null;
        }
    }

    standardValueComparisonFunc(initValue: ReadResource, curValue: ReadResource | string | null): boolean {
        return (curValue instanceof ReadResource) && initValue.id === curValue.id;
    }

    ngOnInit() {
        const linkType = this.parentResource.getLinkPropertyIriFromLinkValuePropertyIri(this.propIri);
        this.restrictToResourceClass = this.parentResource.entityInfo.properties[linkType].objectType;

        // get label of resource class
        this._dspApiConnection.v2.ontologyCache.getResourceClassDefinition(this.restrictToResourceClass).subscribe(
            (onto: ResourceClassAndPropertyDefinitions) => {
                this.resourceClassLabel = onto.classes[this.restrictToResourceClass].label;
            }
        );

        this._dspApiConnection.v2.ontologyCache.getOntology(this.currentOntoIri).subscribe(
            (ontoMap: Map<string, ReadOntology>) => {

                // filter out knorabase ontology
                const filteredOntoMap = new Map(
                    Array.from(ontoMap).filter(([key, _]) => key !== Constants.KnoraApiV2)
                );

                let resClasses = [];

                // loop through each ontology in the project and create an array of ResourceClassDefinitions
                filteredOntoMap.forEach( onto => {
                    resClasses = resClasses.concat(filteredOntoMap.get(onto.id).getClassDefinitionsByType(ResourceClassDefinition));
                });

                // add the superclass to the list of resource classes
                this.resourceClasses = resClasses.filter(
                    (resClassDef: ResourceClassDefinition) => resClassDef.id === this.restrictToResourceClass
                );

                // recursively loop through all of the superclass's subclasses, including nested subclasses
                // and add them to the list of resource classes
                this.resourceClasses = this.resourceClasses.concat(this._getSubclasses(resClasses, this.restrictToResourceClass));

                this.properties = filteredOntoMap.get(this.currentOntoIri).getPropertyDefinitionsByType(ResourcePropertyDefinition);
            },
            error => {
                console.error(error);
            }
        );

        super.ngOnInit();

        this.labelChangesSubscription = this.valueFormControl.valueChanges.subscribe(data => {
            this.searchByLabel(data);
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        this.resetFormControl();
    }

    // unsubscribe when the object is destroyed to prevent memory leaks
    ngOnDestroy(): void {

        if (this.labelChangesSubscription !== undefined) {
            this.labelChangesSubscription.unsubscribe();
        }
        super.ngOnDestroy();
    }

    getNewValue(): CreateLinkValue | false {
        if (this.mode !== 'create' || !this.form.valid || this.isEmptyVal()) {
            return false;
        }
        const newLinkValue = new CreateLinkValue();
        newLinkValue.linkedResourceIri = this.valueFormControl.value.id;

        if (this.commentFormControl.value) {
            newLinkValue.valueHasComment = this.commentFormControl.value;
        }

        return newLinkValue;
    }

    getUpdatedValue(): UpdateLinkValue | false {
        if (this.mode !== 'update' || !this.form.valid) {
            return false;
        }

        const updatedLinkValue = new UpdateLinkValue();

        updatedLinkValue.id = this.displayValue.id;

        updatedLinkValue.linkedResourceIri = this.valueFormControl.value.id;

        // add the submitted comment to updatedLinkValue only if user has added a comment
        if (this.commentFormControl.value) {
            updatedLinkValue.valueHasComment = this.commentFormControl.value;
        }

        return updatedLinkValue;
    }

    /**
     * emits the displayValue on click.
     */
    refResClicked() {
        this.referredResourceClicked.emit(this.displayValue);
    }

    /**
     * emits the displayValue on hover.
     */
    refResHovered() {
        this.referredResourceHovered.emit(this.displayValue);
    }

    openDialog(mode: string, ev: Event, iri?: string, resClass?: ResourceClassDefinition): void {
        ev.preventDefault();
        const dialogConfig: MatDialogConfig = {
            width: '840px',
            maxHeight: '80vh',
            position: {
                top: '112px'
            },
            data: { mode: mode, title: resClass.label, id: iri, parentResource: this.parentResource, resourceClassDefinition: resClass.id, ontoIri: this.currentOntoIri },
            disableClose: true
        };

        const dialogRef = this._dialog.open(DialogComponent, dialogConfig);

        dialogRef.afterClosed().subscribe((event: ReadResource | DialogEvent) => {
            // save button clicked
            if (event instanceof ReadResource ) {
                const newResource = event as ReadResource;

                // set value of value form control to the newly created resource
                this.form.controls.value.setValue(newResource);

                // hide the autocomplete results
                this.autocomplete.closePanel();
            }

            // cancel button clicked
            if (event === DialogEvent.DialogCanceled){
                this.resetFormControl();

                // hide the autocomplete results
                this.autocomplete.closePanel();
            }
        });
    }

    /**
     * given a resource class Iri, return all subclasses
     * @param resClasses List of all resource class definitions in the ontology
     * @param resClassRestrictionIri The IRI of the resource class to filter the list of resource class defintions by
     * @returns An array of all subclasses of type ResourceClassDefinition
     */
    private _getSubclasses(resClasses: ResourceClassDefinition[], resClassRestrictionIri: string): ResourceClassDefinition[] {

        // filter list by the provided IRI to find all subclasses of the provided IRI
        const subclasses = resClasses.filter(
            (resClassDef: ResourceClassDefinition) =>
                resClassDef.subClassOf.indexOf(resClassRestrictionIri) > -1
        );

        // add the filtered list to the list of all subclasses
        this.subClasses = this.subClasses.concat(subclasses);

        // if the provided IRI has subclasses, recursively call this function to find any subclasses of those subclasses
        if (subclasses.length){
            subclasses.forEach((sub) => {
                this._getSubclasses(resClasses, sub.id);
            });
        }

        return this.subClasses;
    }
}
