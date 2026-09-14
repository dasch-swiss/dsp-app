import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { AppConfigService, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { AccessTokenService } from './access-token.service';

/**
 * Seeds the dsp-js connection with the stored JWT at startup.
 *
 * Goes through `AccessTokenService` rather than reading `localStorage` directly so an expired or
 * malformed token is never seeded in the first place (DEV-7249). Reading the raw value meant dsp-js
 * started the page already holding a token `AutoLoginService` was about to reject, and the two
 * request channels then disagreed: dsp-js sent the stale in-memory copy while `authInterceptorFn`,
 * which re-reads `localStorage` per request, correctly sent nothing.
 *
 * Lives in `core/session` — beside the service that owns token validity — because the connection's
 * token is session state, not user-settings state.
 */
export const apiConnectionTokenProvider = {
  provide: DspApiConnectionToken,
  useFactory: (appConfigService: AppConfigService, accessTokenService: AccessTokenService) => {
    appConfigService.dspApiConfig.jsonWebToken = accessTokenService.isValidToken()
      ? (accessTokenService.getAccessToken() ?? '')
      : '';
    return new KnoraApiConnection(appConfigService.dspApiConfig);
  },
  deps: [AppConfigService, AccessTokenService],
};
