import { Injectable } from '@angular/core';
import { KnoraApiConfig } from '@dasch-swiss/dsp-js';
import { DspDataDogConfig } from './main/declarations/dsp-dataDog-config';
import { DspIiifConfig } from './main/declarations/dsp-iiif-config';

@Injectable({
    providedIn: 'root'
})
export class AppInitService {

    dspApiConfig: KnoraApiConfig;
    dspIiifConfig: DspIiifConfig;
    dspDatadogConfig: DspDataDogConfig;

    config: object;

    constructor() {
    }

    /**
     * fetches and initialises the configuration.
     *
     * @param path path to the config file.
     * @param env environment to be used (dev or prod).
     */
    Init(path: string, env: { name: string; production: boolean }): Promise<void> {

        return new Promise<void>((resolve, reject) => {
            fetch(`${path}/config.${env.name}.json`).then(
                (response: Response) => response.json()).then(dspAppConfig => {


                // check for presence of apiProtocol and apiHost
                if (typeof dspAppConfig.apiProtocol !== 'string' || typeof dspAppConfig.apiHost !== 'string') {
                    throw new Error('config misses required members: apiProtocol and/or apiHost');
                }

                // make input type safe
                const apiPort = (typeof dspAppConfig.apiPort === 'number' ? dspAppConfig.apiPort : null);
                const apiPath = (typeof dspAppConfig.apiPath === 'string' ? dspAppConfig.apiPath : '');
                const jsonWebToken = (typeof dspAppConfig.jsonWebToken === 'string' ? dspAppConfig.jsonWebToken : '');
                const logErrors = (typeof dspAppConfig.logErrors === 'boolean' ? dspAppConfig.logErrors : false);

                // init dsp-api configuration
                this.dspApiConfig = new KnoraApiConfig(
                    dspAppConfig.apiProtocol,
                    dspAppConfig.apiHost,
                    apiPort,
                    apiPath,
                    jsonWebToken,
                    logErrors
                );

                const iiifPort = (typeof dspAppConfig.iiifPort === 'number' ? dspAppConfig.iiifPort : null);
                const iiifPath = (typeof dspAppConfig.iiifPath === 'string' ? dspAppConfig.iiifPath : '');

                // init iiif configuration
                this.dspIiifConfig = new DspIiifConfig(
                    dspAppConfig.iiifProtocol,
                    dspAppConfig.iiifHost,
                    iiifPort,
                    iiifPath
                );

                // init datadog configuration
                this.dspDatadogConfig = new DspDataDogConfig(
                    dspAppConfig.dataDogLogging,
                    dspAppConfig.dataDogApplicationId,
                    dspAppConfig.dataDogClientToken,
                    dspAppConfig.dataDogSite,
                    dspAppConfig.dataDogService,
                );

                // get all options from config
                this.config = dspAppConfig;

                // set sanitized standard config options
                this.config['apiProtocol'] = dspAppConfig.apiProtocol;
                this.config['apiHost'] = dspAppConfig.apiHost;
                this.config['apiPort'] = apiPort;
                this.config['apiPath'] = apiPath;
                this.config['jsonWebToken'] = jsonWebToken;
                this.config['logErrors'] = logErrors;
                this.config['iiifProtocol'] = dspAppConfig.iiifProtocol;
                this.config['iiifHost'] = dspAppConfig.iiifHost;
                this.config['iiifPort'] = iiifPort;
                this.config['iiifPath'] = iiifPath;
                this.config['iiifUrl'] = this.dspIiifConfig.iiifUrl;
                this.config['dataDogLogging'] = this.dspDatadogConfig.dataDogLogging;
                this.config['dataDogApplicationId'] = this.dspDatadogConfig.dataDogApplicationId;
                this.config['dataDogClientToken'] = this.dspDatadogConfig.dataDogClientToken;
                this.config['dataDogSite'] = this.dspDatadogConfig.dataDogSite;
                this.config['dataDogService'] = this.dspDatadogConfig.dataDogService;

                resolve();
            }
            ).catch((err) => {
                reject(err);
            });
        });
    }
}
