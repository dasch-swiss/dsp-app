import { setupAjaxMock, AjaxMock } from '../../../../test/ajax-mock-helper';
import { KnoraApiConfig } from '../../../knora-api-config';
import { KnoraApiConnection } from '../../../knora-api-connection';
import { ApiResponseData } from '../../../models/api-response-data';
import { HealthResponse } from '../../../models/system/health-response';

describe('HealthEndpoint', () => {
  const config = new KnoraApiConfig('http', 'localhost', 3333, undefined, undefined, true);
  const knoraApiConnection = new KnoraApiConnection(config);

  let ajaxMock: AjaxMock;

  beforeEach(() => {
    ajaxMock = setupAjaxMock();
  });

  afterEach(() => {
    ajaxMock.cleanup();
  });

  describe('Method getHealthStatus', () => {
    it('should return a running health status', done => {
      const health = require('../../../../test/data/api/system/health/running-response.json');

      ajaxMock.setMockResponse(health);

      knoraApiConnection.system.healthEndpoint
        .getHealthStatus()
        .subscribe((response: ApiResponseData<HealthResponse>) => {
          expect(response.body.name).toEqual('AppState');
          expect(response.body.message).toEqual('Application is healthy');
          expect(response.body.severity).toEqual('non fatal');
          expect(response.body.status).toEqual(true);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/health');

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should return a maintenance mode health status', done => {
      const health = require('../../../../test/data/api/system/health/maintenance-mode-response.json');

      ajaxMock.setMockResponse(health);

      knoraApiConnection.system.healthEndpoint
        .getHealthStatus()
        .subscribe((response: ApiResponseData<HealthResponse>) => {
          expect(response.body.name).toEqual('AppState');
          expect(response.body.message).toEqual('Application is in maintenance mode. Please retry later.');
          expect(response.body.severity).toEqual('non fatal');
          expect(response.body.status).toEqual(false);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/health');

          expect(request?.method).toEqual('GET');

          done();
        });
    });

    it('should return a stopped mode health status', done => {
      const health = require('../../../../test/data/api/system/health/stopped-response.json');

      ajaxMock.setMockResponse(health);

      knoraApiConnection.system.healthEndpoint
        .getHealthStatus()
        .subscribe((response: ApiResponseData<HealthResponse>) => {
          expect(response.body.name).toEqual('AppState');
          expect(response.body.message).toEqual('Stopped. Please retry later.');
          expect(response.body.severity).toEqual('non fatal');
          expect(response.body.status).toEqual(false);

          const request = ajaxMock.getLastRequest();

          expect(request?.url).toBe('http://localhost:3333/health');

          expect(request?.method).toEqual('GET');

          done();
        });
    });
  });
});
