import {
  Constants,
  IHasPropertyWithPropertyDefinition,
  ReadResource,
  ReadTextValueAsString,
  ResourceClassAndPropertyDefinitions,
  ResourceClassDefinitionWithPropertyDefinition,
  ResourcePropertyDefinition,
} from '@dasch-swiss/dsp-js';
import { NEVER, of } from 'rxjs';

export const DEFAULT_HAS_PERMISSIONS =
  'CR knora-base:ProjectAdmin|M knora-base:ProjectMember|V knora-base:KnownUser|RV knora-base:UnknownUser';

const STUB_RESOURCE = {
  res: { attachedToUser: 'http://rdfh.ch/users/test-user' },
} as any;

export const resourceFetcherServiceStub = (shortcode = '0001') => ({
  resource$: of(STUB_RESOURCE),
  userCanEdit$: of(false),
  projectShortcode$: of(shortcode),
});

export const makeTextPropDef = (id: string, label: string): ResourcePropertyDefinition => {
  const def = new ResourcePropertyDefinition();
  def.id = id;
  def.label = label;
  def.objectType = Constants.TextValue;
  def.subPropertyOf = [];
  def.isLinkProperty = false;
  def.isEditable = true;
  return def;
};

export const makePropEntry = (
  propDef: ResourcePropertyDefinition,
  guiOrder: number
): IHasPropertyWithPropertyDefinition => ({
  propertyIndex: propDef.id,
  cardinality: 1 as any,
  guiOrder,
  isInherited: false,
  propertyDefinition: propDef,
});

export const makeTextValue = (id: string, text: string, userHasPermission = 'RV'): ReadTextValueAsString => {
  const v = new ReadTextValueAsString();
  v.id = id;
  v.text = text;
  v.type = Constants.TextValue;
  v.userHasPermission = userHasPermission;
  v.valueCreationDate = '2024-03-15T10:30:00Z';
  return v;
};

export const makeEntityInfo = (
  resourceType: string,
  propEntries: IHasPropertyWithPropertyDefinition[] = [],
  classLabel = 'Thing'
): ResourceClassAndPropertyDefinitions => {
  const classStub = {
    label: classLabel,
    getResourcePropertiesList: () => propEntries,
    propertiesList: propEntries,
  } as unknown as ResourceClassDefinitionWithPropertyDefinition;
  return new ResourceClassAndPropertyDefinitions({ [resourceType]: classStub }, {});
};

export const makeDescriptionProperty = (userHasPermission = 'RV') => {
  const descPropId = 'http://0.0.0.0:3333/ontology/0001/example/v2#hasDescription';
  const def = makeTextPropDef(descPropId, 'Description');
  const entry = makePropEntry(def, 0);
  const value = makeTextValue('http://rdfh.ch/value/desc-1', 'A sample resource for Storybook previews.', userHasPermission);
  return { id: descPropId, def, entry, value };
};

export const addDescriptionToResource = (res: ReadResource, userHasPermission = 'RV'): ReadResource => {
  const { id, entry, value } = makeDescriptionProperty(userHasPermission);
  res.entityInfo = makeEntityInfo(res.type, [entry], res.label);
  res.properties = { ...res.properties, [id]: [value] };
  return res;
};

export const dspApiConnectionStub = {
  v2: {
    search: {
      doSearchIncomingLinks: () => of({ resources: [], mayHaveMoreResults: false }),
      doExtendedSearch: () => NEVER,
    },
  },
};
