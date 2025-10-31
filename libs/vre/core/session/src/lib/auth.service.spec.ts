import { TestBed } from '@angular/core/testing';
import { ApiResponseError, KnoraApiConnection, ReadUser } from '@dasch-swiss/dsp-js';
import { PendoAnalyticsService } from '@dasch-swiss/vre/3rd-party-services/analytics';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { UserFeedbackError } from '@dasch-swiss/vre/core/error-handler';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of, throwError } from 'rxjs';
import { AccessTokenService } from './access-token.service';
import { AuthService } from './auth.service';
import { UserService } from './user.service';

// Test constants
const TEST_CONSTANTS = {
  EMAIL: 'test@example.com',
  USERNAME: 'testuser',
  PASSWORD: 'password',
  WRONG_PASSWORD: 'wrongpassword',
  JWT_TOKEN: 'mock-jwt-token',
  USER_LANG: 'en',
  USER_IRI: 'http://rdf.dasch.swiss/users/test-user',
  INVALID_CREDENTIALS_KEY: 'core.auth.invalidCredentials',
  INVALID_CREDENTIALS_MESSAGE: 'Invalid credentials',
} as const;

// Test data factory
function createMockUser(overrides?: Partial<ReadUser>): ReadUser {
  return {
    id: TEST_CONSTANTS.USER_IRI,
    username: TEST_CONSTANTS.USERNAME,
    email: TEST_CONSTANTS.EMAIL,
    givenName: 'Test',
    familyName: 'User',
    status: true,
    lang: TEST_CONSTANTS.USER_LANG,
    password: '',
    projects: [],
    groups: [],
    permissions: {
      groupsPerProject: {},
    },
    ...overrides,
  } as ReadUser;
}

// Helper for window.location mocking
function mockWindowReload(): { reloadMock: jest.Mock; restore: () => void } {
  const originalLocation = window.location;
  const reloadMock = jest.fn();

  Object.defineProperty(window, 'location', {
    writable: true,
    value: { ...originalLocation, reload: reloadMock },
  });

  return {
    reloadMock,
    restore: () => {
      Object.defineProperty(window, 'location', {
        writable: true,
        value: originalLocation,
      });
    },
  };
}

// Helper for creating ApiResponseError
function createApiResponseError(status: number, message = 'API Error'): ApiResponseError {
  const error = Object.create(ApiResponseError.prototype);
  error.status = status;
  error.message = message;
  return error;
}

