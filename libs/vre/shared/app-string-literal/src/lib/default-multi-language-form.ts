import { FormArray, FormControl, FormGroup, ValidatorFn } from '@angular/forms';
import { StringLiteralV2 } from '@dasch-swiss/vre/open-api';
import { DaschLanguage } from './dash-language.type';

export const DEFAULT_MULTILANGUAGE_FORM = (
  data: StringLiteralV2[],
  controlValidators?: ValidatorFn[],
  arrayValidators?: ValidatorFn[]
) => {
  return new FormArray(
    data.map(
      item =>
        new FormGroup({
          language: new FormControl<DaschLanguage>(item.language as DaschLanguage),
          value: new FormControl(item.value, { validators: controlValidators }),
        })
    ),
    arrayValidators
  );
};
