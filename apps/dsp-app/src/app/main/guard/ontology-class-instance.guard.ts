import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { StoredProject } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { AutoLoginService } from '@dasch-swiss/vre/core/session';
import { UserSelectors } from '@dasch-swiss/vre/core/state';
import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { Select, Store } from '@ngxs/store';
import { combineLatest, Observable } from 'rxjs';
import { filter, map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class OntologyClassInstanceGuard implements CanActivate {
  @Select(UserSelectors.isSysAdmin) isSysAdmin$: Observable<boolean>;
  @Select(UserSelectors.userProjects) userProjects$: Observable<StoredProject[]>;

  constructor(
    private _store: Store,
    private projectService: ProjectService,
    private router: Router,
    private _autoLoginService: AutoLoginService
  ) {}

  canActivate(activatedRoute: ActivatedRouteSnapshot): Observable<boolean> {
    const isAddInstance = activatedRoute.url.find(p => p.path === RouteConstants.addClassInstance) !== undefined;
    return combineLatest([
      this._autoLoginService.hasCheckedCredentials$.pipe(
        filter(hasChecked => hasChecked === true),
        switchMap(() => this._store.select(UserSelectors.isLoggedIn))
      ),
      this.isSysAdmin$,
      this.userProjects$,
    ]).pipe(
      map(([isLoggedIn, isSysAdmin, userProjects]) => {
        const projectUuid = activatedRoute.parent.params[RouteConstants.uuidParameter];

        if (!isLoggedIn && isAddInstance) {
          this.router.navigateByUrl(`/${RouteConstants.project}/${projectUuid}`);
          return false;
        }

        const isProjectMember = userProjects?.some(p => p.id === this.projectService.uuidToIri(projectUuid));
        return !isAddInstance || isProjectMember || isSysAdmin;
      })
    );
  }
}
