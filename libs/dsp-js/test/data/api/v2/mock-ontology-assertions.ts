/**
 * This class contains assertions for the mocked ontologies
 * so that the behave as the lib's ontology handling in production.
 */
export class MockOntologyAssertions {
  static resourcePropertyIndexesAnythingThing = [
    'http://api.knora.org/ontology/knora-api/v2#hasStandoffLinkTo',
    'http://api.knora.org/ontology/knora-api/v2#hasStandoffLinkToValue',
    'http://api.knora.org/ontology/knora-api/v2#hasIncomingLinkValue',
    'http://0.0.0.0:3333/ontology/0001/anything/v2#hasListItem',
    'http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherListItem',
    'http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThing',
    'http://0.0.0.0:3333/ontology/0001/anything/v2#hasOtherThingValue',
    'http://0.0.0.0:3333/ontology/0001/anything/v2#hasRichtext',
    'http://0.0.0.0:3333/ontology/0001/anything/v2#hasText',
    'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDate',
    'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInteger',
    'http://0.0.0.0:3333/ontology/0001/anything/v2#hasDecimal',
    'http://0.0.0.0:3333/ontology/0001/anything/v2#hasBoolean',
    'http://0.0.0.0:3333/ontology/0001/anything/v2#hasUri',
    'http://0.0.0.0:3333/ontology/0001/anything/v2#hasInterval',
    'http://0.0.0.0:3333/ontology/0001/anything/v2#hasColor',
    'http://0.0.0.0:3333/ontology/0001/anything/v2#hasGeometry',
    'http://0.0.0.0:3333/ontology/0001/anything/v2#hasGeoname',
    'http://0.0.0.0:3333/ontology/0001/anything/v2#hasThingDocument',
    'http://0.0.0.0:3333/ontology/0001/anything/v2#hasThingDocumentValue',
    'http://0.0.0.0:3333/ontology/0001/anything/v2#hasThingPicture',
    'http://0.0.0.0:3333/ontology/0001/anything/v2#hasThingPictureValue',
    'http://0.0.0.0:3333/ontology/0001/anything/v2#hasTimeStamp',
    'http://0.0.0.0:3333/ontology/0001/anything/v2#isPartOfOtherThing',
    'http://0.0.0.0:3333/ontology/0001/anything/v2#isPartOfOtherThingValue',
  ];

  static systemPropertyIndexesAnythingThing = [
    'http://api.knora.org/ontology/knora-api/v2#arkUrl',
    'http://api.knora.org/ontology/knora-api/v2#attachedToProject',
    'http://api.knora.org/ontology/knora-api/v2#attachedToUser',
    'http://api.knora.org/ontology/knora-api/v2#creationDate',
    'http://api.knora.org/ontology/knora-api/v2#deleteComment',
    'http://api.knora.org/ontology/knora-api/v2#deleteDate',
    'http://api.knora.org/ontology/knora-api/v2#deletedBy',
    'http://api.knora.org/ontology/knora-api/v2#hasPermissions',
    'http://api.knora.org/ontology/knora-api/v2#isDeleted',
    'http://api.knora.org/ontology/knora-api/v2#lastModificationDate',
    'http://api.knora.org/ontology/knora-api/v2#userHasPermission',
    'http://api.knora.org/ontology/knora-api/v2#versionArkUrl',
    'http://api.knora.org/ontology/knora-api/v2#versionDate',
  ];

  static propertyIndexesAnythingThing = MockOntologyAssertions.systemPropertyIndexesAnythingThing.concat(
    MockOntologyAssertions.resourcePropertyIndexesAnythingThing
  );
}
