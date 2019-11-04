import { Component, OnInit, Inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { UsersService, KnoraApiConnectionToken } from '@knora/core';
import { CacheService } from '../main/cache/cache.service';
import { MenuItem } from '../main/declarations/menu-item';
import { AppGlobal } from '../app-global';
import { Session } from '@knora/authentication';
import { MatDialog } from '@angular/material/dialog';
import { KnoraApiConnection } from '@knora/api';

@Component({
    selector: 'app-user',
    templateUrl: './user.component.html',
    styleUrls: ['./user.component.scss']
})
export class UserComponent implements OnInit {

    loading: boolean;
    error: boolean;

    session: Session;

    route: string;

    // for the sidenav
    open: boolean = true;

    navigation: MenuItem[] = AppGlobal.userNav;

    constructor(
        @Inject(KnoraApiConnectionToken) private knoraApiConnection: KnoraApiConnection,
        private _cache: CacheService,
        private _route: ActivatedRoute,
        private _titleService: Title) {

        // get the activated route; we need it for the viewer switch
        this.route = this._route.pathFromRoot[1].snapshot.url[0].path;

        /*
        parent.paramMap.subscribe((params: Params) => {
            this.projectcode = params.get('shortcode');
        });
        */

        // get username
        this.session = JSON.parse(localStorage.getItem('session'));

        // set the page title
        this._titleService.setTitle(this.session.user.name);

    }

    ngOnInit() {

        this.initContent();
    }

    initContent() {
        this.loading = true;

        this._cache.del(this.session.user.name);

        /**
         * set the cache here for current/logged-in user
         */
        this._cache.get(this.session.user.name, this.knoraApiConnection.admin.usersEndpoint.getUserByUsername(this.session.user.name));
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
