import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AuthenticationService, Session } from '@knora/authentication';
import { ApiServiceError, Group, KnoraConstants, PermissionData, Project, ProjectsService, User, UsersService } from '@knora/core';
import { CacheService } from 'src/app/main/cache/cache.service';
import { DialogComponent } from 'src/app/main/dialog/dialog.component';

@Component({
    selector: 'app-users-list',
    templateUrl: './users-list.component.html',
    styleUrls: ['./users-list.component.scss']
})
export class UsersListComponent implements OnInit {
    // loading for progess indicator
    loading: boolean;

    // permissions of logged-in user
    session: Session;
    sysAdmin: boolean = false;
    projectAdmin: boolean = false;

    // list of users: status active or inactive (deleted)
    @Input() status: boolean;

    // list of users: depending on the parent
    @Input() list: User[];

    // enable the button to create new user
    @Input() createNew: boolean = false;

    // in case of modification
    @Output() refreshParent: EventEmitter<any> = new EventEmitter<any>();

    // i18n plural mapping
    itemPluralMapping = {
        title: {
            '=1': '1 Member',
            other: '# Members'
        }
    };

    //
    // project view
    // knora admin group iri
    adminGroupIri: string = KnoraConstants.ProjectAdminGroupIRI;

    // project shortcode; as identifier in project cache service
    projectcode: string;

    // project data
    project: Project;

    //
    // sort properties
    sortProps: any = [
        {
            key: 'familyName',
            label: 'Last name'
        },
        {
            key: 'givenName',
            label: 'First name'
        },
        {
            key: 'email',
            label: 'E-mail'
        },
        {
            key: 'username',
            label: 'Username'
        }
    ];

    // ... and sort by 'email'
    sortBy: string = 'email';

    constructor (
        private _auth: AuthenticationService,
        private _cache: CacheService,
        private _dialog: MatDialog,
        private _projectsService: ProjectsService,
        private _usersService: UsersService,
        private _route: ActivatedRoute,
        private _router: Router
    ) {
        // get the shortcode of the current project
        if (this._route.parent.paramMap) {
            this._route.parent.paramMap.subscribe((params: Params) => {
                this.projectcode = params.get('shortcode');
            });
        }
    }

    ngOnInit() {

        // get information about the logged-in user
        this.session = JSON.parse(localStorage.getItem('session'));

        // is the logged-in user system admin?
        this.sysAdmin = this.session.user.sysAdmin;

        // default value for projectAdmin
        this.projectAdmin = this.sysAdmin;


        if (this.projectcode) {
            // set the cache
            this._cache.get(this.projectcode, this._projectsService.getProjectByShortcode(this.projectcode));

            // get project information
            this._cache.get(this.projectcode, this._projectsService.getProjectByShortcode(this.projectcode))
                .subscribe(
                    (result: Project) => {
                        this.project = result;
                        // is logged-in user projectAdmin?
                        this.projectAdmin = this.sysAdmin ? this.sysAdmin : this.session.user.projectAdmin.some(e => e === this.project.id);

                    },
                    (error: ApiServiceError) => {
                        console.error(error);
                    }
                );
        }
    }

    /**
     * returns true, when the user is project admin;
     * when the parameter permissions is not set,
     * it returns the value for the logged-in user
     *
     *
     * @param  [permissions] user's permissions
     * @returns boolean
     */
    userIsProjectAdmin(permissions?: PermissionData): boolean {
        if (permissions) {
            // check if this user is project admin
            return (
                permissions.groupsPerProject[this.project.id].indexOf(
                    KnoraConstants.ProjectAdminGroupIRI
                ) > -1
            );
        } else {
            // check if the logged-in user is project admin
            return this.session.user.projectAdmin.some(e => e === this.project.id);
        }
    }

    /**
     * returns true, when the user is system admin
     *
     * @param permissions PermissionData from user profile
     */
    userIsSystemAdmin(permissions: PermissionData): boolean {

        let admin: boolean = false;
        const groupsPerProjectKeys: string[] = Object.keys(permissions.groupsPerProject);

        for (const key of groupsPerProjectKeys) {
            if (key === KnoraConstants.SystemProjectIRI) {
                admin = permissions.groupsPerProject[key].indexOf(KnoraConstants.SystemAdminGroupIRI) > -1;
            }
        }

        return admin;
    }

    /**
     * update user's group memebership
     */
    updateGroupsMembership(id: string, groups: string[]): void {
        const currentUserGroups: string[] = [];

        this._usersService.getUsersGroupMemberships(id).subscribe(
            (result: Group[]) => {
                for (const group of result) {
                    currentUserGroups.push(group.id);
                }

                if (currentUserGroups.length === 0) {
                    // add user to group
                    // console.log('add user to group');
                    for (const newGroup of groups) {
                        this._usersService
                            .addUserToGroup(id, newGroup)
                            .subscribe(
                                (ngResult: User) => { },
                                (ngError: ApiServiceError) => {
                                    console.error(ngError);
                                }
                            );
                    }
                } else {
                    // which one is deselected?
                    // find id in groups --> if not exists: remove from group
                    for (const oldGroup of currentUserGroups) {
                        if (groups.indexOf(oldGroup) > -1) {
                            // already member of this group
                        } else {
                            // console.log('remove from group', oldGroup);
                            // the old group is not anymore one of the selected groups --> remove user from group
                            this._usersService
                                .removeUserFromGroup(id, oldGroup)
                                .subscribe(
                                    (ngResult: User) => { },
                                    (ngError: ApiServiceError) => {
                                        console.error(ngError);
                                    }
                                );
                        }
                    }
                    for (const newGroup of groups) {
                        if (currentUserGroups.indexOf(newGroup) > -1) {
                            // already member of this group
                        } else {
                            // console.log('add user to group');
                            this._usersService
                                .addUserToGroup(id, newGroup)
                                .subscribe(
                                    (ngResult: User) => { },
                                    (ngError: ApiServiceError) => {
                                        console.error(ngError);
                                    }
                                );
                        }
                    }
                }
            },
            (error: ApiServiceError) => {
                console.error('getUsersGroupMemberships ', error);
            }
        );
    }

