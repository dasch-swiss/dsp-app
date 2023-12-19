/*
 * Copyright © 2021 - 2023 Swiss National Data and Service Center for the Humanities and/or DaSCH Service Platform contributors.
 *  SPDX-License-Identifier: Apache-2.0
 */

import { Inject, Injectable } from '@angular/core';
import { KnoraApiConfig } from '@dasch-swiss/dsp-js';
import { AppConfig } from './app-config';
import { AppConfigToken } from './dsp-api-tokens';
import { DspAppConfig } from './dsp-app-config';
import { DspConfig } from './dsp-config';
import { DspIiifConfig } from './dsp-iiif-config';
import {
  DspDataDogConfig,
  DspInstrumentationConfig,
  DspRollbarConfig,
} from './dsp-instrumentation-config';

@Injectable({
  providedIn: 'root',
})
export class AppConfigService {
  private readonly _dspConfig: DspConfig;
  private readonly _dspApiConfig: KnoraApiConfig;
  private readonly _dspIiifConfig: DspIiifConfig;
  private readonly _dspAppConfig: DspAppConfig;
  private readonly _dspInstrumentationConfig: DspInstrumentationConfig;

  /**
   * Watch out for AppConfig. The config.json is simply pressed into
   * this type without type checking!!!
   */
  constructor(@Inject(AppConfigToken) private _configJson: unknown) {
    // parses the config and
    // throws an error if config is not valid
    const c = AppConfig.parse(_configJson);

    // FIXME: find out where color is used and move this logic to there
    const env = c.instrumentation.environment;
    const prodMode = env.includes('prod') || env.includes('production');
    let color = 'primary';
    if (!prodMode) {
      if (env.includes('staging') || env.includes('dev')) {
        color = 'accent';
      } else if (env.includes('test')) {
        color = 'warn';
      } else {
        color = 'default';
      }
    }

    this._dspConfig = new DspConfig(
      c.dspRelease,
      c.instrumentation.environment,
      prodMode,
      color
    );

    this._dspApiConfig = new KnoraApiConfig(
      c.apiProtocol,
      c.apiHost,
      c.apiPort,
      c.apiPath,
      c.jsonWebToken,
      c.logErrors
    );

    // init iiif configuration
    this._dspIiifConfig = new DspIiifConfig(
      c.iiifProtocol,
      c.iiifHost,
      c.iiifPort,
      c.iiifPath
    );

    // init dsp app extended configuration
    this._dspAppConfig = new DspAppConfig(c.geonameToken, c.iriBase);

    // init instrumentation configuration
    this._dspInstrumentationConfig = new DspInstrumentationConfig(
      c.instrumentation.environment,
      new DspDataDogConfig(
        c.instrumentation.dataDog.enabled,
        c.instrumentation.dataDog.applicationId,
        c.instrumentation.dataDog.clientToken,
        c.instrumentation.dataDog.site,
        c.instrumentation.dataDog.service
      ),
      new DspRollbarConfig(
        c.instrumentation.rollbar.enabled,
        c.instrumentation.rollbar.accessToken
      )
    );
  }

  get dspConfig(): DspConfig {
    return this._dspConfig;
  }

  get dspApiConfig(): KnoraApiConfig {
    return this._dspApiConfig;
  }

  get dspIiifConfig(): DspIiifConfig {
    return this._dspIiifConfig;
  }

  get dspAppConfig(): DspAppConfig {
    return this._dspAppConfig;
  }

  get dspInstrumentationConfig(): DspInstrumentationConfig {
    return this._dspInstrumentationConfig;
  }
}
