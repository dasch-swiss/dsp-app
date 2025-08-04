import {
  Constants,
  IHasProperty,
  ResourceClassDefinitionWithAllLanguages,
  ResourcePropertyDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';
import { StringLiteralV2 } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { DefaultProperty, DefaultResourceClasses } from '@dasch-swiss/vre/shared/app-helper-services';
import { UpdateResourceClassData } from './forms/resource-class-form/resource-class-form.type';

export interface PropertyInfo {
  propDef: ResourcePropertyDefinitionWithAllLanguages;
  propType: DefaultProperty;
  baseOntologyId: string;
  baseOntologyLabel: string;
  usedByClasses: ClassShortInfo[];
  objectLabels: StringLiteralV2[];
  objectComments: StringLiteralV2[];
}

export interface ClassPropertyInfo extends PropertyInfo {
  iHasProperty: IHasProperty;
  classId: string;
}

export class ResourceClassInfo {
  constructor(
    private _resClass: ResourceClassDefinitionWithAllLanguages,
    public properties: ClassPropertyInfo[]
  ) {}

  get id() {
    return this._resClass.id;
  }

  get label() {
    return this._resClass.label || '';
  }

  get labels() {
    return this._resClass.labels;
  }

  get comment() {
    return this._resClass.comment || '';
  }

  get comments() {
    return this._resClass.comments;
  }

  get updateResourceClassData(): UpdateResourceClassData {
    return this._resClass as UpdateResourceClassData;
  }

  get name(): string {
    return this._resClass.id.split('#')[1];
  }

  get defaultClassLabel() {
    return this._resClass.subClassOf
      .sort((a, b) => {
        // sort so internal Knora classes come first, followed by external ones if any
        const aIsKnora = a.startsWith(Constants.KnoraApiV2) ? -1 : 1;
        const bIsKnora = b.startsWith(Constants.KnoraApiV2) ? -1 : 1;
        return aIsKnora - bIsKnora;
      })
      .map(superIri => DefaultResourceClasses.getLabel(superIri))
      .filter(Boolean)
      .join(', ');
  }

  get defaultClassIcon() {
    return this._resClass.subClassOf.map(superIri => DefaultResourceClasses.getIcon(superIri)).filter(Boolean)[0];
  }

  get iHasProperties(): IHasProperty[] {
    return this._resClass.propertiesList || [];
  }

  get resourceClassDefinition(): ResourceClassDefinitionWithAllLanguages {
    return this._resClass;
  }
}

export interface PropToAdd {
  ontologyId: string;
  ontologyLabel: string;
  properties: PropertyInfo[];
}

export interface ClassShortInfo {
  id: string;
  labels: StringLiteralV2[];
  comments: StringLiteralV2[];
  restrictedToClass?: string;
}
