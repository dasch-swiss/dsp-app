import { Injectable } from '@angular/core';
import { KnoraApiConfig, KnoraApiConnection } from '@knora/api';
import { KuiConfig } from '@knora/core';

@Injectable()
export class AppInitService {

    static knoraApiConnection: KnoraApiConnection;

    static knoraApiConfig: KnoraApiConfig;

    static kuiConfig: KuiConfig;

    constructor() { }

    init() {

        return new Promise<void>((resolve, reject) => {

            // init knora-ui configuration
            AppInitService.kuiConfig = window['tempConfigStorage'] as KuiConfig;

            // init knora-api configuration
            AppInitService.knoraApiConfig = new KnoraApiConfig(
                AppInitService.kuiConfig.knora.apiProtocol,
                AppInitService.kuiConfig.knora.apiHost,
                AppInitService.kuiConfig.knora.apiPort
            );

            // set knora-api connection configuration
            AppInitService.knoraApiConnection = new KnoraApiConnection(AppInitService.knoraApiConfig);

            resolve();
        });
    }
}



// import { Injectable } from '@angular/core';
// import { KnoraApiConfig, KnoraApiConnection } from '@knora/api';
// import { KuiConfig } from '@knora/core';

// @Injectable()
// export class AppInitService {

//     // we cannot make readonly properties because we assign them later, so make properties that are only accessible in this class!
//     private _knoraApiConnection: KnoraApiConnection;
//     get knoraApiConnection(): KnoraApiConnection {
//         return this._knoraApiConnection;
//     }

//     private _knoraApiConfig: KnoraApiConfig;
//     get knoraApiConfig(): KnoraApiConfig {
//         return this._knoraApiConfig;
//     }

//     private _kuiConfig: KuiConfig;
//     get kuiConfig(): KuiConfig {
//         return this._kuiConfig;
//     }

//     constructor() { }

//     // small i, TypeScript convention
//     init() {

//         return new Promise<void>((resolve, reject) => {

//             // init knora-ui configuration
//             this._kuiConfig = window['tempConfigStorage'] as KuiConfig;
//             // consider the use of json2typescript here, it can throw errors for you if there is a config issue

//             // init knora-api configuration
//             this._knoraApiConfig = new KnoraApiConfig(
//                 this._kuiConfig.knora.apiProtocol,
//                 this._kuiConfig.knora.apiHost,
//                 this._kuiConfig.knora.apiPort
//             );

//             // set knora-api connection configuration
//             this._knoraApiConnection = new KnoraApiConnection(this._knoraApiConfig);

//             resolve();
//         });
//     }
// }