    /**
     * update user's admin-group membership
     */
    updateProjectAdminMembership(id: string, permissions: PermissionData): void {
        if (this.userIsProjectAdmin(permissions)) {
            // true = user is already project admin --> remove from admin rights
            this._usersService
                .removeUserFromProjectAdmin(id, this.project.id)
                .subscribe(
                    (result: User) => {
                        // console.log(result);
                        // if this user is not the logged-in user
                        if (this.session.user.name !== result.username) {
                            this.refreshParent.emit();
                        } else {
                            // the logged-in user removed himself as project admin
                            // the list is not available anymore;
                            // open dialog to confirm and
                            // redirect to project page
                            // update the cache of logged-in user and the session
                            this._auth.updateSession(this.session.user.jwt, this.session.user.name);
                            // go to project page
                            this._router.navigateByUrl('/refresh', { skipLocationChange: true }).then(
                                () => this._router.navigate(['/project/' + this.projectcode])
                            );
                        }

                    },
                    (error: ApiServiceError) => {
                        console.error(error);
                    }
                );
        } else {
            // false: user isn't project admin yet --> add admin rights
            this._usersService
                .addUserToProjectAdmin(id, this.project.id)
                .subscribe(
                    (result: User) => {
                        // console.log(result);
                        this.refreshParent.emit();
                    },
                    (error: ApiServiceError) => {
                        console.error(error);
                    }
                );
        }
    }

    updateSystemAdminMembership(id: string, permissions: PermissionData): void {
        if (this.userIsSystemAdmin(permissions)) {
            // true = user is already system admin --> remove from system admin rights
            this._usersService
                .removeUserFromSystemAdmin(id)
                .subscribe(
                    (result: User) => {
                        // console.log(result);
                        // if this user is not the logged-in user
                        if (this.session.user.name !== result.username) {
                            this.refreshParent.emit();
                        }
                    },
                    (error: ApiServiceError) => {
                        console.error(error);
                    }
                );
        } else {
            // false: user isn't system admin yet --> add system admin rights
            this._usersService
                .addUserToSystemAdmin(id)
                .subscribe(
                    (result: User) => {
                        // console.log(result);
                        this.refreshParent.emit();
                    },
                    (error: ApiServiceError) => {
                        console.error(error);
                    }
                );
        }
    }

    /**
     * open dialog in every case of modification:
     * edit user profile data, update user's password,
     * remove user from project or toggle project admin membership,
     * delete and reactivate user
     *
     */
    openDialog(mode: string, name: string, iri?: string): void {
        const dialogConfig: MatDialogConfig = {
            width: '560px',
            position: {
                top: '112px'
            },
            data: { name: name, mode: mode }
        };

        const dialogRef = this._dialog.open(
            DialogComponent,
            dialogConfig
        );

        dialogRef.afterClosed().subscribe(result => {
            if (result === true) {
                // get the mode
                switch (mode) {
                    case 'removeFromProject':
                        this.removeUserFromProject(iri);
                        break;
                    case 'deleteUser':
                        this.deleteUser(iri);
                        break;

                    case 'activateUser':
                        this.activateUser(iri);
                        break;
                }
            } else {
                // update the view
                this.refreshParent.emit();
            }
        });
    }

    /**
     * remove user from project and update list of users
     *
     * @param id user's IRI
     * @returns void
     */
    removeUserFromProject(id: string): void {
        this._usersService.removeUserFromProject(id, this.project.id).subscribe(
            (result: User) => {
                this.refreshParent.emit();
            },
            (error: ApiServiceError) => {
                // this.errorMessage = error;
                console.error(error);
            }
        );
    }


    /**
     * delete resp. deactivate user
     *
     * @param id user's IRI
     */
    deleteUser(id: string) {
        this._usersService.deleteUser(id).subscribe(
            (result: User) => {
                this.refreshParent.emit();
            },
            (error: ApiServiceError) => {
                // this.errorMessage = error;
                console.error(error);
            }
        );
    }

    /**
     * Reactivate user
     *
     * @param id user's IRI
     */
    activateUser(id: string) {
        this._usersService.activateUser(id).subscribe(
            (result: User) => {
                this.refreshParent.emit();
            },
            (error: ApiServiceError) => {
                // this.errorMessage = error;
                console.error(error);
            }
        );
    }

    disableMenu(): boolean {

        // disable menu in case of:
        // project.status = false
        if (this.project && this.project.status === false) {
            return true;
        } else {
            return (!this.sysAdmin && !this.projectAdmin);
        }

    }
}
