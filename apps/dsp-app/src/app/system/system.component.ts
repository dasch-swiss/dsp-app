import { Component, OnInit } from '@angular/core';
import { Title } from '@angular/platform-browser';

import { AppGlobal } from '../app-global';
import { MenuItem } from '../main/declarations/menu-item';
import { SessionService } from '../main/services/session.service';

@Component({
    selector: 'app-system',
    templateUrl: './system.component.html',
    styleUrls: ['./system.component.scss'],
})
export class SystemComponent implements OnInit {
    loading = true;

    sysAdmin = false;

    navigation: MenuItem[] = AppGlobal.systemNav;

    constructor(
        private _titleService: Title,
        private _session: SessionService
    ) {
        // set the page title
        this._titleService.setTitle('System administration');
    }

    ngOnInit() {
        this.sysAdmin = this._session.getSession().user.sysAdmin;
    }
}
