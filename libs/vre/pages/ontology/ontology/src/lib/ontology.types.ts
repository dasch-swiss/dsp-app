import {
  IHasProperty,
  ResourceClassDefinitionWithAllLanguages,
  ResourcePropertyDefinitionWithAllLanguages,
} from '@dasch-swiss/dsp-js';
import { DefaultProperty, DefaultResourceClasses } from '@dasch-swiss/vre/shared/app-helper-services';
import { UpdateResourceClassData } from './forms/resource-class-form/resource-class-form.type';

export interface PropertyInfo {
  propDef: ResourcePropertyDefinitionWithAllLanguages;
  propType: DefaultProperty;
  baseOntologyId: string;
  baseOntologyLabel: string;
  usedByClasses: ClassShortInfo[]; // populate this
  objectLabel?: string;
  objectComment?: string;
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
  label: string;
  comment: string;
  restrictedToClass?: string;
}
