import { IHasPropertyWithPropertyDefinition, PropertyDefinition, ReadValue } from '@dasch-swiss/dsp-js';

export interface PropertyInfoValues {
  guiDef: IHasPropertyWithPropertyDefinition;
  propDef: PropertyDefinition;
  values: ReadValue[];
}
