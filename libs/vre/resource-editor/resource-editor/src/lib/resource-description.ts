import { Constants, IHasProperty, ReadResource } from '@dasch-swiss/dsp-js';

const HAS_SEGMENT_BOUNDS = `${Constants.KnoraApiV2 + Constants.HashDelimiter}hasSegmentBounds`;

function classProperties(resource: ReadResource): IHasProperty[] {
  // `entityInfo` is `!`-typed but can be absent: OntologyCache returns empty definitions for an
  // unknown class and bare test doubles omit it.
  return resource.entityInfo?.classes?.[resource.type]?.propertiesList ?? [];
}

/**
 * `kb:Segment` declares `hasSegmentBounds` exactly once; dsp-api flattens inherited
 * cardinalities into every class, so this covers project subclasses of `AudioSegment` and
 * `VideoSegment` as well.
 */
export function isSegmentClass(resource: ReadResource): boolean {
  return classProperties(resource).some(property => property.propertyIndex === HAS_SEGMENT_BOUNDS);
}

/**
 * The resource header shows and edits the description of project resources whose class has the
 * `hasDescription` cardinality (every class once dsp-api inherits it from `kb:Resource`).
 * knora-base classes instantiated directly (e.g. `knora-api:Region`, `knora-api:LinkObj`) inherit
 * it too but show none, and Segments keep their Description property row instead.
 */
export function showsDescriptionInHeader(resource: ReadResource): boolean {
  const isProjectClass = !resource.type.startsWith(`${Constants.KnoraApiV2}#`);
  const hasCardinality = classProperties(resource).some(
    property => property.propertyIndex === Constants.HasDescription
  );
  return isProjectClass && hasCardinality && !isSegmentClass(resource);
}
