import { Component, Inject, OnInit, ViewChild, ViewContainerRef } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { ApiResponseData, ApiResponseError, ClassDefinition, KnoraApiConnection, ProjectResponse, ReadOntology, ReadProject } from '@knora/api';
import { ApiServiceError, ApiServiceResult, KnoraApiConnectionToken, OntologyService, Session } from '@knora/core';
import { CacheService } from 'src/app/main/cache/cache.service';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';
import { DefaultResourceClasses, ResourceClass } from './default-data/default-resource-classes';
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
    ontologies: OntologyInfo[];
    // existing project ontology names
    existingOntologyNames: string[] = [];

    // ontology JSON-LD object
    ontology: ReadOntology;

    ontoClasses: ClassDefinition[];

    // selected ontology
    ontologyIri: string = undefined;

    // form to select ontology from list
    ontologyForm: FormGroup;

    // i18n setup
    itemPluralMapping = {
        ontology: {
            // '=0': '0 Ontologies',
            '=1': '1 data model',
            other: '# data models'
        }
    };

    /**
     * list of all default resource classs (sub class of)
     */
    resourceClasss: ResourceClass[] = DefaultResourceClasses.data;

    @ViewChild('ontologyEditor', { read: ViewContainerRef, static: false }) ontologyEditor: ViewContainerRef;

    // @ViewChild(AddToDirective, { static: false }) addToHost: AddToDirective;

    // @ViewChild('addResourceClassComponent', { static: false }) addResourceClass: AddResourceClassComponent;

    constructor(
        @Inject(KnoraApiConnectionToken) private knoraApiConnection: KnoraApiConnection,
        private _ontologyService: OntologyService,
        private _ontologyHelperService: ResourceClassFormService,
        private _cache: CacheService,
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
        this.session = JSON.parse(localStorage.getItem('session'));
        // is the logged-in user system admin?
        this.sysAdmin = this.session.user.sysAdmin;

        // default value for projectAdmin
        this.projectAdmin = this.sysAdmin;

        // set the cache
        this._cache.get(this.projectcode, this.knoraApiConnection.admin.projectsEndpoint.getProjectByShortcode(this.projectcode));

        // get the project data from cache
        this._cache.get(this.projectcode, this.knoraApiConnection.admin.projectsEndpoint.getProjectByShortcode(this.projectcode)).subscribe(
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

        this._ontologyService.getProjectOntologies(encodeURI(this.project.id)).subscribe(
            (ontologies: ApiServiceResult) => {

                let name: string;

                if (ontologies.body['@graph'] && ontologies.body['@graph'].length > 0) {
                    // more than one ontology
                    this.ontologies = [];

                    for (const ontology of ontologies.body['@graph']) {
                        const info: OntologyInfo = {
                            id: ontology['@id'],
                            label: ontology['rdfs:label']
                        };

                        this.ontologies.push(info);

                        // set list of existing names
                        name = this._ontologyHelperService.getOntologyName(ontology['@id']);
                        this.existingOntologyNames.push(name);
                    }

                    this.loading = false;

                } else if (ontologies.body['@id'] && ontologies.body['rdfs:label']) {
                    // only one ontology
                    this.ontologies = [
                        {
                            id: ontologies.body['@id'],
                            label: ontologies.body['rdfs:label']
                        }
                    ];

                    this.ontologyIri = ontologies.body['@id'];
                    // set list of existing name
                    name = this._ontologyHelperService.getOntologyName(this.ontologyIri);
                    this.existingOntologyNames.push(name);

                    // open this ontology
                    this.openOntologyRoute(this.ontologyIri);
                    this.getOntology(this.ontologyIri);

                    this.loading = false;
                } else {
                    // none ontology defined yet
                    this.ontologies = [];
                    this.loading = false;
                }

            },
            (error: ApiServiceError) => {
                console.error(error);
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

    // open ontology route by iri
    openOntologyRoute(id: string) {
        const goto = 'project/' + this.projectcode + '/ontologies/' + encodeURIComponent(id);
        this._router.navigateByUrl(goto, { skipLocationChange: false });
    }

    // get ontology
    getOntology(id: string) {

        this.ontoClasses = [];

        this.loadOntology = true;

        this.knoraApiConnection.v2.onto.getOntology(id).subscribe(
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

    openOntologyForm(mode: string, name?: string, iri?: string): void {
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

        dialogRef.afterClosed().subscribe(() => {
            // update the view
            this.initList();
        });
    }

    openResourceClassForm(mode: string, type: ResourceClass): void {

        // set ontology cache
        this._cache.set('currentOntology', this.ontology);

        const dialogConfig: MatDialogConfig = {
            width: '720px',
            maxHeight: '90vh',
            position: {
                top: '112px'
            },
            data: { name: type.name, title: type.label, subtitle: 'Customize resource class', mode: mode, project: this.project.id }
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
                this.loadOntology = true;

                switch (mode) {
                    case 'Ontology':
                        this.loading = true;
                        this._ontologyService.deleteOntology(id, this.ontology.lastModificationDate).subscribe(
                            (response: any) => {
                                this.ontology = undefined;
                                // get the ontologies for this project
                                const goto = 'project/' + this.projectcode + '/ontologies/';
                                this._router.navigateByUrl(goto, { skipLocationChange: true });
                                this.initList();
                                this.loading = false;
                                this.loadOntology = false;
                            },
                            (error: ApiServiceError) => {
                                // TODO: show message
                                console.error(error);
                                this.loading = false;
                                this.loadOntology = false;
                            }
                        );
                        break;

                    case 'ResourceClass':
                        // delete reresource class and refresh the view
                        this.loadOntology = true;

                        this._ontologyService.deleteResourceClass(id, this.ontology.lastModificationDate).subscribe(
                            (response: any) => {
                                this.getOntology(this.ontologyIri);
                            },
                            (error: ApiServiceError) => {
                                // TODO: show message
                                this.getOntology(this.ontologyIri);
                                console.error(error);
                            }
                        );
                        break;
                }

            }
        });
    }

}
