import { TestBed } from '@angular/core/testing';
import { AppConfigService } from '@dasch-swiss/vre/core/config';
import { initializeFaro } from '@grafana/faro-web-sdk';
import { v5 as uuidv5 } from 'uuid';
import { GrafanaFaroService } from './grafana-faro.service';

// Mock the Faro SDK
jest.mock('@grafana/faro-web-sdk', () => ({
  initializeFaro: jest.fn(),
  getWebInstrumentations: jest.fn(() => []),
}));

jest.mock('@grafana/faro-web-tracing', () => ({
  TracingInstrumentation: jest.fn(),
}));

jest.mock('@grafana/faro-transport-otlp-http', () => ({
  OtlpHttpTransport: jest.fn(),
}));

describe('GrafanaFaroService', () => {
  let service: GrafanaFaroService;
  let mockAppConfigService: any;
  let mockFaroInstance: any;

  const createMockFaroInstance = () => ({
    api: {
      pushEvent: jest.fn(),
      pushError: jest.fn(),
      setUser: jest.fn(),
    },
  });

  const createMockConfig = (faroOverrides = {}) => ({
    dspConfig: {
      release: '2024.01.01',
    },
    dspInstrumentationConfig: {
      environment: 'test',
      faro: {
        enabled: true,
        collectorUrl: 'https://faro-collector.example.com/collect/test-key',
        appName: 'dsp-app',
        sessionTracking: {
          enabled: true,
          persistent: true,
          samplingRate: 1.0,
        },
        console: {
          enabled: true,
          disabledLevels: [],
        },
        tracingCorsUrls: [],
        ...faroOverrides,
      },
    },
  });

  beforeEach(() => {
    mockFaroInstance = createMockFaroInstance();
    (initializeFaro as jest.Mock).mockReturnValue(mockFaroInstance);

    mockAppConfigService = createMockConfig() as any;

    TestBed.configureTestingModule({
      providers: [
        GrafanaFaroService,
        {
          provide: AppConfigService,
          useValue: mockAppConfigService,
        },
      ],
    });

    service = TestBed.inject(GrafanaFaroService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('setup()', () => {
    it('should initialize Faro with correct configuration', () => {
      service.setup();

      expect(initializeFaro).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://faro-collector.example.com/collect/test-key',
          app: {
            name: 'dsp-app',
            version: '2024.01.01',
            environment: 'test',
          },
        })
      );
    });

    it('should not initialize when Faro is disabled', () => {
      // Recreate service with disabled config
      mockAppConfigService = createMockConfig({ enabled: false });
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          GrafanaFaroService,
          {
            provide: AppConfigService,
            useValue: mockAppConfigService,
          },
        ],
      });
      service = TestBed.inject(GrafanaFaroService);

      service.setup();

      expect(initializeFaro).not.toHaveBeenCalled();
    });

    it('should use OTLP transport when otlp URLs are configured', () => {
      // Recreate service with OTLP config
      mockAppConfigService = createMockConfig({
        otlp: {
          logsUrl: 'http://localhost:4318/v1/logs',
          tracesUrl: 'http://localhost:4318/v1/traces',
        },
      });
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          GrafanaFaroService,
          {
            provide: AppConfigService,
            useValue: mockAppConfigService,
          },
        ],
      });
      service = TestBed.inject(GrafanaFaroService);

      service.setup();

      expect(initializeFaro).toHaveBeenCalledWith(
        expect.objectContaining({
          transports: expect.any(Array),
        })
      );
      expect(initializeFaro).toHaveBeenCalledWith(
        expect.not.objectContaining({
          url: expect.anything(),
        })
      );
    });

    it('should use cloud transport when no OTLP URLs are configured', () => {
      service.setup();

      expect(initializeFaro).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://faro-collector.example.com/collect/test-key',
        })
      );
    });

    it('should include session tracking configuration', () => {
      service.setup();

      expect(initializeFaro).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionTracking: {
            enabled: true,
            persistent: true,
            samplingRate: 1.0,
          },
        })
      );
    });

    it('should handle initialization errors gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (initializeFaro as jest.Mock).mockImplementation(() => {
        throw new Error('Initialization failed');
      });

      expect(() => service.setup()).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Faro initialization failed:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('trackEvent()', () => {
    beforeEach(() => {
      service.setup();
    });

    it('should track events with name and attributes', () => {
      service.trackEvent('auth.login', { identifierType: 'email' });

      expect(mockFaroInstance.api.pushEvent).toHaveBeenCalledWith('auth.login', { identifierType: 'email' }, 'custom');
    });

    it('should track events without attributes', () => {
      service.trackEvent('auth.logout');

      expect(mockFaroInstance.api.pushEvent).toHaveBeenCalledWith('auth.logout', undefined, 'custom');
    });

    it('should not throw when Faro is not initialized', () => {
      // Create a service that never calls setup()
      const uninitializedConfig = createMockConfig({ enabled: false });
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          GrafanaFaroService,
          {
            provide: AppConfigService,
            useValue: uninitializedConfig,
          },
        ],
      });
      const uninitializedService = TestBed.inject(GrafanaFaroService);

      expect(() => uninitializedService.trackEvent('test.event')).not.toThrow();
    });

    it('should handle pushEvent errors gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFaroInstance.api.pushEvent.mockImplementation(() => {
        throw new Error('Push failed');
      });

      expect(() => service.trackEvent('test.event')).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Faro trackEvent failed:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('trackError()', () => {
    beforeEach(() => {
      service.setup();
    });

    it('should track errors with context', () => {
      const error = new Error('Test error');
      const context = { component: 'AuthService' };

      service.trackError(error, context);

      expect(mockFaroInstance.api.pushError).toHaveBeenCalledWith(error, { context });
    });

    it('should track errors without context', () => {
      const error = new Error('Test error');

      service.trackError(error);

      expect(mockFaroInstance.api.pushError).toHaveBeenCalledWith(error, { context: undefined });
    });

    it('should not throw when Faro is not initialized', () => {
      // Create a service that never calls setup()
      const uninitializedConfig = createMockConfig({ enabled: false });
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          GrafanaFaroService,
          {
            provide: AppConfigService,
            useValue: uninitializedConfig,
          },
        ],
      });
      const uninitializedService = TestBed.inject(GrafanaFaroService);
      const error = new Error('Test error');

      expect(() => uninitializedService.trackError(error)).not.toThrow();
    });

    it('should handle pushError errors gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFaroInstance.api.pushError.mockImplementation(() => {
        throw new Error('Push failed');
      });

      const error = new Error('Test error');
      expect(() => service.trackError(error)).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Faro trackError failed:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('setUser()', () => {
    beforeEach(() => {
      service.setup();
    });

    it('should set user with hashed IRI', () => {
      const userIri = 'http://rdf.dasch.swiss/users/test-user';
      const expectedHash = uuidv5(userIri, uuidv5.URL);

      service.setUser(userIri);

      expect(mockFaroInstance.api.setUser).toHaveBeenCalledWith({
        id: expectedHash,
      });
    });

    it('should hash different IRIs to different IDs', () => {
      const userIri1 = 'http://rdf.dasch.swiss/users/user1';
      const userIri2 = 'http://rdf.dasch.swiss/users/user2';

      service.setUser(userIri1);
      const hash1 = mockFaroInstance.api.setUser.mock.calls[0][0].id;

      service.setUser(userIri2);
      const hash2 = mockFaroInstance.api.setUser.mock.calls[1][0].id;

      expect(hash1).not.toBe(hash2);
    });

    it('should produce consistent hashes for the same IRI', () => {
      const userIri = 'http://rdf.dasch.swiss/users/test-user';

      service.setUser(userIri);
      const hash1 = mockFaroInstance.api.setUser.mock.calls[0][0].id;

      service.setUser(userIri);
      const hash2 = mockFaroInstance.api.setUser.mock.calls[1][0].id;

      expect(hash1).toBe(hash2);
    });

    it('should not throw when Faro is not initialized', () => {
      // Create a service that never calls setup()
      const uninitializedConfig = createMockConfig({ enabled: false });
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          GrafanaFaroService,
          {
            provide: AppConfigService,
            useValue: uninitializedConfig,
          },
        ],
      });
      const uninitializedService = TestBed.inject(GrafanaFaroService);

      expect(() => uninitializedService.setUser('http://example.com/user')).not.toThrow();
    });

    it('should handle setUser errors gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFaroInstance.api.setUser.mockImplementation(() => {
        throw new Error('Set user failed');
      });

      expect(() => service.setUser('http://example.com/user')).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Faro setUser failed:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('removeUser()', () => {
    beforeEach(() => {
      service.setup();
    });

    it('should remove user by setting ID to undefined', () => {
      service.removeUser();

      expect(mockFaroInstance.api.setUser).toHaveBeenCalledWith({
        id: undefined,
      });
    });

    it('should not throw when Faro is not initialized', () => {
      // Create a service that never calls setup()
      const uninitializedConfig = createMockConfig({ enabled: false });
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          GrafanaFaroService,
          {
            provide: AppConfigService,
            useValue: uninitializedConfig,
          },
        ],
      });
      const uninitializedService = TestBed.inject(GrafanaFaroService);

      expect(() => uninitializedService.removeUser()).not.toThrow();
    });

    it('should handle removeUser errors gracefully', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockFaroInstance.api.setUser.mockImplementation(() => {
        throw new Error('Remove user failed');
      });

      expect(() => service.removeUser()).not.toThrow();
      expect(consoleErrorSpy).toHaveBeenCalledWith('Faro removeUser failed:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete user session lifecycle', () => {
      service.setup();

      // Login
      const userIri = 'http://rdf.dasch.swiss/users/test-user';
      service.setUser(userIri);
      service.trackEvent('auth.login', { identifierType: 'email' });

      // Activity
      service.trackEvent('resource.created', { type: 'image' });
      service.trackEvent('search.performed', { query: 'test' });

      // Logout
      service.trackEvent('auth.logout');
      service.removeUser();

      expect(mockFaroInstance.api.setUser).toHaveBeenCalledTimes(2);
      expect(mockFaroInstance.api.pushEvent).toHaveBeenCalledTimes(4);
    });

    it('should work correctly when disabled throughout lifecycle', () => {
      // Recreate service with disabled config
      mockAppConfigService = createMockConfig({ enabled: false });
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          GrafanaFaroService,
          {
            provide: AppConfigService,
            useValue: mockAppConfigService,
          },
        ],
      });
      const disabledService = TestBed.inject(GrafanaFaroService);

      disabledService.setup();

      disabledService.setUser('http://example.com/user');
      disabledService.trackEvent('test.event');
      disabledService.trackError(new Error('test'));
      disabledService.removeUser();

      expect(initializeFaro).not.toHaveBeenCalled();
      // No errors should be thrown
    });
  });

  describe('privacy and security', () => {
    beforeEach(() => {
      service.setup();
    });

    it('should never send original user IRI', () => {
      const userIri = 'http://rdf.dasch.swiss/users/sensitive-username';

      service.setUser(userIri);

      const calls = mockFaroInstance.api.setUser.mock.calls;
      calls.forEach((call: any) => {
        expect(call[0].id).not.toBe(userIri);
        expect(call[0].id).not.toContain('sensitive-username');
      });
    });

    it('should produce irreversible hashes', () => {
      const userIri = 'http://rdf.dasch.swiss/users/test-user';

      service.setUser(userIri);

      const hash = mockFaroInstance.api.setUser.mock.calls[0][0].id;
      expect(hash).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });

  describe('error resilience', () => {
    it('should continue working after initialization error', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (initializeFaro as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Init failed');
      });

      service.setup();

      // Should not throw on subsequent calls
      expect(() => service.trackEvent('test')).not.toThrow();
      expect(() => service.trackError(new Error('test'))).not.toThrow();
      expect(() => service.setUser('http://example.com/user')).not.toThrow();
      expect(() => service.removeUser()).not.toThrow();

      consoleErrorSpy.mockRestore();
    });

    it('should handle multiple setup calls gracefully', () => {
      service.setup();
      service.setup();
      service.setup();

      expect(initializeFaro).toHaveBeenCalledTimes(3);
    });
  });
});
