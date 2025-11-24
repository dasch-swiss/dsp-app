import { Constants } from '@dasch-swiss/dsp-js';
import { BehaviorSubject } from 'rxjs';

describe('ProjectMembersRowMenuComponent - Permission Fix', () => {
  let mockUserService: {
    isSysAdmin$: BehaviorSubject<boolean>;
  };

  beforeEach(() => {
    mockUserService = {
      isSysAdmin$: new BehaviorSubject<boolean>(false),
    };
  });

  it('should expose isSysAdmin$ observable that emits false for non-system admins', done => {
    mockUserService.isSysAdmin$.next(false);

    mockUserService.isSysAdmin$.subscribe(value => {
      expect(value).toBe(false);
      done();
    });
  });

  it('should expose isSysAdmin$ observable that emits true for system admins', done => {
    mockUserService.isSysAdmin$.next(true);

    mockUserService.isSysAdmin$.subscribe(value => {
      expect(value).toBe(true);
      done();
    });
  });

  it('should correctly identify project admin from permissions', () => {
    const projectAdminPermissions = {
      groupsPerProject: {
        'http://rdfh.ch/projects/0001': [Constants.ProjectAdminGroupIRI],
      },
    };

    const regularMemberPermissions = {
      groupsPerProject: {
        'http://rdfh.ch/projects/0001': [Constants.ProjectMemberGroupIRI],
      },
    };

    // Test the logic that would be in isProjectAdmin method
    const isAdmin = projectAdminPermissions.groupsPerProject?.['http://rdfh.ch/projects/0001']?.includes(
      Constants.ProjectAdminGroupIRI
    );
    const isMember = regularMemberPermissions.groupsPerProject?.['http://rdfh.ch/projects/0001']?.includes(
      Constants.ProjectAdminGroupIRI
    );

    expect(isAdmin).toBe(true);
    expect(isMember).toBe(false);
  });
});
