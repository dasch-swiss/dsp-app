import { DOCUMENT, Inject, Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { AutoLoginService, UserService } from '@dasch-swiss/vre/core/session';
import { filter, Observable, switchMap, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(DOCUMENT) private readonly _document: Document,
    private readonly _autoLoginService: AutoLoginService,
    private readonly _userService: UserService
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
    // Navigate to home without returnLink query parameter
    // Users should log in from the main login page rather than being redirected back
    this._document.defaultView.location.href = RouteConstants.home;
  }
}
