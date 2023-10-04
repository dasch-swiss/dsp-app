import {
    Component,
    EventEmitter,
    Inject,
    Input,
    OnInit,
    Output,
} from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Router } from '@angular/router';
import {
    ApiResponseData,
    ApiResponseError,
    Constants,
    KnoraApiConnection,
    MembersResponse,
    ProjectsResponse,
    ReadUser,
    UserResponse,
} from '@dasch-swiss/dsp-js';
import { PermissionsData } from '@dasch-swiss/dsp-js/src/models/admin/permissions-data';
import { ApplicationStateService } from '@dasch-swiss/vre/shared/app-state-service';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { AppErrorHandler } from '@dasch-swiss/vre/shared/app-error-handler';
import { Session } from '@dasch-swiss/vre/shared/app-session';
import { ProjectService } from '@dsp-app/src/app/workspace/resource/services/project.service';
import { AutocompleteItem } from '../../workspace/search/operator';

// --> TODO replace it by IPermissions from dsp-js
export interface IPermissions {
    groupsPerProject: any;
    administrativePermissionsPerProject: any;
}

@Component({
    selector: 'app-membership',
    templateUrl: './membership.component.html',
    styleUrls: ['./membership.component.scss'],
})
export class MembershipComponent implements OnInit {
    @Input() username: string;

    @Output() closeDialog: EventEmitter<any> = new EventEmitter<any>();

    loading: boolean;

    session: Session;

    user: ReadUser;

    projects: AutocompleteItem[] = [];
    newProject = new UntypedFormControl();

    // i18n plural mapping
    itemPluralMapping = {
        project: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            '=1': '1 project',
            other: '# projects',
        },
    };

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _applicationStateService: ApplicationStateService,
        private _errorHandler: AppErrorHandler,
        private _router: Router,
        private _projectService: ProjectService
    ) {}

    ngOnInit() {
        this.loading = true;

        this._dspApiConnection.admin.usersEndpoint.getUserByUsername(this.username).subscribe(
            (response: ApiResponseData<UserResponse>) => {
                this.user = response.body.user;
                this._applicationStateService.set(this.username, this.user)
                this.initNewProjects();
                this.loading = false;
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
                this.loading = false;
            }
        );
    }

    initNewProjects() {
        this.projects = [];
        // get all projects and filter by projects where the user is already member of
        this._dspApiConnection.admin.projectsEndpoint.getProjects().subscribe(
            (response: ApiResponseData<ProjectsResponse>) => {
                for (const p of response.body.projects) {
                    if (
                        p.id !== Constants.SystemProjectIRI &&
                        p.id !== Constants.DefaultSharedOntologyIRI &&
                        p.status === true
                    ) {
                        // get index example:
                        // myArray.findIndex(i => i.hello === "stevie");
                        if (
                            this.user.projects.findIndex(
                                (i) => i.id === p.id
                            ) === -1
                        ) {
                            this.projects.push({
                                iri: p.id,
                                name: p.longname + ' (' + p.shortname + ')',
                            });
                        }
                        /*
                        if (this.user.projects.indexOf(p.id) > -1) {
                            console.log('member of', p);
                        } */
                    }
                }

                this.projects.sort(function (
                    u1: AutocompleteItem,
                    u2: AutocompleteItem
                ) {
                    if (u1.name < u2.name) {
                        return -1;
                    } else if (u1.name > u2.name) {
                        return 1;
                    } else {
                        return 0;
                    }
                });

                this.newProject.setValue('');

                this.loading = false;
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );
    }

    updateProjectCache(iri: string) {
        const projectUuid: string = this._projectService.iriToUuid(iri);

        // reset the application state of project members

        this._dspApiConnection.admin.projectsEndpoint.getProjectMembersByIri(iri).subscribe(
            (response: ApiResponseData<MembersResponse>) => {
                this._applicationStateService.set('members_of_' + projectUuid, response.body.members)
            }
        )
    }

    /**
     * remove user from project
     *
     * @param iri Project iri
     */
    removeFromProject(iri: string) {
        this.loading = true;

        this._dspApiConnection.admin.usersEndpoint
            .removeUserFromProjectMembership(this.user.id, iri)
            .subscribe(
                (response: ApiResponseData<UserResponse>) => {
                    this.user = response.body.user;
                    // set new user state
                    this._applicationStateService.delete(this.username);
                    this._applicationStateService.set(
                        this.username,
                        this.user
                    );
                    this.initNewProjects();
                    // this.updateProjectCache(iri);
                    this.loading = false;
                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                    this.loading = false;
                }
            );
    }

    addToProject(iri: string) {
        this.loading = true;

        this._dspApiConnection.admin.usersEndpoint
            .addUserToProjectMembership(this.user.id, iri)
            .subscribe(
                (response: ApiResponseData<UserResponse>) => {
                    this.user = response.body.user;
                    // set new user state
                    this._applicationStateService.delete(this.username);
                    this._applicationStateService.set(
                        this.username,
                        this.user
                    );
                    this.initNewProjects();
                    // this.updateProjectCache(iri);
                    this.loading = false;
                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                    this.loading = false;
                }
            );
    }

    /**
     * returns true, when the user is project admin;
     * when the parameter permissions is not set,
     * it returns the value for the logged-in user
     *
     *
     * @param  [permissions] user's permissions
     * @param  [iri] project id
     * @returns boolean
     */
    userIsProjectAdmin(permissions: PermissionsData, iri: string): boolean {
        return (
            permissions.groupsPerProject[iri].indexOf(
                Constants.ProjectAdminGroupIRI
            ) > -1
        );
    }
}
