import { FormGroup } from '@angular/forms';
import { MultiLanguageFormArray } from '@dasch-swiss/vre/shared/app-string-literal';

export type ListItemForm = FormGroup<{
  labels: MultiLanguageFormArray;
  comments: MultiLanguageFormArray;
}>;
