import { setupAjaxMock, AjaxMock } from '../../../../test/ajax-mock-helper';
import { KnoraApiConfig } from '../../../knora-api-config';
import { KnoraApiConnection } from '../../../knora-api-connection';
import { ApiResponseData } from '../../../models/api-response-data';
import { ApiResponseError } from '../../../models/api-response-error';
import { CredentialsResponse } from '../../../models/v2/authentication/credentials-response';
import { LoginResponse } from '../../../models/v2/authentication/login-response';
import { LogoutResponse } from '../../../models/v2/authentication/logout-response';

describe('Test class AuthenticationEndpoint', () => {
  let ajaxMock: AjaxMock;

  beforeEach(() => {
    ajaxMock = setupAjaxMock();
  });

  afterEach(() => {
    ajaxMock.cleanup();
  });

  it('should perform a login by username', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const knoraApiConnection = new KnoraApiConnection(config);

    ajaxMock.setMockResponse({ token: 'testtoken' });

    knoraApiConnection.v2.auth
      .login('username', 'user', 'test')
      .subscribe((response: ApiResponseData<LoginResponse>) => {
        expect(response.body.token).toEqual('testtoken');
        expect(knoraApiConnection.v2.jsonWebToken).toEqual('testtoken');

        const request = ajaxMock.getLastRequest();

        expect(request?.url).toEqual('http://localhost:3333/v2/authentication');

        expect(request?.method).toEqual('POST');

        expect(request?.body).toEqual({ username: 'user', password: 'test' });

        done();
      });
  });

  it('should perform a login by email', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const knoraApiConnection = new KnoraApiConnection(config);

    ajaxMock.setMockResponse({ token: 'testtoken' });

    knoraApiConnection.v2.auth
      .login('email', 'root@example.com', 'test')
      .subscribe((response: ApiResponseData<LoginResponse>) => {
        expect(response.body.token).toEqual('testtoken');
        expect(knoraApiConnection.v2.jsonWebToken).toEqual('testtoken');

        const request = ajaxMock.getLastRequest();

        expect(request?.url).toEqual('http://localhost:3333/v2/authentication');

        expect(request?.method).toEqual('POST');

        expect(request?.body).toEqual({ email: 'root@example.com', password: 'test' });

        done();
      });
  });

  it('should perform a login by iri', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const knoraApiConnection = new KnoraApiConnection(config);

    ajaxMock.setMockResponse({ token: 'testtoken' });

    knoraApiConnection.v2.auth
      .login('iri', 'http://rdfh.ch/users/9XBCrDV3SRa7kS1WwynB4Q', 'test')
      .subscribe((response: ApiResponseData<LoginResponse>) => {
        expect(response.body.token).toEqual('testtoken');
        expect(knoraApiConnection.v2.jsonWebToken).toEqual('testtoken');

        const request = ajaxMock.getLastRequest();

        expect(request?.url).toEqual('http://localhost:3333/v2/authentication');

        expect(request?.method).toEqual('POST');

        expect(request?.body).toEqual({ iri: 'http://rdfh.ch/users/9XBCrDV3SRa7kS1WwynB4Q', password: 'test' });

        done();
      });
  });

  it('should attempt to perform a login with invalid credentials', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const knoraApiConnection = new KnoraApiConnection(config);

    ajaxMock.setMockError(
      {
        'knora-api:error': 'org.knora.webapi.BadCredentialsException: bad credentials: not valid',
        '@context': { 'knora-api': 'http://api.knora.org/ontology/knora-api/v2#' },
      },
      401
    );

    knoraApiConnection.v2.auth.login('username', 'user', 'wrongpassword').subscribe(
      () => {},
      (err: ApiResponseError) => {
        expect(err.status).toEqual(401);
        expect(knoraApiConnection.v2.jsonWebToken).toEqual('');

        const request = ajaxMock.getLastRequest();

        expect(request?.url).toEqual('http://localhost:3333/v2/authentication');

        expect(request?.method).toEqual('POST');

        expect(request?.body).toEqual({ username: 'user', password: 'wrongpassword' });

        done();
      }
    );
  });

  it('should perform a logout', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const knoraApiConnection = new KnoraApiConnection(config);

    ajaxMock.setMockResponse({ message: 'Logout OK', status: 0 });

    knoraApiConnection.v2.auth.logout().subscribe((response: ApiResponseData<LogoutResponse>) => {
      expect(response.body.status).toEqual(0);
      expect(response.body.message).toEqual('Logout OK');
      expect(knoraApiConnection.v2.jsonWebToken).toEqual('');

      const request = ajaxMock.getLastRequest();

      expect(request?.url).toEqual('http://localhost:3333/v2/authentication');

      expect(request?.method).toEqual('DELETE');

      done();
    });
  });

  it('should check credentials for a user that is logged in', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const knoraApiConnection = new KnoraApiConnection(config);

    ajaxMock.setMockResponse({ message: 'credentials are OK' });

    knoraApiConnection.v2.auth.checkCredentials().subscribe((response: ApiResponseData<CredentialsResponse>) => {
      expect(response.body.message).toEqual('credentials are OK');

      const request = ajaxMock.getLastRequest();

      expect(request?.url).toEqual('http://localhost:3333/v2/authentication');

      expect(request?.method).toEqual('GET');

      done();
    });
  });

  it('should check credentials for a user that is not logged in', done => {
    const config = new KnoraApiConfig('http', 'localhost', 3333);

    const knoraApiConnection = new KnoraApiConnection(config);

    ajaxMock.setMockError(
      {
        'knora-api:error': 'org.knora.webapi.BadCredentialsException: bad credentials: none found',
        '@context': { 'knora-api': 'http://api.knora.org/ontology/knora-api/v2#' },
      },
      401
    );

    knoraApiConnection.v2.auth.checkCredentials().subscribe(
      () => {},
      (err: ApiResponseError) => {
        expect(err.status).toEqual(401);

        const request = ajaxMock.getLastRequest();

        expect(request?.url).toEqual('http://localhost:3333/v2/authentication');

        expect(request?.method).toEqual('GET');

        done();
      }
    );
  });
});
