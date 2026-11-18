import { FormControl, FormGroup } from '@angular/forms';
import { StringLiteral } from '@dasch-swiss/dsp-js';
import { MultiLanguageFormArray } from '@dasch-swiss/vre/ui/string-literal';

export type ResourceClassForm = FormGroup<{
  name: FormControl<string>;
  labels: MultiLanguageFormArray;
  comments: MultiLanguageFormArray;
}>;

/** The text an edit dialog opens on, its field focused in that language. */
export interface TextFocus {
  field: 'label' | 'description';
  language: string;
}

export interface ResourceClassFormData {
  name: string;
  labels: StringLiteral[];
  comments: StringLiteral[];
  focus?: TextFocus;
}

export interface UpdateResourceClassData {
  id: string;
  labels?: StringLiteral[];
  comments?: StringLiteral[];
}
