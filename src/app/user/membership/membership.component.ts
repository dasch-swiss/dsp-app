import { Component, EventEmitter, Inject, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiResponseData, ApiResponseError, KnoraApiConnection, ProjectsResponse, ReadUser, UserResponse, Constants } from '@knora/api';
import { KnoraApiConnectionToken, Session } from '@knora/core';
import { CacheService } from 'src/app/main/cache/cache.service';
import { AutocompleteItem } from 'src/app/main/declarations/autocomplete-item';
import { IPermissions } from '@knora/api/src/interfaces/models/admin/i-permissions';

@Component({
    selector: 'app-membership',
    templateUrl: './membership.component.html',
    styleUrls: ['./membership.component.scss']
})
export class MembershipComponent implements OnInit {

    loading: boolean;

    session: Session;

    @Input() username: string;

    user: ReadUser;

    @Output() closeDialog: EventEmitter<any> = new EventEmitter<any>();

    projects: AutocompleteItem[] = [];
    newProject = new FormControl();

    // i18n plural mapping
    itemPluralMapping = {
        project: {
            '=1': '1 project',
            other: '# projects'
        }
    };

    constructor(
        @Inject(KnoraApiConnectionToken) private knoraApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _router: Router
    ) { }

    ngOnInit() {

        this.loading = true;

        // set the cache
        this._cache.get(this.username, this.knoraApiConnection.admin.usersEndpoint.getUserByUsername(this.username));

        // get from cache
        this._cache.get(this.username, this.knoraApiConnection.admin.usersEndpoint.getUserByUsername(this.username)).subscribe(
            (response: ApiResponseData<UserResponse>) => {
                this.user = response.body.user;
                this.initNewProjects();
                this.loading = false;
            },
            (error: ApiResponseError) => {
                console.error(error);
                this.loading = false;
            }
        );

    }

    initNewProjects() {

        this.projects = [];
        // get all projects and filter by projects where the user is already member of
        this.knoraApiConnection.admin.projectsEndpoint.getProjects().subscribe(
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
                console.error(error);
            }
        );
    }

    updateProjectCache(iri: string) {
        // TODO: update cache of project

        // get shortcode from iri; not the best way right now
        const projectcode: string = iri.replace('http://rdfh.ch/projects/', '');

        // reset the cache of project members
        this._cache.get('members_of_' + projectcode, this.knoraApiConnection.admin.projectsEndpoint.getProjectMembersByShortcode(projectcode));

    }

    /**
     * remove user from project
     *
     * @param iri Project iri
     */
    removeFromProject(iri: string) {

        this.loading = true;

        this.knoraApiConnection.admin.usersEndpoint.removeUserFromProjectMembership(this.user.id, iri).subscribe(
            (response: ApiResponseData<UserResponse>) => {
                this.user = response.body.user;
                // set new user cache
                this._cache.del(this.username);
                this._cache.get(this.username, this.knoraApiConnection.admin.usersEndpoint.getUserByUsername(this.username));
                this.initNewProjects();
                // this.updateProjectCache(iri);
                this.loading = false;

            },
            (error: ApiResponseError) => {
                console.error(error);
                this.loading = false;
            }
        );

    }

    addToProject(iri: string) {

        this.loading = true;

        this.knoraApiConnection.admin.usersEndpoint.addUserToProjectMembership(this.user.id, iri).subscribe(
            (response: ApiResponseData<UserResponse>) => {
                this.user = response.body.user;
                // set new user cache
                this._cache.del(this.username);
                this._cache.get(this.username, this.knoraApiConnection.admin.usersEndpoint.getUserByUsername(this.username));
                this.initNewProjects();
                // this.updateProjectCache(iri);
                this.loading = false;
            },
            (error: ApiResponseError) => {
                console.error(error);
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
    userIsProjectAdmin(permissions: IPermissions, iri: string): boolean {
        return (permissions.groupsPerProject[iri].indexOf(Constants.ProjectAdminGroupIRI) > -1);
    }

    openProject(shortcode: string) {
        this.closeDialog.emit();
        this._router.navigateByUrl('/refresh', { skipLocationChange: true }).then(
            () => this._router.navigate(['/project/' + shortcode])
        );
    }

}
