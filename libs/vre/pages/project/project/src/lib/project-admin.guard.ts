import { inject, Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { AutoLoginService, UserService } from '@dasch-swiss/vre/core/session';
import { filter, map, Observable, switchMap, take } from 'rxjs';
import { ProjectPageService } from './project-page.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectAdminGuard implements CanActivate {
  private readonly _autoLoginService = inject(AutoLoginService);
  private readonly _userService = inject(UserService);
  private readonly _projectPageService = inject(ProjectPageService);
  private readonly _router = inject(Router);

  canActivate(): Observable<boolean | UrlTree> {
    return this._autoLoginService.hasCheckedCredentials$.pipe(
      filter(hasChecked => hasChecked === true),
      switchMap(() => this._userService.isLoggedIn$),
      take(1),
      switchMap(isLoggedIn => {
        if (!isLoggedIn) {
          // User is not logged in, redirect to not-allowed page
          return [this._router.createUrlTree([RouteConstants.notAllowed])];
        }
        // User is logged in, check project admin rights
        return this._projectPageService.hasProjectAdminRights$.pipe(
          take(1),
          map(hasProjectAdminRights => {
            if (!hasProjectAdminRights) {
              return this._router.createUrlTree([RouteConstants.notAllowed]);
            }
            return true;
          })
        );
      })
    );
  }
}
