import { Component, Inject, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
    ApiResponseData,
    ApiResponseError,
    ClassDefinition,
    Constants,
    DeleteOntologyResponse,
    DeleteResourceClass,
    KnoraApiConnection,
    ListsResponse,
    OntologiesMetadata,
    OntologyMetadata,
    ProjectResponse,
    PropertyDefinition,
    ReadOntology,
    ReadProject,
    ResourceClassDefinition,
    UpdateOntology
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, Session, SessionService, SortingService } from '@dasch-swiss/dsp-ui';
import { CacheService } from 'src/app/main/cache/cache.service';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';
import { ErrorHandlerService } from 'src/app/main/error/error-handler.service';
import { DefaultInfo, DefaultResourceClasses } from './default-data/default-resource-classes';
import { ResourceClassFormService } from './resource-class-form/resource-class-form.service';

export interface OntologyInfo {
    id: string;
    label: string;
}

@Component({
    selector: 'app-ontology',
    templateUrl: './ontology.component.html',
    styleUrls: ['./ontology.component.scss']
})
export class OntologyComponent implements OnInit {

    // general loading status for progess indicator
    loading: boolean;

    // loading status during open-ontology-process
    loadOntology: boolean;

    // permissions of logged-in user
    session: Session;
    sysAdmin: boolean = false;
    projectAdmin: boolean = false;

    // project shortcode; as identifier in project cache service
    projectcode: string;

    // project data
    project: ReadProject;

    // all project ontologies
    ontologies: ReadOntology[] = [];

    // existing project ontology names
    existingOntologyNames: string[] = [];

    // current/selected ontology
    ontology: ReadOntology;

    ontoClasses: ClassDefinition[];

    ontoProperties: PropertyDefinition[];

    // selected ontology id
    ontologyIri: string = undefined;

    // form to select ontology from list
    ontologyForm: FormGroup;

    // display resource classes as grid or as graph
    view: 'classes' | 'properties' | 'graph' = 'classes';

    // i18n setup
    itemPluralMapping = {
        ontology: {
            '=1': '1 data model',
            other: '# data models'
        }
    };

    /**
     * list of all default resource classes (sub class of)
     */
    defaultClasses: DefaultInfo[] = DefaultResourceClasses.data;

    @ViewChild('ontologyEditor', { read: ViewContainerRef }) ontologyEditor: ViewContainerRef;

    // @ViewChild(AddToDirective, { static: false }) addToHost: AddToDirective;

