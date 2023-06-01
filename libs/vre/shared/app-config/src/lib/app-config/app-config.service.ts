import { Inject, Injectable } from '@angular/core';
import { KnoraApiConfig } from '@dasch-swiss/dsp-js';
import { AppConfig } from './app-config';
import { AppConfigToken } from './dsp-api-tokens';
import { DspAppConfig } from './dsp-app-config';
import { DspConfig } from './dsp-config';
import { DspIiifConfig } from './dsp-iiif-config';
import {
    DspDataDogConfig,
    DspInstrumentationConfig,
    DspRollbarConfig,
} from './dsp-instrumentation-config';

@Injectable({
    providedIn: 'root',
})
export class AppConfigService {
    private readonly _dspConfig: DspConfig;
    private readonly _dspApiConfig: KnoraApiConfig;
    private readonly _dspIiifConfig: DspIiifConfig;
    private readonly _dspAppConfig: DspAppConfig;
    private readonly _dspInstrumentationConfig: DspInstrumentationConfig;

    /**
     * Watch out for AppConfig. The config.json is simply pressed into
     * this type without type checking!!!
     */
    constructor(@Inject(AppConfigToken) private _appConfig: AppConfig) {
        // check for presence of apiProtocol and apiHost
        if (
            this._appConfig.apiProtocol.length == 0 ||
            this._appConfig.apiHost.length == 0
        ) {
            throw new Error(
                'config misses required members: apiProtocol and/or apiHost'
            );
        }

        const env = this._appConfig.instrumentation.environment;

        const prodMode = env.includes('prod') || env.includes('production');

        let color = 'primary';
        if (!prodMode) {
            if (env.includes('staging') || env.includes('dev')) {
                color = 'accent';
            } else if (env.includes('test')) {
                color = 'warn';
            } else {
                color = 'default';
            }
        }

        this._dspConfig = new DspConfig(
            this._appConfig.dspRelease,
            env,
            prodMode,
            color
        );

        /**
         * make input type safe, as AppConfig can contain basically anything as
         * config.json is simply pressed into this type without type checking!!!
         */
        const apiPort =
          typeof this._appConfig.apiPort === 'number'
            ? this._appConfig.apiPort
            : null;

        const apiPath = this._appConfig.apiPath;

        const jsonWebToken = this._appConfig.jsonWebToken;

        const logErrors = this._appConfig.logErrors;

        const zioPrefix =
            this._appConfig.zioPrefix === '/zio' ||
            this._appConfig.zioPrefix === ':5555'
                ? this._appConfig.zioPrefix
                : '/zio';
        const zioEndpoints = Array.isArray(this._appConfig.zioEndpoints)
            ? this._appConfig.zioEndpoints
            : [];

        this._dspApiConfig = new KnoraApiConfig(
            this._appConfig.apiProtocol,
            this._appConfig.apiHost,
            apiPort,
            apiPath,
            jsonWebToken,
            logErrors,
            zioPrefix,
            zioEndpoints
        );

        /**
         * make input type safe, as AppConfig can contain basically anything as
         * config.json is simply pressed into this type without type checking!!!
         */
        const iiifPort =
          typeof this._appConfig.iiifPort === 'number'
            ? this._appConfig.iiifPort
            : null;

        const iiifPath = this._appConfig.iiifPath;

        // init iiif configuration
        this._dspIiifConfig = new DspIiifConfig(
            this._appConfig.iiifProtocol,
            this._appConfig.iiifHost,
            iiifPort,
            iiifPath
        );

        // init dsp app extended configuration
        this._dspAppConfig = new DspAppConfig(
            this._appConfig.geonameToken,
            this._appConfig.iriBase
        );

        // init instrumentation configuration
        this._dspInstrumentationConfig = new DspInstrumentationConfig(
            this._appConfig.instrumentation.environment,
            new DspDataDogConfig(
                this._appConfig.instrumentation.dataDog.enabled,
                this._appConfig.instrumentation.dataDog.applicationId,
                this._appConfig.instrumentation.dataDog.clientToken,
                this._appConfig.instrumentation.dataDog.site,
                this._appConfig.instrumentation.dataDog.service
            ),
            new DspRollbarConfig(
                this._appConfig.instrumentation.rollbar.enabled,
                this._appConfig.instrumentation.rollbar.accessToken
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
