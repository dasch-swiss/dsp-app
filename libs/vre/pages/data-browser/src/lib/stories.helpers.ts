import { provideRouter } from '@angular/router';
import { ReadResource } from '@dasch-swiss/dsp-js';
import { UserService } from '@dasch-swiss/vre/core/session';
import { of } from 'rxjs';
import { MultipleViewerService } from './comparison/multiple-viewer.service';
import { ProjectShortnameService } from './project-shortname.service';

export const makeReadResource = (partial: Partial<ReadResource> = {}): ReadResource =>
  ({
    id: 'http://rdfh.ch/0001/resource1',
    type: 'http://0.0.0.0:3333/ontology/0001/test/v2#Book',
    label: 'Test Resource',
    attachedToProject: 'http://rdfh.ch/projects/0001',
    attachedToUser: 'http://rdfh.ch/users/testuser',
    properties: {},
    ...partial,
  }) as ReadResource;

export const makeMultipleViewerServiceStub = (
  partial: Partial<MultipleViewerService> = {}
): Partial<MultipleViewerService> => ({
  selectedResources$: of([]),
  selectMode: false,
  searchKeyword: undefined,
  selectOneResource: () => {},
  addResources: () => {},
  removeResources: () => {},
  reset: () => {},
  ...partial,
});

export const makeUserServiceStub = (partial: Partial<UserService> = {}): Partial<UserService> => ({
  isSysAdmin$: of(false),
  user$: of(null),
  currentUser: null,
  ...partial,
});

export const STORY_PROVIDERS = [
  provideRouter([{ path: '**', redirectTo: '' }]),
  { provide: UserService, useValue: makeUserServiceStub() },
  { provide: ProjectShortnameService, useValue: { getProjectShortname: () => of('testproj') } },
  { provide: MultipleViewerService, useValue: makeMultipleViewerServiceStub() },
];
