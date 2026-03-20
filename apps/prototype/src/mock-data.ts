/**
 * Realistic fixture data based on the Incunabula test project.
 * Uses real ontology IRIs and property structures from the DSP test data.
 */

export interface MockOntology {
  iri: string;
  label: string;
}

export interface MockResourceClass {
  iri: string;
  label: string;
  icon?: string;
}

export interface MockProperty {
  iri: string;
  label: string;
  objectType: string;
  isLinkedResourceProperty: boolean;
  icon?: string;
  listIri?: string;
}

/** Map objectType to icon, based on DefaultProperties in default-properties.ts */
const PROPERTY_TYPE_ICONS: Record<string, string> = {
  'http://api.knora.org/ontology/knora-api/v2#TextValue': 'short_text',
  'http://api.knora.org/ontology/knora-api/v2#DateValue': 'calendar_today',
  'http://api.knora.org/ontology/knora-api/v2#IntValue': '60fps',
  'http://api.knora.org/ontology/knora-api/v2#DecimalValue': 'functions',
  'http://api.knora.org/ontology/knora-api/v2#BooleanValue': 'toggle_off',
  'http://api.knora.org/ontology/knora-api/v2#ListValue': 'arrow_drop_down_circle',
  'http://api.knora.org/ontology/knora-api/v2#UriValue': 'language',
  'http://api.knora.org/ontology/knora-api/v2#ColorValue': 'palette',
  'http://api.knora.org/ontology/knora-api/v2#GeonameValue': 'place',
  'http://api.knora.org/ontology/knora-api/v2#TimeValue': 'access_time',
  'http://api.knora.org/ontology/knora-api/v2#IntervalValue': 'timelapse',
};

export function getIconForProperty(prop: MockProperty): string {
  if (prop.isLinkedResourceProperty) return 'link';
  return PROPERTY_TYPE_ICONS[prop.objectType] || 'data_object';
}

/** Mock list nodes for the Language list property */
export interface MockListNode {
  iri: string;
  label: string;
  children?: MockListNode[];
}

export const LANGUAGE_LIST_NODES: MockListNode[] = [
  { iri: 'http://rdfh.ch/lists/0803/lang-latin', label: 'Latin' },
  { iri: 'http://rdfh.ch/lists/0803/lang-german', label: 'German' },
  { iri: 'http://rdfh.ch/lists/0803/lang-french', label: 'French' },
  { iri: 'http://rdfh.ch/lists/0803/lang-italian', label: 'Italian' },
  { iri: 'http://rdfh.ch/lists/0803/lang-dutch', label: 'Dutch' },
  { iri: 'http://rdfh.ch/lists/0803/lang-hebrew', label: 'Hebrew' },
];

/** Map list property IRIs to their list nodes */
export const LIST_NODES_BY_PROPERTY: Record<string, MockListNode[]> = {
  'http://0.0.0.0:3333/ontology/0803/incunabula/v2#hasLanguage': LANGUAGE_LIST_NODES,
};

export interface MockSearchResult {
  iri: string;
  label: string;
  resourceClassLabel: string;
  properties: Record<string, string>;
}

export const INCUNABULA_ONTOLOGY: MockOntology = {
  iri: 'http://0.0.0.0:3333/ontology/0803/incunabula/v2',
  label: 'Incunabula',
};

export const RESOURCE_CLASSES: MockResourceClass[] = [
  { iri: 'http://0.0.0.0:3333/ontology/0803/incunabula/v2#book', label: 'Book', icon: 'insert_drive_file' },
  { iri: 'http://0.0.0.0:3333/ontology/0803/incunabula/v2#page', label: 'Page', icon: 'photo' },
];

