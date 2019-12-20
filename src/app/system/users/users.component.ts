import { Component, Inject, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ApiResponseData, ApiResponseError, KnoraApiConnection, ReadUser, UserResponse, UsersResponse } from '@knora/api';
import { KnoraApiConnectionToken } from '@knora/core';

@Component({
    selector: 'app-users',
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
    loading: boolean;
    // list of active users
    active: ReadUser[] = [];
    // list of inactive (deleted) users
    inactive: ReadUser[] = [];

    constructor(
        @Inject(KnoraApiConnectionToken) private knoraApiConnection: KnoraApiConnection,
        private _titleService: Title
    ) {
        // set the page title
        this._titleService.setTitle('All users in Knora');
    }

    ngOnInit() {
        this.loading = true;
        this.initList();
    }

    /**
     * init the list of all users in the system
     */
    initList(): void {
        this.knoraApiConnection.admin.usersEndpoint.getUsers().subscribe(
            (response: ApiResponseData<UsersResponse>) => {
                // clean up list of users
                this.active = [];
                this.inactive = [];

                for (const u of response.body.users) {
                    // get permission for each user
                    // by default, permission is not shown in the
                    // api response of user's list
                    this.knoraApiConnection.admin.usersEndpoint.getUserByIri(u.id).subscribe(
                        (res: ApiResponseData<UserResponse>) => {
                            u.permissions = res.body.user.permissions;
                        },
                        (error: ApiResponseError) => {
                            console.error(error);
                        }
                    );

                    if (u.status === true) {
                        this.active.push(u);
                    } else {
                        this.inactive.push(u);
                    }
                }

                this.loading = false;
            },
            (error: ApiResponseError) => {
                console.error(error);
            }
        );
    }

    refresh(): void {
        // referesh the component
        this.loading = true;

        this.initList();

        // refresh child component: add user
        /*
    if (this.addUser) {
        this.addUser.buildForm();
    }
    */
    }
}
