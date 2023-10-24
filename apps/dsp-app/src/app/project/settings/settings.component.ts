import { Component } from '@angular/core';
import { MenuItem } from '@dsp-app/src/app/main/declarations/menu-item';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';

@Component({
    selector: 'app-settings',
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent {
    navigation: MenuItem[] = [
        {
            label: 'Project members',
            shortLabel: 'Members',
            route: RouteConstants.collaboration,
            icon: 'group',
        }
    ];

    loading = false;
}
