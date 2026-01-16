import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppConfigToken } from '@dasch-swiss/vre/core/config';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';

/**
 * Lazy load and initialize Sentry for error tracking
 * Sentry is ~400KB and only needed for production error monitoring
 */
async function initSentry(environmentName: string): Promise<void> {
  const serverNamesListToExcludeFromSentry = [
    'demo',
    'dev',
    'dev-02',
    'dev-03',
    'local-dev',
    'ls-test',
    'perf-01',
    'test-rdu',
  ];

  if (serverNamesListToExcludeFromSentry.includes(environmentName)) {
    return;
  }

  try {
    // Dynamically import Sentry only when needed
    const Sentry = await import('@sentry/angular');

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

    // Expose Sentry globally for error handler
    window.Sentry = Sentry;
  } catch (error) {
    console.error('Failed to load Sentry:', error);
  }
}

function configListener() {
  try {
    const configuration = JSON.parse(this.responseText);
    initSentry(configuration.instrumentation.environment);
    // pass config to bootstrap process using an injection token
    // which will make the encapsulated value available inside
    // services that inject this token
    bootstrapApplication(AppComponent, {
      providers: [...appConfig.providers, { provide: AppConfigToken, useValue: configuration }],
    }).catch(err => console.error(err));
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
