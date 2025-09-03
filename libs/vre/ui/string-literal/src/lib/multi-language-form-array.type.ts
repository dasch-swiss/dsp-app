import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { DaschLanguage } from '@dasch-swiss/vre/core/config';

export type MultiLanguageFormControl = FormGroup<{
  language: FormControl<DaschLanguage>;
  value: FormControl<string>;
}>;

export type MultiLanguageFormArray = FormArray<MultiLanguageFormControl>;