    // @ViewChild('addResourceClassComponent', { static: false }) addResourceClass: AddResourceClassComponent;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _dialog: MatDialog,
        private _errorHandler: ErrorHandlerService,
        private _fb: FormBuilder,
        private _resourceClassFormService: ResourceClassFormService,
        private _route: ActivatedRoute,
        private _router: Router,
        private _session: SessionService,
        private _sortingService: SortingService,
        private _titleService: Title
    ) {

        // get the shortcode of the current project
        this._route.parent.paramMap.subscribe((params: Params) => {
            this.projectcode = params.get('shortcode');
        });

        if (this._route.snapshot) {
            // get ontology iri from route
            if (this._route.snapshot.params.id) {
                this.ontologyIri = decodeURIComponent(this._route.snapshot.params.id);
            }
            // get view from route: classes, properties or graph
            this.view = (this._route.snapshot.params.view ? this._route.snapshot.params.view : 'classes');
        }

        // set the page title
        if (this.ontologyIri) {
            this._titleService.setTitle('Project ' + this.projectcode + ' | Data model');
        } else {
            // set the page title in case of more than one existing project ontologies
            this._titleService.setTitle('Project ' + this.projectcode + ' | Data models');
        }
    }

    ngOnInit() {
        this.loading = true;

        // get information about the logged-in user
        this.session = this._session.getSession();
        // is the logged-in user system admin?
        this.sysAdmin = this.session.user.sysAdmin;

        // default value for projectAdmin
        this.projectAdmin = this.sysAdmin;

        // set the project cache
        this._cache.get(this.projectcode, this._dspApiConnection.admin.projectsEndpoint.getProjectByShortcode(this.projectcode));

        // get the project data from cache
        this._cache.get(this.projectcode, this._dspApiConnection.admin.projectsEndpoint.getProjectByShortcode(this.projectcode)).subscribe(
            (response: ApiResponseData<ProjectResponse>) => {
                this.project = response.body.project;

                // is logged-in user projectAdmin?
                this.projectAdmin = this.sysAdmin ? this.sysAdmin : this.session.user.projectAdmin.some(e => e === this.project.id);

                // get the ontologies for this project
                this.initOntologiesList();

                this.ontologyForm = this._fb.group({
                    ontology: new FormControl({
                        value: this.ontologyIri, disabled: false
                    })
                });

                this.ontologyForm.valueChanges.subscribe(val => this.onValueChanged(val.ontology));

            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
                this.loading = false;
            }
        );
    }

    /**
     * build the list of project ontologies
     * and cache them as ReadOntology array
     */
    initOntologiesList(): void {

        this.loading = true;

        // reset existing ontology names and ontologies
        this.existingOntologyNames = [];
        this.ontologies = [];

        this._dspApiConnection.v2.onto.getOntologiesByProjectIri(this.project.id).subscribe(
            (response: OntologiesMetadata) => {

                if (!response.ontologies.length) {
                    this.setCache();
                } else {
                    // in case project has only one ontology: open this ontology
                    // because there will be no form to select an ontlogy
                    if (response.ontologies.length === 1) {
                        // open this ontology
                        this.openOntologyRoute(response.ontologies[0].id, this.view);
                        this.ontologyIri = response.ontologies[0].id;
                    }

                    response.ontologies.forEach(ontoMeta => {
                        // set list of already existing ontology names
                        // it will be used in ontology form
                        // because ontology name has to be unique
                        const name = this._resourceClassFormService.getOntologyName(ontoMeta.id);
                        this.existingOntologyNames.push(name);

                        // get each ontology
                        this._dspApiConnection.v2.onto.getOntology(ontoMeta.id, true).subscribe(
                            (readOnto: ReadOntology) => {

                                this.ontologies.push(readOnto);

                                if (ontoMeta.id === this.ontologyIri) {
                                    // one ontology is selected:
                                    // get all information to display this ontology
                                    // with all classes, properties and connected lists
                                    this.loadOntology = true;
                                    this.ontology = readOnto;
                                    this._cache.set('currentOntology', this.ontology);

                                    // grab the onto class information to display
                                    const allOntoClasses = readOnto.getAllClassDefinitions();

                                    // reset the ontology classes
                                    this.ontoClasses = [];

                                    // display only the classes which are not a subClass of Standoff
                                    allOntoClasses.forEach(resClass => {
                                        if (resClass.subClassOf.length) {
                                            const splittedSubClass = resClass.subClassOf[0].split('#');
                                            if (!splittedSubClass[0].includes(Constants.StandoffOntology) && !splittedSubClass[1].includes('Standoff')) {
                                                this.ontoClasses.push(resClass);
                                            }
                                        }
                                    });
                                    // sort classes by label
                                    // --> TODO: add sort functionallity to the gui
                                    this.ontoClasses = this._sortingService.keySortByAlphabetical(this.ontoClasses, 'label');

                                    // grab the onto properties information to display
                                    const allOntoProperties = readOnto.getAllPropertyDefinitions();

                                    // reset the ontology properties
                                    this.ontoProperties = [];

                                    // display only the properties which are not a subjectType of Standoff
                                    allOntoProperties.forEach(resProp => {
                                        const standoff = (resProp.subjectType ? resProp.subjectType.includes('Standoff') : false);
                                        if (resProp.objectType !== Constants.LinkValue && !standoff) {
                                            this.ontoProperties.push(resProp);
                                        }
                                    });
                                    // sort properties by label
                                    // --> TODO: add sort functionallity to the gui
                                    this.ontoProperties = this._sortingService.keySortByAlphabetical(this.ontoProperties, 'label');

                                    this.loadOntology = false;
                                }
                                if (response.ontologies.length === this.ontologies.length) {
                                    this.ontologies = this._sortingService.keySortByAlphabetical(this.ontologies, 'label');
                                    this._cache.set('currentProjectOntologies', this.ontologies);
                                    this.setCache();
                                }
                            },
                            (error: ApiResponseError) => {
                                this._errorHandler.showMessage(error);
                            }
                        );

                    });

                }

            },
            (error: ApiResponseError) => {
                this.ontologies = [];
                this._errorHandler.showMessage(error);
                this.loading = false;
            }
        );
    }

    // update view after selecting an ontology from dropdown
    onValueChanged(id: string) {

        if (!this.ontologyForm) {
            return;
        }

        // reset and open selected ontology
        this.resetOntology(id);

    }

    /**
     * Opens ontology route by iri
     * @param id ontology id/iri
     * @param view 'classes' | 'properties' | ' graph'
     */
    openOntologyRoute(id: string, view: 'classes' | 'properties' | 'graph' = 'classes') {
        this.view = view;
        const goto = 'project/' + this.projectcode + '/ontologies/' + encodeURIComponent(id) + '/' + view;
        this._router.navigateByUrl(goto, { skipLocationChange: false });
    }

    resetOntology(id: string) {

        this.ontology = undefined;
        this.ontoClasses = [];
        this.openOntologyRoute(id, this.view);
        this.initOntologiesList();

    }

    filterOwlClass(owlClass: any) {
        return (owlClass['@type'] === 'owl:class');
    }

    /**
     * Opens ontology form
     * @param mode
     * @param [iri] only in edit mode
     */
    openOntologyForm(mode: 'createOntology' | 'editOntology', iri?: string): void {
        const dialogConfig: MatDialogConfig = {
            width: '640px',
            maxHeight: '80vh',
            position: {
                top: '112px'
            },
            data: { mode: mode, title: name, id: iri, project: this.project.shortcode, existing: this.existingOntologyNames }
        };

        const dialogRef = this._dialog.open(
            DialogComponent,
            dialogConfig
        );

        dialogRef.afterClosed().subscribe((ontologyId: string) => {

            // in case of new ontology, go to correct route and update the view
            if (ontologyId) {
                this.ontologyIri = ontologyId;
                // reset and open selected ontology
                this.ontologyForm.controls['ontology'].setValue(this.ontologyIri);
            } else {
                this.initOntologiesList();
            }
        });
    }

    /**
     * Opens resource class form
     * @param mode
     * @param resClassInfo (could be subClassOf (create mode) or resource class itself (edit mode))
     */
    openResourceClassForm(mode: 'createResourceClass' | 'editResourceClass', resClassInfo: DefaultInfo): void {

        const dialogConfig: MatDialogConfig = {
            disableClose: true,
            width: '840px',
            maxHeight: '90vh',
            position: {
                top: '112px'
            },
            data: { id: resClassInfo.iri, title: resClassInfo.label, subtitle: 'Customize resource class', mode: mode, project: this.project.id }
        };

        const dialogRef = this._dialog.open(
            DialogComponent,
            dialogConfig
        );

        dialogRef.afterClosed().subscribe(result => {
            // update the view
            this.initOntologiesList();
        });
    }

    /**
     * Updates cardinality
     * @param subClassOf resource class
     */
    updateCard(subClassOf: ResourceClassDefinition) {

        const dialogConfig: MatDialogConfig = {
            disableClose: true,
            width: '840px',
            maxHeight: '90vh',
            position: {
                top: '112px'
            },
            data: { mode: 'updateCardinality', id: subClassOf.id, title: subClassOf.label, subtitle: 'Update the metadata fields of resource class', project: this.project.id }
        };

        const dialogRef = this._dialog.open(
            DialogComponent,
            dialogConfig
        );

        dialogRef.afterClosed().subscribe(result => {
            // update the view
            this.initOntologiesList();
        });
    }

    /**
    * Delete either ontology or resource class
    *
    * @param mode Can be 'Ontology' or 'ResourceClass'
    * @param id
    * @param title
    */
    delete(mode: 'Ontology' | 'ResourceClass', info: DefaultInfo) {
        const dialogConfig: MatDialogConfig = {
            width: '560px',
            maxHeight: '80vh',
            position: {
                top: '112px'
            },
            data: { mode: 'delete' + mode, title: info.label }
        };

        const dialogRef = this._dialog.open(
            DialogComponent,
            dialogConfig
        );

        dialogRef.afterClosed().subscribe(answer => {
            if (answer === true) {
                // delete and refresh the view
                switch (mode) {
                    case 'Ontology':
                        this.loading = true;
                        this.loadOntology = true;
                        const ontology = new UpdateOntology();
                        ontology.id = this.ontology.id;
                        ontology.lastModificationDate = this.ontology.lastModificationDate;
                        this._dspApiConnection.v2.onto.deleteOntology(ontology).subscribe(
                            (response: DeleteOntologyResponse) => {
                                // reset current ontology
                                this.ontology = undefined;
                                // get the ontologies for this project
                                this.initOntologiesList();
                                // go to project ontology page
                                const goto = 'project/' + this.projectcode + '/ontologies/';
                                this._router.navigateByUrl(goto, { skipLocationChange: false });
                            },
                            (error: ApiResponseError) => {
                                this._errorHandler.showMessage(error);
                                this.loading = false;
                                this.loadOntology = false;
                            }
                        );
                        break;

                    case 'ResourceClass':
                        // delete resource class and refresh the view
                        this.loadOntology = true;
                        const resClass: DeleteResourceClass = new DeleteResourceClass();
                        resClass.id = info.iri;
                        resClass.lastModificationDate = this.ontology.lastModificationDate;
                        this._dspApiConnection.v2.onto.deleteResourceClass(resClass).subscribe(
                            (response: OntologyMetadata) => {
                                this.loading = false;
                                this.resetOntology(this.ontologyIri);
                            },
                            (error: ApiResponseError) => {
                                this._errorHandler.showMessage(error);
                                this.loading = false;
                                this.loadOntology = false;
                            }
                        );
                        break;
                }

            }
        });
    }

    setCache() {
        // get all lists from the project
        // it will be used to set gui attribute in a list property
        this._dspApiConnection.admin.listsEndpoint.getListsInProject(this.project.id).subscribe(
            (response: ApiResponseData<ListsResponse>) => {
                this._cache.set('currentOntologyLists', response.body.lists);
                this.loadOntology = false;
                this.loading = false;
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
                this.loading = false;
                this.loadOntology = false;
            }
        );

    }

}
