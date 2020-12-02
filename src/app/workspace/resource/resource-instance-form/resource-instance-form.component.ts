import { Component, EventEmitter, Inject, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import {
    ApiResponseData,
    ApiResponseError,
    ClassDefinition,
    Constants,
    CreateResource,
    CreateValue,
    KnoraApiConnection,
    OntologiesMetadata,
    ProjectsResponse,
    PropertyDefinition,
    ReadResource,
    ResourceClassAndPropertyDefinitions,
    ResourceClassDefinition,
    ResourcePropertyDefinition,
    StoredProject,
    UserResponse
} from '@dasch-swiss/dsp-js';
import {
    DspApiConnectionToken,
    Session,
    SessionService,
    SortingService
} from '@dasch-swiss/dsp-ui';
import { Subscription } from 'rxjs';
import { CacheService } from 'src/app/main/cache/cache.service';
import { SelectOntologyComponent } from './select-ontology/select-ontology.component';
import { SelectPropertiesComponent } from './select-properties/select-properties.component';
import { SelectResourceClassComponent } from './select-resource-class/select-resource-class.component';

// https://dev.to/krumpet/generic-type-guard-in-typescript-258l
type Constructor<T> = { new(...args: any[]): T };

const typeGuard = <T>(o: any, className: Constructor<T>): o is T => {
    return o instanceof className;
};

export interface Properties {
    [index: string]: ResourcePropertyDefinition;
}

@Component({
    selector: 'app-resource-instance-form',
    templateUrl: './resource-instance-form.component.html',
    styleUrls: ['./resource-instance-form.component.scss']
})
export class ResourceInstanceFormComponent implements OnInit, OnDestroy {

    // output to close dialog
    @Output() closeDialog: EventEmitter<any> = new EventEmitter<any>();

    /**
     * update title and subtitle in dialog header (by switching from step 1 (resource class) to step 2 (properties))
     */
    @Output() updateParent: EventEmitter<{ title: string, subtitle: string }> = new EventEmitter<{ title: string, subtitle: string }>();

    @ViewChild('selectProps') selectPropertiesComponent: SelectPropertiesComponent;
    @ViewChild('selectResourceClass') selectResourceClassComponent: SelectResourceClassComponent;
    @ViewChild('selectOntology') selectOntologyComponent: SelectOntologyComponent;

    // forms
    selectResourceForm: FormGroup;
    propertiesParentForm: FormGroup;

    // form validation status
    formValid = false;

    session: Session;
    username: string;

    showNextStepForm: boolean;

    usersProjects: StoredProject[];
    selectedProject: string;
    ontologiesMetadata: OntologiesMetadata;
    selectedOntology: string;
    resourceClasses: ResourceClassDefinition[];
    selectedResourceClass: ResourceClassDefinition;
    resource: ReadResource;
    resourceLabel: string;
    properties: Properties;
    propertiesAsArray: Array<ResourcePropertyDefinition>; // properties as an Array structure
    ontologyInfo: ResourceClassAndPropertyDefinitions;

    valueOperationEventSubscription: Subscription;

    errorMessage: string;

    propertiesObj = {};

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _router: Router,
        private _session: SessionService,
        private _fb: FormBuilder,
        private _sortingService: SortingService
    ) {
        this.session = this._session.getSession();
        this.username = this.session.user.name;
    }


    ngOnInit(): void {

        // parent form is empty, it gets passed to the child components
        this.selectResourceForm = this._fb.group({});
        this.propertiesParentForm = this._fb.group({});

        // initialize projects to be used for the project selection in the creation form
        this.initializeProjects();

        // boolean to show only the first step of the form (= selectResourceForm)
        this.showNextStepForm = true;

    }

    ngOnDestroy() {
        // unsubscribe from the event bus when component is destroyed
        if (this.valueOperationEventSubscription !== undefined) {
            this.valueOperationEventSubscription.unsubscribe();
        }
    }

    /**
     * Go to the next form page: from project/onto/resource selections to properties form
     */
    nextStep() {
        this.showNextStepForm = !this.showNextStepForm;

        // use response to go further with properties
        this.updateParent.emit({ title: this.resourceLabel, subtitle: 'Define the properties of the resource' });
    }

    /**
     * Go to previous step: from properties form back to project/onto/resource selections
     */
    prevStep(ev: Event) {
        ev.preventDefault();
        this.updateParent.emit({ title: this.resourceLabel, subtitle: 'Create new resource' });
        this.showNextStepForm = true;
    }

    submitData() {

        const createResource = new CreateResource();

        createResource.label = this.resourceLabel;

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

        createResource.properties = this.propertiesObj;

        this._dspApiConnection.v2.res.createResource(createResource).subscribe(
            (res: ReadResource) => {
                this.resource = res;

                // navigate to the resource viewer page
                this._router.navigateByUrl('/resource', { skipLocationChange: true }).then(() =>
                    this._router.navigate(['/resource/' + encodeURIComponent(this.resource.id)])
                );

                this.closeDialog.emit();
            }
        );

    }

    /**
     * Get the user's project(s)
     */
    initializeProjects(): void {
        this.usersProjects = [];

        if (this.username && this.session.user.sysAdmin === false) {
            this._cache.get(this.username, this._dspApiConnection.admin.usersEndpoint.getUserByUsername(this.username)).subscribe(
                (response: ApiResponseData<UserResponse>) => {

                    for (const project of response.body.user.projects) {
                        this.usersProjects.push(project);
                    }
                },
                (error: ApiResponseError) => {
                    console.error(error);
                }
            );
        } else if (this.session.user.sysAdmin === true) {
            this._dspApiConnection.admin.projectsEndpoint.getProjects().subscribe(
                (response: ApiResponseData<ProjectsResponse>) => {
                    this.usersProjects = response.body.projects;
                },
                (error: ApiResponseError) => {
                    console.error(error);
                }
            );
        }

    }

    /**
     * Get all the ontologies of the selected project
     * @param projectIri
     */
    selectOntologies(projectIri: string) {
        if (projectIri) {
            // if this method is called with the same value as the current selectedProject, there is no need to do anything
            if (projectIri !== this.selectedProject) {
                // any time the project is changed:

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

                this._dspApiConnection.v2.onto.getOntologiesByProjectIri(projectIri).subscribe(
                    (response: OntologiesMetadata) => {
                        // filter out system ontologies
                        response.ontologies = response.ontologies.filter(onto => onto.attachedToProject !== Constants.SystemProjectIRI);

                        this.ontologiesMetadata = response;
                    },
                    (error: ApiResponseError) => {
                        console.error(error);
                    }
                );
            }
        } else {
            this.errorMessage = 'You are not part of any project.';
        }
    }

    /**
     * Get all the resource classes of the selected ontology
     * @param ontologyIri
     */
    selectResourceClasses(ontologyIri: string) {
        // reset errorMessage, it will be reassigned in the else clause if needed
        this.errorMessage = undefined;

        if (ontologyIri) {
            // if this method is called with the same value as the current selectedOntology, there is no need to do anything
            if (ontologyIri !== this.selectedOntology) {

                // reset selectedResourceClass since it will be invalid
                this.selectedResourceClass = undefined;

                this.resourceLabel = undefined;

                // remove the form control to ensure the parent Formgroups validity is correct
                // this will be added to the parent Formgroup again when the select-resource-class OnInit method is called
                this.selectResourceForm.removeControl('resources');

                // if there is already a select-resource-class component (i.e. the user clicked the back button), reset the resource & label
                if (this.selectResourceClassComponent) {
                    this.selectResourceClassComponent.form.controls.resources.setValue(null);
                    this.selectResourceClassComponent.form.controls.label.setValue(null);

                    // since the component already exists, we need to add the control back here as it is normally done in the OnInit of the component
                    this.selectResourceForm.addControl('resources', this.selectResourceClassComponent.form);
                }

                this.selectedOntology = ontologyIri;

                this._dspApiConnection.v2.ontologyCache.getOntology(ontologyIri).subscribe(
                    onto => {
                        this.resourceClasses = this._makeResourceClassesArray(onto.get(ontologyIri).classes);

                        if (this.selectResourceClassComponent && this.resourceClasses.length === 1) {
                            // since the component already exists, the ngAfterInit method of the component will not be called so we must assign the value here manually
                            this.selectResourceClassComponent.form.controls.resources.setValue(this.resourceClasses[0].id);
                        }
                    },
                    (error: ApiResponseError) => {
                        console.error(error);
                    }
                );
            }
        } else {
            this.errorMessage = 'No ontology defined for the selected project.';
        }
    }

    /**
     * Get the resource label typed in the form in select-resource-class
     * @param label
     */
    getResourceLabel(label: string) {
        this.resourceLabel = label;
    }

    /**
     * Get all the properties of the selected resource class
     * @param resourceClassIri
     */
    selectProperties(resourceClassIri: string) {

        // reset errorMessage, it will be reassigned in the else clause if needed
        this.errorMessage = undefined;

        // if the client undoes the selection of a resource class, use the active ontology as a fallback
        if (resourceClassIri === null) {
            this.selectResourceClasses(this.selectedOntology);
        } else if (resourceClassIri) {
            this._dspApiConnection.v2.ontologyCache.getResourceClassDefinition(resourceClassIri).subscribe(
                onto => {
                    this.ontologyInfo = onto;

                    this.selectedResourceClass = onto.classes[resourceClassIri];

                    this.properties = this._makeResourceProperties(onto.properties);

                    this.convertPropObjectAsArray();

                }
            );
        } else {
            this.errorMessage = 'No resource class defined for the selected ontology.';
        }

    }

    /**
     * Given a map of class definitions,
     * returns an array of resource class definitions.
     *
     * @param classDefs a map of class definitions
     */
    private _makeResourceClassesArray(classDefs: { [index: string]: ClassDefinition }): ResourceClassDefinition[] {

        const classIris = Object.keys(classDefs);

        // get resource class defs
        return classIris.filter(resClassIri => {
            return typeGuard(classDefs[resClassIri], ResourceClassDefinition);
        }).map(
            (resClassIri: string) => {
                return classDefs[resClassIri] as ResourceClassDefinition;
            }
        );

    }

    /**
     * Given a map of property definitions,
     * returns a map of resource property definitions.
     *
     * @param propertyDefs a map of property definitions
     */
    private _makeResourceProperties(propertyDefs: { [index: string]: PropertyDefinition }): Properties {
        const resProps: Properties = {};

        const propIris = Object.keys(propertyDefs);

        propIris.filter(
            (propIri: string) => {
                return typeGuard(propertyDefs[propIri], ResourcePropertyDefinition);
            }
        ).forEach((propIri: string) => {
            resProps[propIri] = (propertyDefs[propIri] as ResourcePropertyDefinition);
        });

        return resProps;
    }

    private convertPropObjectAsArray() {
        // represent the properties as an array to be accessed by the template
        const propsArray = [];

        for (const propIri in this.properties) {
            if (this.properties.hasOwnProperty(propIri)) {
                const prop = this.properties[propIri];

                // only list editable props that are not link value props
                if (prop.isEditable && !prop.isLinkProperty) {
                    propsArray.push(this.properties[propIri]);
                }
            }
        }

        // sort properties by label (ascending)
        this.propertiesAsArray = this._sortingService.keySortByAlphabetical(propsArray, 'label');
    }

}