describe('AuthService', () => {
  let service: AuthService;
  let mockUserService: jest.Mocked<Partial<UserService>>;
  let mockTranslateService: jest.Mocked<Partial<TranslateService>>;
  let mockAccessTokenService: jest.Mocked<Partial<AccessTokenService>>;
  let mockDspApiConnection: jest.Mocked<Partial<KnoraApiConnection>>;
  let mockLocalizationService: jest.Mocked<Partial<LocalizationService>>;
  let mockPendoAnalytics: jest.Mocked<Partial<PendoAnalyticsService>>;

  const mockUser = createMockUser();

  beforeEach(() => {
    mockUserService = {
      loadUser: jest.fn(),
      logout: jest.fn(),
    };

    mockTranslateService = {
      instant: jest.fn(),
    };

    mockAccessTokenService = {
      storeToken: jest.fn(),
      removeTokens: jest.fn(),
      getAccessToken: jest.fn(),
      decodeAccessToken: jest.fn(),
    };

    mockDspApiConnection = {
      v2: {
        auth: {
          checkCredentials: jest.fn(),
          login: jest.fn(),
          logout: jest.fn(),
        },
        jsonWebToken: '',
      },
    } as unknown as jest.Mocked<KnoraApiConnection>;

    mockLocalizationService = {
      setLanguage: jest.fn(),
    };

    mockPendoAnalytics = {
      setActiveUser: jest.fn(),
      removeActiveUser: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: TranslateService, useValue: mockTranslateService },
        { provide: AccessTokenService, useValue: mockAccessTokenService },
        { provide: DspApiConnectionToken, useValue: mockDspApiConnection },
        { provide: LocalizationService, useValue: mockLocalizationService },
        { provide: PendoAnalyticsService, useValue: mockPendoAnalytics },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  describe('isCredentialsValid$()', () => {
    it('should return true when credentials are valid', async () => {
      mockDspApiConnection.v2!.auth!.checkCredentials = jest.fn().mockReturnValue(of({}));

      const result = await firstValueFrom(service.isCredentialsValid$());

      expect(result).toBe(true);
      expect(mockDspApiConnection.v2!.auth!.checkCredentials).toHaveBeenCalled();
    });

    it('should return false when credentials check fails', async () => {
      mockDspApiConnection.v2!.auth!.checkCredentials = jest
        .fn()
        .mockReturnValue(throwError(() => new Error('Invalid credentials')));

      const result = await firstValueFrom(service.isCredentialsValid$());

      expect(result).toBe(false);
    });
  });

  describe('afterSuccessfulLogin$()', () => {
    it('should load user and set language preferences', async () => {
      mockUserService.loadUser = jest.fn().mockReturnValue(of(mockUser));

      const user = await firstValueFrom(service.afterSuccessfulLogin$(TEST_CONSTANTS.EMAIL, 'email'));

      expect(mockUserService.loadUser).toHaveBeenCalledWith(TEST_CONSTANTS.EMAIL, 'email');
      expect(mockLocalizationService.setLanguage).toHaveBeenCalledWith(TEST_CONSTANTS.USER_LANG);
      expect(user).toEqual(mockUser);
    });

    it('should call Pendo analytics with user ID', async () => {
      mockUserService.loadUser = jest.fn().mockReturnValue(of(mockUser));

      await firstValueFrom(service.afterSuccessfulLogin$(TEST_CONSTANTS.EMAIL, 'email'));

      expect(mockPendoAnalytics.setActiveUser).toHaveBeenCalledWith(TEST_CONSTANTS.USER_IRI);
    });

    it('should propagate user service errors', async () => {
      const error = new Error('User load failed');
      mockUserService.loadUser = jest.fn().mockReturnValue(throwError(() => error));

      await expect(firstValueFrom(service.afterSuccessfulLogin$(TEST_CONSTANTS.USERNAME, 'username'))).rejects.toBe(
        error
      );
      expect(mockUserService.loadUser).toHaveBeenCalledWith(TEST_CONSTANTS.USERNAME, 'username');
    });

    it('should handle iri identifier type', async () => {
      mockUserService.loadUser = jest.fn().mockReturnValue(of(mockUser));

      const user = await firstValueFrom(service.afterSuccessfulLogin$(TEST_CONSTANTS.USER_IRI, 'iri'));

      expect(mockUserService.loadUser).toHaveBeenCalledWith(TEST_CONSTANTS.USER_IRI, 'iri');
      expect(mockLocalizationService.setLanguage).toHaveBeenCalledWith(TEST_CONSTANTS.USER_LANG);
      expect(user).toEqual(mockUser);
    });

    it('should set language from user preferences', async () => {
      const germanUser = createMockUser({ lang: 'de' });
      mockUserService.loadUser = jest.fn().mockReturnValue(of(germanUser));

      await firstValueFrom(service.afterSuccessfulLogin$(TEST_CONSTANTS.EMAIL, 'email'));

      expect(mockLocalizationService.setLanguage).toHaveBeenCalledWith('de');
    });
  });

  describe('login$()', () => {
    const mockLoginResponse = {
      body: { token: TEST_CONSTANTS.JWT_TOKEN },
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockDspApiConnection.v2!.auth!.login = jest.fn().mockReturnValue(of(mockLoginResponse));
      mockUserService.loadUser = jest.fn().mockReturnValue(of(mockUser));
    });

    it('should identify email by @ presence', async () => {
      await firstValueFrom(service.login$(TEST_CONSTANTS.EMAIL, TEST_CONSTANTS.PASSWORD));

      expect(mockDspApiConnection.v2!.auth!.login).toHaveBeenCalledWith(
        'email',
        TEST_CONSTANTS.EMAIL,
        TEST_CONSTANTS.PASSWORD
      );
    });

    it('should identify username when no @ present', async () => {
      await firstValueFrom(service.login$(TEST_CONSTANTS.USERNAME, TEST_CONSTANTS.PASSWORD));

      expect(mockDspApiConnection.v2!.auth!.login).toHaveBeenCalledWith(
        'username',
        TEST_CONSTANTS.USERNAME,
        TEST_CONSTANTS.PASSWORD
      );
    });

    it('should handle identifier with multiple @ symbols as email', async () => {
      const complexEmail = 'test@@example.com';
      await firstValueFrom(service.login$(complexEmail, TEST_CONSTANTS.PASSWORD));

      expect(mockDspApiConnection.v2!.auth!.login).toHaveBeenCalledWith('email', complexEmail, TEST_CONSTANTS.PASSWORD);
    });

    it('should authenticate via DSP API with correct credentials', async () => {
      await firstValueFrom(service.login$(TEST_CONSTANTS.EMAIL, 'mypassword'));

      expect(mockDspApiConnection.v2!.auth!.login).toHaveBeenCalledWith('email', TEST_CONSTANTS.EMAIL, 'mypassword');
    });

    it('should store token and update JWT connection', async () => {
      await firstValueFrom(service.login$(TEST_CONSTANTS.EMAIL, TEST_CONSTANTS.PASSWORD));

      expect(mockAccessTokenService.storeToken).toHaveBeenCalledWith(TEST_CONSTANTS.JWT_TOKEN);
      expect(mockDspApiConnection.v2!.jsonWebToken).toBe(TEST_CONSTANTS.JWT_TOKEN);
    });

    it('should complete authentication via afterSuccessfulLogin$', async () => {
      const afterSuccessfulLoginSpy = jest.spyOn(service, 'afterSuccessfulLogin$');

      await firstValueFrom(service.login$(TEST_CONSTANTS.EMAIL, TEST_CONSTANTS.PASSWORD));

      expect(afterSuccessfulLoginSpy).toHaveBeenCalledWith(TEST_CONSTANTS.EMAIL, 'email');
    });

    it('should throw UserFeedbackError for 400 errors', async () => {
      const apiError = createApiResponseError(400, 'Bad Request');
      mockDspApiConnection.v2!.auth!.login = jest.fn().mockReturnValue(throwError(() => apiError));
      mockTranslateService.instant = jest.fn().mockReturnValue(TEST_CONSTANTS.INVALID_CREDENTIALS_MESSAGE);

      await expect(
        firstValueFrom(service.login$(TEST_CONSTANTS.EMAIL, TEST_CONSTANTS.WRONG_PASSWORD))
      ).rejects.toBeInstanceOf(UserFeedbackError);

      expect(mockTranslateService.instant).toHaveBeenCalledWith(TEST_CONSTANTS.INVALID_CREDENTIALS_KEY);
    });

    it('should throw UserFeedbackError for 401 errors', async () => {
      const apiError = createApiResponseError(401, 'Unauthorized');
      mockDspApiConnection.v2!.auth!.login = jest.fn().mockReturnValue(throwError(() => apiError));
      mockTranslateService.instant = jest.fn().mockReturnValue(TEST_CONSTANTS.INVALID_CREDENTIALS_MESSAGE);

      await expect(
        firstValueFrom(service.login$(TEST_CONSTANTS.EMAIL, TEST_CONSTANTS.WRONG_PASSWORD))
      ).rejects.toBeInstanceOf(UserFeedbackError);

      expect(mockTranslateService.instant).toHaveBeenCalledWith(TEST_CONSTANTS.INVALID_CREDENTIALS_KEY);
    });

    it('should propagate non-authentication errors', async () => {
      const networkError = new Error('Network error');
      mockDspApiConnection.v2!.auth!.login = jest.fn().mockReturnValue(throwError(() => networkError));

      await expect(firstValueFrom(service.login$(TEST_CONSTANTS.EMAIL, TEST_CONSTANTS.PASSWORD))).rejects.toBe(
        networkError
      );
    });

    it('should return user data after successful login', async () => {
      const user = await firstValueFrom(service.login$(TEST_CONSTANTS.EMAIL, TEST_CONSTANTS.PASSWORD));

      expect(user).toEqual(mockUser);
    });
  });

  describe('afterLogout()', () => {
    it('should clear user state and remove tokens', () => {
      service.afterLogout();

      expect(mockUserService.logout).toHaveBeenCalled();
      expect(mockAccessTokenService.removeTokens).toHaveBeenCalled();
    });

    it('should clear JWT token', () => {
      mockDspApiConnection.v2!.jsonWebToken = 'some-token';

      service.afterLogout();

      expect(mockDspApiConnection.v2!.jsonWebToken).toBe('');
    });

    it('should call Pendo analytics to remove active user', () => {
      service.afterLogout();

      expect(mockPendoAnalytics.removeActiveUser).toHaveBeenCalled();
    });
  });

  describe('logout()', () => {
    it('should call API logout, execute afterLogout, and reload page', () => {
      const { reloadMock, restore } = mockWindowReload();
      mockDspApiConnection.v2!.auth!.logout = jest.fn().mockReturnValue(of({}));
      const afterLogoutSpy = jest.spyOn(service, 'afterLogout');

      service.logout();

      expect(mockDspApiConnection.v2!.auth!.logout).toHaveBeenCalled();
      expect(afterLogoutSpy).toHaveBeenCalled();
      expect(reloadMock).toHaveBeenCalled();
      restore();
    });

    it('should handle API logout errors gracefully', () => {
      const { reloadMock, restore } = mockWindowReload();
      const logoutError = new Error('Logout failed');
      mockDspApiConnection.v2!.auth!.logout = jest.fn().mockReturnValue(throwError(() => logoutError));
      const afterLogoutSpy = jest.spyOn(service, 'afterLogout');

      service.logout();

      expect(mockDspApiConnection.v2!.auth!.logout).toHaveBeenCalled();
      expect(afterLogoutSpy).toHaveBeenCalled();
      expect(reloadMock).toHaveBeenCalled();
      restore();
    });
  });
});
