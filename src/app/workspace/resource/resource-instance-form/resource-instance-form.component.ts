import { Component, EventEmitter, Inject, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
    ApiResponseError,
    Constants,
    CreateFileValue,
    CreateResource,
    CreateTextValueAsString,
    CreateValue,
    KnoraApiConnection,
    OntologiesMetadata,
    ReadOntology,
    ReadResource,
    ResourceClassAndPropertyDefinitions,
    ResourceClassDefinition,
    ResourcePropertyDefinition,
    StoredProject
} from '@dasch-swiss/dsp-js';
import { Subscription } from 'rxjs';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { ErrorHandlerService } from 'src/app/main/services/error-handler.service';
import { SortingService } from 'src/app/main/services/sorting.service';
import { DefaultClass, DefaultResourceClasses } from 'src/app/project/ontology/default-data/default-resource-classes';
import { ProjectService } from '../services/project.service';
import { ResourceService } from '../services/resource.service';
import { SelectOntologyComponent } from './select-ontology/select-ontology.component';
import { SelectPropertiesComponent } from './select-properties/select-properties.component';
import { SelectResourceClassComponent } from './select-resource-class/select-resource-class.component';

@Component({
    selector: 'app-resource-instance-form',
    templateUrl: './resource-instance-form.component.html',
    styleUrls: ['./resource-instance-form.component.scss']
})
export class ResourceInstanceFormComponent implements OnInit, OnChanges, OnDestroy {

    // ontology's resource class iri
    @Input() selectedResourceClassIri?: string;

    // corresponding project (iri)
    @Input() selectedProject?: string;

    // output to close dialog
    @Output() closeDialog: EventEmitter<any> = new EventEmitter<any>();

    /**
     * update title and subtitle in dialog header (by switching from step 1 (resource class) to step 2 (properties))
     */
    @Output() updateParent: EventEmitter<{ title: string; subtitle: string }> = new EventEmitter<{ title: string; subtitle: string }>();

    @ViewChild('selectProps') selectPropertiesComponent: SelectPropertiesComponent;
    @ViewChild('selectResourceClass') selectResourceClassComponent: SelectResourceClassComponent;
    @ViewChild('selectOntology') selectOntologyComponent: SelectOntologyComponent;

    // forms
    selectResourceForm: UntypedFormGroup;
    propertiesParentForm: UntypedFormGroup;

    // form validation status
    formValid = false;

    showNextStepForm: boolean;

    // we have to know, when the user went back in the form because of some automatic processes
    userWentBack = false;

    usersProjects: StoredProject[];
    ontologiesMetadata: OntologiesMetadata;
    selectedOntology: string;
    resourceClasses: ResourceClassDefinition[];
    selectedResourceClass: ResourceClassDefinition;
    resource: ReadResource;
    resourceLabel: string;
    properties: ResourcePropertyDefinition[];
    ontologyInfo: ResourceClassAndPropertyDefinitions;

    // get default resource class definitions to translate the subClassOf iri into human readable words
    // list of default resource classes
    defaultClasses: DefaultClass[] = DefaultResourceClasses.data;

    // selected resource class has a file value property: display the corresponding upload form
    hasFileValue: 'stillImage' | 'movingImage' | 'audio' | 'document' | 'text' | 'archive';

    fileValue: CreateFileValue;

    valueOperationEventSubscription: Subscription;

    // prepare content
    preparing = false;
    // loading in case of submit
    loading = false;
    // in case of any error
    error = false;
    errorMessage: any;

    propertiesObj = {};

