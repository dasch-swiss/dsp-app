import { inject, Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { AutoLoginService, UserService } from '@dasch-swiss/vre/core/session';
import { filter, map, Observable, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SysAdminGuard implements CanActivate {
  private readonly _autoLoginService = inject(AutoLoginService);
  private readonly _userService = inject(UserService);
  private readonly _router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    return this._autoLoginService.hasCheckedCredentials$.pipe(
      filter(hasChecked => hasChecked === true),
      switchMap(() => this._userService.isSysAdmin$),
      map(isSysAdmin => {
        if (!isSysAdmin) {
          return this._router.createUrlTree([RouteConstants.notAllowed]);
        }
        return true;
      })
    );
  }
}
