import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { AuthenticationService } from '@knora/authentication';
import { ApiServiceError, User, UsersService } from '@knora/core';
import { AppGlobal } from 'src/app/app-global';
import { CacheService } from 'src/app/main/cache/cache.service';
import { MenuItem } from '../../main/declarations/menu-item';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
    selector: 'app-user-menu',
    templateUrl: './user-menu.component.html',
    styleUrls: ['./user-menu.component.scss']
})
export class UserMenuComponent implements OnInit {
    user: User;

    username: string;

    sysAdmin: boolean = false;

    navigation: MenuItem[];

    constructor(
        private _auth: AuthenticationService,
        private _location: Location,
        private _router: Router
    ) {}

    ngOnInit() {
        this.navigation = AppGlobal.userNav;
        this.username = JSON.parse(localStorage.getItem('session')).user.name;
        this.sysAdmin = JSON.parse(localStorage.getItem('session')).user.sysAdmin;

        if (this.sysAdmin) {
            this.navigation.push({
                label: 'System',
                route: '/system',
                icon: 'all_inbox'
            });
        }
    }

    logout() {
        this._auth.logout();
        // reset the user menu navigation
        this.navigation = undefined;

        // reload the page
        this._router.navigateByUrl('/refresh', {skipLocationChange: true}).then(() => {
                this._router.navigate([this._location.path()]);
            }
        );
    }
}
