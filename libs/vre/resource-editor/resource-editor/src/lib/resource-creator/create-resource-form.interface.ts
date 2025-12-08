import { FormControl, FormGroup } from '@angular/forms';
import { FileForm } from '../representations/file-form.type';
import { FormValueArray } from '../resource-properties/form-value-array.type';

export interface CreateResourceFormInterface {
  label: FormControl<string>;
  properties: FormGroup<{ [key: string]: FormValueArray }>;
  file?: FileForm;
}
