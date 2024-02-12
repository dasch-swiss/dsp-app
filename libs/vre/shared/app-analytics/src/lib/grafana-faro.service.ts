import { Injectable } from '@angular/core';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { Faro, getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';

@Injectable({ providedIn: 'root' })
export class GrafanaFaroService {
  faro: Faro;

  constructor(private readonly _appConfig: AppConfigService) {}

  setup() {
    if (['local-dev', 'dev-server'].includes(this._appConfig.dspInstrumentationConfig.environment)) {
      return;
    }

    this.faro = initializeFaro({
      url: 'https://faro-collector-prod-eu-west-2.grafana.net/collect/66166d1b81448a1cca47cde470d9ec98',
      app: {
        name: 'DSP-APP',
        version: '1.0.0',
        environment: this._appConfig.dspInstrumentationConfig.environment,
      },

      instrumentations: [
        // Mandatory, overwriting the instrumentations array would cause the default instrumentations to be omitted
        ...getWebInstrumentations(),

        // Initialization of the tracing package.
        // This packages is optional because it increases the bundle size noticeably. Only add it if you want tracing data.
        new TracingInstrumentation(),
      ],
    });
  }
}
