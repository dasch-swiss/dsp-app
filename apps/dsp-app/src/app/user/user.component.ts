import { Component, Inject, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { AppGlobal } from '../app-global';
import { CacheService } from '../main/cache/cache.service';
import { DspApiConnectionToken } from '../main/declarations/dsp-api-tokens';
import { MenuItem } from '../main/declarations/menu-item';
import { Session, SessionService } from '../main/services/session.service';

@Component({
    selector: 'app-user',
    templateUrl: './user.component.html',
    styleUrls: ['./user.component.scss'],
})
export class UserComponent implements OnInit {
    loading: boolean;
    error: boolean;

    session: Session;

    route: string;

    // for the sidenav
    open = true;

    navigation: MenuItem[] = AppGlobal.userNav;

    constructor(
        @Inject(DspApiConnectionToken)
        private _dspApiConnection: KnoraApiConnection,
        private _session: SessionService,
        private _cache: CacheService,
        private _route: ActivatedRoute,
        private _titleService: Title
    ) {
        // get the activated route; we need it for the viewer switch
        this.route = this._route.pathFromRoot[1].snapshot.url[0].path;

        // get session
        this.session = this._session.getSession();

        // set the page title
        this._titleService.setTitle(this.session.user.name);
    }

    ngOnInit() {
        this.initContent();
    }

    initContent() {
        this.loading = true;

        this._cache.del(this.session.user.name);

        // update session
        this._session.setSession(
            this.session.user.jwt,
            this.session.user.name,
            'username'
        );

        /**
         * set the cache here for current/logged-in user
         */
        this._cache.get(
            this.session.user.name,
            this._dspApiConnection.admin.usersEndpoint.getUserByUsername(
                this.session.user.name
            )
        );
        this.loading = false;
    }

    refresh() {
        this.loading = true;
        setTimeout(() => {
            // console.log(this.resource);
            this.initContent();
        }, 500);
    }
}
