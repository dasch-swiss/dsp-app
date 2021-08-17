import { Injectable } from '@angular/core';
import { KnoraApiConfig } from '@dasch-swiss/dsp-js';

@Injectable({
    providedIn: 'root'
})
export class AppInitService {

    dspApiConfig: KnoraApiConfig;

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
                (response: Response) => response.json()).then(dspApiConfig => {

                // check for presence of apiProtocol and apiHost
                if (typeof dspApiConfig.apiProtocol !== 'string' || typeof dspApiConfig.apiHost  !== 'string') {
                    throw new Error('config misses required members: apiProtocol and/or apiHost');
                }

                // make input type safe
                const apiPort = (typeof dspApiConfig.apiPort === 'number' ? dspApiConfig.apiPort : null);
                const apiPath = (typeof dspApiConfig.apiPath === 'string' ? dspApiConfig.apiPath : '');
                const jsonWebToken = (typeof dspApiConfig.jsonWebToken === 'string' ? dspApiConfig.jsonWebToken : '');
                const logErrors = (typeof dspApiConfig.logErrors === 'boolean' ? dspApiConfig.logErrors : false);

                // init dsp-api configuration
                this.dspApiConfig = new KnoraApiConfig(
                    dspApiConfig.apiProtocol,
                    dspApiConfig.apiHost,
                    apiPort,
                    apiPath,
                    jsonWebToken,
                    logErrors
                );

                // get all options from config
                this.config = dspApiConfig;

                // set sanitized standard config options
                this.config['apiProtocol'] = dspApiConfig.apiProtocol;
                this.config['apiHost'] = dspApiConfig.apiHost;
                this.config['apiPort'] = apiPort;
                this.config['apiPath'] = apiPath;
                this.config['jsonWebToken'] = jsonWebToken;
                this.config['logErrors'] = logErrors;

                resolve();
            }
            ).catch((err) => {
                reject(err);
            });
        });
    }
}
