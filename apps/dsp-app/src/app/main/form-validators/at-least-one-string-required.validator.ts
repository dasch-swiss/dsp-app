// Custom validator function
import { FormArray, ValidatorFn } from '@angular/forms';

export function atLeastOneStringRequired(objectKey: string): ValidatorFn {
  return (formArray: FormArray): { [key: string]: any } | null => {
    const hasValidChild = formArray.controls.some(control => {
      const value = control.get(objectKey).value;
      return typeof value === 'string' && value.trim().length > 0;
    });

    return hasValidChild ? null : { required: true };
  };
}
