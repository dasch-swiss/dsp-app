import { TestBed } from '@angular/core/testing';
import { AppInitService } from './app-init.service';
import { IConfig } from './main/declarations/app-config';
import {
    APP_CONFIG,
    DspInstrumentationToken,
} from './main/declarations/dsp-api-tokens';
import {
    DspDataDogConfig,
    DspInstrumentationConfig,
} from './main/declarations/dsp-instrumentation-config';

describe('AppInitService (dev)', () => {
    let service: AppInitService;

    const devConfig: IConfig = {
        dspRelease: '2022.01.01',
        apiProtocol: 'http',
        apiHost: '0.0.0.0',
        apiPort: 3333,
        apiPath: 'mypath',
        iiifProtocol: 'http',
        iiifHost: '0.0.0.0',
        iiifPort: 1024,
        iiifPath: 'mypath',
        jsonWebToken: 'mytoken',
        logErrors: true,
        zioPrefix: ':5555',
        zioEndpoints: ['/admin/projects'],
        geonameToken: 'geoname_token',
        iriBase: 'http://rdfh.ch',
        instrumentation: {
            environment: 'dev',
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
    const dspDatadogSpy = new DspDataDogConfig(false, '', '', '', '');

    const instrumentationConfig: DspInstrumentationConfig = {
        environment: 'dev',
        dataDog: {
            enabled: false,
            applicationId: 'app_id',
            clientToken: 'client_token',
            site: 'site',
            service: 'dsp-app',
        },
        rollbar: {
            enabled: false,
            accessToken: 'rollbar_token',
        },
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: APP_CONFIG,
                    useValue: devConfig,
                },
                {
                    provide: DspInstrumentationToken,
                    useValue: instrumentationConfig,
                },
            ],
        });
        service = TestBed.inject(AppInitService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should process the fully specified config (dev mode)', async () => {
        expect(service.dspConfig.environment).toEqual('dev');
        expect(service.dspConfig.color).toEqual('accent');
        expect(service.dspConfig.production).toEqual(false);
        expect(service.dspApiConfig.apiProtocol).toEqual('http');
        expect(service.dspApiConfig.apiHost).toEqual('0.0.0.0');
        expect(service.dspApiConfig.apiPort).toEqual(3333);
        expect(service.dspApiConfig.zioPrefix).toEqual(':5555');
        expect(service.dspApiConfig.zioEndpoints).toEqual(['/admin/projects']);
        expect(service.dspApiConfig.apiPath).toEqual('mypath');
        expect(service.dspIiifConfig.iiifProtocol).toEqual('http');
        expect(service.dspIiifConfig.iiifHost).toEqual('0.0.0.0');
        expect(service.dspIiifConfig.iiifPort).toEqual(1024);
        expect(service.dspIiifConfig.iiifPath).toEqual('mypath');
        expect(service.dspApiConfig.jsonWebToken).toEqual('mytoken');
        expect(service.dspApiConfig.logErrors).toEqual(true);
        expect(service.dspAppConfig.geonameToken).toEqual('geoname_token');
        expect(service.dspAppConfig.iriBase).toEqual('http://rdfh.ch');
        expect(service.dspInstrumentationConfig.environment).toEqual('dev');
        expect(service.dspInstrumentationConfig.dataDog.enabled).toEqual(true);
        expect(service.dspInstrumentationConfig.dataDog.applicationId).toEqual(
            'app_id'
        );
        expect(service.dspInstrumentationConfig.dataDog.clientToken).toEqual(
            'client_token'
        );
        expect(service.dspInstrumentationConfig.dataDog.site).toEqual('site');
        expect(service.dspInstrumentationConfig.dataDog.service).toEqual(
            'dsp-app'
        );
        expect(service.dspInstrumentationConfig.rollbar.enabled).toEqual(true);
        expect(service.dspInstrumentationConfig.rollbar.accessToken).toEqual(
            'rollbar_token'
        );
    });

    xit('should fetch the minimally specified config file when method Init is called', async () => {
        const fetchSpy = spyOn(window, 'fetch').and.callFake((path) =>
            Promise.resolve(
                new Response(
                    JSON.stringify({
                        apiProtocol: 'http',
                        apiHost: '0.0.0.0',
                        instrumentation: {
                            environment: 'dev',
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
                    })
                )
            )
        );

        // await service.Init('config', { name: 'prod', production: true });

        expect(service.dspApiConfig.apiProtocol).toEqual('http');
        expect(service.dspApiConfig.apiHost).toEqual('0.0.0.0');
        expect(service.dspApiConfig.apiPort).toEqual(null);
        expect(service.dspApiConfig.zioPrefix).toEqual(':5555');
        expect(service.dspApiConfig.apiPath).toEqual('');
        expect(service.dspApiConfig.jsonWebToken).toEqual('');
        expect(service.dspApiConfig.logErrors).toEqual(false);

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(fetchSpy).toHaveBeenCalledWith('config/config.prod.json');
    });

    xit('should fetch the config file with additional options when method Init is called', async () => {
        const fetchSpy = spyOn(window, 'fetch').and.callFake((path) =>
            Promise.resolve(
                new Response(
                    JSON.stringify({
                        apiProtocol: 'http',
                        apiHost: '0.0.0.0',
                        instrumentation: {
                            environment: 'dev',
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
                    })
                )
            )
        );

        expect(service.dspApiConfig.apiProtocol).toEqual('http');
        expect(service.dspApiConfig.apiHost).toEqual('0.0.0.0');
        expect(service.dspApiConfig.apiPort).toEqual(null);
        expect(service.dspApiConfig.apiPath).toEqual('');
        expect(service.dspApiConfig.jsonWebToken).toEqual('');
        expect(service.dspApiConfig.logErrors).toEqual(false);

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(fetchSpy).toHaveBeenCalledWith('config/config.prod.json');
    });

    xit('should throw an error if required members are missing on the config object', async () => {
        const fetchSpy = spyOn(window, 'fetch').and.callFake((path) =>
            Promise.resolve(new Response(JSON.stringify({})))
        );

        // await expectAsync(service.Init('config', {
        //     name: 'prod',
        //     production: true
        // }))
        //     .toBeRejectedWith(new Error('config misses required members: apiProtocol and/or apiHost'));

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(fetchSpy).toHaveBeenCalledWith('config/config.prod.json');
    });

    xit('should throw an error if "apiProtocol" is missing on the config object', async () => {
        const fetchSpy = spyOn(window, 'fetch').and.callFake((path) =>
            Promise.resolve(
                new Response(
                    JSON.stringify({
                        apiHost: '0.0.0.0',
                    })
                )
            )
        );

        // await expectAsync(service.Init('config', {
        //     name: 'prod',
        //     production: true
        // }))
        //     .toBeRejectedWith(new Error('config misses required members: apiProtocol and/or apiHost'));

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(fetchSpy).toHaveBeenCalledWith('config/config.prod.json');
    });

    xit('should throw an error if "apiHost" is missing on the config object', async () => {
        const fetchSpy = spyOn(window, 'fetch').and.callFake((path) =>
            Promise.resolve(
                new Response(
                    JSON.stringify({
                        apiProtocol: 'http',
                    })
                )
            )
        );

        // await expectAsync(service.Init('config', {
        //     name: 'prod',
        //     production: true
        // }))
        //     .toBeRejectedWith(new Error('config misses required members: apiProtocol and/or apiHost'));

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(fetchSpy).toHaveBeenCalledWith('config/config.prod.json');
    });
});

