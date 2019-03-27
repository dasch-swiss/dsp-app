import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '@knora/authentication';
import { MenuItem } from '../../main/declarations/menu-item';
import { AppGlobal } from 'src/app/app-global';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss']
})
export class UserMenuComponent implements OnInit {

    username: string;

    sysAdmin: boolean = false;

    navigation: MenuItem[] = AppGlobal.userNav;


    constructor(private _auth: AuthenticationService) {
    }

    ngOnInit() {
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
        location.reload(true);
    }

}
