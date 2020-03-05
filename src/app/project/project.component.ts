import { Component, Inject, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { ApiResponseData, ApiResponseError, KnoraApiConnection, ProjectResponse, ReadProject } from '@knora/api';
import { KnoraApiConnectionToken, Session, SessionService } from '@knora/core';
import { AppGlobal } from '../app-global';
import { CacheService } from '../main/cache/cache.service';
import { MenuItem } from '../main/declarations/menu-item';

@Component({
    selector: 'app-project',
    templateUrl: './project.component.html',
    styleUrls: ['./project.component.scss']
})
export class ProjectComponent implements OnInit {

    // loading for progess indicator
    loading: boolean;
    // error in case of wrong project code
    error: boolean;

    // permissions of logged-in user
    session: Session;
    sysAdmin: boolean = false;
    projectAdmin: boolean = false;

    // project shortcode; as identifier in project cache service
    projectcode: string;

    // project data
    project: ReadProject;

    color: string = 'primary';

    // for the sidenav
    open: boolean = true;

    navigation: MenuItem[] = AppGlobal.projectNav;

    constructor(
        @Inject(KnoraApiConnectionToken) private knoraApiConnection: KnoraApiConnection,
        private _session: SessionService,
        private _cache: CacheService,
        private _route: ActivatedRoute,
        private _titleService: Title
    ) {
        // get the shortcode of the current project
        this.projectcode = this._route.snapshot.params.shortcode;

        // get session
        this.session = JSON.parse(localStorage.getItem('session'));

        // set the page title
        this._titleService.setTitle('Project ' + this.projectcode);

        // error handling in case of wrong project shortcode
        this.error = this.validateShortcode(this.projectcode);
    }

    ngOnInit() {

        if (!this.error) {
            this.loading = true;
            // set the cache here:
            // current project data, project members and project groups
            this._cache.get(this.projectcode, this.knoraApiConnection.admin.projectsEndpoint.getProjectByShortcode(this.projectcode));

            // get information about the logged-in user, if one is logged-in
            if (this.session) {

            }

            // get the project data from cache
            this._cache.get(this.projectcode, this.knoraApiConnection.admin.projectsEndpoint.getProjectByShortcode(this.projectcode)).subscribe(
                (response: ApiResponseData<ProjectResponse>) => {
                    this.project = response.body.project;

                    if (!this.project.status) {
                        this.color = 'warn';
                    }

                    this.navigation[0].label = 'Project: ' + response.body.project.shortname.toUpperCase();

                    // is logged-in user projectAdmin?
                    if (this.session) {
                        this._session.updateSession(this.session.user.jwt, this.session.user.name);
                        this.session = JSON.parse(localStorage.getItem('session'));

                        // is the logged-in user system admin?
                        this.sysAdmin = this.session.user.sysAdmin;

                        // is the logged-in user project admin?
                        this.projectAdmin = this.sysAdmin ? this.sysAdmin : (this.session.user.projectAdmin.some(e => e === this.project.id));
                    }

                    // set the cache for project members and groups
                    if (this.projectAdmin) {
                        this._cache.get('members_of_' + this.projectcode, this.knoraApiConnection.admin.projectsEndpoint.getProjectMembersByShortcode(this.projectcode));
                        this._cache.get('groups_of_' + this.projectcode, this.knoraApiConnection.admin.groupsEndpoint.getGroups());
                    }

                    this.loading = false;
                },
                (error: ApiResponseError) => {
                    console.error(error);
                    this.error = true;
                    this.loading = false;
                }
            );
        } else {
            // shortcode isn't valid
            // TODO: show an error page
        }
    }

    /**
     * Checks if the shortcode is valid: hexadecimal and length = 4
     *
     * @param code project shortcode which is a parameter in the route
     */
    validateShortcode(code: string) {
        const regexp: any = /^[0-9A-Fa-f]+$/;

        return !(regexp.test(code) && code.length === 4);
    }
}
