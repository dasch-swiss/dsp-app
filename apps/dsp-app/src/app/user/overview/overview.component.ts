import { Component, Inject, OnInit } from '@angular/core';
import {
    MatLegacyDialog as MatDialog,
    MatLegacyDialogConfig as MatDialogConfig,
} from '@angular/material/legacy-dialog';
import { Title } from '@angular/platform-browser';
import {
    KnoraApiConnection,
    ApiResponseData,
    UserResponse,
    ApiResponseError,
    StoredProject,
    ProjectsResponse,
} from '@dasch-swiss/dsp-js';
import { CacheService } from '@dsp-app/src/app/main/cache/cache.service';
import { DspApiConnectionToken } from '@dsp-app/src/app/main/declarations/dsp-api-tokens';
import { DialogComponent } from '@dsp-app/src/app/main/dialog/dialog.component';
import { ErrorHandlerService } from '@dsp-app/src/app/main/services/error-handler.service';
import { Session, SessionService } from '@dsp-app/src/app/main/services/session.service';

@Component({
    selector: 'app-overview',
    templateUrl: './overview.component.html',
    styleUrls: ['./overview.component.scss'],
})
export class OverviewComponent implements OnInit {
    loading = true;

    session: Session;
    username: string;
    sysAdmin = false;

    // list of projects a user is a member of
    userProjects: StoredProject[] = [];

    // list of projects a user is NOT a member of
    otherProjects: StoredProject[] = [];

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _errorHandler: ErrorHandlerService,
        private _session: SessionService,
        private _dialog: MatDialog,
        private _titleService: Title
    ) {
        // get username
        this.session = this._session.getSession();

        // if session is null, user is not logged in
        if (this.session) {
            this.username = this.session.user.name;
            this.sysAdmin = this.session.user.sysAdmin;
        }

        // set the page title
        this._titleService.setTitle('Projects Overview');
    }

    ngOnInit() {
        this.loading = true;

        if (this.username) {
            // set the cache
            this._cache.get(
                this.username,
                this._dspApiConnection.admin.usersEndpoint.getUserByUsername(
                    this.username
                )
            );
        }

        // if user is a system admin or not logged in, get all the projects
        // system admin can create new projects and edit projects
        // users not logged in can only view projects
        if (this.sysAdmin || !this.session) {
            this._dspApiConnection.admin.projectsEndpoint
                .getProjects()
                .subscribe(
                    (response: ApiResponseData<ProjectsResponse>) => {
                        // reset the lists:
                        this.userProjects = [];
                        this.otherProjects = [];

                        for (const project of response.body.projects) {
                            // for not logged in user don't display deactivated projects
                            if (!this.session && project.status !== false) {
                                this.otherProjects.push(project);
                            }
                            if (this.sysAdmin) {
                                this.otherProjects.push(project);
                            }
                        }

                        this.loading = false;
                    },
                    (error: ApiResponseError) => {
                        this._errorHandler.showMessage(error);
                    }
                );
        } else {
            // logged-in user is NOT a system admin: get all projects the user is a member of
            this._dspApiConnection.admin.usersEndpoint
                .getUserByUsername(this.username)
                .subscribe(
                    (userResponse: ApiResponseData<UserResponse>) => {
                        // reset the lists:
                        this.userProjects = [];
                        this.otherProjects = [];

                        // get list of all projects the user is a member of except the deactivated ones
                        for (const project of userResponse.body.user.projects) {
                            if (project.status !== false) {
                                this.userProjects.push(project);
                            }
                        }

                        this._dspApiConnection.admin.projectsEndpoint
                            .getProjects()
                            .subscribe(
                                (
                                    projectsResponse: ApiResponseData<ProjectsResponse>
                                ) => {
                                    // get list of all projects the user is NOT a member of
                                    for (const project of projectsResponse.body
                                        .projects) {
                                        if (
                                            this.userProjects.findIndex(
                                                (userProj) =>
                                                    userProj.id === project.id
                                            ) === -1
                                        ) {
                                            this.otherProjects.push(project);
                                        }
                                    }

                                    this.loading = false;
                                },
                                (error: ApiResponseError) => {
                                    this._errorHandler.showMessage(error);
                                }
                            );

                        this.loading = false;
                    },
                    (error: ApiResponseError) => {
                        this._errorHandler.showMessage(error);
                    }
                );
        }
    }

    openDialog(mode: string, name?: string, id?: string): void {
        const dialogConfig: MatDialogConfig = {
            width: '560px',
            maxHeight: '80vh',
            position: {
                top: '112px',
            },
            data: { name: name, mode: mode, project: id },
        };

        this._dialog.open(DialogComponent, dialogConfig);
    }
}
