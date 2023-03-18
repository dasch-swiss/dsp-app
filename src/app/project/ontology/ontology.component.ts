import { Component, HostListener, Inject, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatLegacyDialog as MatDialog, MatLegacyDialogConfig as MatDialogConfig } from '@angular/material/legacy-dialog';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
    ApiResponseData,
    ApiResponseError,
    CanDoResponse,
    ClassDefinition,
    Constants,
    DeleteOntologyResponse,
    DeleteResourceClass,
    DeleteResourceProperty,
    KnoraApiConnection,
    ListsResponse,
    OntologiesMetadata,
    OntologyMetadata,
    ProjectResponse,
    PropertyDefinition,
    ReadOntology,
    ReadProject,
    UpdateOntology,
    UserResponse
} from '@dasch-swiss/dsp-js';
import { CacheService } from 'src/app/main/cache/cache.service';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';
import { ErrorHandlerService } from 'src/app/main/services/error-handler.service';
import { Session, SessionService } from 'src/app/main/services/session.service';
import { SortingService } from 'src/app/main/services/sorting.service';
import { ProjectService } from 'src/app/workspace/resource/services/project.service';
import { DefaultProperties, PropertyCategory, PropertyInfoObject } from './default-data/default-properties';
import { DefaultClass, DefaultResourceClasses } from './default-data/default-resource-classes';
import { OntologyService } from './ontology.service';

/**
 * contains the information about the assignment of a property to a class
 **/
export interface PropertyAssignment {
    resClass: ClassDefinition;
    property: PropertyInfoObject;
}

export interface OntologyProperties {
    ontology: string;
    properties: PropertyDefinition[];
}

@Component({
    selector: 'app-ontology',
    templateUrl: './ontology.component.html',
    styleUrls: ['./ontology.component.scss']
})
export class OntologyComponent implements OnInit {

    @ViewChild('ontologyEditor', { read: ViewContainerRef }) ontologyEditor: ViewContainerRef;

    // general loading status for progess indicator
    loading: boolean;

    // loading status during open-ontology-process
    loadOntology: boolean;

    // permissions of logged-in user
    session: Session;
    // system admin, project admin, and project member are by default false
    sysAdmin = false;
    projectAdmin = false;
    projectMember = false;

    // project uuid; used as identifier in project cache service
    projectUuid: string;

    // project data
    project: ReadProject;

    // all project ontologies
    ontologies: ReadOntology[] = [];

    // existing project ontology names
    existingOntologyNames: string[] = [];

    // id of current ontology
    ontologyIri: string = undefined;

    // current ontology
    ontology: ReadOntology;

    // the lastModificationDate is the most important key
    // when updating something inside the ontology
    lastModificationDate: string;

    ontologyCanBeDeleted: boolean;

    // all resource classes in the current ontology
    ontoClasses: ClassDefinition[];
    // expand the resource class cards
    expandClasses = true;

    // all properties in the current ontology
    ontoProperties: OntologyProperties;

    // form to select ontology from list
    ontologyForm: UntypedFormGroup;

    // display resource classes as grid or as graph
    view: 'classes' | 'properties' | 'graph' = 'classes';

