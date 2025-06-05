import { TestBed } from '@angular/core/testing';
import { AccessTokenService } from './access-token.service';

describe('AccessTokenService', () => {
  let service: AccessTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccessTokenService);
    localStorage.clear();
  });

  describe('getTokenUser', () => {
    it('should return user IRI from valid JWT token', () => {
      const mockToken = 'valid-token';
      const mockDecodedToken = { sub: 'http://rdf.dasch.swiss/users/testuser' };

      spyOn(service, 'getAccessToken').and.returnValue(mockToken);
      spyOn(service, 'decodedAccessToken').and.returnValue(mockDecodedToken);

      const result = service.getTokenUser();

      expect(result).toBe('http://rdf.dasch.swiss/users/testuser');
    });

    it('should return null when no token exists', () => {
      spyOn(service, 'getAccessToken').and.returnValue(null);

      const result = service.getTokenUser();

      expect(result).toBeNull();
    });

    it('should return null when token is invalid', () => {
      spyOn(service, 'getAccessToken').and.returnValue('invalid-token');
      spyOn(service, 'decodedAccessToken').and.returnValue(null);

      const result = service.getTokenUser();

      expect(result).toBeNull();
    });

    it('should return null when token has no sub field', () => {
      const mockToken = 'valid-token';
      const mockDecodedToken = { iat: 1616239022 };

      spyOn(service, 'getAccessToken').and.returnValue(mockToken);
      spyOn(service, 'decodedAccessToken').and.returnValue(mockDecodedToken);

      const result = service.getTokenUser();

      expect(result).toBeNull();
    });

    it('should return null when decoded token has empty sub field', () => {
      const mockToken = 'valid-token';
      const mockDecodedToken = { sub: '' };

      spyOn(service, 'getAccessToken').and.returnValue(mockToken);
      spyOn(service, 'decodedAccessToken').and.returnValue(mockDecodedToken);

      const result = service.getTokenUser();

      expect(result).toBeNull();
    });
  });
});
