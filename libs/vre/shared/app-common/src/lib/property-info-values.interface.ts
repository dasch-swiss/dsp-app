import {
  IHasPropertyWithPropertyDefinition,
  ReadValue,
  ResourcePropertyDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';

export interface PropertyInfoValues {
  guiDef: IHasPropertyWithPropertyDefinition;
  propDef: ResourcePropertyDefinitionWithAllLanguages;
  values: ReadValue[];
}
