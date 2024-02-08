import { Injectable } from '@angular/core';
import { AppConfigService } from '@dasch-swiss/vre/shared/app-config';
import { Faro, getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';

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
        version: this._appConfig.dspConfig.release,
        environment: this._appConfig.dspInstrumentationConfig.environment,
      },
      instrumentations: [...getWebInstrumentations()],
    });
  }
}
