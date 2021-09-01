import { TestBed } from '@angular/core/testing';
import { AppInitService } from './app-init.service';

describe('TestService', () => {
    let service: AppInitService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(AppInitService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should fetch the fully specified config file when method Init is called', async () => {

        const fetchSpy = spyOn(window, 'fetch').and.callFake(
            path => Promise.resolve(new Response(JSON.stringify({
                apiProtocol: 'http',
                apiHost: '0.0.0.0',
                apiPort: 3333,
                apiPath: 'mypath',
                jsonWebToken: 'mytoken',
                logErrors: true
            })))
        );

        await service.Init('config', { name: 'prod', production: true });

        expect(service.dspApiConfig.apiProtocol).toEqual('http');
        expect(service.dspApiConfig.apiHost).toEqual('0.0.0.0');
        expect(service.dspApiConfig.apiPort).toEqual(3333);
        expect(service.dspApiConfig.apiPath).toEqual('mypath');
        expect(service.dspApiConfig.jsonWebToken).toEqual('mytoken');
        expect(service.dspApiConfig.logErrors).toEqual(true);

        expect(service.config['apiProtocol']).toEqual('http');
        expect(service.config['apiHost']).toEqual('0.0.0.0');
        expect(service.config['apiPort']).toEqual(3333);
        expect(service.config['apiPath']).toEqual('mypath');
        expect(service.config['jsonWebToken']).toEqual('mytoken');
        expect(service.config['logErrors']).toEqual(true);

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(fetchSpy).toHaveBeenCalledWith('config/config.prod.json');

    });

    it('should fetch the minimally specified config file when method Init is called', async () => {

        const fetchSpy = spyOn(window, 'fetch').and.callFake(
            path => Promise.resolve(new Response(JSON.stringify({
                apiProtocol: 'http',
                apiHost: '0.0.0.0'
            })))
        );

        await service.Init('config', { name: 'prod', production: true });

        expect(service.dspApiConfig.apiProtocol).toEqual('http');
        expect(service.dspApiConfig.apiHost).toEqual('0.0.0.0');
        expect(service.dspApiConfig.apiPort).toEqual(null);
        expect(service.dspApiConfig.apiPath).toEqual('');
        expect(service.dspApiConfig.jsonWebToken).toEqual('');
        expect(service.dspApiConfig.logErrors).toEqual(false);

        expect(service.config['apiProtocol']).toEqual('http');
        expect(service.config['apiHost']).toEqual('0.0.0.0');
        expect(service.config['apiPort']).toEqual(null);
        expect(service.config['apiPath']).toEqual('');
        expect(service.config['jsonWebToken']).toEqual('');
        expect(service.config['logErrors']).toEqual(false);

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(fetchSpy).toHaveBeenCalledWith('config/config.prod.json');

    });

    it('should fetch the config file with additional options when method Init is called', async () => {

        const fetchSpy = spyOn(window, 'fetch').and.callFake(
            path => Promise.resolve(new Response(JSON.stringify({
                apiProtocol: 'http',
                apiHost: '0.0.0.0',
                myOption: true
            })))
        );

        await service.Init('config', { name: 'prod', production: true });

        expect(service.dspApiConfig.apiProtocol).toEqual('http');
        expect(service.dspApiConfig.apiHost).toEqual('0.0.0.0');
        expect(service.dspApiConfig.apiPort).toEqual(null);
        expect(service.dspApiConfig.apiPath).toEqual('');
        expect(service.dspApiConfig.jsonWebToken).toEqual('');
        expect(service.dspApiConfig.logErrors).toEqual(false);

        expect(service.config['apiProtocol']).toEqual('http');
        expect(service.config['apiHost']).toEqual('0.0.0.0');
        expect(service.config['apiPort']).toEqual(null);
        expect(service.config['apiPath']).toEqual('');
        expect(service.config['jsonWebToken']).toEqual('');
        expect(service.config['logErrors']).toEqual(false);
        expect(service.config['myOption']).toEqual(true);

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(fetchSpy).toHaveBeenCalledWith('config/config.prod.json');

    });

    it('should throw an error if required members are missing on the config object', async () => {

        const fetchSpy = spyOn(window, 'fetch').and.callFake(
            path => Promise.resolve(new Response(JSON.stringify({})))
        );

        await expectAsync(service.Init('config', {
            name: 'prod',
            production: true
        }))
            .toBeRejectedWith(new Error('config misses required members: apiProtocol and/or apiHost'));

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(fetchSpy).toHaveBeenCalledWith('config/config.prod.json');

    });

    it('should throw an error if "apiProtocol" is missing on the config object', async () => {

        const fetchSpy = spyOn(window, 'fetch').and.callFake(
            path => Promise.resolve(new Response(JSON.stringify({
                apiHost: '0.0.0.0'
            })))
        );

        await expectAsync(service.Init('config', {
            name: 'prod',
            production: true
        }))
            .toBeRejectedWith(new Error('config misses required members: apiProtocol and/or apiHost'));

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(fetchSpy).toHaveBeenCalledWith('config/config.prod.json');

    });

    it('should throw an error if "apiHost" is missing on the config object', async () => {

        const fetchSpy = spyOn(window, 'fetch').and.callFake(
            path => Promise.resolve(new Response(JSON.stringify({
                apiProtocol: 'http'
            })))
        );

        await expectAsync(service.Init('config', {
            name: 'prod',
            production: true
        }))
            .toBeRejectedWith(new Error('config misses required members: apiProtocol and/or apiHost'));

        expect(fetchSpy).toHaveBeenCalledTimes(1);
        expect(fetchSpy).toHaveBeenCalledWith('config/config.prod.json');

    });

});
