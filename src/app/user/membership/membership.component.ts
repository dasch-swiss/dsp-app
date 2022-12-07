import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { Router } from '@angular/router';
import {
    ApiResponseData,
    ApiResponseError,
    Constants,
    KnoraApiConnection,
    ProjectsResponse,
    ReadUser,
    UserResponse
} from '@dasch-swiss/dsp-js';
import { PermissionsData } from '@dasch-swiss/dsp-js/src/models/admin/permissions-data';
import { CacheService } from 'src/app/main/cache/cache.service';
import { DspApiConnectionToken } from 'src/app/main/declarations/dsp-api-tokens';
import { ErrorHandlerService } from 'src/app/main/services/error-handler.service';
import { Session } from 'src/app/main/services/session.service';
import { ProjectService } from 'src/app/workspace/resource/services/project.service';
import { AutocompleteItem } from 'src/app/workspace/search/advanced-search/resource-and-property-selection/search-select-property/specify-property-value/operator';

// --> TODO replace it by IPermissions from dsp-js
export interface IPermissions {
    groupsPerProject: any;
    administrativePermissionsPerProject: any;
}

@Component({
    selector: 'app-membership',
    templateUrl: './membership.component.html',
    styleUrls: ['./membership.component.scss']
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
            '=1': '1 project',
            other: '# projects'
        }
    };

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _errorHandler: ErrorHandlerService,
        private _router: Router,
        private _projectService: ProjectService
    ) { }

    ngOnInit() {

        this.loading = true;

        // set the cache
        this._cache.get(this.username, this._dspApiConnection.admin.usersEndpoint.getUserByUsername(this.username));

        // get from cache
        this._cache.get(this.username, this._dspApiConnection.admin.usersEndpoint.getUserByUsername(this.username)).subscribe(
            (response: ApiResponseData<UserResponse>) => {
                this.user = response.body.user;
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

                    if (p.id !== Constants.SystemProjectIRI && p.id !== Constants.DefaultSharedOntologyIRI && p.status === true) {
                        // get index example:
                        // myArray.findIndex(i => i.hello === "stevie");
                        if (this.user.projects.findIndex(i => i.id === p.id) === -1) {
                            this.projects.push({ iri: p.id, name: p.longname + ' (' + p.shortname + ')' });
                        }
                        /*
                        if (this.user.projects.indexOf(p.id) > -1) {
                            console.log('member of', p);
                        } */
                    }

                }

                this.projects.sort(function (u1: AutocompleteItem, u2: AutocompleteItem) {
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

        // reset the cache of project members
        this._cache.get('members_of_' + projectUuid, this._dspApiConnection.admin.projectsEndpoint.getProjectMembersByIri(iri));

    }

    /**
     * remove user from project
     *
     * @param iri Project iri
     */
    removeFromProject(iri: string) {

        this.loading = true;

        this._dspApiConnection.admin.usersEndpoint.removeUserFromProjectMembership(this.user.id, iri).subscribe(
            (response: ApiResponseData<UserResponse>) => {
                this.user = response.body.user;
                // set new user cache
                this._cache.del(this.username);
                this._cache.get(this.username, this._dspApiConnection.admin.usersEndpoint.getUserByUsername(this.username));
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

        this._dspApiConnection.admin.usersEndpoint.addUserToProjectMembership(this.user.id, iri).subscribe(
            (response: ApiResponseData<UserResponse>) => {
                this.user = response.body.user;
                // set new user cache
                this._cache.del(this.username);
                this._cache.get(this.username, this._dspApiConnection.admin.usersEndpoint.getUserByUsername(this.username));
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
        return (permissions.groupsPerProject[iri].indexOf(Constants.ProjectAdminGroupIRI) > -1);
    }

    openProject(iri: string) {
        this.closeDialog.emit();
        this._router.navigateByUrl('/refresh', { skipLocationChange: true }).then(
            () => this._router.navigate(['/project/' + this._projectService.iriToUuid(iri)])
        );
    }

}
