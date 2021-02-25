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
import { DefaultClass, DefaultResourceClasses } from './default-data/default-resource-classes';
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
    resourceClass: DefaultClass[] = DefaultResourceClasses.data;

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

        //

        // set the page title
        if (this.ontologyIri) {
            this._titleService.setTitle('Project ' + this.projectcode + ' | Data model');
        } else {
            // set the page title in case of more than one existing project ontologies
            this._titleService.setTitle('Project ' + this.projectcode + ' | Data models');
        }
    }

    ngOnInit() {
        // this.loading = true;

        // get information about the logged-in user
        this.session = this._session.getSession();
        // is the logged-in user system admin?
        this.sysAdmin = this.session.user.sysAdmin;

        // default value for projectAdmin
        this.projectAdmin = this.sysAdmin;

        // set the cache
        this._cache.get(this.projectcode, this._dspApiConnection.admin.projectsEndpoint.getProjectByShortcode(this.projectcode));

        // get the project data from cache
        this._cache.get(this.projectcode, this._dspApiConnection.admin.projectsEndpoint.getProjectByShortcode(this.projectcode)).subscribe(
            (response: ApiResponseData<ProjectResponse>) => {
                this.project = response.body.project;

                // is logged-in user projectAdmin?
                this.projectAdmin = this.sysAdmin ? this.sysAdmin : this.session.user.projectAdmin.some(e => e === this.project.id);

                // get the ontologies for this project
                this.initList();

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
     * Asyncs for each: Get all ontologies of project as ReadOntology
     * @param ontologies
     * @param callback
     */
    async asyncForEach(ontologies: OntologyMetadata[], callback: any) {
        for (let i = 0; i < ontologies.length; i++) {
            // set list of already existing ontology names
            // it will be used in ontology form
            // because ontology name has to be unique
            const name = this._resourceClassFormService.getOntologyName(ontologies[i].id);
            this.existingOntologyNames.push(name);

            // get each ontology
            this.getOntology(ontologies[i].id, true);
            await callback(ontologies[i]);
        }
    }

    /**
     * build the list of ontologies
     */
    initList(): void {

        this.loading = true;

        // reset existing ontology names and ontologies
        this.existingOntologyNames = [];
        this.ontologies = [];

        const waitFor = (ms: number) => new Promise(r => setTimeout(r, ms));

        this._dspApiConnection.v2.onto.getOntologiesByProjectIri(this.project.id).subscribe(
            (response: OntologiesMetadata) => {

                const loadAndCache = async () => {
                    await this.asyncForEach(response.ontologies, async (onto: OntologyMetadata) => {
                        await waitFor(200);
                        if (this.ontologies.length === response.ontologies.length) {
                            this.setCache();
                        }
                    });
                };

                if (!response.ontologies.length) {
                    this.setCache();
                } else {
                    // in case project has only one ontology: open this ontology
                    // because there will be no form to select ontlogy
                    if (response.ontologies.length === 1) {
                        // open this ontology
                        this.openOntologyRoute(response.ontologies[0].id, this.view);
                        this.ontologyIri = response.ontologies[0].id;
                    }
                    loadAndCache();
                }

            },
            (error: ApiResponseError) => {
                // temporary solution. There's a bug in js-lib in case of 0 ontologies
                // s. youtrack issue DSP-863
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

    // get ontology info
    getOntology(id: string, updateOntologiesList: boolean = false) {
        this._dspApiConnection.v2.onto.getOntology(id, true).subscribe(
            (response: ReadOntology) => {

                if (updateOntologiesList) {
                    this.ontologies.push(response);
                }

                // get current ontology as a separate part
                if (response.id === this.ontologyIri) {
                    this.ontology = response;
                    // the ontology is the selected one
                    // grab the onto class information to display
                    this.ontoClasses = [];

                    const classKeys: string[] = Object.keys(response.classes);
                    // create list of resource classes without standoff classes
                    for (const c of classKeys) {
                        const splittedSubClass = this.ontology.classes[c].subClassOf[0].split('#');

                        if (splittedSubClass[0] !== Constants.StandoffOntology && splittedSubClass[1] !== 'StandoffTag' && splittedSubClass[1] !== 'StandoffLinkTag' && splittedSubClass[1] !== 'StandoffEventTag') {
                            this.ontoClasses.push(this.ontology.classes[c]);
                        }
                    }
                    this.ontoClasses = this._sortingService.keySortByAlphabetical(this.ontoClasses, 'label');

                    // grab the onto properties information to display
                    this.ontoProperties = [];
                    const propKeys: string[] = Object.keys(response.properties);
                    // create list of resource classes without standoff classes
                    for (const p of propKeys) {
                        const standoff = (this.ontology.properties[p].subjectType ? this.ontology.properties[p].subjectType.includes('Standoff') : false);
                        if (this.ontology.properties[p].objectType !== Constants.LinkValue && !standoff) {
                            this.ontoProperties.push(this.ontology.properties[p]);
                        }
                    }

                    this.ontoProperties = this._sortingService.keySortByAlphabetical(this.ontoProperties, 'label');

                    this.loadOntology = false;
                }

            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
                this.loadOntology = false;
            }
        );
    }

    resetOntology(id: string) {

        this.ontology = undefined;
        this.ontoClasses = [];
        this.openOntologyRoute(id, this.view);
        this.getOntology(id);

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
                this.initList();
            }
        });
    }

    /**
     * Opens resource class form
     * @param mode
     * @param resClassInfo (could be subClassOf (create mode) or resource class itself (edit mode))
     */
    openResourceClassForm(mode: 'createResourceClass' | 'editResourceClass', resClassInfo: DefaultClass): void {

        // set cache for ontology and lists
        this.setCache();

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
            this.initList();
            this.getOntology(this.ontologyIri);
        });
    }


    /**
     * Updates cardinality
     * @param subClassOf resource class
     */
    updateCard(subClassOf: ResourceClassDefinition) {

        // set cache for ontology and lists
        this.setCache();

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
            this.initList();
            this.getOntology(this.ontologyIri);
        });
    }

    /**
    * Delete either ontology or sourcetype
    *
    * @param id
    * @param mode Can be 'Ontology' or 'ResourceClass'
    * @param title
    */
    delete(id: string, mode: 'Ontology' | 'ResourceClass', title: string) {
        const dialogConfig: MatDialogConfig = {
            width: '560px',
            maxHeight: '80vh',
            position: {
                top: '112px'
            },
            data: { mode: 'delete' + mode, title: title }
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
                                this.initList();
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
                        resClass.id = id;
                        resClass.lastModificationDate = this.ontology.lastModificationDate;


                        this._dspApiConnection.v2.onto.deleteResourceClass(resClass).subscribe(
                            (response: OntologyMetadata) => {
                                this.loading = false;
                                this.resetOntology(this.ontologyIri);
                                // this.getOntology(this.ontologyIri);
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
        // set cache for current ontology
        this._cache.set('currentOntology', this.ontology);
        this._cache.set('currentProjectOntologies', this.ontologies);

        // get all lists from the project
        // it will be used to set gui attribute in a list property
        this._dspApiConnection.admin.listsEndpoint.getListsInProject(this.project.id).subscribe(
            (response: ApiResponseData<ListsResponse>) => {
                this._cache.set('currentOntologyLists', response.body.lists);

                this.loading = false;
                this.loadOntology = false;
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
                this.loading = false;
                this.loadOntology = false;
            }
        );

    }

}
