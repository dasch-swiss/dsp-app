import { FormArray, FormControl, FormGroup, ValidatorFn } from '@angular/forms';
import { StringLiteralWithLanguage } from '@dasch-swiss/vre/3rd-party-services/open-api';
import { AvailableLanguage } from '@dasch-swiss/vre/core/config';
import { MultiLanguageForm } from './multilanguage-form.type';

export const DEFAULT_MULTILANGUAGE_FORM = (
  data: StringLiteralWithLanguage[],
  controlValidators?: ValidatorFn[],
  arrayValidators?: ValidatorFn[]
) => {
  return new FormArray(
    data.map(
      item =>
        new FormGroup({
          language: new FormControl<AvailableLanguage>(item.language as AvailableLanguage, { nonNullable: true }),
          value: new FormControl(item.value, { validators: controlValidators, nonNullable: true }),
        })
    ),
    arrayValidators
  ) as MultiLanguageForm;
};
