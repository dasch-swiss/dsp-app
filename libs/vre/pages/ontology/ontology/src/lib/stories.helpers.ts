import { provideRouter } from '@angular/router';
import { UserService } from '@dasch-swiss/vre/core/session';
import { BehaviorSubject, of } from 'rxjs';

export const makeProjectPageServiceStub = (partial: Record<string, unknown> = {}) => ({
  currentProject$: of({
    id: 'http://rdfh.ch/projects/0001',
    shortcode: '0001',
    shortname: 'test',
    longname: 'Test Project',
  } as any),
  currentProject: {
    id: 'http://rdfh.ch/projects/0001',
    shortcode: '0001',
    shortname: 'test',
    longname: 'Test Project',
  },
  currentProjectUuid: 'proj-uuid-0001',
  ontologiesMetadata$: of([]),
  ontologies$: of([]),
  hasProjectAdminRights$: of(true),
  hasProjectMemberRights$: of(true),
  reloadProject: () => {},
  ...partial,
});

export const makeOntologyEditServiceStub = (partial: Record<string, unknown> = {}) => ({
  currentOntology$: of(null),
  currentOntologyInfo$: of(null),
  currentOntologyClasses$: of([]),
  currentOntologyProperties$: of([]),
  currentProjectsProperties$: of([]),
  currentOntologyEntityNames$: of([]),
  currentOntologyCanBeDeleted$: of(false),
  isTransacting$: of(false),
  isTransacting: false,
  latestChangedItem: new BehaviorSubject<string | undefined>(undefined),
  ontologyId: 'http://0.0.0.0:3333/ontology/0001/test/v2',
  lastModificationDate: '2024-01-01T00:00:00Z',
  initOntologyByLabel: () => {},
  canDeleteResourceProperty$: () => of({ canDo: true }),
  canDeleteResourceClass$: () => of({ canDo: true }),
  deleteProperty$: () => of({}),
  deleteResourceClass$: () => of({}),
  deleteOntology$: () => of({}),
  updateGuiOrderOfClassProperties: () => {},
  removePropertyFromClass: () => {},
  assignPropertyToClass: () => {},
  propertyCanBeRemovedFromClass$: () => of({ canDo: true }),
  updateOntology$: () => of({}),
  createResourceClass$: () => of({}),
  updateResourceClass$: () => of({}),
  createProperty$: () => of({}),
  updateProperty$: () => of({}),
  updatePropertiesOfResourceClass: () => {},
  ...partial,
});

export const STORY_PROVIDERS = [
  provideRouter([{ path: '**', component: class {} }]),
  { provide: UserService, useValue: { currentUser: null } as Partial<UserService> },
];
