import { Component, OnInit } from '@angular/core';
import { AppGlobal } from 'src/app/app-global';
import { MenuItem } from 'src/app/main/declarations/menu-item';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {

    navigation: MenuItem[] = [];

    loading = false;

    constructor() { }

    ngOnInit(): void {
        // collaboration
        this.navigation.push(AppGlobal.projectNav[1]);
    }

}
