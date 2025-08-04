import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatMenuTrigger } from '@angular/material/menu';
import { User } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { AuthService } from '@dasch-swiss/vre/core/session';
import { UserSelectors } from '@dasch-swiss/vre/core/state';
import { TranslateService } from '@ngx-translate/core';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject, takeUntil } from 'rxjs';
import { MenuItem } from '../menu-item';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
})
export class UserMenuComponent implements OnInit, OnDestroy {
  @ViewChild(MatMenuTrigger) menuTrigger: MatMenuTrigger;

  destroyed: Subject<void> = new Subject<void>();

  navigation: MenuItem[];
  isLoggedIn$ = this._store.select(UserSelectors.isLoggedIn);

  readonly systemLink = RouteConstants.system;
  user$ = this._store.select(UserSelectors.user);
  isSysAdmin$ = this._store.select(UserSelectors.isSysAdmin);

  constructor(
    private _authService: AuthService,
    private _store: Store,
    private _translateService: TranslateService
  ) {}

  ngOnInit() {
    this.isLoggedIn$.pipe(takeUntil(this.destroyed)).subscribe(isLoggedIn => {
      if (isLoggedIn && this.menuTrigger.menuOpen) {
        this.menuTrigger.closeMenu();
      }
    });

    this.setNav();
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();
  }

  logout() {
    this._authService.logout();
  }

  private setNav() {
    this._translateService.onLangChange.pipe(takeUntil(this.destroyed)).subscribe(() => {
      this.navigation = [
        {
          label: this._translateService.instant('pages.userSettings.userMenu.home'),
          shortLabel: this._translateService.instant('pages.userSettings.userMenu.home'),
          route: RouteConstants.homeRelative,
          icon: '',
        },
        {
          label: this._translateService.instant('pages.userSettings.userMenu.myAccount'),
          shortLabel: this._translateService.instant('pages.userSettings.userMenu.myAccount'),
          route: RouteConstants.userAccountRelative,
          icon: '',
        },
      ];
    });
  }
}
