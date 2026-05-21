import { provideRouter } from '@angular/router';
import { ReadProject, ReadUser, StoredProject } from '@dasch-swiss/dsp-js';
import { UserService } from '@dasch-swiss/vre/core/session';
import { of } from 'rxjs';
import { ProjectPageService } from './project-page.service';

export const makeReadProject = (partial: Partial<ReadProject> = {}): ReadProject =>
  ({
    id: 'http://rdfh.ch/projects/0001',
    shortcode: '0001',
    shortname: 'testproj',
    longname: 'Test Project',
    status: true,
    selfjoin: false,
    keywords: [],
    description: [{ language: 'en', value: 'A test project description.' }],
    ontologies: [],
    logo: null,
    ...partial,
  }) as ReadProject;

export const makeReadUser = (partial: Partial<ReadUser> = {}): ReadUser =>
  ({
    id: 'http://rdfh.ch/users/testuser',
    username: 'testuser',
    email: 'test@example.com',
    givenName: 'Jane',
    familyName: 'Doe',
    status: true,
    lang: 'en',
    permissions: { groupsPerProject: {} },
    projects: [],
    groups: [],
    ...partial,
  }) as ReadUser;

export const makeProjectPageServiceStub = (partial: Partial<ProjectPageService> = {}): Partial<ProjectPageService> => ({
  currentProject$: of(makeReadProject()),
  hasProjectAdminRights$: of(false),
  hasProjectMemberRights$: of(true),
  ontologiesMetadata$: of([]),
  ontologies$: of([]),
  reloadProject: () => {},
  ...partial,
});

export const makeUserServiceStub = (partial: Partial<UserService> = {}): Partial<UserService> => ({
  isSysAdmin$: of(false),
  user$: of(makeReadUser()),
  currentUser: makeReadUser(),
  ...partial,
});

export const STORY_PROVIDERS = [
  provideRouter([{ path: '**', redirectTo: '' }]),
  { provide: ProjectPageService, useValue: makeProjectPageServiceStub() },
  { provide: UserService, useValue: makeUserServiceStub() },
];
