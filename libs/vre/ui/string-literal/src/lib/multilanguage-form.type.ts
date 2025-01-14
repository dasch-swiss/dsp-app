import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { DaschLanguage } from './dash-language.type';

export type MultiLanguageForm = FormArray<
  FormGroup<{
    language: FormControl<DaschLanguage>;
    value: FormControl<string>;
  }>
>;
