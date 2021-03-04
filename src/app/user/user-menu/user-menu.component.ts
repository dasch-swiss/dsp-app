import { Component, Inject, OnInit } from '@angular/core';
import {
    ApiResponseData,
    ApiResponseError,
    KnoraApiConnection,
    LogoutResponse,
    ReadUser,
    UserResponse
} from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken, SessionService } from '@dasch-swiss/dsp-ui';
import { AppGlobal } from 'src/app/app-global';
import { CacheService } from 'src/app/main/cache/cache.service';
import { ErrorHandlerService } from 'src/app/main/error/error-handler.service';
import { MenuItem } from '../../main/declarations/menu-item';

@Component({
    selector: 'app-user-menu',
    templateUrl: './user-menu.component.html',
    styleUrls: ['./user-menu.component.scss']
})
export class UserMenuComponent implements OnInit {
    user: ReadUser;

    username: string;

    sysAdmin = false;

    navigation: MenuItem[];

    constructor(
        @Inject(DspApiConnectionToken) private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _errorHandler: ErrorHandlerService,
        private _session: SessionService
    ) { }

    ngOnInit() {
        this.navigation = AppGlobal.userNav;
        this.username = this._session.getSession().user.name;
        this.sysAdmin = this._session.getSession().user.sysAdmin;

        this._cache.get(this.username, this._dspApiConnection.admin.usersEndpoint.getUserByUsername(this.username));
        this._cache.get(this.username, this._dspApiConnection.admin.usersEndpoint.getUserByUsername(this.username)).subscribe(
            (response: ApiResponseData<UserResponse>) => {
                this.user = response.body.user;
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );
    }

    logout() {
        this._dspApiConnection.v2.auth.logout().subscribe(
            (response: ApiResponseData<LogoutResponse>) => {

                // destroy cache
                this._cache.destroy();

                // destroy (dsp-ui) session
                this._session.destroySession();

                // reload the page
                window.location.reload();
            },
            (error: ApiResponseError) => {
                this._errorHandler.showMessage(error);
            }
        );

    }
}
