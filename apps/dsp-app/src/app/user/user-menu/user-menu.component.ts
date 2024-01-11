import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { Router } from '@angular/router';
import { User } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { AuthService } from '@dasch-swiss/vre/shared/app-session';
import { UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Select } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { MenuItem } from '../../main/declarations/menu-item';

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

  get isLoggedIn$(): Observable<boolean> {
    return this._authService.isSessionValid$();
  }

  @Select(UserSelectors.user) user$: Observable<User>;
  @Select(UserSelectors.isSysAdmin) isSysAdmin$: Observable<User>;

  systemLink = RouteConstants.system;

  constructor(
    private _authService: AuthService,
    private _router: Router
  ) {}

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
