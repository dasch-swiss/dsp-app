import { IHasPropertyWithPropertyDefinition, ResourcePropertyDefinition } from '@dasch-swiss/dsp-js';

export class JsLibPotentialError {
  static setAs(propertyDefinition: IHasPropertyWithPropertyDefinition['propertyDefinition']) {
    return propertyDefinition as unknown as ResourcePropertyDefinition;
  }
}
