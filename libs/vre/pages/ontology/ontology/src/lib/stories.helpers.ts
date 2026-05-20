import { provideRouter } from '@angular/router';
import { Cardinality, Constants, IHasProperty, ResourceClassDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { UserService } from '@dasch-swiss/vre/core/session';
import { DefaultProperties } from '@dasch-swiss/vre/shared/app-helper-services';
import { BehaviorSubject, of } from 'rxjs';
import { ClassPropertyInfo, ResourceClassInfo } from './ontology.types';

export const makeProjectPageServiceStub = (partial: Record<string, unknown> = {}) => ({
  currentProject$: of({
    id: 'http://rdfh.ch/projects/0001',
    shortcode: '0001',
    shortname: 'test',
    longname: 'Test Project',
    status: true,
  } as any),
  currentProject: {
    id: 'http://rdfh.ch/projects/0001',
    shortcode: '0001',
    shortname: 'test',
    longname: 'Test Project',
    status: true,
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

export const makeOntologyPageServiceStub = (partial: Record<string, unknown> = {}) => ({
  expandClasses$: new BehaviorSubject(true).asObservable(),
  toggleExpandClasses: () => {},
  ...partial,
});

export const makeResourceClassDefinition = (): ResourceClassDefinitionWithAllLanguages => {
  const def = new ResourceClassDefinitionWithAllLanguages();
  def.id = 'http://0.0.0.0:3333/ontology/0001/test/v2#TestClass';
  def.label = 'Test Class';
  def.labels = [{ language: 'en', value: 'Test Class' }];
  def.comments = [{ language: 'en', value: 'A test resource class' }];
  def.propertiesList = [];
  def.subClassOf = ['http://api.knora.org/ontology/knora-api/v2#Resource'];
  return def;
};

export const makeResourceClassInfo = (): ResourceClassInfo => {
  return new ResourceClassInfo(makeResourceClassDefinition(), []);
};

export const makeClassPropertyInfo = (): ClassPropertyInfo => {
  const textPropType = DefaultProperties.data.find(g => g.group === 'Text')!.elements[0];
  const iHasProperty: IHasProperty = {
    propertyIndex: 'http://0.0.0.0:3333/ontology/0001/test/v2#hasTitle',
    cardinality: Cardinality._0_1,
    guiOrder: 1,
    isInherited: false,
  };
  return {
    propDef: {
      id: 'http://0.0.0.0:3333/ontology/0001/test/v2#hasTitle',
      label: 'Title',
      labels: [{ language: 'en', value: 'Title' }],
      comments: [{ language: 'en', value: 'The title of the resource' }],
      objectType: Constants.TextValue,
      subPropertyOf: [Constants.HasValue],
      isLinkProperty: false,
      isEditable: true,
      guiElement: Constants.GuiSimpleText,
      guiAttributes: [],
    } as any,
    propType: textPropType,
    baseOntologyId: 'http://0.0.0.0:3333/ontology/0001/test/v2',
    baseOntologyLabel: 'Test Ontology',
    usedByClasses: [],
    objectLabels: [],
    objectComments: [],
    iHasProperty,
    classId: 'http://0.0.0.0:3333/ontology/0001/test/v2#TestClass',
  };
};

export const STORY_PROVIDERS = [
  provideRouter([{ path: '**', redirectTo: '' }]),
  { provide: UserService, useValue: { currentUser: null } },
];
