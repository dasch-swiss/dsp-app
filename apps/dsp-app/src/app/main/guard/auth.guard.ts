import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private _store: Store,
    @Inject(DOCUMENT) private document: Document
  ) {}

  canActivate(): Observable<boolean> {
    return this._store.select(UserSelectors.isLoggedIn).pipe(
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
