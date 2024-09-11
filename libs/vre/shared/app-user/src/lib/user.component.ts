import { ChangeDetectionStrategy, Component, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { TranslateService } from '@ngx-translate/core';
import { Select } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MenuItem } from './menu-item';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserComponent implements OnDestroy {
  isDestroyed = new Subject<void>();

  error: boolean;

  route: string;

  // for the sidenav
  open = true;

  navigation: MenuItem[] = [
    {
      label: this._translateService.instant('user.navigation.myProjects'),
      shortLabel: this._translateService.instant('user.navigation.myProjects'),
      route: RouteConstants.projectsRelative,
      icon: 'assignment',
    },
    {
      label: this._translateService.instant('user.navigation.myAccount'),
      shortLabel: this._translateService.instant('user.navigation.myAccount'),
      route: RouteConstants.userAccountRelative,
      icon: 'settings',
    },
  ];

  @Select(UserSelectors.username) username$: Observable<string>;

  routeConstants = RouteConstants;

  constructor(
    private _route: ActivatedRoute,
    private _titleService: Title,
    private _translateService: TranslateService
  ) {
    // get the activated route; we need it for the viewer switch
    this.route = this._route.pathFromRoot[1].snapshot.url[0].path;

    // set the page title
    this.username$
      .pipe(takeUntil(this.isDestroyed))
      .subscribe((username: string) => this._titleService.setTitle(username));
  }

  ngOnDestroy() {
    this.isDestroyed.next();
    this.isDestroyed.complete();
  }
}
