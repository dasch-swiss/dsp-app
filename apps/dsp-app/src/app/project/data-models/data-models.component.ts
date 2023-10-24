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
import {AppConfigService, RouteConstants} from '@dasch-swiss/vre/shared/app-config';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import {
    Session,
    SessionService,
} from '@dasch-swiss/vre/shared/app-session';
import { OntologyService } from '../ontology/ontology.service';

// the routes available for navigation
type DataModelRoute =
    typeof RouteConstants.ontology
    | typeof RouteConstants.addOntology
    | typeof RouteConstants.list
    | typeof RouteConstants.addList
    | 'docs';

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
        private _errorHandler: AppErrorHandler,
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
    open(route: DataModelRoute, id?: string) {

        if (route === RouteConstants.ontology && id) {
            // get name of ontology
            const ontoName = this._ontologyService.getOntologyName(id);
            this._router.navigate(
                [route, encodeURIComponent(ontoName), RouteConstants.editor, RouteConstants.classes],
                { relativeTo: this._route.parent }
            );
            return;
        }
        if (route === RouteConstants.list && id) {
            const listName = id.split('/').pop();
            // route to the list editor
            this._router.navigate([route, encodeURIComponent(listName)], {
                relativeTo: this._route.parent,
            });
            return;
        } else if (route === 'docs') {
            // route to the external docs
            window.open(
                'https://docs.dasch.swiss/latest/DSP-APP/user-guide/project/#data-model',
                '_blank'
            );
            return;
        } else {
            // default routing
            this._router.navigate([route], { relativeTo: this._route.parent });
        }
    }
}
