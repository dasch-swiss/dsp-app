import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { AutoLoginService, UserService } from '@dasch-swiss/vre/core/session';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { combineLatest, filter, map, Observable, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OntologyClassInstanceGuard implements CanActivate {
  constructor(
    private _userService: UserService,
    private projectService: ProjectService,
    private router: Router,
    private _autoLoginService: AutoLoginService
  ) {}

  canActivate(activatedRoute: ActivatedRouteSnapshot): Observable<boolean> {
    const isAddInstance = activatedRoute.url.find(p => p.path === RouteConstants.addClassInstance) !== undefined;
    return combineLatest([
      this._autoLoginService.hasCheckedCredentials$.pipe(
        filter(hasChecked => hasChecked === true),
        switchMap(() => this._userService.isLoggedIn$)
      ),
      this._userService.isSysAdmin$,
      this._userService.user$,
    ]).pipe(
      map(([isLoggedIn, isSysAdmin, user]) => {
        const projectUuid = activatedRoute.parent.params[RouteConstants.uuidParameter];

        if (!isLoggedIn && isAddInstance) {
          this.router.navigateByUrl(`/${RouteConstants.project}/${projectUuid}`);
          return false;
        }

        const userProjects = user ? user.projects : [];
        const isProjectMember = userProjects?.some(p => p.id === this.projectService.uuidToIri(projectUuid));
        return !isAddInstance || isProjectMember || isSysAdmin;
      })
    );
  }
}
