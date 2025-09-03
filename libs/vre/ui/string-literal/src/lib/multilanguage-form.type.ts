import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { DaschLanguage } from '@dasch-swiss/vre/core/config';

export type MultiLanguageForm = FormArray<
  FormGroup<{
    language: FormControl<DaschLanguage>;
    value: FormControl<string>;
  }>
>;
