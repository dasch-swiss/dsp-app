import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { ReadUser } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { AuthService } from '@dasch-swiss/vre/shared/app-session';
import { SetUserAction, UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Actions, Select, Store, ofActionCompleted } from '@ngxs/store';
import { Observable, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  @Select(UserSelectors.user) user$: Observable<ReadUser>;

  constructor(
    private store: Store,
    private _authService: AuthService,
    private actions$: Actions,
    @Inject(DOCUMENT) private document: Document
  ) {}

  canActivate(): Observable<boolean> {
    return this.user$.pipe(
      switchMap(user => {
        if (user) return of(null);

        if (this.store.selectSnapshot(UserSelectors.isLoading)) {
          return this.actions$.pipe(ofActionCompleted(SetUserAction));
        } else {
          return this.store.dispatch(new SetUserAction(user));
        }
      }),
      switchMap(() => this._authService.isSessionValid$(true)),
      map(isLoggedIn => {
        if (isLoggedIn) {
          return true;
        } else {
          this._goToHomePage();
          return false;
        }
      })
    );
  }

  private _goToHomePage() {
    this.document.defaultView.location.href = `${RouteConstants.home}?returnLink=${this.document.defaultView.location.href}`;
  }
}
