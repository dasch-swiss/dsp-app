import { Component, Inject, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import {
    ApiResponseData,
    ApiResponseError,
    KnoraApiConnection,
    ListNodeInfo,
    ListsResponse,
    OntologiesMetadata,
    ProjectResponse,
    ReadOntology,
    ReadProject, UserResponse
} from '@dasch-swiss/dsp-js';
import { AppGlobal } from '../app-global';
import { CacheService } from '../main/cache/cache.service';
import { DspApiConnectionToken } from '../main/declarations/dsp-api-tokens';
import { MenuItem } from '../main/declarations/menu-item';
import { ErrorHandlerService } from '../main/services/error-handler.service';
import { Session, SessionService } from '../main/services/session.service';
import { OntologyService } from './ontology/ontology.service';

@Component({
    selector: 'app-project',
    templateUrl: './project.component.html',
    styleUrls: ['./project.component.scss']
})
export class ProjectComponent implements OnInit {
    readonly TAB_DATA_MODEL = 3;
    readonly TAB_LISTS = 4;

    // loading for progress indicator
    loading: boolean;
    // error in case of wrong project code
    error: boolean;

    // permissions of logged-in user
    session: Session;
    sysAdmin = false;
    projectAdmin = false;
    projectMember = false;

    // project shortcode; as identifier in project cache service
    projectCode: string;

    // project data
    project: ReadProject;

    color = 'primary';

    navigation: MenuItem[] = AppGlobal.projectNav;

    // feature toggle for new concept
    beta = false;

    ontologies: ReadOntology[] = [];

    // list of project ontologies
    projectOntologies: ReadOntology[] = [];
    projectLists: ListNodeInfo[] = [];

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _errorHandler: ErrorHandlerService,
        private _cache: CacheService,
        private _ontologyService: OntologyService,
        private _route: ActivatedRoute,
        private _router: Router,
        private _session: SessionService,
        private _titleService: Title
    ) {
        // get the shortcode of the current project
        this.projectCode = this._route.snapshot.params.shortcode;

        // get session
        this.session = this._session.getSession();

        // set the page title
        this._titleService.setTitle('Project ' + this.projectCode);

        // error handling in case of wrong project shortcode
        this.error = this._validateShortcode(this.projectCode);

        // get feature toggle information if url contains beta
        this.beta = (this._route.snapshot.url[0].path === 'beta');
        if (this.beta) {
            console.warn('This is a pre-released (beta) project view');
        }
    }

    ngOnInit() {

        if (!this.error) {
            this.loading = true;
            // get current project data, project members and project groups
            // and set the project cache here
            this._dspApiConnection.admin.projectsEndpoint.getProjectByShortcode(this.projectCode).subscribe(
                (response: ApiResponseData<ProjectResponse>) => {
                    this.project = response.body.project;

                    this._cache.set(this.projectCode, this.project);

                    if (!this.project.status) {
                        this.color = 'warn';
                    }

                    this.navigation[0].label = 'Project: ' + response.body.project.shortname.toUpperCase();

                    // is logged-in user projectAdmin?
                    if (this.session) {
                        this._session.setSession(this.session.user.jwt, this.session.user.name, 'username');
                        this.session = this._session.getSession();

                        // is the logged-in user system admin?
                        this.sysAdmin = this.session.user.sysAdmin;

                        // is the logged-in user project admin?
                        this.projectAdmin = this.sysAdmin ? this.sysAdmin : (this.session.user.projectAdmin.some(e => e === this.project.id));

                        // or at least project member?
                        if (!this.projectAdmin) {
                            this._dspApiConnection.admin.usersEndpoint.getUserByUsername(this.session.user.name).subscribe(
                                (res: ApiResponseData<UserResponse>) => {
                                    const usersProjects = res.body.user.projects;
                                    if (usersProjects.length === 0) {
                                        // the user is not part of any project
                                        this.projectMember = false;
                                    } else {
                                        // check if the user is member of the current project
                                        this.projectMember = usersProjects.some(p => p.shortcode === this.projectCode);
                                    }
                                },
                                (error: ApiResponseError) => {
                                    this._errorHandler.showMessage(error);
                                }
                            );
                        } else {
                            this.projectMember = this.projectAdmin;
                        }

                    }

                    // set the cache for project members and groups
                    if (this.projectAdmin) {
                        this._cache.get('members_of_' + this.projectCode, this._dspApiConnection.admin.projectsEndpoint.getProjectMembersByShortcode(this.projectCode));
                        this._cache.get('groups_of_' + this.projectCode, this._dspApiConnection.admin.groupsEndpoint.getGroups());
                    }

                    // in the new concept of project view, we have to make many requests to get all project relevant information
                    if(this.beta) {

                        // get all project ontologies
                        this._dspApiConnection.v2.onto.getOntologiesByProjectIri(this.project.id).subscribe(
                            (ontoMeta: OntologiesMetadata) => {
                                if (ontoMeta.ontologies.length) {
                                    ontoMeta.ontologies.forEach(onto => {

                                        // const name = this._ontologyService.getOntologyName(onto.id);
                                        this._dspApiConnection.v2.onto.getOntology(onto.id).subscribe(
                                            (ontology: ReadOntology) => {
                                                this.projectOntologies.push(ontology);
                                                this.ontologies.push(ontology);
                                                if (ontoMeta.ontologies.length === this.ontologies.length) {
                                                    this._cache.set('currentProjectOntologies', this.ontologies);
                                                    this.loading = !this._cache.has(this.projectCode);
                                                }
                                            },
                                            (error: ApiResponseError) => {
                                                this.loading = false;
                                                this._errorHandler.showMessage(error);
                                            }
                                        );
                                    });
                                } else {
                                    this.loading = !this._cache.has(this.projectCode);
                                }
                            },
                            (error: ApiResponseError) => {
                                this._errorHandler.showMessage(error);
                            }
                        );

                        // get all project lists
                        this._dspApiConnection.admin.listsEndpoint.getListsInProject(this.project.id).subscribe(
                            (lists: ApiResponseData<ListsResponse>) => {
                                this.projectLists = lists.body.lists;

                            },
                            (error: ApiResponseError) => {
                                this._errorHandler.showMessage(error);
                            }
                        );

                    } else {
                        if (this._cache.has(this.projectCode)) {
                            this.loading = false;
                        }
                    }

                },
                (error: ApiResponseError) => {
                    this.error = true;
                    this.loading = false;
                }
            );
        }
    }

    open(route: string, id?: string) {
        if (route === 'ontology' && id) {
            // get name of ontology
            id = this._ontologyService.getOntologyName(id);
        }
        if (route === 'list' && id) {
            // get name of list
            const array = id.split('/');
            const pos = array.length - 1;
            id = array[pos];
        }
        if (id) {
            this._router.navigate([route, encodeURIComponent(id), 'editor', 'classes'], { relativeTo: this._route });
        } else {
            this._router.navigate([route], { relativeTo: this._route });
        }
    }

    /**
     * go to overview page
     */
    goToOverview() {
        this._router.navigate(['/'], { relativeTo: this._route });
    }

    /**
     * given an Html element, compare the scrollHeight and the clientHeight
     *
     * @param elem the element which has the line-clamp css
     * @returns inverse of comparison between the scrollHeight and the clientHeight of elem
     */
    compareElementHeights(elem: HTMLElement): boolean {
        return !(elem.scrollHeight > elem.clientHeight);
    }

    /**
     * checks if the shortcode is valid: hexadecimal and length = 4
     *
     * @param code project shortcode which is a parameter in the route
     */
    private _validateShortcode(code: string) {
        const regexp: any = /^[0-9A-Fa-f]+$/;

        return !(regexp.test(code) && code.length === 4);
    }
}
