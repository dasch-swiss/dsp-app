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
    ReadUser,
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { ErrorHandlerService } from '@dsp-app/src/app/main/services/error-handler.service';
import {
    Session,
    SessionService,
} from '@dasch-swiss/vre/shared/app-session';
import { ProjectService } from '@dsp-app/src/app/workspace/resource/services/project.service';
import { AddUserComponent } from './add-user/add-user.component';
import { ApplicationStateService } from '@dasch-swiss/vre/shared/app-state-service';

@Component({
    selector: 'app-collaboration',
    templateUrl: './collaboration.component.html',
    styleUrls: ['./collaboration.component.scss'],
})
export class CollaborationComponent implements OnInit {
    @ViewChild('addUserComponent') addUser: AddUserComponent;

    // loading for progess indicator
    loading: boolean;

    // permissions of logged-in user
    session: Session;
    sysAdmin = false;
    projectAdmin = false;

    // project uuid; as identifier in project application state service
    projectUuid: string;

    // project data
    project: ReadProject;

    // project members
    projectMembers: ReadUser[] = [];

    // two lists of project members:
    // list of active users
    active: ReadUser[] = [];
    // list of inactive (deleted) users
    inactive: ReadUser[] = [];

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _errorHandler: ErrorHandlerService,
        private _route: ActivatedRoute,
        private _session: SessionService,
        private _titleService: Title,
        private _projectService: ProjectService,
        private _applicationStateService: ApplicationStateService
    ) {
        // get the uuid of the current project
        if (this._route.parent.parent.snapshot.url.length) {
            this._route.parent.parent.paramMap.subscribe((params: Params) => {
                this.projectUuid = params.get('uuid');
            });
        }
    }

    ngOnInit() {
        this.loading = true;

        // get information about the logged-in user
        this.session = this._session.getSession();

        // is the logged-in user system admin?
        this.sysAdmin = this.session.user.sysAdmin;

        this._applicationStateService.get(this.projectUuid).subscribe(
            (response: ReadProject) => {
                this.project = response;

                // set the page title
                this._titleService.setTitle(
                    'Project ' + this.project.shortname + ' | Collaboration'
                );

                // is logged-in user projectAdmin?
                this.projectAdmin = this.sysAdmin
                    ? this.sysAdmin
                    : this.session.user.projectAdmin.some(
                          (e) => e === this.project.id
                      );

                // get list of project members and groups
                if (this.projectAdmin) {
                    this.refresh();
                }

                this.loading = false;
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
                this.loading = false;
            }
        )

    }

    /**
     * build the list of members
     */
    initList(): void {
        const projectIri = this._projectService.uuidToIri(this.projectUuid);

        // get project members
        this._dspApiConnection.admin.projectsEndpoint.getProjectMembersByIri(projectIri).subscribe(
            (response: ApiResponseData<MembersResponse>) => {
                this.projectMembers = response.body.members;
                // set project members state in application state service
                this._applicationStateService.set('members_of_' + this.projectUuid, this.projectMembers);

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
        // refresh the component
        this.loading = true;

        this.initList();

        // refresh child component: add user
        if (this.addUser) {
            this.addUser.buildForm();
        }
    }
}
