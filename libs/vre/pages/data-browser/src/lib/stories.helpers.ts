import { provideRouter } from '@angular/router';
import { Cardinality, Constants, ReadResource } from '@dasch-swiss/dsp-js';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminAPIApiService, APIV2ApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { LocalizationService } from '@dasch-swiss/vre/shared/app-helper-services';
import { NotificationService } from '@dasch-swiss/vre/ui/notification';
import { EMPTY, of } from 'rxjs';
import { MultipleViewerService } from './comparison/multiple-viewer.service';
import { ProjectShortnameService } from './project-shortname.service';

const TEST_RESOURCE_TYPE = 'http://0.0.0.0:3333/ontology/0001/test/v2#Book';

/**
 * `entityInfo` and `resourceClassLabel` mirror what dsp-js fills in when converting a search
 * response, so components reading the resource class (DEV-5452) see realistic data.
 */
export const makeReadResource = (partial: Partial<ReadResource> = {}): ReadResource => {
  const type = partial.type ?? TEST_RESOURCE_TYPE;
  return {
    id: 'http://rdfh.ch/0001/resource1',
    type,
    label: 'Test Resource',
    attachedToProject: 'http://rdfh.ch/projects/0001',
    attachedToUser: 'http://rdfh.ch/users/testuser',
    properties: {},
    resourceClassLabel: 'Book',
    entityInfo: {
      classes: {
        [type]: { labels: [{ language: 'en', value: 'Book' }] },
      },
      properties: {},
    },
    ...partial,
  } as ReadResource;
};

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
  // `ComparisonComponent` subscribes to this in its constructor, so a story that mounts a viewer
  // throws on a stub without it.
  resourceChanged$: EMPTY,
  notifyResourceChanged: () => {},
  ...partial,
});

export const makeUserServiceStub = (partial: Partial<UserService> = {}): Partial<UserService> => ({
  isSysAdmin$: of(false),
  user$: of(null),
  currentUser: null,
  ...partial,
});

/** The one property `makeEditableReadResource` gives its resources. */
export const EDITABLE_PROPERTY_IRI = `${TEST_RESOURCE_TYPE.split('#')[0]}#hasInteger`;

/**
 * A resource complete enough to open a table cell on.
 *
 * `makeReadResource` is shaped for components that only read a label and a class. An open cell
 * runs `generateDspResource`, which walks `entityInfo.classes[type].getResourcePropertiesList()`
 * and calls `getValues()` per property — so a cell opened over the lighter stub throws rather than
 * rendering. An integer property is used because it is the one value type whose editor needs
 * nothing but a number: no list fetch, no geoname lookup, no rich-text build.
 *
 * `userHasPermission: 'CR'` by default, because a resource the user cannot modify has no edit
 * affordance at all and there would be nothing to open. Pass `'RV'` to story that case.
 */
export const makeEditableReadResource = (partial: Partial<ReadResource> & { values?: string[] } = {}): ReadResource => {
  const { values = ['42'], ...rest } = partial;
  const type = rest.type ?? TEST_RESOURCE_TYPE;

  const propertyDefinition = {
    id: EDITABLE_PROPERTY_IRI,
    label: 'Integer',
    objectType: Constants.IntValue,
    isEditable: true,
    isLinkProperty: false,
    isLinkValueProperty: false,
    subPropertyOf: [],
  };

  const readValues = values.map((strval, index) => ({
    id: `http://rdfh.ch/values/${index}`,
    type: Constants.IntValue,
    property: EDITABLE_PROPERTY_IRI,
    uuid: `uuid-${index}`,
    strval,
    int: Number(strval),
    valueCreationDate: '2024-06-15T10:00:00Z',
    valueHasComment: null,
    userHasPermission: 'CR',
  }));

  return makeReadResource({
    userHasPermission: 'CR',
    entityInfo: {
      classes: {
        [type]: {
          labels: [{ language: 'en', value: 'Book' }],
          getResourcePropertiesList: () => [
            {
              propertyIndex: EDITABLE_PROPERTY_IRI,
              cardinality: Cardinality._0_n,
              guiOrder: 1,
              propertyDefinition,
            },
          ],
        },
      },
      properties: {},
      getPropertyDefinitionsByType: () => [],
    },
    getValues: () => readValues,
    getValuesAsStringArray: () => values,
    ...rest,
  } as unknown as Partial<ReadResource>);
};

export const makeLocalizationServiceStub = (language = 'en'): Partial<LocalizationService> => ({
  currentLanguage: language as LocalizationService['currentLanguage'],
  currentLanguage$: of(language as LocalizationService['currentLanguage']),
});

/**
 * Enough of a connection for the table's open cell.
 *
 * `getResource` deliberately never emits. `ResourceFetcherService` calls it when a row's fetcher is
 * seeded, and an emission would run `generateDspResource` over a stub and then rebind the editor —
 * neither of which a story about opening a cell is asserting. The writes resolve so that a save
 * driven from a story completes rather than throwing.
 */
export const makeDspApiConnectionStub = () => ({
  v2: {
    res: { getResource: () => EMPTY },
    values: { updateValue: () => of({}), createValue: () => of({}) },
    list: { getListWithAllLanguages: () => EMPTY, getList: () => EMPTY, getNode: () => EMPTY },
  },
});

export const STORY_PROVIDERS = [
  provideRouter([{ path: '**', component: class {} }]),
  { provide: UserService, useValue: makeUserServiceStub() },
  { provide: LocalizationService, useValue: makeLocalizationServiceStub() },
  { provide: ProjectShortnameService, useValue: { getProjectShortname: () => of('testproj') } },
  { provide: MultipleViewerService, useValue: makeMultipleViewerServiceStub() },

  // An open table cell mounts the resource editor's own property editor, which drags that lib's
  // dependency tree across the boundary with it (DEV-7466). Stubbed here rather than story by
  // story, because a story that merely *renders a table* can reach them by clicking an edit
  // affordance — the two API services are constructor dependencies of `ResourceFetcherService`
  // and so are resolved the moment a row's fetcher is created, whether or not anything subscribes.
  { provide: DspApiConnectionToken, useValue: makeDspApiConnectionStub() },
  { provide: NotificationService, useValue: { openSnackBar: () => {} } },
  { provide: AdminAPIApiService, useValue: { getAdminProjectsIriProjectiri: () => EMPTY } },
  { provide: UserApiService, useValue: { get: () => EMPTY } },
  { provide: APIV2ApiService, useValue: { putV2ValuesOrder: () => EMPTY } },
];
