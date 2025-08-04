import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { UserSelectors } from '@dasch-swiss/vre/core/state';
import { TranslateService } from '@ngx-translate/core';
import { Select } from '@ngxs/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { MenuItem } from './menu-item';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserComponent {
  route: string;

  // for the sidenav
  open = true;

  navigation: MenuItem[] = [
    {
      label: this._translateService.instant('pages.userSettings.navigation.myProjects'),
      shortLabel: this._translateService.instant('pages.userSettings.navigation.myProjects'),
      route: RouteConstants.projectsRelative,
      icon: 'assignment',
    },
    {
      label: this._translateService.instant('pages.userSettings.navigation.myAccount'),
      shortLabel: this._translateService.instant('pages.userSettings.navigation.myAccount'),
      route: RouteConstants.userAccountRelative,
      icon: 'settings',
    },
  ];

  routeConstants = RouteConstants;

  constructor(
    private _route: ActivatedRoute,
    private _translateService: TranslateService
  ) {
    // get the activated route; we need it for the viewer switch
    this.route = this._route.pathFromRoot[1].snapshot.url[0].path;
  }
}
