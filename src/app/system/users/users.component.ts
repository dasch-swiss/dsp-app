import { Component, OnInit } from '@angular/core';
import { UsersService, User, ApiServiceError } from '@knora/core';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';

@Component({
    selector: 'app-users',
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
    loading: boolean;
    // list of active users
    active: User[] = [];
    // list of inactive (deleted) users
    inactive: User[] = [];

    constructor (
        private _usersService: UsersService,
        private _route: ActivatedRoute,
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
        this._usersService.getAllUsers().subscribe(
            (result: User[]) => {
                // clean up list of users
                this.active = [];
                this.inactive = [];

                for (const u of result) {
                    // get permission for each user
                    // by default, permission is not shown in the
                    // api result of user's list
                    this._usersService.getUserByIri(u.id).subscribe(
                        (res: User) => {
                            u.permissions = res.permissions;
                        },
                        (error: ApiServiceError) => {
                            console.error(error);
                        }
                    );

                    if (u.status === true) {
                        this.active.push(u);
                    } else {
                        this.inactive.push(u);
                    }

                    console.log(u);
                }

                this.loading = false;
            },
            (error: ApiServiceError) => {
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
