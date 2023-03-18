import { Inject, Injectable } from '@angular/core';
import { KnoraApiConfig } from '@dasch-swiss/dsp-js';
import { IConfig } from './main/declarations/app-config';
import { APP_CONFIG } from './main/declarations/dsp-api-tokens';
import { DspAppConfig } from './main/declarations/dsp-app-config';
import { DspConfig } from './main/declarations/dsp-config';
import { DspIiifConfig } from './main/declarations/dsp-iiif-config';
import { DspDataDogConfig, DspInstrumentationConfig, DspRollbarConfig } from './main/declarations/dsp-instrumentation-config';

@Injectable({
    providedIn: 'root'
})
export class AppInitService {

    private readonly _dspConfig: DspConfig;
    private readonly _dspApiConfig: KnoraApiConfig;
    private readonly _dspIiifConfig: DspIiifConfig;
    private readonly _dspAppConfig: DspAppConfig;
    private readonly _dspInstrumentationConfig: DspInstrumentationConfig;

    constructor(
        @Inject(APP_CONFIG) private _config: IConfig,
    ) {
        // check for presence of apiProtocol and apiHost
        if (typeof this._config.apiProtocol !== 'string' || typeof this._config.apiHost !== 'string') {
            throw new Error('config misses required members: apiProtocol and/or apiHost');
        }

        const env = this._config.instrumentation.environment;

        const prodMode = (env.includes('prod') || env.includes('production'));

        let color = 'primary';
        if (!prodMode) {
            if (env.includes('staging') || env.includes('dev')) {
                color = 'accent';
            } else if (env.includes('test')){
                color = 'warn';
            } else {
                color = 'default';
            }
        }

        this._dspConfig = new DspConfig(
            this._config.dspRelease,
            env,
            prodMode,
            color
        );

        // make input type safe
        const apiPort = (typeof this._config.apiPort === 'number' ? this._config.apiPort : null);
        const apiPath = (typeof this._config.apiPath === 'string' ? this._config.apiPath : '');
        const jsonWebToken = (typeof this._config.jsonWebToken === 'string' ? this._config.jsonWebToken : '');
        const logErrors = (typeof this._config.logErrors === 'boolean' ? this._config.logErrors : false);
        const zioPrefix = (this._config.zioPrefix === '/zio' || this._config.zioPrefix === ':5555' ? this._config.zioPrefix : '/zio');
        const zioEndpoints = (Array.isArray(this._config.zioEndpoints) ? this._config.zioEndpoints : []);

        this._dspApiConfig = new KnoraApiConfig(
            this._config.apiProtocol,
            this._config.apiHost,
            apiPort,
            apiPath,
            jsonWebToken,
            logErrors,
            zioPrefix,
            zioEndpoints
        );

        const iiifPort = (typeof this._config.iiifPort === 'number' ? this._config.iiifPort : null);
        const iiifPath = (typeof this._config.iiifPath === 'string' ? this._config.iiifPath : '');

        // init iiif configuration
        this._dspIiifConfig = new DspIiifConfig(
            this._config.iiifProtocol,
            this._config.iiifHost,
            iiifPort,
            iiifPath
        );

        // init dsp app extended configuration
        this._dspAppConfig = new DspAppConfig(
            this._config.geonameToken,
            this._config.iriBase
        );

        // init instrumentation configuration
        this._dspInstrumentationConfig = new DspInstrumentationConfig(
            this._config.instrumentation.environment,
            new DspDataDogConfig(
                this._config.instrumentation.dataDog.enabled,
                this._config.instrumentation.dataDog.applicationId,
                this._config.instrumentation.dataDog.clientToken,
                this._config.instrumentation.dataDog.site,
                this._config.instrumentation.dataDog.service,
            ),
            new DspRollbarConfig(
                this._config.instrumentation.rollbar.enabled,
                this._config.instrumentation.rollbar.accessToken
            )
        );
    }

    get dspConfig(): DspConfig {
        return this._dspConfig;
    }

    get dspApiConfig(): KnoraApiConfig {
        return this._dspApiConfig;
    }

    get dspIiifConfig(): DspIiifConfig {
        return this._dspIiifConfig;
    }

    get dspAppConfig(): DspAppConfig {
        return this._dspAppConfig;
    }

    get dspInstrumentationConfig(): DspInstrumentationConfig {
        return this._dspInstrumentationConfig;
    }
}
