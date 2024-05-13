import {
  Constants,
  IHasPropertyWithPropertyDefinition,
  ReadResource,
  ReadStillImageFileValue,
} from '@dasch-swiss/dsp-js';
import { PropertyInfoValues } from './property-info-values.interface';

export class Common {
  /** gather propoerties information */
  public static initProps(resource: ReadResource): PropertyInfoValues[] {
    let props = resource.entityInfo.classes[resource.type]
      .getResourcePropertiesList()
      .map((prop: IHasPropertyWithPropertyDefinition) => {
        let propInfoAndValues: PropertyInfoValues;

        switch (prop.propertyDefinition.objectType) {
          case Constants.StillImageFileValue:
            propInfoAndValues = {
              propDef: prop.propertyDefinition,
              guiDef: prop,
              values: resource.getValuesAs(prop.propertyIndex, ReadStillImageFileValue),
            };

            /*
                                                                                                                                                                                                TODO Julien: I removed this part
                                                                                                                                                                                                const stillImageRepresentations = [
                                                                                                                                                                                                  new FileRepresentation(
                                                                                                                                                                                                    resource.getValuesAs(Constants.HasStillImageFileValue, ReadStillImageFileValue)[0],
                                                                                                                                                                                                    []
                                                                                                                                                                                                  ),
                                                                                                                                                                                                ];

                                                                                                                                                                                                this.representationsToDisplay = stillImageRepresentations;

                                                                                                                                                                                                */
            // --> TODO: get regions here

            break;

          default:
            // the object type is none from above
            propInfoAndValues = {
              propDef: prop.propertyDefinition,
              guiDef: prop,
              values: resource.getValues(prop.propertyIndex),
            };
        }
        return propInfoAndValues;
      });

    // sort properties by guiOrder
    props = props
      .filter(prop => prop.propDef.objectType !== Constants.GeomValue)
      .sort((a, b) => (a.guiDef.guiOrder > b.guiDef.guiOrder ? 1 : -1))
      // to get equal results on all browser engines which implements sorting in different way
      // properties list has to be sorted again, pushing all "has..." properties to the bottom
      // TODO FOLLOWING LINE IS A BUG ARRAY-CALLBACK-RETURN SHOULDNT BE DISABLED
      // eslint-disable-next-line array-callback-return
      .sort(a => {
        if (a.guiDef.guiOrder === undefined) {
          return 1;
        }
      });

    return props;
  }
}
