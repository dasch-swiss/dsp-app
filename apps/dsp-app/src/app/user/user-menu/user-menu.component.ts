import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { User } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { AuthService } from '@dasch-swiss/vre/shared/app-session';
import { UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { MenuItem } from '@dsp-app/src/app/main/declarations/menu-item';
import { Select } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenuComponent implements OnInit, OnDestroy {
  @ViewChild(MatMenuTrigger) menuTrigger: MatMenuTrigger;

  routeConstants = RouteConstants;
  navigation: MenuItem[];

  private ngUnsubscribe: Subject<void> = new Subject<void>();

  isLoggedIn$: Observable<boolean> = this._authService.isLoggedIn$;
  @Select(UserSelectors.user) user$: Observable<User>;
  @Select(UserSelectors.isSysAdmin) isSysAdmin$: Observable<User>;

  systemLink = RouteConstants.system;

  constructor(private _authService: AuthService) {}

  ngOnInit() {
    this.navigation = [
      {
        label: 'DSP-App Home Page',
        shortLabel: 'home',
        route: this.routeConstants.homeRelative,
        icon: '',
      },
      {
        label: 'My Account',
        shortLabel: 'Account',
        route: this.routeConstants.userAccountRelative,
        icon: '',
      },
    ];
  }

  ngOnDestroy() {
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }

  /**
   * logout and destroy session
   *
   */
  logout() {
    this._authService.logout();
  }

  /**
   * closes menu in case of submitting login form
   */
  closeMenu(loginSuccess: boolean) {
    if (loginSuccess) {
      this.menuTrigger.closeMenu();
    }
  }
}
