import { TestBed } from '@angular/core/testing';
import { ReadProject } from '@dasch-swiss/dsp-js';
import { ProjectApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { of, ReplaySubject, throwError } from 'rxjs';
import { PaginatedApiService } from './paginated-api.service';
import { ProjectDataRightsService } from './project-data-rights.service';

describe('ProjectDataRightsService', () => {
  let service: ProjectDataRightsService;
  let projectApi: { get: jest.Mock };
  let paginatedApi: { getLicenses: jest.Mock };

  const makeProject = (overrides: Partial<ReadProject> = {}): ReadProject =>
    ({
      id: 'http://rdfh.ch/projects/0001',
      shortcode: '0001',
      shortname: 'test',
      longname: 'Test Project',
      dataLicense: 'http://rdfh.ch/licenses/cc-by-4.0',
      dataCopyrightHolder: 'University of Basel',
      dataAuthorship: ['Author A'],
      ...overrides,
    }) as ReadProject;

  const licenseCatalog = [
    {
      id: 'http://rdfh.ch/licenses/cc-by-4.0',
      labelEn: 'CC BY 4.0',
      uri: 'https://creativecommons.org/licenses/by/4.0/',
    },
  ];

  beforeEach(() => {
    projectApi = { get: jest.fn() };
    paginatedApi = { getLicenses: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: ProjectApiService, useValue: projectApi },
        { provide: PaginatedApiService, useValue: paginatedApi },
      ],
    });

    service = TestBed.inject(ProjectDataRightsService);
  });

  describe('forProject', () => {
    it('fetches the project, resolves the license, and returns the rights payload', done => {
      projectApi.get.mockReturnValue(of({ project: makeProject() }));
      paginatedApi.getLicenses.mockReturnValue(of(licenseCatalog));

      service.forProject('http://rdfh.ch/projects/0001').subscribe(rights => {
        expect(rights).toEqual({
          copyrightHolder: 'University of Basel',
          authorship: ['Author A'],
          licenseLabel: 'CC BY 4.0',
          licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
        });
        done();
      });
    });

    it('serves subsequent subscribers from cache without re-fetching', done => {
      projectApi.get.mockReturnValue(of({ project: makeProject() }));
      paginatedApi.getLicenses.mockReturnValue(of(licenseCatalog));

      service.forProject('http://rdfh.ch/projects/0001').subscribe(() => {
        service.forProject('http://rdfh.ch/projects/0001').subscribe(() => {
          expect(projectApi.get).toHaveBeenCalledTimes(1);
          expect(paginatedApi.getLicenses).toHaveBeenCalledTimes(1);
          done();
        });
      });
    });

    it('returns undefined license fields when dataLicense is not set', done => {
      projectApi.get.mockReturnValue(of({ project: makeProject({ dataLicense: undefined }) }));

      service.forProject('http://rdfh.ch/projects/0001').subscribe(rights => {
        expect(rights.licenseLabel).toBeUndefined();
        expect(rights.licenseUrl).toBeUndefined();
        expect(paginatedApi.getLicenses).not.toHaveBeenCalled();
        done();
      });
    });
  });

  describe('error eviction', () => {
    it('does not cache a failed project fetch', done => {
      let calls = 0;
      projectApi.get.mockImplementation(() => {
        calls += 1;
        return calls === 1 ? throwError(() => new Error('boom')) : of({ project: makeProject() });
      });
      paginatedApi.getLicenses.mockReturnValue(of(licenseCatalog));

      service.forProject('http://rdfh.ch/projects/0001').subscribe({
        error: () => {
          service.forProject('http://rdfh.ch/projects/0001').subscribe(rights => {
            expect(calls).toBe(2);
            expect(rights.licenseLabel).toBe('CC BY 4.0');
            done();
          });
        },
      });
    });

    it('does not cache a failed license fetch', done => {
      projectApi.get.mockReturnValue(of({ project: makeProject() }));
      let calls = 0;
      paginatedApi.getLicenses.mockImplementation(() => {
        calls += 1;
        return calls === 1 ? throwError(() => new Error('boom')) : of(licenseCatalog);
      });

      service.forProject('http://rdfh.ch/projects/0001').subscribe({
        error: () => {
          service.forProject('http://rdfh.ch/projects/0001').subscribe(rights => {
            expect(calls).toBe(2);
            expect(rights.licenseLabel).toBe('CC BY 4.0');
            done();
          });
        },
      });
    });
  });

  describe('invalidateByShortcode', () => {
    it('evicts both the license cache and the matching project entry', done => {
      projectApi.get.mockReturnValue(of({ project: makeProject() }));
      paginatedApi.getLicenses.mockReturnValue(of(licenseCatalog));

      service.forProject('http://rdfh.ch/projects/0001').subscribe(() => {
        service.invalidateByShortcode('0001');
        service.forProject('http://rdfh.ch/projects/0001').subscribe(() => {
          expect(projectApi.get).toHaveBeenCalledTimes(2);
          expect(paginatedApi.getLicenses).toHaveBeenCalledTimes(2);
          done();
        });
      });
    });

    it('does not evict projects for unrelated shortcodes', done => {
      const projectA = makeProject({ id: 'http://rdfh.ch/projects/AAAA', shortcode: 'AAAA' });
      const projectB = makeProject({ id: 'http://rdfh.ch/projects/BBBB', shortcode: 'BBBB' });
      projectApi.get.mockImplementation((iri: string) =>
        iri === 'http://rdfh.ch/projects/AAAA' ? of({ project: projectA }) : of({ project: projectB })
      );
      paginatedApi.getLicenses.mockReturnValue(of(licenseCatalog));

      service.forProject('http://rdfh.ch/projects/AAAA').subscribe(() => {
        service.forProject('http://rdfh.ch/projects/BBBB').subscribe(() => {
          service.invalidateByShortcode('AAAA');

          service.forProject('http://rdfh.ch/projects/BBBB').subscribe(() => {
            const bbbbCalls = projectApi.get.mock.calls.filter(
              ([iri]: [string]) => iri === 'http://rdfh.ch/projects/BBBB'
            );
            expect(bbbbCalls).toHaveLength(1);
            done();
          });
        });
      });
    });
  });

  describe('clearAll', () => {
    it('drops every cached entry', done => {
      projectApi.get.mockReturnValue(of({ project: makeProject() }));
      paginatedApi.getLicenses.mockReturnValue(of(licenseCatalog));

      service.forProject('http://rdfh.ch/projects/0001').subscribe(() => {
        service.clearAll();
        service.forProject('http://rdfh.ch/projects/0001').subscribe(() => {
          expect(projectApi.get).toHaveBeenCalledTimes(2);
          expect(paginatedApi.getLicenses).toHaveBeenCalledTimes(2);
          done();
        });
      });
    });
  });

  describe('fromProject', () => {
    it('resolves license from the licenses catalog without refetching the project', done => {
      paginatedApi.getLicenses.mockReturnValue(of(licenseCatalog));

      service.fromProject(makeProject()).subscribe(rights => {
        expect(projectApi.get).not.toHaveBeenCalled();
        expect(rights.licenseLabel).toBe('CC BY 4.0');
        expect(rights.copyrightHolder).toBe('University of Basel');
        done();
      });
    });
  });
});
