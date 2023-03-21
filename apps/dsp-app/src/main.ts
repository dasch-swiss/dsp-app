import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { APP_CONFIG } from './app/main/declarations/dsp-api-tokens';

function configListener() {
    try {
        const configuration = JSON.parse(this.responseText);

        // pass config to bootstrap process using an injection token
        platformBrowserDynamic([
            { provide: APP_CONFIG, useValue: configuration },
        ])
            .bootstrapModule(AppModule)
            .catch((err) => console.error(err));
    } catch (error) {
        console.error(error);
    }
}

function configFailed(evt) {
    console.error('Error: retrieving config.json');
}

if (environment.production) {
    enableProdMode();
}

const request = new XMLHttpRequest();
request.addEventListener('load', configListener);
request.addEventListener('error', configFailed);
request.open('GET', `./config/config.${environment.name}.json`);
request.send();
