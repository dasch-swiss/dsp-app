import { FormControl, FormGroup } from '@angular/forms';
import { StringLiteral } from '@dasch-swiss/dsp-js';
import { MultiLanguageFormArray } from '@dasch-swiss/vre/ui/string-literal';

export type ResourceClassForm = FormGroup<{
  name: FormControl<string>;
  labels: MultiLanguageFormArray;
  comments: MultiLanguageFormArray;
}>;

export interface ResourceClassFormData {
  name: string;
  labels: StringLiteral[];
  comments: StringLiteral[];
}

export interface UpdateResourceClassData {
  id: string;
  labels?: StringLiteral[];
  comments?: StringLiteral[];
}