export const BOOK_PROPERTIES: MockProperty[] = [
  {
    iri: 'http://0.0.0.0:3333/ontology/0803/incunabula/v2#title',
    label: 'Title',
    objectType: 'http://api.knora.org/ontology/knora-api/v2#TextValue',
    isLinkedResourceProperty: false,
  },
  {
    iri: 'http://0.0.0.0:3333/ontology/0803/incunabula/v2#hasAuthor',
    label: 'Creator',
    objectType: 'http://api.knora.org/ontology/knora-api/v2#TextValue',
    isLinkedResourceProperty: false,
  },
  {
    iri: 'http://0.0.0.0:3333/ontology/0803/incunabula/v2#publisher',
    label: 'Publisher',
    objectType: 'http://api.knora.org/ontology/knora-api/v2#TextValue',
    isLinkedResourceProperty: false,
  },
  {
    iri: 'http://0.0.0.0:3333/ontology/0803/incunabula/v2#publoc',
    label: 'Publication Location',
    objectType: 'http://api.knora.org/ontology/knora-api/v2#TextValue',
    isLinkedResourceProperty: false,
  },
  {
    iri: 'http://0.0.0.0:3333/ontology/0803/incunabula/v2#pubdate',
    label: 'Publication Date',
    objectType: 'http://api.knora.org/ontology/knora-api/v2#DateValue',
    isLinkedResourceProperty: false,
  },
  {
    iri: 'http://0.0.0.0:3333/ontology/0803/incunabula/v2#description',
    label: 'Description',
    objectType: 'http://api.knora.org/ontology/knora-api/v2#TextValue',
    isLinkedResourceProperty: false,
  },
  {
    iri: 'http://0.0.0.0:3333/ontology/0803/incunabula/v2#book_comment',
    label: 'Comment',
    objectType: 'http://api.knora.org/ontology/knora-api/v2#TextValue',
    isLinkedResourceProperty: false,
  },
  {
    iri: 'http://0.0.0.0:3333/ontology/0803/incunabula/v2#physical_desc',
    label: 'Physical Description',
    objectType: 'http://api.knora.org/ontology/knora-api/v2#TextValue',
    isLinkedResourceProperty: false,
  },
  {
    iri: 'http://0.0.0.0:3333/ontology/0803/incunabula/v2#hasLanguage',
    label: 'Language',
    objectType: 'http://api.knora.org/ontology/knora-api/v2#ListValue',
    isLinkedResourceProperty: false,
  },
  {
    iri: 'http://0.0.0.0:3333/ontology/0803/incunabula/v2#hasColor',
    label: 'Binding Color',
    objectType: 'http://api.knora.org/ontology/knora-api/v2#ColorValue',
    isLinkedResourceProperty: false,
  },
  {
    iri: 'http://0.0.0.0:3333/ontology/0803/incunabula/v2#hasUrl',
    label: 'URL',
    objectType: 'http://api.knora.org/ontology/knora-api/v2#UriValue',
    isLinkedResourceProperty: false,
  },
  {
    iri: 'http://0.0.0.0:3333/ontology/0803/incunabula/v2#isPublished',
    label: 'Is Published',
    objectType: 'http://api.knora.org/ontology/knora-api/v2#BooleanValue',
    isLinkedResourceProperty: false,
  },
  {
    iri: 'http://0.0.0.0:3333/ontology/0803/incunabula/v2#hasPageCount',
    label: 'Page Count',
    objectType: 'http://api.knora.org/ontology/knora-api/v2#IntValue',
    isLinkedResourceProperty: false,
  },
  {
    iri: 'http://0.0.0.0:3333/ontology/0803/incunabula/v2#references',
    label: 'References',
    objectType: 'http://0.0.0.0:3333/ontology/0803/incunabula/v2#book',
    isLinkedResourceProperty: true,
  },
];

export const PAGE_PROPERTIES: MockProperty[] = [
  {
    iri: 'http://0.0.0.0:3333/ontology/0803/incunabula/v2#pagenum',
    label: 'Page Number',
    objectType: 'http://api.knora.org/ontology/knora-api/v2#TextValue',
    isLinkedResourceProperty: false,
  },
  {
    iri: 'http://0.0.0.0:3333/ontology/0803/incunabula/v2#partOf',
    label: 'Part of',
    objectType: 'http://0.0.0.0:3333/ontology/0803/incunabula/v2#book',
    isLinkedResourceProperty: true,
  },
  {
    iri: 'http://0.0.0.0:3333/ontology/0803/incunabula/v2#seqnum',
    label: 'Sequence Number',
    objectType: 'http://api.knora.org/ontology/knora-api/v2#IntValue',
    isLinkedResourceProperty: false,
  },
];

export const PROPERTIES_BY_CLASS: Record<string, MockProperty[]> = {
  'http://0.0.0.0:3333/ontology/0803/incunabula/v2#book': BOOK_PROPERTIES,
  'http://0.0.0.0:3333/ontology/0803/incunabula/v2#page': PAGE_PROPERTIES,
};

/** All properties across all classes, deduped by IRI */
export const ALL_PROPERTIES: MockProperty[] = Object.values(PROPERTIES_BY_CLASS)
  .flat()
  .filter((prop, index, self) => self.findIndex(p => p.iri === prop.iri) === index);

