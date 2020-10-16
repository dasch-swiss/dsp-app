import { Component, Inject, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
    ApiResponseData,
    ApiResponseError,
    ClassDefinition,
    DeleteOntologyResponse,
    DeleteResourceClass,
    KnoraApiConnection,
    OntologiesMetadata,
    OntologyMetadata,
    ProjectResponse,
    ReadOntology,
    ReadProject,
    UpdateOntology
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, Session, SessionService } from '@dasch-swiss/dsp-ui';
import { CacheService } from 'src/app/main/cache/cache.service';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';
import { DefaultResourceClasses, DefaultClass } from './default-data/default-resource-classes';
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

    // ontologies
    ontologies: OntologyMetadata[];
    // existing project ontology names
    existingOntologyNames: string[] = [];

    // ontology JSON-LD object
    ontology: ReadOntology;

    ontoClasses: ClassDefinition[];

    // selected ontology
    ontologyIri: string = undefined;

    // form to select ontology from list
    ontologyForm: FormGroup;

    // display resource classes as grid or as graph
    view: 'grid' | 'graph' = 'grid';

    // i18n setup
    itemPluralMapping = {
        ontology: {
            '=1': '1 data model',
            other: '# data models'
        }
    };

    /**
     * list of all default resource classs (sub class of)
     */
    resourceClass: DefaultClass[] = DefaultResourceClasses.data;

    @ViewChild('ontologyEditor', { read: ViewContainerRef }) ontologyEditor: ViewContainerRef;

    // @ViewChild(AddToDirective, { static: false }) addToHost: AddToDirective;

    // @ViewChild('addResourceClassComponent', { static: false }) addResourceClass: AddResourceClassComponent;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _resourceClassFormService: ResourceClassFormService,
        private _cache: CacheService,
        private _session: SessionService,
        private _dialog: MatDialog,
        private _fb: FormBuilder,
        private _titleService: Title,
        private _route: ActivatedRoute,
        private _router: Router) {

        // get the shortcode of the current project
        this._route.parent.paramMap.subscribe((params: Params) => {
            this.projectcode = params.get('shortcode');
        });

        // get ontology iri from route
        if (this._route.snapshot && this._route.snapshot.params.id) {
            this.ontologyIri = decodeURIComponent(this._route.snapshot.params.id);
            this.getOntology(this.ontologyIri);
        }

        // set the page title
        if (this.ontologyIri) {
            this._titleService.setTitle('Project ' + this.projectcode + ' | Data model');
        } else {
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

                this.loading = false;

            },
            (error: ApiResponseError) => {
                console.error(error);
                this.loading = false;
            }
        );
    }

    /**
     * build the list of ontologies
     */
    initList(): void {

        this.loading = true;

        // reset existing ontology names
        this.existingOntologyNames = [];

        this._dspApiConnection.v2.onto.getOntologiesByProjectIri(this.project.id).subscribe(
            (response: OntologiesMetadata) => {
                this.ontologies = response.ontologies;

                // get list of already existing ontology names
                // name has to be unique
                for (const ontology of response.ontologies) {
                    let name = this._resourceClassFormService.getOntologyName(ontology.id);
                    this.existingOntologyNames.push(name);
                }

                // in case project has only one ontology: open this ontology
                // because there will be no form to select ontlogy
                if(response.ontologies.length === 1) {
                    // open this ontology
                    this.openOntologyRoute(this.ontologies[0].id);
                    this.getOntology(this.ontologies[0].id);
                }

                this.loading = false;
            },
            (error: ApiResponseError) => {
                // temporary solution. There's a bug in js-lib in case of 0 ontologies
                // s. youtrack issue DSP-863
                this.ontologies = [];

                console.error(error);
            }
        )
    }

    // update view after selecting an ontology from dropdown
    onValueChanged(id: string) {

        if (!this.ontologyForm) {
            return;
        }

        // reset and open selected ontology
        this.resetOntology(id);

    }

    // open ontology route by iri
    openOntologyRoute(id: string) {
        const goto = 'project/' + this.projectcode + '/ontologies/' + encodeURIComponent(id);
        this._router.navigateByUrl(goto, { skipLocationChange: false });
    }

    // get ontology
    getOntology(id: string) {

        this.ontoClasses = [];

        this.loadOntology = true;

        this._dspApiConnection.v2.onto.getOntology(id).subscribe(
            (response: ReadOntology) => {

                this.ontology = response;

                if (!this.ontoClasses.length) {
                    const classKeys: string[] = Object.keys(response.classes);

                    for (const c of classKeys) {
                        this.ontoClasses.push(this.ontology.classes[c]);
                    }
                }
                this.loadOntology = false;
            },
            (error: any) => {
                console.error(error);
                this.loadOntology = false;
            }
        );

    }

    resetOntology(id: string) {

        this.ontology = undefined;
        this.ontoClasses = [];
        this.openOntologyRoute(id);
        this.getOntology(id);

    }

    filterOwlClass(owlClass: any) {
        // console.log(owlClass);
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

            // reset view in any case
            this.initList();

            // in case of new ontology, go to correct route and update the view
            if (ontologyId) {
                this.ontologyIri = ontologyId;
                // reset and open selected ontology
                this.ontologyForm.controls['ontology'].setValue(this.ontologyIri);
            }
        });
    }

    /**
     * Opens resource class form
     * @param mode
     * @param subClassOf
     */
    openResourceClassForm(mode: 'createResourceClass' | 'editResourceClass', subClassOf: DefaultClass): void {

        // set ontology cache
        this._cache.set('currentOntology', this.ontology);

        const dialogConfig: MatDialogConfig = {
            width: '720px',
            maxHeight: '90vh',
            position: {
                top: '112px'
            },
            data: { name: subClassOf.iri, title: subClassOf.label, subtitle: 'Customize resource class', mode: mode, project: this.project.id }
        };

        const dialogRef = this._dialog.open(DialogComponent, dialogConfig);

        dialogRef.afterClosed().subscribe(result => {
            // update the view
            this.getOntology(this.ontologyIri);
        });
    }

    /**
     * Delete either ontology or sourcetype
     *
     * @param  {string} id
     * @param  {string} mode Can be 'Ontology' or 'ResourceClass'
     * @param  {string} title
     */
    delete(id: string, mode: string, title: string) {
        const dialogConfig: MatDialogConfig = {
            width: '560px',
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
                                this.loading = false;
                                this.loadOntology = false;
                                // get the ontologies for this project
                                this.initList();
                                // go to project ontology page
                                const goto = 'project/' + this.projectcode + '/ontologies/';
                                this._router.navigateByUrl(goto, { skipLocationChange: false });
                            },
                            (error: ApiResponseError) => {
                                console.error(error);
                                this.loading = false;
                                this.loadOntology = false;
                            }
                        );

                        break;

                    case 'ResourceClass':
                        // delete reresource class and refresh the view
                        this.loadOntology = true;
                        const resClass: DeleteResourceClass = new DeleteResourceClass();
                        resClass.id = id;
                        resClass.lastModificationDate = this.ontology.lastModificationDate;


                        this._dspApiConnection.v2.onto.deleteResourceClass(resClass).subscribe(
                            (response: OntologyMetadata) => {
                                this.loading = false;
                                this.getOntology(this.ontologyIri);
                            },
                            (error: ApiResponseError) => {
                                console.error(error);
                                this.loading = false;
                            }
                        );
                    break;
                }

            }
        });
    }

    /**
     *
     * @param view 'grid' | ' graph'
     */
    toggleView(view: 'grid' | 'graph') {
        this.view = view;
    }

}
