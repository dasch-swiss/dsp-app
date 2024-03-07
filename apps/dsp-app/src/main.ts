import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppConfigToken } from '@dasch-swiss/vre/shared/app-config';
import * as Sentry from '@sentry/angular-ivy';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

function initSentry(environmentName: string) {
  Sentry.init({
    dsn: 'https://20bfc69ec9e457239886c1128cc17928@o4506122165747712.ingest.us.sentry.io/4506122171252736',
    environment: environmentName,
    release: environment.version,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, //  Capture 100% of the transactions
    // Set 'tracePropagationTargets' to control for which URLs distributed tracing should be enabled
    tracePropagationTargets: ['localhost', /^https:\/\/yourserver\.io\/api/],
    // Session Replay
    replaysSessionSampleRate: 0.1, // This sets the sample rate at 10%. You may want to change it to 100% while in development and then sample at a lower rate in production.
    replaysOnErrorSampleRate: 1.0, // If you're not already sampling the entire session, change the sample rate to 100% when sampling sessions where errors occur.
  });
}

function configListener() {
  try {
    const configuration = JSON.parse(this.responseText);
    initSentry(configuration.instrumentation.environment);
    // pass config to bootstrap process using an injection token
    // which will make the encapsulated value available inside
    // services that inject this token
    platformBrowserDynamic([{ provide: AppConfigToken, useValue: configuration }])
      .bootstrapModule(AppModule)
      .catch(err => console.error(err));
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

const getConfigRequest = new XMLHttpRequest();
getConfigRequest.addEventListener('load', configListener);
getConfigRequest.addEventListener('error', configFailed);
getConfigRequest.open('GET', `./config/config.${environment.name}.json`);
getConfigRequest.send();
