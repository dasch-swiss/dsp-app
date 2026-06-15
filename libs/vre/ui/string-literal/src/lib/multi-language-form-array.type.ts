import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { AvailableLanguage } from '@dasch-swiss/vre/core/config';

export type MultiLanguageFormControl = FormGroup<{
  language: FormControl<AvailableLanguage>;
  value: FormControl<string>;
}>;

export type MultiLanguageFormArray = FormArray<MultiLanguageFormControl>;
