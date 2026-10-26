import { provideRouter } from '@angular/router';
import { Cardinality, Constants, ReadResource } from '@dasch-swiss/dsp-js';
import { ResourceLegalV2ApiService, UserApiService } from '@dasch-swiss/vre/3rd-party-services/api';
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
  // `ComparisonComponent` subscribes to this in its constructor.
  resourceChanged$: EMPTY,
  notifyResourceChanged: () => {},
  ...partial,
});

export const makeUserServiceStub = (partial: Partial<UserService> = {}): Partial<UserService> => ({
  isSysAdmin$: of(false),
  isLoggedIn$: of(true),
  user$: of(null),
  currentUser: null,
  ...partial,
});

export const EDITABLE_PROPERTY_IRI = `${TEST_RESOURCE_TYPE.split('#')[0]}#hasInteger`;

/**
 * A resource the resource editor can mount over: table cells run `generateDspResource`, which needs
 * `entityInfo.classes[type].getResourcePropertiesList()`. `userHasPermission` defaults to 'CR'; 'RV' mounts read-only.
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
    userHasPermission: rest.userHasPermission ?? 'CR',
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

/** `getResource` never emits: `reload()` after a save goes through it and an emission would rebind the editor mid-assertion. */
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

  // Editable table cells mount the resource editor's property unit, whose dependencies must resolve even for a story that only renders a table.
  { provide: DspApiConnectionToken, useValue: makeDspApiConnectionStub() },
  { provide: NotificationService, useValue: { openSnackBar: () => {} } },
  { provide: ResourceLegalV2ApiService, useValue: { updateResourceAuthorship: () => of({}) } },
  { provide: AdminAPIApiService, useValue: { getAdminProjectsIriProjectiri: () => EMPTY } },
  { provide: UserApiService, useValue: { get: () => EMPTY } },
  { provide: APIV2ApiService, useValue: { putV2ValuesOrder: () => EMPTY } },

  // `DataTableComponent` provides these per table; they are here so a story can mount a single cell.
  PropertiesDisplayService,
  FootnoteService,

  // Reached only when a value's editor opens; the real one needs the app's config token.
  { provide: ResourceService, useValue: { getProjectShortcode: () => 'test' } },
];
