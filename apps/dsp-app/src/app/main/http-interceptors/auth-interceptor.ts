import {
    HttpHandler,
    HttpInterceptor,
    HttpRequest,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from '@dasch-swiss/vre/shared/app-session';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(
        private _authService: AuthService,
        private _appConfigService: AppConfigService
    ) {}

    intercept(req: HttpRequest<any>, next: HttpHandler) {
        if (!req.url.startsWith(this._appConfigService.dspApiConfig.apiUrl)) {
            return next.handle(req);
        }

        const authToken = this._authService.getAccessToken();
        if (!authToken) return next.handle(req);

        const authReq = req.clone({
            headers: req.headers.set(
                'Authorization',
                `Bearer ${this._authService.getAccessToken()}`
            ),
        });
        return next.handle(authReq);
    }
}
