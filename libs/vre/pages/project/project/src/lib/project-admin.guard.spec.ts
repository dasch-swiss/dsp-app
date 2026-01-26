import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { RouteConstants } from '@dasch-swiss/vre/core/config';
import { AutoLoginService, UserService } from '@dasch-swiss/vre/core/session';
import { BehaviorSubject } from 'rxjs';
import { ProjectAdminGuard } from './project-admin.guard';
import { ProjectPageService } from './project-page.service';

describe('ProjectAdminGuard', () => {
  let guard: ProjectAdminGuard;
  let autoLoginServiceMock: Partial<AutoLoginService>;
  let userServiceMock: Partial<UserService>;
  let projectPageServiceMock: Partial<ProjectPageService>;
  let routerMock: jest.Mocked<Partial<Router>>;
  let hasCheckedCredentialsSubject: BehaviorSubject<boolean>;
  let isLoggedInSubject: BehaviorSubject<boolean>;
  let hasProjectAdminRightsSubject: BehaviorSubject<boolean>;
  let mockUrlTree: UrlTree;

  beforeEach(() => {
    hasCheckedCredentialsSubject = new BehaviorSubject<boolean>(false);
    isLoggedInSubject = new BehaviorSubject<boolean>(false);
    hasProjectAdminRightsSubject = new BehaviorSubject<boolean>(false);

    // Create a mock UrlTree
    mockUrlTree = { toString: () => '/not-allowed' } as UrlTree;

    autoLoginServiceMock = {
      hasCheckedCredentials$: hasCheckedCredentialsSubject,
    };

    userServiceMock = {
      isLoggedIn$: isLoggedInSubject,
    };

    projectPageServiceMock = {
      hasProjectAdminRights$: hasProjectAdminRightsSubject,
    };

    routerMock = {
      createUrlTree: jest.fn().mockReturnValue(mockUrlTree),
    };

    TestBed.configureTestingModule({
      providers: [
        ProjectAdminGuard,
        { provide: AutoLoginService, useValue: autoLoginServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: ProjectPageService, useValue: projectPageServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    });

    guard = TestBed.inject(ProjectAdminGuard);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  describe('canActivate', () => {
    it('should return true when credentials checked, user is logged in and has project admin rights', done => {
      hasCheckedCredentialsSubject.next(true);
      isLoggedInSubject.next(true);
      hasProjectAdminRightsSubject.next(true);

      guard.canActivate().subscribe(result => {
        expect(result).toBe(true);
        expect(routerMock.createUrlTree).not.toHaveBeenCalled();
        done();
      });
    });

    it('should return UrlTree when credentials checked but user is not logged in', done => {
      hasCheckedCredentialsSubject.next(true);
      isLoggedInSubject.next(false);

      guard.canActivate().subscribe(result => {
        expect(result).toBe(mockUrlTree);
        expect(routerMock.createUrlTree).toHaveBeenCalledWith([RouteConstants.notAllowed]);
        done();
      });
    });

    it('should return UrlTree when user is logged in but has no project admin rights', done => {
      hasCheckedCredentialsSubject.next(true);
      isLoggedInSubject.next(true);
      hasProjectAdminRightsSubject.next(false);

      guard.canActivate().subscribe(result => {
        expect(result).toBe(mockUrlTree);
        expect(routerMock.createUrlTree).toHaveBeenCalledWith([RouteConstants.notAllowed]);
        done();
      });
    });

    it('should wait for credentials to be checked before proceeding', done => {
      // Initially credentials not checked
      hasCheckedCredentialsSubject.next(false);
      isLoggedInSubject.next(true);
      hasProjectAdminRightsSubject.next(true);

      let emitted = false;

      guard.canActivate().subscribe(() => {
        emitted = true;
        expect(hasCheckedCredentialsSubject.value).toBe(true);
        done();
      });

      // Should not emit yet
      setTimeout(() => {
        expect(emitted).toBe(false);

        // Now mark credentials as checked
        hasCheckedCredentialsSubject.next(true);
      }, 10);
    });

    it('should not emit when credentials have not been checked', done => {
      // Start with credentials not checked
      hasCheckedCredentialsSubject.next(false);
      isLoggedInSubject.next(true);
      hasProjectAdminRightsSubject.next(true);

      let emitted = false;

      guard.canActivate().subscribe(() => {
        emitted = true;
      });

      setTimeout(() => {
        expect(emitted).toBe(false);
        done();
      }, 50);
    });

    it('should complete after one emission using take(1)', done => {
      hasCheckedCredentialsSubject.next(true);
      isLoggedInSubject.next(true);
      hasProjectAdminRightsSubject.next(true);

      let emissionCount = 0;

      guard.canActivate().subscribe({
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
