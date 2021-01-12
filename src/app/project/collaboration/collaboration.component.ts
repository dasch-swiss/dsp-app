import { Component, Inject, OnInit, ViewChild } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Params } from '@angular/router';
import {
    ApiResponseData,
    ApiResponseError,
    KnoraApiConnection,
    MembersResponse,
    ProjectResponse,
    ReadProject,
    ReadUser
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, Session, SessionService } from '@dasch-swiss/dsp-ui';
import { ErrorHandlerService } from 'src/app/main/error/error-handler.service';
import { CacheService } from '../../main/cache/cache.service';
import { AddUserComponent } from './add-user/add-user.component';

@Component({
    selector: 'app-collaboration',
    templateUrl: './collaboration.component.html',
    styleUrls: ['./collaboration.component.scss']
})
export class CollaborationComponent implements OnInit {

    // loading for progess indicator
    loading: boolean;

    // permissions of logged-in user
    session: Session;
    sysAdmin: boolean = false;
    projectAdmin: boolean = false;

    // project shortcode; as identifier in project cache service
    projectcode: string;

    // project data
    project: ReadProject;

    // project members
    projectMembers: ReadUser[] = [];

    // two lists of project members:
    // list of active users
    active: ReadUser[] = [];
    // list of inactive (deleted) users
    inactive: ReadUser[] = [];

    @ViewChild('addUserComponent') addUser: AddUserComponent;

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _errorHandler: ErrorHandlerService,
        private _route: ActivatedRoute,
        private _session: SessionService,
        private _titleService: Title) {

        // get the shortcode of the current project
        this._route.parent.paramMap.subscribe((params: Params) => {
            this.projectcode = params.get('shortcode');
        });

        // set the page title
        this._titleService.setTitle('Project ' + this.projectcode + ' | Collaboration');

        // TODO: go back to project page, if the logged-in user has no admin rights
        // is the logged-in user a project admin?
        /*
        const session: Session = JSON.parse(
            localStorage.getItem('session')
        );
        this.loggedInAdmin = session.user.projectAdmin.some(
            e => e === result.id
        );
        */

    }

    ngOnInit() {
        this.loading = true;

        // get information about the logged-in user
        this.session = this._session.getSession();

        // is the logged-in user system admin?
        this.sysAdmin = this.session.user.sysAdmin;

        // set the cache
        this._cache.get(this.projectcode, this._dspApiConnection.admin.projectsEndpoint.getProjectByShortcode(this.projectcode));

        // get the project data from cache
        this._cache.get(this.projectcode, this._dspApiConnection.admin.projectsEndpoint.getProjectByShortcode(this.projectcode)).subscribe(
            (response: ApiResponseData<ProjectResponse>) => {
                this.project = response.body.project;

                // is logged-in user projectAdmin?
                this.projectAdmin = this.sysAdmin ? this.sysAdmin : this.session.user.projectAdmin.some(e => e === this.project.id);

                // get from cache: list of project members and groups
                if (this.projectAdmin) {
                    this.refresh();
                }

                this.loading = false;
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
                this.loading = false;
            }
        );
    }

    /**
     * build the list of members
     */
    initList(): void {
        // set the cache
        this._cache.get('members_of_' + this.projectcode, this._dspApiConnection.admin.projectsEndpoint.getProjectMembersByShortcode(this.projectcode));

        // get the project data from cache
        this._cache.get('members_of_' + this.projectcode, this._dspApiConnection.admin.projectsEndpoint.getProjectMembersByShortcode(this.projectcode)).subscribe(
            (response: ApiResponseData<MembersResponse>) => {
                this.projectMembers = response.body.members;

                // clean up list of users
                this.active = [];
                this.inactive = [];

                for (const u of this.projectMembers) {

                    if (u.status === true) {
                        this.active.push(u);
                    } else {
                        this.inactive.push(u);
                    }

                }

                this.loading = false;
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );
    }

    /**
     * refresh list of members after adding a new user to the team
     */
    refresh(): void {
        // referesh the component
        this.loading = true;
        // update the cache
        this._cache.del('members_of_' + this.projectcode);

        this.initList();

        // refresh child component: add user
        if (this.addUser) {
            this.addUser.buildForm();
        }
    }

}
