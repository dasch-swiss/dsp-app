import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '@knora/authentication';
import { ApiServiceError, User, UsersService } from '@knora/core';
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

    navigation: MenuItem[] = AppGlobal.userNav;

    constructor(
        private _auth: AuthenticationService,
        private _cache: CacheService,
        private _usersService: UsersService
    ) {}

    ngOnInit() {
        this.username = JSON.parse(localStorage.getItem('session')).user.name;
        this._cache
            .get(
                this.username,
                this._usersService.getUserByUsername(this.username)
            )
            .subscribe(
                (response: User) => {
                    this.user = response;
                    if (this.user.systemAdmin) {
                        this.navigation.push({
                            label: 'System',
                            route: '/system',
                            icon: 'all_inbox'
                        });
                    }
                },
                (error: ApiServiceError) => {
                    console.error(error);
                }
            );
    }

    logout() {
        this._auth.logout();
        // TODO: location.reload is deprecated... find new solution to refresh the whole page
        location.reload(true);
    }
}