export const TEXT_OPERATORS = ['equals', 'does not equal', 'is like', 'matches', 'exists', 'does not exist'];
export const DATE_OPERATORS = ['equals', 'does not equal', 'greater than', 'greater than or equal to', 'less than', 'less than or equal to', 'exists', 'does not exist'];
export const INT_OPERATORS = ['equals', 'does not equal', 'greater than', 'greater than or equal to', 'less than', 'less than or equal to', 'exists', 'does not exist'];
export const BOOLEAN_OPERATORS = ['equals', 'exists', 'does not exist'];
export const LIST_OPERATORS = ['equals', 'does not equal', 'exists', 'does not exist'];
export const URI_OPERATORS = ['equals', 'does not equal', 'exists', 'does not exist'];
export const COLOR_OPERATORS = ['equals', 'does not equal', 'exists', 'does not exist'];
export const EXISTENCE_ONLY_OPERATORS = ['exists', 'does not exist'];
export const LINK_OPERATORS = ['equals', 'does not equal', 'exists', 'does not exist', 'matches'];

export function getOperatorsForType(objectType: string): string[] {
  if (objectType.includes('TextValue')) return TEXT_OPERATORS;
  if (objectType.includes('DateValue')) return DATE_OPERATORS;
  if (objectType.includes('IntValue') || objectType.includes('DecimalValue')) return INT_OPERATORS;
  if (objectType.includes('BooleanValue')) return BOOLEAN_OPERATORS;
  if (objectType.includes('ListValue')) return LIST_OPERATORS;
  if (objectType.includes('UriValue')) return URI_OPERATORS;
  if (objectType.includes('ColorValue')) return COLOR_OPERATORS;
  if (objectType.includes('GeonameValue') || objectType.includes('GeomValue')) return EXISTENCE_ONLY_OPERATORS;
  if (objectType.includes('LinkValue')) return LINK_OPERATORS;
  // Linked resource property (objectType is a class IRI, not a value type)
  return LINK_OPERATORS;
}

export const MOCK_SEARCH_RESULTS: MockSearchResult[] = [
  {
    iri: 'http://rdfh.ch/0803/c5058f3a',
    label: 'Zeitglöcklein des Lebens und Leidens Christi',
    resourceClassLabel: 'Book',
    properties: { 'Creator': 'Berthold, der Bruder', 'Publication Location': 'Basel', 'Publication Date': 'JULIAN:1492' },
  },
  {
    iri: 'http://rdfh.ch/0803/ff17e5ef9601',
    label: 'Narrenschiff',
    resourceClassLabel: 'Book',
    properties: { 'Creator': 'Sebastian Brant', 'Publication Location': 'Basel', 'Publication Date': 'JULIAN:1494' },
  },
  {
    iri: 'http://rdfh.ch/0803/7e4cfc5b02',
    label: 'Lied der Nibelungen',
    resourceClassLabel: 'Book',
    properties: { 'Creator': 'Unknown', 'Publication Location': 'Strassburg', 'Publication Date': 'JULIAN:1485' },
  },
  {
    iri: 'http://rdfh.ch/0803/482a33d65602',
    label: 'Heilsspiegel (Speculum humanae salvationis)',
    resourceClassLabel: 'Book',
    properties: { 'Creator': 'Unknown', 'Publication Location': 'Basel', 'Publication Date': 'JULIAN:1476' },
  },
  {
    iri: 'http://rdfh.ch/0803/7bbb8e59bc04',
    label: 'Von der Arznei beider Glück',
    resourceClassLabel: 'Book',
    properties: { 'Creator': 'Petrarca, Francesco', 'Publication Location': 'Augsburg', 'Publication Date': 'JULIAN:1532' },
  },
  {
    iri: 'http://rdfh.ch/0803/318a29c41a05',
    label: 'Chronica. Dt.',
    resourceClassLabel: 'Book',
    properties: { 'Creator': 'Rolevinck, Werner', 'Publication Location': 'Lübeck', 'Publication Date': 'JULIAN:1474' },
  },
  {
    iri: 'http://rdfh.ch/0803/5e77e98d02',
    label: 'Margarita Philosophica',
    resourceClassLabel: 'Book',
    properties: { 'Creator': 'Gregor Reisch', 'Publication Location': 'Freiburg', 'Publication Date': 'JULIAN:1503' },
  },
];
