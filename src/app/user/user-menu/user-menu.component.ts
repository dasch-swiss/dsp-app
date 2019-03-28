import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '@knora/authentication';
import { MenuItem } from '../../main/declarations/menu-item';
import { AppGlobal } from 'src/app/app-global';
import { User, UsersService, ApiServiceError } from '@knora/core';
import { CacheService } from 'src/app/main/cache/cache.service';

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


    constructor(private _auth: AuthenticationService,
                private _cache: CacheService,
                private _usersService: UsersService) {
    }

    ngOnInit() {
        // TODO: fix username... this should be the email

        this.username = JSON.parse(localStorage.getItem('session')).user.name;
        this._cache.get(this.username, this._usersService.getUserByUsername(this.username)).subscribe(
            (response: User) => {
                this.user = response;
            },
            (error: ApiServiceError) => {
                console.error(error);
            }
        );
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
        location.reload(true);
    }

}
