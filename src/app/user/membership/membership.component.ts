import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { ApiServiceError, User, UsersService, ProjectsService, PermissionData, KnoraConstants, Project, AutocompleteItem } from '@knora/core';
import { CacheService } from 'src/app/main/cache/cache.service';
import { Session } from '@knora/authentication';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';

@Component({
    selector: 'app-membership',
    templateUrl: './membership.component.html',
    styleUrls: ['./membership.component.scss']
})
export class MembershipComponent implements OnInit {

    loading: boolean;

    session: Session;

    @Input() username: string;

    user: User;

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

    constructor (
        private _cache: CacheService,
        private _usersService: UsersService,
        private _projectsService: ProjectsService,
        private _router: Router
    ) { }

    ngOnInit() {

        this.loading = true;

        // set / get user from cache
        this._cache.get(this.username, this._usersService.getUserByUsername(this.username));

        this._cache.get(this.username, this._usersService.getUserByUsername(this.username)).subscribe(
            (result: User) => {
                this.user = result;
                this.initNewProjects();
                this.loading = false;
            },
            (error: ApiServiceError) => {
                console.error(error);
                this.loading = false;
            }
        );



    }

    initNewProjects() {

        this.projects = [];
        // get all projects and filter by projects where the user is already member of
        this._projectsService.getAllProjects().subscribe(
            (response: Project[]) => {

                for (const p of response) {

                    if (p.id !== KnoraConstants.SystemProjectIRI && p.id !== KnoraConstants.DefaultSharedOntologyIRI) {
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
            (error: ApiServiceError) => {
                console.error(error);
            }
        );
    }

    /**
     * remove user from project
     *
     * @param iri Project iri
     */
    removeFromProject(iri: string) {

        this.loading = true;

        this._usersService.removeUserFromProject(this.user.id, iri).subscribe(
            (result: User) => {
                this.user = result;
                // set new user cache
                this._cache.del(this.username);
                this._cache.get(this.username, this._usersService.getUserByUsername(this.username));
                this.loading = false;

            },
            (error: ApiServiceError) => {
                console.error(error);
                this.loading = false;
            }
        );

    }

    addToProject(iri: string) {

        this.loading = true;

        this._usersService.addUserToProject(this.user.id, iri).subscribe(
            (result: User) => {
                this.user = result;
                // set new user cache
                this._cache.del(this.username);
                this._cache.get(this.username, this._usersService.getUserByUsername(this.username));
                this.initNewProjects();
                this.loading = false;
            },
            (error: ApiServiceError) => {
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
    userIsProjectAdmin(permissions: PermissionData, iri: string): boolean {
        return (permissions.groupsPerProject[iri].indexOf(KnoraConstants.ProjectAdminGroupIRI) > -1);
    }

    openProject(shortcode: string) {
        this.closeDialog.emit();
        this._router.navigateByUrl('/refresh', { skipLocationChange: true }).then(
            () => this._router.navigate(['/project/' + shortcode])
        );
    }

}
