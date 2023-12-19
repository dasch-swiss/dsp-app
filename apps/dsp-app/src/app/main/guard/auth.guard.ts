import { DOCUMENT } from '@angular/common';
import { Inject, Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { ReadUser } from '@dasch-swiss/dsp-js';
import { AuthService } from '@dasch-swiss/vre/shared/app-session';
import { CurrentPageSelectors, SetUserAction, UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { Actions, ofActionCompleted, Select, Store } from '@ngxs/store';
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
      switchMap(() => this._authService.isLoggedIn$),
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
    this.document.defaultView.location.href =
      `${this.document.defaultView.location.href}?` +
      `returnLink=${this.store.selectSnapshot(CurrentPageSelectors.loginReturnLink)}`;
  }
}
