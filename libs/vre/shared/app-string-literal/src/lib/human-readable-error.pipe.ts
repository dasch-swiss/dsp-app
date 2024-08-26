import { Pipe, PipeTransform } from '@angular/core';
import { ValidatorError } from './validator-error.interface';

@Pipe({
  name: 'humanReadableError',
  standalone: true,
})
export class HumanReadableErrorPipe implements PipeTransform {
  transform(error: object, params: ValidatorError[] | null = null): string {
    if (error.hasOwnProperty('required')) {
      return 'This field is required';
    }

    if (params) {
      for (const { errorKey, message } of params) {
        if (error.hasOwnProperty(errorKey)) return message;
      }
    }

    if (error.hasOwnProperty('minlength')) {
      return `The length must be greater than or equal to ${
        (
          error['minlength'] as {
            requiredLength: number;
          }
        ).requiredLength
      }`;
    }

    if (error.hasOwnProperty('maxlength')) {
      return `The length must be less than or equal to ${
        (error['maxlength'] as { requiredLength: number }).requiredLength
      }`;
    }

    if (error.hasOwnProperty('min')) {
      console.log(error);
      return `The value must be greater than or equal to ${
        (
          error['min'] as {
            min: number;
          }
        ).min
      }`;
    }

    if (error.hasOwnProperty('max')) {
      console.log(error);
      return `The value must be less than or equal to ${
        (
          error['max'] as {
            max: number;
          }
        ).max
      }`;
    }

    if (error.hasOwnProperty('existingName')) {
      return 'This is already taken by another entity';
    }

    if (error.hasOwnProperty('whitespace')) {
      return 'This field should not contain whitespace';
    }

    throw Error(`Form control error "${Object.keys(error)[0]}" is not handled`);
  }
}
