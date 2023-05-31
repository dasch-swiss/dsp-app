import { Component, Inject, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import {
    ApiResponseData,
    ApiResponseError,
    KnoraApiConnection,
    ReadUser,
    UserResponse,
} from '@dasch-swiss/dsp-js';
import { CacheService } from '@dsp-app/src/app/main/cache/cache.service';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { ErrorHandlerService } from '@dsp-app/src/app/main/services/error-handler.service';
import {
    Session,
    SessionService,
} from '@dsp-app/src/app/main/services/session.service';

@Component({
    selector: 'app-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
    loading = true;

    user: ReadUser;

    session: Session;
    username: string;
    sysAdmin = false;

    showSystemProjects: boolean = this.sysAdmin;

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _errorHandler: ErrorHandlerService,
        private _session: SessionService,
        private _titleService: Title
    ) {
        // get username
        this.session = this._session.getSession();
        this.username = this.session.user.name;
        this.sysAdmin = this.session.user.sysAdmin;

        this.showSystemProjects = this.sysAdmin;

        // set the page title
        this._titleService.setTitle(this.username);
    }

    ngOnInit() {
        this.loading = true;

        // set the cache
        this._cache.get(
            this.username,
            this._dspApiConnection.admin.usersEndpoint.getUserByUsername(
                this.username
            )
        );

        // get from cache
        this._cache
            .get(
                this.username,
                this._dspApiConnection.admin.usersEndpoint.getUserByUsername(
                    this.username
                )
            )
            .subscribe(
                (response: ApiResponseData<UserResponse>) => {
                    this.user = response.body.user;
                    this.loading = false;
                },
                (error: ApiResponseError) => {
                    this._errorHandler.showMessage(error);
                }
            );
    }
}
