import { ProjectService } from '@dasch-swiss/vre/shared/app-helper-services';
import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '@dasch-swiss/vre/shared/app-session';
import { RouteConstants } from '@dasch-swiss/vre/shared/app-config';
import { Select } from '@ngxs/store';
import { UserSelectors } from '@dasch-swiss/vre/shared/app-state';
import { StoredProject } from '@dasch-swiss/dsp-js';


@Injectable({
    providedIn: 'root'
})
export class OntologyClassInstanceGuard implements CanActivate {
    isLoggedIn$: Observable<boolean> = this.authService.isLoggedIn$;

    @Select(UserSelectors.isSysAdmin) isSysAdmin$: Observable<boolean>;
    @Select(UserSelectors.userProjects) userProjects$: Observable<StoredProject[]>;

    constructor(
        private authService: AuthService,
        private projectService: ProjectService,
        private router: Router,
    ) {
    }

    canActivate(activatedRoute: ActivatedRouteSnapshot): Observable<boolean> {
        const instanceId = activatedRoute.params[RouteConstants.instanceParameter];
        return combineLatest([this.isLoggedIn$, this.isSysAdmin$, this.userProjects$])
            .pipe(
                map(([isLoggedIn, isSysAdmin, userProjects]) => {
                    const projectUuid = activatedRoute.parent.params[RouteConstants.uuidParameter];
                    if (!isLoggedIn && instanceId === RouteConstants.addClassInstance) {
                        this.router.navigateByUrl(`/${RouteConstants.project}/${projectUuid}`);
                        return false;
                    }

                    return (instanceId === RouteConstants.addClassInstance 
                        && (userProjects?.some((p) => p.id === this.projectService.uuidToIri(projectUuid)) // project member
                                || isSysAdmin // system admin
                            )
                    );
                })
            )
    }
}

