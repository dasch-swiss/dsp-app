import { ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';
import { PropertyDefinition } from '@dasch-swiss/dsp-js/src/models/v2/ontologies/property-definition';

export class JsLibPotentialError {
  static setAs(propertyDefinition: PropertyDefinition) {
    return propertyDefinition as unknown as ResourcePropertyDefinition;
  }
}
