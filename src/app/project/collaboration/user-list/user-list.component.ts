import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import {
    ApiServiceError,
    Group,
    KnoraConstants,
    PermissionData,
    Project,
    ProjectsService,
    User,
    UsersService
} from '@knora/core';
import { CacheService } from '../../../main/cache/cache.service';
import { MaterialDialogComponent } from 'src/app/main/dialog/material-dialog/material-dialog.component';

@Component({
    selector: 'app-user-list',
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
    loading: boolean;

    @Input() list: User[];
    @Input() disabled?: boolean;

    @Output() refreshParent: EventEmitter<any> = new EventEmitter<any>();

    // knora admin group iri
    adminGroupIri: string = KnoraConstants.ProjectAdminGroupIRI;

    // project shortcode; as identifier in project cache service
    projectcode: string;

    // project data
    project: Project;

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

    constructor(
        private _cache: CacheService,
        private _dialog: MatDialog,
        private _projectsService: ProjectsService,
        private _usersService: UsersService,
        private _route: ActivatedRoute,
        private _router: Router
    ) {
        // get the shortcode of the current project
        this.projectcode = this._route.parent.snapshot.params.shortcode;
    }

    ngOnInit() {
        this.loading = true;

        // get project data from cache
        this._cache
            .get(
                this.projectcode,
                this._projectsService.getProjectByShortcode(this.projectcode)
            )
            .subscribe(
                (response: any) => {
                    this.project = response;
                },
                (error: ApiServiceError) => {
                    console.error(error);
                }
            );

        this.loading = false;
        // setTimeout(() => this.openDialog('editPassword', 'multiuser'), 10);
    }

    /**
     * returns true, when the user is project admin
     *
     * @param  permissions user's permissions
     * @returns boolean
     */
    isProjectAdmin(permissions: PermissionData): boolean {
        return (
            permissions.groupsPerProject[this.project.id].indexOf(
                KnoraConstants.ProjectAdminGroupIRI
            ) > -1
        );
    }

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
                                (ngResult: User) => {},
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
                                    (ngResult: User) => {},
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
                                    (ngResult: User) => {},
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

    updateAdminMembership(id: string, permissions: PermissionData): void {
        if (this.isProjectAdmin(permissions)) {
            // true = user is already project admin --> remove from admin rights
            this._usersService
                .removeUserFromProjectAdmin(id, this.project.id)
                .subscribe(
                    (result: User) => {
                        // console.log(result);
                        this.refreshParent.emit();
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

    openDialog(mode: string, name: string): void {
        const dialogRef = this._dialog.open(MaterialDialogComponent, {
            width: '560px',
            data: { name: name, mode: mode }
        });

        dialogRef.afterClosed().subscribe(result => {
            this.refreshParent.emit();
            // update the view
        });
    }

    /**
     * remove user from project and update list of users
     *
     * @param  {string} id user's IRI
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
     * set user's permission in this project
     * @param user User object
     * @param groups List of selected groups Iris
     */
    updatePermission(user: User, groups: string[]) {
        console.log(user);

        for (const g of groups) {
            if (g === KnoraConstants.ProjectAdminGroupIRI) {
                // add user to admin group
            } else {
                // remove from admin group
            }

            if (user.groups.length > 0) {
                // user is already in groups
                // compare with groups list
                /*
                if (user.groups.indexOf(g) > -1) {

                }
                */
            } else {
                // user is not yet in a group
            }
            console.log(g);
        }

        let currentUserGroups: Group[];

        // TODO: update user group membership

        // get user's group memberships and create an array of
        this._usersService
            .getUsersGroupMemberships(encodeURIComponent(user.id))
            .subscribe(
                (result: Group[]) => {
                    currentUserGroups = result;

                    console.log(currentUserGroups);
                    // check if the user is already in the selected group or not
                    if (currentUserGroups.length > 0) {
                        for (const cg of currentUserGroups) {
                            if (groups.indexOf(cg.id) > -1) {
                                // user is already member of this group
                                // do nothing
                                console.log('do nothing ', cg.id);
                            } else {
                                // add user to group
                                console.log(
                                    'user is not yet group member ',
                                    cg.id
                                );
                                // this._usersService.addUserToGroup(user.id, )
                            }
                        }
                    } else {
                    }
                },
                (error: ApiServiceError) => {
                    console.error('getUsersGroupMemberships ', error);
                }
            );

        /*
        if (groups && groups.length > 0) {
            groups.forEach(function(value: string) {
                // this._usersService.addUserToGroup(user.id, value)
                console.log('forEach ', value);
            });
        }
        */

        /*
        groups.forEach((group: string) => {
            if (group === KnoraConstants.ProjectAdminGroupIRI) {

            }
        });
        */

        // TODO: write update permission method instead of add and remove! This should be done in knora-ui module
        if (groups.indexOf(KnoraConstants.ProjectAdminGroupIRI) > -1) {
            this._usersService
                .addUserToProjectAdmin(user.id, this.project.id)
                .subscribe(
                    (result: User) => {
                        // console.log(result);
                    },
                    (error: ApiServiceError) => {
                        console.error(error);
                    }
                );
        } else {
            this._usersService
                .removeUserFromProjectAdmin(user.id, this.project.id)
                .subscribe(
                    (result: User) => {
                        // console.log(result);
                    },
                    (error: ApiServiceError) => {
                        console.error(error);
                    }
                );
        }
    }

    gotoUserProfile(name: string) {
        if (name === JSON.parse(localStorage.getItem('session')).user.name) {
            this._router.navigate(['/projects']);
        } else {
            this._router.navigate(['/user/' + name]);
        }
    }
}
