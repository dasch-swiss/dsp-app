import { FormControl, FormGroup } from '@angular/forms';

export interface IsSwitchComponent {
  control: FormControl<any> | FormGroup;
  displayMode: boolean;
}
