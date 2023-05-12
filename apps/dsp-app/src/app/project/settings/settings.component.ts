import { Component, OnInit } from '@angular/core';
import { AppGlobal } from '@dsp-app/src/app/app-global';
import { MenuItem } from '@dsp-app/src/app/main/declarations/menu-item';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit {
    navigation: MenuItem[] = [];

    loading = false;

    ngOnInit(): void {
        // collaboration
        this.navigation.push(AppGlobal.projectNav[1]);
    }
}
