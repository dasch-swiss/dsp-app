import { provideRouter } from '@angular/router';
import { Cardinality, Constants, ReadResource } from '@dasch-swiss/dsp-js';
import { UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
import { AdminAPIApiService, APIV2ApiService } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { DspApiConnectionToken } from '@dasch-swiss/vre/core/config';
import { UserService } from '@dasch-swiss/vre/core/session';
import { FootnoteService, PropertiesDisplayService } from '@dasch-swiss/vre/resource-editor/resource-editor';
import { ResourceService } from '@dasch-swiss/vre/shared/app-common';
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
 * A resource complete enough to mount the resource editor over.
 *
 * `makeReadResource` is shaped for components that only read a label and a class. Every table
 * property cell runs `generateDspResource`, which walks
 * `entityInfo.classes[type].getResourcePropertiesList()` and calls `getValues()` per property —
 * so a cell built over the lighter stub falls down the plain-text path rather than rendering the
 * viewer. An integer property is used because it is the one value type whose editor needs nothing
 * but a number: no list fetch, no geoname lookup, no rich-text build.
 *
 * `userHasPermission: 'CR'` by default. Pass `'RV'` to story a user who may read but not modify;
 * the editor then mounts read-only, with no Edit, Delete or add control.
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
 * Enough of a connection for a table cell's resource editor.
 *
 * `getResource` deliberately never emits. Nothing fetches a row any more — each cell's
 * `ResourceFetcherService` is primed with the resource the table already holds — but `reload()`
 * after a save still goes through it, and an emission would rebind the editor mid-assertion. The
 * writes resolve so that a save driven from a story completes rather than throwing.
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

  // Every editable table cell mounts the resource editor's own property unit, which drags that
  // lib's dependency tree across the boundary with it (DEV-7466). Stubbed here rather than story
  // by story, because a story that merely *renders a table* now reaches all of it: the two API
  // services are constructor dependencies of `ResourceFetcherService`, which every property cell
  // provides, whether or not anything subscribes.
  { provide: DspApiConnectionToken, useValue: makeDspApiConnectionStub() },
  { provide: NotificationService, useValue: { openSnackBar: () => {} } },
  { provide: AdminAPIApiService, useValue: { getAdminProjectsIriProjectiri: () => EMPTY } },
  { provide: UserApiService, useValue: { get: () => EMPTY } },
  { provide: APIV2ApiService, useValue: { putV2ValuesOrder: () => EMPTY } },

  // `DataTableComponent` provides these two itself, per table. They are here as well so that a
  // story can mount a single cell without standing a whole table up around it — the component
  // provider still wins wherever a table is present.
  PropertiesDisplayService,
  FootnoteService,

  // Reached only once a value's editor is opened: `PropertyValueEditComponent` asks
  // `ResourceService` for the project shortcode, and the real one pulls the API host out of
  // `AppConfigService`, which needs the app's own config token. Stubbed rather than configured,
  // because no story asserts on a shortcode.
  { provide: ResourceService, useValue: { getProjectShortcode: () => 'test' } },
];
