import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { AppGlobal } from '../app-global';
import { MenuItem } from '../main/declarations/menu-item';

@Component({
    selector: 'app-system',
    templateUrl: './system.component.html',
    styleUrls: ['./system.component.scss']
})
export class SystemComponent implements OnInit {

    loading: boolean = true;

    sysAdmin: boolean = false;

    navigation: MenuItem[] = AppGlobal.systemNav;

    constructor(private _titleService: Title) {
        // set the page title
        this._titleService.setTitle('System administration');
    }

    ngOnInit() {
        this.sysAdmin = JSON.parse(localStorage.getItem('session')).user.sysAdmin;
    }
}
