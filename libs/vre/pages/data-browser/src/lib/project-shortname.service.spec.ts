import { TestBed } from '@angular/core/testing';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { of, throwError } from 'rxjs';
import { ProjectShortnameService } from './project-shortname.service';

describe('ProjectShortnameService', () => {
  let service: ProjectShortnameService;
  let mockAdminApiService: jest.Mocked<AdminAPIApiService>;

  beforeEach(() => {
    mockAdminApiService = {
      getAdminProjectsIriProjectiri: jest.fn(),
    } as any;

    TestBed.configureTestingModule({
      providers: [ProjectShortnameService, { provide: AdminAPIApiService, useValue: mockAdminApiService }],
    });

    service = TestBed.inject(ProjectShortnameService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getProjectShortname', () => {
    it('should fetch and return project shortname', done => {
      const projectIri = 'http://example.org/project-1';
      const mockResponse = {
        project: {
          shortname: 'TEST-PROJECT',
        },
      };

      mockAdminApiService.getAdminProjectsIriProjectiri.mockReturnValue(of(mockResponse as any));

      service.getProjectShortname(projectIri).subscribe(shortname => {
        expect(shortname).toBe('TEST-PROJECT');
        expect(mockAdminApiService.getAdminProjectsIriProjectiri).toHaveBeenCalledWith(projectIri);
        expect(mockAdminApiService.getAdminProjectsIriProjectiri).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('should cache the result and not call API again for same project', done => {
      const projectIri = 'http://example.org/project-1';
      const mockResponse = {
        project: {
          shortname: 'CACHED-PROJECT',
        },
      };

      mockAdminApiService.getAdminProjectsIriProjectiri.mockReturnValue(of(mockResponse as any));

      // First call
      service.getProjectShortname(projectIri).subscribe(shortname => {
        expect(shortname).toBe('CACHED-PROJECT');

        // Second call - should use cache
        service.getProjectShortname(projectIri).subscribe(cachedShortname => {
          expect(cachedShortname).toBe('CACHED-PROJECT');
          // API should only be called once
          expect(mockAdminApiService.getAdminProjectsIriProjectiri).toHaveBeenCalledTimes(1);
          done();
        });
      });
    });

    it('should fetch different projects independently', done => {
      const projectIri1 = 'http://example.org/project-1';
      const projectIri2 = 'http://example.org/project-2';

      const mockResponse1 = { project: { shortname: 'PROJECT-1' } };
      const mockResponse2 = { project: { shortname: 'PROJECT-2' } };

      mockAdminApiService.getAdminProjectsIriProjectiri
        .mockReturnValueOnce(of(mockResponse1 as any))
        .mockReturnValueOnce(of(mockResponse2 as any));

      service.getProjectShortname(projectIri1).subscribe(shortname1 => {
        expect(shortname1).toBe('PROJECT-1');

        service.getProjectShortname(projectIri2).subscribe(shortname2 => {
          expect(shortname2).toBe('PROJECT-2');
          expect(mockAdminApiService.getAdminProjectsIriProjectiri).toHaveBeenCalledTimes(2);
          done();
        });
      });
    });

    it('should return empty string when API call fails', done => {
      const projectIri = 'http://example.org/project-error';
      const error = new Error('API Error');

      mockAdminApiService.getAdminProjectsIriProjectiri.mockReturnValue(throwError(() => error));

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      service.getProjectShortname(projectIri).subscribe(shortname => {
        expect(shortname).toBe('');
        expect(consoleWarnSpy).toHaveBeenCalledWith(`Failed to fetch project shortname for ${projectIri}:`, error);
        consoleWarnSpy.mockRestore();
        done();
      });
    });

    it('should cache error responses and not retry failed calls', done => {
      const projectIri = 'http://example.org/project-error';
      const error = new Error('API Error');

      mockAdminApiService.getAdminProjectsIriProjectiri.mockReturnValue(throwError(() => error));

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      // First call - fails
      service.getProjectShortname(projectIri).subscribe(shortname1 => {
        expect(shortname1).toBe('');

        // Second call - should return cached error (empty string) without calling API again
        service.getProjectShortname(projectIri).subscribe(shortname2 => {
          expect(shortname2).toBe('');
          // API should only be called once (error is cached)
          expect(mockAdminApiService.getAdminProjectsIriProjectiri).toHaveBeenCalledTimes(1);
          consoleWarnSpy.mockRestore();
          done();
        });
      });
    });

    it('should handle missing shortname in response', done => {
      const projectIri = 'http://example.org/project-no-shortname';
      const mockResponse = {
        project: {
          shortname: undefined,
        },
      };

      mockAdminApiService.getAdminProjectsIriProjectiri.mockReturnValue(of(mockResponse as any));

      service.getProjectShortname(projectIri).subscribe(shortname => {
        // Will be undefined cast to string, which is handled by the component template
        expect(shortname).toBeUndefined();
        done();
      });
    });

    it('should share replayed values among multiple subscribers', done => {
      const projectIri = 'http://example.org/project-shared';
      const mockResponse = {
        project: {
          shortname: 'SHARED-PROJECT',
        },
      };

      mockAdminApiService.getAdminProjectsIriProjectiri.mockReturnValue(of(mockResponse as any));

      const observable = service.getProjectShortname(projectIri);

      // Subscribe multiple times
      let subscription1Complete = false;
      let subscription2Complete = false;

      observable.subscribe(shortname => {
        expect(shortname).toBe('SHARED-PROJECT');
        subscription1Complete = true;
        if (subscription1Complete && subscription2Complete) {
          // API should only be called once even with multiple subscribers
          expect(mockAdminApiService.getAdminProjectsIriProjectiri).toHaveBeenCalledTimes(1);
          done();
        }
      });

      observable.subscribe(shortname => {
        expect(shortname).toBe('SHARED-PROJECT');
        subscription2Complete = true;
        if (subscription1Complete && subscription2Complete) {
          expect(mockAdminApiService.getAdminProjectsIriProjectiri).toHaveBeenCalledTimes(1);
          done();
        }
      });
    });
  });
});
