import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { MultiLanguageFormArray } from '@dasch-swiss/vre/shared/app-string-literal';

export type ProjectForm = FormGroup<{
  shortcode: FormControl<string>;
  shortname: FormControl<string>;
  longname: FormControl<string>;
  description: MultiLanguageFormArray;
  keywords: FormArray<FormControl<string>>;
}>;
