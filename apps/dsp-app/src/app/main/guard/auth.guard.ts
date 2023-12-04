import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, Inject, Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Actions, ofActionCompleted, Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { concatMap, map, switchMap } from 'rxjs/operators';
import { ReadUser } from '@dasch-swiss/dsp-js';
import { AuthService } from '@dasch-swiss/vre/shared/app-session';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { CurrentPageSelectors, SetUserAction, UserSelectors } from '@dasch-swiss/vre/shared/app-state';


@Injectable({
    providedIn: 'root',
})
export class AuthGuard implements CanActivate {
    
    isLoggedIn$: Observable<boolean> = this._authService.isLoggedIn$;

    @Select(UserSelectors.user) user$: Observable<ReadUser>;

    constructor(
        private store: Store,
        private _authService: AuthService,
        private actions$: Actions,
        @Inject(DOCUMENT) private document: Document
    ) {}

    canActivate(): Observable<boolean> {
        return this.user$.pipe(
            switchMap((user) => {
                if (!user) {
                    if (this.store.selectSnapshot(UserSelectors.isLoading)) {
                        return this.actions$.pipe(
                            ofActionCompleted(SetUserAction),
                            concatMap(() => {
                                return this.isLoggedIn$;
                            })
                        );
                    } else {
                        return this.store.dispatch(new SetUserAction(user)).pipe(
                            concatMap(() => {
                                return this.isLoggedIn$;
                            })
                        );
                    }
                }
                return this.isLoggedIn$;
            }),
            map((isLoggedIn) => {
                if (isLoggedIn) {
                    return true;
                }
                this.document.defaultView.location.href =
                    `${this.document.defaultView.location.href}?` +
                    `returnLink=${this.store.selectSnapshot(
                        CurrentPageSelectors.loginReturnLink
                    )}`;
                return false;
            })
        );
    }
}

// empty component used as a redirect when the user logs in
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: '',
})
export class AuthGuardComponent {
    constructor(private router: Router) {
        this.router.navigate([RouteConstants.home], { replaceUrl: true });
    }
}
