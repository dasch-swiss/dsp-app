import { provideRouter } from '@angular/router';
import { Constants, PermissionsData, ReadUser } from '@dasch-swiss/dsp-js';
import { UserService } from '@dasch-swiss/vre/core/session';
import { of } from 'rxjs';

export const makeReadUser = (partial: Partial<ReadUser> = {}): ReadUser =>
  ({
    id: 'http://rdfh.ch/users/testuser',
    username: 'testuser',
    email: 'test@example.com',
    givenName: 'Jane',
    familyName: 'Doe',
    status: true,
    lang: 'en',
    permissions: { groupsPerProject: {} } as PermissionsData,
    ...partial,
  }) as ReadUser;

export const makeSystemAdminUser = (): ReadUser =>
  makeReadUser({
    permissions: {
      groupsPerProject: {
        [Constants.SystemProjectIRI]: [Constants.SystemAdminGroupIRI],
      },
    } as PermissionsData,
  });

export const makeUserServiceStub = (partial: Partial<UserService> = {}): Partial<UserService> => ({
  isSysAdmin$: of(false),
  user$: of(makeReadUser()),
  currentUser: makeReadUser(),
  ...partial,
});

export const STORY_PROVIDERS = [
  provideRouter([{ path: '**', redirectTo: '' }]),
  { provide: UserService, useValue: makeUserServiceStub() },
];
