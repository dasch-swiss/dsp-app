import { Injectable } from '@angular/core';
import {
    ActivatedRouteSnapshot,
    CanActivate,
    Router,
    RouterStateSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { SessionService } from '@dasch-swiss/vre/shared/app-session';
import {RouteConstants} from "@dasch-swiss/vre/shared/app-config";

@Injectable({
    providedIn: 'root',
})
export class AuthGuard implements CanActivate {
    constructor(private _session: SessionService, private _router: Router) {}

    canActivate(
        next: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): Observable<boolean> | Promise<boolean> | boolean {
        if (!this._session.getSession()) {
            this._router.navigate([RouteConstants.home]);
            return false;
        }

        return true;
    }
}