    // i18n setup; in the user interface we use the term
    // data model for ontology
    itemPluralMapping = {
        ontology: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            '=1': '1 data model',
            other: '# data models'
        }
    };

    /**
     * list of all default resource classes (subclass of)
     */
    defaultClasses: DefaultClass[] = DefaultResourceClasses.data;
    defaultProperties: PropertyCategory[] = DefaultProperties.data;

    // disable content on small devices
    disableContent = false;

    // feature toggle for new concept
    beta = false;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _dialog: MatDialog,
        private _errorHandler: ErrorHandlerService,
        private _fb: UntypedFormBuilder,
        private _ontologyService: OntologyService,
        private _route: ActivatedRoute,
        private _router: Router,
        private _sessionService: SessionService,
        private _sortingService: SortingService,
        private _titleService: Title,
        private _projectService: ProjectService
    ) {}

    @HostListener('window:resize', ['$event']) onWindowResize(e: Event) {
        this.disableContent = (window.innerWidth <= 768);
        // reset the page title
        if (!this.disableContent) {
            this._setPageTitle();
        }
    }

    ngOnInit() {
        this.loading = true;
        // get the uuid of the current project
        this._route.parent.paramMap.subscribe((params: Params) => {
            this.projectUuid = params.get('uuid');
        });

        if (this._route.snapshot) {
            // get ontology iri from route
            if (this._route.snapshot.params.id) {
                this.ontologyIri = decodeURIComponent(this._route.snapshot.params.id);
            }
            // get the selected view from route: display classes, properties or graph
            this.view = (this._route.snapshot.params.view ? this._route.snapshot.params.view : 'classes');
        }

        // get feature toggle information if url contains beta
        this.beta = (this._route.parent.snapshot.url[0].path === 'beta');
        if (this.beta) {
            const uuid = this._route.parent.snapshot.params.uuid;
            this._route.params.subscribe(params => {
                this.loading = true;
                this._dspApiConnection.admin.projectsEndpoint.getProjectByIri(this._projectService.uuidToIri(uuid)).subscribe(
                    (res: ApiResponseData<ProjectResponse>) => {
                        const shortcode = res.body.project.shortcode;
                        const iriBase = this._ontologyService.getIriBaseUrl();
                        const ontologyName = params['onto'];
                        this.ontologyIri = `${iriBase}/ontology/${shortcode}/${ontologyName}/v2`;

                        this.initView();
                    }
                );
            });
        } else {
            // to be removed once the beta view is implemented
            this.initView();
        }
    }

    initView(): void {
        this.disableContent = (window.innerWidth <= 768);

        // get information about the logged-in user
        this.session = this._sessionService.getSession();

        // is the logged-in user system admin?
        this.sysAdmin = this.session.user.sysAdmin;

        // default value for projectAdmin
        this.projectAdmin = this.sysAdmin;

        // get the project data from cache
        this._cache.get(this.projectUuid).subscribe(
            (response: ReadProject) => {
                this.project = response;

                // set the page title
                this._setPageTitle();

                // is logged-in user projectAdmin?
                this.projectAdmin = this.sysAdmin ? this.sysAdmin : this.session.user.projectAdmin.some(e => e === this.project.id);

                this._dspApiConnection.admin.usersEndpoint.getUserByUsername(this.session.user.name).subscribe(
                    (userResponse: ApiResponseData<UserResponse>) => {
                        this.projectMember = userResponse.body.user.projects.some(p => p.shortcode === this.project.shortcode);

                        // get the ontologies for this project
                        this.initOntologiesList();
                    });

                this.ontologyForm = this._fb.group({
                    ontology: new UntypedFormControl({
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
                    if (response.ontologies.length === 1 && !this.beta) {
                        // open this ontology
                        this.openOntologyRoute(response.ontologies[0].id, this.view);
                        this.ontologyIri = response.ontologies[0].id;
                        this.lastModificationDate = response.ontologies[0].lastModificationDate;
                    }

                    response.ontologies.forEach(ontoMeta => {
                        // set list of already existing ontology names
                        // it will be used in ontology form
                        // because ontology name has to be unique
                        const name = this._ontologyService.getOntologyName(ontoMeta.id);
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
                                    this.resetOntologyView(readOnto);
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

    initOntology(iri: string) {
        this._dspApiConnection.v2.onto.getOntology(iri, true).subscribe(
            (response: ReadOntology) => {
                this.resetOntologyView(response);
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );
    }

    initOntoClasses(allOntoClasses: ClassDefinition[]) {
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
    }

    initOntoProperties(allOntoProperties: PropertyDefinition[]) {

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
        this.ontoProperties = {
            ontology: this.ontology.id,
            properties: this._sortingService.keySortByAlphabetical(listOfProperties, 'label')
        };

    }

    /**
     * update view after selecting an ontology from dropdown
     * @param id
     */
    onValueChanged(id: string) {
        if (!this.ontologyForm) {
            return;
        }
        // reset and open selected ontology
        this.resetOntology(id);
    }

    /**
     * opens ontology route by iri
     * @param id ontology id/iri
     * @param view 'classes' | 'properties' | ' graph'
     */
    openOntologyRoute(id: string, view: 'classes' | 'properties' | 'graph' = 'classes') {
        this.view = view;
        const goto = 'project/' + this.projectUuid + '/ontologies/' + encodeURIComponent(id) + '/' + view;
        this._router.navigateByUrl(goto, { skipLocationChange: false });
    }

    /**
     * resets the current view and the selected ontology
     * @param id
     */
    resetOntology(id: string) {
        this.ontology = undefined;
        this.ontoClasses = [];
        this.openOntologyRoute(id, this.view);
        this.initOntologiesList();
    }

    resetOntologyView(ontology: ReadOntology) {
        this.ontology = ontology;
        this.lastModificationDate = this.ontology.lastModificationDate;
        this._cache.set('currentOntology', ontology);

        this._cache.get('currentProjectOntologies').subscribe(
            (ontologies: ReadOntology[]) => {
                // update current list of project ontologies
                ontologies[ontologies.findIndex(onto => onto.id === ontology.id)] = ontology;
                this._cache.set('currentProjectOntologies', ontologies);
            },
            () => {} // don't log error to rollbar if 'currentProjectOntologies' does not exist in the cache
        );

        // grab the onto class information to display
        this.initOntoClasses(ontology.getAllClassDefinitions());

        // grab the onto properties information to display
        this.initOntoProperties(ontology.getAllPropertyDefinitions());

        // check if the ontology can be deleted
        this._dspApiConnection.v2.onto.canDeleteOntology(this.ontology.id).subscribe(
            (response: CanDoResponse) => {
                this.ontologyCanBeDeleted = response.canDo;
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );

        this.loadOntology = false;
    }

    /**
     * filters owl class
     * @param owlClass
     */
    filterOwlClass(owlClass: any) {
        return (owlClass['@type'] === 'owl:class');
    }

    /**
     * opens ontology form to create or edit ontology info
     * @param mode
     * @param [iri] only in edit mode
     */
    openOntologyForm(mode: 'createOntology' | 'editOntology', iri?: string): void {

        const title = (iri ? this.ontology.label : 'Data model');

        const uuid = this._projectService.iriToUuid(this.project.id);

        const dialogConfig: MatDialogConfig = {
            width: '640px',
            maxHeight: '80vh',
            position: {
                top: '112px'
            },
            data: { mode: mode, title: title, id: iri, project: uuid, existing: this.existingOntologyNames }
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
     * opens resource class form to create or edit resource class info
     * @param mode
     * @param resClassInfo (could be subClassOf (create mode) or resource class itself (edit mode))
     */
    openResourceClassForm(mode: 'createResourceClass' | 'editResourceClass', resClassInfo: DefaultClass): void {

        const dialogConfig: MatDialogConfig = {
            width: '640px',
            maxHeight: '80vh',
            position: {
                top: '112px'
            },
            data: { id: resClassInfo.iri, title: resClassInfo.label, subtitle: 'Customize resource class', mode: mode }
        };

        const dialogRef = this._dialog.open(
            DialogComponent,
            dialogConfig
        );

        dialogRef.afterClosed().subscribe(result => {
            // update the view
            this.initOntologiesList();
            if (this.beta) {
                // refresh whole page; todo: would be better to use an event emitter to the parent to update the list of resource classes
                window.location.reload();
            }
        });
    }

    /**
     * opens property form to create or edit property info
     * @param mode whether an existing property is assigned or a new one is created
     * @param propertyInfo the property to assign and edit
     */
    openPropertyForm(mode: 'createProperty' | 'editProperty', propertyInfo: PropertyInfoObject): void {

        const title = (propertyInfo.propDef ? propertyInfo.propDef.label : propertyInfo.propType.group + ': ' + propertyInfo.propType.label);

        const dialogConfig: MatDialogConfig = {
            width: '640px',
            maxHeight: '80vh',
            position: {
                top: '112px'
            },
            data: { propInfo: propertyInfo, title: title, subtitle: 'Customize property', mode: mode }
        };

        const dialogRef = this._dialog.open(
            DialogComponent,
            dialogConfig
        );

        dialogRef.afterClosed().subscribe(result => {
            // get the ontologies for this project
            this.initOntologiesList();
            // update the view of resource class or list of properties
            this.initOntology(this.ontologyIri);
        });
    }

    /**
    * delete either ontology, resource class or property
    *
    * @param mode Can be 'Ontology' or 'ResourceClass'
    * @param info
    */
    delete(mode: 'Ontology' | 'ResourceClass' | 'Property', info: DefaultClass) {
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
                                let goto = `/project/${this.projectUuid}/ontologies/`;
                                if (this.beta) {
                                    goto = `/beta/project/${this.projectUuid}`;
                                }
                                this._router.navigateByUrl(goto, { skipLocationChange: false }).then(() => {
                                    // refresh whole page; todo: would be better to use an event emitter to the parent to update the list of resource classes
                                    window.location.reload();
                                });
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
                                if (this.beta) {
                                    // refresh whole page; todo: would be better to use an event emitter to the parent to update the list of resource classes
                                    window.location.reload();
                                }
                            },
                            (error: ApiResponseError) => {
                                this._errorHandler.showMessage(error);
                                this.loading = false;
                                this.loadOntology = false;
                            }
                        );
                        break;
                    case 'Property':
                        // delete resource property and refresh the view
                        this.loadOntology = true;
                        const resProp: DeleteResourceProperty = new DeleteResourceProperty();
                        resProp.id = info.iri;
                        resProp.lastModificationDate = this.ontology.lastModificationDate;
                        this._dspApiConnection.v2.onto.deleteResourceProperty(resProp).subscribe(
                            (response: OntologyMetadata) => {
                                this.loading = false;
                                // get the ontologies for this project
                                this.initOntologiesList();
                                // update the view of resource class or list of properties
                                this.initOntology(this.ontologyIri);
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

    private _setPageTitle() {
        this._titleService.setTitle('Project ' + this.project.shortname + ' | Data model' + (this.ontologyIri ? '' : 's'));
    }

}
