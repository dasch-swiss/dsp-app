import { FormControl, FormGroup } from '@angular/forms';
import { MultiLanguageFormArray } from '@dasch-swiss/vre/shared/app-string-literal';

export type ResourceClassForm = FormGroup<{
  name: FormControl<string>;
  labels: MultiLanguageFormArray;
  comments: MultiLanguageFormArray;
}>;
