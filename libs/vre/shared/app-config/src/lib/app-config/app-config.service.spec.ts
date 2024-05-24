/*
 * Copyright © 2021 - 2023 Swiss National Data and Service Center for the Humanities and/or DaSCH Service Platform contributors.
 *  SPDX-License-Identifier: Apache-2.0
 */

import { TestBed } from '@angular/core/testing';
import { AppConfig } from './app-config';
import { AppConfigService } from './app-config.service';
import { AppConfigToken } from './dsp-api-tokens';

describe('AppConfigService with dev config', () => {
  let service: AppConfigService;

  const devConfig = {
    dspRelease: '2022.01.01',
    apiProtocol: 'http',
    apiHost: '0.0.0.0',
    apiPort: 3333,
    apiPath: 'mypath',
    iiifProtocol: 'http',
    iiifHost: '0.0.0.0',
    iiifPort: 1024,
    iiifPath: 'mypath',
    ingestUrl: 'http://0.0.0.0:3340',
    jsonWebToken: 'mytoken',
    logErrors: true,
    geonameToken: 'geoname_token',
    iriBase: 'http://rdfh.ch',
    instrumentation: {
      environment: 'dev-server',
      rollbar: {
        enabled: false,
      },
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AppConfigToken,
          useValue: devConfig,
        },
      ],
    });
    service = TestBed.inject(AppConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should process the fully specified config (dev mode)', async () => {
    expect(service.dspConfig.environment).toEqual('dev-server');
    expect(service.dspConfig.color).toEqual('accent');
    expect(service.dspConfig.production).toEqual(false);
    expect(service.dspApiConfig.apiProtocol).toEqual('http');
    expect(service.dspApiConfig.apiHost).toEqual('0.0.0.0');
    expect(service.dspApiConfig.apiPort).toEqual(3333);
    expect(service.dspApiConfig.apiPath).toEqual('mypath');
    expect(service.dspIiifConfig.iiifProtocol).toEqual('http');
    expect(service.dspIiifConfig.iiifHost).toEqual('0.0.0.0');
    expect(service.dspIiifConfig.iiifPort).toEqual(1024);
    expect(service.dspIiifConfig.iiifPath).toEqual('mypath');
    expect(service.dspApiConfig.jsonWebToken).toEqual('mytoken');
    expect(service.dspApiConfig.logErrors).toEqual(true);
    expect(service.dspAppConfig.geonameToken).toEqual('geoname_token');
    expect(service.dspAppConfig.iriBase).toEqual('http://rdfh.ch');
    expect(service.dspInstrumentationConfig.environment).toEqual('dev-server');
    expect(service.dspInstrumentationConfig.rollbar.enabled).toEqual(false);
    expect(service.dspInstrumentationConfig.rollbar.accessToken).toBeUndefined();
  });
});

describe('AppConfigService with prod config', () => {
  let service: AppConfigService;

  const prodConfig: AppConfig = {
    dspRelease: '2023.04.02',
    apiProtocol: 'https',
    apiHost: '0.0.0.0',
    apiPort: 3333,
    apiPath: '',
    iiifProtocol: 'https',
    iiifHost: '0.0.0.0',
    iiifPort: 1024,
    iiifPath: '',
    ingestUrl: 'http://0.0.0.0:3340',
    jsonWebToken: 'mytoken',
    logErrors: true,
    geonameToken: 'geoname_token',
    iriBase: 'http://rdfh.ch',
    instrumentation: {
      environment: 'prod',
      rollbar: {
        enabled: true,
        accessToken: 'rollbar_token',
      },
    },
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: AppConfigToken,
          useValue: prodConfig,
        },
      ],
    });
    service = TestBed.inject(AppConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should process the fully specified config (prod mode)', async () => {
    expect(service.dspConfig.release).toEqual('2023.04.02');
    expect(service.dspConfig.environment).toEqual('prod');
    expect(service.dspConfig.color).toEqual('primary');
    expect(service.dspConfig.production).toEqual(true);
    expect(service.dspApiConfig.apiProtocol).toEqual('https');
    expect(service.dspApiConfig.apiHost).toEqual('0.0.0.0');
    expect(service.dspApiConfig.apiPort).toEqual(3333);
    expect(service.dspApiConfig.apiPath).toEqual('');
    expect(service.dspIiifConfig.iiifProtocol).toEqual('https');
    expect(service.dspIiifConfig.iiifHost).toEqual('0.0.0.0');
    expect(service.dspIiifConfig.iiifPort).toEqual(1024);
    expect(service.dspIiifConfig.iiifPath).toEqual('');
    expect(service.dspIngestConfig.url).toEqual('http://0.0.0.0:3340');
    expect(service.dspApiConfig.jsonWebToken).toEqual('mytoken');
    expect(service.dspApiConfig.logErrors).toEqual(true);
    expect(service.dspAppConfig.geonameToken).toEqual('geoname_token');
    expect(service.dspAppConfig.iriBase).toEqual('http://rdfh.ch');
    expect(service.dspInstrumentationConfig.environment).toEqual('prod');
    expect(service.dspInstrumentationConfig.rollbar.enabled).toEqual(true);
    expect(service.dspInstrumentationConfig.rollbar.accessToken).toEqual('rollbar_token');
  });
});
