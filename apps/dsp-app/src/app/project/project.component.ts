import {
    Component,
    HostListener,
    Inject,
    OnInit,
    ViewChild,
} from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import {
    ApiResponseData,
    ApiResponseError,
    GroupsResponse,
    KnoraApiConnection,
    MembersResponse,
    OntologiesMetadata,
    ProjectResponse,
    ReadOntology,
    ReadProject,
    UserResponse,
} from '@dasch-swiss/dsp-js';
import { AppGlobal } from '../app-global';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { ApplicationStateService } from '@dasch-swiss/vre/shared/app-state-service';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { MenuItem } from '../main/declarations/menu-item';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import {
    ComponentCommunicationEventService,
    Events,
} from '@dsp-app/src/app/main/services/component-communication-event.service';
import { Session, SessionService } from '@dasch-swiss/vre/shared/app-session';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-project',
    templateUrl: './project.component.html',
    styleUrls: ['./project.component.scss'],
})
export class ProjectComponent implements OnInit {
    @ViewChild('sidenav') sidenav: MatSidenav;

    // loading for progress indicator
    loading: boolean;
    // error in case of wrong project code
    error: boolean;

    // permissions of logged-in user
    session: Session;
    sysAdmin = false;
    projectAdmin = false;
    projectMember = false;

    // project uuid; as identifier in project application state service
    projectUuid: string;

    // project iri; used for API requests
    iri: string;

    // project data
    project: ReadProject;

    color = 'primary';

    navigation: MenuItem[] = AppGlobal.projectNav;

    ontologies: ReadOntology[] = [];

    // list of project ontologies
    projectOntologies: ReadOntology[] = [];

    listItemSelected = '';

    componentCommsSubscription: Subscription;