    // feature toggle for new concept
    beta = false;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _errorHandler: ErrorHandlerService,
        private _fb: UntypedFormBuilder,
        private _project: ProjectService,
        private _resourceService: ResourceService,
        private _route: ActivatedRoute,
        private _router: Router,
        private _sortingService: SortingService
    ) {
        // get feature toggle information if url contains beta
        if(this._route.parent) {
            this.beta = (this._route.parent.snapshot.url[0].path === 'beta');
        }
    }

    ngOnInit(): void {
        if (this.selectedResourceClassIri && this.selectedProject) {
            // get ontology iri from res class iri
            const splittedIri = this.selectedResourceClassIri.split('#');
            this.selectedOntology = splittedIri[0];
            this.selectProperties(this.selectedResourceClassIri);
            this.showNextStepForm = false;
            this.propertiesParentForm = this._fb.group({});
        } else {
            // parent form is empty, it gets passed to the child components
            this.selectResourceForm = this._fb.group({});
            this.propertiesParentForm = this._fb.group({});

            // initialize projects to be used for the project selection in the creation form
            this._project.initializeProjects().subscribe(
                (proj: StoredProject[]) => {
                    this.usersProjects = proj;

                    // notifies the user that he/she is not part of any project
                    if (proj.length === 0) {
                        this.errorMessage = 'You are not a part of any active projects or something went wrong';
                    }
                }
            );
            // boolean to show only the first step of the form (= selectResourceForm)
            this.showNextStepForm = true;
        }

    }

    ngOnChanges(changes: SimpleChanges) {
        if(changes.selectedResourceClassIri) {
            this.ngOnInit();
        }
    }

    ngOnDestroy() {
        // unsubscribe from the event bus when component is destroyed
        if (this.valueOperationEventSubscription !== undefined) {
            this.valueOperationEventSubscription.unsubscribe();
        }
    }

    /**
     * go to the next form page: from project/onto/resource selections to properties form
     */
    nextStep() {
        this.showNextStepForm = !this.showNextStepForm;

        // use response to go further with properties
        this.updateParent.emit({ title: this.resourceLabel, subtitle: 'Set the property values of the resource' });
    }

    /**
     * go to previous step: from properties form back to project/onto/resource selections
     */
    prevStep(ev: Event) {
        ev.preventDefault();
        this.updateParent.emit({ title: this.resourceLabel, subtitle: 'Create new resource' });
        this.showNextStepForm = true;
        this.userWentBack = true;
    }

    /**
     * reset the title if the user went back to the previous form and changes the selected values
     * or if the user changes a selected value after s/he's already selected a res class
     */
    resetTitle() {
        if (this.userWentBack || this.resourceLabel) {
            this.updateParent.emit({ title: 'New resource', subtitle: 'Create new resource' });
        }
    }

    submitData() {

        this.loading = true;

        if (this.propertiesParentForm.valid) {

            const createResource = new CreateResource();

            const resLabelVal = <CreateTextValueAsString>this.selectPropertiesComponent.createValueComponent.getNewValue();

            createResource.label = resLabelVal.text;

            createResource.type = this.selectedResourceClass.id;

            createResource.attachedToProject = this.selectedProject;

            this.selectPropertiesComponent.switchPropertiesComponent.forEach((child) => {
                const createVal = child.createValueComponent.getNewValue();
                const iri = child.property.id;
                if (createVal instanceof CreateValue) {
                    if (this.propertiesObj[iri]) {
                        // if a key already exists, add the createVal to the array
                        this.propertiesObj[iri].push(createVal);
                    } else {
                        // if no key exists, add one and add the createVal as the first value of the array
                        this.propertiesObj[iri] = [createVal];
                    }
                }
            });

            if (this.fileValue) {
                switch (this.hasFileValue) {
                    case 'stillImage':
                        this.propertiesObj[Constants.HasStillImageFileValue] = [this.fileValue];
                        break;
                    case 'document':
                        this.propertiesObj[Constants.HasDocumentFileValue] = [this.fileValue];
                        break;
                    case 'audio':
                        this.propertiesObj[Constants.HasAudioFileValue] = [this.fileValue];
                        break;
                    case 'movingImage':
                        this.propertiesObj[Constants.HasMovingImageFileValue] = [this.fileValue];
                        break;
                    case 'archive':
                        this.propertiesObj[Constants.HasArchiveFileValue] = [this.fileValue];
                        break;
                    case 'text':
                        this.propertiesObj[Constants.HasTextFileValue] = [this.fileValue];
                }
            }

            createResource.properties = this.propertiesObj;

            this._dspApiConnection.v2.res.createResource(createResource).subscribe(
                (res: ReadResource) => {
                    this.resource = res;

                    let goto: string;

                    if (this.beta) {
                        const uuid = this._resourceService.getResourceUuid(this.resource.id);
                        const params = this._route.snapshot.url;
                        // go to ontology/[ontoname]/[classname]/[classuuid] relative to parent route beta/project/[projectcode]/
                        this._router.navigate([params[0].path, params[1].path, params[2].path, uuid],
                            { relativeTo: this._route.parent }).then(() => {
                            // refresh whole page; todo: would be better to use an event emitter to the parent to update the list of resource classes
                            window.location.reload();
                        });
                    } else {
                        const path = this._resourceService.getResourcePath(this.resource.id);
                        goto = '/resource' + path;
                        this._router.navigate([]).then(result => window.open(goto, '_blank'));
                        this.closeDialog.emit();
                    }

                },
                (error: ApiResponseError) => {
                    this.error = true;
                    this.loading = false;
                    this._errorHandler.showMessage(error);
                }
            );

        } else {
            this.propertiesParentForm.markAllAsTouched();
        }
    }

    /**
     * get all the ontologies of the selected project
     * @param projectIri
     */
    selectOntologies(projectIri: string) {
        this.resetTitle();

        if (projectIri) {
            // if this method is called with the same value as the current selectedProject, there is no need to do anything
            if (projectIri !== this.selectedProject) {
                // any time the project is changed:

                // reset any error message
                this.errorMessage = undefined;

                // reset the selected ontology because it will be invalid
                this.selectedOntology = undefined;

                // reset the ontologies metadata before it is generated again to trigger the select-ontology OnInit method
                this.ontologiesMetadata = undefined;

                // reset resourceClasses to hide the select-resource-class form in case it is already visible
                this.resourceClasses = undefined;

                // remove the form control to ensure the parent Formgroups validity is correct
                // this will be added to the parent Formgroup again when the select-ontology OnInit method is called
                this.selectResourceForm.removeControl('ontologies');

                // assign the selected iri to selectedProject
                this.selectedProject = projectIri;

                this.loading = true;

                this._dspApiConnection.v2.onto.getOntologiesByProjectIri(projectIri).subscribe(
                    (response: OntologiesMetadata) => {
                        // filter out system ontologies
                        response.ontologies = response.ontologies.filter(onto => onto.attachedToProject !== Constants.SystemProjectIRI);

                        this.ontologiesMetadata = response;

                        // notifies the user that the selected project does not have any data models defined yet.
                        if (!this.selectOntologyComponent && response.ontologies.length === 0) {
                            this.errorMessage = 'No data models defined for the select project.';
                        }

                        this.loading = false;
                    },
                    (error: ApiResponseError) => {
                        this.loading = false;
                        this._errorHandler.showMessage(error);
                    }
                );
            }
        } else {
            this.errorMessage = 'You are not a part of any active projects.';
        }
    }

    /**
     * get all the resource classes of the selected ontology
     * @param ontologyIri
     */
    selectResourceClasses(ontologyIri: string) {
        this.resetTitle();

        // reset errorMessage, it will be reassigned in the else clause if needed
        this.errorMessage = undefined;

        if (ontologyIri) {
            // if this method is called with the same value as the current selectedOntology, there is no need to do anything
            if (ontologyIri !== this.selectedOntology) {

                // reset any error message
                this.errorMessage = undefined;

                // reset selectedResourceClass since it will be invalid
                this.selectedResourceClass = undefined;

                this.resourceLabel = undefined;

                // remove the form control to ensure the parent Formgroups validity is correct
                // this will be added to the parent Formgroup again when the select-resource-class OnInit method is called
                this.selectResourceForm.removeControl('resources');

                // if there is already a select-resource-class component (i.e. the user clicked the back button), reset the resource & label
                if (this.selectResourceClassComponent) {
                    // since the component already exists, we need to add the control back here as it is normally done in the OnInit of the component
                    this.selectResourceForm.addControl('resources', this.selectResourceClassComponent.form);
                }

                this.selectedOntology = ontologyIri;

                this.loading = true;

                this._dspApiConnection.v2.onto.getOntology(ontologyIri).subscribe(
                    (onto: ReadOntology) => {
                        this.resourceClasses = onto.getClassDefinitionsByType(ResourceClassDefinition);

                        // sort resource classes by label
                        this.resourceClasses = this._sortingService.keySortByAlphabetical(this.resourceClasses, 'label');

                        if (this.selectResourceClassComponent && this.resourceClasses.length === 1) {
                            // since the component already exists, the ngAfterInit method of the component will not be called so we must assign the value here manually
                            this.selectResourceClassComponent.form.controls.resources.setValue(this.resourceClasses[0].id);
                        }

                        // notifies the user that the selected ontology does not have any resource classes defined yet.
                        if ((!this.selectResourceClassComponent || this.selectOntologyComponent.form.controls.ontologies.valueChanges) && this.resourceClasses.length === 0) {
                            this.errorMessage = 'No resources defined for the selected ontology.';
                        }

                        this.loading = false;
                    },
                    (error: ApiResponseError) => {
                        this.loading = false;
                        this._errorHandler.showMessage(error);
                    }
                );
            }
        } else {
            this.errorMessage = 'No ontology defined for the selected project.';
        }
    }


    /**
     * get all the properties of the selected resource class
     * @param resourceClassIri
     */
    selectProperties(resourceClassIri: string) {
        // reset errorMessage, it will be reassigned in the else clause if needed
        this.errorMessage = undefined;

        // if the client undoes the selection of a resource class, use the active ontology as a fallback
        if (resourceClassIri === null) {
            this.selectResourceClasses(this.selectedOntology);
        } else if (resourceClassIri) {
            this.preparing = true;
            this.loading = true;
            this._dspApiConnection.v2.ontologyCache.reloadCachedItem(this.selectedOntology).subscribe(
                (res: ReadOntology) => {
                    this._dspApiConnection.v2.ontologyCache.getResourceClassDefinition(resourceClassIri).subscribe(
                        (onto: ResourceClassAndPropertyDefinitions) => {
                            this.ontologyInfo = onto;

                            this.selectedResourceClass = onto.classes[resourceClassIri];

                            // set label from resource class
                            const defaultClassLabel = this.defaultClasses.find(i => i.iri === this.selectedResourceClass.subClassOf[0]);
                            this.resourceLabel = this.selectedResourceClass.label + (defaultClassLabel ? ' (' + defaultClassLabel.label + ')' : '');

                            // filter out all props that cannot be edited or are link props but also the hasFileValue props
                            this.properties = onto.getPropertyDefinitionsByType(ResourcePropertyDefinition).filter(
                                prop =>
                                    !prop.isLinkProperty &&
                                    prop.isEditable &&
                                    prop.id !== Constants.HasStillImageFileValue &&
                                    prop.id !== Constants.HasDocumentFileValue &&
                                    prop.id !== Constants.HasAudioFileValue &&
                                    prop.id !== Constants.HasMovingImageFileValue &&
                                    prop.id !== Constants.HasArchiveFileValue &&
                                    prop.id !== Constants.HasTextFileValue
                                    // --> TODO for UPLOAD: expand with other representation file values
                            );

                            if (onto.properties[Constants.HasStillImageFileValue]) {
                                this.hasFileValue = 'stillImage';
                            } else if (onto.properties[Constants.HasDocumentFileValue]) {
                                this.hasFileValue = 'document';
                            } else if (onto.properties[Constants.HasAudioFileValue]) {
                                this.hasFileValue = 'audio';
                            } else if (onto.properties[Constants.HasMovingImageFileValue]) {
                                this.hasFileValue = 'movingImage';
                            } else if (onto.properties[Constants.HasArchiveFileValue]) {
                                this.hasFileValue = 'archive';
                            } else if (onto.properties[Constants.HasTextFileValue]) {
                                this.hasFileValue = 'text';
                            } else {
                                this.hasFileValue = undefined;
                            }

                            // notifies the user that the selected resource does not have any properties defined yet.
                            if (!this.selectPropertiesComponent && this.properties.length === 0 && !this.hasFileValue) {
                                this.errorMessage = 'No properties defined for the selected resource.';
                            }
                            this.preparing = false;
                            this.loading = false;

                        },
                        (error: ApiResponseError) => {
                            this.preparing = false;
                            this.loading = false;
                            this._errorHandler.showMessage(error);
                        }
                    );
                });
        } else {
            this.errorMessage = 'No resource class defined for the selected ontology.';
        }

    }

    setFileValue(file: CreateFileValue) {
        this.fileValue = file;
    }

}
