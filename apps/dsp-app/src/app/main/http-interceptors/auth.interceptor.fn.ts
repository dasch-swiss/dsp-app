import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AppConfigService } from '@dasch-swiss/vre/core/config';
import { AccessTokenService } from '@dasch-swiss/vre/core/session';

export const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  const appConfigService = inject(AppConfigService);
  const accessTokenService = inject(AccessTokenService);

  const ALLOW_LIST = [
    appConfigService.dspApiConfig.apiUrl,
    appConfigService.dspIngestConfig.url,
    appConfigService.dspIiifConfig.iiifUrl,
  ];

  if (ALLOW_LIST.every(url => !req.url.startsWith(url))) {
    return next(req);
  }

  const authToken = accessTokenService.getAccessToken();
  if (!authToken) return next(req);

  const authReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${accessTokenService.getAccessToken()}`),
  });
  return next(authReq);
};
