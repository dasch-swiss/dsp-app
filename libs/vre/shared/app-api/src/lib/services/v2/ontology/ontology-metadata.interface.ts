export interface OntologyMetadata {
  '@id': string;
  '@type': string;
  'rdfs:label': string;
  comment?: string;
  'knora-api:lastModificationDate'?: string;
  'knora-api:attachedToProject'?: string;
}
