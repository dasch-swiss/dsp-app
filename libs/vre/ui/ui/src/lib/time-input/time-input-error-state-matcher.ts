import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

export class TimeInputErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    if (control && Number.isNaN(control.value)) {
      control?.setErrors({ pattern: true });
      return true;
    }
    return !!(control && control.invalid && (control.dirty || control.touched));
  }
}
