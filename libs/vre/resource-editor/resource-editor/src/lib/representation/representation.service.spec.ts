import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AppConfigService } from '@dasch-swiss/vre/core/config';
import { AccessTokenService, UserService } from '@dasch-swiss/vre/core/session';
import { RepresentationService } from './representation.service';

describe('RepresentationService', () => {
  const svgUrl = 'http://sipi.example.com/0001/file.svg/file';
  let service: RepresentationService;
  let httpMock: HttpTestingController;
  let getAccessToken: jest.Mock;

  beforeEach(() => {
    getAccessToken = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AccessTokenService, useValue: { getAccessToken } },
        { provide: AppConfigService, useValue: {} },
        { provide: UserService, useValue: {} },
        { provide: ProjectApiService, useValue: {} },
      ],
    });
    service = TestBed.inject(RepresentationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  describe('getSvgContent', () => {
    it('sends the access token so Sipi serves non-public SVGs', () => {
      getAccessToken.mockReturnValue('jwt-token');

      service.getSvgContent(svgUrl).subscribe();

      const req = httpMock.expectOne(svgUrl);
      expect(req.request.headers.get('Authorization')).toBe('Bearer jwt-token');
      expect(req.request.responseType).toBe('text');
      req.flush('<svg/>');
    });

    it('sends no Authorization header when logged out', () => {
      getAccessToken.mockReturnValue(null);

      service.getSvgContent(svgUrl).subscribe();

      const req = httpMock.expectOne(svgUrl);
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush('<svg/>');
    });
  });
});
