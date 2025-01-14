import { StringLiteralV2 } from './string-literal.v2';

export interface ResourcePropertyDefinitionWithAllLanguages {
  '@id': string;
  'knora-api:subjectType': string;
  'knora-api:objectType': string;
  'knora-api:isLinkProperty': boolean;
  comment?: string;
  'rdfs:subPropertyOf'?: string;
  guiElement?: string;
  guiAttributes?: string;
  'rdfs:label': StringLiteralV2[];
}
