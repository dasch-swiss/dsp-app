import { Component, OnInit } from '@angular/core';
import { AuthenticationService } from '@knora/authentication';
import { MenuItem } from '../../main/declarations/menu-item';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss']
})
export class UserMenuComponent implements OnInit {

    username: string;

    items: MenuItem[] = [
        {
            label: 'Projects',
            route: '/projects',
            icon: 'assignment'
        },
        {
            label: 'Collections',
            route: '/collections',
            icon: 'star'
        },
        {
            label: 'Profile',
            route: '/profile',
            icon: 'fingerprint'
        },
        {
            label: 'Account',
            route: '/account',
            icon: 'settings'
        }
    ];


    constructor(private _auth: AuthenticationService) {
    }

    ngOnInit() {
        this.username = JSON.parse(localStorage.getItem('session')).user.name;
    }

    logout() {
        this._auth.logout();
        location.reload(true);
    }

}
