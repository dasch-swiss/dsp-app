import { FormControl, FormGroup } from '@angular/forms';
import { FileForm } from '@dasch-swiss/vre/resource-editor/representations';
import { FormValueArray } from '@dasch-swiss/vre/resource-editor/resource-properties';

export interface CreateResourceFormInterface {
  label: FormControl<string>;
  properties: FormGroup<{ [key: string]: FormValueArray }>;
  file?: FileForm;
}
