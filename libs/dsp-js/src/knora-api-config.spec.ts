import { KnoraApiConfig } from './knora-api-config';

describe('Test class KnoraApiConfig', () => {
  describe('Test method constructor()', () => {
    interface IConstructorParams {
      apiProtocol: 'http' | 'https';
      apiHost: string;
      apiPort?: number | null;
      apiPath?: string;
      jsonWebToken?: string;
      logErrors?: boolean;
    }

    it('should verify parameters', () => {
      const params: IConstructorParams[] = [
        {
          apiProtocol: 'http',
          apiHost: 'localhost',
        },
        {
          apiProtocol: 'http',
          apiHost: 'localhost',
          apiPort: 80,
        },
        {
          apiProtocol: 'https',
          apiHost: 'localhost',
        },
        {
          apiProtocol: 'https',
          apiHost: 'localhost',
          apiPort: 443,
        },
        {
          apiProtocol: 'http',
          apiHost: 'localhost',
          apiPort: 1234,
          apiPath: '/api',
          jsonWebToken: 'GAGA',
        },
        {
          apiProtocol: 'http',
          apiHost: 'localhost',
          apiPort: 1234,
          apiPath: '/api',
          jsonWebToken: 'GAGA',
          logErrors: false,
        },
        {
          apiProtocol: 'http',
          apiHost: 'localhost',
          apiPort: 1234,
          apiPath: '/api',
          jsonWebToken: 'GAGA',
          logErrors: true,
        },
      ];

      params.forEach(({ apiProtocol, apiHost, apiPort, apiPath, jsonWebToken, logErrors }) => {
        const config = new KnoraApiConfig(apiProtocol, apiHost, apiPort, apiPath, jsonWebToken, logErrors);

        expect(config).toEqual(expect.any(KnoraApiConfig));
        expect(config.apiProtocol).toEqual(apiProtocol);
        expect(config.apiHost).toEqual(apiHost);

        if (apiProtocol === KnoraApiConfig.PROTOCOL_HTTP && apiPort === KnoraApiConfig.DEFAULT_PORT_HTTP) {
          expect(config.apiPort).toEqual(null);
        } else if (apiProtocol === KnoraApiConfig.PROTOCOL_HTTPS && apiPort === KnoraApiConfig.DEFAULT_PORT_HTTPS) {
          expect(config.apiPort).toEqual(null);
        } else {
          expect(config.apiPort).toEqual(apiPort === undefined ? null : apiPort);
        }

        expect(config.apiPath).toEqual(apiPath === undefined ? '' : apiPath);
        expect(config.jsonWebToken).toEqual(jsonWebToken === undefined ? '' : jsonWebToken);
        expect(config.logErrors).toEqual(logErrors === undefined ? false : logErrors);
      });
    });
  });

  describe('Test property apiUrl', () => {
    interface IApiUrlData {
      param: {
        apiProtocol: 'http' | 'https';
        apiHost: string;
        apiPort?: number | null;
        apiPath?: string;
      };
      result: string;
    }

    it('should return correct value', () => {
      const data: IApiUrlData[] = [
        {
          param: { apiProtocol: 'http', apiHost: 'localhost' },
          result: 'http://localhost',
        },
        {
          param: { apiProtocol: 'http', apiHost: 'localhost', apiPort: 80 },
          result: 'http://localhost',
        },
        {
          param: { apiProtocol: 'https', apiHost: 'localhost' },
          result: 'https://localhost',
        },
        {
          param: { apiProtocol: 'https', apiHost: 'localhost', apiPort: 443 },
          result: 'https://localhost',
        },
        {
          param: { apiProtocol: 'https', apiHost: 'domain.com', apiPort: 1234 },
          result: 'https://domain.com:1234',
        },
        {
          param: { apiProtocol: 'https', apiHost: 'domain.com', apiPort: 1234, apiPath: '/api' },
          result: 'https://domain.com:1234/api',
        },
        {
          param: { apiProtocol: 'https', apiHost: 'domain.com', apiPort: 1234, apiPath: '/api' },
          result: 'https://domain.com:1234/api',
        },
      ];

      data.forEach(({ param, result }) => {
        const config = new KnoraApiConfig(param.apiProtocol, param.apiHost, param.apiPort, param.apiPath);
        expect(config.apiUrl).toBe(result);
      });
    });
  });
});
