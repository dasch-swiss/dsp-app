import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
    ApiResponseData,
    ApiResponseError,
    KnoraApiConnection,
    ListNodeInfo,
    ListsResponse,
    OntologiesMetadata,
    UserResponse,
} from '@dasch-swiss/dsp-js';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { ErrorHandlerService } from '@dsp-app/src/app/main/services/error-handler.service';
import {
    Session,
    SessionService,
} from '@dsp-app/src/app/main/services/session.service';
import { OntologyService } from '../ontology/ontology.service';

@Component({
    selector: 'app-data-models',
    templateUrl: './data-models.component.html',
    styleUrls: ['./data-models.component.scss'],
})
export class DataModelsComponent implements OnInit {
    projectOntologies: OntologiesMetadata;
    projectLists: ListNodeInfo[];

    loading: boolean;

    // permissions of logged-in user
    session: Session;
    sysAdmin = false;
    projectAdmin = false;
    projectMember = false;

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _errorHandler: ErrorHandlerService,
        private _route: ActivatedRoute,
        private _router: Router,
        private _appInit: AppConfigService,
        private _ontologyService: OntologyService,
        private _session: SessionService
    ) {
        // get session
        this.session = this._session.getSession();
    }

    ngOnInit(): void {
        this.loading = true;
        const uuid = this._route.parent.snapshot.params.uuid;
        const iri = `${this._appInit.dspAppConfig.iriBase}/projects/${uuid}`;
        this._dspApiConnection.v2.onto
            .getOntologiesByProjectIri(iri)
            .subscribe((ontologies: OntologiesMetadata) => {
                this.projectOntologies = ontologies;
                if (this.projectLists) {
                    this.loading = false;
                }
            });

        // get all project lists
        this._dspApiConnection.admin.listsEndpoint
            .getListsInProject(iri)
            .subscribe(
                (lists: ApiResponseData<ListsResponse>) => {
                    this.projectLists = lists.body.lists;
                    if (this.projectOntologies) {
                        this.loading = false;
                    }
                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                }
            );

        // is logged-in user projectAdmin?
        if (this.session) {
            this.loading = true;

            // is the logged-in user system admin?
            this.sysAdmin = this.session.user.sysAdmin;

            // is the logged-in user project admin?
            this.projectAdmin = this.sysAdmin
                ? this.sysAdmin
                : this.session.user.projectAdmin.some((e) => e === iri);

            // or at least project member?
            if (!this.projectAdmin) {
                this._dspApiConnection.admin.usersEndpoint
                    .getUserByUsername(this.session.user.name)
                    .subscribe(
                        (res: ApiResponseData<UserResponse>) => {
                            const usersProjects = res.body.user.projects;
                            if (usersProjects.length === 0) {
                                // the user is not part of any project
                                this.projectMember = false;
                            } else {
                                // check if the user is member of the current project
                                // id contains the iri
                                this.projectMember = usersProjects.some(
                                    (p) => p.id === iri
                                );
                            }
                            // wait for onto and lists to load
                            if (this.projectOntologies && this.projectLists) {
                                this.loading = false;
                            }
                        },
                        (error: ApiResponseError) => {
                            this._errorHandler.showMessage(error);
                            this.loading = false;
                        }
                    );
            } else {
                this.projectMember = this.projectAdmin;

                // wait for onto and lists to load
                if (this.projectOntologies && this.projectLists) {
                    this.loading = false;
                }
            }
        }
    }

    /**
     * handles routing to the correct path
     * @param route path to route to
     * @param id optional ontology id or list id
     */
    open(route: string, id?: string) {
        let name;

        if (route === 'ontology' && id) {
            // get name of ontology
            name = this._ontologyService.getOntologyName(id);
        }
        if (route === 'list' && id) {
            // get name of list
            const array = id.split('/');
            const pos = array.length - 1;
            name = array[pos];
        }
        if (name) {
            if (route === 'ontology') {
                // route to the onto editor
                this._router.navigate(
                    [route, encodeURIComponent(name), 'editor', 'classes'],
                    { relativeTo: this._route.parent }
                );
            } else {
                // route to the list editor
                this._router.navigate([route, encodeURIComponent(name)], {
                    relativeTo: this._route.parent,
                });
            }
        } else if (route === 'docs') {
            // route to the external docs
            window.open(
                'https://docs.dasch.swiss/latest/DSP-APP/user-guide/project/#data-model',
                '_blank'
            );
        } else {
            // fallback default routing
            this._router.navigate([route], { relativeTo: this._route.parent });
        }
    }
}