describe('AppInitService (prod)', () => {
    let service: AppInitService;

    const prodConfig: IConfig = {
        dspRelease: '2023.04.02',
        apiProtocol: 'https',
        apiHost: '0.0.0.0',
        apiPort: undefined,
        apiPath: '',
        iiifProtocol: 'https',
        iiifHost: '0.0.0.0',
        iiifPort: undefined,
        iiifPath: '',
        jsonWebToken: 'mytoken',
        logErrors: true,
        zioPrefix: undefined,
        zioEndpoints: [],
        geonameToken: 'geoname_token',
        iriBase: 'https://rdfh.ch',
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

    // const dspDatadogSpy = new DspDataDogConfig(false, '', '', '', '');

    const instrumentationConfig: DspInstrumentationConfig = {
        environment: 'dev',
        dataDog: {
            enabled: false,
            applicationId: 'app_id',
            clientToken: 'client_token',
            site: 'site',
            service: 'dsp-app',
        },
        rollbar: {
            enabled: false,
            accessToken: 'rollbar_token',
        },
    };

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                {
                    provide: APP_CONFIG,
                    useValue: prodConfig,
                },
                {
                    provide: DspInstrumentationToken,
                    useValue: instrumentationConfig,
                },
            ],
        });
        service = TestBed.inject(AppInitService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should process the fully specified config (prod mode)', async () => {
        expect(service.dspConfig.release).toEqual('2023.04.02');
        expect(service.dspConfig.environment).toEqual('production');
        expect(service.dspConfig.color).toEqual('primary');
        expect(service.dspConfig.production).toEqual(true);
        expect(service.dspApiConfig.apiProtocol).toEqual('https');
        expect(service.dspApiConfig.apiHost).toEqual('0.0.0.0');
        expect(service.dspApiConfig.apiPort).toEqual(null);
        expect(service.dspApiConfig.apiPath).toEqual('');
        expect(service.dspApiConfig.zioPrefix).toEqual('/zio');
        expect(service.dspApiConfig.zioEndpoints).toEqual([]);
        expect(service.dspIiifConfig.iiifProtocol).toEqual('https');
        expect(service.dspIiifConfig.iiifHost).toEqual('0.0.0.0');
        expect(service.dspIiifConfig.iiifPort).toEqual(null);
        expect(service.dspIiifConfig.iiifPath).toEqual('');
        expect(service.dspApiConfig.jsonWebToken).toEqual('mytoken');
        expect(service.dspApiConfig.logErrors).toEqual(true);
        expect(service.dspAppConfig.geonameToken).toEqual('geoname_token');
        expect(service.dspAppConfig.iriBase).toEqual('https://rdfh.ch');
        expect(service.dspInstrumentationConfig.environment).toEqual(
            'production'
        );
        expect(service.dspInstrumentationConfig.dataDog.enabled).toEqual(true);
        expect(service.dspInstrumentationConfig.dataDog.applicationId).toEqual(
            'app_id'
        );
        expect(service.dspInstrumentationConfig.dataDog.clientToken).toEqual(
            'client_token'
        );
        expect(service.dspInstrumentationConfig.dataDog.site).toEqual('site');
        expect(service.dspInstrumentationConfig.dataDog.service).toEqual(
            'dsp-app'
        );
        expect(service.dspInstrumentationConfig.rollbar.enabled).toEqual(true);
        expect(service.dspInstrumentationConfig.rollbar.accessToken).toEqual(
            'rollbar_token'
        );
    });
});
