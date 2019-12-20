import { Component, Inject, OnInit } from '@angular/core';
import { ApiResponseData, ApiResponseError, KnoraApiConnection, LogoutResponse, ReadUser, UserResponse } from '@knora/api';
import { KnoraApiConnectionToken, SessionService } from '@knora/core';
import { AppGlobal } from 'src/app/app-global';
import { CacheService } from 'src/app/main/cache/cache.service';
import { MenuItem } from '../../main/declarations/menu-item';

@Component({
    selector: 'app-user-menu',
    templateUrl: './user-menu.component.html',
    styleUrls: ['./user-menu.component.scss']
})
export class UserMenuComponent implements OnInit {
    user: ReadUser;

    username: string;

    sysAdmin: boolean = false;

    navigation: MenuItem[];

    constructor(
        @Inject(KnoraApiConnectionToken) private knoraApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _session: SessionService
    ) { }

    ngOnInit() {
        this.navigation = AppGlobal.userNav;
        this.username = JSON.parse(localStorage.getItem('session')).user.name;
        this.sysAdmin = JSON.parse(localStorage.getItem('session')).user.sysAdmin;

        this._cache.get(this.username, this.knoraApiConnection.admin.usersEndpoint.getUserByUsername(this.username));
        this._cache.get(this.username, this.knoraApiConnection.admin.usersEndpoint.getUserByUsername(this.username)).subscribe(
            (response: ApiResponseData<UserResponse>) => {
                this.user = response.body.user;
            },
            (error: ApiResponseError) => {
                console.error(error);
            }
        );
    }

    logout() {
        this.knoraApiConnection.v2.auth.logout().subscribe(
            (response: ApiResponseData<LogoutResponse>) => {

                // destroy cache
                this._cache.destroy();

                // destroy (knora-ui) session
                this._session.destroySession();

                // reload the page
                window.location.reload();
            },
            (error: ApiResponseError) => {
                console.error(error);
            }
        );

    }
}
