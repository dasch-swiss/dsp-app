import { provideRouter } from '@angular/router';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { AppConfigService, AppConfigToken, DspApiConnectionToken } from '@dasch-swiss/vre/core/config';

export const APP_CONFIG_TOKEN_STUB = {
  dspRelease: '0.0.0',
  apiProtocol: 'https',
  apiHost: 'api.example.com',
  apiPort: '',
  apiPath: '',
  iiifProtocol: 'https',
  iiifHost: 'iiif.example.com',
  iiifPort: '',
  iiifPath: '',
  ingestUrl: 'https://ingest.example.com',
  geonameToken: 'token',
  jsonWebToken: '',
  iriBase: 'http://rdfh.ch',
  logErrors: false,
  instrumentation: {
    environment: 'dev',
    rollbar: { enabled: false },
    faro: {
      enabled: false,
      collectorUrl: '',
      appName: '',
      sessionTracking: { enabled: false, persistent: false, samplingRate: 0 },
      console: { enabled: false, disabledLevels: [] },
      tracingCorsUrls: [],
    },
  },
  featureFlags: { allowEraseProjects: false },
};

export const HEADER_BASE_PROVIDERS = [
  provideRouter([]),
  { provide: AppConfigToken, useValue: APP_CONFIG_TOKEN_STUB },
  { provide: DspApiConnectionToken, useValue: {} as KnoraApiConnection },
  {
    provide: AppConfigService,
    useValue: {
      dspConfig: { production: false, environment: 'dev', release: '0.0.0', color: 'accent' },
    },
  },
];
