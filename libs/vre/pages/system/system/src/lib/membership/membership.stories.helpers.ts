import { Constants, StoredProject } from '@dasch-swiss/dsp-js';
import { AdminAPIApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { AllProjectsService } from '@dasch-swiss/vre/pages/user-settings/user';
import { of } from 'rxjs';

export const MEMBER_PROJECT_IRI = 'http://rdfh.ch/projects/0001';

const makeStoredProject = (shortcode: string, longname: string, shortname: string): StoredProject =>
  ({ id: `http://rdfh.ch/projects/${shortcode}`, shortcode, shortname, longname }) as StoredProject;

const memberUser = {
  id: 'http://rdfh.ch/users/testuser',
  username: 'testuser',
  projects: [{ id: MEMBER_PROJECT_IRI, shortcode: '0001', shortname: 'alpha', longname: 'Alpha Project' }],
  permissions: { groupsPerProject: { [MEMBER_PROJECT_IRI]: [Constants.ProjectAdminGroupIRI] } },
};

/** Providers for `MembershipComponent`: the user is project admin of Alpha; Beta is free to join. */
export const makeMembershipProviders = (adminApi: Partial<AdminAPIApiService> = {}) => [
  {
    provide: AdminAPIApiService,
    useValue: {
      getAdminUsersIriUseriri: () => of({ user: memberUser }),
      deleteAdminUsersIriUseririProjectMembershipsProjectiri: () => of({}),
      postAdminUsersIriUseririProjectMembershipsProjectiri: () => of({}),
      ...adminApi,
    },
  },
  {
    provide: AllProjectsService,
    useValue: {
      allProjects$: of([
        makeStoredProject('0001', 'Alpha Project', 'alpha'),
        makeStoredProject('0002', 'Beta Project', 'beta'),
        { id: Constants.SystemProjectIRI, shortcode: 'FFFF', shortname: 'system', longname: 'System Project' },
      ]),
    },
  },
];
