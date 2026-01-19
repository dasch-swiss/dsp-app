import { TestBed } from '@angular/core/testing';
import { KnoraApiConnection } from '@dasch-swiss/dsp-js';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { JwtPayload } from 'jwt-decode';
import { of, throwError } from 'rxjs';
import { AccessTokenService } from './access-token.service';
import { AuthService } from './auth.service';
import { AutoLoginService } from './auto-login.service';

// Test constants
const TEST_CONSTANTS = {
  JWT_TOKEN:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJodHRwOi8vcmRmLmRhc2NoLnN3aXNzL3VzZXJzL3Rlc3QtdXNlciIsImV4cCI6OTk5OTk5OTk5OX0.test',
  USER_IRI: 'http://rdf.dasch.swiss/users/test-user',
  INVALID_TOKEN: 'invalid-token',
} as const;

// Helper to create a valid decoded token
function createValidDecodedToken(overrides?: Partial<JwtPayload>): JwtPayload {
  return {
    sub: TEST_CONSTANTS.USER_IRI,
    exp: 9999999999, // Far future
    iat: Date.now() / 1000,
    ...overrides,
  };
}

describe('AutoLoginService', () => {
  let service: AutoLoginService;
  let mockAccessTokenService: jest.Mocked<Partial<AccessTokenService>>;
  let mockDspApiConnection: jest.Mocked<Partial<KnoraApiConnection>>;
  let mockAuthService: jest.Mocked<Partial<AuthService>>;

  beforeEach(() => {
    mockAccessTokenService = {
      tokenExists: jest.fn(),
      isValidToken: jest.fn(),
      getAccessToken: jest.fn(),
      getTokenUser: jest.fn(),
      removeTokens: jest.fn(),
      decodeAccessToken: jest.fn(),
    };

    mockDspApiConnection = {
      v2: {
        auth: {
          checkCredentials: jest.fn(),
        },
        jsonWebToken: '',
      },
    } as unknown as jest.Mocked<KnoraApiConnection>;

    mockAuthService = {
      afterSuccessfulLogin$: jest.fn(),
      logout: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AutoLoginService,
        { provide: AccessTokenService, useValue: mockAccessTokenService },
        { provide: DspApiConnectionToken, useValue: mockDspApiConnection },
        { provide: AuthService, useValue: mockAuthService },
      ],
    });

    service = TestBed.inject(AutoLoginService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should have hasCheckedCredentials$ initialized to false', () => {
      expect(service.hasCheckedCredentials$.value).toBe(false);
    });
  });

  describe('setup() - no token scenarios', () => {
    it('should set hasCheckedCredentials$ to true when no token exists', () => {
      mockAccessTokenService.tokenExists = jest.fn().mockReturnValue(false);

      service.setup();

      expect(mockAccessTokenService.tokenExists).toHaveBeenCalled();
      expect(service.hasCheckedCredentials$.value).toBe(true);
      expect(mockAccessTokenService.isValidToken).not.toHaveBeenCalled();
    });

    it('should not call API when no token exists', () => {
      mockAccessTokenService.tokenExists = jest.fn().mockReturnValue(false);

      service.setup();

      expect(mockDspApiConnection.v2!.auth!.checkCredentials).not.toHaveBeenCalled();
      expect(mockAuthService.afterSuccessfulLogin$).not.toHaveBeenCalled();
    });
  });

  describe('setup() - invalid token scenarios', () => {
    it('should remove tokens and set hasCheckedCredentials$ when token is invalid', () => {
      mockAccessTokenService.tokenExists = jest.fn().mockReturnValue(true);
      mockAccessTokenService.isValidToken = jest.fn().mockReturnValue(false);

      service.setup();

      expect(mockAccessTokenService.isValidToken).toHaveBeenCalled();
      expect(mockAccessTokenService.removeTokens).toHaveBeenCalled();
      expect(service.hasCheckedCredentials$.value).toBe(true);
      expect(mockDspApiConnection.v2!.jsonWebToken).toBe('');
    });

    it('should not proceed with login flow when token is invalid', () => {
      mockAccessTokenService.tokenExists = jest.fn().mockReturnValue(true);
      mockAccessTokenService.isValidToken = jest.fn().mockReturnValue(false);

      service.setup();

      expect(mockDspApiConnection.v2!.auth!.checkCredentials).not.toHaveBeenCalled();
      expect(mockAuthService.afterSuccessfulLogin$).not.toHaveBeenCalled();
    });
  });

  describe('setup() - valid token scenarios', () => {
    beforeEach(() => {
      mockAccessTokenService.tokenExists = jest.fn().mockReturnValue(true);
      mockAccessTokenService.isValidToken = jest.fn().mockReturnValue(true);
      mockAccessTokenService.getAccessToken = jest.fn().mockReturnValue(TEST_CONSTANTS.JWT_TOKEN);
      mockAccessTokenService.getTokenUser = jest.fn().mockReturnValue(TEST_CONSTANTS.USER_IRI);
      mockAccessTokenService.decodeAccessToken = jest.fn().mockReturnValue(createValidDecodedToken());
    });

    it('should set JWT token in DSP connection', async () => {
      mockDspApiConnection.v2!.auth!.checkCredentials = jest.fn().mockReturnValue(of({}));
      mockAuthService.afterSuccessfulLogin$ = jest.fn().mockReturnValue(of({}));

      service.setup();
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async

      expect(mockDspApiConnection.v2!.jsonWebToken).toBe(TEST_CONSTANTS.JWT_TOKEN);
    });

    it('should check credentials validity', async () => {
      mockDspApiConnection.v2!.auth!.checkCredentials = jest.fn().mockReturnValue(of({}));
      mockAuthService.afterSuccessfulLogin$ = jest.fn().mockReturnValue(of({}));

      service.setup();
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async

      expect(mockDspApiConnection.v2!.auth!.checkCredentials).toHaveBeenCalled();
    });

    it('should call afterSuccessfulLogin$ with JWT token and user IRI when credentials are valid', async () => {
      mockDspApiConnection.v2!.auth!.checkCredentials = jest.fn().mockReturnValue(of({}));
      mockAuthService.afterSuccessfulLogin$ = jest.fn().mockReturnValue(of({}));

      service.setup();
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async

      expect(mockAuthService.afterSuccessfulLogin$).toHaveBeenCalledWith(
        TEST_CONSTANTS.JWT_TOKEN,
        TEST_CONSTANTS.USER_IRI,
        'iri'
      );
    });

    it('should set hasCheckedCredentials$ to true after successful login', async () => {
      mockDspApiConnection.v2!.auth!.checkCredentials = jest.fn().mockReturnValue(of({}));
      mockAuthService.afterSuccessfulLogin$ = jest.fn().mockReturnValue(of({}));

      service.setup();
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async

      expect(service.hasCheckedCredentials$.value).toBe(true);
    });

    it('should throw error when credentials are not valid', async () => {
      mockDspApiConnection.v2!.auth!.checkCredentials = jest
        .fn()
        .mockReturnValue(throwError(() => new Error('Invalid')));

      service.setup();
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async

      expect(mockAuthService.afterSuccessfulLogin$).not.toHaveBeenCalled();
    });

    it('should call logout on error', async () => {
      mockDspApiConnection.v2!.auth!.checkCredentials = jest
        .fn()
        .mockReturnValue(throwError(() => new Error('Invalid')));

      service.setup();
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async

      expect(mockAuthService.logout).toHaveBeenCalled();
    });

    it('should set hasCheckedCredentials$ to true even on error', async () => {
      const error = new Error('Network error');
      mockDspApiConnection.v2!.auth!.checkCredentials = jest.fn().mockReturnValue(throwError(() => error));

      service.setup();
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async

      expect(service.hasCheckedCredentials$.value).toBe(true);
    });

    it('should handle API errors gracefully', async () => {
      const error = new Error('API Error');
      mockDspApiConnection.v2!.auth!.checkCredentials = jest.fn().mockReturnValue(throwError(() => error));

      service.setup();
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async

      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(service.hasCheckedCredentials$.value).toBe(true);
    });
  });

  describe('setup() - multiple calls', () => {
    it('should warn and return early on duplicate calls', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockAccessTokenService.tokenExists = jest.fn().mockReturnValue(false);

      // First call
      service.setup();
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(mockAccessTokenService.tokenExists).toHaveBeenCalledTimes(1);

      // Second call
      service.setup();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'AutoLoginService.setup() has already been called. Ignoring duplicate call.'
      );
      expect(mockAccessTokenService.tokenExists).toHaveBeenCalledTimes(1); // Not called again

      consoleWarnSpy.mockRestore();
    });

    it('should not execute logic on subsequent calls', () => {
      const tokenExistsSpy = jest.fn().mockReturnValue(true);
      mockAccessTokenService.tokenExists = tokenExistsSpy;
      mockAccessTokenService.isValidToken = jest.fn().mockReturnValue(true);
      mockAccessTokenService.getAccessToken = jest.fn().mockReturnValue(TEST_CONSTANTS.JWT_TOKEN);
      mockAccessTokenService.getTokenUser = jest.fn().mockReturnValue(TEST_CONSTANTS.USER_IRI);
      mockDspApiConnection.v2!.auth!.checkCredentials = jest.fn().mockReturnValue(of({}));
      mockAuthService.afterSuccessfulLogin$ = jest.fn().mockReturnValue(of({}));

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // First call
      service.setup();
      const firstCallCount = tokenExistsSpy.mock.calls.length;

      // Second call
      service.setup();
      const secondCallCount = tokenExistsSpy.mock.calls.length;

      expect(secondCallCount).toBe(firstCallCount); // No additional calls
      expect(consoleWarnSpy).toHaveBeenCalled();

      consoleWarnSpy.mockRestore();
    });
  });

  describe('hasCheckedCredentials$ observable', () => {
    it('should emit true after setup with no token', async () => {
      mockAccessTokenService.tokenExists = jest.fn().mockReturnValue(false);

      service.setup();
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async

      expect(service.hasCheckedCredentials$.value).toBe(true);
    });

    it('should emit true after setup with invalid token', async () => {
      mockAccessTokenService.tokenExists = jest.fn().mockReturnValue(true);
      mockAccessTokenService.isValidToken = jest.fn().mockReturnValue(false);

      service.setup();

      expect(service.hasCheckedCredentials$.value).toBe(true);
    });

    it('should emit true after successful auto-login', async () => {
      mockAccessTokenService.tokenExists = jest.fn().mockReturnValue(true);
      mockAccessTokenService.isValidToken = jest.fn().mockReturnValue(true);
      mockAccessTokenService.getAccessToken = jest.fn().mockReturnValue(TEST_CONSTANTS.JWT_TOKEN);
      mockAccessTokenService.getTokenUser = jest.fn().mockReturnValue(TEST_CONSTANTS.USER_IRI);
      mockDspApiConnection.v2!.auth!.checkCredentials = jest.fn().mockReturnValue(of({}));
      mockAuthService.afterSuccessfulLogin$ = jest.fn().mockReturnValue(of({}));

      service.setup();
      await new Promise(resolve => setTimeout(resolve, 0)); // Wait for async

      expect(service.hasCheckedCredentials$.value).toBe(true);
    });
  });
});
