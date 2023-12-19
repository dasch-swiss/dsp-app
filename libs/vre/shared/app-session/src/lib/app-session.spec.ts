import { TestBed } from '@angular/core/testing';
import { ApiResponseData, CredentialsResponse, ReadUser, UserResponse } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/shared/app-config';
import { of } from 'rxjs';
import { AjaxResponse } from 'rxjs/ajax';
import { SessionService } from './app-session';

describe('SessionService', () => {
  let service: SessionService;
  let mockApiConnection: any;
  const mockSession = {
    id: 12345, // expired session id
    user: {
      name: 'test',
      jwt: 'jwt',
      lang: 'en',
      sysAdmin: false,
      projectAdmin: [],
    },
  };

  beforeEach(() => {
    mockApiConnection = {
      admin: {
        usersEndpoint: {
          getUser: jest.fn(),
        },
      },
      v2: {
        jsonWebToken: '',
        auth: {
          checkCredentials: jest.fn(),
        },
      },
    };

    TestBed.configureTestingModule({
      providers: [
        SessionService,
        {
          provide: DspApiConnectionToken,
          useValue: mockApiConnection,
        },
      ],
    });

    service = TestBed.inject(SessionService);
  });

  afterEach(() => {
    localStorage.removeItem('session');
    jest.clearAllMocks();
  });

  describe('getSession method', () => {
    it('should get session from localstorage', () => {
      localStorage.setItem('session', JSON.stringify(mockSession));
      const session = service.getSession();
      expect(session).toEqual(mockSession);
    });

    it('should return null if no session in localstorage', () => {
      const session = service.getSession();
      expect(session).toBeNull();
    });
  });

  describe('setSession method', () => {
    it('should set session in localstorage', done => {
      const jwt = 'jwt';
      const identifier = 'test';
      const type = 'username';

      const user = new ReadUser();
      user.id = '12345';
      user.username = 'test';

      const userRes = new UserResponse();
      userRes.user = user;

      const responseData = ApiResponseData.fromAjaxResponse(new AjaxResponse({} as any, {} as any, {}));
      responseData.body = userRes;

      mockApiConnection.admin.usersEndpoint.getUser.mockReturnValue(of(responseData));

      service.setSession(jwt, identifier, type).subscribe(() => {
        const session = JSON.parse(localStorage.getItem('session') || '');
        expect(session.user.name).toEqual(identifier);
        expect(session.user.jwt).toEqual(jwt);
        done();
      });
    });
  });

  describe('destroySession method', () => {
    it('should destroy the session', () => {
      localStorage.setItem('session', JSON.stringify(mockSession));
      let session = service.getSession();
      expect(session).toEqual(mockSession);

      service.destroySession();
      session = service.getSession();
      expect(session).toBeNull();
    });
  });

  describe('isSessionValid method', () => {
    it('should return false if there is no session', () => {
      service.isSessionValid().subscribe(isValid => {
        expect(isValid).toBeFalsy();
      });
    });

    it('should return true if session is still valid', () => {
      // mock Date.now()
      jest.spyOn(Date, 'now').mockImplementation(() => Date.parse('2023-06-16'));

      // create a copy of mockSession
      const session = { ...mockSession };

      // change the id to a more realistic number.
      // it's a timestamp in the actual code, set by the _setTimestamp() method
      session.id = 1700000000;

      localStorage.setItem('session', JSON.stringify(session));
      service.isSessionValid().subscribe(isValid => {
        expect(isValid).toBeTruthy();
      });
    });

    it('should return false if session has expired', () => {
      const credentialsRes = new CredentialsResponse();
      credentialsRes.message = 'valid';

      const responseData = ApiResponseData.fromAjaxResponse(new AjaxResponse({} as any, {} as any, {}));
      responseData.body = credentialsRes;

      mockApiConnection.v2.auth.checkCredentials.mockReturnValue(of(responseData));

      // mock Date.now()
      jest.spyOn(Date, 'now').mockImplementation(() => Date.parse('2023-06-16'));
      localStorage.setItem('session', JSON.stringify(mockSession));

      service.isSessionValid().subscribe(isValid => {
        expect(isValid).toBeFalsy();
        expect(mockApiConnection.v2.auth.checkCredentials).toHaveBeenCalledTimes(1);
      });
    });
  });
});
