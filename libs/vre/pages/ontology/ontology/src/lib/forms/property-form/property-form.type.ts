import { FormControl, FormGroup } from '@angular/forms';
import { ClassDefinition } from '@dasch-swiss/dsp-js';
import { StringLiteralV2 } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { DefaultProperty } from '@dasch-swiss/vre/shared/app-helper-services';
import { MultiLanguageForm } from '@dasch-swiss/vre/ui/string-literal';

export type PropertyForm = FormGroup<{
  guiElement: FormControl<string>;
  name: FormControl<string>;
  labels: MultiLanguageForm;
  comments: MultiLanguageForm;
  guiAttr: FormControl<string>;
  objectType: FormControl<string>;
}>;

export interface EditPropertyDialogData {
  id?: string;
  propType: DefaultProperty;
  name?: string;
  label?: StringLiteralV2[];
  comment?: StringLiteralV2[];
  guiElement: string;
  guiAttribute?: string;
  objectType?: string;
}

export interface CreatePropertyDialogData {
  propType: DefaultProperty;
  assignToClass?: ClassDefinition; // class ID to which the property should be assigned
}

export interface UpdatePropertyData {
  id: string;
  labels?: StringLiteralV2[];
  comment?: StringLiteralV2[];
}

export interface CreatePropertyData {
  name: string;
  labels: StringLiteralV2[];
  comment: StringLiteralV2[];
  propType: DefaultProperty;
  guiAttribute?: string;
  objectType?: string;
}
