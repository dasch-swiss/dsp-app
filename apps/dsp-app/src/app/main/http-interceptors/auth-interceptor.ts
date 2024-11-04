import { HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { AccessTokenService } from '@dasch-swiss/vre/shared/app-session';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private _appConfigService: AppConfigService,
    private _accessTokenService: AccessTokenService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const ALLOW_LIST = [
      this._appConfigService.dspApiConfig.apiUrl,
      this._appConfigService.dspIngestConfig.url,
      this._appConfigService.dspIiifConfig.iiifUrl,
    ];

    if (ALLOW_LIST.every(url => !req.url.startsWith(url))) {
      return next.handle(req);
    }

    const authToken = this._accessTokenService.getAccessToken();
    if (!authToken) return next.handle(req);

    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${this._accessTokenService.getAccessToken()}`),
    });
    return next.handle(authReq);
  }
}
