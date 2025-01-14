import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { DaschLanguage } from './dash-language.type';

type MultiLanguageFormControl = FormGroup<{
  language: FormControl<DaschLanguage>;
  value: FormControl<string>;
}>;

export type MultiLanguageFormArray = FormArray<MultiLanguageFormControl>;