    sideNavOpened = true;

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _errorHandler: AppErrorHandler,
        private _componentCommsService: ComponentCommunicationEventService,
        private _applicationStateService: ApplicationStateService,
        private _route: ActivatedRoute,
        private _router: Router,
        private _session: SessionService,
        private _titleService: Title,
        private _acs: AppConfigService
    ) {
        // get the uuid of the current project
        this.projectUuid = this._route.snapshot.params.uuid;

        // create the project iri
        this.iri = `${this._acs.dspAppConfig.iriBase}/projects/${this.projectUuid}`;

        // get session
        this.session = this._session.getSession();
    }

    /**
     * add keyboard support to expand/collapse sidenav
     * @param event automatically passed whenever the user types
     */
    @HostListener('window:keyup', ['$event'])
    keyEvent(event: KeyboardEvent) {
        if (event.key === '[') {
            this.toggleSidenav();
        }
    }

    ngOnInit() {
        switch (this._router.url) {
            case `/project/${this.projectUuid}/advanced-search`: {
                this.listItemSelected = 'advanced-search';
                break;
            }
            case `/project/${this.projectUuid}`: {
                this.listItemSelected = this._router.url;
                break;
            }
            case `/project/${this.projectUuid}/data-models`: {
                this.listItemSelected = 'data-models';
                break;
            }
            case `/project/${this.projectUuid}/settings/collaboration`: {
                this.listItemSelected = 'settings';
                break;
            }
        }

        this.componentCommsSubscription = this._componentCommsService.on(
            Events.unselectedListItem,
            () => {
                this.listItemSelected = '';
            }
        );

        if (!this.error) {
            this.loading = true;
            // get current project data, project members and project groups
            // and set the project state here
            this._dspApiConnection.admin.projectsEndpoint
                .getProjectByIri(this.iri)
                .subscribe(
                    (response: ApiResponseData<ProjectResponse>) => {
                        this.project = response.body.project;

                        // set the page title
                        this._titleService.setTitle(this.project.shortname);

                        this._applicationStateService.set(this.projectUuid, this.project);

                        if (!this.project.status) {
                            this.color = 'warn';
                        }

                        this.navigation[0].label =
                            'Project: ' +
                            response.body.project.shortname.toUpperCase();

                        // is logged-in user projectAdmin?
                        if (this.session) {
                            this._session.setSession(
                                this.session.user.jwt,
                                this.session.user.name,
                                'username'
                            );
                            this.session = this._session.getSession();

                            // is the logged-in user system admin?
                            this.sysAdmin = this.session.user.sysAdmin;

                            // is the logged-in user project admin?
                            this.projectAdmin = this.sysAdmin
                                ? this.sysAdmin
                                : this.session.user.projectAdmin.some(
                                      (e) => e === this.project.id
                                  );

                            // or at least project member?
                            if (!this.projectAdmin) {
                                this._dspApiConnection.admin.usersEndpoint
                                    .getUserByUsername(this.session.user.name)
                                    .subscribe(
                                        (
                                            res: ApiResponseData<UserResponse>
                                        ) => {
                                            const usersProjects =
                                                res.body.user.projects;
                                            if (usersProjects.length === 0) {
                                                // the user is not part of any project
                                                this.projectMember = false;
                                            } else {
                                                // check if the user is member of the current project
                                                // id contains the iri
                                                this.projectMember =
                                                    usersProjects.some(
                                                        (p) => p.id === this.iri
                                                    );
                                            }
                                        },
                                        (error: ApiResponseError) => {
                                            this._errorHandler.showMessage(
                                                error
                                            );
                                        }
                                    );
                            } else {
                                this.projectMember = this.projectAdmin;
                            }
                        }

                        // set the state of project members and groups
                        if (this.projectAdmin) {

                            this._dspApiConnection.admin.projectsEndpoint.getProjectMembersByIri(this.iri).subscribe(
                                (response: ApiResponseData<MembersResponse>) =>
                                    this._applicationStateService.set('members_of_' + this.projectUuid,response.body.members)
                            )

                            this._dspApiConnection.admin.groupsEndpoint.getGroups().subscribe(
                                (response: ApiResponseData<GroupsResponse>) =>
                                    this._applicationStateService.set('groups_of_' + this.projectUuid, response.body.groups)
                            )
                        }

                        // get all project ontologies
                        this._dspApiConnection.v2.onto
                            .getOntologiesByProjectIri(this.iri)
                            .subscribe(
                                (ontoMeta: OntologiesMetadata) => {
                                    if (ontoMeta.ontologies.length) {
                                        ontoMeta.ontologies.forEach((onto) => {
                                            this._dspApiConnection.v2.onto
                                                .getOntology(onto.id)
                                                .subscribe(
                                                    (
                                                        ontology: ReadOntology
                                                    ) => {
                                                        this.projectOntologies.push(
                                                            ontology
                                                        );
                                                        this.projectOntologies.sort(
                                                            (o1, o2) =>
                                                                this._compareOntologies(
                                                                    o1,
                                                                    o2
                                                                )
                                                        );
                                                        this.ontologies.push(
                                                            ontology
                                                        );
                                                        if (
                                                            ontoMeta.ontologies
                                                                .length ===
                                                            this.ontologies
                                                                .length
                                                        ) {
                                                            this._applicationStateService.set(
                                                                'currentProjectOntologies',
                                                                this.ontologies
                                                            );
                                                            this.loading =
                                                                !this._applicationStateService.has(
                                                                    this
                                                                        .projectUuid
                                                                );
                                                        }
                                                    },
                                                    (
                                                        error: ApiResponseError
                                                    ) => {
                                                        this.loading = false;
                                                        this._errorHandler.showMessage(
                                                            error
                                                        );
                                                    }
                                                );
                                        });
                                    } else {
                                        this.loading = !this._applicationStateService.has(
                                            this.projectUuid
                                        );
                                    }
                                },
                                (error: ApiResponseError) => {
                                    this._errorHandler.showMessage(error);
                                }
                            );
                    },
                    () => {
                        this.error = true;
                        this.loading = false;
                    }
                );
        }
    }

    ngOnDestroy() {
        // unsubscribe from the ValueOperationEventService when component is destroyed
        if (this.componentCommsSubscription !== undefined) {
            this.componentCommsSubscription.unsubscribe();
        }
    }

    open(route: string) {
        this.listItemSelected = route;
        this._router.navigate([route], { relativeTo: this._route });
    }

    /**
     * given a Html element, compare the scrollHeight and the clientHeight
     *
     * @param elem the element which has the line-clamp css
     * @returns inverse of comparison between the scrollHeight and the clientHeight of elem
     */
    compareElementHeights(elem: HTMLElement): boolean {
        return !(elem.scrollHeight > elem.clientHeight);
    }

    /**
     * toggle sidenav
     */
    toggleSidenav() {
        this.sideNavOpened = !this.sideNavOpened;
        this.sidenav.toggle();
    }

    /**
     * compare function which sorts the ontologies in the ascending order.
     *
     * @param o1 ontology 1
     * @param o2 ontology 2
     * @private
     */
    private _compareOntologies(o1: ReadOntology, o2: ReadOntology) {
        if (o1.label > o2.label) {
            return 1;
        }

        if (o1.label < o2.label) {
            return -1;
        }

        return 0;
    }
}
