import { TestBed } from '@angular/core/testing';
import { AccessTokenService } from './access-token.service';

describe('AccessTokenService', () => {
  let service: AccessTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AccessTokenService],
    });
    service = TestBed.inject(AccessTokenService);
    localStorage.clear();
  });

  describe('getTokenUser', () => {
    it('should return user IRI from valid JWT token', () => {
      const mockToken = 'valid-token';
      const mockDecodedToken = { sub: 'http://rdf.dasch.swiss/users/testuser' };

      jest.spyOn(service, 'getAccessToken').mockReturnValue(mockToken);
      jest.spyOn(service, 'decodedAccessToken').mockReturnValue(mockDecodedToken);

      const result = service.getTokenUser();

      expect(result).toBe('http://rdf.dasch.swiss/users/testuser');
    });

    it('should return null when no token exists', () => {
      jest.spyOn(service, 'getAccessToken').mockReturnValue(null);

      const result = service.getTokenUser();

      expect(result).toBeNull();
    });

    it('should return null when token is invalid', () => {
      jest.spyOn(service, 'getAccessToken').mockReturnValue('invalid-token');
      jest.spyOn(service, 'decodedAccessToken').mockReturnValue(null);

      const result = service.getTokenUser();

      expect(result).toBeNull();
    });

    it('should return null when token has no sub field', () => {
      const mockToken = 'valid-token';
      const mockDecodedToken = { iat: 1616239022 };

      jest.spyOn(service, 'getAccessToken').mockReturnValue(mockToken);
      jest.spyOn(service, 'decodedAccessToken').mockReturnValue(mockDecodedToken);

      const result = service.getTokenUser();

      expect(result).toBeNull();
    });

    it('should return null when decoded token has empty sub field', () => {
      const mockToken = 'valid-token';
      const mockDecodedToken = { sub: '' };

      jest.spyOn(service, 'getAccessToken').mockReturnValue(mockToken);
      jest.spyOn(service, 'decodedAccessToken').mockReturnValue(mockDecodedToken);

      const result = service.getTokenUser();

      expect(result).toBeNull();
    });
  });
});
