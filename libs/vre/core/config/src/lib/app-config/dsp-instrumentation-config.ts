/*
 * Copyright © 2021 - 2023 Swiss National Data and Service Center for the Humanities and/or DaSCH Service Platform contributors.
 *  SPDX-License-Identifier: Apache-2.0
 */

import { InstrumentationType } from './app-config';

export class DspRollbarConfig {
  constructor(
    public readonly enabled: boolean,
    public readonly accessToken: string | undefined
  ) {}
}

export class DspFaroConfig {
  constructor(
    public readonly enabled: boolean,
    public readonly collectorUrl: string,
    public readonly appName: string,
    public readonly sessionTracking: {
      enabled: boolean;
      persistent: boolean;
      samplingRate: number;
    },
    public readonly console: {
      enabled: boolean;
      disabledLevels: ('log' | 'info' | 'warn' | 'error' | 'debug')[];
    },
    public readonly otlp?: {
      logsUrl?: string;
      tracesUrl?: string;
    }
  ) {}
}

export class DspInstrumentationConfig {
  constructor(
    public readonly environment: InstrumentationType['environment'],
    public readonly rollbar: DspRollbarConfig,
    public readonly faro: DspFaroConfig
  ) {}
}
