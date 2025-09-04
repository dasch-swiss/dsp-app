import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { AutoLoginService, UserService } from '@dasch-swiss/vre/core/session';
import { Observable, filter, switchMap, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(DOCUMENT) private document: Document,
    private _autoLoginService: AutoLoginService,
    private _userService: UserService
  ) {}

  canActivate(): Observable<boolean> {
    return this._autoLoginService.hasCheckedCredentials$.pipe(
      filter(hasChecked => hasChecked === true),
      switchMap(() => this._userService.isLoggedIn$),
      tap(isLoggedIn => {
        if (!isLoggedIn) {
          this._goToHomePage();
        }
      })
    );
  }

  private _goToHomePage() {
    this.document.defaultView.location.href = `${RouteConstants.home}?returnLink=${this.document.defaultView.location.href}`;
  }
}
