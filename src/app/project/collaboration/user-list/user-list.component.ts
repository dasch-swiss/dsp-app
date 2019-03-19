import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { forEach } from '@angular/router/src/utils/collection';
import {
    ApiServiceError,
    Group,
    KnoraConstants,
    Project,
    ProjectsService,
    User,
    UsersService
} from '@knora/core';
import { CacheService } from '../../../main/cache/cache.service';

@Component({
    selector: 'app-user-list',
    templateUrl: './user-list.component.html',
    styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
    loading: boolean;

    @Input() list: User[];
    @Input() disabled?: boolean;

    @Output() userUpdate: EventEmitter<any> = new EventEmitter<any>();

    projectcode: string;

    project: Project;

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

    sortBy: string = 'email';

    constructor(
        private _cache: CacheService,
        private _projectsService: ProjectsService,
        private _usersService: UsersService,
        private _route: ActivatedRoute
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
    }

    /**
     * remove user from project
     * @param id user iri
     */
    removeUser(id: string) {
        this._usersService.removeUserFromProject(id, this.project.id).subscribe(
            (result: User) => {
                this.userUpdate.emit();
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

                            if ( groups.indexOf(cg.id) > -1 ) {
                                // user is already member of this group
                                // do nothing
                                console.log('do nothing ', cg.id);
                            } else {
                                // add user to group
                                console.log('user is not yet group member ', cg.id);
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
}
