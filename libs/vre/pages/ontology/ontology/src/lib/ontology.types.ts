import { ResourcePropertyDefinitionWithAllLanguages } from '@dasch-swiss/dsp-js';
import { StringLiteralV2 } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { DefaultProperty } from '@dasch-swiss/vre/shared/app-helper-services';

export interface PropertyInfo {
  propDef: ResourcePropertyDefinitionWithAllLanguages;
  propType: DefaultProperty;
  baseOntologyId: string;
  baseOntologyLabel: string;
  usedByClasses: ClassShortInfo[];
  objectLabels: StringLiteralV2[];
  objectComments: StringLiteralV2[];
}

export interface ClassShortInfo {
  id: string;
  labels: StringLiteralV2[];
  comments: StringLiteralV2[];
  restrictedToClass?: string;
}
