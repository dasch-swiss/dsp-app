import { Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthenticationService } from '@knora/authentication';
import { User, UsersService, ApiServiceError } from '@knora/core';
import { AppGlobal } from 'src/app/app-global';
import { CacheService } from 'src/app/main/cache/cache.service';
import { MenuItem } from '../../main/declarations/menu-item';

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

    constructor (
        private _auth: AuthenticationService,
        private _usersService: UsersService,
        private _cache: CacheService,
        private _location: Location,
        private _router: Router
    ) { }

    ngOnInit() {
        this.navigation = AppGlobal.userNav;
        this.username = JSON.parse(localStorage.getItem('session')).user.name;
        this.sysAdmin = JSON.parse(localStorage.getItem('session')).user.sysAdmin;

        this._cache.get(this.username, this._usersService.getUserByUsername(this.username));
        this._cache.get(this.username, this._usersService.getUserByUsername(this.username)).subscribe(
            (result: User) => {
                this.user = result;
            },
            (error: ApiServiceError) => {
                console.error(error);
            }
        );
    }

    logout() {
        this._auth.logout().subscribe(
            (result: any) => {
                // console.log(result);
                this._cache.destroy();

                // reload the page
                window.location.reload();
            },
            (error: any) => {
                console.error(error);
            }
        );

    }
}
