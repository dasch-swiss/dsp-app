import { FormControl, FormGroup } from '@angular/forms';

export interface OntologyFormProps {
  projectIri: string;
  ontologyIri?: string;
}

export type OntologyForm = FormGroup<{
  name: FormControl<string>;
  label: FormControl<string>;
  comment: FormControl<string>;
}>;
