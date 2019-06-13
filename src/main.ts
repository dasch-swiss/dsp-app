import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

import 'hammerjs';

if (environment.production) {
    enableProdMode();
}

function bootstrapFailed(result: any) {
    console.error('bootstrap-fail', result);
}

fetch(`config/config.${environment.name}.json`)
    .then(response => response.json())
    .then(config => {
        if (!config || !config['appName']) {
            bootstrapFailed(config);
            return;
        }

        // store the response somewhere that your ConfigService can read it.
        window['tempConfigStorage'] = config;

        // console.log('config', config);


        platformBrowserDynamic()
            .bootstrapModule(AppModule)
            .catch(err => bootstrapFailed(err));
    })
    .catch(bootstrapFailed);
