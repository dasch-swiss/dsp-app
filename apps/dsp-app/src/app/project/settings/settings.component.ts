import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { MenuItem } from '@dsp-app/src/app/main/declarations/menu-item';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    },
  ];

  loading = false;

  trackByFn = (index: number, item: MenuItem) => `${index}-${item.route}`;
}
