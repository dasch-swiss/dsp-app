import { HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AppConfigService } from '@dasch-swiss/vre/core/config';
import { AccessTokenService, UserService } from '@dasch-swiss/vre/core/session';
import { RepresentationService } from './representation.service';

// Stands in for the app's iiifWithCredentialsInterceptorFn, which adds cookies to every IIIF request.
const withCredentialsInterceptor: HttpInterceptorFn = (req, next) => next(req.clone({ withCredentials: true }));

describe('RepresentationService', () => {
  let service: RepresentationService;
  let httpTesting: HttpTestingController;
  let accessToken: string | undefined;

  beforeEach(() => {
    accessToken = undefined;

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([withCredentialsInterceptor])),
        provideHttpClientTesting(),
        { provide: AppConfigService, useValue: {} },
        { provide: UserService, useValue: {} },
        { provide: ProjectApiService, useValue: {} },
        { provide: AccessTokenService, useValue: { getAccessToken: () => accessToken } },
      ],
    });

    service = TestBed.inject(RepresentationService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  describe('getIiifImageInfo', () => {
    const infoJsonUrl = 'https://iiif.example.org/0001/image.jpx/info.json';

    it('requests info.json without cookies, since Sipi answers it with a wildcard CORS origin', () => {
      service.getIiifImageInfo('https://iiif.example.org/0001', 'image.jpx').subscribe();

      const req = httpTesting.expectOne(infoJsonUrl);
      expect(req.request.withCredentials).toBe(false);
      req.flush({ width: 128, height: 97 });
    });

    it('authenticates with the Bearer token when the user is logged in', () => {
      accessToken = 'token';

      service.getIiifImageInfo('https://iiif.example.org/0001', 'image.jpx').subscribe();

      const req = httpTesting.expectOne(infoJsonUrl);
      expect(req.request.headers.get('Authorization')).toBe('Bearer token');
      req.flush({ width: 128, height: 97 });
    });
  });
});
