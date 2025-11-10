import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { catchError, first, map, Observable, of } from 'rxjs';
import { ProjectPageService } from './project-page.service';

@Injectable({
  providedIn: 'root',
})
export class ProjectPageGuard implements CanActivate {
  constructor(
    private _projectPageService: ProjectPageService,
    private _router: Router
  ) {}
  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    const projectUuid = route.params[RouteConstants.uuidParameter];
    if (!projectUuid) {
      return of(this._routeTo404());
    }

    this._projectPageService.setup(projectUuid);

    return this._projectPageService.currentProject$.pipe(
      first(),
      catchError(() => of(undefined)),
      map(project => (project === undefined ? this._routeTo404() : true))
    );
  }

  private _routeTo404() {
    return this._router.parseUrl(RouteConstants.notFound);
  }
}
