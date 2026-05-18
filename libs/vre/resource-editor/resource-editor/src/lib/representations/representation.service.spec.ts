import { HttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AppConfigService } from '@dasch-swiss/vre/core/config';
import { AccessTokenService, UserService } from '@dasch-swiss/vre/core/session';
import { PLACEHOLDER_IRI } from '@dasch-swiss/vre/shared/app-common';
import { EMPTY, isObservable, of } from 'rxjs';
import { RepresentationService } from './representation.service';

describe('RepresentationService placeholder guards', () => {
  let service: RepresentationService;
  let httpMock: jest.Mocked<Partial<HttpClient>>;
  let projectApiMock: jest.Mocked<Partial<ProjectApiService>>;

  const placeholderFileValue = {
    filename: PLACEHOLDER_IRI,
    fileUrl: PLACEHOLDER_IRI,
    hasPermissions: 'CR knora-admin:ProjectMember',
  } as any;

  const realFileValue = {
    filename: 'asset-id.jp2',
    fileUrl: 'http://sipi/0001/asset-id.jp2/full/full/0/default.jp2',
    hasPermissions: 'CR knora-admin:ProjectMember',
  } as any;

  const parentResource = { attachedToProject: 'http://rdfh.ch/projects/0001' } as any;

  beforeEach(() => {
    httpMock = { get: jest.fn() };
    projectApiMock = { get: jest.fn().mockReturnValue(of({ project: { shortcode: '0001' } })) };

    TestBed.configureTestingModule({
      providers: [
        RepresentationService,
        { provide: HttpClient, useValue: httpMock },
        { provide: AppConfigService, useValue: { dspIngestConfig: { url: 'http://ingest' } } },
        { provide: UserService, useValue: { currentUser: null } },
        { provide: AccessTokenService, useValue: { getAccessToken: () => null } },
        { provide: ProjectApiService, useValue: projectApiMock },
      ],
    });

    service = TestBed.inject(RepresentationService);
  });

  describe('getFileInfo', () => {
    it('returns EMPTY and skips HTTP when url is the sentinel', done => {
      const result = service.getFileInfo(PLACEHOLDER_IRI);
      expect(isObservable(result)).toBe(true);

      let emitted = false;
      result.subscribe({
        next: () => {
          emitted = true;
        },
        complete: () => {
          expect(emitted).toBe(false);
          expect(httpMock.get).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('issues an HTTP GET for a real url', () => {
      httpMock.get = jest.fn().mockReturnValue(of({ originalFilename: 'x.jp2' }));
      service.getFileInfo('http://sipi/0001/asset-id.jp2/full/full/0/default.jp2').subscribe();
      expect(httpMock.get).toHaveBeenCalled();
    });
  });

  describe('getIngestUrl', () => {
    it('returns EMPTY and skips project lookup when fileValue is placeholder', done => {
      service.getIngestUrl(placeholderFileValue, parentResource).subscribe({
        complete: () => {
          expect(projectApiMock.get).not.toHaveBeenCalled();
          done();
        },
      });
    });

    it('hits projectApi for a real fileValue', done => {
      service.getIngestUrl(realFileValue, parentResource).subscribe(url => {
        expect(projectApiMock.get).toHaveBeenCalledWith(parentResource.attachedToProject);
        expect(url).toContain('http://ingest/projects/0001/assets/asset-id');
        done();
      });
    });
  });

  describe('downloadProjectFile', () => {
    it('is a no-op when fileValue is placeholder', () => {
      service.downloadProjectFile(placeholderFileValue, parentResource);
      expect(projectApiMock.get).not.toHaveBeenCalled();
    });
  });
});
