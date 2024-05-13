import { AbstractControl, FormArray, FormControl, FormGroup } from '@angular/forms';

export type FormValueGroup = FormGroup<{ item: AbstractControl; comment: FormControl<string | null> }>;
export type FormValueArray = FormArray<FormValueGroup>;
