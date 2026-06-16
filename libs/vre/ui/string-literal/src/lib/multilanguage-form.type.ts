import { FormArray, FormControl, FormGroup } from '@angular/forms';
import { AvailableLanguage } from '@dasch-swiss/vre/core/config';

export type MultiLanguageForm = FormArray<
  FormGroup<{
    language: FormControl<AvailableLanguage>;
    value: FormControl<string>;
  }>
>;
