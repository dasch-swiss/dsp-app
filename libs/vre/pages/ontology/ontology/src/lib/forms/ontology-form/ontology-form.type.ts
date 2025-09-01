import { FormControl, FormGroup } from '@angular/forms';

export interface UpdateOntologyData {
  id: string;
  label: string;
  comment: string;
}

export type OntologyForm = FormGroup<{
  name?: FormControl<string>;
  label: FormControl<string>;
  comment: FormControl<string>;
}>;
