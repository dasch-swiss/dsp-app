import { InjectionToken } from '@angular/core';
import { KnoraApiConfig, KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { AppConfig } from './app-config';
import { DspAppConfig } from './dsp-app-config';
import { DspInstrumentationConfig } from './dsp-instrumentation-config';

/**
 * The AppConfigToken is used to encapsulate the application configuration
 * loaded from 'config/config.prod.json' loaded in main.ts before bootstrap.
 */
export const AppConfigToken = new InjectionToken<AppConfig>('app-config');

// config for dsp-js-lib (@dasch-swiss/dsp-js) config object
export const DspApiConfigToken = new InjectionToken<KnoraApiConfig>(
    'DSP api configuration'
);

// connection config for dsp-js-lib (@dasch-swiss/dsp-js) connection
export const DspApiConnectionToken = new InjectionToken<KnoraApiConnection>(
    'DSP api connection instance'
);

// config for dsp-js-lib (@dasch-swiss/dsp-js) config object
export const DspAppConfigToken = new InjectionToken<DspAppConfig>(
    'DSP app specific extended configuration'
);

// config for instrumentation (datadog and rollbar)
export const DspInstrumentationToken =
    new InjectionToken<DspInstrumentationConfig>(
        'DSP instrumentation configuration'
    );
