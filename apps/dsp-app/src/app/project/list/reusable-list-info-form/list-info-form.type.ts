import { FormGroup } from '@angular/forms';
import { MultiLanguageFormArray } from '@dasch-swiss/vre/shared/app-string-literal';

export type ListInfoForm = FormGroup<{
  labels: MultiLanguageFormArray;
  comments: MultiLanguageFormArray;
}>;
