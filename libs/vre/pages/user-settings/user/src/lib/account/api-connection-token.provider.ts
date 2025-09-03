import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { AppConfigService, Auth, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';

export const apiConnectionTokenProvider = {
  provide: DspApiConnectionToken,
  useFactory: (appConfigService: AppConfigService) => {
    appConfigService.dspApiConfig.jsonWebToken = localStorage.getItem(Auth.AccessToken) || '';
    return new KnoraApiConnection(appConfigService.dspApiConfig);
  },
  deps: [AppConfigService],
};
