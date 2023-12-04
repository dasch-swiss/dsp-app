import { InjectionToken } from '@angular/core';
import { KnoraApiConfig, KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspAppConfig } from './dsp-app-config';
import { DspInstrumentationConfig } from './dsp-instrumentation-config';
import { EntityDefinition } from '@dasch-swiss/dsp-js/src/models/v2/ontologies/EntityDefinition';

/**
 * The AppConfigToken is used to encapsulate the application configuration
 * loaded from 'config/config.prod.json' loaded in main.ts before bootstrap.
 * As such, the structure of the loaded JSON is at this point no checked.
 */
export const AppConfigToken = new InjectionToken<undefined>('app-config');

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

//TODO make this method accessible from api. All object methods is lost when it is stored to the state 
export const getAllEntityDefinitionsAsArray = <T extends EntityDefinition>(entityDefs: { [ index: string ]: T } ): T[] => {
    const entityIndexes = Object.keys(entityDefs);

    return entityIndexes.map((entityIndex: string) => {
        return entityDefs[entityIndex];
    });
}