import {
  Constants,
  ReadLinkValue,
  ReadResource,
  ReadStillImageFileValue,
  ResourceClassDefinitionWithPropertyDefinition,
  ResourcePropertyDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';
import { ApiConstants } from '@dasch-swiss/vre/core/config';
import { PropertyInfoValues } from './property-info-values.interface';

/**
 * Contains every changes needed for displaying properties without bug.
 * It mainly removes unwanted property
 */
export class GenerateProperty {
  public static commonProperty(resource: ReadResource) {
    return this._commonFilter(this._initProps(resource), resource.type).map(this._displayExistingLinkedValues);
  }

  /** The properties `commonProperty` lists for any resource of the class, without values. */
  public static classProperty(resClass: ResourceClassDefinitionWithPropertyDefinition) {
    const props = resClass.getResourcePropertiesList().map(prop => ({
      // Safe cast: see `_initProps`; class definitions come from OntologyCache too.
      propDef: prop.propertyDefinition as ResourcePropertyDefinitionWithAllLanguages,
      guiDef: prop,
      values: [],
    }));
    return this._commonFilter(this._sortByGuiOrder(props), resClass.id);
  }

  private static _commonFilter(props: PropertyInfoValues[], resourceType: string) {
    return props
      .filter(prop => !prop.propDef.isLinkProperty)
      .filter(prop => !prop.propDef.subPropertyOf.includes(`${ApiConstants.apiKnoraOntologyUrl}#hasFileValue`))
      .filter(
        // temporary guard/feature flag after https://linear.app/dasch/issue/DEV-7433/resdescr-basic-implementation - removes hasDescription for all resources except AudioSegment and VideoSegment
        prop =>
          prop.propDef.id !== Constants.HasDescription ||
          resourceType === `${ApiConstants.apiKnoraOntologyUrl}#AudioSegment` ||
          resourceType === `${ApiConstants.apiKnoraOntologyUrl}#VideoSegment`
      );
  }

  public static incomingRessourceProperty(resource: ReadResource) {
    return this.commonProperty(resource).filter(
      v => v.propDef.id !== `${ApiConstants.apiKnoraOntologyUrl}#hasStillImageFileValue`
    );
  }

  public static regionProperty(resource: ReadResource) {
    return this.commonProperty(resource)
      .filter(v => v.propDef.objectType !== `${ApiConstants.apiKnoraOntologyUrl}#Representation`)
      .filter(v => v.propDef.id !== `${ApiConstants.apiKnoraOntologyUrl}#isRegionOfValue`);
  }

  public static segmentProperty(resource: ReadResource, type: 'VideoSegment' | 'AudioSegment') {
    return this.commonProperty(resource).filter(
      prop => prop.propDef.id !== `http://api.knora.org/ontology/knora-api/v2#is${type}OfValue`
    );
  }

  private static _initProps(resource: ReadResource): PropertyInfoValues[] {
    const props = resource.entityInfo.classes[resource.type].getResourcePropertiesList().map(prop => {
      // Safe cast: ReadResource.entityInfo is populated from OntologyCache, which always
      // requests allLanguages=true (see OntologyCache.requestItemFromKnora), so property
      // definitions are deserialized as the WithAllLanguages subclass at runtime.
      const propDef = prop.propertyDefinition as ResourcePropertyDefinitionWithAllLanguages;
      let propInfoAndValues: PropertyInfoValues;

      switch (propDef.objectType) {
        case Constants.StillImageFileValue:
          propInfoAndValues = {
            propDef,
            guiDef: prop,
            values: resource.getValuesAs(prop.propertyIndex, ReadStillImageFileValue),
          };
          break;

        default:
          // the object type is none from above
          propInfoAndValues = {
            propDef,
            guiDef: prop,
            values: resource.getValues(prop.propertyIndex),
          };
      }
      return propInfoAndValues;
    });

    return this._sortByGuiOrder(props);
  }

  private static _sortByGuiOrder(props: PropertyInfoValues[]): PropertyInfoValues[] {
    // sort properties by guiOrder
    return (
      props
        .filter(prop => prop.propDef.objectType !== Constants.GeomValue)
        .sort((a, b) => {
          const orderA = a.guiDef?.guiOrder ?? 0;
          const orderB = b.guiDef?.guiOrder ?? 0;
          return orderA - orderB;
        }) // to get equal results on all browser engines which implements sorting in different way
        // properties list has to be sorted again, pushing all "has..." properties to the bottom
        // TODO FOLLOWING LINE IS A BUG ARRAY-CALLBACK-RETURN SHOULDNT BE DISABLED
        // eslint-disable-next-line array-callback-return
        .sort(a => {
          if (a.guiDef.guiOrder === undefined) {
            return 1;
          } else {
            return 0;
          }
        })
    );
  }

  private static _displayExistingLinkedValues = (prop: PropertyInfoValues) => {
    if (prop.propDef.objectType === Constants.LinkValue) {
      prop.values = prop.values.filter(value => {
        return (value as ReadLinkValue).linkedResource !== undefined;
      });
    }
    return prop;
  };
}
