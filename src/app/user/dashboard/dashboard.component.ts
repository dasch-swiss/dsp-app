import { Component, Inject, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ApiResponseData, ApiResponseError, KnoraApiConnection, ReadUser, UserResponse, Constants } from '@knora/api';
import { KnoraApiConnectionToken, Session } from '@knora/core';
import { CacheService } from 'src/app/main/cache/cache.service';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

    loading: boolean = true;

    user: ReadUser;

    session: Session;
    username: string;
    sysAdmin: boolean = false;

    showSystemProjects: boolean = this.sysAdmin;

    constructor(
        @Inject(KnoraApiConnectionToken) private knoraApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _titleService: Title) {
        // get username
        this.session = JSON.parse(localStorage.getItem('session'));
        this.username = this.session.user.name;
        this.sysAdmin = this.session.user.sysAdmin;

        this.showSystemProjects = this.sysAdmin;

        // set the page title
        this._titleService.setTitle(this.username);
    }

    ngOnInit() {

        this.loading = true;

        // set the cache
        this._cache.get(this.username, this.knoraApiConnection.admin.usersEndpoint.getUserByUsername(this.username));

        // get from cache
        this._cache.get(this.username, this.knoraApiConnection.admin.usersEndpoint.getUserByUsername(this.username)).subscribe(
            (response: ApiResponseData<UserResponse>) => {
                this.user = response.body.user;
                this.loading = false;
            },
            (error: ApiResponseError) => {
                console.error(error);
            }
        );

    }

}

