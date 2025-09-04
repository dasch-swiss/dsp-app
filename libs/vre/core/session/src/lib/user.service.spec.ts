import { TestBed } from '@angular/core/testing';
import { ReadUser } from '@dasch-swiss/dsp-js';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AppError } from '@dasch-swiss/vre/core/error-handler';
import { UserPermissions } from '@dasch-swiss/vre/shared/app-common';
import { of, throwError } from 'rxjs';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let userApiServiceSpy: jest.SpyInstance;

  const mockUser: ReadUser = {
    id: 'http://rdf.dasch.swiss/users/test-user',
    username: 'testuser',
    email: 'test@example.com',
    givenName: 'Test',
    familyName: 'User',
    status: true,
    lang: 'en',
    password: '',
    projects: [
      { id: 'project1', shortname: 'proj1', status: true },
      { id: 'project2', shortname: 'proj2', status: false },
    ],
    permissions: {
      groupsPerProject: {},
    },
  } as ReadUser;

  const mockUserApiService = {
    get: jest.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserService, { provide: UserApiService, useValue: mockUserApiService }],
    });
    service = TestBed.inject(UserService);
    userApiServiceSpy = jest.spyOn(mockUserApiService, 'get');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with null user', () => {
      expect(service.currentUser).toBeNull();
    });

    it('should have correct initial observable values', done => {
      service.user$.subscribe(user => {
        expect(user).toBeNull();
        done();
      });
    });

    it('should indicate user is not logged in initially', done => {
      service.isLoggedIn$.subscribe(isLoggedIn => {
        expect(isLoggedIn).toBe(false);
        done();
      });
    });

    it('should indicate user is not sys admin initially', done => {
      service.isSysAdmin$.subscribe(isSysAdmin => {
        expect(isSysAdmin).toBe(false);
        done();
      });
    });

    it('should return empty active projects initially', done => {
      service.userActiveProjects$.subscribe(projects => {
        expect(projects).toEqual([]);
        done();
      });
    });

    it('should return empty inactive projects initially', done => {
      service.userInactiveProjects$.subscribe(projects => {
        expect(projects).toEqual([]);
        done();
      });
    });
  });

  describe('loadUser', () => {
    it('should load user successfully with IRI', done => {
      const userResponse = { user: mockUser };
      userApiServiceSpy.mockReturnValue(of(userResponse));

      service.loadUser(mockUser.id, 'iri').subscribe(user => {
        expect(user).toEqual(mockUser);
        expect(service.currentUser).toEqual(mockUser);
        expect(userApiServiceSpy).toHaveBeenCalledWith(mockUser.id, 'iri');
        done();
      });
    });

    it('should load user successfully with email', done => {
      const userResponse = { user: mockUser };
      userApiServiceSpy.mockReturnValue(of(userResponse));

      service.loadUser('test@example.com', 'email').subscribe(user => {
        expect(user).toEqual(mockUser);
        expect(service.currentUser).toEqual(mockUser);
        expect(userApiServiceSpy).toHaveBeenCalledWith('test@example.com', 'email');
        done();
      });
    });

    it('should load user successfully with username', done => {
      const userResponse = { user: mockUser };
      userApiServiceSpy.mockReturnValue(of(userResponse));

      service.loadUser('testuser', 'username').subscribe(user => {
        expect(user).toEqual(mockUser);
        expect(service.currentUser).toEqual(mockUser);
        expect(userApiServiceSpy).toHaveBeenCalledWith('testuser', 'username');
        done();
      });
    });

    it('should logout and throw AppError when API call fails', done => {
      const error = new Error('API Error');
      userApiServiceSpy.mockReturnValue(throwError(() => error));

      service.loadUser(mockUser.id, 'iri').subscribe({
        next: () => {
          fail('Should not emit a value');
        },
        error: err => {
          expect(err).toBeInstanceOf(AppError);
          expect(err.message).toContain('User could not be loaded: iri: http://rdf.dasch.swiss/users/test-user');
          expect(service.currentUser).toBeNull();
          done();
        },
      });
    });

    it('should update observables after successful load', done => {
      const userResponse = { user: mockUser };
      userApiServiceSpy.mockReturnValue(of(userResponse));

      service.loadUser(mockUser.id, 'iri').subscribe(() => {
        service.isLoggedIn$.subscribe(isLoggedIn => {
          expect(isLoggedIn).toBe(true);
          done();
        });
      });
    });
  });

  describe('reloadUser', () => {
    it('should reload current user successfully', done => {
      // First, set a current user
      const userResponse = { user: mockUser };
      userApiServiceSpy.mockReturnValue(of(userResponse));

      service.loadUser(mockUser.id, 'iri').subscribe(() => {
        // Now reload the user
        service.reloadUser().subscribe(user => {
          expect(user).toEqual(mockUser);
          expect(userApiServiceSpy).toHaveBeenCalledTimes(2);
          expect(userApiServiceSpy).toHaveBeenLastCalledWith(mockUser.id, 'iri');
          done();
        });
      });
    });

    it('should throw AppError when no user is logged in', () => {
      expect(() => service.reloadUser()).toThrow(AppError);
      expect(() => service.reloadUser()).toThrow('No user is currently logged in.');
    });
  });

  describe('logout', () => {
    it('should clear current user', done => {
      // First, load a user
      const userResponse = { user: mockUser };
      userApiServiceSpy.mockReturnValue(of(userResponse));

      service.loadUser(mockUser.id, 'iri').subscribe(() => {
        expect(service.currentUser).toEqual(mockUser);

        // Then logout
        service.logout();
        expect(service.currentUser).toBeNull();

        service.isLoggedIn$.subscribe(isLoggedIn => {
          expect(isLoggedIn).toBe(false);
          done();
        });
      });
    });
  });

  describe('observables with user data', () => {
    beforeEach(done => {
      const userResponse = { user: mockUser };
      userApiServiceSpy.mockReturnValue(of(userResponse));

      service.loadUser(mockUser.id, 'iri').subscribe(() => {
        done();
      });
    });

    it('should indicate user is logged in', done => {
      service.isLoggedIn$.subscribe(isLoggedIn => {
        expect(isLoggedIn).toBe(true);
        done();
      });
    });

    it('should check sys admin rights correctly', done => {
      const hasSysAdminSpy = jest.spyOn(UserPermissions, 'hasSysAdminRights').mockReturnValue(true);

      service.isSysAdmin$.subscribe(isSysAdmin => {
        expect(isSysAdmin).toBe(true);
        expect(hasSysAdminSpy).toHaveBeenCalledWith(mockUser);
        done();
      });
    });

    it('should return active projects correctly', done => {
      service.userActiveProjects$.subscribe(projects => {
        expect(projects).toEqual([{ id: 'project1', shortname: 'proj1', status: true }]);
        done();
      });
    });

    it('should return inactive projects correctly', done => {
      service.userInactiveProjects$.subscribe(projects => {
        expect(projects).toEqual([{ id: 'project2', shortname: 'proj2', status: false }]);
        done();
      });
    });
  });

  describe('observables without user data', () => {
    it('should return false for sys admin when user is null', done => {
      service.isSysAdmin$.subscribe(isSysAdmin => {
        expect(isSysAdmin).toBe(false);
        done();
      });
    });

    it('should return empty array for active projects when user is null', done => {
      service.userActiveProjects$.subscribe(projects => {
        expect(projects).toEqual([]);
        done();
      });
    });

    it('should return empty array for inactive projects when user is null', done => {
      service.userInactiveProjects$.subscribe(projects => {
        expect(projects).toEqual([]);
        done();
      });
    });
  });
});
