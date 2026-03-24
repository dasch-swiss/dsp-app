import { PropertyDefinition, ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';

export class JsLibPotentialError {
  static setAs(propertyDefinition: PropertyDefinition) {
    return propertyDefinition as unknown as ResourcePropertyDefinition;
  }
}
