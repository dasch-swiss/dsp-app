import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { User } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { AuthService } from '@dasch-swiss/vre/shared/app-session';
import { UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Select, Store } from '@ngxs/store';
import { Observable, Subscription } from 'rxjs';
import { MenuItem } from '../../main/declarations/menu-item';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
})
export class UserMenuComponent implements OnInit, OnDestroy {
  @ViewChild(MatMenuTrigger) menuTrigger: MatMenuTrigger;

  subscription: Subscription;
  isLoggedIn$ = this._store.select(UserSelectors.isLoggedIn);

  readonly systemLink = RouteConstants.system;
  readonly navigation: MenuItem[] = [
    {
      label: 'DSP-App Home Page',
      shortLabel: 'home',
      route: RouteConstants.homeRelative,
      icon: '',
    },
    {
      label: 'My Account',
      shortLabel: 'Account',
      route: RouteConstants.userAccountRelative,
      icon: '',
    },
  ];
  @Select(UserSelectors.user) user$: Observable<User>;
  @Select(UserSelectors.isSysAdmin) isSysAdmin$: Observable<User>;

  constructor(
    private _authService: AuthService,
    private _store: Store
  ) {}

  ngOnInit() {
    this.subscription = this.isLoggedIn$.subscribe(isLoggedIn => {
      if (isLoggedIn && this.menuTrigger.menuOpen) {
        this.menuTrigger.closeMenu();
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  logout() {
    this._authService.logout();
  }
}
