import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { ReadProject } from '@dasch-swiss/dsp-js';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { ProjectPageGuard } from './project-page.guard';
import { ProjectPageService } from './project-page.service';

describe('ProjectPageGuard', () => {
  let guard: ProjectPageGuard;
  let projectPageServiceMock: Partial<ProjectPageService>;
  let routerMock: jest.Mocked<Partial<Router>>;
  let routeSnapshot: ActivatedRouteSnapshot;
  let stateSnapshot: RouterStateSnapshot;
  let currentProjectSubject: BehaviorSubject<ReadProject | undefined>;

  const mockProject: ReadProject = {
    id: 'http://rdf.dasch.swiss/projects/0001',
    shortname: 'test-project',
    longname: 'Test Project',
    status: true,
    description: [{ language: 'en', value: 'Test description' }],
    keywords: [],
    logo: '',
    selfjoin: false,
    ontologies: [],
    shortcode: '0001',
  } as ReadProject;

  const mockUrlTree: UrlTree = {
    root: {} as any,
    queryParams: {},
    fragment: null,
    queryParamMap: {} as any,
    toString: () => '/404',
  };

  beforeEach(() => {
    currentProjectSubject = new BehaviorSubject<ReadProject | undefined>(mockProject);

    projectPageServiceMock = {
      setup: jest.fn(),
      get currentProject$() {
        return currentProjectSubject.asObservable() as any;
      },
    };

    routerMock = {
      parseUrl: jest.fn().mockReturnValue(mockUrlTree),
    };

    TestBed.configureTestingModule({
      providers: [
        ProjectPageGuard,
        { provide: ProjectPageService, useValue: projectPageServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    guard = TestBed.inject(ProjectPageGuard);

    routeSnapshot = {
      params: {},
    } as any;

    stateSnapshot = {
      url: '/project/test-uuid',
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  describe('canActivate', () => {
    it('should return true when project UUID is valid and project loads successfully', done => {
      const projectUuid = 'test-uuid-123';
      routeSnapshot.params[RouteConstants.uuidParameter] = projectUuid;

      guard.canActivate(routeSnapshot, stateSnapshot).subscribe(result => {
        expect(result).toBe(true);
        expect(projectPageServiceMock.setup).toHaveBeenCalledWith(projectUuid);
        expect(projectPageServiceMock.setup).toHaveBeenCalledTimes(1);
        done();
      });
    });

    it('should redirect to 404 when project UUID is missing', done => {
      routeSnapshot.params = {};

      guard.canActivate(routeSnapshot, stateSnapshot).subscribe(result => {
        expect(result).toBe(mockUrlTree);
        expect(routerMock.parseUrl).toHaveBeenCalledWith(RouteConstants.notFound);
        expect(projectPageServiceMock.setup).not.toHaveBeenCalled();
        done();
      });
    });

    it('should redirect to 404 when project UUID is undefined', done => {
      routeSnapshot.params[RouteConstants.uuidParameter] = undefined;

      guard.canActivate(routeSnapshot, stateSnapshot).subscribe(result => {
        expect(result).toBe(mockUrlTree);
        expect(routerMock.parseUrl).toHaveBeenCalledWith(RouteConstants.notFound);
        expect(projectPageServiceMock.setup).not.toHaveBeenCalled();
        done();
      });
    });

    it('should redirect to 404 when project UUID is empty string', done => {
      routeSnapshot.params[RouteConstants.uuidParameter] = '';

      guard.canActivate(routeSnapshot, stateSnapshot).subscribe(result => {
        expect(result).toBe(mockUrlTree);
        expect(routerMock.parseUrl).toHaveBeenCalledWith(RouteConstants.notFound);
        expect(projectPageServiceMock.setup).not.toHaveBeenCalled();
        done();
      });
    });

    it('should redirect to 404 when currentProject$ emits undefined', done => {
      const projectUuid = 'test-uuid-123';
      routeSnapshot.params[RouteConstants.uuidParameter] = projectUuid;
      currentProjectSubject.next(undefined);

      guard.canActivate(routeSnapshot, stateSnapshot).subscribe(result => {
        expect(result).toBe(mockUrlTree);
        expect(routerMock.parseUrl).toHaveBeenCalledWith(RouteConstants.notFound);
        expect(projectPageServiceMock.setup).toHaveBeenCalledWith(projectUuid);
        done();
      });
    });

    it('should redirect to 404 when currentProject$ throws an error', done => {
      const projectUuid = 'test-uuid-123';
      routeSnapshot.params[RouteConstants.uuidParameter] = projectUuid;
      const error = new Error('Project not found');

      // Create a new mock that returns an error observable
      const errorProjectServiceMock = {
        setup: jest.fn(),
        get currentProject$() {
          return throwError(() => error);
        },
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ProjectPageGuard,
          { provide: ProjectPageService, useValue: errorProjectServiceMock },
          { provide: Router, useValue: routerMock },
        ],
      });
      const errorGuard = TestBed.inject(ProjectPageGuard);

      errorGuard.canActivate(routeSnapshot, stateSnapshot).subscribe(result => {
        expect(result).toBe(mockUrlTree);
        expect(routerMock.parseUrl).toHaveBeenCalledWith(RouteConstants.notFound);
        expect(errorProjectServiceMock.setup).toHaveBeenCalledWith(projectUuid);
        done();
      });
    });

    it('should call setup with correct UUID before checking project', done => {
      const projectUuid = 'valid-project-uuid';
      routeSnapshot.params[RouteConstants.uuidParameter] = projectUuid;
      const setupSpy = projectPageServiceMock.setup as jest.Mock;

      guard.canActivate(routeSnapshot, stateSnapshot).subscribe(() => {
        expect(setupSpy).toHaveBeenCalledWith(projectUuid);
        done();
      });
    });

    it('should only emit first value from currentProject$ observable', done => {
      const projectUuid = 'test-uuid-123';
      routeSnapshot.params[RouteConstants.uuidParameter] = projectUuid;

      let emissionCount = 0;
      guard.canActivate(routeSnapshot, stateSnapshot).subscribe({
        next: result => {
          emissionCount++;
          expect(result).toBe(true);
        },
        complete: () => {
          expect(emissionCount).toBe(1);
          done();
        },
      });
    });
  });
});
