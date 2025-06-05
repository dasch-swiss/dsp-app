import { TestBed } from '@angular/core/testing';
import { DspInstrumentationToken } from '@dasch-swiss/vre/core/config';
import { AuthService, AccessTokenService } from '@dasch-swiss/vre/core/session';
import { of } from 'rxjs';
import { v5 as uuidv5 } from 'uuid';
import { PendoAnalyticsService } from './pendo-analytics.service';

describe('PendoAnalyticsService', () => {
  let service: PendoAnalyticsService;
  let mockAuthService: any;
  let mockAccessTokenService: any;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthService', ['isCredentialsValid$']);
    const accessTokenSpy = jasmine.createSpyObj('AccessTokenService', ['getTokenUser']);

    TestBed.configureTestingModule({
      providers: [
        PendoAnalyticsService,
        { provide: DspInstrumentationToken, useValue: { environment: 'test' } },
        { provide: AuthService, useValue: authSpy },
        { provide: AccessTokenService, useValue: accessTokenSpy },
      ],
    });

    service = TestBed.inject(PendoAnalyticsService);
    mockAuthService = TestBed.inject(AuthService);
    mockAccessTokenService = TestBed.inject(AccessTokenService);
  });

  describe('hashUserIri', () => {
    it('should generate consistent UUID v5 for same user IRI', () => {
      const userIri = 'http://rdf.dasch.swiss/users/testuser';

      const result1 = (service as any).hashUserIri(userIri);
      const result2 = (service as any).hashUserIri(userIri);

      expect(result1).toBe(result2);
      expect(result1).toBe(uuidv5(userIri, uuidv5.URL));
    });

    it('should generate different UUIDs for different user IRIs', () => {
      const userIri1 = 'http://rdf.dasch.swiss/users/user1';
      const userIri2 = 'http://rdf.dasch.swiss/users/user2';

      const result1 = (service as any).hashUserIri(userIri1);
      const result2 = (service as any).hashUserIri(userIri2);

      expect(result1).not.toBe(result2);
    });

    it('should use uuidv5.URL namespace', () => {
      const userIri = 'http://rdf.dasch.swiss/users/testuser';
      const expected = uuidv5(userIri, uuidv5.URL);

      const result = (service as any).hashUserIri(userIri);

      expect(result).toBe(expected);
    });

    it('should return valid UUID format', () => {
      const userIri = 'http://rdf.dasch.swiss/users/testuser';
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      const result = (service as any).hashUserIri(userIri);

      expect(result).toMatch(uuidRegex);
    });
  });

  describe('setup', () => {
    it('should not initialize Pendo in non-production environment', () => {
      const testService = TestBed.inject(PendoAnalyticsService);
      mockAuthService.isCredentialsValid$.and.returnValue(of(true));

      testService.setup();

      expect(mockAuthService.isCredentialsValid$).not.toHaveBeenCalled();
    });
  });
});
