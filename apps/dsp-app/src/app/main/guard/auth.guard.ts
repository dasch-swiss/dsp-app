import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { AutoLoginService } from '@dasch-swiss/vre/shared/app-session';
import { UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { filter, switchMap, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private _store: Store,
    @Inject(DOCUMENT) private document: Document,
    private _autoLoginService: AutoLoginService
  ) {}

  canActivate(): Observable<boolean> {
    return this._autoLoginService.hasCheckedCredentials$.pipe(
      filter(hasChecked => hasChecked === true),
      switchMap(() => this._store.select(UserSelectors.isLoggedIn)),
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
