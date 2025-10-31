import { TestBed } from '@angular/core/testing';
import { DspInstrumentationToken } from '@dasch-swiss/vre/core/config';
import { v5 as uuidv5 } from 'uuid';
import { PendoAnalyticsService } from './pendo-analytics.service';

describe('PendoAnalyticsService', () => {
  let service: PendoAnalyticsService;
  let mockPendo: any;

  beforeEach(() => {
    // Mock the global pendo object
    mockPendo = {
      initialize: jest.fn(),
    };
    (global as any).pendo = mockPendo;

    TestBed.configureTestingModule({
      providers: [PendoAnalyticsService, { provide: DspInstrumentationToken, useValue: { environment: 'test' } }],
    });

    service = TestBed.inject(PendoAnalyticsService);
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

  describe('setActiveUser', () => {
    it('should not initialize Pendo in non-production environment', () => {
      const userIri = 'http://rdf.dasch.swiss/users/testuser';

      service.setActiveUser(userIri);

      expect(mockPendo.initialize).not.toHaveBeenCalled();
    });

    it('should initialize Pendo with hashed user ID in production environment', () => {
      // Create a new service instance with prod environment
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [PendoAnalyticsService, { provide: DspInstrumentationToken, useValue: { environment: 'prod' } }],
      });
      const prodService = TestBed.inject(PendoAnalyticsService);
      const userIri = 'http://rdf.dasch.swiss/users/testuser';
      const expectedHashedId = uuidv5(userIri, uuidv5.URL);

      prodService.setActiveUser(userIri);

      expect(mockPendo.initialize).toHaveBeenCalledWith({
        visitor: {
          id: expectedHashedId,
          environment: 'prod',
        },
        account: {
          id: expectedHashedId,
          environment: 'prod',
        },
      });
    });
  });

  describe('removeActiveUser', () => {
    it('should not call Pendo in non-production environment', () => {
      service.removeActiveUser();

      expect(mockPendo.initialize).not.toHaveBeenCalled();
    });

    it('should initialize Pendo with default visitor ID in production environment', () => {
      // Create a new service instance with prod environment
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [PendoAnalyticsService, { provide: DspInstrumentationToken, useValue: { environment: 'prod' } }],
      });
      const prodService = TestBed.inject(PendoAnalyticsService);

      prodService.removeActiveUser();

      expect(mockPendo.initialize).toHaveBeenCalledWith({
        visitor: {
          id: 'VISITOR-UNIQUE-ID',
          environment: 'prod',
        },
        account: {
          id: 'ACCOUNT-UNIQUE-ID',
          environment: 'prod',
        },
      });
    });
  });
});
