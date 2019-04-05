import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { UsersService } from '@knora/core';
import { CacheService } from '../main/cache/cache.service';
import { MenuItem } from '../main/declarations/menu-item';
import { AppGlobal } from '../app-global';
import { Session } from '@knora/authentication';

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

    constructor(private _cache: CacheService,
                private _route: ActivatedRoute,
                private _usersService: UsersService,
                private _titleService: Title) {

        // get the activated route; we need it for the viewer switch
        this.route = this._route.pathFromRoot[1].snapshot.url[0].path;

        // get username
        this.session = JSON.parse(localStorage.getItem('session'));

        // set the page title
        this._titleService.setTitle(this.session.user.name);

    }

    ngOnInit() {

        this.loading = true;

        /**
         * set the cache here for current/logged-in user
         */
        this._cache.get(this.session.user.name, this._usersService.getUserByUsername(this.session.user.name));
        this.loading = false;
    }

}
