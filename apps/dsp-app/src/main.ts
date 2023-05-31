import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { AppConfigToken } from '@dasch-swiss/vre/shared/app-config';

function configListener() {
    try {
        const configuration = JSON.parse(this.responseText);

        // pass config to bootstrap process using an injection token
        // which will make the encapsulated value available inside
        // services tha inject this token
        platformBrowserDynamic([
            { provide: AppConfigToken, useValue: configuration },
        ])
            .bootstrapModule(AppModule)
            .catch((err) => console.error(err));
    } catch (error) {
        console.error(error);
    }
}

function configFailed() {
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
