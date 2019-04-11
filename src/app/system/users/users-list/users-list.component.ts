import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Session, AuthenticationService } from '@knora/authentication';
import {
    User,
    KnoraConstants,
    Project,
    ProjectsService,
    UsersService,
    PermissionData,
    ApiServiceError,
    Group
} from '@knora/core';
import { MatDialog, MatDialogConfig } from '@angular/material';
import { MaterialDialogComponent } from 'src/app/main/dialog/material-dialog/material-dialog.component';
import { CacheService } from 'src/app/main/cache/cache.service';

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

    constructor(
        private _auth: AuthenticationService,
        private _cache: CacheService,
        private _dialog: MatDialog,
        private _projectsService: ProjectsService,
        private _usersService: UsersService,
        private _route: ActivatedRoute,
        private _router: Router
    ) {
        // get the shortcode of the current project
        if (this._route.parent.snapshot.params) {
            this.projectcode = this._route.parent.snapshot.params.shortcode;
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
            // get project information
            this._cache
                .get(
                    this.projectcode,
                    this._projectsService.getProjectByShortcode(
                        this.projectcode
                    )
                )
                .subscribe(
                    (response: Project) => {
                        this.project = response;
                        // is logged-in user projectAdmin?
                        this.projectAdmin = this.sysAdmin
                            ? this.sysAdmin
                            : this.userIsProjectAdmin();

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

    /**
     * update user's admin-group membership
     */
    updateAdminMembership(id: string, permissions: PermissionData): void {
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

    /**
     * open dialog in every case of modification:
     * edit user profile data, update user's password,
     * remove user from project or toggle project admin membership,
     * delete and reactivate user
     *
     */
    openDialog(mode: string, name: string): void {
        const dialogConfig: MatDialogConfig = {
            width: '560px',
            position: {
                top: '112px'
            },
            data: { name: name, mode: mode }
        };

        const dialogRef = this._dialog.open(
            MaterialDialogComponent,
            dialogConfig
        );

        dialogRef.afterClosed().subscribe(result => {
            // update the view
            this.refreshParent.emit();
        });
    }
}
