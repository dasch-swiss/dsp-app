export interface ListNode {
  '@id': string;
  'rdfs:label': string;
  'knora-api:isRootNode': string;
  'knora-api:hasSubListNode': ListNode[];
}
