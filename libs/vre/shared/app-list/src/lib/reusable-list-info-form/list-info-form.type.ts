import { FormGroup } from '@angular/forms';
import { MultiLanguageFormArray } from '@dasch-swiss/vre/ui/string-literal';

export type ListInfoForm = FormGroup<{
  labels: MultiLanguageFormArray;
  comments: MultiLanguageFormArray;
}>;
