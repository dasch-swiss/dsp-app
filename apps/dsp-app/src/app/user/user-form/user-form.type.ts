import { FormControl, FormGroup } from '@angular/forms';

export type UserForm = FormGroup<{
  givenName: FormControl<string>;
  familyName: FormControl<string>;
  email: FormControl<string>;
  username: FormControl<string>;
  password: FormControl<string>;
  lang: FormControl<string>;
  systemAdmin: FormControl<boolean>;
}>;
