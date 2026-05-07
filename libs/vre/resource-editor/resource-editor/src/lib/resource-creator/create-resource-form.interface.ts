import { FormControl, FormGroup } from '@angular/forms';
import { FormValueArray } from '../properties/properties-display/property-value/form-value-array.type';
import { FileForm } from '../representation/file-form.type';

export interface CreateResourceFormInterface {
  label: FormControl<string>;
  properties: FormGroup<{ [key: string]: FormValueArray }>;
  file?: FileForm;
}
