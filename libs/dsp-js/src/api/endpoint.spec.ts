import { AjaxResponse } from 'rxjs/ajax';
import { setupAjaxMock, AjaxMock } from '../../test/ajax-mock-helper';
import { KnoraApiConfig } from '../knora-api-config';
import { Endpoint } from './endpoint';

describe('Test class Endpoint', () => {
  let ajaxMock: AjaxMock;

  beforeEach(() => {
    ajaxMock = setupAjaxMock();
  });

  afterEach(() => {
    ajaxMock.cleanup();
  });

  it('should perform a GET request', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const endpoint = new Endpoint(config, '/test');

    ajaxMock.setMockResponse({ test: 'test' });

    endpoint['httpGet']().subscribe(response => {
      expect(response.status).toEqual(200);
      expect(response.response).toEqual({ test: 'test' });

      const request = ajaxMock.getLastRequest();
      expect(request?.url).toBe('http://localhost:3333/test');
      expect(request?.method).toEqual('GET');

      done();
    });
  });

  it('should perform an unsuccessful GET request', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const endpoint = new Endpoint(config, '/test');

    ajaxMock.setMockError({ msg: 'Not Found' }, 404);

    endpoint['httpGet']().subscribe(
      response => {},
      err => {
        expect(err.status).toEqual(404);

        const request = ajaxMock.getLastRequest();
        expect(request?.url).toBe('http://localhost:3333/test');
        expect(request?.method).toEqual('GET');

        done();
      }
    );
  });

  it('should perform a GET request providing a path segment', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const endpoint = new Endpoint(config, '/test');

    ajaxMock.setMockResponse({ test: 'test' });

    endpoint['httpGet']('/mypath').subscribe(response => {
      expect(response.status).toEqual(200);
      expect(response.response).toEqual({ test: 'test' });

      const request = ajaxMock.getLastRequest();
      expect(request?.url).toBe('http://localhost:3333/test/mypath');
      expect(request?.method).toEqual('GET');

      done();
    });
  });

  it('should perform a GET request with authentication', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const endpoint = new Endpoint(config, '/test');

    endpoint.jsonWebToken = 'testtoken';

    ajaxMock.setMockResponse({ test: 'test' });

    endpoint['httpGet']().subscribe(response => {
      expect(response.status).toEqual(200);
      expect(response.response).toEqual({ test: 'test' });

      const request = ajaxMock.getLastRequest();
      expect(request?.url).toBe('http://localhost:3333/test');
      expect(request?.method).toEqual('GET');
      expect(request?.headers?.['Authorization']).toEqual('Bearer testtoken');

      done();
    });
  });

  it('should perform a GET request with optional header options', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const endpoint = new Endpoint(config, '/test');

    ajaxMock.setMockResponse({ test: 'test' });

    endpoint['httpGet'](undefined, { 'my-feature-toggle': 'my-awesome-feature' }).subscribe(response => {
      expect(response.status).toEqual(200);
      expect(response.response).toEqual({ test: 'test' });

      const request = ajaxMock.getLastRequest();
      expect(request?.url).toBe('http://localhost:3333/test');
      expect(request?.method).toEqual('GET');
      expect(request?.headers?.['my-feature-toggle']).toEqual('my-awesome-feature');

      done();
    });
  });

  it('should perform a POST request', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const endpoint = new Endpoint(config, '/test');

    ajaxMock.setMockResponse({ test: 'test' });

    endpoint['httpPost']('', { mydata: 'data' }).subscribe(response => {
      expect(response.status).toEqual(200);
      expect(response.response).toEqual({ test: 'test' });

      const request = ajaxMock.getLastRequest();
      expect(request?.url).toBe('http://localhost:3333/test');
      expect(request?.method).toEqual('POST');
      expect(request?.headers?.['Content-Type']).toEqual('application/json; charset=utf-8');
      expect(request?.body).toEqual({ mydata: 'data' });

      done();
    });
  });

  it('should perform an unsuccessful POST request', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const endpoint = new Endpoint(config, '/test');

    ajaxMock.setMockError({ msg: 'Not Found' }, 404);

    endpoint['httpPost']('', { mydata: 'data' }).subscribe(
      response => {},
      err => {
        expect(err.status).toEqual(404);

        const request = ajaxMock.getLastRequest();
        expect(request?.url).toBe('http://localhost:3333/test');
        expect(request?.method).toEqual('POST');
        expect(request?.headers?.['Content-Type']).toEqual('application/json; charset=utf-8');
        expect(request?.body).toEqual({ mydata: 'data' });

        done();
      }
    );
  });

  it('should perform a POST request providing a path segment', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const endpoint = new Endpoint(config, '/test');

    ajaxMock.setMockResponse({ test: 'test' });

    endpoint['httpPost']('/mypath', { mydata: 'data' }).subscribe(response => {
      expect(response.status).toEqual(200);
      expect(response.response).toEqual({ test: 'test' });

      const request = ajaxMock.getLastRequest();
      expect(request?.url).toBe('http://localhost:3333/test/mypath');
      expect(request?.method).toEqual('POST');
      expect(request?.headers?.['Content-Type']).toEqual('application/json; charset=utf-8');
      expect(request?.body).toEqual({ mydata: 'data' });

      done();
    });
  });

  it('should perform a POST request with authentication', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const endpoint = new Endpoint(config, '/test');

    endpoint.jsonWebToken = 'testtoken';

    ajaxMock.setMockResponse({ test: 'test' });

    endpoint['httpPost']('', { mydata: 'data' }).subscribe(response => {
      expect(response.status).toEqual(200);
      expect(response.response).toEqual({ test: 'test' });

      const request = ajaxMock.getLastRequest();
      expect(request?.url).toBe('http://localhost:3333/test');
      expect(request?.method).toEqual('POST');
      expect(request?.headers?.['Authorization']).toEqual('Bearer testtoken');
      expect(request?.headers?.['Content-Type']).toEqual('application/json; charset=utf-8');
      expect(request?.body).toEqual({ mydata: 'data' });

      done();
    });
  });

  it('should perform a POST request with default JSON content-type and optional header options', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const endpoint = new Endpoint(config, '/test');

    ajaxMock.setMockResponse({ test: 'test' });

    endpoint['httpPost'](undefined, { mydata: 'data' }, undefined, {
      'my-feature-toggle': 'my-awesome-feature',
    }).subscribe(response => {
      expect(response.status).toEqual(200);
      expect(response.response).toEqual({ test: 'test' });

      const request = ajaxMock.getLastRequest();
      expect(request?.url).toBe('http://localhost:3333/test');
      expect(request?.method).toEqual('POST');
      expect(request?.headers?.['Content-Type']).toEqual('application/json; charset=utf-8');
      expect(request?.headers?.['my-feature-toggle']).toEqual('my-awesome-feature');
      expect(request?.body).toEqual({ mydata: 'data' });

      done();
    });
  });

  it('should perform a POST request with SPARQL content-type and additional header options', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const endpoint = new Endpoint(config, '/test');

    const gravsearchQuery = `
                PREFIX knora-api: <http://api.knora.org/ontology/knora-api/v2#>
                CONSTRUCT {

                    ?mainRes knora-api:isMainResource true .

                } WHERE {

                    ?mainRes a knora-api:Resource .

                    ?mainRes a <http://0.0.0.0:3333/ontology/0001/anything/v2#Thing> .
                }

                OFFSET 0
            `;

    ajaxMock.setMockResponse({ test: 'test' });

    endpoint['httpPost'](undefined, gravsearchQuery, 'sparql', { 'my-feature-toggle': 'my-awesome-feature' }).subscribe(
      response => {
        expect(response.status).toEqual(200);
        expect(response.response).toEqual({ test: 'test' });

        const request = ajaxMock.getLastRequest();
        expect(request?.url).toBe('http://localhost:3333/test');
        expect(request?.method).toEqual('POST');
        expect(request?.headers?.['Content-Type']).toEqual('application/sparql-query; charset=utf-8');
        expect(request?.headers?.['my-feature-toggle']).toEqual('my-awesome-feature');
        expect(request?.body).toEqual(gravsearchQuery);

        done();
      }
    );
  });

  it('should perform a PUT request', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const endpoint = new Endpoint(config, '/test');

    ajaxMock.setMockResponse({ test: 'test' });

    endpoint['httpPut']('', { mydata: 'data' }).subscribe(response => {
      expect(response.status).toEqual(200);
      expect(response.response).toEqual({ test: 'test' });

      const request = ajaxMock.getLastRequest();
      expect(request?.url).toBe('http://localhost:3333/test');
      expect(request?.method).toEqual('PUT');
      expect(request?.headers?.['Content-Type']).toEqual('application/json; charset=utf-8');
      expect(request?.body).toEqual({ mydata: 'data' });

      done();
    });
  });

  it('should perform an an unsuccessful PUT request', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const endpoint = new Endpoint(config, '/test');

    ajaxMock.setMockError({ msg: 'Not Found' }, 404);

    endpoint['httpPut']('', { mydata: 'data' }).subscribe(
      response => {},
      err => {
        expect(err.status).toEqual(404);

        const request = ajaxMock.getLastRequest();
        expect(request?.url).toBe('http://localhost:3333/test');
        expect(request?.method).toEqual('PUT');
        expect(request?.headers?.['Content-Type']).toEqual('application/json; charset=utf-8');
        expect(request?.body).toEqual({ mydata: 'data' });

        done();
      }
    );
  });

  it('should perform a PUT request providing a path segment', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const endpoint = new Endpoint(config, '/test');

    ajaxMock.setMockResponse({ test: 'test' });

    endpoint['httpPut']('/mypath', { mydata: 'data' }).subscribe(response => {
      expect(response.status).toEqual(200);
      expect(response.response).toEqual({ test: 'test' });

      const request = ajaxMock.getLastRequest();
      expect(request?.url).toBe('http://localhost:3333/test/mypath');
      expect(request?.method).toEqual('PUT');
      expect(request?.headers?.['Content-Type']).toEqual('application/json; charset=utf-8');
      expect(request?.body).toEqual({ mydata: 'data' });

      done();
    });
  });

  it('should perform a PUT request with authentication', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const endpoint = new Endpoint(config, '/test');

    endpoint.jsonWebToken = 'testtoken';

    ajaxMock.setMockResponse({ test: 'test' });

    endpoint['httpPut']('/mypath', { mydata: 'data' }).subscribe(response => {
      expect(response.status).toEqual(200);
      expect(response.response).toEqual({ test: 'test' });

      const request = ajaxMock.getLastRequest();
      expect(request?.url).toBe('http://localhost:3333/test/mypath');
      expect(request?.method).toEqual('PUT');
      expect(request?.headers?.['Authorization']).toEqual('Bearer testtoken');
      expect(request?.headers?.['Content-Type']).toEqual('application/json; charset=utf-8');
      expect(request?.body).toEqual({ mydata: 'data' });

      done();
    });
  });

  it('should perform a PUT request with default content-type and additional header options', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const endpoint = new Endpoint(config, '/test');

    ajaxMock.setMockResponse({ test: 'test' });

    endpoint['httpPut'](undefined, { mydata: 'data' }, undefined, {
      'my-feature-toggle': 'my-awesome-feature',
    }).subscribe(response => {
      expect(response.status).toEqual(200);
      expect(response.response).toEqual({ test: 'test' });

      const request = ajaxMock.getLastRequest();
      expect(request?.url).toBe('http://localhost:3333/test');
      expect(request?.method).toEqual('PUT');
      expect(request?.headers?.['Content-Type']).toEqual('application/json; charset=utf-8');
      expect(request?.headers?.['my-feature-toggle']).toEqual('my-awesome-feature');
      expect(request?.body).toEqual({ mydata: 'data' });

      done();
    });
  });

  it('should perform a DELETE request', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const endpoint = new Endpoint(config, '/test');

    ajaxMock.setMockResponse({ test: 'test' });

    endpoint['httpDelete']().subscribe(response => {
      expect(response.status).toEqual(200);
      expect(response.response).toEqual({ test: 'test' });

      const request = ajaxMock.getLastRequest();
      expect(request?.url).toBe('http://localhost:3333/test');
      expect(request?.method).toEqual('DELETE');

      done();
    });
  });

  it('should perform an unsuccessful DELETE request', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const endpoint = new Endpoint(config, '/test');

    ajaxMock.setMockError({ msg: 'Not Found' }, 404);

    endpoint['httpDelete']().subscribe(
      response => {},
      err => {
        expect(err.status).toEqual(404);

        const request = ajaxMock.getLastRequest();
        expect(request?.url).toBe('http://localhost:3333/test');
        expect(request?.method).toEqual('DELETE');

        done();
      }
    );
  });

  it('should perform a DELETE request providing a path segment', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const endpoint = new Endpoint(config, '/test');

    ajaxMock.setMockResponse({ test: 'test' });

    endpoint['httpDelete']('/mypath').subscribe(response => {
      expect(response.status).toEqual(200);
      expect(response.response).toEqual({ test: 'test' });

      const request = ajaxMock.getLastRequest();
      expect(request?.url).toBe('http://localhost:3333/test/mypath');
      expect(request?.method).toEqual('DELETE');

      done();
    });
  });

  it('should perform a DELETE request with authentication', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const endpoint = new Endpoint(config, '/test');

    endpoint.jsonWebToken = 'testtoken';

    ajaxMock.setMockResponse({ test: 'test' });

    endpoint['httpDelete']().subscribe(response => {
      expect(response.status).toEqual(200);
      expect(response.response).toEqual({ test: 'test' });

      const request = ajaxMock.getLastRequest();
      expect(request?.url).toBe('http://localhost:3333/test');
      expect(request?.method).toEqual('DELETE');
      expect(request?.headers?.['Authorization']).toEqual('Bearer testtoken');

      done();
    });
  });

  it('should perform a DELETE request with additional header options', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const endpoint = new Endpoint(config, '/test');

    ajaxMock.setMockResponse({ test: 'test' });

    endpoint['httpDelete'](undefined, { 'my-feature-toggle': 'my-awesome-feature' }).subscribe(response => {
      expect(response.status).toEqual(200);
      expect(response.response).toEqual({ test: 'test' });

      const request = ajaxMock.getLastRequest();
      expect(request?.url).toBe('http://localhost:3333/test');
      expect(request?.method).toEqual('DELETE');
      expect(request?.headers?.['my-feature-toggle']).toEqual('my-awesome-feature');

      done();
    });
  });
});
