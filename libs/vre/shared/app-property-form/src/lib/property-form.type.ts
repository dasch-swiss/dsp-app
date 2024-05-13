import { FormControl, FormGroup } from '@angular/forms';
import { Cardinality } from '@dasch-swiss/dsp-js';
import { MultiLanguageForm } from '@dasch-swiss/vre/shared/app-string-literal';

export type PropertyForm = FormGroup<{
  propType: FormControl<string>;
  name: FormControl<string>;
  labels: MultiLanguageForm;
  comments: MultiLanguageForm;
  guiAttr: FormControl<string>;
  cardinality: FormControl<Cardinality>;
}>;
