/*
 * Copyright © 2021 - 2023 Swiss National Data and Service Center for the Humanities and/or DaSCH Service Platform contributors.
 *  SPDX-License-Identifier: Apache-2.0
 */

import { AppConfig, Datadog, Rollbar } from './app-config';
import { ZodError } from 'zod';

describe('app-config schema tests', () => {
    it('should parse valid config', () => {
        const validConfig = {
            dspRelease: '2023.04.02',
            apiProtocol: 'https',
            apiHost: '0.0.0.0',
            apiPort: 3333,
            apiPath: '',
            iiifProtocol: 'https',
            iiifHost: '0.0.0.0',
            iiifPort: 1024,
            iiifPath: '',
            jsonWebToken: 'mytoken',
            logErrors: true,
            zioPrefix: '/zio',
            zioEndpoints: [],
            geonameToken: 'geoname_token',
            iriBase: 'http://rdfh.ch',
            instrumentation: {
                environment: 'production',
                dataDog: {
                    enabled: true,
                    applicationId: 'app_id',
                    clientToken: 'client_token',
                    site: 'site',
                    service: 'dsp-app',
                },
                rollbar: {
                    enabled: true,
                    accessToken: 'rollbar_token',
                },
            },
        };

        expect(() => {
            AppConfig.parse(validConfig);
        }).toBeTruthy();
    });

    it('should fail for invalid config', () => {
        const invalidConfig = {
            dspRelease: '2023.04.02',
            apiProtocol: 'https',
            apiHost: '0.0.0.0',
            apiPort: null, // invalid as we expect either a number or an empty string
            apiPath: '',
            iiifProtocol: 'https',
            iiifHost: '0.0.0.0',
            iiifPort: null, // invalid as we expect either a number or an empty string
            iiifPath: '',
            jsonWebToken: 'mytoken',
            logErrors: true,
            zioPrefix: '/zio',
            zioEndpoints: [],
            geonameToken: 'geoname_token',
            iriBase: 'http://rdfh.ch',
            instrumentation: {
                environment: 'production',
                dataDog: {
                    enabled: false,
                },
                rollbar: {
                    enabled: false,
                },
            },
        };

        expect(() => {
            AppConfig.parse(invalidConfig);
        }).toThrowError(ZodError);
    });

    it('should throw error for invalid datadog config', () => {
        expect(() => {
            const data = {
                enabled: true,
            };
            Datadog.parse(data);
        }).toThrow(ZodError);
    });

    it('should not throw error for valid Datadog config (1)', () => {
        expect(() => {
            const data = {
                enabled: false,
                applicationId: '1234',
                clientToken: '1234',
                site: '1234',
                service: '1234',
            };
            Datadog.parse(data);
        }).toBeTruthy();
    });

    it('should not throw error for valid Datadog config (2)', () => {
        expect(() => {
            const data = {
                enabled: false,
            };
            Datadog.parse(data);
        }).toBeTruthy();
    });

    it('should throw error for invalid Rollbar config (1)', () => {
        expect(() => {
            const data = {
                enabled: true,
            };
            Datadog.parse(data);
        }).toThrowError(ZodError);
    });

    it('should throw error for invalid Rollbar config (2)', () => {
        expect(() => {
            const data = {
                enabled: true,
                accessToken: '',
            };
            Rollbar.parse(data);
        }).toThrowError(ZodError);
    });

    it('should not throw error for valid Rollbar config (1)', () => {
        expect(() => {
            const data = {
                enabled: false,
            };
            Rollbar.parse(data);
        }).toBeTruthy();
    });

    it('should not throw error for valid Rollbar config (2)', () => {
        expect(() => {
            const data = {
                enabled: false,
                accessToken: '1234567890',
            };
            Rollbar.parse(data);
        }).toBeTruthy();
    });
});
